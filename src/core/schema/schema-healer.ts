// ═══════════════════════════════════════════════════════════════════
// SCHEMA HEALER — Advanced corruption repair beyond basic recovery
// ═══════════════════════════════════════════════════════════════════
// FASE 6.2: While schema-recovery.ts handles BASIC recovery (try
// ensurePageSchema, filter invalid blocks, give up), the Schema
// Healer goes much deeper:
//
//   1. Block-level healing — fix individual malformed blocks
//   2. Structure repair — fix broken composite/nested relationships
//   3. Data salvage — extract usable content from corrupted blocks
//   4. Cascade repair — fix parent-child inconsistencies
//   5. Schema integrity repair — fix missing fields, strip invalid
//
// HEALING STRATEGIES:
//   Strategy 1: Mild — normalize missing defaults (IDs, compression, layout)
//   Strategy 2: Moderate — reconstruct missing content from partial data
//   Strategy 3: Aggressive — convert unrecognizable blocks to generic fallbacks
//   Strategy 4: Emergency — remove unrecoverable blocks, keep the rest
//
// GUARANTEES:
//   - healer.heal() NEVER returns null — always returns a valid schema
//   - Even if ALL blocks are corrupted, returns a minimal valid schema
//   - Healing report documents exactly what was repaired
//   - Original schema is NEVER mutated
//
// USAGE:
//   import { schemaHealer } from '@/core/schema/schema-healer';
//
//   const result = schemaHealer.heal(malformedSchema);
//   if (result.repairedCount > 0) {
//     console.warn('Schema was corrupted — repaired:', result.report);
//     // Use result.schema — it's now valid
//   }
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema, CompressionHints, BlockLayout } from './types';
import { normalizeBlock, normalizeBlocks } from '../editor/commands/normalize';
import { validateSchema, validateBlock, type ValidationResult, type ValidationError } from './validation';
import { generateBlockId } from './ensure-schema';
import { regenerateNestedIds } from './immutable';
import { commitSchemaUpdate } from './commit-update';
import { isCompositeBlockType, getCompositeContainerDescriptor } from './capability-registry';
import { logger } from '../utils/logger';

// ── Healing Strategy ─────────────────────────────────────────────

export type HealingStrategy = 'mild' | 'moderate' | 'aggressive' | 'emergency';

// ── Healing Report ───────────────────────────────────────────────

export interface HealingAction {
  /** What was done */
  action: string;
  /** Which block was affected */
  blockId?: string;
  /** Block type */
  blockType?: string;
  /** Path in the schema */
  path: string;
  /** Strategy used */
  strategy: HealingStrategy;
  /** Before value (description) */
  before?: string;
  /** After value (description) */
  after?: string;
}

export interface HealingReport {
  /** Total blocks examined */
  blocksExamined: number;
  /** Blocks that needed repair */
  repairedCount: number;
  /** Blocks that were removed (unrecoverable) */
  removedCount: number;
  /** Blocks that were converted to fallbacks */
  fallbackCount: number;
  /** Strategy used for healing */
  strategy: HealingStrategy;
  /** Individual actions taken */
  actions: HealingAction[];
  /** Validation result BEFORE healing */
  beforeValidation: ValidationResult;
  /** Validation result AFTER healing */
  afterValidation: ValidationResult;
  /** Duration of healing in ms */
  durationMs: number;
}

export interface HealResult {
  /** The healed schema (ALWAYS valid) */
  schema: ScreenSchema;
  /** Whether any repairs were made */
  wasRepaired: boolean;
  /** Detailed healing report */
  report: HealingReport;
}

// ── Schema Healer Class ──────────────────────────────────────────

export class SchemaHealer {
  // ── Main Healing Entry Point ───────────────────────────────────

