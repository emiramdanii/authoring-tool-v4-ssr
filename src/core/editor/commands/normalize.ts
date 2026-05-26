// ═══════════════════════════════════════════════════════════════════
// SCHEMA NORMALIZATION BOUNDARY — Block insert/update → normalize
// ═══════════════════════════════════════════════════════════════════
// FASE 5.3: Every block that enters the schema MUST be normalized.
// This catches:
//
//   1. Missing ID → generate stable ID
//   2. Missing type → reject (type is mandatory)
//   3. Unregistered type → warn but allow (custom blocks)
//   4. Missing compression hints → fill defaults from registry
//   5. Missing semantic hints → fill defaults from type
//   6. Duplicate nested IDs → regenerate
//   7. Runtime state leakage → strip forbidden fields
//   8. Invalid variant → default to 'A'
//   9. Missing layout → default to flow
//
// INVARIANTS AFTER NORMALIZATION:
//   - Block has a stable, unique ID
//   - Block has valid type field
//   - Block has compression hints (from type registry if not set)
//   - Block has no runtime state fields
//   - Nested children have unique IDs
//   - Variant is valid ('A' | 'B' | 'C')
//
// USAGE:
//   const normalized = normalizeBlock(rawBlock, { strict: true });
//   // Now safe to insert into schema
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, CompressionHints, SemanticHints, BlockLayout, BlockVariant, ScreenSchema } from '../../schema/types';
import { generateBlockId } from '../../schema/ensure-schema';
import { regenerateNestedIds } from '../../schema/immutable';
import { isCompositeBlockType, getCompositeContainerDescriptor } from '../../schema/capability-registry';
import { getBlockMeta, BLOCK_DEFINITIONS } from '../../registry/BlockDefinitionRegistry';
import { logger } from '../../utils/logger';

// ── Normalization Options ────────────────────────────────────────

export interface NormalizeOptions {
  /** Whether to throw on invalid blocks (default: false — warn instead) */
  strict?: boolean;
  /** Source of the block (for logging) */
  source?: string;
  /** Whether to regenerate IDs even if present */
  forceRegenerateIds?: boolean;
  /** Whether to fill default compression hints */
  fillCompressionDefaults?: boolean;
  /** Whether to strip runtime state fields */
  stripRuntimeState?: boolean;
}

// ── Normalization Result ─────────────────────────────────────────

export interface NormalizeResult {
  /** The normalized block */
  block: SchemaBlock;
  /** Warnings generated during normalization */
  warnings: string[];
  /** Whether the block was modified during normalization */
  wasModified: boolean;
  /** What fields were changed */
  changes: string[];
}

// ── Default Values ───────────────────────────────────────────────

const DEFAULT_COMPRESSION: CompressionHints = {
  priority: 'medium',
  strategy: 'none',
};

const DEFAULT_LAYOUT: BlockLayout = {
  position: 'flow',
};

const DEFAULT_VARIANT: BlockVariant = 'A';

// ── Runtime State Fields ─────────────────────────────────────────
// These fields must NEVER be in the schema (from session-state.ts)

const RUNTIME_STATE_FIELDS = new Set([
  'isSelected', 'isHovered', 'isFocused', 'isEditing', 'isResizing',
  'isDragging', 'isAnimating', 'animationProgress',
  'selectedBlockId', 'hoveredBlockId', 'focusedBlockId',
  'editingBlockId', 'resizingBlockId', 'draggingBlockId',
  'elementRef', 'containerRef', 'domNode',
  'measuredHeight', 'cachedLayout', 'renderCache',
  '_compressedHeight',
]);

// ── Core Normalization ───────────────────────────────────────────

/**
 * Normalize a SchemaBlock for safe insertion into the schema.
 * Returns a new block — the original is never modified.
 */
