// ═══════════════════════════════════════════════════════════════════
// DEEP MERGE TESTS — Immutable deep merge for schema block updates
// ═══════════════════════════════════════════════════════════════════
// Tests the deep-merge module:
//   - deepMergeBlock() — merge patch into a block
//   - deepMergeBlockWithPatches() — merge with patch capture
//   - batchMergeBlocks() — merge multiple blocks at once
//   - mergeBlockInArray() — merge block in array with patches
//   - Edge cases: null values, undefined values, empty objects, arrays

import { describe, it, expect, beforeAll } from 'vitest';
import { enablePatches } from 'immer';
import {
  deepMergeBlock,
  deepMergeBlockWithPatches,
  batchMergeBlocks,
  mergeBlockInArray,
} from '@/core/editor/deep-merge';
import type { SchemaBlock } from '@/core/schema/types';

// Immer requires enablePatches() before using produceWithPatches/applyPatches
beforeAll(() => {
  enablePatches();
});

// ── Test Helpers ─────────────────────────────────────────────────

/** Create a simple def-box block for testing */
function makeDefBlock(overrides: Record<string, unknown> = {}): SchemaBlock {
  return {
    type: 'def-box',
    id: 'test-def',
    content: 'Original content',
    borderColor: 'y',
    ...overrides,
  } as SchemaBlock;
}

/** Create a petunjuk block with nested structure */
function makePetunjukBlock(): SchemaBlock {
  return {
    type: 'petunjuk',
    id: 'test-petunjuk',
    title: 'Petunjuk',
    titleHighlight: 'Panduan',
    items: [
      { icon: '📌', title: 'Step 1', body: 'Body 1' },
      { icon: '✅', title: 'Step 2', body: 'Body 2' },
    ],
    layout: { position: 'flow' },
  } as SchemaBlock;
}

// ═══════════════════════════════════════════════════════════════════
// 1. SIMPLE OBJECT MERGE — Top-level property updates
// ═══════════════════════════════════════════════════════════════════

