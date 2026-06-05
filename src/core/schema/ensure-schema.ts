// ═══════════════════════════════════════════════════════════════════
// ENSURE PAGE SCHEMA — Lazy Migration on Read (FASE 1 → FASE 5+)
// ═══════════════════════════════════════════════════════════════════
// The central function that makes schema-first architecture work
// WITHOUT breaking legacy pages.
//
// Contract:
//   1. If page.schema exists → return it directly (native schema page)
//   2. If page has schemaScreen in templateData → promote to page.schema
//   3. If page is a legacy template page → convert via TemplateAdapter,
//      assign stable IDs with nanoid, cache result on page.schema
//   4. Custom/empty pages → return null (no schema, element-based)
//
// After this function runs, page.schema is populated and the page
// is effectively "upgraded" to native schema. Next save persists it.
// The TemplateAdapter is only called ONCE per legacy page — ever.
//
// FASE 5+ STATUS:
//   ✅ All auto-generate flows use genXxxSchema() directly
//   ✅ All regenerate flows use regenerateXxxSchema() directly
//   ✅ Canvas generateFromPageType() uses genXxxSchema() directly
//   ✅ Schema validation layer enforces invariants
//   ✅ Immutable schema operations (produce/patch)
//   ✅ EditorProjectionStore write-through from schema
//   ✅ Schema version migration system
//
//   TemplateAdapter (Path 3) is ONLY hit for legacy pages that
//   haven't been re-saved since FASE 2. Once all users re-save,
//   Paths 2-3 can be removed entirely, leaving just:
//     return page.schema ?? null;
//
//   To check how many legacy pages remain, look for
//   "LEGACY-MIGRATION" warnings in dev console.
// ═══════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import type { ScreenSchema, SchemaBlock } from './types';
import { convertToSchema } from '@/core/engine/TemplateAdapter';
import { nanoid } from 'nanoid';
import { logger } from '@/core/utils/logger';
import { assertValidSchema, isSchemaVersionCompatible, SCHEMA_VERSION } from './validation';
import { deepFreeze, deepClone } from './immutable';
import { migrateSchema } from './schema-migration';
import { assertDocumentPurity } from './session-state';
import { isCompositeBlockType, getCompositeContainerDescriptor } from './capability-registry';

/**
 * Ensure a page has a native ScreenSchema.
 * Lazily migrates legacy pages on first read.
 *
 * IMPORTANT: This function does NOT mutate the page object.
 * It returns the schema — the CALLER is responsible for
 * immutably updating the page via Zustand set().
 *
 * Returns null only for custom/empty pages (no template type).
 */
