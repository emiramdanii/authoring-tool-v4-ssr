// ═══════════════════════════════════════════════════════════════════
// BLOCK OPERATIONS — Immutable block-level CRUD for the schema tree
// ═══════════════════════════════════════════════════════════════════
// All operations return NEW objects — originals are never mutated.
// These are the ONLY way to modify blocks in the schema tree.
// Direct property assignment is forbidden (enforced by deepFreeze
// in dev mode).
//
// TREE-AWARE: Operations handle nested containers (materi-section,
// ftab, children) transparently — no manual recursion needed.
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock } from '../types';
import { generateBlockId } from '../ensure-schema';
import { isCompositeBlockType, getCompositeContainerDescriptor } from '../capability-registry';
import { processCompositeChildren } from '../../layout/SchemaTraversal';
import { deepClone } from './core';
import {
  ContainerRef,
  extractBlockFromNested,
  insertIntoContainer,
  insertAfterInNested,
  regenerateNestedIds,
} from './container-helpers';

// Re-export ContainerRef for consumers
export type { ContainerRef } from './container-helpers';

// ── Block-Level Operations ──────────────────────────────────────

/**
 * Find a block by ID in a schema tree.
 * Searches top-level blocks and nested blocks using the capability registry
 * for composite block detection (single source of truth).
 */
