// ═══════════════════════════════════════════════════════════════════════
// EXPORT GLOBAL TYPES — Window augmentation for export pipeline
//
// Declares the runtime globals injected by the export API route
// and consumed by the export client entry point:
//   - window.__EXPORT_DATA__  → Full project state for store hydration
//   - window.__INTERACTIVE_STORE__ → Zustand store ref for postMessage bridge
// ═══════════════════════════════════════════════════════════════════════

import type { StoreApi } from 'zustand';
import type { InteractiveState } from '@/store/interactive-store';
import type {
  MetaState,
  CpState,
  TpItem,
  AtpState,
  AlurItem,
  KuisItem,
  Module,
  Game,
  MateriState,
  SkenarioChapter,
  PetunjukData,
  DiskusiData,
  RefleksiData,
  PenutupData,
  SuaraConfig,
} from '@/store/authoring/types';
import type { CanvaPage } from '@/components/canva/types';

// ── Export Data ─────────────────────────────────────────────────────
// The full project state injected by the export API route as
// <script>window.__EXPORT_DATA__={...};</script>
// All authoring fields are always present (with empty defaults).

export interface ExportData {
  pages: CanvaPage[];
  ratioId: string;
  meta: MetaState;
  allKuis: KuisItem[];
  allModules: Module[];
  games: Game[];
  cp: CpState;
  tp: TpItem[];
  atp: AtpState;
  alur: AlurItem[];
  materi: MateriState;
  skenario: SkenarioChapter[];
  petunjuk: PetunjukData;
  diskusi: DiskusiData;
  refleksi: RefleksiData;
  penutup: PenutupData;
  suara: SuaraConfig;
}

// ── Window Augmentation ─────────────────────────────────────────────

declare global {
  interface Window {
    /** Export data injected by the API route for client-side store hydration */
    __EXPORT_DATA__?: ExportData;
    /** Interactive store reference for Live Preview postMessage bridge */
    __INTERACTIVE_STORE__?: StoreApi<InteractiveState>;
  }
}
