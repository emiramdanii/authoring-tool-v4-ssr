// ═══════════════════════════════════════════════════════════════════
// SCHEMA HELPERS — Shared utilities for schema block slices
// ═══════════════════════════════════════════════════════════════════
// These helpers are used by both block-crud-slice.ts and
// scene-transaction-slice.ts. Extracted here to avoid circular
// dependencies and code duplication.
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema } from '@/core/schema/types';
import { bumpVersion } from '@/core/schema/immutable';
import { assertDocumentPurity } from '@/core/schema/session-state';
import { isCompositeBlock } from '@/core/layout/SchemaTraversal';
import { getCompositeContainerDescriptor } from '@/core/schema/capability-registry';
import { logger } from '@/core/utils/logger';

// ── Nested Block Finder ─────────────────────────────────────────
// Finds blocks inside composite blocks (ftab.tabs[].content[],
// materi-section.content[]). Returns the path so Immer can update it.
//
// Uses isCompositeBlock() from SchemaTraversal and
// getCompositeContainerDescriptor() from the capability registry
// as single source of truth for container structure.

export type BlockOwner =
  | { kind: 'top-level'; index: number }
  | { kind: 'ftab-tab'; blockIndex: number; tabIndex: number; childIndex: number }
  | { kind: 'materi-section'; blockIndex: number; childIndex: number }
  | { kind: 'children'; blockIndex: number; childIndex: number };

export function findBlockOwner(blocks: SchemaBlock[], blockId: string): BlockOwner | null {
  // 1. Search top-level
  const idx = blocks.findIndex(b => b.id === blockId);
  if (idx !== -1) return { kind: 'top-level', index: idx };

  // 2. Search inside composite blocks using container descriptor
  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi];
    if (!isCompositeBlock!(block)) continue;

    // Use descriptor-driven access for known composite types
    const descriptor = getCompositeContainerDescriptor(block!.type);
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
          const content = (tabs![ti]![descriptor.tabContentKey!]) as SchemaBlock[] | undefined;
          const ci = (content || []).findIndex(b => b.id === blockId);
          if (ci !== -1) {
            return { kind: 'ftab-tab', blockIndex: bi, tabIndex: ti, childIndex: ci };
          }
        }
        continue;
      }
    }

    // Generic BaseBlock.children — fallback for any composite block type
    if (block!.children && Array.isArray(block!.children)) {
      const ci = block!.children.findIndex(b => b.id === blockId);
      if (ci !== -1) return { kind: 'children', blockIndex: bi, childIndex: ci };
    }
  }

  return null;
}

// ── Schema Update Helper ───────────────────────────────────────
// Centralized page.schema update with version bump + purity guard.
// Replaces the repeated pattern:
//   { ...schema, blocks: newBlocks }
// With version tracking via bumpVersion() and dev-mode purity check.

export function commitSchemaUpdate(schema: ScreenSchema, newBlocks: SchemaBlock[]): ScreenSchema {
  const updated = bumpVersion({ ...schema, blocks: newBlocks });
  // Dev-mode purity guard: catches runtime state leaking into schema
  // Wrapped in try-catch to prevent dev-mode crashes from breaking addSchemaBlock
  try {
    assertDocumentPurity(updated, 'commitSchemaUpdate');
  } catch (e) {
    logger.warn('commitSchemaUpdate', 'Purity check failed (non-fatal): ' + String(e));
  }
  return updated;
}