  /**
   * Heal a potentially corrupted ScreenSchema.
   * Returns a HealResult with the repaired schema and detailed report.
   *
   * This method NEVER returns null and NEVER throws.
   * Even completely corrupted schemas get a minimal valid fallback.
   */
  heal(schema: ScreenSchema, strategy: HealingStrategy = 'moderate'): HealResult {
    const startTime = performance.now();
    const actions: HealingAction[] = [];

    // Capture pre-healing validation state
    const beforeValidation = this.safeValidate(schema);

    // If the schema is already valid, return immediately
    if (beforeValidation.valid && strategy === 'mild') {
      return {
        schema,
        wasRepaired: false,
        report: {
          blocksExamined: schema.blocks.length,
          repairedCount: 0,
          removedCount: 0,
          fallbackCount: 0,
          strategy,
          actions: [],
          beforeValidation,
          afterValidation: beforeValidation,
          durationMs: performance.now() - startTime,
        },
      };
    }

    let healedBlocks: SchemaBlock[] = [];
    let removedCount = 0;
    let fallbackCount = 0;
    let repairedCount = 0;

    // ── Step 1: Ensure schema shell is valid ────────────────────
    let workingSchema: ScreenSchema = {
      id: schema.id || 'healed',
      templateType: schema.templateType || 'custom',
      version: schema.version || 1,
      blocks: Array.isArray(schema.blocks) ? [...schema.blocks] : [],
      ...(schema.background ? { background: schema.background } : {}),
      ...(schema.nav ? { nav: schema.nav } : {}),
    };

    // ── Step 2: Heal each block ─────────────────────────────────
    const inputBlocks = workingSchema.blocks;
    const healedBlockList: SchemaBlock[] = [];

    for (let i = 0; i < inputBlocks.length; i++) {
      const block = inputBlocks[i];
      const blockResult = this.healBlock(block, strategy, `blocks[${i}]`, actions);

      if (blockResult === null) {
        // Block is unrecoverable — remove it
        removedCount++;
        actions.push({
          action: 'removed-unrecoverable',
          blockId: block?.id,
          blockType: block?.type,
          path: `blocks[${i}]`,
          strategy,
          before: `${block?.type ?? 'unknown'} block`,
          after: 'removed',
        });
        continue;
      }

      if (blockResult !== block) {
        // Block was repaired
        repairedCount++;
      }

      healedBlockList.push(blockResult);
    }

    // ── Step 3: Normalize all healed blocks ─────────────────────
    const normalizeResult = normalizeBlocks(healedBlockList, {
      source: 'schema-healer',
      stripRuntimeState: true,
      fillCompressionDefaults: true,
    });

    for (const warning of normalizeResult.warnings) {
      actions.push({
        action: 'normalize-warning',
        path: 'blocks',
        strategy,
        after: warning,
      });
    }

    healedBlocks = normalizeResult.blocks;

    // ── Step 4: Repair composite block relationships ────────────
    healedBlocks = this.repairCompositeRelationships(healedBlocks, strategy, actions);

    // ── Step 5: Remove duplicate IDs ────────────────────────────
    healedBlocks = this.deduplicateBlockIds(healedBlocks, actions);

    // ── Step 6: Build final schema ──────────────────────────────
    workingSchema = {
      ...workingSchema,
      blocks: healedBlocks,
    };

    // Version bump via commit pipeline
    try {
      workingSchema = commitSchemaUpdate(workingSchema, healedBlocks);
    } catch {
      // If commitSchemaUpdate fails, just use the healed blocks directly
      workingSchema = { ...workingSchema, blocks: healedBlocks };
    }

    // ── Step 7: Validate the result ─────────────────────────────
    const afterValidation = this.safeValidate(workingSchema);

    // If still invalid after healing, try more aggressive strategy
    if (!afterValidation.valid && strategy !== 'emergency') {
      const nextStrategy: HealingStrategy = strategy === 'mild' ? 'moderate' : strategy === 'moderate' ? 'aggressive' : 'emergency';
      logger.warn('SCHEMA-HEALER', `Schema still invalid after ${strategy} healing — retrying with ${nextStrategy}`);
      return this.heal(workingSchema, nextStrategy);
    }

    // If emergency strategy still fails, return minimal schema
    if (!afterValidation.valid && strategy === 'emergency') {
      logger.error('SCHEMA-HEALER', 'Emergency healing failed — returning minimal fallback schema');
      workingSchema = this.createMinimalFallback(workingSchema);
    }

    const durationMs = performance.now() - startTime;

    return {
      schema: workingSchema,
      wasRepaired: repairedCount > 0 || removedCount > 0 || fallbackCount > 0,
      report: {
        blocksExamined: inputBlocks.length,
        repairedCount,
        removedCount,
        fallbackCount,
        strategy,
        actions,
        beforeValidation,
        afterValidation: this.safeValidate(workingSchema),
        durationMs,
      },
    };
  }

