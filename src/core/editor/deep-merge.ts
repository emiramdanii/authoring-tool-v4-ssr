// ═══════════════════════════════════════════════════════════════════
// DEEP PATCH MERGE — Immutable deep merge for schema block updates
// ═══════════════════════════════════════════════════════════════════
// This is the core of the edit pipeline. Instead of replacing an entire
// block, we deep-merge the patch into the existing block.
//
// Why deep merge?
//   - undo/redo becomes trivial (just replay/undo patches)
//   - collaboration becomes possible (merge patches from multiple users)
//   - history is efficient (store patches, not full snapshots)
//   - AI editing is safe (partial updates don't destroy data)
//
// Uses Immer for immutable updates with mutable draft API.

import { produce, produceWithPatches } from 'immer';
import type { Patch } from 'immer';
import type { SchemaBlock } from '../schema/types';

/**
 * Deep patch merge a SchemaBlock with partial updates.
 * Uses Immer for immutable updates — the original block is never mutated.
 *
 * @example
 *   deepMergeBlock(block, { content: { title: 'baru' } })
 *   // → block with content.title updated, everything else preserved
 *
 *   deepMergeBlock(block, { style: { background: { color: '#fff' } } })
 *   // → block with style.background.color updated, other style props preserved
 */
export function deepMergeBlock<T extends SchemaBlock>(
  block: T,
  patch: Record<string, unknown>
): T {
  return produce(block, (draft) => {
    deepMergeInto(draft as Record<string, unknown>, patch);
  });
}

/**
 * Deep merge `source` into `target` (mutates target via Immer draft).
 * Arrays are replaced, not merged (matching Canva/Figma behavior).
 */
function deepMergeInto(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): void {
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];

    // Both are plain objects → recurse
    if (
      sourceVal !== null &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal !== null &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      deepMergeInto(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      );
    } else {
      // Primitives, arrays, or null → replace
      target[key] = sourceVal;
    }
  }
}

/**
 * Batch deep merge — apply multiple patches to blocks in a single Immer producer.
 * More efficient than calling deepMergeBlock in a loop.
 *
 * @example
 *   batchMergeBlocks(blocks, [
 *     { index: 0, patch: { title: 'Updated' } },
 *     { index: 2, patch: { content: 'New content' } },
 *   ])
 */
export function batchMergeBlocks(
  blocks: SchemaBlock[],
  patches: Array<{ index: number; patch: Record<string, unknown> }>
): SchemaBlock[] {
  return produce(blocks, (draft) => {
    for (const { index, patch } of patches) {
      if (index >= 0 && index < draft.length) {
        deepMergeInto(
          draft[index] as unknown as Record<string, unknown>,
          patch
        );
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// PATCH-BASED MERGE — Returns immer patches for undo/redo
// ═══════════════════════════════════════════════════════════════════
// Uses produceWithPatches to capture forward and inverse patches.
// These patches can be stored in PatchHistory and applied with
// applyPatches for efficient, memory-friendly undo/redo.

export interface DeepMergeResult {
  /** The merged block (immutable, new reference) */
  block: SchemaBlock;
  /** Forward patches — apply to original to get merged result */
  patches: Patch[];
  /** Inverse patches — apply to merged result to get original */
  inversePatches: Patch[];
}

/**
 * Deep patch merge a SchemaBlock with partial updates, returning
 * both the merged result and immer patches for undo/redo.
 *
 * @example
 *   const { block, patches, inversePatches } = deepMergeBlockWithPatches(block, { title: 'baru' });
 *   // block.title === 'baru'
 *   // patches: [{ op: 'replace', path: ['title'], value: 'baru' }]
 *   // inversePatches: [{ op: 'replace', path: ['title'], value: 'old title' }]
 */
export function deepMergeBlockWithPatches<T extends SchemaBlock>(
  block: T,
  patch: Record<string, unknown>
): DeepMergeResult {
  const [newBlock, patches, inversePatches] = produceWithPatches(block, (draft) => {
    deepMergeInto(draft as Record<string, unknown>, patch);
  });
  return {
    block: newBlock as T,
    patches,
    inversePatches,
  };
}

/**
 * Deep merge a block within a blocks array, returning the new array
 * and immer patches scoped to the blocks array level.
 * This is the correct level for undo/redo — patches reference
 * paths like [blockIndex, 'title'] which can be applied to the
 * blocks array directly.
 *
 * @example
 *   const { blocks: newBlocks, patches, inversePatches } =
 *     mergeBlockInArray(blocks, blockIdx, { title: 'baru' });
 *   // patches: [{ op: 'replace', path: [2, 'title'], value: 'baru' }]
 */
export function mergeBlockInArray(
  blocks: SchemaBlock[],
  blockIndex: number,
  patch: Record<string, unknown>
): { blocks: SchemaBlock[]; patches: Patch[]; inversePatches: Patch[] } {
  const [newBlocks, patches, inversePatches] = produceWithPatches(blocks, (draft) => {
    if (blockIndex >= 0 && blockIndex < draft.length) {
      deepMergeInto(
        draft[blockIndex] as unknown as Record<string, unknown>,
        patch
      );
    }
  });
  return {
    blocks: newBlocks,
    patches,
    inversePatches,
  };
}
