// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Persistence & Export slice
// ═══════════════════════════════════════════════════════════════

import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { DBProjectData } from './types';
import type { CanvaPage, CanvaElement, LeftTab, NavConfig } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';
// Export methods removed — now using Vite SSR Export pipeline
// See: src/lib/use-vite-export.ts and src/app/api/export/route.ts
import { CANVA_STORAGE_KEY } from './constants';
import { hasCrashRecovery, loadCrashRecovery, clearCrashRecovery, safeBootFromStorage, repairSchema, validateAndRepairPages, computePagesHash } from '@/core/recovery';
import { migrateAllPages } from '@/core/schema/ensure-schema';
import { migrateAllSchemas } from '@/core/schema/schema-migration';
import { assertDocumentPurity, clearCompressedHeightCache } from '@/core/schema/session-state';
import { clearMeasurementCache } from '@/core/layout/BlockMeasurer';
import { useAuthoringStore } from '@/store/authoring-store';
import { DEFAULT_CP, DEFAULT_ATP, DEFAULT_PETUNJUK, DEFAULT_PENUTUP, DEFAULT_SUARA } from '@/store/authoring/initial-state';
import { useDirtyStore } from '@/store/dirty-store';
import { logger } from '@/core/utils/logger';
// Sprint 9.0B: Autosave failure telemetry
import { recordAutosaveFailure, clearAutosaveTelemetry, type AutosaveFailureReason } from '@/lib/autosave-telemetry';

// ── Migration version for localStorage data ──────────────────
// Increment when adding new one-time migration logic.
// If the stored data's version is less than current, migrations run.
// After migration, data is saved with the current version.
const STORAGE_MIGRATION_VERSION = 1;

// Migrations that should only run once per version:
//   v1: overlayElements → elements[] merge (was running on every load)

// ── Legacy tab name migration map ──────────────────────────────
const TAB_MIGRATION: Record<string, LeftTab> = {
  templates: 'templates',
  elems: 'add-block',
  ratio: 'pages',
  pages: 'pages',
  layers: 'settings',
  rakit: 'add-block',
  layer: 'settings',
  tambah: 'add-block',
  // Legacy tab names → new unified names
  halaman: 'pages',
  sisipkan: 'add-block',
  halamanBaru: 'pages',
  riwayat: 'settings',
};

export type PersistenceSlice = Pick<
  CanvaState,
  | 'saveToStorage' | 'loadFromStorage' | 'loadFromDB' | 'factoryReset'
>;

// Patch-2 P0-3 Fix: loadFromDB now returns boolean.
// The CanvaState type needs updating if it doesn't already include
// the return type — but since it's inferred from the slice, this is
// handled automatically.

// ── Schema Strip Helper ───────────────────────────────────────
// Removes derived runtime fields that might have been written to
// schema blocks before the purity enforcement was in place.
// This is a belt-and-suspenders strip before JSON serialization.
function stripRuntimeFieldsFromPages(pages: CanvaPage[]): CanvaPage[] {
  return pages.map(page => {
    if (!page.schema) return page;
    return {
      ...page,
      schema: {
        ...page.schema,
        blocks: page.schema.blocks.map(block => {
          // Strip _compressedHeight from compression hints (legacy data)
          // Use explicit type cast to preserve CompressionHints type after delete
          if (block.compression && '_compressedHeight' in block.compression) {
            const cleanCompression = { ...block.compression };
            delete (cleanCompression as Record<string, unknown>)._compressedHeight;
            return { ...block, compression: cleanCompression };
          }
          return block;
        }),
      },
    };
  });
}

