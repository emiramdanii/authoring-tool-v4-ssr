// ═══════════════════════════════════════════════════════════════════
// SCENE TRANSACTION SYSTEM — Atomic Layout Mutations
// ═══════════════════════════════════════════════════════════════════
// As the layout engine grows more complex (measure → split → rebalance
// → commit), we need a way to batch multiple operations ATOMICALLY.
//
// PROBLEM without transactions:
//   1. Measure block heights → ok
//   2. Split scene at boundary → writes to store
//   3. Rebalance compression → FAILS
//   Result: Store is in inconsistent state (split done, rebalance not)
//
// SOLUTION: SceneTransaction
//   const tx = createTransaction(schema);
//   tx.measure(blockId, height);
//   tx.splitAt(blockId);
//   tx.rebalance();
//   const result = tx.commit(); // All or nothing
//   // If commit fails, store is unchanged
//
// DESIGN PRINCIPLES:
//   - OPTIMISTIC: Steps are staged in memory, committed atomically
//   - ROLLBACK: If any step fails, all changes are discarded
//   - IMMUTABLE: The source schema is never modified — commit produces
//     a new schema that the caller writes to store
//   - COMPOSABLE: Steps can be chained, conditional, or skipped
//   - AUDITABLE: Every step is logged for debugging
//
// TRANSACTION LIFECYCLE:
//   1. createTransaction(schema) — Begin
//   2. tx.measure() / tx.splitAt() / tx.rebalance() — Stage steps
//   3. tx.commit() — Apply all steps, return result
//   4. If commit fails → tx.rollback() is automatic
//
// This is NOT a database transaction — it's an in-memory atomic
// operation that produces a new ScreenSchema. The caller is
// responsible for writing the result to the Zustand store.
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema } from './types';
import { isSpatialLayout } from './types';
import {
  deepClone,
  produce,
  replaceBlock,
  patchBlock,
  removeBlock,
  insertBlock,
  insertBlockNested,
  moveBlock,
  moveBlockNested,
  duplicateBlock as duplicateBlockImmutable,
  splitScene,
  mergeScene,
  snapshot,
  type ContainerRef,
} from './immutable';
import { assertValidSchema } from './validation';
import { assertDocumentPurity } from './session-state';
import { logger } from '@/core/utils/logger';

// ── Transaction Step Types ──────────────────────────────────────

export type TransactionStep =
  | { type: 'measure'; blockId: string; height: number }
  | { type: 'splitAt'; blockId: string }
  | { type: 'rebalance'; options?: RebalanceOptions }
  | { type: 'replaceBlock'; blockId: string; updater: (block: SchemaBlock) => SchemaBlock }
  | { type: 'patchBlock'; blockId: string; patch: Partial<SchemaBlock> }
  | { type: 'removeBlock'; blockId: string }
  | { type: 'insertBlock'; block: SchemaBlock; afterId?: string; atIndex?: number }
  | { type: 'insertBlockNested'; block: SchemaBlock; container: ContainerRef; toIndex?: number }
  | { type: 'moveBlock'; fromIndex: number; toIndex: number }
  | { type: 'moveBlockNested'; blockId: string; sourceContainer?: ContainerRef; targetContainer: ContainerRef; toIndex?: number }
  | { type: 'duplicateBlock'; blockId: string; newId?: string }
  | { type: 'custom'; name: string; fn: (schema: ScreenSchema) => ScreenSchema };

export interface RebalanceOptions {
  /** Available scene height in px */
  availableHeight: number;
  /** Whether to attempt compression before splitting */
  compressionFirst?: boolean;
  /** Gap between blocks in px */
  blockGap?: number;
}

export interface TransactionResult {
  /** Whether the transaction committed successfully */
  success: boolean;
  /** The resulting schema (null if failed) */
  schema: ScreenSchema | null;
  /** Steps that were executed */
  executedSteps: TransactionStep[];
  /** Error message if failed */
  error?: string;
  /** Measurement cache from this transaction */
  measurements: Map<string, number>;
  /**
   * Compressed height cache — block ID → compressed height in px.
   * Written by rebalanceSchema() as a RUNTIME value — NOT persisted in schema.
   * The caller should write this to the session interaction state's
   * compressedHeightCache for use by the layout engines.
   */
  compressedHeights: Map<string, number>;
}