  // ── Block-Level Healing ─────────────────────────────────────────

  /**
   * Heal a single block. Returns the healed block or null if unrecoverable.
   */
  private healBlock(
    block: SchemaBlock,
    strategy: HealingStrategy,
    path: string,
    actions: HealingAction[]
  ): SchemaBlock | null {
    // Null/undefined block — unrecoverable
    if (!block || typeof block !== 'object') {
      return null;
    }

    // ── Strategy: Mild — just normalize ───────────────────────
    if (strategy === 'mild') {
      const result = normalizeBlock(block, { source: 'healer:mild' });
      if (result.wasModified) {
        actions.push({
          action: 'normalized',
          blockId: block.id,
          blockType: block.type,
          path,
          strategy,
          before: `raw block`,
          after: `normalized: ${result.changes.join(', ')}`,
        });
      }
      return result.block;
    }

    // ── Check: Is the block fundamentally broken? ──────────────
    const hasType = typeof block.type === 'string' && block.type.length > 0;

    if (!hasType) {
      // ── Strategy: Moderate — try to infer type from content ──
      if (strategy === 'moderate' || strategy === 'aggressive') {
        const inferredType = this.inferBlockType(block as Record<string, unknown>);
        if (inferredType) {
          actions.push({
            action: 'inferred-type',
            blockId: block.id,
            blockType: inferredType,
            path,
            strategy,
            before: 'missing type',
            after: inferredType,
          });
          const healed = { ...block, type: inferredType } as SchemaBlock;
          return normalizeBlock(healed, { source: 'healer:inferred-type' }).block;
        }
      }

      // ── Strategy: Aggressive — convert to generic fallback ──
      if (strategy === 'aggressive' || strategy === 'emergency') {
        actions.push({
          action: 'fallback-generic',
          blockId: block.id,
          blockType: 'unknown',
          path,
          strategy,
          before: 'unrecognizable block',
          after: 'generic fallback block',
        });
        return this.createFallbackBlock(block);
      }

      // ── Emergency: remove ──────────────────────────────────
      return null;
    }

    // ── Validate the block structure ─────────────────────────
    const validation = validateBlock(block);
    if (validation.valid) {
      // Block is valid — still normalize to ensure defaults
      return normalizeBlock(block, { source: 'healer:valid-check' }).block;
    }

    // ── Block has validation errors — try to repair ──────────
    let healed = { ...block } as SchemaBlock;
    let wasRepaired = false;

    for (const error of validation.errors) {
      const repairResult = this.repairValidationError(healed, error, strategy, path, actions);
      if (repairResult) {
        healed = repairResult;
        wasRepaired = true;
      }
    }

    // Re-validate after repairs
    const revalidation = validateBlock(healed);
    if (revalidation.valid) {
      return normalizeBlock(healed, { source: 'healer:repaired' }).block;
    }

    // ── Still invalid — try normalize as last resort ──────────
    const normResult = normalizeBlock(healed, { source: 'healer:post-repair', stripRuntimeState: true });
    if (normResult.wasModified) {
      return normResult.block;
    }

    // ── Strategy: Aggressive — convert to fallback ────────────
    if (strategy === 'aggressive' || strategy === 'emergency') {
      actions.push({
        action: 'fallback-after-repair-failed',
        blockId: healed.id,
        blockType: healed.type,
        path,
        strategy,
        before: `${validation.errors.length} unrepairable errors`,
        after: 'generic fallback',
      });
      return this.createFallbackBlock(healed);
    }

    // Moderate: keep as-is with warnings
    return healed;
  }

  // ── Error Repair ────────────────────────────────────────────────