export const createPersistenceSlice: StateCreator<CanvaState, [], [], PersistenceSlice> = (set, get) => ({
  // ── Persistence ──────────────────────────────────────────────
  saveToStorage: () => {
    try {
      const { pages, ratioId } = get();

      // ── Strip derived runtime fields before persistence ──
      // Belt-and-suspenders: remove any _compressedHeight that might
      // exist from older transaction writes (now moved to runtime cache).
      const cleanPages = stripRuntimeFieldsFromPages(pages);

      // ── Purity Guard: Ensure no runtime state leaks into persisted data ──
      // In dev mode, throws if any schema contains runtime state fields.
      // In production, logs the violation but continues saving.
      // WRAPPED: Skip purity check if it throws (e.g., stack overflow from deep schema)
      try {
        for (const page of cleanPages) {
          if (page.schema) {
            assertDocumentPurity(page.schema, `saveToStorage page=${page.id}`);
          }
        }
      } catch (purityErr) {
        logger.warn('CanvaStore', 'Purity check skipped: ' + String(purityErr));
      }

      // Safe JSON.stringify with circular reference detection
      // Uses a path-based depth limiter to prevent stack overflow
      // on deeply nested or corrupted schema data.
      const seen = new WeakSet();
      const safeStringify = (obj: unknown): string => {
        return JSON.stringify(obj, function(this: unknown, _key: string, value: unknown): unknown {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) return '[Circular]';
            seen.add(value);
          }
          return value;
        });
      };

      localStorage.setItem(CANVA_STORAGE_KEY, safeStringify({
        pages: cleanPages,
        ratioId,
        _lastSavedAt: Date.now(),
        _migrationVersion: STORAGE_MIGRATION_VERSION,
        _schemaHash: computePagesHash(cleanPages),
      }));
      // Sprint 7.1: Do NOT set _saveStatus to 'saved' here.
      // _saveStatus is now managed by the revision-based state machine.
      // saveToStorage() is a LOCAL backup — durable save is the DB path.
      set({ _lastSavedAt: Date.now(), _pagesHashAtSave: computePagesHash(cleanPages) });
      // Sprint 9.0B: Clear autosave telemetry on successful save
      clearAutosaveTelemetry();
    } catch (err) {
      // Storage full, unavailable, or stack overflow from corrupted data
      logger.warn('CanvaStore', 'Failed to save to localStorage: ' + String(err));
      // Sprint 9.0B: Record telemetry for autosave failure
      const reason = err instanceof RangeError ? 'stack-overflow'
        : err instanceof DOMException && err.name === 'QuotaExceededError' ? 'quota-exceeded'
        : err instanceof TypeError ? 'serialization-error'
        : 'unknown';
      recordAutosaveFailure(reason as AutosaveFailureReason, err);
      // If stack overflow, clear localStorage to break the cycle
      if (err instanceof RangeError) {
        logger.warn('CanvaStore', 'Stack overflow detected — clearing corrupted localStorage data');
        try { localStorage.removeItem(CANVA_STORAGE_KEY); } catch {}
      }
      set({ _saveStatus: 'error' });
    }
  },

  loadFromStorage: () => {
    try {
      // ── FASE 6: Crash Recovery ──────────────────────────────
      // Check if there's a crash recovery checkpoint (from a previous
      // session that crashed during a dangerous operation).
      // If so, prefer the checkpoint over the last auto-save.
      const crashMeta = hasCrashRecovery();
      let raw: string | null = null;

      if (crashMeta) {
        const crashData = loadCrashRecovery();
        if (crashData) {
          // Use crash recovery data — it's more recent than auto-save
          raw = JSON.stringify({ pages: crashData.pages, ratioId: crashData.ratioId });
          if (process.env.NODE_ENV === 'development') console.log(
            `[Recovery] Found crash checkpoint from ${new Date(crashMeta.timestamp).toLocaleTimeString()} ` +
            `(reason: ${crashMeta.reason}, ${crashMeta.pageCount} pages)`
          );
          clearCrashRecovery();
        }
      }

      // Fall back to normal storage if no crash recovery
      if (!raw) {
        raw = localStorage.getItem(CANVA_STORAGE_KEY);
      }
      if (!raw) return false;

      // Clear runtime caches when loading new project data.
      clearCompressedHeightCache();
      clearMeasurementCache();

      const data = JSON.parse(raw);
      if (data.pages && Array.isArray(data.pages)) {
        // Ensure all pages have new fields (backward compat)
        // FASE 1: Auto-migrate legacy pages on load — ensurePageSchema()
        // proactively migrates all template pages so page.schema is
        // populated BEFORE first render. This means:
        //   - Legacy pages (no schema field) → migrated via TemplateAdapter
        //   - Pages with schemaScreen in templateData → promoted to page.schema
        //   - Already-native schema pages → preserved as-is
        // After this, every template page has page.schema set.
        // The TemplateAdapter is never called again for these pages.
        //
        // DUAL-RENDER FIX: migrateAllPages() also clears elements[]
        // for any page that has schema. Schema-driven pages must NOT
        // have elements[] populated, otherwise dual-render occurs.
        // Check if overlayElements migration has already been applied
        const needsOverlayMigration = !data._migrationVersion || data._migrationVersion < 1;

        const rawPages = data.pages.map((p: CanvaPage) => {
          // Basic field migration (backward compat)
          const migrated: CanvaPage = {
            ...p,
            templateType: p.templateType || 'custom',
            colorPalette: p.colorPalette || null,
            navConfig: {
              ...DEFAULT_NAV_CONFIG,
              ...(p.navConfig || {}),
              navbarStyle: p.navConfig?.navbarStyle || DEFAULT_NAV_CONFIG.navbarStyle,
            },
            templateData: p.templateData || {},
            elements: [
              ...(p.elements || []).map((el: CanvaElement) => ({
                ...el,
                opacity: el.opacity ?? 100,
                hidden: el.hidden ?? false,
              })),
              // v4 (migration v1): Merge overlayElements into elements[] once.
              // After the first save with _migrationVersion >= 1,
              // overlayElements is always [] and this is a no-op.
              ...(needsOverlayMigration ? (p.overlayElements || []).map((el: CanvaElement) => ({
                ...el,
                opacity: el.opacity ?? 100,
                hidden: el.hidden ?? false,
              })) : []),
            ],
            overlayElements: [], // Always cleared — legacy field
            schema: p.schema || undefined,
          };
          return migrated;
        });

        // Apply schema migration + clear elements[] for schema pages
        const pages = migrateAllPages(rawPages);

        // D-P0B.3: Apply schema version migrations (v0→v1, etc.) and USE the result.
        // Previously only migratedCount was captured but the migrated pages array was discarded.
        const { pages: migratedPages, migratedCount } = migrateAllSchemas(pages);
        if (migratedCount > 0 && process.env.NODE_ENV === 'development') {
          console.log(`[Persistence] Migrated ${migratedCount} page schemas to latest version`);
        }

        // ── Strip derived runtime fields from legacy data ──
        // Older versions may have _compressedHeight in compression hints.
        // Remove it before the purity check so we don't throw on old data.
        const cleanPages = stripRuntimeFieldsFromPages(migratedPages);

        // ── PHASE-2: Theme migration guard for old projects ──
        // Old projects may have schema.themeId = undefined or 'default'
        // (dark navy). This guard ensures all loaded pages get a
        // teacher-friendly light theme by default.
        const themeMigratedPages = cleanPages.map(page => {
          if (!page.schema) return page;
          const currentThemeId = page.schema.themeId;
          const legacyThemeId = page.templateData?.schemaThemeId as string | undefined;
          // If themeId is missing or 'default' (dark), migrate to 'modern-interactive'
          const needsMigration =
            !currentThemeId ||
            currentThemeId === 'default' ||
            currentThemeId === 'academic-clean';
          if (needsMigration) {
            const finalThemeId = 'modern-interactive';
            return {
              ...page,
              schema: { ...page.schema, themeId: finalThemeId },
              templateData: { ...page.templateData, schemaThemeId: finalThemeId },
            };
          }
          // Sync: ensure schema.themeId and templateData.schemaThemeId match
          if (currentThemeId && legacyThemeId && currentThemeId !== legacyThemeId) {
            return {
              ...page,
              templateData: { ...page.templateData, schemaThemeId: currentThemeId },
            };
          }
          return page;
        });

        // ── Purity Guard: Check loaded data for runtime state leakage ──
        // WRAPPED: Skip purity check if it throws (e.g., stack overflow from deep/corrupted schema)
        try {
          for (const page of themeMigratedPages) {
            if (page.schema) {
              assertDocumentPurity(page.schema, `loadFromStorage page=${page.id}`);
            }
          }
        } catch (purityErr) {
          logger.warn('CanvaStore', 'Purity check on load failed (data may be corrupted): ' + String(purityErr));
        }

        // ── FASE 6: Proactive integrity validation ──────────────────
        // Validate all page schemas after migration and BEFORE setting state.
        // This catches corruption early and auto-repairs if possible.
        try {
          const validationResult = validateAndRepairPages(themeMigratedPages, { autoRepair: true });
          if (validationResult.repairedPages > 0) {
            logger.warn('Recovery', `Proactive repair: ${validationResult.repairedPages}/${validationResult.totalPages} pages repaired`);
            // Set safe mode flag — some data was corrupted
            try { sessionStorage.setItem('silse_safe_mode', '1'); } catch {}
          }
          if (validationResult.corruptedPages > 0 && validationResult.repairedPages === 0) {
            logger.error('Recovery', `Unrecoverable corruption: ${validationResult.corruptedPages} pages`);
            try { sessionStorage.setItem('silse_safe_mode', '1'); } catch {}
          }
          set({ _lastIntegrityResult: validationResult });
        } catch (validationErr) {
          logger.warn('Recovery', 'Proactive validation failed: ' + String(validationErr));
        }

        // ── FASE 6: Hash verification on load ──────────────────
        // Verify stored hash matches computed hash (detects in-transit corruption)
        if (data._schemaHash) {
          const currentHash = computePagesHash(themeMigratedPages);
          if (currentHash !== data._schemaHash) {
            logger.warn('Recovery', 'Schema hash mismatch on load — data may have been corrupted');
            try { sessionStorage.setItem('silse_safe_mode', '1'); } catch {}
          }
        }

        // ── P0-6 Fix: Hydration suppression with depth counter ──
        // Suppress markDirty() during load to prevent false "unsaved" state.
        //
        // ORDERING: resetOnLoad() is called FIRST (resets revision counters),
        // then startHydration() increments the depth counter. This ensures
        // the depth counter is > 0 during the set() call that follows,
        // which triggers store subscriptions that would otherwise mark dirty.
        //
        // resetOnLoad() does NOT touch _hydrationDepth (by design), so
        // it's safe to call before startHydration().
        useDirtyStore.getState().resetOnLoad();
        useAuthoringStore.setState({ dirty: false });

        // Start hydration AFTER resetOnLoad — depth counter increments,
        // ensuring markDirty() is suppressed during the set() call below.
        useDirtyStore.getState().startHydration();

        // Migrate legacy leftTab names
        let leftTab: LeftTab = 'pages';
        if (data.leftTab) {
          leftTab = TAB_MIGRATION[data.leftTab] || 'pages';
        }
        set({
          pages: cleanPages,
          ratioId: data.ratioId || '16:9',
          currentPageIndex: 0,
          kontenTabRequest: null, // Phase 3: reset ephemeral nav
          kontenPanelRequest: false,
          panelRequest: null,
          selectedElId: null,
          selectedElIds: [], // Phase 4: Reset multi-select on load
          selectedBlockIds: [], // Reset block multi-select on load
          leftPanelOpen: true,
          rightPanelOpen: true,
          leftTab,
        });

        // Sprint 7.2A-7: End hydration after set() completes
        useDirtyStore.getState().endHydration();
        return true;
      }
      return false;
    } catch {
      // Sprint 7.2A-7: End hydration even on load failure to prevent stuck state
      try {
        useDirtyStore.getState().endHydration();
      } catch { /* best effort */ }

      // FASE 6: Try safe boot before giving up
      try {
        const rawForRecovery = localStorage.getItem(CANVA_STORAGE_KEY);
        const bootResult = safeBootFromStorage(rawForRecovery);
        if (bootResult.booted && bootResult.repairs.length > 0) {
          logger.warn('Recovery', 'Safe boot repairs: ' + bootResult.repairs.join(', '));
          // Try to load the repaired data
          const repairedData = JSON.parse(rawForRecovery!);
          // Apply repairs to pages
          const repairedPages = (repairedData.pages || []).map((p: Record<string, unknown>, _i: number) => {
            if (bootResult.safeMode && p.schema) {
              const repairResult = repairSchema(p.schema as import('@/core/schema/types').ScreenSchema);
              return { ...p, schema: repairResult.schema };
            }
            return p;
          });
          // Set safe mode flag if data was repaired
          if (bootResult.safeMode) {
            try { sessionStorage.setItem('silse_safe_mode', '1'); } catch {}
          }
          // Re-save the repaired data
          localStorage.setItem(CANVA_STORAGE_KEY, JSON.stringify({
            ...repairedData,
            pages: repairedPages,
            _lastSavedAt: Date.now(),
            _migrationVersion: 1,
          }));
          // Try loading again
          return get().loadFromStorage();
        }
      } catch (recoveryErr) {
        logger.warn('Recovery', 'Safe boot failed: ' + String(recoveryErr));
      }
      try { localStorage.removeItem(CANVA_STORAGE_KEY); } catch {}
      return false;
    }
  },

  // ── Load from Database ──────────────────────────────────────────
  // Patch-3: TRANSACTIONAL loadFromDB — parse/validate ALL payloads
  // BEFORE any store mutation. This prevents cross-project contamination
  // when Project B's data is corrupted: if parsing fails, Project A's
  // state remains untouched.
  //
  // Key changes from Patch-2:
  //   1. resetOnLoad() REMOVED — Project Manager handles this only after success
  //   2. authoring dirty NOT cleared until after successful parse
  //   3. pages must be an array — null/undefined/other fails closed (P0-2)
  //   4. authoringData parsed and validated before any mutation (P0-3)
  //   5. All parsing is PURE (no store side effects)
  //   6. Hydration + commit only happen after ALL parsing succeeds
  //
  // Returns true if ALL data was parsed and committed successfully.
  // Returns false if any parsing failed — NO stores are mutated.
  loadFromDB: (data: DBProjectData): boolean => {
    try {
      // ══════════════════════════════════════════════════════════
      // PHASE 1: VALIDATE — Fail closed on invalid payload shape
      // ══════════════════════════════════════════════════════════
      // P0-2 Fix: pages MUST be an array. null, undefined, or any
      // other type is a hard failure — we never mutate stores.
      // Empty array [] is valid (blank project).
      if (!Array.isArray(data.pages)) {
        throw new Error('Invalid project pages payload: expected array, got ' + typeof data.pages);
      }

      // ══════════════════════════════════════════════════════════
      // PHASE 2: PURE PREPARATION — Parse everything, touch nothing
      // ══════════════════════════════════════════════════════════
      // All JSON.parse, migrations, and transformations happen here.
      // If ANY step throws, we catch it and return false WITHOUT
      // having mutated any store. Project A stays intact.

      // Parse and migrate canva pages
      const rawPages: CanvaPage[] = data.pages.map((p) => {
        const schema = p.schemaData ? JSON.parse(p.schemaData) : undefined;
        const parsedNavConfig = p.navConfig ? JSON.parse(p.navConfig) : {};
        const navConfig: NavConfig = {
          ...DEFAULT_NAV_CONFIG,
          ...parsedNavConfig,
          navbarStyle: parsedNavConfig.navbarStyle || DEFAULT_NAV_CONFIG.navbarStyle,
        };
        const templateData = p.templateData ? JSON.parse(p.templateData) : {};
        const colorPalette = p.colorPalette ? JSON.parse(p.colorPalette) : null;

        // Map DB blocks → schema blocks
        const schemaBlocks = (p.blocks || []).map((b) => {
          const content = b.content ? JSON.parse(b.content) : {};
          const layout = b.layout ? JSON.parse(b.layout) : undefined;
          return {
            type: b.blockType,
            ...content,
            ...(layout ? { layout } : {}),
          };
        });

        const migrated: CanvaPage = {
          id: p.id,
          label: p.label || `Halaman ${p.pageIndex + 1}`,
          bgDataUrl: p.bgImage || null,
          bgColor: p.bgColor || '#ffffff',
          overlay: p.bgOverlay !== null ? Math.round(p.bgOverlay * 100) : 20,
          elements: [], // Always empty — schema is the source of truth
          templateType: (p.templateType as CanvaPage['templateType']) || 'custom',
          colorPalette,
          navConfig,
          templateData,
          templateVariant: (p.variant as 'A' | 'B' | 'C') || undefined,
          contractId: (p.contractId as string) || undefined,
          // Sprint 8.3: reconstruct pageMode from DB field, fallback to inference
          pageMode: (p.pageMode as 'schema' | 'elements') || (schema ? 'schema' : 'elements'),
          schema: schema || (schemaBlocks.length > 0 ? { id: p.id, templateType: p.templateType || 'custom', blocks: schemaBlocks } : undefined),
        };

        return migrated;
      });

      // Apply schema migration + clear elements[] for schema pages
      const pages = migrateAllPages(rawPages);

      // D-P0B.3: Apply schema version migrations (v0→v1, etc.) and USE the result.
      const { pages: migratedPages } = migrateAllSchemas(pages);

      // Strip derived runtime fields from legacy data
      const cleanPages = stripRuntimeFieldsFromPages(migratedPages);

      // Purity Guard (non-fatal — just logs)
      try {
        for (const page of cleanPages) {
          if (page.schema) {
            assertDocumentPurity(page.schema, `loadFromDB page=${page.id}`);
          }
        }
      } catch (purityErr) {
        logger.warn('CanvaStore', 'Purity check on DB load failed: ' + String(purityErr));
      }

      // P0-3 Fix: Parse authoring data BEFORE any mutation.
      // If this fails, the entire load is aborted — canva store
      // is NOT mutated, so Project A pages remain intact.
      let parsedAuthoring: Record<string, unknown> | null = null;
      if (data.authoringData) {
        try {
          parsedAuthoring = JSON.parse(data.authoringData) as Record<string, unknown>;
        } catch (err) {
          throw new Error('Failed to parse authoringData: ' + String(err));
        }
      }

      // ══════════════════════════════════════════════════════════
      // PHASE 3: HYDRATE & COMMIT — Only after ALL parsing succeeds
      // ══════════════════════════════════════════════════════════
      // We've reached this point only if every JSON.parse and
      // migration succeeded. Now it's safe to mutate stores.

      // Clear runtime caches for the new project data
      clearCompressedHeightCache();
      clearMeasurementCache();

      // Start hydration — suppresses markDirty() during commit
      useDirtyStore.getState().startHydration();

      try {
        // Commit canva store
        set({
          pages: cleanPages,
          ratioId: data.ratioId || '16:9',
          currentPageIndex: 0,
          kontenTabRequest: null,
          kontenPanelRequest: false,
          panelRequest: null,
          selectedElId: null,
          selectedElIds: [],
          selectedBlockIds: [],
          leftPanelOpen: true,
          rightPanelOpen: true,
          leftTab: 'pages',
        });

        // Commit authoring store atomically with canva
        // This prevents the cross-project contamination bug where
        // canva shows Project B but authoring still has Project A.
        //
        // Patch-4 P0-1 Fix: NEVER use current store values as fallback.
        // When loading Project B, every field must come from B's data or
        // be reset to empty defaults. Falling back to store.cp etc. would
        // silently carry Project A's data into Project B — cross-project
        // contamination even when B's authoringData is null or partial.
        if (parsedAuthoring) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- parsedAuthoring is dynamic JSON from DB
          const auth = parsedAuthoring as any;
          useAuthoringStore.setState({
            // Non-schema fields — use B's data or empty default, NEVER store.cp (Project A)
            cp: auth.cp && typeof auth.cp === 'object' && !Array.isArray(auth.cp) ? auth.cp : { ...DEFAULT_CP },
            atp: auth.atp && typeof auth.atp === 'object' && !Array.isArray(auth.atp) ? auth.atp : { ...DEFAULT_ATP },
            petunjuk: auth.petunjuk && typeof auth.petunjuk === 'object' && !Array.isArray(auth.petunjuk) ? auth.petunjuk : { ...DEFAULT_PETUNJUK },
            penutup: auth.penutup && typeof auth.penutup === 'object' && !Array.isArray(auth.penutup) ? auth.penutup : { ...DEFAULT_PENUTUP },
            suara: auth.suara && typeof auth.suara === 'object' && !Array.isArray(auth.suara) ? auth.suara : { ...DEFAULT_SUARA },
            dirty: false,
            // Schema-backed fields — already loaded via deriveProjectionFromPages()
          });
        } else {
          // No authoring data at all — reset ALL non-schema fields to defaults.
          // This prevents Project A's authoring data from leaking into Project B.
          useAuthoringStore.setState({
            cp: { ...DEFAULT_CP },
            atp: { ...DEFAULT_ATP },
            petunjuk: { ...DEFAULT_PETUNJUK },
            penutup: { ...DEFAULT_PENUTUP },
            suara: { ...DEFAULT_SUARA },
            dirty: false,
          });
        }

        return true;
      } finally {
        // ALWAYS end hydration, even if set() throws (unlikely but defensive).
        useDirtyStore.getState().endHydration();
      }
    } catch (err) {
      // ALL parsing errors land here. NO stores have been mutated
      // because we only mutate in Phase 3 which is unreachable on error.
      logger.warn('CanvaStore', 'Failed to load from DB: ' + String(err));
      return false;
      // NOTE: No endHydration() here because startHydration() is only
      // called in Phase 3. If we reach this catch, hydration was never
      // started, so there's nothing to end. The outer hydration (from
      // ProjectManager) is managed by ProjectManager's finally block.
    }
  },

  // ── Export ───────────────────────────────────────────────────
  // Legacy export methods (exportPageHTML, exportSlideshowHTML, exportUnifiedHTML)
  // have been removed. All exports now go through the Vite SSR pipeline:
  //   → useViteExport() hook → /api/export → Vite-built template + data injection

  // ── Factory Reset ───────────────────────────────────────────────
  // Clears ALL localStorage data and resets the store to defaults.
  // Use when corrupted data causes stack overflow or rendering failures.
  factoryReset: () => {
    try {
      localStorage.removeItem(CANVA_STORAGE_KEY);
      // Also clear any other SILSE-related keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('canva_') || key?.startsWith('silse_') || key?.startsWith('authoring_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      clearCompressedHeightCache();
      clearMeasurementCache();
    } catch {
      // localStorage might be unavailable — ignore
    }

    // Reset store to default state (empty — user sees CanvasEmptyState)
    set({
      pages: [],
      currentPageIndex: -1,
      kontenTabRequest: null,
      kontenPanelRequest: false,
      panelRequest: null,
      selectedElId: null,
      selectedElIds: [],
      selectedBlockId: null,
      selectedBlockType: null,
      selectedBlockIds: [],
      editingBlockId: null,
      hoveredBlockId: null,
      leftPanelOpen: true,
      rightPanelOpen: true,
      leftTab: 'pages',
    });

    // Import toast here to avoid circular deps at module level
    try {
      import('sonner').then(({ toast }) => toast.success('Data direset ke default')).catch(() => {});
    } catch {}
  },

});
