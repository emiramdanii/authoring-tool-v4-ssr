// ═══════════════════════════════════════════════════════════════════
// IMMUTABLE SCHEMA OPERATIONS — Safe mutations for the schema tree
// ═══════════════════════════════════════════════════════════════════
// Because SchemaBlock is the single source of truth, all mutations
// must be IMMUTABLE. This module provides:
//
//   1. deepFreeze()       — Make a schema tree deeply read-only (dev)
//   2. produce()          — Immer-style immutable update helper
//   3. patchBlock()       — Patch a single block in a schema tree
//   4. replaceBlock()     — Replace a block by ID in a schema tree
//   5. removeBlock()      — Remove a block by ID from a schema tree
//   6. insertBlock()      — Insert a block at a specific position
//   7. insertBlockNested()— Insert a block inside a container block
//   8. moveBlock()        — Move a block from one position to another (top-level)
//   9. moveBlockNested()  — Move a block within/between nested containers
//  10. duplicateBlock()   — Clone a block with a new ID
//  11. splitScene()       — Split schema blocks into two ScreenSchemas
//  12. mergeScene()       — Merge two ScreenSchemas' blocks into one
//  13. bumpVersion()      — Increment schema version after mutation
//  14. snapshot()         — Create a deep-clone snapshot for undo/redo
//
// DESIGN PRINCIPLES:
//   - All operations return NEW objects — originals are never mutated
//   - Operations are composable — chain them in a pipeline
//   - Version tracking is automatic — bumpVersion() on every write
//   - Deep freeze in dev mode catches accidental mutations
//   - All operations validate input in dev mode
//   - TREE-AWARE: Operations handle nested containers (materi-section,
//     ftab, children) transparently — no manual recursion needed
//
// UNIDIRECTIONAL FLOW ENFORCED:
//   These operations are the ONLY way to mutate the schema tree.
//   Direct property assignment is forbidden (enforced by deepFreeze
//   in dev mode). This ensures the schema tree remains stable and
//   predictable — all systems can rely on it.
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema } from './types';
import { SCHEMA_VERSION } from './validation';
import { generateBlockId, generatePageId } from './ensure-schema';

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
 * Move a block from one position to another (top-level only).
 * Returns a new array — original is never mutated.
 *
 * For moving blocks within nested containers, use moveBlockNested().
 */
export function moveBlock(
  blocks: SchemaBlock[],
  fromIndex: number,
  toIndex: number,
): SchemaBlock[] {
  if (fromIndex === toIndex) return blocks;
  if (fromIndex < 0 || fromIndex >= blocks.length || toIndex < 0 || toIndex >= blocks.length) {
    return blocks; // Invalid indices — return unchanged
  }
  const result = [...blocks];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}

/**
 * Move a block within a nested container or between containers.
 * Tree-aware: operates inside materi-section.content, ftab.tabs[].content,
 * or BaseBlock.children.
 *
 * Returns a new array — original is never mutated.
 *
 * @param blocks - Top-level blocks array
 * @param options - Move specification
 *
 * Examples:
 *   // Move block inside materi-section.content
 *   moveBlockNested(blocks, {
 *     blockId: 'child-1',
 *     targetContainer: { type: 'materi-section', id: 'ms-1' },
 *     toIndex: 2,
 *   })
 *
 *   // Move block from one ftab tab to another
 *   moveBlockNested(blocks, {
 *     blockId: 'child-1',
 *     sourceContainer: { type: 'ftab', id: 'ft-1', tabIndex: 0 },
 *     targetContainer: { type: 'ftab', id: 'ft-1', tabIndex: 1 },
 *     toIndex: 0,
 *   })
 *
 *   // Move block out of container to top-level
 *   moveBlockNested(blocks, {
 *     blockId: 'child-1',
 *     sourceContainer: { type: 'materi-section', id: 'ms-1' },
 *     targetContainer: { type: 'root' },
 *     toIndex: 3,
 *   })
 */
