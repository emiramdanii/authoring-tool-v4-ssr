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
  AuthoringState,
} from './authoring/types';

export { VERB_OPTIONS, COLOR_OPTIONS, colorForIndex, deepClone } from './authoring/types';