describe('DeepMerge — Simple object merge', () => {
  it('should update a single top-level property', () => {
    const block = makeDefBlock();
    const result = deepMergeBlock(block, { content: 'New content' });
    expect(result.content).toBe('New content');
    expect(result.borderColor).toBe('y'); // Unchanged
  });

  it('should update multiple top-level properties', () => {
    const block = makeDefBlock();
    const result = deepMergeBlock(block, { content: 'New', borderColor: 'c' });
    expect(result.content).toBe('New');
    expect(result.borderColor).toBe('c');
  });

  it('should not mutate the original block', () => {
    const block = makeDefBlock();
    const originalContent = block.content;
    deepMergeBlock(block, { content: 'Changed' });
    expect(block.content).toBe(originalContent);
  });

  it('should add new properties that do not exist', () => {
    const block = makeDefBlock();
    const result = deepMergeBlock(block, { newField: 'hello' } as any);
    expect((result as any).newField).toBe('hello');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. NESTED OBJECT MERGE — Deep property updates
// ═══════════════════════════════════════════════════════════════════

describe('DeepMerge — Nested object merge', () => {
  it('should deep-merge nested object properties', () => {
    const block = {
      type: 'test',
      id: 't1',
      style: { color: 'red', fontSize: 14, fontWeight: 'bold' },
    } as SchemaBlock;

    const result = deepMergeBlock(block, { style: { color: 'blue' } });
    expect((result as any).style.color).toBe('blue');   // Updated
    expect((result as any).style.fontSize).toBe(14);    // Preserved
    expect((result as any).style.fontWeight).toBe('bold'); // Preserved
  });

  it('should deep-merge two levels deep', () => {
    const block = {
      type: 'test',
      id: 't1',
      config: { layout: { padding: 10, margin: 5 } },
    } as SchemaBlock;

    const result = deepMergeBlock(block, { config: { layout: { padding: 20 } } });
    expect((result as any).config.layout.padding).toBe(20);  // Updated
    expect((result as any).config.layout.margin).toBe(5);    // Preserved
  });

  it('should preserve non-overlapping nested properties', () => {
    const block = {
      type: 'test',
      id: 't1',
      meta: { author: 'Alice', version: 1 },
    } as SchemaBlock;

    const result = deepMergeBlock(block, { meta: { version: 2 } });
    expect((result as any).meta.author).toBe('Alice'); // Preserved
    expect((result as any).meta.version).toBe(2);     // Updated
  });

  it('should not mutate nested objects in the original block', () => {
    const block = {
      type: 'test',
      id: 't1',
      style: { color: 'red' },
    } as SchemaBlock;
    const originalStyle = (block as any).style;
    deepMergeBlock(block, { style: { color: 'blue' } });
    expect(originalStyle.color).toBe('red');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. ARRAY REPLACEMENT — Arrays are replaced, not merged
// ═══════════════════════════════════════════════════════════════════

describe('DeepMerge — Array replacement behavior', () => {
  it('should replace arrays entirely (not merge)', () => {
    const block = makePetunjukBlock();
    const newItems = [{ icon: '🔥', title: 'New Step', body: 'New Body' }];
    const result = deepMergeBlock(block, { items: newItems });
    expect((result as any).items).toEqual(newItems);
    expect((result as any).items.length).toBe(1); // Not 2
  });

  it('should replace nested arrays entirely', () => {
    const block = {
      type: 'test',
      id: 't1',
      data: { tags: ['a', 'b', 'c'] },
    } as SchemaBlock;

    const result = deepMergeBlock(block, { data: { tags: ['x', 'y'] } });
    expect((result as any).data.tags).toEqual(['x', 'y']);
  });

  it('should replace an array with an empty array', () => {
    const block = makePetunjukBlock();
    const result = deepMergeBlock(block, { items: [] });
    expect((result as any).items).toEqual([]);
  });

  it('should add an array to a property that was not an array', () => {
    const block = makeDefBlock();
    const result = deepMergeBlock(block, { tags: ['tag1', 'tag2'] } as any);
    expect((result as any).tags).toEqual(['tag1', 'tag2']);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. NULL AND UNDEFINED VALUES — Edge case handling
// ═══════════════════════════════════════════════════════════════════

describe('DeepMerge — Null and undefined values', () => {
  it('should replace a value with null', () => {
    const block = makeDefBlock();
    const result = deepMergeBlock(block, { content: null });
    expect(result.content).toBeNull();
  });

  it('should replace a value with undefined (delete-like)', () => {
    const block = makeDefBlock();
    const result = deepMergeBlock(block, { content: undefined });
    expect((result as any).content).toBeUndefined();
  });

  it('should treat null source values as replacement, not merge', () => {
    const block = {
      type: 'test',
      id: 't1',
      style: { color: 'red', size: 10 },
    } as SchemaBlock;

    // When source is null, it should replace the entire target
    const result = deepMergeBlock(block, { style: null });
    expect((result as any).style).toBeNull();
  });

  it('should handle empty source object (no changes)', () => {
    const block = makeDefBlock();
    const result = deepMergeBlock(block, {});
    expect(result.content).toBe('Original content');
    expect(result.borderColor).toBe('y');
  });

  it('should handle merging into a block with no existing properties', () => {
    const block = { type: 'test', id: 't1' } as SchemaBlock;
    const result = deepMergeBlock(block, { title: 'Added' });
    expect((result as any).title).toBe('Added');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. DEEP MERGE WITH PATCHES — Undo/redo patch capture
// ═══════════════════════════════════════════════════════════════════

describe('DeepMerge — deepMergeBlockWithPatches', () => {
  it('should return merged block along with patches', () => {
    const block = makeDefBlock();
    const { block: merged, patches, inversePatches } = deepMergeBlockWithPatches(
      block,
      { content: 'New content' },
    );

    expect(merged.content).toBe('New content');
    expect(patches.length).toBeGreaterThan(0);
    expect(inversePatches.length).toBeGreaterThan(0);
  });

  it('should produce forward patches that describe the change', () => {
    const block = makeDefBlock();
    const { patches } = deepMergeBlockWithPatches(block, { content: 'New' });
    // Should have a replace patch for 'content'
    const contentPatch = patches.find(p => p.path.includes('content'));
    expect(contentPatch).toBeDefined();
    expect(contentPatch!.value).toBe('New');
  });

  it('should produce inverse patches that can revert the change', () => {
    const block = makeDefBlock();
    const { inversePatches } = deepMergeBlockWithPatches(block, { content: 'New' });
    const contentPatch = inversePatches.find(p => p.path.includes('content'));
    expect(contentPatch).toBeDefined();
    expect(contentPatch!.value).toBe('Original content'); // The original value
  });

  it('should produce empty patches when nothing changes', () => {
    const block = makeDefBlock();
    const { patches, inversePatches } = deepMergeBlockWithPatches(block, {});
    // No changes → no patches (or minimal structural patches)
    // Immer may still produce patches for structural changes, but for an
    // empty merge there should be very few or none
    expect(patches.length).toBe(0);
    expect(inversePatches.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. MERGE BLOCK IN ARRAY — Array-level patch capture
// ═══════════════════════════════════════════════════════════════════

describe('DeepMerge — mergeBlockInArray', () => {
  it('should merge a block within an array and return new array with patches', () => {
    const blocks = [makeDefBlock({ id: 'b1' }), makeDefBlock({ id: 'b2' })];
    const { blocks: newBlocks, patches } = mergeBlockInArray(blocks, 0, { content: 'Updated' });

    expect(newBlocks[0].content).toBe('Updated');
    expect(newBlocks[1].content).toBe('Original content'); // Unchanged
    expect(patches.length).toBeGreaterThan(0);
  });

  it('should produce patches scoped to the block array level', () => {
    const blocks = [makeDefBlock({ id: 'b1' })];
    const { patches } = mergeBlockInArray(blocks, 0, { content: 'Changed' });
    // Patches should reference the block index
    const blockPatch = patches.find(p => p.path[0] === 0);
    expect(blockPatch).toBeDefined();
  });

  it('should handle invalid block index gracefully', () => {
    const blocks = [makeDefBlock({ id: 'b1' })];
    const { blocks: newBlocks } = mergeBlockInArray(blocks, 5, { content: 'Nope' });
    // Index 5 is out of bounds — no change
    expect(newBlocks[0].content).toBe('Original content');
  });

  it('should handle negative block index gracefully', () => {
    const blocks = [makeDefBlock({ id: 'b1' })];
    const { blocks: newBlocks } = mergeBlockInArray(blocks, -1, { content: 'Nope' });
    expect(newBlocks[0].content).toBe('Original content');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. BATCH MERGE BLOCKS — Multiple block updates in one operation
// ═══════════════════════════════════════════════════════════════════

describe('DeepMerge — batchMergeBlocks', () => {
  it('should apply multiple patches to different blocks', () => {
    const blocks = [
      makeDefBlock({ id: 'b1' }),
      makeDefBlock({ id: 'b2' }),
      makeDefBlock({ id: 'b3' }),
    ];

    const result = batchMergeBlocks(blocks, [
      { index: 0, patch: { content: 'Updated B1' } },
      { index: 2, patch: { content: 'Updated B3' } },
    ]);

    expect(result[0].content).toBe('Updated B1');
    expect(result[1].content).toBe('Original content'); // Unchanged
    expect(result[2].content).toBe('Updated B3');
  });

  it('should not mutate the original blocks array', () => {
    const blocks = [makeDefBlock({ id: 'b1' })];
    const originalContent = blocks[0].content;
    batchMergeBlocks(blocks, [{ index: 0, patch: { content: 'Changed' } }]);
    expect(blocks[0].content).toBe(originalContent);
  });

  it('should skip invalid indices in batch', () => {
    const blocks = [makeDefBlock({ id: 'b1' })];
    const result = batchMergeBlocks(blocks, [
      { index: 0, patch: { content: 'Updated' } },
      { index: 99, patch: { content: 'Invalid' } },
    ]);
    expect(result[0].content).toBe('Updated');
    expect(result.length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 8. EDGE CASES — Complex scenarios and boundary conditions
// ═══════════════════════════════════════════════════════════════════

describe('DeepMerge — Edge cases', () => {
  it('should handle merging an object into a property that was a primitive', () => {
    const block = {
      type: 'test',
      id: 't1',
      title: 'Simple string',
    } as SchemaBlock;

    // Replacing a string with an object — should replace, not merge
    const result = deepMergeBlock(block, { title: { text: 'Complex', bold: true } });
    expect(typeof (result as any).title).toBe('object');
    expect((result as any).title.text).toBe('Complex');
  });

  it('should handle merging a primitive into a property that was an object', () => {
    const block = {
      type: 'test',
      id: 't1',
      style: { color: 'red', size: 10 },
    } as SchemaBlock;

    // Replacing an object with a string — should replace
    const result = deepMergeBlock(block, { style: 'simple' });
    expect((result as any).style).toBe('simple');
  });

  it('should handle empty patch object (identity merge)', () => {
    const block = makeDefBlock();
    const result = deepMergeBlock(block, {});
    expect(result.content).toBe('Original content');
  });

  it('should handle patch with properties that have null target value', () => {
    const block = {
      type: 'test',
      id: 't1',
      optional: null as string | null,
    } as SchemaBlock;

    const result = deepMergeBlock(block, { optional: 'now set' });
    expect((result as any).optional).toBe('now set');
  });

  it('should handle deeply nested merge with mixed types', () => {
    const block = {
      type: 'test',
      id: 't1',
      config: {
        layout: { position: 'flow', padding: 10 },
        style: { color: 'y' },
        items: [1, 2, 3],
      },
    } as SchemaBlock;

    const result = deepMergeBlock(block, {
      config: {
        layout: { padding: 20 },  // Deep merge into layout object
        items: [4, 5],             // Replace array
      },
    });

    expect((result as any).config.layout.position).toBe('flow'); // Preserved
    expect((result as any).config.layout.padding).toBe(20);      // Updated
    expect((result as any).config.style.color).toBe('y');        // Preserved
    expect((result as any).config.items).toEqual([4, 5]);        // Replaced
  });
});
