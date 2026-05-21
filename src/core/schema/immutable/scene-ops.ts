// ═══════════════════════════════════════════════════════════════════
// SCENE OPERATIONS — Immutable scene-level and schema-level operations
// ═══════════════════════════════════════════════════════════════════
// These are document-level operations: split, merge, version bump,
// and snapshot for undo/redo. All return new objects.
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema } from '../types';
import { SCHEMA_VERSION } from '../validation';
import { generateBlockId, generatePageId } from '../ensure-schema';
import { produce, deepClone } from './core';

// ── Scene-Level Operations ──────────────────────────────────────

/**
 * Split a ScreenSchema's blocks into two schemas at a given block boundary.
 *
 * This is a DOCUMENT-LEVEL operation — it creates two separate ScreenSchemas
 * that can be persisted as two pages. This is different from the runtime
 * SceneOverflowEngine which derives a layout plan without modifying source.
 *
 * Use case: User manually splits a page into two pages in the editor.
 *
 * @param schema - Source schema to split
 * @param splitAfterBlockId - The last block ID in the first half
 * @returns Tuple of [firstSchema, secondSchema]
 */
export function splitScene(
  schema: ScreenSchema,
  splitAfterBlockId: string,
): [ScreenSchema, ScreenSchema] | null {
  const splitIdx = schema.blocks.findIndex(b => b.id === splitAfterBlockId);
  if (splitIdx < 0) return null;

  const firstBlocks = schema.blocks.slice(0, splitIdx + 1);
  const secondBlocks = schema.blocks.slice(splitIdx + 1);

  if (secondBlocks.length === 0) return null; // Nothing to split after

  const firstSchema: ScreenSchema = {
    ...schema,
    blocks: deepClone(firstBlocks),
    version: (schema.version || 1) + 1,
  };

  const secondSchema: ScreenSchema = {
    id: generatePageId(),
    version: 1,
    templateType: schema.templateType,
    sectionLabel: schema.sectionLabel,
    sectionColor: schema.sectionColor,
    blocks: deepClone(secondBlocks),
    nav: schema.nav ? { ...schema.nav } : undefined,
    background: schema.background ? { ...schema.background } : undefined,
  };

  return [firstSchema, secondSchema];
}

/**
 * Merge two ScreenSchemas by concatenating their blocks.
 *
 * The first schema is the "primary" — its metadata (id, templateType, etc.)
 * is preserved. The second schema's blocks are appended.
 *
 * Use case: User merges two pages into one in the editor.
 *
 * @param first - Primary schema (metadata preserved)
 * @param second - Secondary schema (blocks appended, then discarded)
 * @returns Merged schema
 */
export function mergeScene(
  first: ScreenSchema,
  second: ScreenSchema,
): ScreenSchema {
  // Detect duplicate IDs and regenerate for second schema's blocks
  const firstIds = new Set(first.blocks.filter(b => b.id).map(b => b.id!));
  const secondBlocks = deepClone(second.blocks).map(block => {
    if (block.id && firstIds.has(block.id)) {
      return { ...block, id: generateBlockId() };
    }
    return block;
  });

  return {
    ...first,
    blocks: [...first.blocks, ...secondBlocks],
    version: (first.version || 1) + 1,
  };
}

// ── Schema-Level Operations ─────────────────────────────────────

/**
 * Apply an immutable update to a ScreenSchema.
 * Automatically bumps the version number.
 *
 * Example:
 *   const newSchema = updateSchema(schema, draft => {
 *     draft.blocks = replaceBlock(draft.blocks, 'abc', { ...patch });
 *   });
 */
export function updateSchema(
  schema: ScreenSchema,
  updater: (draft: ScreenSchema) => void,
): ScreenSchema {
  const result = produce(schema, draft => {
    updater(draft);
    // Auto-bump version
    draft.version = (draft.version || SCHEMA_VERSION) + 1;
  });
  return result;
}

/**
 * Bump the schema version after a mutation.
 * Call this after any write operation that doesn't go through updateSchema().
 */
export function bumpVersion(schema: ScreenSchema): ScreenSchema {
  return {
    ...schema,
    version: (schema.version || SCHEMA_VERSION) + 1,
  };
}

// ── Snapshot for Undo/Redo ──────────────────────────────────────

/**
 * Create a deep-clone snapshot of a schema for undo/redo history.
 * This is a cheap operation for typical SILSE schemas (< 100 blocks).
 */
export function snapshot(schema: ScreenSchema): ScreenSchema {
  return deepClone(schema);
}

/**
 * Create a snapshot of a block array (without ScreenSchema wrapper).
 */
export function snapshotBlocks(blocks: SchemaBlock[]): SchemaBlock[] {
  return deepClone(blocks);
}
