// ═══════════════════════════════════════════════════════════════════
// SCHEMA APPLY — Barrel Export
// ═══════════════════════════════════════════════════════════════════
// Re-exports everything from sub-modules so that
// `import { ... } from '../schema-apply'` still works.
// ═══════════════════════════════════════════════════════════════════

// write.ts — Direct write operations
export {
  invalidateBlockTemplateMapping,
  applyBlocksToPages,
  applyBlockToPages,
  applyBlocksByBlockType,
  setPageSchemaBlocks,
  findPageIdByType,
  findPageIdsByType,
} from './write';

// transaction-ops.ts — Transaction-based operations
export {
  commitSceneTransaction,
  rebalancePageCompression,
  promoteSceneSplitToPage,
  mergePagesTransaction,
} from './transaction-ops';

// nested-ops.ts — Nested block transaction operations
export {
  transactionInsertNested,
  transactionMoveNested,
  transactionDuplicateBlock,
} from './nested-ops';

// scene-bridge.ts — Scene plan → transaction bridge
export {
  rebalanceFromScenePlan,
} from './scene-bridge';
