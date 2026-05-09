// ── Preset Slice ──────────────────────────────────────────────────
import type { StateCreator } from 'zustand';
import { toast } from 'sonner';
import type { AuthoringState, KuisItem, MateriBlok } from './types';
import { deepClone } from './types';
import { ensureModuleIds, ensureKuisIds } from '@/lib/module-resolver';
import { GAME_TYPES } from '@/lib/canva-constants';
import {
  PRESETS_META,
  PRESETS_CP,
  PRESETS_TP,
  PRESETS_ATP,
  PRESETS_ALUR,
  PRESETS_KUIS,
  PRESETS_SKENARIO,
  PRESETS_MODULES,
  PRESETS_MATERI,
  PRESETS_PETUNJUK,
  PRESETS_DISKUSI,
  PRESETS_REFLEKSI,
  PRESETS_PENUTUP,
  PRESETS_SUARA,
  FULL_PRESET_MAP,
} from './presets';
import {
  DEFAULT_META,
  DEFAULT_CP,
  DEFAULT_ATP,
  DEFAULT_PETUNJUK,
  DEFAULT_DISKUSI,
  DEFAULT_REFLEKSI,
  DEFAULT_PENUTUP,
  DEFAULT_SUARA,
} from './initial-state';

export type PresetSlice = Pick<AuthoringState,
  | 'activePreset' | 'pendingCanvasGenerate' | 'games'
  | 'petunjuk' | 'diskusi' | 'refleksi' | 'penutup' | 'suara'
  | 'applyFullPreset' | 'applyKuisPreset' | 'applyTpPreset'
  | 'applyCpPreset' | 'applyAtpPreset' | 'applyAlurPreset'
  | 'applyMetaPreset' | 'newProject'
>;

export const createPresetSlice: StateCreator<AuthoringState, [], [], PresetSlice> = (set, get) => ({
  activePreset: null as string | null,
  pendingCanvasGenerate: null as string | null,
  games: [],
  petunjuk: { ...DEFAULT_PETUNJUK },
  diskusi: { ...DEFAULT_DISKUSI },
  refleksi: { ...DEFAULT_REFLEKSI },
  penutup: { ...DEFAULT_PENUTUP },
  suara: { ...DEFAULT_SUARA },

  applyFullPreset: (presetKey: string) => {
    const mapping = FULL_PRESET_MAP[presetKey];
    if (!mapping) { toast.error('Preset tidak ditemukan'); return; }

    const mp = PRESETS_META[mapping.meta];
    const cp = PRESETS_CP[mapping.cp];
    const tp = PRESETS_TP[mapping.tp];
    const atp = PRESETS_ATP[mapping.atp];
    const alur = PRESETS_ALUR[mapping.alur];
    const kuis = PRESETS_KUIS[mapping.kuis];
    const skenario = PRESETS_SKENARIO[mapping.skenario];
    const modules = PRESETS_MODULES[mapping.modules];
    const materi = PRESETS_MATERI[mapping.materi];
    const petunjuk = PRESETS_PETUNJUK[mapping.petunjuk];
    const diskusi = PRESETS_DISKUSI[mapping.diskusi];
    const refleksi = PRESETS_REFLEKSI[mapping.refleksi];
    const penutup = PRESETS_PENUTUP[mapping.penutup];
    const suara = PRESETS_SUARA[mapping.suara];

    set({
      activePreset: presetKey === 'blank' ? null : presetKey,
      meta: mp ? deepClone(mp) : get().meta,
      cp: cp ? deepClone(cp) : get().cp,
      tp: tp ? deepClone(tp.items) : [],
      atp: atp ? deepClone(atp) : get().atp,
      alur: alur ? deepClone(alur.steps) : [],
      kuis: kuis ? ensureKuisIds(deepClone(kuis.soal) as KuisItem[]) : [],
      skenario: skenario ? deepClone(skenario) : [],
      materi: materi ? { blok: deepClone(materi) as unknown as MateriBlok[] } : { blok: [] },
      modules: modules ? ensureModuleIds(deepClone(modules)) : [],
      games: modules ? ensureModuleIds(deepClone(modules)).filter((m: Record<string, unknown>) => (GAME_TYPES as readonly string[]).includes(m.type as string)) : [],
      petunjuk: petunjuk ? deepClone(petunjuk) : { ...DEFAULT_PETUNJUK },
      diskusi: diskusi ? deepClone(diskusi) : { ...DEFAULT_DISKUSI },
      refleksi: refleksi ? deepClone(refleksi) : { ...DEFAULT_REFLEKSI },
      penutup: penutup ? deepClone(penutup) : { ...DEFAULT_PENUTUP },
      suara: suara ? deepClone(suara) : { ...DEFAULT_SUARA },
      dirty: false,
    });
    if (presetKey === 'blank') {
      toast.success('\u2728 Proyek kosong dibuat');
    } else {
      toast.success(`\u26A1 Preset diterapkan: ${presetKey}`);
    }
    set({ pendingCanvasGenerate: presetKey === 'blank' ? null : presetKey });
  },

  applyKuisPreset: (presetKey: string) => {
    const p = PRESETS_KUIS[presetKey];
    if (!p) return;
    set({ kuis: deepClone(p.soal), dirty: true });
    toast.success(`\u2705 Preset Kuis diterapkan: ${p.label}`);
  },

  applyTpPreset: (presetKey: string) => {
    const p = PRESETS_TP[presetKey];
    if (!p) return;
    set({ tp: deepClone(p.items), dirty: true });
    toast.success(`\u2705 Preset TP diterapkan: ${p.label}`);
  },

  applyCpPreset: (presetKey: string) => {
    const p = PRESETS_CP[presetKey];
    if (!p) return;
    set({ cp: deepClone(p), dirty: true });
    toast.success(`\u2705 Preset CP diterapkan: ${p.label}`);
  },

  applyAtpPreset: (presetKey: string) => {
    const p = PRESETS_ATP[presetKey];
    if (!p) return;
    set({ atp: deepClone(p), dirty: true });
    toast.success(`\u2705 Preset ATP diterapkan: ${p.label}`);
  },

  applyAlurPreset: (presetKey: string) => {
    const p = PRESETS_ALUR[presetKey];
    if (!p) return;
    set({ alur: deepClone(p.steps), dirty: true });
    toast.success(`\u2705 Preset Alur diterapkan: ${p.label}`);
  },

  applyMetaPreset: (presetKey: string) => {
    const p = PRESETS_META[presetKey];
    if (!p) return;
    set({ meta: deepClone(p), dirty: true });
    toast.success(`\u2705 Preset meta diterapkan: ${p.label}`);
  },

  newProject: () => {
    set({
      activePreset: null,
      meta: { ...DEFAULT_META },
      cp: { ...DEFAULT_CP },
      tp: [],
      atp: { ...DEFAULT_ATP },
      alur: [],
      skenario: [],
      kuis: [],
      modules: [],
      games: [], // Empty because modules is empty
      materi: { blok: [] },
      petunjuk: { ...DEFAULT_PETUNJUK },
      diskusi: { ...DEFAULT_DISKUSI },
      refleksi: { ...DEFAULT_REFLEKSI },
      penutup: { ...DEFAULT_PENUTUP },
      suara: { ...DEFAULT_SUARA },
      dirty: false,
      activePanel: 'dashboard',
    });
    toast.success('\u2728 Proyek baru dibuat');
  },
});
