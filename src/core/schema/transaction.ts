/**
 * SILSE — Scene Transaction System
 * Atomic measure → split → rebalance → commit with auto-rollback.
 *
 * Task #2: Wire transaction system into schema-apply.ts and scene overflow engine.
 *
 * Key invariants:
 * - All mutations flow through createTransaction() → staged steps → commit()
 * - commit() is all-or-nothing: if any step or validation fails, auto-rollback
 * - Validation gate runs after all steps are applied
 * - Transaction is single-use: commit() or rollback() can only be called once
 */

import { produce } from 'immer';
import { nanoid } from 'nanoid';
import type {
  ScreenSchema,
  SchemaBlock,
  SchemaOperation,
  TransactionResult,
  ContainerRef,
  BlockVariant,
} from './types';
import { validateSchema, type ValidationResult } from './validation';
import { assertDocumentPurity, type PurityViolation } from './session-state';
import { BlockCapabilityRegistry, isCompositeBlockType } from './capability-registry';

// ─── Transaction State ─────────────────────────────────────────────────
type TxnState = 'open' | 'committed' | 'rolled-back';

// ─── Step Record ───────────────────────────────────────────────────────
interface StepRecord {
  operation: SchemaOperation;
  /** Snapshot of schema BEFORE this step was applied (for rollback) */
  snapshot: ScreenSchema;
}

// ─── Overflow Check Result ─────────────────────────────────────────────
export interface OverflowCheckResult {
  hasOverflow: boolean;
  totalHeight: number;
  maxHeight: number;
  remainingSpace: number;
  /** Per-block height breakdown */
  blockHeights: Array<{ blockId: string; type: string; estimatedHeight: number }>;
}

// ─── Estimated Block Heights ───────────────────────────────────────────
const VARIANT_HEIGHT_MULTIPLIER: Record<BlockVariant, number> = {
  A: 1.0,   // Normal
  B: 0.7,   // Compact
  C: 0.45,  // Minimal
};

const BASE_HEIGHT_MAP: Record<string, number> = {
  'cover': 636,
  'hero': 500,
  'materi-section': 180,
  'def-box': 100,
  'image-block': 200,
  'text-block': 80,
  'kuis': 320,
  'kuis-item': 80,
  'game': 400,
  'skenario': 280,
  'diskusi': 160,
  'refleksi': 120,
  'petunjuk': 100,
  'penutup': 200,
  'note-callout': 80,
  'ftab-container': 240,
  'ftab-item': 180,
  'spacer': 24,
  'divider': 16,
};

/** Scene max height for 1280×720 with margins */
export const SCENE_MAX_HEIGHT = 636; // 720 - 42px header - 42px footer

export function estimateBlockHeight(block: SchemaBlock): number {
  const base = BASE_HEIGHT_MAP[block.type] ?? 120;
  const multiplier = block.variant ? VARIANT_HEIGHT_MULTIPLIER[block.variant] : 1.0;
  const caps = BlockCapabilityRegistry.get(block.type);

  let height = base * multiplier;

  // Composite blocks: add children heights
  if (isCompositeBlockType(block.type)) {
    const blockAny = block as Record<string, unknown>;
    const children = (block.children ?? (blockAny.items as SchemaBlock[] | undefined) ?? (blockAny.tabs as SchemaBlock[] | undefined)) ?? [];
    for (const child of children) {
      height += estimateBlockHeight(child);
    }
  }

  return Math.round(height);
}

// ─── Transaction Class ─────────────────────────────────────────────────
export class Transaction {
  private state: TxnState = 'open';
  private steps: StepRecord[] = [];
  private schema: ScreenSchema;
  private workingSchema: ScreenSchema;
  private customValidator?: (schema: ScreenSchema) => ValidationResult;

  constructor(schema: ScreenSchema, validator?: (schema: ScreenSchema) => ValidationResult) {
    // Deep clone to avoid mutating original
    this.schema = JSON.parse(JSON.stringify(schema));
    this.workingSchema = this.schema;
    this.customValidator = validator;
  }

  // ─── Stage Operations ──────────────────────────────────────────────

