// ═══════════════════════════════════════════════════════════════════
// SCHEMA APPLY — Nested Block Transaction Operations
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

import type { SchemaBlock } from '../types';
import { useCanvaStore } from '@/store/canva/store';
import { createTransaction, type TransactionResult } from '../scene-transaction';
import type { ContainerRef } from '../immutable';
import { commitSceneTransaction } from './transaction-ops';

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
