// ═══════════════════════════════════════════════════════════════════
// SCHEMA APPLY — Write SchemaBlock[] directly to canvas page.schema
// ═══════════════════════════════════════════════════════════════════
// This module provides utilities to:
//   1. Apply generated SchemaBlock[] to existing canvas pages
//   2. Update page.schema.blocks directly — no TemplateAdapter needed
//   3. Find pages by templateType and replace their blocks
//   4. Support real-time schema updates from RegenerateButton
//
// DESIGN PRINCIPLE:
//   SchemaBlock is the single source of truth for canvas rendering.
//   When auto-generate or regenerate produces new content, it goes
//   directly into page.schema — not through Authoring Store → Adapter.
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema } from './types';
import type { CanvaPage } from '@/components/canva/types';
import { useCanvaStore } from '@/store/canva/store';
import { generateBlockId } from './ensure-schema';
import { assertValidBlocks } from './validation';
import { assertDocumentPurity } from './session-state';

// ═══════════════════════════════════════════════════════════════════
// BLOCK TYPE → TEMPLATE TYPE MAPPING
// ═══════════════════════════════════════════════════════════════════
// Maps SchemaBlock.type to the templateType of pages that should
// contain this block type. Used by applyBlocksToPages() to find
// the right pages to update.

const BLOCK_TO_TEMPLATE: Record<string, string[]> = {
  'cover': ['cover'],
  'petunjuk': ['petunjuk'],
  'tp': ['dokumen', 'tujuan'],
  'alur': ['dokumen'],
  'tujuan-display': ['tujuan'],
  'motivasi': ['motivasi'],
  'materi-section': ['materi'],
  'def-box': ['materi'],
  'nc-grid': ['materi'],
  'flashcard-set': ['materi'],
  'skenario': ['skenario'],
  'diskusi': ['diskusi'],
  'kuis': ['kuis'],
  'refleksi': ['refleksi'],
  'rangkuman': ['rangkuman'],
  'hasil': ['hasil'],
  'penutup': ['penutup'],
};

/**
 * Apply SchemaBlock[] to canvas pages matching the template type.
 * Finds all pages with the given templateType and replaces their
 * schema.blocks with the provided blocks.
 *
 * This is the PRIMARY way auto-generate and regenerate update the canvas.
 * No TemplateAdapter needed — schema blocks are written directly.
 *
 * @param templateType - The page template type to match (e.g., 'materi', 'kuis')
 * @param blocks - The new schema blocks to apply
 * @param options - Optional: only update first match, create page if none exists
 */
export function applyBlocksToPages(
  templateType: string,
  blocks: SchemaBlock[],
  options?: {
    /** Only update the first matching page */
    firstOnly?: boolean;
    /** Create a new page if no match found */
    createIfMissing?: boolean;
  },
): number {
  const store = useCanvaStore.getState();
  const pages = [...store.pages];
  let updatedCount = 0;

  // Validate blocks before writing (dev-mode guard)
  assertValidBlocks(blocks, 'applyBlocksToPages');

  // Ensure all blocks have stable IDs
  const blocksWithIds = blocks.map(b => ({
    ...b,
    id: b.id || generateBlockId(),
  }));

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (page.templateType !== templateType) continue;

    // Update this page's schema
    if (page.schema) {
      const newSchema: ScreenSchema = {
        ...page.schema,
        blocks: blocksWithIds,
      };
      // Dev-mode purity guard: ensure no runtime state leaked into schema
      assertDocumentPurity(newSchema, 'applyBlocksToPages');
      pages[i] = {
        ...page,
        schema: newSchema,
        pageMode: 'schema',
        elements: [],
      };
    } else {
      // Page has no schema yet — create one
      const newSchema: ScreenSchema = {
        id: page.id,
        version: 1,
        templateType,
        blocks: blocksWithIds,
      };
      // Dev-mode purity guard
      assertDocumentPurity(newSchema, 'applyBlocksToPages (new)');
      pages[i] = {
        ...page,
        schema: newSchema,
        pageMode: 'schema',
        elements: [],
      };
    }

    updatedCount++;
    if (options?.firstOnly) break;
  }

  if (updatedCount > 0) {
    useCanvaStore.setState({ pages });
  }

  return updatedCount;
}

