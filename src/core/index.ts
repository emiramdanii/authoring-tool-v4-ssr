// ═══════════════════════════════════════════════════════════════════
// CORE SYSTEM — Public API
// ═══════════════════════════════════════════════════════════════════
// Import everything from this single entry point.

// Theme system
export { DEFAULT_TOKENS, DEFAULT_THEME_ID, THEME_PRESETS, resolveTokens } from './themes/tokens';
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
export { SchemaScreenRenderer, SchemaBlockRenderer, TokenResolver, resolveColor, resolveColorAlpha, resolveMuted, resolveSubtleBg, resolveSubtleBorder } from './renderer/SchemaRenderer';
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
  insertBlockNested,
  moveBlock,
  moveBlockNested,
  duplicateBlock,
  splitScene,
  mergeScene,
  updateSchema,
  bumpVersion,
  snapshot,
  snapshotBlocks,
} from './schema/immutable';
export type { ContainerRef } from './schema/immutable';

// Schema Migration — version upgrade system
export {
  migrateSchema,
  migrateAllSchemas,
  inferSemanticDefaults,
  MIGRATION_CHAIN,
} from './schema/schema-migration';
export type { SchemaMigration } from './schema/schema-migration';

// Schema Projection — derive EditorProjectionStore from schema
export {
  deriveProjectionFromPages,
  deriveProjectionFromPage,
} from './schema/schema-projection';
export type { SchemaProjection } from './schema/schema-projection';

// Block Capability Registry — derived from schema hints
export {
  BlockCapabilityRegistry,
  getBlockCapabilities as getSchemaCapabilities,
  isBlockCompressionCapable,
  isBlockSplittable,
  isBlockInteractive,
  isBlockMeasurable,
  isBlockLazyRenderable,
} from './schema/capability-registry';
export type { BlockCapabilityInfo, DerivedCapabilities } from './schema/capability-registry';

// Scene Transaction System — atomic layout mutations
export {
  SceneTransaction,
  createTransaction,
} from './schema/scene-transaction';
export type { TransactionStep, TransactionResult, RebalanceOptions } from './schema/scene-transaction';

// Session State — document vs interaction isolation
export {
  createSessionState,
  deriveDocumentState,
  isDocumentPure,
  assertDocumentPurity,
} from './schema/session-state';
export type { DocumentState, SessionInteractionState } from './schema/session-state';

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