// ── Scene Transaction ──────────────────────────────────────────

export class SceneTransaction {
  private schema: ScreenSchema;
  private originalSchema: ScreenSchema;
  private steps: TransactionStep[] = [];
  private measurements = new Map<string, number>();
  /** Runtime cache for compressed heights — NOT written to schema */
  private compressedHeights = new Map<string, number>();
  private committed = false;
  private rolledBack = false;

  constructor(schema: ScreenSchema) {
    this.schema = deepClone(schema);
    this.originalSchema = snapshot(schema);
  }

  // ── Step Staging ────────────────────────────────────────────

  /**
   * Record a block measurement.
   * Measurements are cached within the transaction for use by later steps.
   */
  measure(blockId: string, height: number): this {
    this.assertActive();
    this.steps.push({ type: 'measure', blockId, height });
    this.measurements.set(blockId, height);
    return this;
  }

  /**
   * Split the schema at a block boundary.
   * Returns TWO ScreenSchemas — the current one is updated to only
   * contain blocks before the split, and the second is returned.
   */
  splitAt(blockId: string): this {
    this.assertActive();
    this.steps.push({ type: 'splitAt', blockId });
    return this;
  }

  /**
   * Rebalance block heights and compression within the scene.
   * Uses measurements from previous measure() calls.
   */
  rebalance(options?: RebalanceOptions): this {
    this.assertActive();
    this.steps.push({ type: 'rebalance', options });
    return this;
  }

  /**
   * Replace a block by ID with an updater function.
   */
  replace(blockId: string, updater: (block: SchemaBlock) => SchemaBlock): this {
    this.assertActive();
    this.steps.push({ type: 'replaceBlock', blockId, updater });
    return this;
  }

  /**
   * Patch specific fields on a block.
   */
  patch(blockId: string, patch: Partial<SchemaBlock>): this {
    this.assertActive();
    this.steps.push({ type: 'patchBlock', blockId, patch });
    return this;
  }

  /**
   * Remove a block by ID.
   */
  remove(blockId: string): this {
    this.assertActive();
    this.steps.push({ type: 'removeBlock', blockId });
    return this;
  }

  /**
   * Insert a new block.
   */
  insert(block: SchemaBlock, options?: { afterId?: string; atIndex?: number }): this {
    this.assertActive();
    this.steps.push({ type: 'insertBlock', block, afterId: options?.afterId, atIndex: options?.atIndex });
    return this;
  }

  /**
   * Move a block from one position to another.
   */
  move(fromIndex: number, toIndex: number): this {
    this.assertActive();
    this.steps.push({ type: 'moveBlock', fromIndex, toIndex });
    return this;
  }

  /**
   * Insert a block into a nested container (materi-section, ftab, children).
   * Tree-aware: uses insertBlockNested() from immutable.ts which
   * handles ContainerRef routing.
   */
  insertNested(block: SchemaBlock, container: ContainerRef, toIndex?: number): this {
    this.assertActive();
    this.steps.push({ type: 'insertBlockNested', block, container, toIndex });
    return this;
  }

  /**
   * Move a block within/between nested containers.
   * Tree-aware: uses moveBlockNested() from immutable.ts.
   */
  moveNested(blockId: string, targetContainer: ContainerRef, options?: { sourceContainer?: ContainerRef; toIndex?: number }): this {
    this.assertActive();
    this.steps.push({
      type: 'moveBlockNested',
      blockId,
      sourceContainer: options?.sourceContainer,
      targetContainer,
      toIndex: options?.toIndex,
    });
    return this;
  }

  /**
   * Duplicate a block by ID, creating a deep clone with regenerated IDs.
   * Uses duplicateBlock() from immutable.ts which handles nested children.
   */
  duplicate(blockId: string, newId?: string): this {
    this.assertActive();
    this.steps.push({ type: 'duplicateBlock', blockId, newId });
    return this;
  }

  /**
   * Add a custom step with an arbitrary mutation function.
   * Use sparingly — prefer built-in steps for auditability.
   */
  custom(name: string, fn: (schema: ScreenSchema) => ScreenSchema): this {
    this.assertActive();
    this.steps.push({ type: 'custom', name, fn });
    return this;
  }

  // ── Execution ───────────────────────────────────────────────

