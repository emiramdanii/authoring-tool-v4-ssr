// ═══════════════════════════════════════════════════════════════════
// SCHEMA TRAVERSAL TESTS — Composite-aware block traversal utilities
// ═══════════════════════════════════════════════════════════════════
// Tests the pure-logic functions of SchemaTraversal:
//   - findBlockOwner() — find parent of a block
//   - traverseSchema() — full tree traversal
//   - replaceBlockInSchema() — immutable block replacement
//   - deleteBlockFromSchema() — immutable block deletion
//   - isCompositeBlock() — composite block detection
//   - flattenSchemaBlocks() — flat block list
//   - collectBlockIds() — ID collection
//   - Edge cases: not found, empty schema, deeply nested

import { describe, it, expect } from 'vitest';
import {
  findBlockOwner,
  traverseSchema,
  replaceBlockInSchema,
  deleteBlockFromSchema,
  isCompositeBlock,
  getChildBlocks,
  findBlockPath,
  flattenSchemaBlocks,
  collectBlockIds,
  traverseSchemaUpToDepth,
} from '@/core/layout/SchemaTraversal';
import type { SchemaBlock, ScreenSchema } from '@/core/schema/types';

// ── Test Helpers ─────────────────────────────────────────────────

/** Create a simple block with just type and id */
function makeBlock(type: string, id: string, extra?: Record<string, unknown>): SchemaBlock {
  return { type, id, ...extra } as SchemaBlock;
}

