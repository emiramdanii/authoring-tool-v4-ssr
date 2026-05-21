// ═══════════════════════════════════════════════════════════════════
// SCENE OVERFLOW ENGINE — Auto Scene Distribution
// ═══════════════════════════════════════════════════════════════════
//
// PROBLEM:
//   Scene is fixed 1280×720. Content can exceed that height.
//   Currently: content is clipped by overflow:hidden.
//   User sees: "konten hilang" — content disappears at the bottom.
//
// SOLUTION:
//   When content overflows, split it into MULTIPLE scenes.
//   Each scene stays within 720px. No scroll. No clip.
//
// KEY ARCHITECTURE DECISION:
//   Source schema is IMMUTABLE. Split is a DERIVED LAYOUT PLAN.
//
//   SOURCE SCHEMA (never mutated):
//     { blocks: [A, B, C, D, E, F, G] }
//
//   DERIVED SCENE PLAN (computed, cacheable, disposable):
//     Scene 0: [A, B, C]     → fits in 720px
//     Scene 1: [D, E, F]     → fits in 720px
//     Scene 2: [G]           → fits in 720px
//
//   The original page.schema.blocks[] is NEVER modified.
//   Split decisions are derived from measurements, not mutations.
//   This makes undo/redo trivial (source didn't change).
//   This makes collaboration possible (no conflicting splits).
//
// PIPELINE:
//   Source Schema → Measure Blocks → Compute Scene Plan → Render Scenes
//
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema } from '../schema/types';
import type { SceneResolution, SafeArea } from '../scene/SceneLayoutEngine';
import { estimateBlockHeight } from '../scene/SceneLayoutEngine';
import { getMeasuredHeight } from '../layout/BlockMeasurer';
import { computeCompressionDecision, type CompressionDecision } from './CompressionEngine';
import { isFullPageBlockType, isBlockTypeCompressionCapable, isBlockTypeSplittable } from '../schema/capability-registry';
import { getCompressedHeight } from '../schema/session-state';

// ── Scene Plan Types ───────────────────────────────────────────

/**
 * A single scene within the scene distribution plan.
 * Each scene is a SUBSET of the source schema's blocks.
 * The scene fits within the scene resolution height.
 */
export interface SceneSlice {
  /** Index of this scene in the plan (0-based) */
  sceneIndex: number;
  /** Block IDs that belong to this scene */
  blockIds: string[];
  /** Total measured/estimated height of all blocks in this scene */
  totalHeight: number;
  /** Whether this scene has overflow (shouldn't happen, but safety check) */
  hasOverflow: boolean;
  /** Compression decisions for blocks in this scene */
  compressionDecisions?: Map<string, CompressionDecision>;
  /** Block IDs in this scene that are splittable (can be broken across scenes) */
  splittableBlockIds?: string[];
}

/**
 * The complete scene distribution plan for a single page.
 * Derived from source schema + measurements. NEVER mutates source.
 */
export interface ScenePlan {
  /** The source schema ID this plan was derived from */
  sourceSchemaId: string;
  /** Array of scenes, each containing a subset of blocks */
  scenes: SceneSlice[];
  /** Total number of scenes needed */
  totalScenes: number;
  /** Whether the content fits in a single scene (no split needed) */
  isSingleScene: boolean;
  /** Block IDs that are splittable across scenes (from capability registry) */
  splittableBlockIds: string[];
  /** Timestamp of when this plan was computed (for cache invalidation) */
  computedAt: number;
}

// ── Scene Distribution Algorithm ───────────────────────────────

/**
 * Compute a scene distribution plan for a page's schema.
 *
 * Algorithm:
 *   1. For each flow block, get its height (measured or estimated)
 *   2. Stack blocks vertically, tracking cumulative height
 *   3. When cumulative height exceeds available space:
 *      a. Find the current block boundary (never split a block)
 *      b. Close the current scene
 *      c. Start a new scene
 *   4. Return the complete plan
 *
 * IMPORTANT:
 *   - This function does NOT mutate the source schema
 *   - It only reads block IDs and heights
 *   - The plan is derived and disposable
 */