/**
 * Apply SchemaBlock(s) to pages by replacing blocks of the same type.
 * This is useful for regeneration: find blocks with the same type
 * and replace them, keeping other blocks intact.
 *
 * @param templateType - The page template type to match
 * @param newBlocks - The new block(s) to apply (single block or array)
 */
export function applyBlockToPages(
  templateType: string,
  newBlocks: SchemaBlock | SchemaBlock[],
): number {
  const store = useCanvaStore.getState();
  const pages = [...store.pages];
  let updatedCount = 0;

  // Normalize to array
  const blocksArray = Array.isArray(newBlocks) ? newBlocks : [newBlocks];

  // Validate blocks before writing (dev-mode guard)
  assertValidBlocks(blocksArray, 'applyBlockToPages');

  const blocksWithIds = blocksArray.map(b => ({
    ...b,
    id: b.id || generateBlockId(),
  }));

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (page.templateType !== templateType) continue;
    if (!page.schema) continue;

    // For each new block, find and replace existing block of same type, or append
    let updatedBlocks = [...page.schema.blocks];
    for (const blockWithId of blocksWithIds) {
      const existingIdx = updatedBlocks.findIndex(b => b.type === blockWithId.type);
      if (existingIdx >= 0) {
        updatedBlocks[existingIdx] = blockWithId;
      } else {
        updatedBlocks.push(blockWithId);
      }
    }

    const newSchema: ScreenSchema = { ...page.schema, blocks: updatedBlocks };
    assertDocumentPurity(newSchema, 'applyBlockToPages');
    pages[i] = {
      ...page,
      schema: newSchema,
    };
    updatedCount++;
  }

  if (updatedCount > 0) {
    useCanvaStore.setState({ pages });
  }

  return updatedCount;
}

/**
 * Apply blocks for a specific block type across ALL pages that might contain it.
 * Uses the BLOCK_TO_TEMPLATE mapping to find relevant pages.
 *
 * @param blockType - The SchemaBlock.type to apply
 * @param blocks - The blocks to apply
 */
export function applyBlocksByBlockType(
  blockType: string,
  blocks: SchemaBlock[],
): number {
  const templateTypes = BLOCK_TO_TEMPLATE[blockType] || [];
  let totalUpdated = 0;

  for (const tt of templateTypes) {
    totalUpdated += applyBlocksToPages(tt, blocks);
  }

  return totalUpdated;
}

/**
 * Replace all blocks in a page's schema.
 * Creates a new schema if the page doesn't have one.
 *
 * @param pageId - The specific page ID to update
 * @param blocks - The new blocks to set
 */
export function setPageSchemaBlocks(
  pageId: string,
  blocks: SchemaBlock[],
): boolean {
  const store = useCanvaStore.getState();
  const pages = [...store.pages];
  const idx = pages.findIndex(p => p.id === pageId);

  if (idx < 0) return false;

  const page = pages[idx];

  // Validate blocks before writing (dev-mode guard)
  assertValidBlocks(blocks, 'setPageSchemaBlocks');

  const blocksWithIds = blocks.map(b => ({
    ...b,
    id: b.id || generateBlockId(),
  }));

  if (page.schema) {
    const newSchema: ScreenSchema = { ...page.schema, blocks: blocksWithIds };
    assertDocumentPurity(newSchema, 'setPageSchemaBlocks');
    pages[idx] = {
      ...page,
      schema: newSchema,
      pageMode: 'schema' as const,
      elements: [],
    };
  } else {
    const newSchema: ScreenSchema = {
      id: page.id,
      version: 1,
      templateType: page.templateType || 'custom',
      blocks: blocksWithIds,
    };
    assertDocumentPurity(newSchema, 'setPageSchemaBlocks (new)');
    pages[idx] = {
      ...page,
      schema: newSchema,
      pageMode: 'schema' as const,
      elements: [],
    };
  }

  useCanvaStore.setState({ pages });
  return true;
}

/**
 * Find the first page ID matching a template type.
 * Useful for knowing which page to update after regeneration.
 */
export function findPageIdByType(templateType: string): string | null {
  const pages = useCanvaStore.getState().pages;
  const page = pages.find(p => p.templateType === templateType);
  return page?.id ?? null;
}

/**
 * Find all page IDs matching a template type.
 */
export function findPageIdsByType(templateType: string): string[] {
  const pages = useCanvaStore.getState().pages;
  return pages.filter(p => p.templateType === templateType).map(p => p.id);
}