export function findBlockById(blocks: SchemaBlock[], id: string): SchemaBlock | null {
  for (const block of blocks) {
    if (block.id === id) return block;

    // Search nested content using container descriptor
    if (isCompositeBlockType(block.type)) {
      const descriptor = getCompositeContainerDescriptor(block.type);
      if (descriptor) {
        if (descriptor.structure === 'direct') {
          const children = (block as Record<string, unknown>)[descriptor.accessor] as SchemaBlock[] | undefined;
          const found = children?.find(b => b.id === id);
          if (found) return found;
        }
        if (descriptor.structure === 'tabular' && descriptor.tabContentKey) {
          const tabs = (block as Record<string, unknown>)[descriptor.accessor] as Array<Record<string, unknown>> | undefined;
          for (const tab of (tabs || [])) {
            const content = tab[descriptor.tabContentKey] as SchemaBlock[] | undefined;
            const found = content?.find(b => b.id === id);
            if (found) return found;
          }
        }
      }
    }

    // Generic children fallback
    if (block.children) {
      const found = block.children.find(b => b.id === id);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Find the index of a block by ID (top-level only).
 */
export function findBlockIndex(blocks: SchemaBlock[], id: string): number {
  return blocks.findIndex(b => b.id === id);
}

/**
 * Replace a block by ID in a schema tree.
 * Returns a new array — original is never mutated.
 * Uses processCompositeChildren() for descriptor-driven nested updates.
 */
export function replaceBlock(
  blocks: SchemaBlock[],
  blockId: string,
  updater: (block: SchemaBlock) => SchemaBlock,
): SchemaBlock[] {
  return blocks.map(block => {
    // Top-level match
    if (block.id === blockId) {
      return updater(block);
    }

    // Composite blocks — use descriptor-driven mutation
    if (isCompositeBlockType(block.type)) {
      const updated = processCompositeChildren(block, (children) => {
        if (!children.some(b => b.id === blockId)) return children; // No change
        return children.map(b => b.id === blockId ? updater(b) : b);
      });
      if (updated) return updated;
    }

    // Generic children fallback
    if (block.children) {
      const found = block.children.some(b => b.id === blockId);
      if (found) {
        return { ...block, children: block.children.map(b => b.id === blockId ? updater(b) : b) };
      }
    }

    return block;
  });
}

/**
 * Patch specific fields on a block by ID.
 * Returns a new array — original is never mutated.
 *
 * Example:
 *   const newBlocks = patchBlock(blocks, 'abc123', { content: 'new text' });
 */
export function patchBlock(
  blocks: SchemaBlock[],
  blockId: string,
  patch: Partial<SchemaBlock>,
): SchemaBlock[] {
  return replaceBlock(blocks, blockId, block => ({ ...block, ...patch }));
}

/**
 * Remove a block by ID from a schema tree.
 * Returns a new array — original is never mutated.
 * Uses processCompositeChildren() for descriptor-driven nested updates.
 */
export function removeBlock(
  blocks: SchemaBlock[],
  blockId: string,
): SchemaBlock[] {
  return blocks
    .map(block => {
      // Composite blocks — use descriptor-driven mutation
      if (isCompositeBlockType(block.type)) {
        const updated = processCompositeChildren(block, (children) => {
          if (!children.some(b => b.id === blockId)) return children; // No change
          return children.filter(b => b.id !== blockId);
        });
        if (updated) return updated;
      }

      // Generic children fallback
      if (block.children) {
        if (block.children.some(b => b.id === blockId)) {
          return { ...block, children: block.children.filter(b => b.id !== blockId) };
        }
      }

      return block;
    })
    .filter(block => block.id !== blockId);
}

/**
 * Insert a block at a specific position.
 * Returns a new array — original is never mutated.
 */
export function insertBlock(
  blocks: SchemaBlock[],
  block: SchemaBlock,
  options?: {
    /** Insert before this block ID (default: append) */
    beforeId?: string;
    /** Insert after this block ID (default: append) */
    afterId?: string;
    /** Index to insert at (takes precedence over before/after) */
    atIndex?: number;
  },
): SchemaBlock[] {
  const blockWithId = { ...block, id: block.id || generateBlockId() };

  if (options?.atIndex !== undefined) {
    const result = [...blocks];
    result.splice(options.atIndex, 0, blockWithId);
    return result;
  }

  if (options?.beforeId) {
    const idx = findBlockIndex(blocks, options.beforeId);
    if (idx >= 0) {
      const result = [...blocks];
      result.splice(idx, 0, blockWithId);
      return result;
    }
  }

  if (options?.afterId) {
    const idx = findBlockIndex(blocks, options.afterId);
    if (idx >= 0) {
      const result = [...blocks];
      result.splice(idx + 1, 0, blockWithId);
      return result;
    }
  }

  // Default: append
  return [...blocks, blockWithId];
}

/**
 * Move a block from one position to another (top-level only).
 * Returns a new array — original is never mutated.
 *
 * For moving blocks within nested containers, use moveBlockNested().
 */
export function moveBlock(
  blocks: SchemaBlock[],
  fromIndex: number,
  toIndex: number,
): SchemaBlock[] {
  if (fromIndex === toIndex) return blocks;
  if (fromIndex < 0 || fromIndex >= blocks.length || toIndex < 0 || toIndex >= blocks.length) {
    return blocks; // Invalid indices — return unchanged
  }
  const result = [...blocks];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0!, moved);
  return result;
}

/**
 * Move a block within a nested container or between containers.
 * Tree-aware: operates inside materi-section.content, ftab.tabs[].content,
 * or BaseBlock.children.
 *
 * Returns a new array — original is never mutated.
 *
 * @param blocks - Top-level blocks array
 * @param options - Move specification
 *
 * Examples:
 *   // Move block inside materi-section.content
 *   moveBlockNested(blocks, {
 *     blockId: 'child-1',
 *     targetContainer: { type: 'materi-section', id: 'ms-1' },
 *     toIndex: 2,
 *   })
 *
 *   // Move block from one ftab tab to another
 *   moveBlockNested(blocks, {
 *     blockId: 'child-1',
 *     sourceContainer: { type: 'ftab', id: 'ft-1', tabIndex: 0 },
 *     targetContainer: { type: 'ftab', id: 'ft-1', tabIndex: 1 },
 *     toIndex: 0,
 *   })
 *
 *   // Move block out of container to top-level
 *   moveBlockNested(blocks, {
 *     blockId: 'child-1',
 *     sourceContainer: { type: 'materi-section', id: 'ms-1' },
 *     targetContainer: { type: 'root' },
 *     toIndex: 3,
 *   })
 */
export function moveBlockNested(
  blocks: SchemaBlock[],
  options: {
    /** ID of the block to move */
    blockId: string;
    /** Source container (auto-detected if not provided) */
    sourceContainer?: ContainerRef;
    /** Target container — { type: 'root' } for top-level */
    targetContainer: ContainerRef;
    /** Target index within the container */
    toIndex?: number;
  },
): SchemaBlock[] {
  const { blockId, targetContainer, toIndex } = options;

  // Step 1: Find and extract the block from its current location
  let movedBlock: SchemaBlock | null = null;
  let result = blocks;

  // Search in top-level
  const topIdx = result.findIndex(b => b.id === blockId);
  if (topIdx >= 0) {
    movedBlock = result[topIdx]!;
    result = [...result.slice(0, topIdx), ...result.slice(topIdx + 1)];
  } else {
    // Search in nested containers — extract and return modified tree
    const extractResult = extractBlockFromNested(result, blockId);
    if (extractResult.block) {
      movedBlock = extractResult.block;
      result = extractResult.blocks;
    }
  }

  if (!movedBlock) return blocks; // Block not found — return unchanged

  // Step 2: Insert the block into the target container
  if (targetContainer.type === 'root') {
    // Insert at top-level
    const idx = toIndex ?? result.length;
    return [...result.slice(0, idx), movedBlock, ...result.slice(idx)];
  }

  // Insert into nested container
  return insertIntoContainer(result, movedBlock, targetContainer, toIndex);
}

/**
 * Insert a block into a nested container.
 * Tree-aware version of insertBlock() for containers.
 *
 * @param blocks - Top-level blocks array
 * @param block - Block to insert
 * @param container - Target container
 * @param toIndex - Position within container (default: append)
 */
export function insertBlockNested(
  blocks: SchemaBlock[],
  block: SchemaBlock,
  container: ContainerRef,
  toIndex?: number,
): SchemaBlock[] {
  const blockWithId = { ...block, id: block.id || generateBlockId() };

  if (container.type === 'root') {
    return insertBlock(blocks, blockWithId, { atIndex: toIndex });
  }

  return insertIntoContainer(blocks, blockWithId, container, toIndex);
}

/**
 * Duplicate a block by ID, creating a deep clone with a new ID.
 * Optionally inserts the clone immediately after the original.
 *
 * Returns the cloned block AND the new blocks array (if autoInsert=true).
 * The original blocks array is never mutated.
 *
 * @param blocks - Schema blocks array
 * @param blockId - ID of the block to duplicate
 * @param options - Duplicate options
 */
export function duplicateBlock(
  blocks: SchemaBlock[],
  blockId: string,
  options?: {
    /** Auto-insert the clone after the original (default: true) */
    autoInsert?: boolean;
    /** Custom ID for the clone (default: auto-generated) */
    newId?: string;
  },
): { clonedBlock: SchemaBlock; newBlocks: SchemaBlock[] } {
  const source = findBlockById(blocks, blockId);
  if (!source) {
    return { clonedBlock: source!, newBlocks: blocks }; // Should not happen, but safe fallback
  }

  const autoInsert = options?.autoInsert ?? true;
  const newId = options?.newId || generateBlockId();

  // Deep clone with new ID
  const clonedBlock = deepClone({ ...source, id: newId });

  // Also regenerate IDs for nested children to avoid duplicates
  regenerateNestedIds(clonedBlock);

  if (!autoInsert) {
    return { clonedBlock, newBlocks: blocks };
  }

  // Insert after the original block
  // Check if the original is in a nested container
  const topIdx = blocks.findIndex(b => b.id === blockId);
  if (topIdx >= 0) {
    // Top-level: insert after original
    const result = [...blocks];
    result.splice(topIdx + 1, 0, clonedBlock);
    return { clonedBlock, newBlocks: result };
  }

  // Nested: insert after original in its container
  const newBlocks = insertAfterInNested(blocks, blockId, clonedBlock);
  return { clonedBlock, newBlocks };
}
