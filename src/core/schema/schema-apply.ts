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
import type { FullLessonSchema } from './generators';
import { useCanvaStore } from '@/store/canva/store';
import { generateBlockId, generatePageId } from './ensure-schema';
import { assertValidBlocks, assertValidSchema } from './validation';
import { assertDocumentPurity, writeCompressedHeights } from './session-state';
import { createTransaction, type TransactionResult, type RebalanceOptions } from './scene-transaction';
import { splitScene, mergeScene, produce, type ContainerRef } from './immutable';
import { isBlockTypeCompressionCapable, isBlockTypeSplittable, isFullPageBlockType } from './capability-registry';
import { computeScenePlan, type ScenePlan } from '../layout/SceneOverflowEngine';
import { getSceneResolution, computeSafeArea, DEFAULT_SAFE_AREA } from '../scene/SceneLayoutEngine';
import { getMeasuredHeight } from '../layout/BlockMeasurer';
import { getBlockMeta } from '../registry/BlockDefinitionRegistry';

// ═══════════════════════════════════════════════════════════════════
// BLOCK TYPE → TEMPLATE TYPE MAPPING
// ═══════════════════════════════════════════════════════════════════
// Maps SchemaBlock.type to the templateType of pages that should
// contain this block type. Used by applyBlocksByBlockType() to find
// the right pages to update.
//
// DERIVED from BlockDefinitionRegistry.usedInTemplates:
//   Each block definition has a `usedInTemplates` array that lists
//   which page template types can contain this block. We derive
//   the mapping from the registry instead of hardcoding it here.
//
// Adding a new block type? Just set usedInTemplates in
// BlockDefinitionRegistry — this mapping auto-updates.

/** Cache for the derived block→template mapping */
let _blockToTemplateCache: Record<string, string[]> | null = null;

/**
 * Derive the BLOCK_TO_TEMPLATE mapping from BlockDefinitionRegistry.
 *
 * Each BlockDefinitionMeta.usedInTemplates lists which page template
 * types can contain this block type. This function inverts that
 * relationship to produce a blockType → templateType[] mapping.
 *
 * The result is cached — call getBlockTemplateMapping() instead of
 * rebuilding on every access.
 */
function buildBlockToTemplateMapping(): Record<string, string[]> {
  const mapping: Record<string, string[]> = {};

  // All known block types from the registry
  const knownTypes = [
    'cover', 'hero', 'petunjuk', 'tp', 'alur', 'skenario',
    'def-box', 'nc-grid', 'flashcard-set', 'ftab', 'nk-card',
    'materi-section', 'diskusi', 'kuis',
    'sortir-game', 'roda-game', 'memory-game', 'matching-game',
    'fill-blank-game', 'word-search-game', 'true-false-game',
    'drag-drop-game', 'crossword-game', 'team-buzzer-game',
    'hasil', 'refleksi', 'penutup', 'tabel-accord',
    'tujuan-display', 'motivasi', 'rangkuman',
  ];

  for (const blockType of knownTypes) {
    const meta = getBlockMeta(blockType);
    if (meta?.usedInTemplates && meta.usedInTemplates.length > 0) {
      mapping[blockType] = [...meta.usedInTemplates];
    }
  }

  return mapping;
}

/**
 * Get the block→template mapping (cached).
 * This is the SINGLE SOURCE OF TRUTH for which block types
 * belong to which page template types.
 *
 * Uses BlockDefinitionRegistry.usedInTemplates as the source,
 * so adding a new block type only requires updating the registry.
 */
function getBlockTemplateMapping(): Record<string, string[]> {
  if (!_blockToTemplateCache) {
    _blockToTemplateCache = buildBlockToTemplateMapping();
  }
  return _blockToTemplateCache;
}

/**
 * Invalidate the block→template mapping cache.
 * Call this if block definitions change at runtime (rare).
 */