  /**
   * Commit all staged steps atomically.
   * If any step fails, the entire transaction is rolled back.
   *
   * Returns a TransactionResult with the new schema.
   * The original schema is NEVER modified.
   */
  commit(): TransactionResult {
    if (this.committed) {
      return { success: false, schema: null, executedSteps: [], error: 'Transaction already committed', measurements: this.measurements, compressedHeights: new Map() };
    }
    if (this.rolledBack) {
      return { success: false, schema: null, executedSteps: [], error: 'Transaction already rolled back', measurements: this.measurements, compressedHeights: new Map() };
    }

    const executedSteps: TransactionStep[] = [];

    try {
      for (const step of this.steps) {
        executedSteps.push(step);
        this.executeStep(step);
      }

      // Validate the result before committing
      assertValidSchema(this.schema, 'SceneTransaction.commit');
      // Purity guard: ensure no runtime state leaked during transaction steps
      assertDocumentPurity(this.schema, 'SceneTransaction.commit');

      this.committed = true;
      return {
        success: true,
        schema: this.schema,
        executedSteps,
        measurements: this.measurements,
        compressedHeights: this.compressedHeights,
      };
    } catch (err) {
      // Rollback — restore original schema
      this.schema = this.originalSchema;
      this.committed = false;

      const errorMessage = err instanceof Error ? err.message : String(err);

      if (process.env.NODE_ENV !== 'production') {
        logger.error('SCENE-TX', `Transaction failed at step ${executedSteps.length}/${this.steps.length}: ${errorMessage}`);
      }

      return {
        success: false,
        schema: null,
        executedSteps,
        error: errorMessage,
        measurements: this.measurements,
        compressedHeights: new Map(),
      };
    }
  }

  /**
   * Explicitly rollback the transaction.
   * Usually not needed — commit() auto-rollbacks on failure.
   */
  rollback(): void {
    this.schema = this.originalSchema;
    this.rolledBack = true;
  }

  /**
   * Get the measurement cache from this transaction.
   */
  getMeasurements(): Map<string, number> {
    return new Map(this.measurements);
  }

  // ── Internal ────────────────────────────────────────────────

  private assertActive(): void {
    if (this.committed) throw new Error('Transaction already committed');
    if (this.rolledBack) throw new Error('Transaction already rolled back');
  }

  private executeStep(step: TransactionStep): void {
    switch (step.type) {
      case 'measure': {
        // Measurement is just caching — no schema mutation
        this.measurements.set(step.blockId, step.height);
        break;
      }

      case 'splitAt': {
        const result = splitScene(this.schema, step.blockId);
        if (!result) {
          throw new Error(`splitAt failed: block "${step.blockId}" not found or no blocks after it`);
        }
        // Keep only the first schema (second schema is returned separately)
        // Caller should handle the second schema if needed
        this.schema = result[0];
        break;
      }

      case 'rebalance': {
        // Rebalance: adjust compression hints based on measurements
        // This is a layout-aware operation that patches compression
        // hints on blocks that need compression
        this.schema = this.rebalanceSchema(step.options);
        break;
      }

      case 'replaceBlock': {
        this.schema = produce(this.schema, draft => {
          draft.blocks = replaceBlock(draft.blocks, step.blockId, step.updater);
        });
        break;
      }

      case 'patchBlock': {
        this.schema = produce(this.schema, draft => {
          draft.blocks = patchBlock(draft.blocks, step.blockId, step.patch);
        });
        break;
      }

      case 'removeBlock': {
        this.schema = produce(this.schema, draft => {
          draft.blocks = removeBlock(draft.blocks, step.blockId);
        });
        break;
      }

      case 'insertBlock': {
        this.schema = produce(this.schema, draft => {
          if (step.afterId) {
            draft.blocks = insertBlock(draft.blocks, step.block, { afterId: step.afterId });
          } else if (step.atIndex !== undefined) {
            draft.blocks = insertBlock(draft.blocks, step.block, { atIndex: step.atIndex });
          } else {
            draft.blocks = insertBlock(draft.blocks, step.block);
          }
        });
        break;
      }

      case 'moveBlock': {
        this.schema = produce(this.schema, draft => {
          draft.blocks = moveBlock(draft.blocks, step.fromIndex, step.toIndex);
        });
        break;
      }

      case 'insertBlockNested': {
        this.schema = produce(this.schema, draft => {
          draft.blocks = insertBlockNested(draft.blocks, step.block, step.container, step.toIndex);
        });
        break;
      }

      case 'moveBlockNested': {
        this.schema = produce(this.schema, draft => {
          draft.blocks = moveBlockNested(draft.blocks, {
            blockId: step.blockId,
            sourceContainer: step.sourceContainer,
            targetContainer: step.targetContainer,
            toIndex: step.toIndex,
          });
        });
        break;
      }

      case 'duplicateBlock': {
        const { newBlocks } = duplicateBlockImmutable(this.schema.blocks, step.blockId, {
          newId: step.newId,
        });
        this.schema = produce(this.schema, draft => {
          draft.blocks = newBlocks;
        });
        break;
      }

      case 'custom': {
        this.schema = step.fn(this.schema);
        break;
      }
    }
  }