  /** Insert a block into a container at an optional index */
  insertBlock(block: SchemaBlock, container: ContainerRef, index?: number): this {
    this.assertOpen();
    const snapshot = this.cloneSchema();
    this.workingSchema = produce(this.workingSchema, draft => {
      const parent = this.resolveContainer(draft, container);
      if (parent) {
        const idx = index ?? parent.length;
        parent.splice(idx, 0, { ...block });
      }
    });
    this.steps.push({ operation: { type: 'insert-block', block, container, index }, snapshot });
    return this;
  }

  /** Remove a block by ID from anywhere in the tree */
  removeBlock(blockId: string): this {
    this.assertOpen();
    const snapshot = this.cloneSchema();
    this.workingSchema = produce(this.workingSchema, draft => {
      this.removeBlockFromTree(draft.blocks, blockId);
    });
    this.steps.push({ operation: { type: 'remove-block', blockId }, snapshot });
    return this;
  }

  /** Move a block from one container to another */
  moveBlock(blockId: string, from: ContainerRef, to: ContainerRef, index?: number): this {
    this.assertOpen();
    const snapshot = this.cloneSchema();
    this.workingSchema = produce(this.workingSchema, draft => {
      // Find and remove from source
      const [removed] = this.removeBlockFromTree(draft.blocks, blockId) ?? [];
      if (removed) {
        // Insert into target container
        const target = this.resolveContainer(draft, to);
        if (target) {
          const idx = index ?? target.length;
          target.splice(idx, 0, { ...removed });
        }
      }
    });
    this.steps.push({ operation: { type: 'move-block', blockId, from, to, index }, snapshot });
    return this;
  }

  /** Update a block's properties */
  updateBlock(blockId: string, changes: Partial<SchemaBlock>): this {
    this.assertOpen();
    const snapshot = this.cloneSchema();
    this.workingSchema = produce(this.workingSchema, draft => {
      const block = this.findBlockInTree(draft.blocks, blockId);
      if (block) {
        Object.assign(block, changes);
      }
    });
    this.steps.push({ operation: { type: 'update-block', blockId, changes }, snapshot });
    return this;
  }

  /** Duplicate a block (generates new ID) */
  duplicateBlock(blockId: string, container?: ContainerRef): this {
    this.assertOpen();
    const snapshot = this.cloneSchema();
    this.workingSchema = produce(this.workingSchema, draft => {
      const source = this.findBlockInTree(draft.blocks, blockId);
      if (source) {
        const clone = this.deepCloneWithNewIds(source);
        // Insert right after the source block at root level
        const sourceIdx = draft.blocks.findIndex(b => b.id === blockId);
        if (sourceIdx >= 0) {
          draft.blocks.splice(sourceIdx + 1, 0, clone);
        } else {
          draft.blocks.push(clone);
        }
      }
    });
    this.steps.push({ operation: { type: 'duplicate-block', blockId, container }, snapshot });
    return this;
  }

  /** Change a block's variant (A/B/C) */
  changeVariant(blockId: string, variant: BlockVariant): this {
    this.assertOpen();
    const snapshot = this.cloneSchema();
    this.workingSchema = produce(this.workingSchema, draft => {
      const block = this.findBlockInTree(draft.blocks, blockId);
      if (block) {
        block.variant = variant;
      }
    });
    this.steps.push({ operation: { type: 'change-variant', blockId, variant }, snapshot });
    return this;
  }

  // ─── Measure / Overflow ────────────────────────────────────────────

  /** Check if current working schema overflows the scene bounds */
  checkOverflow(): OverflowCheckResult {
    const blockHeights: OverflowCheckResult['blockHeights'] = [];

    let totalHeight = 0;
    for (const block of this.workingSchema.blocks) {
      const h = estimateBlockHeight(block);
      totalHeight += h;
      blockHeights.push({ blockId: block.id ?? '', type: block.type, estimatedHeight: h });
    }

    return {
      hasOverflow: totalHeight > SCENE_MAX_HEIGHT,
      totalHeight,
      maxHeight: SCENE_MAX_HEIGHT,
      remainingSpace: SCENE_MAX_HEIGHT - totalHeight,
      blockHeights,
    };
  }