export function invalidateBlockTemplateMapping(): void {
  _blockToTemplateCache = null;
}

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
  const mapping = getBlockTemplateMapping();
  const templateTypes = mapping[blockType] || [];
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
 * Replace a single block in a page's schema by block ID.
 * This is the PARTIAL SCOPED update — only the targeted block changes,
 * everything else in the schema stays intact.
 *
 * Phase 18.3: Used by per-item regenerate to update only one block
 * without replacing the entire page's content.
 *
 * @param pageId - The page to update
 * @param blockId - The ID of the block to replace
 * @param newBlock - The replacement block (keeps the same ID if not specified)
 * @returns true if the block was found and replaced
 */
export function replaceBlockById(
  pageId: string,
  blockId: string,
  newBlock: SchemaBlock,
): boolean {
  const store = useCanvaStore.getState();
  const pages = [...store.pages];
  const idx = pages.findIndex(p => p.id === pageId);

  if (idx < 0 || !pages[idx].schema) return false;

  const schema = pages[idx].schema!;
  const blockIdx = schema.blocks.findIndex(b => b.id === blockId);

  if (blockIdx < 0) return false;

  // Preserve the original block ID unless the new block explicitly provides one
  const replacement: SchemaBlock = {
    ...newBlock,
    id: newBlock.id || blockId,
  };

  const newBlocks = [...schema.blocks];
  newBlocks[blockIdx] = replacement;

  const newSchema: ScreenSchema = { ...schema, blocks: newBlocks };
  assertDocumentPurity(newSchema, 'replaceBlockById');

  pages[idx] = {
    ...pages[idx],
    schema: newSchema,
  };

  useCanvaStore.setState({ pages });
  return true;
}

/**
 * Update a specific question within a KuisBlock in a page's schema.
 * This is a DEEP partial update — modifies one question inside a block
 * without touching anything else.
 *
 * @param pageId - The page to update
 * @param blockId - The KuisBlock's ID
 * @param questionIndex - The index of the question to replace
 * @param newQuestion - The replacement question object
 * @returns true if the block was found and question replaced
 */