export function moveBlockNested(
  blocks: SchemaBlock[],
  options: {
    /** ID of the block to move */
    blockId: string;
    /** Source container (auto-detected if not provided) */
    sourceContainer?: ContainerRef;
    /** Target container — { type: 'root' } for top-level */
    targetContainer: ContainerRef;
    /** Target index within the container */
    toIndex?: number;
  },
): SchemaBlock[] {
  const { blockId, targetContainer, toIndex } = options;

  // Step 1: Find and extract the block from its current location
  let movedBlock: SchemaBlock | null = null;
  let result = blocks;

  // Search in top-level
  const topIdx = result.findIndex(b => b.id === blockId);
  if (topIdx >= 0) {
    movedBlock = result[topIdx];
    result = [...result.slice(0, topIdx), ...result.slice(topIdx + 1)];
  } else {
    // Search in nested containers — extract and return modified tree
    const extractResult = extractBlockFromNested(result, blockId);
    if (extractResult.block) {
      movedBlock = extractResult.block;
      result = extractResult.blocks;
    }
  }

  if (!movedBlock) return blocks; // Block not found — return unchanged

  // Step 2: Insert the block into the target container
  if (targetContainer.type === 'root') {
    // Insert at top-level
    const idx = toIndex ?? result.length;
    return [...result.slice(0, idx), movedBlock, ...result.slice(idx)];
  }

  // Insert into nested container
  return insertIntoContainer(result, movedBlock, targetContainer, toIndex);
}

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

/**
 * Insert a block into a nested container.
 * Tree-aware version of insertBlock() for containers.
 *
 * @param blocks - Top-level blocks array
 * @param block - Block to insert
 * @param container - Target container
 * @param toIndex - Position within container (default: append)
 */
export function insertBlockNested(
  blocks: SchemaBlock[],
  block: SchemaBlock,
  container: ContainerRef,
  toIndex?: number,
): SchemaBlock[] {
  const blockWithId = { ...block, id: block.id || generateBlockId() };

  if (container.type === 'root') {
    return insertBlock(blocks, blockWithId, { atIndex: toIndex });
  }

  return insertIntoContainer(blocks, blockWithId, container, toIndex);
}

/**
 * Duplicate a block by ID, creating a deep clone with a new ID.
 * Optionally inserts the clone immediately after the original.
 *
 * Returns the cloned block AND the new blocks array (if autoInsert=true).
 * The original blocks array is never mutated.
 *
 * @param blocks - Schema blocks array
 * @param blockId - ID of the block to duplicate
 * @param options - Duplicate options
 */
export function duplicateBlock(
  blocks: SchemaBlock[],
  blockId: string,
  options?: {
    /** Auto-insert the clone after the original (default: true) */
    autoInsert?: boolean;
    /** Custom ID for the clone (default: auto-generated) */
    newId?: string;
  },
): { clonedBlock: SchemaBlock; newBlocks: SchemaBlock[] } {
  const source = findBlockById(blocks, blockId);
  if (!source) {
    return { clonedBlock: source!, newBlocks: blocks }; // Should not happen, but safe fallback
  }

  const autoInsert = options?.autoInsert ?? true;
  const newId = options?.newId || generateBlockId();

  // Deep clone with new ID
  const clonedBlock = deepClone({ ...source, id: newId });

  // Also regenerate IDs for nested children to avoid duplicates
  regenerateNestedIds(clonedBlock);

  if (!autoInsert) {
    return { clonedBlock, newBlocks: blocks };
  }

  // Insert after the original block
  // Check if the original is in a nested container
  const topIdx = blocks.findIndex(b => b.id === blockId);
  if (topIdx >= 0) {
    // Top-level: insert after original
    const result = [...blocks];
    result.splice(topIdx + 1, 0, clonedBlock);
    return { clonedBlock, newBlocks: result };
  }

  // Nested: insert after original in its container
  const newBlocks = insertAfterInNested(blocks, blockId, clonedBlock);
  return { clonedBlock, newBlocks };
}

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

// ── Internal Helpers ────────────────────────────────────────────

/**
 * Extract a block from nested containers, returning the modified tree.
 */
