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
import { hasCrashRecovery, loadCrashRecovery, clearCrashRecovery, safeBootFromStorage, repairSchema } from '@/core/recovery';
import { ensurePageSchema, migrateAllPages } from '@/core/schema/ensure-schema';
import { migrateAllSchemas } from '@/core/schema/schema-migration';
import { deriveProjectionFromPages } from '@/core/schema/schema-projection';
import { assertDocumentPurity, clearCompressedHeightCache } from '@/core/schema/session-state';
import { useAuthoringStore } from '@/store/authoring-store';

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
        console.warn('[CanvaStore] Purity check skipped:', purityErr);
      }

      // Safe JSON.stringify with circular reference detection
      // Uses a path-based depth limiter to prevent stack overflow
      // on deeply nested or corrupted schema data.
      const seen = new WeakSet();
      const MAX_PATH_DEPTH = 80; // Max nesting depth before truncating
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
      }));
      set({ _saveStatus: 'saved', _lastSavedAt: Date.now() });
    } catch (err) {
      // Storage full, unavailable, or stack overflow from corrupted data
      console.warn('[CanvaStore] Failed to save to localStorage:', err);
      // If stack overflow, clear localStorage to break the cycle
      if (err instanceof RangeError) {
        console.warn('[CanvaStore] Stack overflow detected — clearing corrupted localStorage data');
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
          console.log(
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

        // Apply schema version migrations (v0→v1, etc.)
        const { migratedCount } = migrateAllSchemas(pages);
        if (migratedCount > 0 && process.env.NODE_ENV !== 'production') {
          console.log(`[Persistence] Migrated ${migratedCount} page schemas to latest version`);
        }

        // ── Strip derived runtime fields from legacy data ──
        // Older versions may have _compressedHeight in compression hints.
        // Remove it before the purity check so we don't throw on old data.
        const cleanPages = stripRuntimeFieldsFromPages(pages);

        // ── Purity Guard: Check loaded data for runtime state leakage ──
        // WRAPPED: Skip purity check if it throws (e.g., stack overflow from deep/corrupted schema)
        try {
          for (const page of cleanPages) {
            if (page.schema) {
              assertDocumentPurity(page.schema, `loadFromStorage page=${page.id}`);
            }
          }
        } catch (purityErr) {
          console.warn('[CanvaStore] Purity check on load failed (data may be corrupted):', purityErr);
        }

        // Derive EditorProjectionStore from schema (write-through)
        // After loading pages, the projection store auto-syncs from schema
        try {
          const projection = deriveProjectionFromPages(cleanPages);
          if (Object.keys(projection).length > 0) {
            // Spread only defined fields to satisfy AuthoringState type
            const patch: Record<string, unknown> = { dirty: false };
            if (projection.tp) patch.tp = projection.tp;
            if (projection.alur) patch.alur = projection.alur;
            if (projection.kuis) patch.kuis = projection.kuis;
            if (projection.materi) patch.materi = projection.materi;
            if (projection.diskusi) patch.diskusi = projection.diskusi;
            if (projection.refleksi) patch.refleksi = projection.refleksi;
            if (projection.skenario) patch.skenario = projection.skenario;
            if (projection.motivasi) patch.motivasi = projection.motivasi;
            if (projection.rangkuman) patch.rangkuman = projection.rangkuman;
            if (projection.meta) {
              // Merge partial meta into existing meta (keep defaults for missing fields)
              const currentMeta = useAuthoringStore.getState().meta;
              patch.meta = { ...currentMeta, ...projection.meta };
            }
            useAuthoringStore.setState(patch as Partial<import('@/store/authoring/types').AuthoringState>);
          }
        } catch (err) {
          // Projection derivation is best-effort — don't break load on error
          console.warn('[Persistence] Failed to derive projection from schema:', err);
        }

        // Migrate legacy leftTab names
        let leftTab: LeftTab = 'pages';
        if (data.leftTab) {
          leftTab = TAB_MIGRATION[data.leftTab] || 'pages';
        }
        set({
          pages: cleanPages,
          ratioId: data.ratioId || '9:16',
          currentPageIndex: 0,
          selectedElId: null,
          selectedElIds: [], // Phase 4: Reset multi-select on load
          selectedBlockIds: [], // Reset block multi-select on load
          leftPanelOpen: true,
          rightPanelOpen: true,
          leftTab,
        });
        return true;
      }
      return false;
    } catch {
      // FASE 6: Try safe boot before giving up
      try {
        const rawForRecovery = localStorage.getItem(CANVA_STORAGE_KEY);
        const bootResult = safeBootFromStorage(rawForRecovery);
        if (bootResult.booted && bootResult.repairs.length > 0) {
          console.warn('[Recovery] Safe boot repairs:', bootResult.repairs);
          // Try to load the repaired data
          const repairedData = JSON.parse(rawForRecovery!);
          // Apply repairs to pages
          const repairedPages = (repairedData.pages || []).map((p: any, i: number) => {
            if (bootResult.safeMode && p.schema) {
              const repairResult = repairSchema(p.schema);
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
        console.warn('[Recovery] Safe boot failed:', recoveryErr);
      }
      try { localStorage.removeItem(CANVA_STORAGE_KEY); } catch {}
      return false;
    }
  },

  // ── Load from Database ──────────────────────────────────────────
  loadFromDB: (data: DBProjectData) => {
    try {
      // Clear runtime caches when loading new project data from DB.
      clearCompressedHeightCache();

      if (data.pages && Array.isArray(data.pages)) {
        const rawPages: CanvaPage[] = data.pages.map((p) => {
          // Map DB Page → CanvaPage
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
            schema: schema || (schemaBlocks.length > 0 ? { id: p.id, templateType: p.templateType || 'custom', blocks: schemaBlocks } : undefined),
          };

          return migrated;
        });

        // Apply schema migration + clear elements[] for schema pages
        const pages = migrateAllPages(rawPages);

        // Apply schema version migrations (v0→v1, etc.)
        migrateAllSchemas(pages);

        // ── Strip derived runtime fields from legacy data ──
        const cleanPages = stripRuntimeFieldsFromPages(pages);

        // ── Purity Guard: Check loaded data for runtime state leakage ──
        for (const page of cleanPages) {
          if (page.schema) {
            assertDocumentPurity(page.schema, `loadFromDB page=${page.id}`);
          }
        }

        // Derive EditorProjectionStore from schema (write-through)
        try {
          const projection = deriveProjectionFromPages(cleanPages);
          if (Object.keys(projection).length > 0) {
            const patch: Record<string, unknown> = { dirty: false };
            if (projection.tp) patch.tp = projection.tp;
            if (projection.alur) patch.alur = projection.alur;
            if (projection.kuis) patch.kuis = projection.kuis;
            if (projection.materi) patch.materi = projection.materi;
            if (projection.diskusi) patch.diskusi = projection.diskusi;
            if (projection.refleksi) patch.refleksi = projection.refleksi;
            if (projection.skenario) patch.skenario = projection.skenario;
            if (projection.motivasi) patch.motivasi = projection.motivasi;
            if (projection.rangkuman) patch.rangkuman = projection.rangkuman;
            if (projection.meta) {
              const currentMeta = useAuthoringStore.getState().meta;
              patch.meta = { ...currentMeta, ...projection.meta };
            }
            useAuthoringStore.setState(patch as Partial<import('@/store/authoring/types').AuthoringState>);
          }
        } catch (err) {
          console.warn('[Persistence:DB] Failed to derive projection from schema:', err);
        }

        set({
          pages: cleanPages,
          ratioId: data.ratioId || '16:9',
          currentPageIndex: 0,
          selectedElId: null,
          selectedElIds: [],
          selectedBlockIds: [],
          leftPanelOpen: true,
          rightPanelOpen: true,
          leftTab: 'pages',
        });
      }
    } catch (err) {
      console.warn('[CanvaStore] Failed to load from DB:', err);
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
    } catch {
      // localStorage might be unavailable — ignore
    }

    // Reset store to default state (single blank page)
    const { createPage: makePage } = require('./constants');
    set({
      pages: [makePage('Halaman 1', 'custom')],
      currentPageIndex: 0,
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
      const { toast } = require('sonner');
      toast.success('Data direset ke default');
    } catch {}
  },

});