export function replaceKuisQuestionInSchema(
  pageId: string,
  blockId: string,
  questionIndex: number,
  newQuestion: { q: string; opts: string[]; ans: number; ex: string; pertemuan?: number },
): boolean {
  const store = useCanvaStore.getState();
  const pages = [...store.pages];
  const idx = pages.findIndex(p => p.id === pageId);

  if (idx < 0 || !pages[idx].schema) return false;

  const schema = pages[idx].schema!;
  const blockIdx = schema.blocks.findIndex(b => b.id === blockId);

  if (blockIdx < 0) return false;

  const block = schema.blocks[blockIdx];
  if (block.type !== 'kuis') return false;

  const kuisBlock = block as { questions: unknown[] };
  if (questionIndex < 0 || questionIndex >= kuisBlock.questions.length) return false;

  // Replace only the target question
  const newQuestions = [...kuisBlock.questions];
  newQuestions[questionIndex] = newQuestion;

  const newBlock: SchemaBlock = {
    ...block,
    questions: newQuestions,
  } as SchemaBlock;

  const newBlocks = [...schema.blocks];
  newBlocks[blockIdx] = newBlock;

  const newSchema: ScreenSchema = { ...schema, blocks: newBlocks };
  assertDocumentPurity(newSchema, 'replaceKuisQuestionInSchema');

  pages[idx] = {
    ...pages[idx],
    schema: newSchema,
  };

  useCanvaStore.setState({ pages });
  return true;
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
    bgColor: page.bgColor || '#ffffff',
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

// ═══════════════════════════════════════════════════════════════════
// SCENE PLAN → TRANSACTION BRIDGE
// ═══════════════════════════════════════════════════════════════════
// These functions bridge the SceneOverflowEngine's computed plans
// with the transaction system. They convert DERIVED layout decisions
// into ATOMIC schema mutations.
//
// Flow:
//   SceneOverflowEngine.computeScenePlan() → ScenePlan
//   → rebalanceFromScenePlan() → Transaction
//   → commitSceneTransaction() → Store updated
//
// The ScenePlan is a DERIVED view (computed, disposable).
// The Transaction is a MUTATION (atomic, validated, rolled-back on failure).
// This bridge converts one to the other.
// ═══════════════════════════════════════════════════════════════════

/**
 * Compute a scene plan for a page and rebalance using transactions.
 *
 * This is the HIGH-LEVEL bridge between SceneOverflowEngine and
 * the transaction system. It:
 *   1. Computes a fresh ScenePlan from current measurements
 *   2. If the plan shows overflow, uses a transaction to rebalance
 *   3. Commits atomically — if validation fails, no changes
 *
 * Strategy (compression-first):
 *   - If blocks can be compressed to fit → compress (no page split)
 *   - If compression isn't enough → split into pages (promote)
 *   - If single scene → no action needed
 *
 * @param pageId - The page to rebalance
 * @param options - Scene computation options
 * @returns Transaction result with scene plan attached
 */
export function rebalanceFromScenePlan(
  pageId: string,
  options?: {
    /** Whether in compact (canvas) mode */
    isCompact?: boolean;
    /** Scene ratio ID (default: '16:9') */
    ratioId?: string;
    /** Whether to attempt compression before splitting */
    compressionFirst?: boolean;
  },
): TransactionResult & { pageUpdated: boolean; scenePlan: ScenePlan | null } {
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
      scenePlan: null,
    };
  }

  const isCompact = options?.isCompact ?? true;
  const ratioId = options?.ratioId ?? '16:9';
  const sceneRes = getSceneResolution(ratioId);
  // Check if the page is a full-page block (cover, hero) that fills the entire scene.
  // Uses capability registry as single source of truth — previously used indirect
  // capability checks (not compressionCapable AND not splittable) which was fragile.
  const hasFullPageBlock = page.schema.blocks.length === 1 &&
    isFullPageBlockType(page.schema.blocks[0].type);
  const safeArea = hasFullPageBlock
    ? DEFAULT_SAFE_AREA
    : computeSafeArea({
        showTopNav: false,
        showBottomNav: false,
        isCompact,
        pagePadding: 16,
      });

  // Step 1: Compute fresh scene plan from current measurements
  const scenePlan = computeScenePlan(page.schema, sceneRes, safeArea, { isCompact });

  // Single scene → no overflow, nothing to rebalance
  if (scenePlan.isSingleScene) {
    return {
      success: true,
      schema: page.schema,
      executedSteps: [],
      measurements: new Map(),
      compressedHeights: new Map(),
      pageUpdated: false,
      scenePlan,
    };
  }

  // Step 2: Collect measurements from the measurement cache
  const measurements = new Map<string, number>();
  for (const block of page.schema.blocks) {
    if (block.id) {
      const h = getMeasuredHeight(block.id);
      if (h != null) {
        measurements.set(block.id, h);
      }
    }
  }

  // Step 3: Rebalance using transaction
  //   - If compression-first: try to compress blocks to fit
  //   - If that's not enough: the user can manually promote the split
  const availableHeight = sceneRes.h - safeArea.top - safeArea.bottom;
  const compressionFirst = options?.compressionFirst ?? true;

  const result = rebalancePageCompression(pageId, measurements, {
    availableHeight,
    compressionFirst,
    blockGap: isCompact ? 8 : 12,
  });

  return {
    ...result,
    scenePlan,
  };
}

// ═══════════════════════════════════════════════════════════════════
// TRANSACTION-BASED NESTED BLOCK OPERATIONS
// ═══════════════════════════════════════════════════════════════════
// These functions use the new nested block steps in SceneTransaction
// for atomic operations on blocks inside composite containers.
// They provide the same guarantees as the top-level transaction
// operations: atomic validation, auto-rollback, and audit trail.
//
// When to use these vs direct produceWithPatches in ui-slice:
//   - DIRECT: Simple single-step CRUD (already validated via commitSchemaUpdate)
//   - TRANSACTION NESTED: Multi-step nested operations that need atomicity
//     (e.g., move block from one container to another + rebalance)
// ═══════════════════════════════════════════════════════════════════

