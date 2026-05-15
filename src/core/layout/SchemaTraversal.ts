// ═══════════════════════════════════════════════════════════════════
// SCHEMA TRAVERSAL — Composite-aware block traversal utilities
// ═══════════════════════════════════════════════════════════════════
//
// PROBLEM:
//   The scene layout engine only sees TOP-LEVEL blocks.
//   But blocks can be nested:
//     ftab.tabs[].content → SchemaBlock[]
//     materi-section.content → SchemaBlock[]
//     BaseBlock.children → SchemaBlock[]
//
//   Without traversal, the engine can't:
//     - Find which composite block owns a child (selection, deletion)
//     - Measure child blocks independently
//     - Reason about overflow inside composites
//     - Provide accurate layer panel data
//
// SOLUTION:
//   Traversal utilities that understand the schema tree structure.
//   Every function treats the schema as a TREE, not a flat list.
//
// KEY CONCEPTS:
//   - "Owner": The composite block that contains a child block
//   - "Path": The traversal path from root → owner → child
//   - "Depth": How deep a block is nested (0 = top-level)
//
// COMPOSITE BLOCK TYPES (known to have nested blocks):
//   - ftab: tabs[].content → SchemaBlock[]
//   - materi-section: content → SchemaBlock[]
//   - BaseBlock: children → SchemaBlock[] (generic)
//
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema } from '../schema/types';
import { isCompositeBlockType, getCompositeContainerDescriptor, type CompositeContainerDescriptor } from '../schema/capability-registry';

// ── Path Types ─────────────────────────────────────────────────

/** Location of a block within the schema tree */
export interface BlockPath {
  /** The block itself */
  block: SchemaBlock;
  /** Parent composite block (null if top-level) */
  owner: SchemaBlock | null;
  /** Depth in the tree (0 = top-level) */
  depth: number;
  /** How this block is contained in its owner */
  container:
    | 'root'       // Top-level block in schema.blocks[]
    | 'children'   // BaseBlock.children[]
    | 'ftab-tab'   // ftab.tabs[i].content[]
    | 'materi-content'; // materi-section.content[]
  /** Index within the parent container */
  index: number;
  /** Tab index (only for ftab-tab container) */
  tabIndex?: number;
}

/** Result of finding a block's owner */
export interface BlockOwner {
  /** The composite block that owns the target */
  owner: SchemaBlock;
  /** How the child is contained */
  container: BlockPath['container'];
  /** Index within the owner's container */
  index: number;
  /** Tab index (for ftab) */
  tabIndex?: number;
}

// ── Composite Block Detection ──────────────────────────────────

/**
 * Check if a block is composite (contains nested blocks).
 * Uses isCompositeBlockType() from the capability registry as the
 * single source of truth for known composite types (ftab, materi-section).
 * Also checks for generic BaseBlock.children at runtime.
 *
 * Composite blocks are special because their children participate in
 * the scene layout engine but are rendered inside the parent.
 */
export function isCompositeBlock(block: SchemaBlock): boolean {
  // Use registry for known composite types
  if (isCompositeBlockType(block.type)) return true;

  // Generic runtime check: any block with non-empty children array
  const blockChildren = (block as { children?: SchemaBlock[] }).children;
  return Array.isArray(blockChildren) && blockChildren.length > 0;
}

/**
 * Get all child blocks from a composite block.
 * Returns the container type along with the blocks.
 *
 * Now uses CompositeContainerDescriptor from the capability registry
 * as the single source of truth for container structure.
 * When a new composite type is added, just add its descriptor —
 * this function automatically supports it.
 */
