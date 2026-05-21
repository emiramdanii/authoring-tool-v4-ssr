// Test script: Directly test addSchemaBlock pipeline
import { enablePatches, produceWithPatches } from 'immer';

// CRITICAL: enablePatches BEFORE any produceWithPatches call
enablePatches();

// Simulate the key parts of the addSchemaBlock pipeline
console.log('=== Test 1: produceWithPatches with empty array ===');
try {
  const blocks = [];
  const newBlock = { id: 'test-1', type: 'def-box', variant: 'A', content: 'Test' };
  const [newBlocks, forward, inverse] = produceWithPatches(blocks, draft => {
    draft.splice(0, 0, newBlock);
  });
  console.log('Result:', { newBlocksLen: newBlocks.length, forwardLen: forward.length, inverseLen: inverse.length });
  console.log('Block in result:', JSON.stringify(newBlocks[0]));
} catch (e) {
  console.error('FAILED:', e.message);
}

console.log('\n=== Test 2: produceWithPatches with frozen array ===');
try {
  const blocks = Object.freeze([]);
  const newBlock = { id: 'test-2', type: 'def-box', variant: 'A', content: 'Test' };
  const [newBlocks, forward, inverse] = produceWithPatches(blocks, draft => {
    draft.splice(0, 0, newBlock);
  });
  console.log('Result:', { newBlocksLen: newBlocks.length, forwardLen: forward.length, inverseLen: inverse.length });
} catch (e) {
  console.error('FAILED:', e.message);
}

console.log('\n=== Test 3: deepFreeze + deepClone + produceWithPatches ===');
try {
  // Simulate ensurePageSchema: deepFreeze(deepClone(page.schema))
  const schema = { id: 'p1', version: 1, templateType: 'custom', blocks: [] };
  const cloned = structuredClone(schema);
  // Deep freeze
  function deepFreeze(obj) {
    if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
    if (Object.isFrozen(obj)) return obj;
    Object.freeze(obj);
    for (const val of Object.values(obj)) deepFreeze(val);
    return obj;
  }
  const frozen = deepFreeze(cloned);
  console.log('Schema frozen:', Object.isFrozen(frozen));
  console.log('Blocks frozen:', Object.isFrozen(frozen.blocks));

  // Now simulate addSchemaBlock
  const blocks = frozen.blocks;
  const newBlock = { id: 'test-3', type: 'def-box', variant: 'A', content: 'Test' };
  const [newBlocks, forward, inverse] = produceWithPatches(blocks, draft => {
    draft.splice(0, 0, newBlock);
  });
  console.log('Result:', { newBlocksLen: newBlocks.length, forwardLen: forward.length, inverseLen: inverse.length });

  // commitSchemaUpdate: bumpVersion({ ...schema, blocks: newBlocks })
  const updatedSchema = { ...frozen, blocks: newBlocks, version: 2 };
  console.log('Updated schema blocks:', updatedSchema.blocks.length);
  console.log('Updated version:', updatedSchema.version);
  console.log('Updated schema NOT frozen:', !Object.isFrozen(updatedSchema));
} catch (e) {
  console.error('FAILED:', e.message);
  console.error('Stack:', e.stack);
}

console.log('\n=== Test 4: Full pipeline (addSchemaBlock simulation) ===');
try {
  // Simulate page state
  const page = {
    id: 'p_1234',
    label: 'Halaman 1',
    schema: { id: 'p_1234', version: 1, templateType: 'custom', blocks: [] },
    elements: [],
    pageMode: 'schema',
  };

  // Simulate ensurePageSchema
  const schema = deepFreeze(structuredClone(page.schema));
  console.log('Step 1 - ensurePageSchema:', { blocksLen: schema.blocks.length, frozen: Object.isFrozen(schema) });

  // Simulate produceWithPatches
  const newBlock = { id: 'blk_abc', type: 'tp', variant: 'A', title: 'Tujuan Pembelajaran' };
  const [newBlocks] = produceWithPatches(schema.blocks, draft => {
    draft.splice(0, 0, newBlock);
  });
  console.log('Step 2 - produceWithPatches:', { newBlocksLen: newBlocks.length });

  // Simulate commitSchemaUpdate
  const updatedSchema = { ...schema, blocks: newBlocks, version: 2 };
  console.log('Step 3 - commitSchemaUpdate:', { blocksLen: updatedSchema.blocks.length, version: updatedSchema.version });

  // Simulate page update
  const newPage = { ...page, schema: updatedSchema, pageMode: 'schema' };
  console.log('Step 4 - newPage:', { schemaBlocksLen: newPage.schema.blocks.length, pageMode: newPage.pageMode });

  // Verify: "Halaman Kosong" condition
  const isSchemaDriven = !!newPage.schema;
  const emptyCheck = isSchemaDriven ? (newPage.schema?.blocks?.length ?? 0) === 0 : newPage.elements.length === 0;
  console.log('Step 5 - Empty state check:', { isSchemaDriven, emptyCheck, shouldShowEmpty: emptyCheck });

  if (!emptyCheck && newPage.schema.blocks.length > 0) {
    console.log('✅ SUCCESS: Block would be visible on canvas!');
  } else {
    console.log('❌ FAIL: Block would NOT be visible!');
  }
} catch (e) {
  console.error('FAILED:', e.message);
  console.error('Stack:', e.stack);
}

function deepFreeze(obj) {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (Object.isFrozen(obj)) return obj;
  Object.freeze(obj);
  for (const val of Object.values(obj)) deepFreeze(val);
  return obj;
}
