// ═══════════════════════════════════════════════════════════════════
// BLOCK DEFINITION REGISTRY — Barrel Export
// ═══════════════════════════════════════════════════════════════════
// Re-exports everything from all sub-modules so that
// `from '../BlockDefinitionRegistry'` still works identically.

// Types and constants
export type { BlockPersonality, BlockCapabilities, SceneBlockLayout, BlockDefinitionMeta } from './types';
export { PERSONALITY_CONFIG, DEFAULT_CAPABILITIES } from './types';

// Block definitions
export { BLOCK_DEFINITIONS } from './definitions';

// Query functions
export {
  getBlockMeta,
  getBlocksByCategoryMeta,
  getBlocksByPersonalityMeta,
  getBlocksForTemplateTypeMeta,
  isBlockRegisteredMeta,
  getBlockCapabilitiesMeta,
  getBlockPropertySchemaMeta,
  getAllBlockMeta,
} from './api';