  /**
   * Attempt to repair a specific validation error in a block.
   * Returns the repaired block or null if unrepairable.
   */
  private repairValidationError(
    block: SchemaBlock,
    error: ValidationError,
    strategy: HealingStrategy,
    path: string,
    actions: HealingAction[]
  ): SchemaBlock | null {
    const { message, path: errorPath } = error;

    // Fix: Block missing ID
    if (message.includes('must be a string') && errorPath.endsWith('.id')) {
      const newId = generateBlockId();
      actions.push({
        action: 'generated-id',
        blockId: block.id,
        blockType: block.type,
        path: errorPath,
        strategy,
        before: block.id ? `invalid id: ${block.id}` : 'missing id',
        after: newId,
      });
      return { ...block, id: newId } as SchemaBlock;
    }

    // Fix: Invalid compression
    if (errorPath.includes('.compression')) {
      const DEFAULT_COMPRESSION: CompressionHints = { priority: 'medium', strategy: 'none' };
      actions.push({
        action: 'fixed-compression',
        blockId: block.id,
        blockType: block.type,
        path: errorPath,
        strategy,
        before: `invalid compression`,
        after: 'default compression',
      });
      return { ...block, compression: DEFAULT_COMPRESSION } as SchemaBlock;
    }

    // Fix: Invalid layout
    if (errorPath.includes('.layout')) {
      const DEFAULT_LAYOUT: BlockLayout = { position: 'flow' };
      actions.push({
        action: 'fixed-layout',
        blockId: block.id,
        blockType: block.type,
        path: errorPath,
        strategy,
        before: 'invalid layout',
        after: 'default flow layout',
      });
      return { ...block, layout: DEFAULT_LAYOUT } as SchemaBlock;
    }

    // Fix: Non-serializable value
    if (message.includes('Function') || message.includes('Symbol') || message.includes('DOM Node')) {
      const fieldName = errorPath.split('.').pop();
      if (fieldName && fieldName in (block as Record<string, unknown>)) {
        actions.push({
          action: 'stripped-non-serializable',
          blockId: block.id,
          blockType: block.type,
          path: errorPath,
          strategy,
          before: `${fieldName}: non-serializable`,
          after: `${fieldName}: removed`,
        });
        const cleaned = { ...block } as Record<string, unknown>;
        delete cleaned[fieldName];
        return cleaned as SchemaBlock;
      }
    }

    // Fix: Circular reference
    if (message.includes('Circular reference')) {
      actions.push({
        action: 'regenerated-ids-for-circular',
        blockId: block.id,
        blockType: block.type,
        path: errorPath,
        strategy,
        before: 'circular reference detected',
        after: 'IDs regenerated',
      });
      const healed = { ...block };
      regenerateNestedIds(healed);
      return healed;
    }

    return null;
  }

  // ── Type Inference ──────────────────────────────────────────────

  /**
   * Try to infer a block's type from its content fields.
   * Returns the inferred type or null if can't determine.
   */
  private inferBlockType(block: Record<string, unknown>): string | null {
    // Check content-based hints
    const b = block as Record<string, unknown>;
    if (b.questions && Array.isArray(b.questions)) {
      const q0 = (b.questions as Array<Record<string, unknown>>)[0];
      if (q0?.opts) return 'kuis';
      if (q0?.q && q0?.opts) return 'kuis';
      if (q0?.text && q0?.correct !== undefined) return 'true-false-game';
      if (q0?.text && q0?.answer) return 'fill-blank-game';
    }

    if (b.pool && b.kolom) return 'sortir-game';
    if (b.pairs && Array.isArray(b.pairs)) {
      const p0 = (b.pairs as Array<Record<string, unknown>>)[0];
      if (p0?.left && p0?.right) return 'matching-game';
    }
    if (b.words && Array.isArray(b.words)) return 'word-search-game';
    if (b.chapters && Array.isArray(b.chapters)) return 'skenario';
    if (b.steps && Array.isArray(b.steps)) {
      const s0 = (b.steps as Array<Record<string, unknown>>)[0];
      if (s0?.dot) return 'alur';
      if (s0?.icon) return 'timeline';
    }
    if (b.cards && Array.isArray(b.cards)) {
      const c0 = (b.cards as Array<Record<string, unknown>>)[0];
      if (c0?.q && c0?.a) return 'flashcard-set';
      if (c0?.icon && c0?.title) return 'nc-grid';
    }
    if (b.tabs && Array.isArray(b.tabs)) return 'ftab';
    if (b.content && Array.isArray(b.content) && b.title) return 'materi-section';
    if (b.badges && b.title && b.subtitle) return 'cover';
    if (b.items && b.title) {
      const i0 = (b.items as Array<Record<string, unknown>>)[0];
      if (i0?.num && i0?.verb) return 'tp';
      if (i0?.icon && i0?.title && i0?.body) return 'petunjuk';
    }
    if (b.content && typeof b.content === 'string') return 'def-box';

    return null;
  }

