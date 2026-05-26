// ═══════════════════════════════════════════════════════════════════
// BLOCK LOCATOR — Core-level block owner finder
// ═══════════════════════════════════════════════════════════════════
// Extracted from store/canva/schema-helpers.ts to avoid circular
// dependencies when core/ modules need block location logic.
//
// This is the SAME function as findBlockOwner in schema-helpers,
// but importable from core/ without creating core → store cycles.
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock } from '../../schema/types';
import { isCompositeBlock } from '../../layout/SchemaTraversal';
import { getCompositeContainerDescriptor } from '../../schema/capability-registry';

// ── Block Owner Type ─────────────────────────────────────────────

export type BlockOwner =
  | { kind: 'top-level'; index: number }
  | { kind: 'ftab-tab'; blockIndex: number; tabIndex: number; childIndex: number }
  | { kind: 'materi-section'; blockIndex: number; childIndex: number }
  | { kind: 'children'; blockIndex: number; childIndex: number };

/**
 * Find where a block lives in the block tree.
 * Returns null if block not found.
 *
 * This is the core-level version — same logic as
 * store/canva/schema-helpers.findBlockOwner but importable
 * from core/ without circular dependencies.
 */
export function findBlockOwner(blocks: SchemaBlock[], blockId: string): BlockOwner | null {
  // 1. Search top-level
  const idx = blocks.findIndex(b => b.id === blockId);
  if (idx !== -1) return { kind: 'top-level', index: idx };

  // 2. Search inside composite blocks using container descriptor
  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi];
    if (!isCompositeBlock(block)) continue;

    // Use descriptor-driven access for known composite types
    const descriptor = getCompositeContainerDescriptor(block.type);
    if (descriptor) {
      if (descriptor.structure === 'direct') {
        const children = (block as Record<string, unknown>)[descriptor.accessor] as SchemaBlock[] | undefined;
        const ci = (children || []).findIndex(b => b.id === blockId);
        if (ci !== -1) {
          return { kind: descriptor.containerType as 'materi-section', blockIndex: bi, childIndex: ci };
        }
        continue;
      }

      if (descriptor.structure === 'tabular' && descriptor.tabContentKey) {
        const tabs = (block as Record<string, unknown>)[descriptor.accessor] as Array<Record<string, unknown>> | undefined;
        for (let ti = 0; ti < (tabs?.length || 0); ti++) {
          const content = (tabs![ti][descriptor.tabContentKey!]) as SchemaBlock[] | undefined;
          const ci = (content || []).findIndex(b => b.id === blockId);
          if (ci !== -1) {
            return { kind: 'ftab-tab', blockIndex: bi, tabIndex: ti, childIndex: ci };
          }
        }
        continue;
      }
    }

    // Generic BaseBlock.children — fallback for any composite block type
    if (block.children && Array.isArray(block.children)) {
      const ci = block.children.findIndex(b => b.id === blockId);
      if (ci !== -1) return { kind: 'children', blockIndex: bi, childIndex: ci };
    }
  }

  return null;
}