export function getChildBlocks(block: SchemaBlock): Array<{
  children: SchemaBlock[];
  container: BlockPath['container'];
  tabIndex?: number;
}> {
  const result: Array<{
    children: SchemaBlock[];
    container: BlockPath['container'];
    tabIndex?: number;
  }> = [];

  // Use descriptor-driven access for known composite types
  const descriptor = getCompositeContainerDescriptor(block.type);
  if (descriptor) {
    if (descriptor.structure === 'direct') {
      const children = (block as Record<string, unknown>)[descriptor.accessor] as SchemaBlock[] | undefined;
      if (children && children.length > 0) {
        result.push({
          children,
          container: descriptor.containerType,
        });
      }
      return result;
    }

    if (descriptor.structure === 'tabular' && descriptor.tabContentKey) {
      const tabs = (block as Record<string, unknown>)[descriptor.accessor] as Array<Record<string, unknown>> | undefined;
      if (tabs) {
        tabs.forEach((tab, tabIndex) => {
          const content = tab[descriptor.tabContentKey!] as SchemaBlock[] | undefined;
          if (content && content.length > 0) {
            result.push({
              children: content,
              container: descriptor.containerType,
              tabIndex,
            });
          }
        });
      }
      return result;
    }
  }

  // Generic BaseBlock.children (for any composite block with a children array)
  const blockChildren = (block as { children?: SchemaBlock[] }).children;
  if (blockChildren && blockChildren.length > 0) {
    result.push({
      children: blockChildren,
      container: 'children',
    });
  }

  return result;
}

// ── Full Schema Traversal ──────────────────────────────────────

/**
 * Traverse the entire schema tree and collect all BlockPaths.
 * This is the foundation for all composite-aware operations.
 *
 * Traversal order: depth-first, maintaining tree structure.
 * Each block appears exactly once in the result.
 *
 * Usage:
 *   const paths = traverseSchema(schema);
 *   // Find all nested blocks:
 *   const nested = paths.filter(p => p.depth > 0);
 *   // Find block by ID:
 *   const found = paths.find(p => p.block.id === targetId);
 */
export function traverseSchema(schema: ScreenSchema): BlockPath[] {
  const paths: BlockPath[] = [];

  function visitBlocks(
    blocks: SchemaBlock[],
    owner: SchemaBlock | null,
    depth: number,
    container: BlockPath['container'],
    tabIndex?: number,
  ) {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const path: BlockPath = {
        block,
        owner,
        depth,
        container,
        index: i,
        ...(tabIndex !== undefined ? { tabIndex } : {}),
      };
      paths.push(path);

      // Recurse into composite blocks
      if (isCompositeBlock(block)) {
        const childContainers = getChildBlocks(block);
        for (const cc of childContainers) {
          visitBlocks(cc.children, block, depth + 1, cc.container, cc.tabIndex);
        }
      }
    }
  }

  // Start traversal from root blocks
  visitBlocks(schema.blocks, null, 0, 'root');

  return paths;
}

// ── Find Block by ID ───────────────────────────────────────────

/**
 * Find a block's path in the schema tree by its ID.
 * Returns the BlockPath with owner information, or undefined if not found.
 *
 * This is the composite-aware replacement for:
 *   schema.blocks.find(b => b.id === targetId)
 * which only works for top-level blocks.
 */
export function findBlockPath(schema: ScreenSchema, blockId: string): BlockPath | undefined {
  const paths = traverseSchema(schema);
  return paths.find(p => p.block.id === blockId);
}

/**
 * Find the owner of a block by its ID.
 * Returns the BlockOwner (composite parent) or undefined if the block
 * is top-level (no owner).
 *
 * Usage:
 *   const owner = findBlockOwner(schema, 'child-block-3');
 *   if (owner) {
 *     // This block is inside a composite block
 *     console.log(`Block is inside ${owner.owner.type}, container: ${owner.container}`);
 *   }
 */
export function findBlockOwner(schema: ScreenSchema, blockId: string): BlockOwner | undefined {
  const path = findBlockPath(schema, blockId);
  if (!path || !path.owner) return undefined;

  return {
    owner: path.owner,
    container: path.container,
    index: path.index,
    tabIndex: path.tabIndex,
  };
}

