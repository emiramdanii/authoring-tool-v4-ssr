// ═══════════════════════════════════════════════════════════════════
// CONTAINER HELPERS — Internal utilities for nested block operations
// ═══════════════════════════════════════════════════════════════════
// These functions handle the descriptor-driven traversal of composite
// blocks (materi-section, ftab, children). They are used internally
// by block-ops and not exported from the public API.
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock } from '../types';
import { generateBlockId } from '../ensure-schema';
import { isCompositeBlockType, getCompositeContainerDescriptor } from '../capability-registry';
import { processCompositeChildren } from '../../layout/SchemaTraversal';

// ── Container Reference ─────────────────────────────────────────

/**
 * Reference to a container that holds child blocks.
 * Used by moveBlockNested and insertBlockNested.
 */
export interface ContainerRef {
  /** Container type: 'root' for top-level, or a specific block type */
  type: 'root' | 'materi-section' | 'ftab' | 'children';
  /** ID of the container block */
  id?: string;
  /** For ftab: which tab index to target */
  tabIndex?: number;
}

// ── Internal Helpers ────────────────────────────────────────────

/**
 * Extract a block from nested containers, returning the modified tree.
 * Uses container descriptor for descriptor-driven access.
 */
export function extractBlockFromNested(
  blocks: SchemaBlock[],
  blockId: string,
): { block: SchemaBlock | null; blocks: SchemaBlock[] } {
  let extracted: SchemaBlock | null = null;

  const result = blocks.map(block => {
    if (extracted) return block; // Already found — pass through

    // Composite blocks — use descriptor-driven extraction
    if (isCompositeBlockType(block.type)) {
      const updated = processCompositeChildren(block, (children) => {
        const idx = children.findIndex(b => b.id === blockId);
        if (idx >= 0) {
          extracted = children[idx]!;
          return [...children.slice(0, idx), ...children.slice(idx + 1)];
        }
        return children; // No change
      });
      if (updated && extracted) return updated;
    }

    // Generic children fallback
    if (block.children) {
      const idx = block.children.findIndex(b => b.id === blockId);
      if (idx >= 0) {
        extracted = block.children[idx]!;
        return { ...block, children: [...block.children.slice(0, idx), ...block.children.slice(idx + 1)] };
      }
    }

    return block;
  });

  return { block: extracted, blocks: result };
}

/**
 * Insert a block into a nested container.
 * Uses container descriptor for descriptor-driven access.
 */
export function insertIntoContainer(
  blocks: SchemaBlock[],
  block: SchemaBlock,
  container: ContainerRef,
  toIndex?: number,
): SchemaBlock[] {
  return blocks.map(b => {
    // Match container by ID
    if (b.id !== container.id) return b;

    // Composite blocks — use descriptor-driven insertion
    if (isCompositeBlockType(b.type) && container.type === b.type) {
      const updated = processCompositeChildren(b, (children, tabIndex) => {
        // For tabular containers, only insert into the specified tab
        if (container.tabIndex !== undefined && tabIndex !== container.tabIndex) return children;
        const idx = toIndex ?? children.length;
        return [...children.slice(0, idx), block, ...children.slice(idx)];
      });
      if (updated) return updated;
    }

    // Generic children fallback
    if (container.type === 'children' && b.children) {
      const children = [...b.children];
      const idx = toIndex ?? children.length;
      children.splice(idx, 0, block);
      return { ...b, children };
    }

    return b;
  });
}

/**
 * Insert a block after a specific block ID in nested containers.
 * Uses processCompositeChildren() for descriptor-driven access.
 */
export function insertAfterInNested(
  blocks: SchemaBlock[],
  afterBlockId: string,
  newBlock: SchemaBlock,
): SchemaBlock[] {
  return blocks.map(block => {
    // Composite blocks — use descriptor-driven insertion
    if (isCompositeBlockType(block.type)) {
      let found = false;
      const updated = processCompositeChildren(block, (children) => {
        const idx = children.findIndex(b => b.id === afterBlockId);
        if (idx >= 0) {
          found = true;
          return [...children.slice(0, idx + 1), newBlock, ...children.slice(idx + 1)];
        }
        return children; // No change
      });
      if (found && updated) return updated;
    }

    // Generic children fallback
    if (block.children) {
      const idx = block.children.findIndex(b => b.id === afterBlockId);
      if (idx >= 0) {
        const children = [...block.children];
        children.splice(idx + 1, 0, newBlock);
        return { ...block, children };
      }
    }

    return block;
  });
}

/**
 * Regenerate IDs for all nested children in a block to avoid duplicates.
 * Mutates the block in place (used on a deep-cloned block).
 * Uses container descriptor for composite block detection.
 *
 * Also exported for use in duplicatePage() — each cloned page needs
 * fresh IDs for ALL nested blocks, not just top-level ones.
 */
export function regenerateNestedIds(block: SchemaBlock): void {
  // Composite blocks — use descriptor-driven traversal
  if (isCompositeBlockType(block.type)) {
    const descriptor = getCompositeContainerDescriptor(block.type);
    if (descriptor) {
      if (descriptor.structure === 'direct') {
        const children = (block as Record<string, unknown>)[descriptor.accessor] as SchemaBlock[] | undefined;
        for (const child of children || []) {
          child.id = generateBlockId();
          regenerateNestedIds(child);
        }
      }
      if (descriptor.structure === 'tabular' && descriptor.tabContentKey) {
        const tabs = (block as Record<string, unknown>)[descriptor.accessor] as Array<Record<string, unknown>> | undefined;
        for (const tab of tabs || []) {
          const content = tab[descriptor.tabContentKey!] as SchemaBlock[] | undefined;
          for (const child of content || []) {
            child.id = generateBlockId();
            regenerateNestedIds(child);
          }
        }
      }
    }
  }

  // Generic children fallback
  if (block.children) {
    for (const child of block.children) {
      child.id = generateBlockId();
      regenerateNestedIds(child);
    }
  }
}
