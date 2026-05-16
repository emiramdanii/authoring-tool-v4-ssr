// ═══════════════════════════════════════════════════════════════════
// EDITOR PROJECTION STORE — Derived editor state from SchemaBlock tree
// ═══════════════════════════════════════════════════════════════════
// ARCHITECTURAL ROLE:
//   This store is a PROJECTION of the schema tree, NOT a source of truth.
//   The schema tree (page.schema.blocks) is the single source of truth.
//
//   Unidirectional flow:
//     SchemaBlock → EditorProjectionStore (OK)
//     EditorProjectionStore → SchemaBlock (FORBIDDEN)
//
//   This store exists only to:
//     1. Provide a convenient editor interface for the Konten panel
//     2. Cache derived state for form editing
//     3. Support gradual migration from the legacy authoring pipeline
//
//   When the Konten panel edits content, it should write to the schema
//   tree first (via immutable operations in core/schema/immutable),
//   then the projection store updates as a side effect.
//
// NAMING RATIONALE:
//   "EditorProjectionStore" (not "AuthoringStore") makes it clear that:
//     - This is a DERIVED store, not authoritative
//     - It PROJJECTS schema data into editor-friendly shapes
//     - It should NEVER be the source of canvas content
//
// BACKWARD COMPATIBILITY:
//   All imports from '@/store/authoring-store' continue to work.
//   The old name is aliased here for gradual migration.
// ═══════════════════════════════════════════════════════════════════

// ── Backward-compatible re-exports ────────────────────────────────
// All imports from '@/store/authoring-store' continue to work.
// New code should use '@/store/editor-projection-store' for clarity.
export { useAuthoringStore as useEditorProjectionStore } from './authoring/index';
export type {
  PanelId,
  MetaState,
  CpState,
  TpItem,
  AtpPertemuan,
  AtpState,
  AlurItem,
  KuisItem,
  MateriBlok,
  MateriState,
  PetunjukLangkah,
  PetunjukData,
  DiskusiPertanyaan,
  DiskusiData,
  RefleksiPertanyaan,
  RefleksiData,
  PenutupPreviewItem,
  PenutupData,
  SuaraConfig,
  MetaPreset,
  CpPreset,
  TpPreset,
  AtpPreset,
  AlurPreset,
  KuisPreset,
  Module,
  AuthoringState as EditorProjectionState,
} from './authoring/types';

export { VERB_OPTIONS, COLOR_OPTIONS, colorForIndex, deepClone } from './authoring/types';