// ── Flat Block List ────────────────────────────────────────────

/**
 * Get all blocks in the schema as a flat array (depth-first).
 * This is useful for operations that need every block regardless
 * of nesting, like global search, validation, or export.
 */
export function flattenSchemaBlocks(schema: ScreenSchema): SchemaBlock[] {
  const blocks: SchemaBlock[] = [];

  function visit(block: SchemaBlock) {
    blocks.push(block);
    if (isCompositeBlock(block)) {
      const childContainers = getChildBlocks(block);
      for (const cc of childContainers) {
        for (const child of cc.children) {
          visit(child);
        }
      }
    }
  }

  for (const block of schema.blocks) {
    visit(block);
  }

  return blocks;
}

// ── Collect All Block IDs ──────────────────────────────────────

/**
 * Collect all block IDs in the schema (including nested).
 * Useful for ID collision detection and uniqueness validation.
 */
export function collectBlockIds(schema: ScreenSchema): string[] {
  return flattenSchemaBlocks(schema)
    .map(b => b.id)
    .filter((id): id is string => id != null);
}

// ── Depth-limited Traversal ────────────────────────────────────

/**
 * Get blocks up to a maximum depth.
 * depth=0 → only top-level blocks
 * depth=1 → top-level + direct children of composites
 * depth=Infinity → all blocks (same as traverseSchema)
 */
export function traverseSchemaUpToDepth(
  schema: ScreenSchema,
  maxDepth: number,
): BlockPath[] {
  const allPaths = traverseSchema(schema);
  return allPaths.filter(p => p.depth <= maxDepth);
}

// ── Block Replacement ──────────────────────────────────────────

// ── Composite Children Processing (Descriptor-Driven) ──────────
// This is the KEY helper that eliminates all hardcoded type checks
// for composite block mutation. It uses the CompositeContainerDescriptor
// from the capability registry to generically access and update
// children in any composite block type.
//
// Instead of:
//   if (block.type === 'ftab') { ... update tabs[i].content ... }
//   if (block.type === 'materi-section') { ... update content ... }
//
// You write:
//   const updated = processCompositeChildren(block, (children) => {
//     return children.filter(b => b.id !== targetId); // or map, splice, etc.
//   });
//   if (updated) return updated;
//
// When a new composite type is added with its descriptor, this
// function automatically supports it without any code changes.

/**
 * Process children of a composite block using its container descriptor.
 * Returns a new block with the updated children, or null if:
 *   - The block is not composite
 *   - No descriptor is found
 *   - The processor returns the same children reference (no change)
 *
 * The processor receives the current children array and must return
 * a NEW array with the desired changes. Returning the same reference
 * signals "no change" and the function returns null.
 *
 * For tabular containers (ftab): the processor is called once per tab.
 * For direct containers (materi-section): the processor is called once.
 * For generic children: the processor is called once.
 *
 * @param block - The composite block to process
 * @param processor - Function that receives current children and returns updated children.
 *   Return the SAME array reference to signal "no change".
 * @param options - Optional: only process a specific tab (for tabular containers)
 */