  /**
   * Rebalance compression hints based on measurements.
   *
   * Algorithm:
   *   1. Sum up all measured block heights
   *   2. If total exceeds available height:
   *      a. Find blocks with compression.strategy !== 'none'
   *      b. Calculate how much compression is needed
   *      c. Distribute compression proportionally (lower priority compresses first)
   *   3. Patch compression hints on affected blocks
   */
  private rebalanceSchema(options?: RebalanceOptions): ScreenSchema {
    if (!options) return this.schema;

    const { availableHeight, compressionFirst = true, blockGap = 12 } = options;
    let blocks = deepClone(this.schema.blocks);

    // Calculate total measured height
    let totalHeight = 0;
    let measuredCount = 0;
    const flowBlocks: Array<{ index: number; height: number; priority: number }> = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      // Skip absolute-positioned blocks
      if (isSpatialLayout(block!.layout) && block!.layout.position === 'absolute') continue;

      const measuredH = this.measurements.get(block!.id || '')!;
      if (measuredH != null) {
        totalHeight += measuredH + (measuredCount > 0 ? blockGap : 0);
        measuredCount++;

        if (compressionFirst && block!.compression?.strategy !== 'none') {
          flowBlocks.push({
            index: i,
            height: measuredH,
            priority: block!.compression?.priority === 'high' ? 3 : block!.compression?.priority === 'medium' ? 2 : 1,
          });
        }
      }
    }

    // No overflow — no rebalance needed
    if (totalHeight <= availableHeight) return this.schema;

    // Compression-first: compress blocks starting from lowest priority
    if (compressionFirst && flowBlocks.length > 0) {
      const overflow = totalHeight - availableHeight;
      // Sort by priority ascending (compress low-priority first)
      flowBlocks.sort((a, b) => a.priority - b.priority);

      let remainingOverflow = overflow;
      for (const fb of flowBlocks) {
        if (remainingOverflow <= 0) break;

        const block = blocks[fb.index];
        const minHeight = block!.compression?.minFragmentHeight ?? 80;
        const maxCompression = fb.height - minHeight;
        const compression = Math.min(remainingOverflow, maxCompression);

        if (compression > 0) {
          const compressedHeight = fb.height - compression;
          // Store in runtime cache — NOT on the schema.
          // _compressedHeight was removed from CompressionHints because it
          // leaked derived data into localStorage. The caller writes this
          // to the session interaction state's compressedHeightCache.
          const blockId = block!.id || `block-${fb.index}`;
          this.compressedHeights.set(blockId, compressedHeight);
          // DO NOT write _compressedHeight to block.compression
          blocks[fb.index] = {
            ...block,
            compression: {
              ...block!.compression!,
            },
          };
          remainingOverflow -= compression;
        }
      }
    }

    return {
      ...this.schema,
      blocks,
      version: (this.schema.version || 1) + 1,
    };
  }
}

// ── Factory Function ───────────────────────────────────────────

/**
 * Create a new scene transaction.
 *
 * Usage:
 *   const tx = createTransaction(currentSchema);
 *   tx.measure('block-1', 320);
 *   tx.measure('block-2', 450);
 *   tx.rebalance({ availableHeight: 720, compressionFirst: true });
 *   const result = tx.commit();
 *
 *   if (result.success) {
 *     // Write result.schema to store
 *     setPageSchemaBlocks(pageId, result.schema.blocks);
 *   }
 */
export function createTransaction(schema: ScreenSchema): SceneTransaction {
  return new SceneTransaction(schema);
}
