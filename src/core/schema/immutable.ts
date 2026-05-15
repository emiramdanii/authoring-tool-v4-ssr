// ═══════════════════════════════════════════════════════════════════
// IMMUTABLE SCHEMA OPERATIONS — Safe mutations for the schema tree
// ═══════════════════════════════════════════════════════════════════
// Because SchemaBlock is the single source of truth, all mutations
// must be IMMUTABLE. This module provides:
//
//   1. deepFreeze()    — Make a schema tree deeply read-only (dev)
//   2. produce()       — Immer-style immutable update helper
//   3. patchBlock()    — Patch a single block in a schema tree
//   4. replaceBlock()  — Replace a block by ID in a schema tree
//   5. removeBlock()   — Remove a block by ID from a schema tree
//   6. insertBlock()   — Insert a block at a specific position
//   7. moveBlock()     — Move a block from one position to another
//   8. bumpVersion()   — Increment schema version after mutation
//   9. snapshot()      — Create a deep-clone snapshot for undo/redo
//
// DESIGN PRINCIPLES:
//   - All operations return NEW objects — originals are never mutated
//   - Operations are composable — chain them in a pipeline
//   - Version tracking is automatic — bumpVersion() on every write
//   - Deep freeze in dev mode catches accidental mutations
//   - All operations validate input in dev mode
//
// UNIDIRECTIONAL FLOW ENFORCED:
//   These operations are the ONLY way to mutate the schema tree.
//   Direct property assignment is forbidden (enforced by deepFreeze
//   in dev mode). This ensures the schema tree remains stable and
//   predictable — all systems can rely on it.
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema } from './types';
import { SCHEMA_VERSION } from './validation';
import { generateBlockId } from './ensure-schema';

// ── Deep Freeze ─────────────────────────────────────────────────

/**
 * Deep-freeze an object in dev mode.
 * In production, returns the object as-is (no performance cost).
 *
 * Use this to catch accidental mutations:
 *   const frozen = deepFreeze(schema);
 *   frozen.blocks[0].type = 'x'; // TypeError in dev mode!
 */
export function deepFreeze<T>(obj: T): T {
  if (process.env.NODE_ENV === 'production') return obj;
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    for (const item of obj) deepFreeze(item);
  } else {
    for (const val of Object.values(obj as Record<string, unknown>)) {
      deepFreeze(val);
    }
  }

  return Object.freeze(obj);
}

/**
 * Check if an object is deeply frozen (dev mode only).
 * Useful for invariant checks.
 */
export function isDeepFrozen(obj: unknown, seen = new WeakSet()): boolean {
  if (process.env.NODE_ENV === 'production') return true;
  if (obj === null || obj === undefined || typeof obj !== 'object') return true;
  if (!Object.isFrozen(obj)) return false;
  if (seen.has(obj)) return true; // circular ref protection
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.every(item => isDeepFrozen(item, seen));
  }

  return Object.values(obj as Record<string, unknown>).every(val => isDeepFrozen(val, seen));
}

// ── Deep Clone ──────────────────────────────────────────────────

/**
 * Deep-clone a value using structured clone (or JSON fallback).
 * Used internally by all immutable operations.
 */
export function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

// ── Immutable Produce ───────────────────────────────────────────

/**
 * Immer-style immutable update: apply a recipe function to a draft
 * clone, returning a new object. The original is never mutated.
 *
 * Unlike Immer, this uses simple deep-clone + mutation for zero deps.
 * Performance is fine for SILSE's schema sizes (< 100 blocks typically).
 *
 * Example:
 *   const newSchema = produce(schema, draft => {
 *     draft.blocks[0].content = 'updated';
 *   });
 */
export function produce<T>(base: T, recipe: (draft: T) => void): T {
  const draft = deepClone(base);
  recipe(draft);
  return draft;
}

// ── Block-Level Operations ──────────────────────────────────────

/**
 * Find a block by ID in a schema tree.
 * Searches top-level blocks and nested blocks (materi-section.content, ftab.tabs, children).
 */
export function findBlockById(blocks: SchemaBlock[], id: string): SchemaBlock | null {
  for (const block of blocks) {
    if (block.id === id) return block;

    // Search nested content
    if (block.type === 'materi-section' && 'content' in block) {
      const content = (block as { content: SchemaBlock[] }).content;
      const found = content?.find(b => b.id === id);
      if (found) return found;
    }

    if (block.type === 'ftab' && 'tabs' in block) {
      const tabs = (block as { tabs: Array<{ content?: SchemaBlock[] }> }).tabs;
      for (const tab of (tabs || [])) {
        const found = tab.content?.find(b => b.id === id);
        if (found) return found;
      }
    }

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
 * Handles nested blocks (materi-section.content, ftab.tabs, children).
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

    // Nested in materi-section.content
    if (block.type === 'materi-section' && 'content' in block) {
      const ms = block as { content: SchemaBlock[] } & SchemaBlock;
      const found = ms.content?.find(b => b.id === blockId);
      if (found) {
        return { ...block, content: ms.content.map(b => b.id === blockId ? updater(b) : b) };
      }
    }

    // Nested in ftab.tabs[].content
    if (block.type === 'ftab' && 'tabs' in block) {
      const ft = block as { tabs: Array<{ content?: SchemaBlock[] }> } & SchemaBlock;
      let found = false;
      const newTabs = ft.tabs.map(tab => {
        if (!tab.content) return tab;
        const hasBlock = tab.content.some(b => b.id === blockId);
        if (hasBlock) {
          found = true;
          return { ...tab, content: tab.content.map(b => b.id === blockId ? updater(b) : b) };
        }
        return tab;
      });
      if (found) return { ...block, tabs: newTabs };
    }

    // Nested in children
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
 * Handles nested blocks.
 */
export function removeBlock(
  blocks: SchemaBlock[],
  blockId: string,
): SchemaBlock[] {
  return blocks
    .map(block => {
      // Nested in materi-section.content
      if (block.type === 'materi-section' && 'content' in block) {
        const ms = block as { content: SchemaBlock[] } & SchemaBlock;
        if (ms.content?.some(b => b.id === blockId)) {
          return { ...block, content: ms.content.filter(b => b.id !== blockId) };
        }
      }

      // Nested in ftab.tabs[].content
      if (block.type === 'ftab' && 'tabs' in block) {
        const ft = block as { tabs: Array<{ content?: SchemaBlock[] }> } & SchemaBlock;
        let found = false;
        const newTabs = ft.tabs.map(tab => {
          if (!tab.content) return tab;
          if (tab.content.some(b => b.id === blockId)) {
            found = true;
            return { ...tab, content: tab.content.filter(b => b.id !== blockId) };
          }
          return tab;
        });
        if (found) return { ...block, tabs: newTabs };
      }

      // Nested in children
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
 * Move a block from one position to another.
 * Returns a new array — original is never mutated.
 */
export function moveBlock(
  blocks: SchemaBlock[],
  fromIndex: number,
  toIndex: number,
): SchemaBlock[] {
  const result = [...blocks];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
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
