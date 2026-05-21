// ═══════════════════════════════════════════════════════════════════
// IMMUTABLE SCHEMA OPERATIONS — Barrel export
// ═══════════════════════════════════════════════════════════════════
// This barrel re-exports everything from the split modules so that
// existing imports like `from './immutable'` continue to work.
//
// Modules:
//   core.ts             — deepFreeze, deepClone, produce
//   container-helpers.ts — ContainerRef, nested block helpers
//   block-ops.ts        — Block-level CRUD operations
//   scene-ops.ts        — Scene-level and schema-level operations
// ═══════════════════════════════════════════════════════════════════

// Core primitives
export { deepFreeze, isDeepFrozen, deepClone, produce } from './core';

// Container reference + internal helpers (public for transaction system)
export type { ContainerRef } from './container-helpers';
export { regenerateNestedIds } from './container-helpers';

// Block-level operations
export {
  findBlockById,
  findBlockIndex,
  replaceBlock,
  patchBlock,
  removeBlock,
  insertBlock,
  moveBlock,
  moveBlockNested,
  insertBlockNested,
  duplicateBlock,
} from './block-ops';

// Scene-level and schema-level operations
export {
  splitScene,
  mergeScene,
  updateSchema,
  bumpVersion,
  snapshot,
  snapshotBlocks,
} from './scene-ops';
