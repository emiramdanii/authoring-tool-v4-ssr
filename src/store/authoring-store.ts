// ═══════════════════════════════════════════════════════════════════
// AUTHORING STORE — LEGACY NAME (DEPRECATED)
// ═══════════════════════════════════════════════════════════════════
// ⚠️  DEPRECATION NOTICE:
//   This file is kept for backward compatibility.
//   New code should import from '@/store/editor-projection-store'.
//
//   The name "AuthoringStore" is misleading because this store is
//   NOT the authoritative source of content. The SchemaBlock tree
//   (page.schema.blocks) is the single source of truth.
//
//   This store is a PROJECTION — it projects schema data into
//   editor-friendly shapes for the Konten panel. Renaming to
//   "EditorProjectionStore" makes the architectural role clear.
//
// Migration guide:
//   OLD: import { useAuthoringStore } from '@/store/authoring-store';
//   NEW: import { useEditorProjectionStore } from '@/store/editor-projection-store';
// ═══════════════════════════════════════════════════════════════════

// ── Backward-compatible re-exports ────────────────────────────────
// All imports from '@/store/authoring-store' continue to work.
export { useAuthoringStore } from './authoring/index';
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
  AuthoringState,
} from './authoring/types';

export { VERB_OPTIONS, COLOR_OPTIONS, colorForIndex, deepClone } from './authoring/types';
