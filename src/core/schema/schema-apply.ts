// ═══════════════════════════════════════════════════════════════════
// SCHEMA APPLY — Write SchemaBlock[] directly to canvas page.schema
// ═══════════════════════════════════════════════════════════════════
// This module provides utilities to:
//   1. Apply generated SchemaBlock[] to existing canvas pages
//   2. Update page.schema.blocks directly — no TemplateAdapter needed
//   3. Find pages by templateType and replace their blocks
//   4. Support real-time schema updates from RegenerateButton
//   5. Transaction-based atomic operations for scene mutations
//
// DESIGN PRINCIPLE:
//   SchemaBlock is the single source of truth for canvas rendering.
//   When auto-generate or regenerate produces new content, it goes
//   directly into page.schema — not through Authoring Store → Adapter.
//
// TRANSACTION INTEGRATION:
//   For multi-step operations (split, rebalance, compress), use
//   commitSceneTransaction() which wraps SceneTransaction.commit()
//   and writes the result to the store only on success.
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema } from './types';
import type { CanvaPage } from '@/components/canva/types';
import { useCanvaStore } from '@/store/canva/store';
import { generateBlockId, generatePageId } from './ensure-schema';
import { assertValidBlocks, assertValidSchema } from './validation';
import { assertDocumentPurity } from './session-state';
import { createTransaction, type TransactionResult, type RebalanceOptions } from './scene-transaction';
import { splitScene, mergeScene, produce } from './immutable';
import { isBlockTypeCompressionCapable } from './capability-registry';
import type { ScenePlan } from '../layout/SceneOverflowEngine';

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

// ═══════════════════════════════════════════════════════════════════
// TRANSACTION-BASED OPERATIONS
// ═══════════════════════════════════════════════════════════════════
// These functions use the SceneTransaction system for atomic
// multi-step operations. They ensure that complex mutations
// (measure → split → rebalance → commit) either ALL succeed
// or NONE are applied (auto-rollback on failure).
//
// When to use transactions vs direct writes:
//   - DIRECT: Single-step writes (set blocks, replace blocks)
//   - TRANSACTION: Multi-step mutations (split + rebalance, merge + compress)
// ═══════════════════════════════════════════════════════════════════

/**
 * Commit a scene transaction and write the result to the store.
 *
 * This is the PRIMARY bridge between SceneTransaction and the Zustand store.
 * If the transaction succeeds, the resulting schema is written to the page.
 * If it fails, the store is NOT modified (auto-rollback).
 *
 * Usage:
 *   const tx = createTransaction(currentSchema);
 *   tx.measure('block-1', 320);
 *   tx.measure('block-2', 450);
 *   tx.rebalance({ availableHeight: 720, compressionFirst: true });
 *   const result = commitSceneTransaction(pageId, tx);
 *   // If result.success → store updated
 *   // If !result.success → store unchanged
 */
export function commitSceneTransaction(
  pageId: string,
  tx: { commit: () => TransactionResult },
): TransactionResult & { pageUpdated: boolean } {
  const result = tx.commit();

  if (!result.success || !result.schema) {
    return { ...result, pageUpdated: false };
  }

  // Write the committed schema to the store
  const store = useCanvaStore.getState();
  const pages = [...store.pages];
  const idx = pages.findIndex(p => p.id === pageId);

  if (idx < 0) {
    return {
      ...result,
      success: false,
      error: `Page "${pageId}" not found`,
      pageUpdated: false,
    };
  }

  pages[idx] = {
    ...pages[idx],
    schema: result.schema,
    pageMode: 'schema',
    elements: [],
  };

  useCanvaStore.setState({ pages });

  return { ...result, pageUpdated: true };
}

/**
 * Rebalance compression on a page using a transaction.
 *
 * This is the transaction-based equivalent of manually patching
 * compression hints. It's useful when the scene overflow engine
 * detects that blocks need compression adjustments.
 *
 * Algorithm (via transaction):
 *   1. Stage measurements for all blocks
 *   2. Rebalance compression based on available height
 *   3. Commit — if validation fails, rollback
 *
 * @param pageId - The page to rebalance
 * @param measurements - Block ID → measured height map
 * @param options - Rebalance configuration
 */
export function rebalancePageCompression(
  pageId: string,
  measurements: Map<string, number>,
  options: RebalanceOptions,
): TransactionResult & { pageUpdated: boolean } {
  const store = useCanvaStore.getState();
  const page = store.pages.find(p => p.id === pageId);
  if (!page?.schema) {
    return {
      success: false,
      schema: null,
      executedSteps: [],
      error: `Page "${pageId}" has no schema`,
      measurements,
      pageUpdated: false,
    };
  }

  const tx = createTransaction(page.schema);

  // Stage all measurements
  for (const [blockId, height] of measurements) {
    tx.measure(blockId, height);
  }

  // Rebalance using staged measurements
  tx.rebalance(options);

  // Commit and write to store
  return commitSceneTransaction(pageId, tx);
}

/**
 * Promote a scene split into an actual page split.
 *
 * When the SceneOverflowEngine determines that a page's content
 * needs to be split across multiple scenes, this function converts
 * that derived plan into an ACTUAL page split:
 *   1. The original page keeps blocks from scene 0
 *   2. A new page is created for scene 1+ blocks
 *   3. Both pages are committed atomically via transaction
 *
 * This is the "promote" operation — turning a derived layout decision
 * into a persistent document change.
 *
 * @param pageId - The page to split
 * @param scenePlan - The computed scene plan from SceneOverflowEngine
 * @param sceneIndex - Which scene to promote (0 = keep in original, 1+ = new page)
 * @returns Transaction result + new page ID if created
 */