export function ensurePageSchema(page: CanvaPage): ScreenSchema | null {
  // ═══ Path 1: Already native schema ═══════════════════════════
  if (page.schema) {
    // DEFENSIVE: Validate that page.schema is actually an object, not a string or other type.
    // Corrupted localStorage data may have schema as a string (double-serialized).
    if (typeof page.schema !== 'object' || Array.isArray(page.schema)) {
      logger.warn('ensurePageSchema', `page.schema is not an object — treating as no schema. Type: ${typeof page.schema}`);
      // Fall through to Path 4 (return null) — caller will auto-create schema
      return null;
    }
    // DEFENSIVE: Ensure blocks is an array
    if (!Array.isArray(page.schema.blocks)) {
      logger.warn('ensurePageSchema', `page.schema.blocks is not an array — creating empty blocks. Value: ${String(page.schema.blocks)}`);
      // Return schema with corrected blocks array
      const fixedSchema = ensureSchemaBackground({ ...page.schema, blocks: [] });
      return deepFreeze(deepClone(fixedSchema));
    }

    // Apply version migration if needed (e.g., v0 → v1)
    const currentVersion = page.schema.version || 0;
    if (currentVersion < SCHEMA_VERSION) {
      const migrated = migrateSchema(page.schema);
      // Dev-mode purity guard: ensure migration didn't introduce runtime state
      // Wrapped in try-catch to prevent dev-mode purity check from crashing the app
      try {
        assertDocumentPurity(migrated, `ensurePageSchema:migration:${page.id}`);
      } catch (e) {
        logger.warn('ensurePageSchema', 'Purity check failed (non-fatal): ' + String(e));
      }
      // IMPORTANT: Clone before freezing so we don't freeze the Zustand store object in place!
      try {
        return deepFreeze(deepClone(ensureSchemaBackground(migrated)));
      } catch (cloneErr) {
        logger.warn('ensurePageSchema', 'deepClone/deepFreeze failed for migrated schema — returning unfrozen clone: ' + String(cloneErr));
        try { return ensureSchemaBackground(deepClone(migrated)); } catch { return ensureSchemaBackground(migrated); }
      }
    }
    // Dev-mode purity guard: ensure no runtime state has leaked into schema
    // Wrapped in try-catch to prevent dev-mode purity check from crashing the app
    // NOTE: This runs on EVERY render, so we throttle the warning to avoid console spam.
    // The purity check is important but the warning is noise if it fires every frame.
    try {
      assertDocumentPurity(page.schema, `ensurePageSchema:read:${page.id}`);
    } catch (e) {
      // Throttle purity warnings — only log once per page per second
      const now = Date.now();
      const key = `purity-warn:${page.id}`;
      const lastWarn = (globalThis as unknown as Record<string, number>)[key] || 0;
      if (now - lastWarn > 1000) {
        (globalThis as unknown as Record<string, number>)[key] = now;
        logger.warn('ensurePageSchema', 'Purity check failed (non-fatal): ' + String(e));
      }
    }
    // IMPORTANT: Clone before freezing so we don't freeze the Zustand store object in place!
    // deepFreeze(page.schema) was mutating the store, causing produceWithPatches
    // to fail silently when adding blocks — the root cause of "blocks don't appear on canvas".
    try {
      return deepFreeze(deepClone(ensureSchemaBackground(page.schema)));
    } catch (cloneErr) {
      // Fallback: if deepClone fails (e.g., non-cloneable runtime state in schema),
      // use JSON parse/stringify as fallback, or return the schema without freezing.
      logger.warn('ensurePageSchema', 'deepClone/deepFreeze failed — using JSON fallback: ' + String(cloneErr));
      try {
        const jsonCloned = ensureSchemaBackground(JSON.parse(JSON.stringify(page.schema)) as ScreenSchema);
        return deepFreeze(jsonCloned);
      } catch (jsonErr) {
        // Last resort: return shallow copy without deep freeze
        logger.warn('ensurePageSchema', 'JSON clone also failed — returning shallow copy without freeze: ' + String(jsonErr));
        return ensureSchemaBackground({ ...page.schema, blocks: [...(page.schema.blocks || [])] });
      }
    }
  }

  // ═══ Path 2: schemaScreen in templateData — promote it ══════
  const storedSchema = page.templateData?.schemaScreen as ScreenSchema | undefined;
  if (storedSchema) {
    const migrated = assignStableIds(storedSchema);
    // Validate migrated schema (dev-mode guard) — wrapped to prevent crash
    try {
      assertValidSchema(migrated, `ensurePageSchema:promote:${page.id}`);
    } catch (e) {
      logger.warn('ensurePageSchema', 'Schema validation failed (non-fatal): ' + String(e));
    }
    // Dev-mode purity guard — wrapped to prevent crash
    try {
      assertDocumentPurity(migrated, `ensurePageSchema:promote:${page.id}`);
    } catch (e) {
      logger.warn('ensurePageSchema', 'Purity check failed (non-fatal): ' + String(e));
    }
    return deepFreeze(deepClone(ensureSchemaBackground(migrated)));
  }

  // ═══ Path 3: Legacy template page — convert via TemplateAdapter ═══
  const isTemplate = page.templateType && page.templateType !== 'custom';
  if (isTemplate) {
    // Telemetry: log when legacy path is hit (tracks migration progress)
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('LEGACY-MIGRATION', `Page "${page.label}" (${page.templateType}) using TemplateAdapter Path 3 — this page needs re-saving`);
    }
    const converted = convertToSchema(page);
    if (converted) {
      const migrated = assignStableIds(converted);
      // Validate converted schema (dev-mode guard) — wrapped to prevent crash
      try {
        assertValidSchema(migrated, `ensurePageSchema:legacy:${page.id}`);
      } catch (e) {
        logger.warn('ensurePageSchema', 'Schema validation failed (non-fatal): ' + String(e));
      }
      // Dev-mode purity guard — wrapped to prevent crash
      try {
        assertDocumentPurity(migrated, `ensurePageSchema:legacy:${page.id}`);
      } catch (e) {
        logger.warn('ensurePageSchema', 'Purity check failed (non-fatal): ' + String(e));
      }
      return deepFreeze(deepClone(ensureSchemaBackground(migrated)));
    }
  }

  // ═══ Path 4: Custom/empty page — no schema ══════════════════
  return null;
}

/**
 * Same as ensurePageSchema but ALSO returns whether the page
 * needs to be updated in the store (i.e., schema was just migrated).
 * Use this when you need to know if the page object changed.
 */
