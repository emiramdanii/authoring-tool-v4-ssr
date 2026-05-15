// ═══════════════════════════════════════════════════════════════════
// SCHEMA MODULE — Barrel Export
// ═══════════════════════════════════════════════════════════════════
// Single entry point for all schema-related imports.
//
// Usage:
//   import { SchemaBlock, ScreenSchema, produce, splitScene } from '@/core/schema';
//   import { assertValidSchema, SCHEMA_VERSION } from '@/core/schema';
//   import { BlockCapabilityRegistry } from '@/core/schema';
//
// INTERNALS: This module re-exports the public API of:
//   - types.ts        — SchemaBlock, ScreenSchema, LessonSchema, hints
//   - immutable.ts    — produce, deepFreeze, insert/remove/move/patch/duplicate/split/merge
//   - validation.ts   — validateBlock, assertValidSchema, SCHEMA_VERSION
//   - ensure-schema.ts — ensurePageSchema, generateBlockId, isSchemaPage
//   - schema-apply.ts  — applyBlocksToPages, setPageSchemaBlocks
//   - schema-projection.ts — deriveProjectionFromPages
//   - schema-migration.ts  — migrateSchema, migrateAllSchemas
//   - capability-registry.ts — BlockCapabilityRegistry
//   - scene-transaction.ts  — SceneTransaction
//   - session-state.ts      — SessionState, DocumentState
// ═══════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────
export type {
  SchemaBlock,
  ScreenSchema,
  LessonSchema,
  BaseBlock,
  BlockLayout,
  CompressionHints,
  SemanticHints,
  // Concrete block types
  CoverBlock,
  HeroBlock,
  PetunjukBlock,
  TpBlock,
  AlurBlock,
  SkenarioBlock,
  DefBoxBlock,
  NcGridBlock,
  FlashcardSetBlock,
  FtabBlock,
  NormaKartuBlock,
  MateriSectionBlock,
  DiskusiBlock,
  KuisBlock,
  SortirGameBlock,
  RodaGameBlock,
  MemoryGameBlock,
  MatchingGameBlock,
  FillBlankGameBlock,
  WordSearchGameBlock,
  TrueFalseGameBlock,
  DragDropGameBlock,
  CrosswordGameBlock,
  TeamBuzzerGameBlock,
  HasilBlock,
  RefleksiBlock,
  PenutupBlock,
  TabelAccordionBlock,
  TujuanDisplayBlock,
  MotivasiBlock,
  RangkumanBlock,
} from './types';

// ── Immutable Operations ──────────────────────────────────────────
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
} from './immutable';

export type { ContainerRef } from './immutable';

// ── Validation ────────────────────────────────────────────────────
export {
  validateBlock,
  validateSchema,
  validateBlocks,
  assertValidSchema,
  assertValidBlocks,
  isSchemaVersionCompatible,
  getRegisteredBlockTypes,
  SCHEMA_VERSION,
} from './validation';

export type { ValidationError, ValidationResult } from './validation';

// ── Ensure Schema (Lazy Migration) ────────────────────────────────
export {
  ensurePageSchema,
  ensurePageSchemaWithMigration,
  getPageBlocks,
  findBlockInPage,
  generateBlockId,
  generatePageId,
  isSchemaPage,
  validateCanvaPageInvariant,
  isLegacyPage,
  migrateAllPages,
} from './ensure-schema';

// ── Schema Apply (Write to Canvas) ────────────────────────────────
export {
  applyBlocksToPages,
  applyBlockToPages,
  applyBlocksByBlockType,
  setPageSchemaBlocks,
  findPageIdByType,
  findPageIdsByType,
  // Registry-derived mapping cache invalidation
  invalidateBlockTemplateMapping,
  // Transaction-based operations
  commitSceneTransaction,
  rebalancePageCompression,
  promoteSceneSplitToPage,
  mergePagesTransaction,
  // Scene plan → transaction bridge
  rebalanceFromScenePlan,
} from './schema-apply';

// ── Schema Projection (Schema → Store) ───────────────────────────
export {
  deriveProjectionFromPages,
  deriveProjectionFromPage,
} from './schema-projection';

// ── Schema Migration ──────────────────────────────────────────────
export {
  migrateSchema,
  migrateAllSchemas,
  inferSemanticDefaults,
} from './schema-migration';

// ── Block Capability Registry ─────────────────────────────────────
export {
  BlockCapabilityRegistry,
  getBlockCapabilities,
  // Instance-based (requires SchemaBlock)
  isBlockCompressionCapable,
  isBlockSplittable,
  isBlockInteractive,
  isBlockMeasurable,
  isBlockLazyRenderable,
  isBlockRendererHandlesCompression,
  // Type-string based (no SchemaBlock needed — uses cached registry)
  isFullPageBlockType,
  isBlockTypeInteractive,
  isBlockTypeCompressionCapable,
  isBlockTypeSplittable,
  isBlockTypeMeasurable,
  isBlockTypeRendererHandlesCompression,
  // Overflow rule derivation (capability-driven default)
  deriveOverflowRule,
  // Composite block detection (single source of truth)
  isCompositeBlockType,
  // Composite container descriptor (descriptor-driven access)
  getCompositeContainerDescriptor,
  // Full-page / Game block type sets (data-driven, replaces hardcoded checks)
  isFullPageBlockTypeExplicit,
  isGameBlockType,
  getGameBlockTypes,
  getFullPageBlockTypes,
  // CanvaElement bridges (legacy type space → capability registry)
  isInteractiveElementType,
  isCanvaElementPreviewable,
} from './capability-registry';

export type { BlockCapabilityInfo, DerivedCapabilities, CompositeContainerDescriptor, OverflowRule } from './capability-registry';

// ── Scene Transaction System ──────────────────────────────────────
export {
  SceneTransaction,
  createTransaction,
} from './scene-transaction';

export type { TransactionStep, TransactionResult } from './scene-transaction';

// ── Session State (Interaction Isolation) ─────────────────────────
export {
  createSessionState,
  deriveDocumentState,
  isDocumentPure,
  assertDocumentPurity,
} from './session-state';

export type { DocumentState, SessionInteractionState } from './session-state';