export function computeScenePlan(
  schema: ScreenSchema,
  scene: SceneResolution,
  safeArea: SafeArea,
  options: {
    isCompact: boolean;
    /** Gap between blocks in px */
    blockGap?: number;
    /**
     * FASE 11A.4 — Per-block gaps from the rhythm engine.
     * When provided, each block uses its own transition-based gap
     * instead of the uniform blockGap.
     *
     * perBlockGaps[i] = gap BEFORE block i (0 for first block).
     * Backward compatible: if not provided, uses uniform blockGap.
     */
    perBlockGaps?: number[];
  }
): ScenePlan {
  const { isCompact, blockGap = isCompact ? 8 : 12, perBlockGaps } = options;

  const availableHeight = scene.h - safeArea.top - safeArea.bottom;
  const blocks = schema.blocks;

  // Pre-compute splittable block IDs from capability registry
  const splittableBlockIds = blocks
    .filter(b => isBlockTypeSplittable(b.type))
    .map(b => b.id || b.type);

  // If no blocks or single cover/hero block, return single-scene plan
  if (blocks.length === 0) {
    return {
      sourceSchemaId: schema.id,
      scenes: [{
        sceneIndex: 0,
        blockIds: [],
        totalHeight: 0,
        hasOverflow: false,
      }],
      totalScenes: 1,
      isSingleScene: true,
      splittableBlockIds: [],
      computedAt: Date.now(),
    };
  }

  // Full-page block (cover/hero) fills the entire scene
  if (blocks.length === 1 && isFullPageBlockType(blocks[0].type)) {
    return {
      sourceSchemaId: schema.id,
      scenes: [{
        sceneIndex: 0,
        blockIds: [blocks[0].id || 'block-0'],
        totalHeight: availableHeight,
        hasOverflow: false,
      }],
      totalScenes: 1,
      isSingleScene: true,
      splittableBlockIds: [],
      computedAt: Date.now(),
    };
  }

  // ── Multi-block scene distribution ──
  // Strategy: COMPRESSION-FIRST — before splitting into multiple scenes,
  // try to compress blocks that overflow. This keeps content on the same
  // scene (better UX) while still fitting within 720px.
  const scenes: SceneSlice[] = [];
  const sceneCompressionDecisions = new Map<string, CompressionDecision>();
  const sceneSplittableIds = new Set<string>(splittableBlockIds);
  let currentBlockIds: string[] = [];
  let currentSplittableIds: string[] = [];
  let currentHeight = 0;
  let sceneIndex = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockId = block.id || `block-${i}`;

    // Skip absolute-positioned blocks and full-page blocks (cover, hero, etc.)
    // Full-page blocks fill the entire scene — they should never be split
    // or counted as flow content. Legacy cover blocks from genCoverSchema()
    // have no `layout` property, so we detect them by type via isFullPageBlockType().
    const isFullPageBlock = isFullPageBlockType(block.type) || block.layout?.position === 'absolute';
    if (isFullPageBlock) {
      // Absolute/full-page blocks are included in the first scene only
      if (sceneIndex === 0) {
        currentBlockIds.push(blockId);
      }
      continue;
    }

    // Get block height: compressed cache > measured > estimated
    // The compressed height cache is written by SceneTransaction.rebalanceSchema()
    // and represents a deliberate layout decision that should take precedence.
    // Without this, the engine would recompute compression independently,
    // potentially producing different results than the transaction intended.
    const compressedH = block.id ? getCompressedHeight(block.id) : undefined;
    let blockHeight: number;
    let measuredH: number | undefined;

    if (compressedH != null) {
      // Transaction already decided this block's compressed height — use it.
      // Skip recompression since the transaction already determined the layout.
      blockHeight = compressedH;
    } else {
      measuredH = block.id ? getMeasuredHeight(block.id) : undefined;
      const { height: estimatedH } = estimateBlockHeight(block, {
        isCompact,
        variant: block.variant || 'A',
        availableWidth: scene.w - safeArea.left - safeArea.right,
        sceneH: scene.h,
      });
      blockHeight = measuredH != null ? measuredH : estimatedH;
    }

    // ═══ COMPRESSION-FIRST: Try to compress before splitting ═══
    // If this block would cause overflow AND it supports compression,
    // compute a compressed height that fits within remaining space.
    // This keeps blocks on the same scene instead of splitting.
    // NOTE: Skip compression if we already have a cached compressed height
    // (the transaction already made this decision).
    // FASE 11A.4 — Use per-block gap from rhythm engine when available
    const gap = (perBlockGaps && i < perBlockGaps.length) ? perBlockGaps[i] : blockGap;
    let prospectiveHeight = currentHeight + blockHeight + (currentBlockIds.length > 0 ? gap : 0);
    let compressionDecision: CompressionDecision | undefined;

    if (compressedH == null && prospectiveHeight > availableHeight && measuredH != null && isBlockTypeCompressionCapable(block.type)) {
      const remainingSpace = availableHeight - currentHeight - (currentBlockIds.length > 0 ? gap : 0);
      const decision = computeCompressionDecision(block, measuredH, remainingSpace);
      if (decision) {
        blockHeight = decision.compressedHeight;
        compressionDecision = decision;
        sceneCompressionDecisions.set(blockId, decision);
      }
    }

    // Check if adding this block would exceed available height
    // (Recompute with potentially compressed blockHeight)
    const finalHeight = currentHeight + blockHeight + (currentBlockIds.length > 0 ? gap : 0);

    const isSplittable = sceneSplittableIds.has(blockId);

    if (finalHeight > availableHeight && currentBlockIds.length > 0) {
      // This block doesn't fit — close current scene, start new one
      scenes.push({
        sceneIndex,
        blockIds: [...currentBlockIds],
        totalHeight: currentHeight,
        hasOverflow: false,
        compressionDecisions: new Map(sceneCompressionDecisions),
        splittableBlockIds: [...currentSplittableIds],
      });
      sceneCompressionDecisions.clear();
      sceneIndex++;
      currentBlockIds = [blockId];
      currentSplittableIds = isSplittable ? [blockId] : [];
      currentHeight = blockHeight;
      // Re-add compression decision if any
      if (compressionDecision) {
        sceneCompressionDecisions.set(blockId, compressionDecision);
      }
    } else {
      // Block fits — add to current scene
      currentBlockIds.push(blockId);
      if (isSplittable) currentSplittableIds.push(blockId);
      currentHeight = finalHeight;
    }
  }

  // Push remaining blocks as the last scene
  if (currentBlockIds.length > 0) {
    scenes.push({
      sceneIndex,
      blockIds: [...currentBlockIds],
      totalHeight: currentHeight,
      hasOverflow: currentHeight > availableHeight,
      compressionDecisions: new Map(sceneCompressionDecisions),
      splittableBlockIds: [...currentSplittableIds],
    });
  }

  // If no scenes were created (shouldn't happen), create a single empty scene
  if (scenes.length === 0) {
    scenes.push({
      sceneIndex: 0,
      blockIds: blocks.map(b => b.id || 'block-0'),
      totalHeight: 0,
      hasOverflow: false,
      splittableBlockIds: [...splittableBlockIds],
    });
  }

  return {
    sourceSchemaId: schema.id,
    scenes,
    totalScenes: scenes.length,
    isSingleScene: scenes.length === 1,
    splittableBlockIds,
    computedAt: Date.now(),
  };
}

/**
 * Get the blocks that belong to a specific scene in the plan.
 * Filters the source schema's blocks by the scene's block IDs.
 */
export function getBlocksForScene(
  schema: ScreenSchema,
  scene: SceneSlice
): SchemaBlock[] {
  const idSet = new Set(scene.blockIds);
  return schema.blocks.filter(block => {
    const blockId = block.id;
    return blockId != null && idSet.has(blockId);
  });
}

/**
 * Create a derived ScreenSchema for a specific scene.
 * This is what gets passed to SchemaScreenRenderer.
 *
 * IMPORTANT: The derived schema shares the same ID as the source.
 * This is intentional — it's the SAME page, just a different scene of it.
 * The sceneIndex is tracked separately by the parent component.
 */
export function createDerivedSchema(
  sourceSchema: ScreenSchema,
  scene: SceneSlice
): ScreenSchema {
  return {
    ...sourceSchema,
    blocks: getBlocksForScene(sourceSchema, scene),
  };
}