  // ── Composite Block Repair ──────────────────────────────────────

  /**
   * Repair relationships in composite blocks (ftab tabs, materi-section content).
   */
  private repairCompositeRelationships(
    blocks: SchemaBlock[],
    strategy: HealingStrategy,
    actions: HealingAction[]
  ): SchemaBlock[] {
    return blocks.map((block, idx) => {
      if (!isCompositeBlockType(block.type)) return block;

      const descriptor = getCompositeContainerDescriptor(block.type);
      if (!descriptor) return block;

      const healed = { ...block } as Record<string, unknown>;

      if (descriptor.structure === 'direct') {
        const children = healed[descriptor.accessor] as SchemaBlock[] | undefined;
        if (children && Array.isArray(children)) {
          const healedChildren = children
            .map((child, childIdx) => {
              const result = this.healBlock(child, strategy, `blocks[${idx}].${descriptor.accessor}[${childIdx}]`, actions);
              return result;
            })
            .filter((child): child is SchemaBlock => child !== null);

          if (healedChildren.length !== children.length) {
            actions.push({
              action: 'repaired-composite-children',
              blockId: block.id,
              blockType: block.type,
              path: `blocks[${idx}].${descriptor.accessor}`,
              strategy,
              before: `${children.length} children`,
              after: `${healedChildren.length} children (removed ${children.length - healedChildren.length} corrupted)`,
            });
          }

          healed[descriptor.accessor] = healedChildren;
        }
      } else if (descriptor.structure === 'tabular') {
        const tabs = healed[descriptor.accessor] as Array<Record<string, unknown>> | undefined;
        if (tabs && Array.isArray(tabs)) {
          const contentKey = descriptor.tabContentKey || 'content';
          for (let t = 0; t < tabs.length; t++) {
            const tabContent = tabs[t][contentKey] as SchemaBlock[] | undefined;
            if (tabContent && Array.isArray(tabContent)) {
              const healedContent = tabContent
                .map((child, childIdx) => {
                  const result = this.healBlock(child, strategy, `blocks[${idx}].${descriptor.accessor}[${t}].${contentKey}[${childIdx}]`, actions);
                  return result;
                })
                .filter((child): child is SchemaBlock => child !== null);

              tabs[t][contentKey] = healedContent;
            }
          }
        }
      }

      return healed as SchemaBlock;
    });
  }

  // ── Duplicate ID Resolution ─────────────────────────────────────

  /**
   * Find and resolve duplicate block IDs.
   */
  private deduplicateBlockIds(blocks: SchemaBlock[], actions: HealingAction[]): SchemaBlock[] {
    const seenIds = new Map<string, number>();
    let hasDuplicates = false;

    function collectIds(block: SchemaBlock): void {
      if (block.id) {
        const count = seenIds.get(block.id) ?? 0;
        seenIds.set(block.id, count + 1);
        if (count > 0) hasDuplicates = true;
      }
      if (block.children) block.children.forEach(collectIds);
      // Composite children
      if (isCompositeBlockType(block.type)) {
        const descriptor = getCompositeContainerDescriptor(block.type);
        if (descriptor) {
          if (descriptor.structure === 'direct') {
            const content = (block as Record<string, unknown>)[descriptor.accessor] as SchemaBlock[] | undefined;
            content?.forEach(collectIds);
          } else if (descriptor.structure === 'tabular') {
            const tabs = (block as Record<string, unknown>)[descriptor.accessor] as Array<Record<string, unknown>> | undefined;
            tabs?.forEach(tab => {
              const tabContent = tab[descriptor.tabContentKey || 'content'] as SchemaBlock[] | undefined;
              tabContent?.forEach(collectIds);
            });
          }
        }
      }
    }

    blocks.forEach(collectIds);

    if (!hasDuplicates) return blocks;

    // Regenerate IDs for duplicate blocks
    const usedIds = new Set<string>();
    const deduped = blocks.map(block => {
      const result = this.deduplicateBlockTree(block, usedIds, actions);
      return result;
    });

    return deduped;
  }