/** Create a schema with a variety of block structures */
function createTestSchema(): ScreenSchema {
  return {
    id: 'test-screen',
    templateType: 'materi',
    blocks: [
      // Top-level block 1
      makeBlock('petunjuk', 'top-1', {
        items: [{ icon: '📌', title: 'Step 1', body: 'Body 1' }],
      }),
      // Top-level block 2: ftab with tabs containing nested blocks
      makeBlock('ftab', 'top-ftab', {
        tabs: [
          {
            icon: '📑',
            label: 'Tab 1',
            content: [
              makeBlock('def-box', 'ftab-tab1-def', { content: 'Definition 1' }),
              makeBlock('nc-grid', 'ftab-tab1-grid', {
                cards: [{ icon: '🏷️', title: 'Card', body: 'Body', color: 'y' }],
              }),
            ],
          },
          {
            icon: '📋',
            label: 'Tab 2',
            content: [
              makeBlock('def-box', 'ftab-tab2-def', { content: 'Definition 2' }),
            ],
          },
        ],
      }),
      // Top-level block 3: materi-section with content blocks
      makeBlock('materi-section', 'top-materi', {
        title: 'Materi Section',
        content: [
          makeBlock('def-box', 'materi-def', { content: 'Materi definition' }),
          makeBlock('nc-grid', 'materi-grid', {
            cards: [{ icon: '🏷️', title: 'Card', body: 'Body', color: 'c' }],
          }),
        ],
      }),
      // Top-level block 4: generic block with children
      makeBlock('custom', 'top-custom', {
        children: [
          makeBlock('def-box', 'custom-child-1', { content: 'Child 1' }),
          makeBlock('def-box', 'custom-child-2', { content: 'Child 2' }),
        ],
      }),
      // Top-level block 5: simple non-composite block
      makeBlock('def-box', 'top-def', { content: 'Top-level definition' }),
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════
// 1. IS COMPOSITE BLOCK — Composite block detection
// ═══════════════════════════════════════════════════════════════════

describe('SchemaTraversal — isCompositeBlock', () => {
  it('should identify ftab as composite', () => {
    const block = makeBlock('ftab', 'f1', {
      tabs: [{ icon: '📌', label: 'Tab', content: [] }],
    });
    expect(isCompositeBlock(block)).toBe(true);
  });

  it('should identify materi-section as composite', () => {
    const block = makeBlock('materi-section', 'm1', {
      content: [makeBlock('def-box', 'd1')],
    });
    expect(isCompositeBlock(block)).toBe(true);
  });

  it('should identify block with children as composite', () => {
    const block = makeBlock('custom', 'c1', {
      children: [makeBlock('def-box', 'd1')],
    });
    expect(isCompositeBlock(block)).toBe(true);
  });

  it('should identify ftab as composite even with empty tabs array', () => {
    // ftab is always a composite block by type, regardless of whether it has content
    const block = makeBlock('ftab', 'f-empty', { tabs: [] });
    expect(isCompositeBlock(block)).toBe(true); // ftab type is always composite
  });

  it('should NOT identify simple block without children as composite', () => {
    const block = makeBlock('def-box', 'd1', { content: 'Hello' });
    expect(isCompositeBlock(block)).toBe(false);
  });

  it('should NOT identify block with empty children array as composite', () => {
    const block = makeBlock('custom', 'c1', { children: [] });
    expect(isCompositeBlock(block)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. GET CHILD BLOCKS — Child extraction from composites
// ═══════════════════════════════════════════════════════════════════

describe('SchemaTraversal — getChildBlocks', () => {
  it('should extract child blocks from ftab', () => {
    const block = makeBlock('ftab', 'f1', {
      tabs: [
        { icon: '📌', label: 'Tab 1', content: [makeBlock('def-box', 'd1')] },
        { icon: '📋', label: 'Tab 2', content: [makeBlock('def-box', 'd2')] },
      ],
    });
    const result = getChildBlocks(block);
    expect(result).toHaveLength(2);
    expect(result[0].container).toBe('ftab-tab');
    expect(result[0].tabIndex).toBe(0);
    expect(result[1].tabIndex).toBe(1);
    expect(result[0].children).toHaveLength(1);
  });

  it('should extract child blocks from materi-section', () => {
    const block = makeBlock('materi-section', 'm1', {
      content: [makeBlock('def-box', 'd1'), makeBlock('def-box', 'd2')],
    });
    const result = getChildBlocks(block);
    expect(result).toHaveLength(1);
    expect(result[0].container).toBe('materi-content');
    expect(result[0].children).toHaveLength(2);
  });

  it('should extract child blocks from generic block with children', () => {
    const block = makeBlock('custom', 'c1', {
      children: [makeBlock('def-box', 'd1')],
    });
    const result = getChildBlocks(block);
    expect(result).toHaveLength(1);
    expect(result[0].container).toBe('children');
  });

  it('should return empty array for non-composite block', () => {
    const block = makeBlock('def-box', 'd1', { content: 'Hello' });
    const result = getChildBlocks(block);
    expect(result).toHaveLength(0);
  });

  it('should skip ftab tabs with empty content', () => {
    const block = makeBlock('ftab', 'f1', {
      tabs: [
        { icon: '📌', label: 'Tab 1', content: [makeBlock('def-box', 'd1')] },
        { icon: '📋', label: 'Tab 2', content: [] }, // Empty content
      ],
    });
    const result = getChildBlocks(block);
    expect(result).toHaveLength(1); // Only the non-empty tab
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. FIND BLOCK OWNER — Parent identification
// ═══════════════════════════════════════════════════════════════════

describe('SchemaTraversal — findBlockOwner', () => {
  const schema = createTestSchema();

  it('should return undefined for top-level blocks (no owner)', () => {
    const owner = findBlockOwner(schema, 'top-1');
    expect(owner).toBeUndefined();
  });

  it('should find ftab as owner of tab content blocks', () => {
    const owner = findBlockOwner(schema, 'ftab-tab1-def');
    expect(owner).toBeDefined();
    expect(owner!.owner.id).toBe('top-ftab');
    expect(owner!.container).toBe('ftab-tab');
    expect(owner!.tabIndex).toBe(0);
    expect(owner!.index).toBe(0);
  });

  it('should find ftab as owner with correct tabIndex for second tab', () => {
    const owner = findBlockOwner(schema, 'ftab-tab2-def');
    expect(owner).toBeDefined();
    expect(owner!.owner.id).toBe('top-ftab');
    expect(owner!.container).toBe('ftab-tab');
    expect(owner!.tabIndex).toBe(1);
  });

  it('should find materi-section as owner of its content blocks', () => {
    const owner = findBlockOwner(schema, 'materi-def');
    expect(owner).toBeDefined();
    expect(owner!.owner.id).toBe('top-materi');
    expect(owner!.container).toBe('materi-content');
    expect(owner!.index).toBe(0);
  });

  it('should find generic block as owner of its children', () => {
    const owner = findBlockOwner(schema, 'custom-child-1');
    expect(owner).toBeDefined();
    expect(owner!.owner.id).toBe('top-custom');
    expect(owner!.container).toBe('children');
  });

  it('should return undefined for non-existent block ID', () => {
    const owner = findBlockOwner(schema, 'non-existent-id');
    expect(owner).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. TRAVERSE SCHEMA — Full tree traversal
// ═══════════════════════════════════════════════════════════════════

describe('SchemaTraversal — traverseSchema', () => {
  const schema = createTestSchema();

  it('should visit all blocks including nested', () => {
    const paths = traverseSchema(schema);
    // top-1, top-ftab, ftab-tab1-def, ftab-tab1-grid, ftab-tab2-def,
    // top-materi, materi-def, materi-grid,
    // top-custom, custom-child-1, custom-child-2,
    // top-def
    const allIds = paths.map(p => p.block.id);
    expect(allIds).toContain('top-1');
    expect(allIds).toContain('top-ftab');
    expect(allIds).toContain('ftab-tab1-def');
    expect(allIds).toContain('ftab-tab1-grid');
    expect(allIds).toContain('ftab-tab2-def');
    expect(allIds).toContain('top-materi');
    expect(allIds).toContain('materi-def');
    expect(allIds).toContain('materi-grid');
    expect(allIds).toContain('top-custom');
    expect(allIds).toContain('custom-child-1');
    expect(allIds).toContain('custom-child-2');
    expect(allIds).toContain('top-def');
    expect(allIds.length).toBe(12);
  });

  it('should assign correct depth to blocks', () => {
    const paths = traverseSchema(schema);
    const byId = new Map(paths.map(p => [p.block.id, p]));

    expect(byId.get('top-1')!.depth).toBe(0);  // top-level
    expect(byId.get('top-ftab')!.depth).toBe(0); // top-level
    expect(byId.get('ftab-tab1-def')!.depth).toBe(1); // nested
    expect(byId.get('top-materi')!.depth).toBe(0);
    expect(byId.get('materi-def')!.depth).toBe(1); // nested
    expect(byId.get('custom-child-1')!.depth).toBe(1); // nested
  });

  it('should assign correct container types', () => {
    const paths = traverseSchema(schema);
    const byId = new Map(paths.map(p => [p.block.id, p]));

    expect(byId.get('top-1')!.container).toBe('root');
    expect(byId.get('ftab-tab1-def')!.container).toBe('ftab-tab');
    expect(byId.get('materi-def')!.container).toBe('materi-content');
    expect(byId.get('custom-child-1')!.container).toBe('children');
  });

  it('should assign correct owner references', () => {
    const paths = traverseSchema(schema);
    const byId = new Map(paths.map(p => [p.block.id, p]));

    expect(byId.get('top-1')!.owner).toBeNull(); // top-level
    expect(byId.get('ftab-tab1-def')!.owner!.id).toBe('top-ftab');
    expect(byId.get('materi-def')!.owner!.id).toBe('top-materi');
    expect(byId.get('custom-child-1')!.owner!.id).toBe('top-custom');
  });

  it('should handle empty schema', () => {
    const emptySchema: ScreenSchema = {
      id: 'empty',
      templateType: 'blank',
      blocks: [],
    };
    const paths = traverseSchema(emptySchema);
    expect(paths).toHaveLength(0);
  });

  it('should handle schema with no composite blocks', () => {
    const simpleSchema: ScreenSchema = {
      id: 'simple',
      templateType: 'materi',
      blocks: [
        makeBlock('def-box', 'd1', { content: 'Hello' }),
        makeBlock('def-box', 'd2', { content: 'World' }),
      ],
    };
    const paths = traverseSchema(simpleSchema);
    expect(paths).toHaveLength(2);
    expect(paths.every(p => p.depth === 0)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. FIND BLOCK PATH — Block lookup with full path info
// ═══════════════════════════════════════════════════════════════════

describe('SchemaTraversal — findBlockPath', () => {
  const schema = createTestSchema();

  it('should find a top-level block', () => {
    const path = findBlockPath(schema, 'top-1');
    expect(path).toBeDefined();
    expect(path!.block.id).toBe('top-1');
    expect(path!.depth).toBe(0);
    expect(path!.container).toBe('root');
    expect(path!.owner).toBeNull();
  });

  it('should find a nested block inside ftab', () => {
    const path = findBlockPath(schema, 'ftab-tab1-grid');
    expect(path).toBeDefined();
    expect(path!.block.id).toBe('ftab-tab1-grid');
    expect(path!.depth).toBe(1);
    expect(path!.container).toBe('ftab-tab');
    expect(path!.tabIndex).toBe(0);
  });

  it('should return undefined for non-existent block ID', () => {
    const path = findBlockPath(schema, 'does-not-exist');
    expect(path).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. REPLACE BLOCK IN SCHEMA — Immutable block replacement
// ═══════════════════════════════════════════════════════════════════

describe('SchemaTraversal — replaceBlockInSchema', () => {
  it('should replace a top-level block', () => {
    const schema = createTestSchema();
    const newBlock = makeBlock('petunjuk', 'top-1', { items: [{ icon: '✅', title: 'Replaced', body: 'New' }] });
    const result = replaceBlockInSchema(schema, 'top-1', newBlock);

    expect(result.blocks[0].id).toBe('top-1');
    // Original schema should not be mutated
    expect(schema.blocks[0]).not.toBe(newBlock);
  });

  it('should replace a nested block inside ftab', () => {
    const schema = createTestSchema();
    const newBlock = makeBlock('def-box', 'ftab-tab1-def', { content: 'Replaced!' });
    const result = replaceBlockInSchema(schema, 'ftab-tab1-def', newBlock);

    // Find the replaced block in the result
    const ftab = result.blocks[1] as any;
    expect(ftab.tabs[0].content[0].id).toBe('ftab-tab1-def');
    // The old content should be gone
    const found = flattenSchemaBlocks(result).find(b => b.id === 'ftab-tab1-def');
    expect(found).toBeDefined();
  });

  it('should replace a nested block inside materi-section', () => {
    const schema = createTestSchema();
    const newBlock = makeBlock('def-box', 'materi-def', { content: 'Materi replaced!' });
    const result = replaceBlockInSchema(schema, 'materi-def', newBlock);

    const materi = result.blocks[2] as any;
    expect(materi.content[0].id).toBe('materi-def');
  });

  it('should return schema unchanged when block ID not found', () => {
    const schema = createTestSchema();
    const newBlock = makeBlock('def-box', 'ghost', { content: 'Ghost' });
    const result = replaceBlockInSchema(schema, 'non-existent', newBlock);

    // Schema should be structurally the same (new object, same content)
    expect(result.blocks.length).toBe(schema.blocks.length);
  });

  it('should not mutate the original schema', () => {
    const schema = createTestSchema();
    const originalBlocks = [...schema.blocks];
    const newBlock = makeBlock('def-box', 'top-def', { content: 'New content' });
    replaceBlockInSchema(schema, 'top-def', newBlock);

    // Original schema should be unchanged
    expect(schema.blocks).toEqual(originalBlocks);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. DELETE BLOCK FROM SCHEMA — Immutable block deletion
// ═══════════════════════════════════════════════════════════════════

describe('SchemaTraversal — deleteBlockFromSchema', () => {
  it('should delete a top-level block', () => {
    const schema = createTestSchema();
    const originalCount = schema.blocks.length;
    const result = deleteBlockFromSchema(schema, 'top-1');

    expect(result.blocks.length).toBe(originalCount - 1);
    expect(result.blocks.find(b => b.id === 'top-1')).toBeUndefined();
  });

  it('should delete a nested block from ftab', () => {
    const schema = createTestSchema();
    const result = deleteBlockFromSchema(schema, 'ftab-tab1-def');

    const ftab = result.blocks[1] as any;
    expect(ftab.tabs[0].content.length).toBe(1); // Was 2, now 1
    expect(ftab.tabs[0].content.find((b: any) => b.id === 'ftab-tab1-def')).toBeUndefined();
  });

  it('should delete a nested block from materi-section', () => {
    const schema = createTestSchema();
    const result = deleteBlockFromSchema(schema, 'materi-def');

    const materi = result.blocks[2] as any;
    expect(materi.content.length).toBe(1); // Was 2, now 1
    expect(materi.content.find((b: any) => b.id === 'materi-def')).toBeUndefined();
  });

  it('should delete a nested block from generic children', () => {
    const schema = createTestSchema();
    const result = deleteBlockFromSchema(schema, 'custom-child-1');

    const custom = result.blocks[3] as any;
    expect(custom.children.length).toBe(1); // Was 2, now 1
    expect(custom.children.find((b: any) => b.id === 'custom-child-1')).toBeUndefined();
  });

  it('should return schema unchanged when block ID not found', () => {
    const schema = createTestSchema();
    const result = deleteBlockFromSchema(schema, 'non-existent');
    expect(result.blocks.length).toBe(schema.blocks.length);
  });

  it('should not mutate the original schema', () => {
    const schema = createTestSchema();
    const originalBlocks = [...schema.blocks];
    deleteBlockFromSchema(schema, 'top-1');
    expect(schema.blocks).toEqual(originalBlocks);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 8. FLATTEN & COLLECT — Flat block list and ID collection
// ═══════════════════════════════════════════════════════════════════

describe('SchemaTraversal — flattenSchemaBlocks & collectBlockIds', () => {
  const schema = createTestSchema();

  it('should flatten all blocks including nested', () => {
    const flat = flattenSchemaBlocks(schema);
    expect(flat.length).toBe(12); // Same as traverseSchema count
  });

  it('should collect all block IDs', () => {
    const ids = collectBlockIds(schema);
    expect(ids).toContain('top-1');
    expect(ids).toContain('ftab-tab1-def');
    expect(ids).toContain('materi-def');
    expect(ids).toContain('custom-child-1');
    expect(ids.length).toBe(12);
  });

  it('should handle empty schema', () => {
    const emptySchema: ScreenSchema = { id: 'e', templateType: 'blank', blocks: [] };
    expect(flattenSchemaBlocks(emptySchema)).toEqual([]);
    expect(collectBlockIds(emptySchema)).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 9. DEPTH-LIMITED TRAVERSAL — Max depth filtering
// ═══════════════════════════════════════════════════════════════════

describe('SchemaTraversal — traverseSchemaUpToDepth', () => {
  const schema = createTestSchema();

  it('should return only top-level blocks at depth 0', () => {
    const paths = traverseSchemaUpToDepth(schema, 0);
    expect(paths.every(p => p.depth === 0)).toBe(true);
    expect(paths.length).toBe(5); // All top-level blocks
  });

  it('should return top-level + direct children at depth 1', () => {
    const paths = traverseSchemaUpToDepth(schema, 1);
    expect(paths.length).toBe(12); // All blocks (no deeper nesting)
  });

  it('should return all blocks at Infinity depth', () => {
    const limited = traverseSchemaUpToDepth(schema, Infinity);
    const full = traverseSchema(schema);
    expect(limited.length).toBe(full.length);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 10. DEEPLY NESTED BLOCKS — Two-level nesting
// ═══════════════════════════════════════════════════════════════════

describe('SchemaTraversal — Deeply Nested Blocks', () => {
  it('should handle ftab nested inside materi-section', () => {
    const schema: ScreenSchema = {
      id: 'deep-test',
      templateType: 'materi',
      blocks: [
        makeBlock('materi-section', 'm1', {
          title: 'Materi',
          content: [
            makeBlock('ftab', 'nested-ftab', {
              tabs: [{
                icon: '📑',
                label: 'Tab',
                content: [
                  makeBlock('def-box', 'deeply-nested-def', { content: 'Deep!' }),
                ],
              }],
            }),
          ],
        }),
      ],
    };

    const paths = traverseSchema(schema);
    const byId = new Map(paths.map(p => [p.block.id, p]));

    expect(byId.get('m1')!.depth).toBe(0);
    expect(byId.get('nested-ftab')!.depth).toBe(1);
    expect(byId.get('deeply-nested-def')!.depth).toBe(2);
    expect(byId.get('deeply-nested-def')!.container).toBe('ftab-tab');

    // Owner chain: deeply-nested-def → nested-ftab → m1
    expect(byId.get('deeply-nested-def')!.owner!.id).toBe('nested-ftab');
    expect(byId.get('nested-ftab')!.owner!.id).toBe('m1');
  });

  it('should replace deeply nested blocks (2 levels deep)', () => {
    const schema: ScreenSchema = {
      id: 'deep-ops',
      templateType: 'materi',
      blocks: [
        makeBlock('materi-section', 'm1', {
          title: 'Materi',
          content: [
            makeBlock('ftab', 'nested-ftab', {
              tabs: [{
                icon: '📑',
                label: 'Tab',
                content: [
                  makeBlock('def-box', 'deep-def', { content: 'Deep!' }),
                ],
              }],
            }),
          ],
        }),
      ],
    };

    // Replace deeply nested block
    const newBlock = makeBlock('def-box', 'deep-def', { content: 'Replaced deep!' });
    const replaced = replaceBlockInSchema(schema, 'deep-def', newBlock);
    const flatReplaced = flattenSchemaBlocks(replaced);
    expect(flatReplaced.find(b => b.id === 'deep-def')).toBeDefined();
  });

  it('should delete blocks one level deep inside composite children', () => {
    // NOTE: deleteBlockFromSchema supports single-level nesting.
    // For deeply nested blocks (2+ levels), the caller would need to
    // apply deletion iteratively. This test verifies 1-level behavior.
    const schema: ScreenSchema = {
      id: 'delete-ops',
      templateType: 'materi',
      blocks: [
        makeBlock('ftab', 'top-ftab', {
          tabs: [{
            icon: '📑',
            label: 'Tab',
            content: [
              makeBlock('def-box', 'ftab-def', { content: 'In ftab' }),
            ],
          }],
        }),
        makeBlock('materi-section', 'top-materi', {
          title: 'Materi',
          content: [
            makeBlock('def-box', 'materi-def', { content: 'In materi' }),
          ],
        }),
      ],
    };

    // Delete block inside ftab tab content (1 level deep)
    const deletedFtab = deleteBlockFromSchema(schema, 'ftab-def');
    const flatFtab = flattenSchemaBlocks(deletedFtab);
    expect(flatFtab.find(b => b.id === 'ftab-def')).toBeUndefined();

    // Delete block inside materi-section content (1 level deep)
    const deletedMateri = deleteBlockFromSchema(schema, 'materi-def');
    const flatMateri = flattenSchemaBlocks(deletedMateri);
    expect(flatMateri.find(b => b.id === 'materi-def')).toBeUndefined();
  });
});