/**
 * Atomically insert a block into a nested container.
 *
 * Uses SceneTransaction.insertNested() for tree-aware insertion
 * into composite containers (materi-section, ftab, children).
 * If validation fails, the store is NOT modified.
 *
 * @param pageId - The page to update
 * @param block - The block to insert
 * @param container - The target container (ContainerRef)
 * @param toIndex - Position within the container (default: append)
 * @returns Transaction result with pageUpdated flag
 */
export function transactionInsertNested(
  pageId: string,
  block: SchemaBlock,
  container: ContainerRef,
  toIndex?: number,
): TransactionResult & { pageUpdated: boolean } {
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

  const tx = createTransaction(page.schema);
  tx.insertNested(block, container, toIndex);

  return commitSceneTransaction(pageId, tx);
}

/**
 * Atomically move a block within or between nested containers.
 *
 * Uses SceneTransaction.moveNested() for tree-aware movement.
 * Supports moving between root ↔ container, container ↔ container,
 * and within the same container.
 *
 * @param pageId - The page to update
 * @param blockId - The block to move
 * @param targetContainer - Where to move the block to
 * @param options - Source container (auto-detected if not provided) and target index
 * @returns Transaction result with pageUpdated flag
 */
export function transactionMoveNested(
  pageId: string,
  blockId: string,
  targetContainer: ContainerRef,
  options?: { sourceContainer?: ContainerRef; toIndex?: number },
): TransactionResult & { pageUpdated: boolean } {
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

  const tx = createTransaction(page.schema);
  tx.moveNested(blockId, targetContainer, options);

  return commitSceneTransaction(pageId, tx);
}

/**
 * Atomically duplicate a block with regenerated IDs.
 *
 * Uses SceneTransaction.duplicate() which deep-clones the block
 * and regenerates all nested child IDs (ftab tabs, materi-section
 * content, children). If validation fails, the store is NOT modified.
 *
 * @param pageId - The page to update
 * @param blockId - The block to duplicate
 * @param newId - Optional custom ID for the clone
 * @returns Transaction result with pageUpdated flag
 */
export function transactionDuplicateBlock(
  pageId: string,
  blockId: string,
  newId?: string,
): TransactionResult & { pageUpdated: boolean } {
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

  const tx = createTransaction(page.schema);
  tx.duplicate(blockId, newId);

  return commitSceneTransaction(pageId, tx);
}

// ═══════════════════════════════════════════════════════════════════
// ENSURE LESSON PAGES — Create/reuse BSNP pages from FullLessonSchema
// ═══════════════════════════════════════════════════════════════════
// Converts a FullLessonSchema into a set of canvas pages following
// the BSNP (Badan Standar Nasional Pendidikan) lesson structure.
//
// For each page in the BSNP structure:
//   1. If a page with that templateType already exists → reuse it
//   2. If not → create a new CanvaPage with that templateType
//   3. Remove any old lesson pages not in the BSNP structure
//   4. Apply the corresponding blocks from FullLessonSchema
//
// This function is idempotent — calling it multiple times with the
// same schema produces the same result (reusing existing pages).
// ═══════════════════════════════════════════════════════════════════

/**
 * BSNP lesson page structure — defines the canonical page order
 * and template types for a full BSNP-compliant lesson.
 *
 * Each entry maps to a section of the FullLessonSchema:
 *   cover    → schema.cover
 *   petunjuk → schema.petunjuk (optional)
 *   dokumen  → schema.tp + schema.alur (combined CP/TP/ATP)
 *   tujuan   → schema.tp (student-facing learning objectives)
 *   motivasi → schema.motivasi
 *   materi   → schema.materi (may be multiple blocks)
 *   diskusi  → schema.diskusi
 *   kuis     → schema.kuis
 *   refleksi → schema.refleksi
 *   rangkuman → schema.rangkuman (optional)
 *   penutup  → schema.hasil + schema.penutup
 */