export function normalizeBlock(raw: SchemaBlock, options: NormalizeOptions = {}): NormalizeResult {
  const warnings: string[] = [];
  const changes: string[] = [];
  let block = { ...raw } as SchemaBlock;
  let wasModified = false;

  // ═══ 1. TYPE CHECK (mandatory) ═══════════════════════════════
  if (!block.type || typeof block.type !== 'string') {
    const msg = `Block missing type field — rejecting (source: ${options.source || 'unknown'})`;
    if (options.strict) {
      throw new Error(msg);
    }
    warnings.push(msg);
    // Can't normalize without type — return as-is with warnings
    return { block, warnings, wasModified: false, changes: [] };
  }

  // ═══ 2. ID CHECK ════════════════════════════════════════════
  if (!block.id || options.forceRegenerateIds) {
    if (!block.id) {
      changes.push('id: generated');
    } else {
      changes.push('id: regenerated');
    }
    block.id = generateBlockId();
    wasModified = true;
  }

  // ═══ 3. VARIANT CHECK ══════════════════════════════════════
  if (block.variant && !['A', 'B', 'C'].includes(block.variant)) {
    warnings.push(`Invalid variant "${block.variant}" — defaulting to "${DEFAULT_VARIANT}"`);
    block.variant = DEFAULT_VARIANT;
    changes.push('variant: fixed');
    wasModified = true;
  }

  // ═══ 4. LAYOUT DEFAULTS ════════════════════════════════════
  if (!block.layout) {
    block.layout = { ...DEFAULT_LAYOUT };
    changes.push('layout: added default');
    wasModified = true;
  } else {
    // Ensure position is set
    if (!block.layout.position) {
      block.layout = { ...block.layout, position: 'flow' };
      changes.push('layout.position: defaulted to flow');
      wasModified = true;
    }
  }

  // ═══ 5. COMPRESSION DEFAULTS ═══════════════════════════════
  if (options.fillCompressionDefaults !== false) {
    const def = getBlockMeta(block.type);
    if (!block.compression && def) {
      // Fill from registry defaults
      block.compression = {
        priority: 'medium' as const,
        strategy: 'none' as const,
      };
      changes.push('compression: added from registry');
      wasModified = true;
    } else if (!block.compression) {
      block.compression = { ...DEFAULT_COMPRESSION };
      changes.push('compression: added default');
      wasModified = true;
    } else {
      // Validate compression fields
      const validPriorities = new Set(['high', 'medium', 'low']);
      const validStrategies = new Set(['accordion', 'truncate', 'scroll', 'none']);
      if (!validPriorities.has(block.compression.priority)) {
        warnings.push(`Invalid compression priority "${block.compression.priority}" — defaulting to medium`);
        block.compression = { ...block.compression, priority: 'medium' };
        changes.push('compression.priority: fixed');
        wasModified = true;
      }
      if (!validStrategies.has(block.compression.strategy)) {
        warnings.push(`Invalid compression strategy "${block.compression.strategy}" — defaulting to none`);
        block.compression = { ...block.compression, strategy: 'none' };
        changes.push('compression.strategy: fixed');
        wasModified = true;
      }
    }
  }

  // ═══ 6. STRIP RUNTIME STATE ════════════════════════════════
  if (options.stripRuntimeState !== false) {
    const strippedFields: string[] = [];
    const blockKeys = Object.keys(block);
    for (const key of blockKeys) {
      if (RUNTIME_STATE_FIELDS.has(key)) {
        delete (block as Record<string, unknown>)[key];
        strippedFields.push(key);
      }
    }
    if (strippedFields.length > 0) {
      warnings.push(`Stripped runtime state fields: ${strippedFields.join(', ')}`);
      changes.push(`runtime-state: stripped ${strippedFields.length} fields`);
      wasModified = true;
    }
  }

  // ═══ 7. COMPOSITE BLOCK NORMALIZATION ══════════════════════
  if (isCompositeBlockType(block.type)) {
    const descriptor = getCompositeContainerDescriptor(block.type);
    if (descriptor) {
      if (descriptor.structure === 'direct') {
        const children = (block as Record<string, unknown>)[descriptor.accessor] as SchemaBlock[] | undefined;
        if (children && Array.isArray(children)) {
          const normalizedChildren = children.map((child, i) => {
            const result = normalizeBlock(child, { ...options, source: `${block.type}.${descriptor.accessor}[${i}]` });
            warnings.push(...result.warnings);
            return result.block;
          });
          (block as Record<string, unknown>)[descriptor.accessor] = normalizedChildren;
        }
      } else if (descriptor.structure === 'tabular') {
        const tabs = (block as Record<string, unknown>)[descriptor.accessor] as Array<Record<string, unknown>> | undefined;
        if (tabs && Array.isArray(tabs)) {
          for (let t = 0; t < tabs.length; t++) {
            const content = tabs[t][descriptor.tabContentKey || 'content'] as SchemaBlock[] | undefined;
            if (content && Array.isArray(content)) {
              const normalizedContent = content.map((child, i) => {
                const result = normalizeBlock(child, { ...options, source: `${block.type}.tabs[${t}].content[${i}]` });
                warnings.push(...result.warnings);
                return result.block;
              });
              tabs[t][descriptor.tabContentKey || 'content'] = normalizedContent;
            }
          }
        }
      }
    }
  }

  // ═══ 8. GENERIC CHILDREN NORMALIZATION ═════════════════════
  if (block.children && Array.isArray(block.children)) {
    const normalizedChildren = block.children.map((child, i) => {
      const result = normalizeBlock(child, { ...options, source: `${block.type}.children[${i}]` });
      warnings.push(...result.warnings);
      return result.block;
    });
    block = { ...block, children: normalizedChildren };
  }

  // ═══ 9. DUPLICATE NESTED ID CHECK ══════════════════════════
  // Quick scan for duplicate IDs — if found, regenerate
  const allIds = collectBlockIds(block);
  const uniqueIds = new Set(allIds);
  if (allIds.length !== uniqueIds.size) {
    warnings.push(`Duplicate block IDs detected — regenerating nested IDs`);
    regenerateNestedIds(block);
    changes.push('nested-ids: regenerated due to duplicates');
    wasModified = true;
  }

  // ═══ LOG NORMALIZATION ══════════════════════════════════════
  if (wasModified && changes.length > 0) {
    logger.warn('NORMALIZE', `Block "${block.id}" (${block.type}) normalized: ${changes.join(', ')}`);
  }

  return { block, warnings, wasModified, changes };
}