  /**
   * Auto-rebalance: if overflow detected, try compacting blocks (variant B→C)
   * until it fits, or suggest splitting.
   */
  autoRebalance(): this {
    this.assertOpen();
    let check = this.checkOverflow();

    if (!check.hasOverflow) return this;

    // Strategy 1: Compact A→B for largest blocks first
    const sortedByHeight = [...check.blockHeights].sort((a, b) => b.estimatedHeight - a.estimatedHeight);

    for (const bh of sortedByHeight) {
      if (!check.hasOverflow) break;

      const block = this.findBlockInTree(this.workingSchema.blocks, bh.blockId);
      if (block && block.variant === 'A') {
        this.changeVariant(bh.blockId, 'B');
        check = this.checkOverflow();
      }
    }

    // Strategy 2: Compact B→C for remaining overflow
    if (check.hasOverflow) {
      for (const bh of sortedByHeight) {
        if (!check.hasOverflow) break;

        const block = this.findBlockInTree(this.workingSchema.blocks, bh.blockId);
        if (block && block.variant === 'B') {
          this.changeVariant(bh.blockId, 'C');
          check = this.checkOverflow();
        }
      }
    }

    return this;
  }

  // ─── Commit / Rollback ────────────────────────────────────────────

  /**
   * Commit the transaction: validate the final state and return result.
   * If validation fails, auto-rollback to original schema.
   */
  commit(): TransactionResult {
    this.assertOpen();

    // Dev-mode purity guard: check for forbidden runtime fields
    if (process.env.NODE_ENV === 'development') {
      const { pure, violations } = assertDocumentPurity(this.workingSchema);
      if (!pure && violations.length > 0) {
        console.group('🚫 Transaction Purity Violations');
        for (const v of violations) {
          console.warn(
            `  Block "${v.blockType}" (${v.blockId}) has forbidden field "${v.fieldName}":`,
            v.fieldValue
          );
        }
        console.groupEnd();
      }
    }

    // Run validation
    const validation = this.customValidator
      ? this.customValidator(this.workingSchema)
      : validateSchema(this.workingSchema);

    if (!validation.valid) {
      // Auto-rollback
      this.workingSchema = this.steps.length > 0
        ? this.steps[0].snapshot
        : this.schema;

      this.state = 'rolled-back';

      return {
        success: false,
        schema: this.workingSchema,
        errors: [...validation.errors.map(e => `${e.path}: ${e.message}`), 'Transaction rolled back due to validation failure'],
        warnings: validation.warnings,
      };
    }

    this.state = 'committed';

    return {
      success: true,
      schema: this.workingSchema,
      errors: [],
      warnings: validation.warnings,
    };
  }

  /** Explicit rollback — discard all changes */
  rollback(): TransactionResult {
    this.assertOpen();
    this.state = 'rolled-back';

    return {
      success: false,
      schema: this.steps.length > 0 ? this.steps[0].snapshot : this.schema,
      errors: ['Transaction explicitly rolled back'],
      warnings: [],
    };
  }

  // ─── Getters ───────────────────────────────────────────────────────

  getSteps(): ReadonlyArray<StepRecord> {
    return this.steps;
  }

  getStepCount(): number {
    return this.steps.length;
  }

  isCommitted(): boolean {
    return this.state === 'committed';
  }

  isRolledBack(): boolean {
    return this.state === 'rolled-back';
  }

  // ─── Internal Helpers ─────────────────────────────────────────────

  private assertOpen(): void {
    if (this.state !== 'open') {
      throw new Error(`Transaction is already ${this.state}. Create a new transaction.`);
    }
  }

  private cloneSchema(): ScreenSchema {
    return JSON.parse(JSON.stringify(this.workingSchema));
  }

  private resolveContainer(draft: ScreenSchema, ref: ContainerRef): SchemaBlock[] | null {
    switch (ref.type) {
      case 'root':
        return draft.blocks;
      case 'materi-section':
      case 'ftab':
      case 'children': {
        const parent = this.findBlockInTree(draft.blocks, ref.id ?? '');
        if (!parent) return null;
        if (ref.type === 'ftab') {
          const blockAny = parent as Record<string, unknown>;
          const tabs = blockAny.tabs as Array<Record<string, unknown>> | undefined;
          if (tabs && ref.tabIndex != null) {
            return tabs[ref.tabIndex]?.content as SchemaBlock[] | null ?? null;
          }
        }
        return parent.children ?? null;
      }
      default:
        return null;
    }
  }