const BSNP_PAGE_STRUCTURE = [
  { templateType: 'cover', label: 'Cover' },
  { templateType: 'petunjuk', label: 'Petunjuk' },
  { templateType: 'dokumen', label: 'Tujuan & Alur' },  // TP + Alur combined
  { templateType: 'tujuan', label: 'Tujuan Pembelajaran' },
  { templateType: 'motivasi', label: 'Motivasi' },
  { templateType: 'materi', label: 'Materi' },
  { templateType: 'diskusi', label: 'Diskusi' },
  { templateType: 'kuis', label: 'Kuis' },
  { templateType: 'refleksi', label: 'Refleksi' },
  { templateType: 'rangkuman', label: 'Rangkuman' },
  { templateType: 'penutup', label: 'Penutup' },
] as const;

/** All template types that belong to the BSNP lesson structure */
const BSNP_TEMPLATE_TYPES = new Set<string>(BSNP_PAGE_STRUCTURE.map(p => p.templateType));

/**
 * Resolve the blocks for a given templateType from a FullLessonSchema.
 *
 * Mapping:
 *   cover    → [schema.cover]
 *   petunjuk → [schema.petunjuk] (optional — returns [] if missing)
 *   dokumen  → [schema.tp, schema.alur?] (TP + Alur combined)
 *   tujuan   → [schema.tp] (student-facing TP display)
 *   motivasi → [schema.motivasi] (optional — returns [] if missing)
 *   materi   → schema.materi (may be multiple blocks)
 *   diskusi  → [schema.diskusi]
 *   kuis     → [schema.kuis]
 *   refleksi → [schema.refleksi]
 *   rangkuman → [schema.rangkuman] (optional — returns [] if missing)
 *   penutup  → [schema.hasil, schema.penutup]
 */
function resolveBlocksForTemplate(
  schema: FullLessonSchema,
  templateType: string,
): SchemaBlock[] {
  switch (templateType) {
    case 'cover':
      return [schema.cover];
    case 'petunjuk':
      return schema.petunjuk ? [schema.petunjuk] : [];
    case 'dokumen': {
      const blocks: SchemaBlock[] = [schema.tp];
      if (schema.alur) blocks.push(schema.alur);
      return blocks;
    }
    case 'tujuan':
      return [schema.tp];
    case 'motivasi':
      return schema.motivasi ? [schema.motivasi] : [];
    case 'materi':
      return schema.materi;
    case 'diskusi':
      return [schema.diskusi];
    case 'kuis':
      return [schema.kuis];
    case 'refleksi':
      return [schema.refleksi];
    case 'rangkuman':
      return schema.rangkuman ? [schema.rangkuman] : [];
    case 'penutup': {
      const blocks: SchemaBlock[] = [schema.hasil];
      blocks.push(schema.penutup);
      return blocks;
    }
    default:
      return [];
  }
}

/**
 * Ensure that the canvas has the correct BSNP lesson pages for a given schema.
 *
 * This function:
 *   1. Checks existing pages in the canva store
 *   2. For each templateType in the BSNP structure: if a page with that
 *      templateType exists, reuses it; if not, creates a new CanvaPage
 *   3. Removes any old lesson pages (pages with templateTypes in the
 *      BSNP structure) that aren't needed
 *   4. Applies the corresponding blocks from FullLessonSchema to each page
 *   5. Returns the updated page count
 *
 * Idempotent: calling multiple times with the same schema produces
 * the same result. Existing pages are reused when possible.
 *
 * @param lessonSchema - The full lesson schema to apply
 * @returns The total number of pages after the operation
 */
