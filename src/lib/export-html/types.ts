// ═══════════════════════════════════════════════════════════════
// TYPES — Export state interface for HTML generation
// ═══════════════════════════════════════════════════════════════

import type {
  MetaState, CpState, TpItem, AtpState, AlurItem,
  KuisItem, MateriState,
} from '@/store/authoring-store';

export interface ExportState {
  meta: MetaState;
  cp: CpState;
  tp: TpItem[];
  atp: AtpState;
  alur: AlurItem[];
  skenario: Array<Record<string, unknown>>;
  kuis: KuisItem[];
  materi: MateriState;
  modules: Array<Record<string, unknown>>;
  games: Array<Record<string, unknown>>;
}