  private findBlockInTree(blocks: SchemaBlock[], id: string): SchemaBlock | null {
    for (const block of blocks) {
      if (block.id === id) return block;
      if (block.children) {
        const found = this.findBlockInTree(block.children, id);
        if (found) return found;
      }
      // Also search in composite containers
      const blockAny = block as Record<string, unknown>;
      if (blockAny.items && Array.isArray(blockAny.items)) {
        const found = this.findBlockInTree(blockAny.items as SchemaBlock[], id);
        if (found) return found;
      }
      if (blockAny.tabs && Array.isArray(blockAny.tabs)) {
        for (const tab of blockAny.tabs as Array<Record<string, unknown>>) {
          if (tab.content && Array.isArray(tab.content)) {
            const found = this.findBlockInTree(tab.content as SchemaBlock[], id);
            if (found) return found;
          }
        }
      }
    }
    return null;
  }

  private removeBlockFromTree(blocks: SchemaBlock[], id: string): [SchemaBlock] | null {
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].id === id) {
        return blocks.splice(i, 1) as [SchemaBlock];
      }
      if (blocks[i].children) {
        const found = this.removeBlockFromTree(blocks[i].children!, id);
        if (found) return found;
      }
      // Also search in composite containers
      const blockAny = blocks[i] as Record<string, unknown>;
      if (blockAny.items && Array.isArray(blockAny.items)) {
        const found = this.removeBlockFromTree(blockAny.items as SchemaBlock[], id);
        if (found) return found;
      }
      if (blockAny.tabs && Array.isArray(blockAny.tabs)) {
        for (const tab of blockAny.tabs as Array<Record<string, unknown>>) {
          if (tab.content && Array.isArray(tab.content)) {
            const found = this.removeBlockFromTree(tab.content as SchemaBlock[], id);
            if (found) return found;
          }
        }
      }
    }
    return null;
  }

  private deepCloneWithNewIds(block: SchemaBlock): SchemaBlock {
    const clone: SchemaBlock = {
      ...block,
      id: nanoid(10),
    };

    if (clone.children) {
      clone.children = clone.children.map(child => this.deepCloneWithNewIds(child));
    }
    // Also clone composite container children
    const cloneAny = clone as Record<string, unknown>;
    if (cloneAny.items && Array.isArray(cloneAny.items)) {
      cloneAny.items = (cloneAny.items as SchemaBlock[]).map(item => this.deepCloneWithNewIds(item));
    }
    if (cloneAny.tabs && Array.isArray(cloneAny.tabs)) {
      cloneAny.tabs = (cloneAny.tabs as Array<Record<string, unknown>>).map(tab => {
        if (tab.content && Array.isArray(tab.content)) {
          return { ...tab, content: (tab.content as SchemaBlock[]).map((c: SchemaBlock) => this.deepCloneWithNewIds(c)) };
        }
        return tab;
      });
    }

    return clone;
  }

  /**
   * Strip forbidden runtime fields from blocks.
   * Dev-mode defensive measure — the source of the leak should still be fixed.
   */
  private stripForbiddenFields(blocks: SchemaBlock[], forbiddenFields: Set<string>): void {
    for (const block of blocks) {
      const record = block as unknown as Record<string, unknown>;
      for (const field of forbiddenFields) {
        delete record[field];
      }
      if (block.children) this.stripForbiddenFields(block.children, forbiddenFields);
      // Also strip from composite containers
      const blockAny = block as Record<string, unknown>;
      if (blockAny.items && Array.isArray(blockAny.items)) {
        this.stripForbiddenFields(blockAny.items as SchemaBlock[], forbiddenFields);
      }
      if (blockAny.tabs && Array.isArray(blockAny.tabs)) {
        for (const tab of blockAny.tabs as Array<Record<string, unknown>>) {
          if (tab.content && Array.isArray(tab.content)) {
            this.stripForbiddenFields(tab.content as SchemaBlock[], forbiddenFields);
          }
        }
      }
    }
  }
}

// ─── Factory ───────────────────────────────────────────────────────────

/**
 * Create a new transaction for atomic schema mutation.
 * All changes are staged until commit() is called.
 * If commit validation fails, auto-rollback kicks in.
 */
export function createTransaction(
  schema: ScreenSchema,
  validator?: (schema: ScreenSchema) => ValidationResult
): Transaction {
  return new Transaction(schema, validator);
}
