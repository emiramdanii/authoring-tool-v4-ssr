// ═══════════════════════════════════════════════════════════════════
// ENSURE PAGE SCHEMA — Lazy Migration on Read (FASE 1)
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

import type { CanvaPage } from '@/components/canva/types';
import type { ScreenSchema, SchemaBlock } from './types';
import { convertToSchema } from '@/core/engine/TemplateAdapter';
import { nanoid } from 'nanoid';

/**
 * Ensure a page has a native ScreenSchema.
 * Lazily migrates legacy pages on first read.
 * Mutates page.schema in-place (intentional — this is the migration).
 *
 * Returns null only for custom/empty pages (no template type).
 */
export function ensurePageSchema(page: CanvaPage): ScreenSchema | null {
  // ═══ Path 1: Already native schema ═══════════════════════════
  if (page.schema) return page.schema;

  // ═══ Path 2: schemaScreen in templateData — promote it ══════
  const storedSchema = page.templateData?.schemaScreen as ScreenSchema | undefined;
  if (storedSchema) {
    // Promote to first-class field + assign stable IDs if missing
    const upgraded = assignStableIds(storedSchema);
    page.schema = upgraded;
    return upgraded;
  }

  // ═══ Path 3: Legacy template page — convert via TemplateAdapter ═══
  const isTemplate = page.templateType && page.templateType !== 'custom';
  if (isTemplate) {
    const converted = convertToSchema(page);
    if (converted) {
      const upgraded = assignStableIds(converted);
      page.schema = upgraded;
      return upgraded;
    }
  }

  // ═══ Path 4: Custom/empty page — no schema ══════════════════
  return null;
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
 */
export function findBlockInPage(page: CanvaPage, blockId: string): SchemaBlock | null {
  const blocks = getPageBlocks(page);
  return blocks.find(b => b.id === blockId) ?? null;
}

/**
 * Assign stable nanoid-based IDs to any blocks that don't have one.
 * This is called during migration to ensure all blocks have stable IDs
 * that survive across sessions (unlike Date.now() or position-based IDs).
 */
function assignStableIds(schema: ScreenSchema): ScreenSchema {
  let needsUpdate = false;

  const blocks = schema.blocks.map((block, idx) => {
    if (!block.id || isUnstableId(block.id)) {
      needsUpdate = true;
      return { ...block, id: nanoid(10) };
    }
    return block;
  });

  if (!needsUpdate) return schema;

  return { ...schema, blocks };
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