/**
 * Normalize an array of blocks.
 * Returns new array — originals never modified.
 */
export function normalizeBlocks(blocks: SchemaBlock[], options: NormalizeOptions = {}): {
  blocks: SchemaBlock[];
  warnings: string[];
  modifiedCount: number;
} {
  const allWarnings: string[] = [];
  let modifiedCount = 0;
  const normalized = blocks.map(block => {
    const result = normalizeBlock(block, options);
    allWarnings.push(...result.warnings);
    if (result.wasModified) modifiedCount++;
    return result.block;
  });
  return { blocks: normalized, warnings: allWarnings, modifiedCount };
}

/**
 * Normalize a full ScreenSchema.
 * Returns new schema — original never modified.
 */
export function normalizeSchema(schema: ScreenSchema, options: NormalizeOptions = {}): {
  schema: ScreenSchema;
  warnings: string[];
  modifiedCount: number;
} {
  const { blocks, warnings, modifiedCount } = normalizeBlocks(schema.blocks, {
    ...options,
    source: options.source ?? `schema:${schema.id}`,
  });

  return {
    schema: {
      ...schema,
      blocks,
    },
    warnings,
    modifiedCount,
  };
}

// ── Helpers ──────────────────────────────────────────────────────

/** Collect all block IDs from a block tree */
function collectBlockIds(block: SchemaBlock): string[] {
  const ids: string[] = [];
  if (block.id) ids.push(block.id);

  if (block.children) {
    for (const child of block.children) {
      ids.push(...collectBlockIds(child));
    }
  }

  // Composite blocks
  if (isCompositeBlockType(block.type)) {
    const descriptor = getCompositeContainerDescriptor(block.type);
    if (descriptor) {
      if (descriptor.structure === 'direct') {
        const content = (block as Record<string, unknown>)[descriptor.accessor] as SchemaBlock[] | undefined;
        if (content) {
          for (const child of content) {
            ids.push(...collectBlockIds(child));
          }
        }
      } else if (descriptor.structure === 'tabular') {
        const tabs = (block as Record<string, unknown>)[descriptor.accessor] as Array<Record<string, unknown>> | undefined;
        if (tabs) {
          for (const tab of tabs) {
            const content = tab[descriptor.tabContentKey || 'content'] as SchemaBlock[] | undefined;
            if (content) {
              for (const child of content) {
                ids.push(...collectBlockIds(child));
              }
            }
          }
        }
      }
    }
  }

  return ids;
}

/**
 * Quick validation check — is this block safe to insert?
 * Returns true if the block passes basic sanity checks.
 */
export function isBlockInsertSafe(block: SchemaBlock): { safe: boolean; reason?: string } {
  if (!block.type || typeof block.type !== 'string') {
    return { safe: false, reason: 'Block missing type field' };
  }
  if (block.type.length === 0) {
    return { safe: false, reason: 'Block has empty type field' };
  }
  return { safe: true };
}