export function ensureLessonPages(lessonSchema: FullLessonSchema): number {
  const store = useCanvaStore.getState();
  const existingPages = [...store.pages];

  // ── Step 1: Determine which template types are needed ──────────
  // A template type is needed if it has content (non-empty blocks).
  // Optional sections (petunjuk, motivasi, rangkuman) are skipped
  // when the schema has no content for them.
  const neededTypes = new Set<string>();
  for (const { templateType } of BSNP_PAGE_STRUCTURE) {
    const blocks = resolveBlocksForTemplate(lessonSchema, templateType);
    if (blocks.length > 0) {
      neededTypes.add(templateType);
    }
  }

  // ── Step 2: Build index of existing pages by templateType ──────
  // Track which existing pages match BSNP template types so we can
  // reuse them. We only reuse the FIRST matching page per type.
  const usedPageIds = new Set<string>();
  const pageByType = new Map<string, CanvaPage>();
  for (const page of existingPages) {
    if (BSNP_TEMPLATE_TYPES.has(page.templateType) && !pageByType.has(page.templateType)) {
      pageByType.set(page.templateType, page);
      usedPageIds.add(page.id);
    }
  }

  // ── Step 3: Build the new page list ───────────────────────────
  // Preserve non-BSNP pages in their original order.
  // BSNP pages are placed in the BSNP structure order, inserted
  // at the position of the first existing BSNP page.
  const nonBsnpPages = existingPages.filter(p => !BSNP_TEMPLATE_TYPES.has(p.templateType));

  // Find insertion point: position of the first BSNP page in the
  // original page list, or end of list if none exist yet.
  let insertIdx = existingPages.findIndex(p => BSNP_TEMPLATE_TYPES.has(p.templateType));
  if (insertIdx < 0) insertIdx = existingPages.length;

  // Build BSNP pages in order
  const bsnpPages: CanvaPage[] = [];
  for (const { templateType, label } of BSNP_PAGE_STRUCTURE) {
    if (!neededTypes.has(templateType)) continue;

    const blocks = resolveBlocksForTemplate(lessonSchema, templateType);
    if (blocks.length === 0) continue;

    // Ensure all blocks have stable IDs
    const blocksWithIds = blocks.map(b => ({
      ...b,
      id: b.id || generateBlockId(),
    }));

    // Validate blocks before writing (dev-mode guard)
    assertValidBlocks(blocksWithIds, `ensureLessonPages:${templateType}`);

    const existingPage = pageByType.get(templateType);

    if (existingPage) {
      // ── Reuse existing page ────────────────────────────────
      const newSchema: ScreenSchema = {
        id: existingPage.id,
        version: 1,
        templateType,
        blocks: blocksWithIds,
      };
      // Dev-mode purity guard
      assertDocumentPurity(newSchema, `ensureLessonPages:reuse:${templateType}`);

      bsnpPages.push({
        ...existingPage,
        schema: newSchema,
        pageMode: 'schema',
        elements: [],
      });
    } else {
      // ── Create new page ────────────────────────────────────
      const newPageId = generatePageId();
      const newSchema: ScreenSchema = {
        id: newPageId,
        version: 1,
        templateType,
        blocks: blocksWithIds,
      };
      // Dev-mode purity guard
      assertDocumentPurity(newSchema, `ensureLessonPages:new:${templateType}`);

      const newPage: CanvaPage = {
        id: newPageId,
        label,
        bgDataUrl: null,
        bgColor: '#ffffff',
        overlay: 0,
        templateType,
        colorPalette: null,
        navConfig: { showNavbar: false, showPrevNext: false, showScore: false, showProgress: false, navbarStyle: 'minimal' as const },
        pageMode: 'schema',
        elements: [],
        schema: newSchema,
        templateData: {},
      };

      bsnpPages.push(newPage);
    }
  }

  // ── Step 4: Compose final page list ───────────────────────────
  // Insert BSNP pages at the insertion point, preserving non-BSNP
  // pages in their original order around them.
  const finalPages: CanvaPage[] = [
    ...nonBsnpPages.slice(0, insertIdx),
    ...bsnpPages,
    ...nonBsnpPages.slice(insertIdx),
  ];

  // ── Step 5: Write to store ────────────────────────────────────
  useCanvaStore.setState({ pages: finalPages });

  return finalPages.length;
}
