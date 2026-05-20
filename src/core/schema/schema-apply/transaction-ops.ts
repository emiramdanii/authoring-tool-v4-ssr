// ═══════════════════════════════════════════════════════════════════
// SCHEMA APPLY — Transaction-Based Operations
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

import type { ScreenSchema } from '../types';
import type { CanvaPage } from '@/components/canva/types';
import { useCanvaStore } from '@/store/canva/store';
import { generatePageId } from '../ensure-schema';
import { assertValidSchema } from '../validation';
import { assertDocumentPurity, writeCompressedHeights } from '../session-state';
import { createTransaction, type TransactionResult, type RebalanceOptions } from '../scene-transaction';
import type { ScenePlan } from '../../layout/SceneOverflowEngine';

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

  // ═══ Write compressed heights to runtime cache ═════════════════
  // The transaction's rebalanceSchema() computes compressed heights
  // and stores them in result.compressedHeights. We must write these
  // to the module-level cache so layout engines can read them.
  // Without this, the compressed heights are lost after commit and
  // the layout engines would recompute independently — potentially
  // producing different results than the transaction intended.
  if (result.compressedHeights.size > 0) {
    writeCompressedHeights(result.compressedHeights);
  }

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
      compressedHeights: new Map(),
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
      compressedHeights: new Map(),
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
      compressedHeights: new Map(),
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
      compressedHeights: new Map(),
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
      compressedHeights: new Map(),
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
      compressedHeights: result.compressedHeights,
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

  // Write any compressed heights from the transaction to the runtime cache
  if (result.compressedHeights.size > 0) {
    writeCompressedHeights(result.compressedHeights);
  }

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
      compressedHeights: new Map(),
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

  // Write any compressed heights from the merge transaction to the runtime cache
  if (result.compressedHeights.size > 0) {
    writeCompressedHeights(result.compressedHeights);
  }

  return { ...result, pageUpdated: true };
}