export function promoteSceneSplitToPage(
  pageId: string,
  scenePlan: ScenePlan,
  sceneIndex: number,
): TransactionResult & { pageUpdated: boolean; newPageId?: string } {
  const store = useCanvaStore.getState();
  const page = store.pages.find(p => p.id === pageId);
  if (!page?.schema) {
    return {
      success: false,
      schema: null,
      executedSteps: [],
      error: `Page "${pageId}" has no schema`,
      measurements: new Map(),
      pageUpdated: false,
    };
  }

  if (scenePlan.isSingleScene) {
    return {
      success: false,
      schema: null,
      executedSteps: [],
      error: 'Scene plan is single scene — no split needed',
      measurements: new Map(),
      pageUpdated: false,
    };
  }

  if (sceneIndex < 1 || sceneIndex >= scenePlan.totalScenes) {
    return {
      success: false,
      schema: null,
      executedSteps: [],
      error: `Invalid scene index ${sceneIndex} for plan with ${scenePlan.totalScenes} scenes`,
      measurements: new Map(),
      pageUpdated: false,
    };
  }

  // Get blocks for the target scene
  const targetScene = scenePlan.scenes[sceneIndex];
  const targetBlockIds = new Set(targetScene.blockIds);

  // Split the schema at the scene boundary
  const originalBlocks = page.schema.blocks.filter(b => !targetBlockIds.has(b.id || ''));
  const newPageBlocks = page.schema.blocks.filter(b => targetBlockIds.has(b.id || ''));

  if (newPageBlocks.length === 0) {
    return {
      success: false,
      schema: null,
      executedSteps: [],
      error: 'No blocks found for the target scene',
      measurements: new Map(),
      pageUpdated: false,
    };
  }

  // Use a transaction for the original page update
  const tx = createTransaction(page.schema);

  // Remove all blocks that belong to the new page
  for (const blockId of targetScene.blockIds) {
    tx.remove(blockId);
  }

  const result = tx.commit();

  if (!result.success || !result.schema) {
    return { ...result, pageUpdated: false };
  }

  // Create the new page for the split content
  const newPageId = generatePageId();
  const newPageSchema: ScreenSchema = {
    id: newPageId,
    version: 1,
    templateType: page.templateType || 'custom',
    blocks: newPageBlocks,
  };

  // Validate the new schema
  assertValidSchema(newPageSchema, 'promoteSceneSplitToPage (new page)');
  assertDocumentPurity(newPageSchema, 'promoteSceneSplitToPage (new page)');

  // Write both updates to the store atomically
  const pages = [...store.pages];
  const pageIdx = pages.findIndex(p => p.id === pageId);

  if (pageIdx < 0) {
    return {
      success: false,
      schema: null,
      executedSteps: result.executedSteps,
      error: `Page "${pageId}" not found during commit`,
      measurements: result.measurements,
      pageUpdated: false,
    };
  }

  // Update original page with remaining blocks
  pages[pageIdx] = {
    ...pages[pageIdx],
    schema: result.schema,
    pageMode: 'schema',
    elements: [],
  };

  // Insert new page after the original
  const newPage: CanvaPage = {
    id: newPageId,
    label: `${page.label || 'Halaman'} (${sceneIndex + 1})`,
    bgDataUrl: page.bgDataUrl || null,
    bgColor: page.bgColor || '#0f172a',
    overlay: page.overlay ?? 0,
    templateType: page.templateType || 'custom',
    colorPalette: page.colorPalette || null,
    navConfig: page.navConfig || { showTopNav: false, showBottomNav: false },
    pageMode: 'schema',
    elements: [],
    schema: newPageSchema,
    templateData: page.templateData || {},
  };

  pages.splice(pageIdx + 1, 0, newPage);

  useCanvaStore.setState({ pages });

  return {
    ...result,
    pageUpdated: true,
    newPageId,
  };
}

/**
 * Merge two adjacent pages back into one.
 * This is the inverse of promoteSceneSplitToPage().
 *
 * Uses a transaction to ensure atomicity:
 *   1. Add blocks from source page to target page
 *   2. Remove source page
 *   3. Validate + commit
 *
 * @param targetPageId - The page that will absorb the source blocks
 * @param sourcePageId - The page whose blocks will be merged (then removed)
 */
export function mergePagesTransaction(
  targetPageId: string,
  sourcePageId: string,
): TransactionResult & { pageUpdated: boolean } {
  const store = useCanvaStore.getState();
  const targetPage = store.pages.find(p => p.id === targetPageId);
  const sourcePage = store.pages.find(p => p.id === sourcePageId);

  if (!targetPage?.schema || !sourcePage?.schema) {
    return {
      success: false,
      schema: null,
      executedSteps: [],
      error: 'Both pages must have schemas',
      measurements: new Map(),
      pageUpdated: false,
    };
  }

  // Use a transaction for the merge
  const tx = createTransaction(targetPage.schema);

  // Append all source blocks to the target
  for (const block of sourcePage.schema.blocks) {
    tx.insert(block);
  }

  const result = tx.commit();

  if (!result.success || !result.schema) {
    return { ...result, pageUpdated: false };
  }

  // Write to store: update target + remove source
  const pages: CanvaPage[] = store.pages
    .filter(p => p.id !== sourcePageId)
    .map(p => {
      if (p.id === targetPageId) {
        return {
          ...p,
          schema: result.schema!,
          pageMode: 'schema' as const,
          elements: [],
        };
      }
      return p;
    });

  useCanvaStore.setState({ pages });

  return { ...result, pageUpdated: true };
}
