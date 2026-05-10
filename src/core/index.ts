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

// Component registry
export { BLOCK_REGISTRY, getBlockMeta, getBlocksForTemplate } from './registry/blocks';
export type { BlockType, BlockMeta } from './registry/blocks';

// Renderer
export { SchemaScreenRenderer, SchemaBlockRenderer, TokenResolver } from './renderer/SchemaRenderer';
export type { SchemaRenderMode, SchemaRendererProps } from './renderer/SchemaRenderer';

// Engine
export { SchemaEngine, loadPreset, getAvailablePresets, schemaToCanvaPages } from './engine/SchemaEngine';
