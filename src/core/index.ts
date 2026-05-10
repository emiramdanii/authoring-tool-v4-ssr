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

// Component registry (legacy — CSS-class based)
export { BLOCK_REGISTRY, getBlockMeta, getBlocksForTemplate } from './registry/blocks';
export type { BlockType, BlockMeta } from './registry/blocks';

// Scene registry (new — capability-based)
export {
  SCENE_REGISTRY,
  getBlockDefinition,
  getBlocksByCategory,
  getBlocksForTemplateType,
  isBlockRegistered,
  getBlockCapabilities,
  RegistryBlockRenderer,
  DEFAULT_CAPABILITIES,
} from './registry/SceneRegistry';
export type {
  BlockCapabilities,
  SceneBlockLayout,
  BlockDefinition,
  BlockRendererProps,
} from './registry/SceneRegistry';

// Renderer
export { SchemaScreenRenderer, SchemaBlockRenderer, TokenResolver } from './renderer/SchemaRenderer';
export type { SchemaRenderMode, SchemaRendererProps } from './renderer/SchemaRenderer';

// Engine
export { SchemaEngine, loadPreset, getAvailablePresets, schemaToCanvaPages } from './engine/SchemaEngine';

// Template Adapter — converts legacy pages to schema
export { convertToSchema, inferThemeId, paletteToTokenOverrides } from './engine/TemplateAdapter';
