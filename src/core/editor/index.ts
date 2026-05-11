// ═══════════════════════════════════════════════════════════════════
// EDITOR ENGINE — Public API
// ═══════════════════════════════════════════════════════════════════
// The Editor Engine is the bridge between UI and Schema.
//
// Architecture:
//   UI Editor → updateSchemaBlock() → schema store → renderer → rerender
//
// All editors modify the SCHEMA, never the DOM directly.
// This enables: undo/redo, collaboration, AI editing, history, autosave.

// Types
export type {
  PropertyFieldType,
  PropertyField,
  PropertySchema,
  SchemaPatch,
  SelectionContext,
  EditEvent,
} from './types';

// Deep merge
export { deepMergeBlock, batchMergeBlocks } from './deep-merge';

// Edit event bus
export { editBus } from './edit-bus';

// Patch history — immer-based undo/redo infrastructure
export { PatchHistory, patchHistory, connectHistoryToEditBus } from './patch-history';
export type { PatchHistoryEntry, PatchHistoryState } from './patch-history';

// Property schemas
export {
  getPropertySchema,
  getAllPropertySchemas,
  COVER_PROPERTY_SCHEMA,
  PETUNJUK_PROPERTY_SCHEMA,
  TP_PROPERTY_SCHEMA,
  ALUR_PROPERTY_SCHEMA,
  SKENARIO_PROPERTY_SCHEMA,
  DEFBOX_PROPERTY_SCHEMA,
  NCGRID_PROPERTY_SCHEMA,
  FLASHCARD_PROPERTY_SCHEMA,
  FTAB_PROPERTY_SCHEMA,
  NKCARD_PROPERTY_SCHEMA,
  DISKUSI_PROPERTY_SCHEMA,
  KUIS_PROPERTY_SCHEMA,
  SORTIRGAME_PROPERTY_SCHEMA,
  RODAGAME_PROPERTY_SCHEMA,
  HASIL_PROPERTY_SCHEMA,
  REFLEKSI_PROPERTY_SCHEMA,
  PENUTUP_PROPERTY_SCHEMA,
  TABELACCORD_PROPERTY_SCHEMA,
} from './property-schemas';

// Block selection overlay — reusable editing overlay for schema blocks
export { BlockSelectionOverlay } from './overlay/BlockSelectionOverlay';
export type { BlockSelectionOverlayProps } from './overlay/BlockSelectionOverlay';

// Inline text editor — contentEditable wrapper for inline block editing
export { InlineTextEditor, useInlineEditor } from './inline-editor/InlineTextEditor';
export type { InlineTextEditorProps, UseInlineEditorOptions } from './inline-editor/InlineTextEditor';

// Transform controls — resize handles and drag-to-move for schema blocks
export { TransformHandles, useTransformDrag } from './transform-controls/TransformHandles';
export type { TransformHandlesProps, UseTransformDragOptions } from './transform-controls/TransformHandles';