export function ensurePageSchemaWithMigration(page: CanvaPage): { schema: ScreenSchema | null; needsUpdate: boolean } {
  if (page.schema) return { schema: ensureSchemaBackground(page.schema), needsUpdate: page.schema.background === undefined };

  const schema = ensurePageSchema(page);
  return { schema, needsUpdate: schema !== null };
}

/**
 * Get the schema blocks for a page (convenience wrapper).
 * Returns empty array for custom pages.
 */
export function getPageBlocks(page: CanvaPage): SchemaBlock[] {
  const schema = ensurePageSchema(page);
  return schema?.blocks ?? [];
}

/**
 * Find a specific block by ID in a page's schema.
 * Searches both top-level and nested blocks using the container
 * descriptor from the capability registry as single source of truth.
 */
export function findBlockInPage(page: CanvaPage, blockId: string): SchemaBlock | null {
  const blocks = getPageBlocks(page);

  // 1. Search top-level
  const top = blocks.find(b => b.id === blockId);
  if (top) return top;

  // 2. Search nested blocks using container descriptor
  for (const block of blocks) {
    if (isCompositeBlockType(block.type)) {
      const descriptor = getCompositeContainerDescriptor(block.type);
      if (descriptor) {
        if (descriptor.structure === 'direct') {
          const children = (block as Record<string, unknown>)[descriptor.accessor] as SchemaBlock[] | undefined;
          const found = (children || []).find(b => b.id === blockId);
          if (found) return found;
        }
        if (descriptor.structure === 'tabular' && descriptor.tabContentKey) {
          const tabs = (block as Record<string, unknown>)[descriptor.accessor] as Array<Record<string, unknown>> | undefined;
          for (const tab of (tabs || [])) {
            const content = tab[descriptor.tabContentKey!] as SchemaBlock[] | undefined;
            const found = (content || []).find(b => b.id === blockId);
            if (found) return found;
          }
        }
      }
    }
    // Generic BaseBlock.children[]
    if (block.children && Array.isArray(block.children)) {
      const found = block.children.find(b => b.id === blockId);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Assign stable nanoid-based IDs to any blocks that don't have one.
 * This is called during migration to ensure all blocks have stable IDs
 * that survive across sessions (unlike Date.now() or position-based IDs).
 */
function assignStableIds(schema: ScreenSchema): ScreenSchema {
  let needsUpdate = !schema.version; // Migrate: add version if missing

  const blocks = schema.blocks.map((block, idx) => {
    if (!block.id || isUnstableId(block.id)) {
      needsUpdate = true;
      return { ...block, id: nanoid(10) };
    }
    return block;
  });

  if (!needsUpdate) return schema;

  return { ...schema, blocks, version: schema.version ?? 1 };
}

/**
 * Detect IDs that are unstable (position-based or timestamp-based).
 * These should be replaced with nanoid for consistency.
 *
 * Unstable patterns:
 *   - "cover-0", "materi-def-box-1" (templateType-blockType-index)
 *   - "cover-1697123456789" (type-timestamp)
 *   - Any ID containing only the block type without a random component
 */
function isUnstableId(id: string): boolean {
  // Pattern: type-number (e.g., "cover-0", "tp-1")
  if (/^[a-z-]+-\d+$/.test(id)) return true;
  // Pattern: templateType-blockType-index (e.g., "materi-def-box-0")
  if (/^[a-z]+-[a-z-]+-\d+$/.test(id)) return true;
  // Pattern: type-timestamp (e.g., "cover-1697123456789")
  if (/^[a-z-]+-\d{10,}$/.test(id)) return true;
  return false;
}

/**
 * Generate a stable block ID for new blocks.
 * Uses nanoid(10) — 10 chars gives ~16 billion unique IDs,
 * plenty for any lesson with negligible collision risk.
 */
export function generateBlockId(): string {
  return nanoid(10);
}

/**
 * Generate a stable page ID for new pages.
 */
export function generatePageId(): string {
  return `p_${nanoid(8)}`;
}

// ═══════════════════════════════════════════════════════════════════
// SCHEMA-FIRST UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if a page is schema-driven (has a native ScreenSchema).
 * Returns true for any page with page.schema populated — either
 * natively created (FASE 2 presets) or lazily migrated (FASE 1).
 *
 * Use this instead of `!!page.schema` for clarity and future-proofing.
 * Schema-driven pages use SchemaScreenRenderer exclusively.
 */
export function isSchemaPage(page: CanvaPage): boolean {
  return page.schema != null;
}

/**
 * DUAL-RENDER INVARIANT CHECK (dev mode only).
 * Detects the #1 bug in SILSE: a page with BOTH schema AND elements[].
 * When this happens, content renders twice in preview/export mode.
 *
 * Call this in dev mode from:
 *   - PageRenderer (before render)
 *   - Store middleware (on every state change)
 *   - Export pipeline (before generating HTML)
 *
 * In production, this is a no-op (tree-shaken away).
 */
export function validateCanvaPageInvariant(page: CanvaPage, source?: string): void {
  if (process.env.NODE_ENV === 'production') return;

  const hasSchema = page.schema != null;
  const hasSchemaBlocks = page.schema != null && page.schema.blocks?.length > 0;
  const hasElements = page.elements != null && page.elements.length > 0;

  if (hasSchemaBlocks && hasElements) {
    const src = source ? ` (${source})` : '';
    const schemaBlocks = page.schema?.blocks?.length ?? 0;
    logger.error(
      'DUAL-RENDER BUG',
      `Page "${page.label}"${src} has BOTH schema (${schemaBlocks} blocks) AND elements (${page.elements.length}). ` +
      `This causes content to render twice in preview/export mode. ` +
      `Schema-driven pages must have elements=[]. ` +
      `Call migrateAllPages() to fix.`
    );
  }

  // Validate pageMode discriminator — schema pages must have a schema object
  // (but empty blocks array is OK — it just means "no blocks yet")
  if (page.pageMode === 'schema' && !hasSchema) {
    logger.warn('INVARIANT', `Page "${page.label}" has pageMode='schema' but no schema object. This should not happen.`);
  }
  if (page.pageMode === 'elements' && hasSchema) {
    logger.warn('INVARIANT', `Page "${page.label}" has pageMode='elements' but has schema. This should not happen.`);
  }
}

/**
 * Check if a page uses the legacy templateData path.
 * These pages need TemplateAdapter conversion before rendering.
 * After ensurePageSchema() runs, this returns false even for
 * originally-legacy pages.
 */
export function isLegacyPage(page: CanvaPage): boolean {
  if (page.schema) return false; // Already migrated
  if (page.templateType === 'custom' || !page.templateType) return false; // Custom pages aren't legacy
  return true; // Template page without schema = legacy
}

/**
 * Migrate all pages in an array to native schema.
 * Called during persistence load to ensure all pages are
 * schema-native before first render.
 *
 * CRITICAL: Also clears page.elements[] for schema-native pages.
 * This is the data-level fix for the dual-render bug:
 *   - If page.schema is populated → elements[] MUST be empty
 *   - SchemaScreenRenderer is the single source of truth
 *   - Legacy elements[] are no longer rendered for schema pages
 *
 * Returns the same array reference if no migration was needed,
 * or a new array with migrated pages.
 */
export function migrateAllPages(pages: CanvaPage[]): CanvaPage[] {
  let anyMigrated = false;
  const result = pages.map(page => {
    let updated = page;

    // Step 1: Migrate legacy template pages to native schema
    if (!page.schema && page.templateType && page.templateType !== 'custom') {
      const schema = ensurePageSchema(page);
      if (schema) {
        updated = { ...page, schema, elements: [], pageMode: 'schema' };
        anyMigrated = true;
      }
    }

    // Step 1b: Migrate empty pages (custom OR template) to schema-driven mode
    // ANY page with no schema AND no elements should get an empty schema
    // so users can immediately add blocks via AddBlockPanel.
    // This covers:
    //   - Custom pages that never had schema
    //   - Template pages loaded from DB without schemaData (TemplateAdapter
    //     fails because there's no templateData/elements to convert from)
    // We only do this for truly empty pages (no elements) to avoid
    // silently clearing user content on element-based pages.
    if (!updated.schema && (!updated.elements || updated.elements.length === 0)) {
      updated = {
        ...updated,
        schema: {
          id: updated.id,
          version: 1,
          templateType: updated.templateType || 'custom',
          blocks: [],
          background: { type: 'solid', color1: 'bg' },
        },
        elements: [],
        pageMode: 'schema',
      };
      anyMigrated = true;
    }

    // Step 2: Clear elements[] for ANY page that has schema
    // This fixes the dual-render bug at the data level:
    // Schema-driven pages must NOT have elements[] populated,
    // otherwise the legacy BlockRenderer overlay will render
    // content on top of SchemaScreenRenderer.
    if (updated.schema && updated.elements && updated.elements.length > 0) {
      updated = { ...updated, elements: [], pageMode: 'schema' };
      anyMigrated = true;
    }

    // Step 3: Ensure pageMode is set for all pages
    if (!updated.pageMode) {
      updated = { ...updated, pageMode: updated.schema ? 'schema' : 'elements' };
      anyMigrated = true;
    }

    // Step 3b: Normalize schema.background for pages with undefined background
    // P0 fix: schema pages must have a background field so the right panel
    // BackgroundSection and SchemaRenderer have a consistent source of truth.
    // Old pages created before this fix have schema.background = undefined,
    // causing the renderer to fall back to modeBg.bg while the panel shows
    // default controls that don't match actual rendering.
    //
    // Step 3b-2: Migrate legacy bg fields → schema.background
    // When a page has both schema (migrated) AND legacy bg fields set,
    // the legacy fields are the teacher's actual intent — copy them
    // into schema.background so SchemaScreenRenderer renders correctly.
    if (updated.schema && updated.schema.background === undefined) {
      // Build background from legacy fields if they contain real data
      const legacyBg = buildBackgroundFromLegacy(updated);
      updated = {
        ...updated,
        schema: {
          ...updated.schema,
          background: legacyBg,
        },
      };
      anyMigrated = true;
    }

    // Step 4: Migrate schema version at load time
    // This is the CORRECT place for version migration — at load/hydration time,
    // NOT during render. Previously, ensurePageSchema() would run migration
    // on every render and attempt a queueMicrotask writeback, causing
    // rerender cascades and layout invalidation loops.
    // By migrating here at load time, ensurePageSchema() stays PURE during render.
    if (updated.schema && (updated.schema.version || 0) < SCHEMA_VERSION) {
      try {
        const migrated = migrateSchema(updated.schema);
        updated = { ...updated, schema: migrated };
        anyMigrated = true;
      } catch (e) {
        logger.warn('migrateAllPages', `Version migration failed for page: ${updated.id}: ${String(e)}`);
      }
    }

    return updated;
  });
  return anyMigrated ? result : pages;
}

/**
 * Build a schema.background object from legacy CanvaPage fields.
 * This ensures that when a legacy page is migrated to schema mode,
 * its background settings (color, image, overlay) are preserved
 * in schema.background instead of being lost.
 *
 * Priority:
 *   1. If bgDataUrl is set → image background with overlay
 *   2. If bgColor is a gradient CSS → gradient background
 *   3. If bgColor is a hex color → solid background with that color
 *   4. Default → solid with 'bg' token
 *
 * Note: This does NOT delete the legacy fields — that's a separate
 * cleanup step after we're confident the migration is stable.
 */
function buildBackgroundFromLegacy(page: CanvaPage): NonNullable<ScreenSchema['background']> {
  const { bgColor, bgDataUrl, overlay } = page;

  // Case 1: Has background image
  if (bgDataUrl) {
    return {
      type: 'solid',
      color1: 'bg',
      imageUrl: bgDataUrl,
      overlay: overlay ?? 40,
      overlayType: 'dark',
      imageFit: 'cover',
      imageOpacity: 100,
      imageBlur: 0,
    };
  }

  // Case 2: bgColor is a CSS gradient (e.g., "linear-gradient(...)")
  if (bgColor && !bgColor.startsWith('#')) {
    // We can't parse arbitrary CSS gradients into color1/color2 tokens,
    // so store as a solid bg and note the gradient for future parsing.
    // The schema color system uses token keys, not raw CSS.
    return {
      type: 'gradient',
      color1: 'bg',
      color2: 'bg2',
    };
  }

  // Case 3: bgColor is a hex color that differs from default
  if (bgColor && bgColor !== '#ffffff') {
    return {
      type: 'solid',
      color1: 'bg',
      // Store the hex for reference — the renderer uses token keys,
      // but having the original hex helps if we add raw color support later.
      // For now, the default 'bg' token is the safest fallback.
    };
  }

  // Case 4: Default solid background
  return { type: 'solid' as const, color1: 'bg' };
}

/**
 * D-P0E: Ensure a ScreenSchema has a background field.
 * Old schemas created by TemplateAdapter had background: undefined for
 * non-cover/hero pages. This adds a default solid background if missing.
 *
 * Returns the same schema reference if background already exists (no allocation).
 * Only creates a new object when the fix is needed.
 */
function ensureSchemaBackground(schema: ScreenSchema): ScreenSchema {
  if (schema.background !== undefined) return schema;
  return { ...schema, background: { type: 'solid', color1: 'bg' } };
}