  private deduplicateBlockTree(
    block: SchemaBlock,
    usedIds: Set<string>,
    actions: HealingAction[]
  ): SchemaBlock {
    let healed = { ...block };

    if (healed.id && usedIds.has(healed.id)) {
      const newId = generateBlockId();
      actions.push({
        action: 'deduplicated-id',
        blockId: healed.id,
        blockType: healed.type,
        path: healed.id,
        strategy: 'moderate',
        before: `duplicate id: ${healed.id}`,
        after: `new id: ${newId}`,
      });
      healed = { ...healed, id: newId };
    }

    if (healed.id) usedIds.add(healed.id);

    // Recurse into children
    if (healed.children) {
      healed = {
        ...healed,
        children: healed.children.map(child => this.deduplicateBlockTree(child, usedIds, actions)),
      };
    }

    return healed;
  }

  // ── Fallback Block Creation ─────────────────────────────────────

  /**
   * Create a generic fallback block from an unrecognizable block.
   * Preserves as much content as possible in a simple structure.
   */
  private createFallbackBlock(original: SchemaBlock): SchemaBlock {
    const block = original as Record<string, unknown>;
    const id = (block.id as string) || generateBlockId();

    // Try to salvage text content
    const textContent = block.content ?? block.text ?? block.body ?? block.isi ?? '';
    const title = block.title ?? block.judul ?? block.label ?? 'Konten';
    const icon = block.icon ?? block.emoji ?? '📄';

    return {
      type: 'def-box',
      id,
      content: typeof textContent === 'string' ? textContent : String(textContent || ''),
      borderColor: 'y',
      compression: { priority: 'low', strategy: 'none' },
      layout: { position: 'flow' },
      semantic: {
        topic: typeof title === 'string' ? title : 'Recovered content',
        importance: 0.3,
      },
    } as SchemaBlock;
  }

  /**
   * Create a minimal valid fallback schema when all else fails.
   */
  private createMinimalFallback(original: ScreenSchema): ScreenSchema {
    return {
      id: original.id || 'recovered',
      templateType: 'custom',
      version: 1,
      blocks: [{
        type: 'def-box',
        id: generateBlockId(),
        content: 'Konten halaman ini sedang dipulihkan. Data sebelumnya mungkin tidak lengkap.',
        borderColor: 'y',
        compression: { priority: 'high', strategy: 'none' },
        layout: { position: 'flow' },
      }],
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────

  private safeValidate(schema: ScreenSchema): ValidationResult {
    try {
      return validateSchema(schema);
    } catch {
      return {
        valid: false,
        errors: [{ path: 'schema', message: 'Validation itself failed — schema is deeply corrupted', severity: 'error' }],
        warnings: [],
      };
    }
  }

  /**
   * Quick check: does this schema need healing?
   */
  needsHealing(schema: ScreenSchema): boolean {
    const result = this.safeValidate(schema);
    return !result.valid;
  }

  /**
   * Get the severity of corruption in a schema.
   */
  getCorruptionLevel(schema: ScreenSchema): 'clean' | 'mild' | 'moderate' | 'severe' | 'critical' {
    const result = this.safeValidate(schema);

    if (result.valid) return 'clean';

    const errorCount = result.errors.length;

    if (!Array.isArray(schema.blocks)) return 'critical';
    if (schema.blocks.length === 0) return 'critical';

    const blockErrorRatio = errorCount / schema.blocks.length;

    if (blockErrorRatio <= 0.1) return 'mild';
    if (blockErrorRatio <= 0.3) return 'moderate';
    if (blockErrorRatio <= 0.7) return 'severe';
    return 'critical';
  }
}

// ── Global Singleton ─────────────────────────────────────────────

export const schemaHealer = new SchemaHealer();
