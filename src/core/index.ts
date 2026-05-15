// ═══════════════════════════════════════════════════════════════════
// CORE SYSTEM — Public API
// ═══════════════════════════════════════════════════════════════════
// Import everything from this single entry point.

// Theme system
export { DEFAULT_TOKENS, THEME_PRESETS, resolveTokens } from './themes/tokens';
export type { DesignTokens, ThemePreset } from './themes/tokens';

// Schema types
export type {
  SchemaBlock,
  ScreenSchema,
  LessonSchema,
  BlockLayout,
  BaseBlock,
  CoverBlock,
  PetunjukBlock,
  TpBlock,
  AlurBlock,
  SkenarioBlock,
  DefBoxBlock,
  NcGridBlock,
  FlashcardSetBlock,
  FtabBlock,
  NormaKartuBlock,
  DiskusiBlock,
  KuisBlock,
  SortirGameBlock,
  RodaGameBlock,
  HasilBlock,
  RefleksiBlock,
  PenutupBlock,
  TabelAccordionBlock,
} from './schema/types';

// Scene registry — capability-based block dispatch (includes renderers)
export {
  SCENE_REGISTRY,
  getBlockDefinition,
  getBlocksByCategory,
  getBlocksForTemplateType,
  isBlockRegistered,
  getBlockCapabilities,
  getBlockPropertySchema,
  getAllBlockDefinitions,
  DEFAULT_CAPABILITIES,
} from './registry/SceneRegistry';
export type {
  BlockCapabilities,
  SceneBlockLayout,
  BlockDefinition,
} from './registry/SceneRegistry';

// Block definition registry — renderer-free (safe for store imports)
export {
  BLOCK_DEFINITIONS,
  getBlockMeta,
  getBlocksByCategoryMeta,
  getBlocksForTemplateTypeMeta,
  isBlockRegisteredMeta,
  getBlockCapabilitiesMeta,
  getBlockPropertySchemaMeta,
  getAllBlockMeta,
} from './registry/BlockDefinitionRegistry';
export type {
  BlockDefinitionMeta,
} from './registry/BlockDefinitionRegistry';

// Renderer
export { SchemaScreenRenderer, SchemaBlockRenderer, TokenResolver } from './renderer/SchemaRenderer';
export type { SchemaRenderMode, ScreenRendererProps, BlockRenderProps } from './renderer/SchemaRenderer';

// Engine
export { SchemaEngine, loadPreset, getAvailablePresets, schemaToCanvaPages } from './engine/SchemaEngine';

// Template Adapter — converts legacy pages to schema
export { convertToSchema, paletteToTokenOverrides } from './engine/TemplateAdapter';

// Schema Validation — runtime invariant checker
export {
  validateBlock,
  validateSchema,
  validateBlocks,
  assertValidSchema,
  assertValidBlocks,
  isSchemaVersionCompatible,
  getRegisteredBlockTypes,
  SCHEMA_VERSION,
} from './schema/validation';
export type {
  ValidationError,
  ValidationResult,
} from './schema/validation';

// Schema Immutable Operations — safe mutations for the schema tree
export {
  deepFreeze,
  isDeepFrozen,
  deepClone,
  produce,
  findBlockById,
  findBlockIndex,
  replaceBlock,
  patchBlock,
  removeBlock,
  insertBlock,
  moveBlock,
  updateSchema,
  bumpVersion,
  snapshot,
  snapshotBlocks,
} from './schema/immutable';

// Editor Engine — schema-driven visual editing
export {
  deepMergeBlock,
  batchMergeBlocks,
  editBus,
  BlockSelectionOverlay,
  InlineTextEditor,
  useInlineEditor,
} from './editor';
export type {
  PropertyFieldType,
  PropertyField,
  PropertySchema,
  SchemaPatch,
  SelectionContext,
  EditEvent,
  BlockSelectionOverlayProps,
  InlineTextEditorProps,
  UseInlineEditorOptions,
} from './editor';