function extractBlockFromNested(
  blocks: SchemaBlock[],
  blockId: string,
): { block: SchemaBlock | null; blocks: SchemaBlock[] } {
  let extracted: SchemaBlock | null = null;

  const result = blocks.map(block => {
    if (extracted) return block; // Already found — pass through

    // materi-section.content[]
    if (block.type === 'materi-section' && 'content' in block) {
      const ms = block as { content: SchemaBlock[] } & SchemaBlock;
      const idx = ms.content?.findIndex(b => b.id === blockId);
      if (idx != null && idx >= 0) {
        extracted = ms.content[idx];
        const newContent = [...ms.content.slice(0, idx), ...ms.content.slice(idx + 1)];
        return { ...block, content: newContent };
      }
    }

    // ftab.tabs[].content[]
    if (block.type === 'ftab' && 'tabs' in block) {
      const ft = block as { tabs: Array<{ content?: SchemaBlock[] }> } & SchemaBlock;
      const newTabs = ft.tabs.map((tab, tabIdx) => {
        if (!tab.content || extracted) return tab;
        const idx = tab.content.findIndex(b => b.id === blockId);
        if (idx >= 0) {
          extracted = tab.content[idx];
          return { ...tab, content: [...tab.content.slice(0, idx), ...tab.content.slice(idx + 1)] };
        }
        return tab;
      });
      if (extracted) {
        return { ...block, tabs: newTabs };
      }
    }

    // children[]
    if (block.children) {
      const idx = block.children.findIndex(b => b.id === blockId);
      if (idx >= 0) {
        extracted = block.children[idx];
        return { ...block, children: [...block.children.slice(0, idx), ...block.children.slice(idx + 1)] };
      }
    }

    return block;
  });

  return { block: extracted, blocks: result };
}

/**
 * Insert a block into a nested container.
 */
function insertIntoContainer(
  blocks: SchemaBlock[],
  block: SchemaBlock,
  container: ContainerRef,
  toIndex?: number,
): SchemaBlock[] {
  return blocks.map(b => {
    // Match container by ID
    if (b.id !== container.id) return b;

    // materi-section.content[]
    if (container.type === 'materi-section' && b.type === 'materi-section' && 'content' in b) {
      const ms = b as { content: SchemaBlock[] } & SchemaBlock;
      const content = [...(ms.content || [])];
      const idx = toIndex ?? content.length;
      content.splice(idx, 0, block);
      return { ...b, content };
    }

    // ftab.tabs[tabIndex].content[]
    if (container.type === 'ftab' && b.type === 'ftab' && 'tabs' in b && container.tabIndex != null) {
      const ft = b as { tabs: Array<{ content?: SchemaBlock[] }> } & SchemaBlock;
      const newTabs = ft.tabs.map((tab, i) => {
        if (i !== container.tabIndex || !tab.content) return tab;
        const content = [...tab.content];
        const idx = toIndex ?? content.length;
        content.splice(idx, 0, block);
        return { ...tab, content };
      });
      return { ...b, tabs: newTabs };
    }

    // children[]
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
 */
function insertAfterInNested(
  blocks: SchemaBlock[],
  afterBlockId: string,
  newBlock: SchemaBlock,
): SchemaBlock[] {
  return blocks.map(block => {
    // materi-section.content[]
    if (block.type === 'materi-section' && 'content' in block) {
      const ms = block as { content: SchemaBlock[] } & SchemaBlock;
      const idx = ms.content?.findIndex(b => b.id === afterBlockId);
      if (idx != null && idx >= 0) {
        const content = [...ms.content];
        content.splice(idx + 1, 0, newBlock);
        return { ...block, content };
      }
    }

    // ftab.tabs[].content[]
    if (block.type === 'ftab' && 'tabs' in block) {
      const ft = block as { tabs: Array<{ content?: SchemaBlock[] }> } & SchemaBlock;
      let found = false;
      const newTabs = ft.tabs.map(tab => {
        if (!tab.content || found) return tab;
        const idx = tab.content.findIndex(b => b.id === afterBlockId);
        if (idx >= 0) {
          found = true;
          const content = [...tab.content];
          content.splice(idx + 1, 0, newBlock);
          return { ...tab, content };
        }
        return tab;
      });
      if (found) return { ...block, tabs: newTabs };
    }

    // children[]
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
 */
function regenerateNestedIds(block: SchemaBlock): void {
  if (block.type === 'materi-section' && 'content' in block) {
    const ms = block as { content: SchemaBlock[] };
    for (const child of ms.content || []) {
      child.id = generateBlockId();
      regenerateNestedIds(child);
    }
  }

  if (block.type === 'ftab' && 'tabs' in block) {
    const ft = block as { tabs: Array<{ content?: SchemaBlock[] }> };
    for (const tab of ft.tabs || []) {
      for (const child of tab.content || []) {
        child.id = generateBlockId();
        regenerateNestedIds(child);
      }
    }
  }

  if (block.children) {
    for (const child of block.children) {
      child.id = generateBlockId();
      regenerateNestedIds(child);
    }
  }
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