export function processCompositeChildren(
  block: SchemaBlock,
  processor: (children: SchemaBlock[], tabIndex: number | undefined) => SchemaBlock[],
  options?: { onlyTabIndex?: number },
): SchemaBlock | null {
  // 1. Known composite types — use descriptor
  const descriptor = getCompositeContainerDescriptor(block.type);
  if (descriptor) {
    if (descriptor.structure === 'direct') {
      const current = (block as Record<string, unknown>)[descriptor.accessor] as SchemaBlock[] | undefined;
      const updated = processor(current || [], undefined);
      if (updated === current) return null; // No change
      return { ...block, [descriptor.accessor]: updated };
    }

    if (descriptor.structure === 'tabular' && descriptor.tabContentKey) {
      const tabs = (block as Record<string, unknown>)[descriptor.accessor] as Array<Record<string, unknown>> | undefined;
      if (!tabs) return null;

      let changed = false;
      const updatedTabs = tabs.map((tab, tabIndex) => {
        // If onlyTabIndex is specified, skip other tabs
        if (options?.onlyTabIndex !== undefined && tabIndex !== options.onlyTabIndex) {
          return tab;
        }

        const current = tab[descriptor.tabContentKey!] as SchemaBlock[] | undefined;
        const updated = processor(current || [], tabIndex);
        if (updated !== current) {
          changed = true;
          return { ...tab, [descriptor.tabContentKey!]: updated };
        }
        return tab;
      });

      if (!changed) return null;
      return { ...block, [descriptor.accessor]: updatedTabs };
    }
  }

  // 2. Generic BaseBlock.children — fallback for any block with a children array
  const blockChildren = (block as { children?: SchemaBlock[] }).children;
  if (Array.isArray(blockChildren)) {
    const updated = processor(blockChildren, undefined);
    if (updated === blockChildren) return null; // No change
    return { ...block, children: updated };
  }

  return null;
}

// ── Block Replacement ──────────────────────────────────────────

/**
 * Replace a block in the schema tree by its ID.
 * Returns a NEW ScreenSchema (immutable update).
 * The original schema is NEVER mutated.
 *
 * This is the composite-aware replacement for:
 *   schema.blocks = schema.blocks.map(b => b.id === targetId ? newBlock : b)
 * which only works for top-level blocks.
 *
 * Now uses CompositeContainerDescriptor for composite block mutation,
 * eliminating hardcoded type-specific accessor logic.
 */
export function replaceBlockInSchema(
  schema: ScreenSchema,
  blockId: string,
  newBlock: SchemaBlock,
): ScreenSchema {
  function replaceInArray(blocks: SchemaBlock[]): SchemaBlock[] {
    return blocks.map(block => {
      if (block.id === blockId) {
        return newBlock;
      }

      // Recurse into composite blocks
      if (isCompositeBlock(block)) {
        return replaceInComposite(block, blockId, newBlock);
      }

      return block;
    });
  }

  function replaceInComposite(
    block: SchemaBlock,
    targetId: string,
    replacement: SchemaBlock,
  ): SchemaBlock {
    // Use descriptor-driven mutation for known composite types
    const updated = processCompositeChildren(block, (children) => {
      if (!children.some(b => b.id === targetId)) return children; // No change
      return children.map(b => b.id === targetId ? replacement : b);
    });
    if (updated) return updated;

    return block;
  }

  return {
    ...schema,
    blocks: replaceInArray(schema.blocks),
  };
}

// ── Block Deletion ─────────────────────────────────────────────

/**
 * Delete a block from the schema tree by its ID.
 * Returns a NEW ScreenSchema (immutable update).
 * The original schema is NEVER mutated.
 *
 * If the block is inside a composite, it's removed from the composite's
 * children array. If it's top-level, it's removed from schema.blocks.
 *
 * Now uses CompositeContainerDescriptor for composite block mutation,
 * eliminating hardcoded type-specific accessor logic.
 */
export function deleteBlockFromSchema(
  schema: ScreenSchema,
  blockId: string,
): ScreenSchema {
  function deleteFromArray(blocks: SchemaBlock[]): SchemaBlock[] {
    return blocks
      .filter(block => block.id !== blockId)
      .map(block => {
        if (isCompositeBlock(block)) {
          return deleteFromComposite(block, blockId);
        }
        return block;
      });
  }

  function deleteFromComposite(block: SchemaBlock, targetId: string): SchemaBlock {
    // Use descriptor-driven mutation for known composite types
    const updated = processCompositeChildren(block, (children) => {
      if (!children.some(b => b.id === targetId)) return children; // No change
      return children.filter(b => b.id !== targetId);
    });
    if (updated) return updated;

    return block;
  }

  return {
    ...schema,
    blocks: deleteFromArray(schema.blocks),
  };
}
