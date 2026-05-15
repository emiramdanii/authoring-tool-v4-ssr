// ── System Slice ──────────────────────────────────────────────────
import type { StateCreator } from 'zustand';
import { toast } from 'sonner';
import type { AuthoringState, KuisItem, Module } from './types';
import { STORAGE_KEY } from './types';
import { ensureModuleIds, ensureKuisIds } from '@/lib/module-resolver';
import { GAME_TYPES } from '@/lib/canva-constants';

export type SystemSlice = Pick<AuthoringState, 'dirty' | 'guruPw' | 'teacherMode' | 'markDirty' | 'markClean' | 'saveToStorage' | 'loadFromStorage' | 'calcCompleteness' | 'toggleSuaraAll' | 'setTeacherMode'>;

export const createSystemSlice: StateCreator<AuthoringState, [], [], SystemSlice> = (set, get) => ({
  dirty: false,
  guruPw: 'guru123',
  teacherMode: (typeof window !== 'undefined' && localStorage.getItem('silse_teacher_mode') === 'lengkap') ? 'lengkap' : 'sederhana',

  markDirty: () => set({ dirty: true }),
  markClean: () => set({ dirty: false }),

  setTeacherMode: (mode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('silse_teacher_mode', mode);
    }
    set({ teacherMode: mode });
  },

  toggleSuaraAll: () => {
    const s = get().suara;
    // If any sound is enabled, turn all off. Otherwise turn all on.
    const anyOn = Object.values(s).some(Boolean);
    const newVal = !anyOn;
    set({
      suara: {
        navigasi: newVal,
        benar: newVal,
        salah: newVal,
        selesai: newVal,
        klik: newVal,
        skor: newVal,
      },
      dirty: true,
    });
  },

  saveToStorage: () => {
    try {
      const s = get();
      const data = {
        meta: s.meta, cp: s.cp, tp: s.tp, atp: s.atp, alur: s.alur,
        skenario: s.skenario, kuis: s.kuis, modules: s.modules,
        games: s.games, materi: s.materi, guruPw: s.guruPw,
        petunjuk: s.petunjuk, diskusi: s.diskusi, refleksi: s.refleksi,
        motivasi: s.motivasi, rangkuman: s.rangkuman,
        penutup: s.penutup, suara: s.suara,
        _lastSavedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      set({ dirty: false });
      return true;
    } catch {
      return false;
    }
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      set({
        activePreset: null,
        meta: data.meta || get().meta,
        cp: data.cp || get().cp,
        tp: data.tp || [],
        atp: data.atp || get().atp,
        alur: data.alur || [],
        skenario: data.skenario || [],
        kuis: ensureKuisIds((data.kuis || []) as KuisItem[]),
        modules: ensureModuleIds(data.modules || []) as Module[],
        // Derive games from modules — no longer stored separately
        games: (ensureModuleIds(
          (data.modules || []).filter((m: Record<string, unknown>) =>
            (GAME_TYPES as readonly string[]).includes(m.type as string)
          )
        ) as Module[]),
        materi: data.materi || { blok: [] },
        guruPw: data.guruPw || 'guru123',
        petunjuk: data.petunjuk || get().petunjuk,
        diskusi: data.diskusi || get().diskusi,
        refleksi: data.refleksi || get().refleksi,
        motivasi: data.motivasi || get().motivasi,
        rangkuman: data.rangkuman || get().rangkuman,
        penutup: data.penutup || get().penutup,
        suara: data.suara || get().suara,
        dirty: false,
      });
      return true;
    } catch {
      return false;
    }
  },

  calcCompleteness: () => {
    const s = get();
    let pts = 0;
    let max = 0;
    const check = (val: boolean, w = 1) => { max += w; if (val) pts += w; };
    check(!!s.meta.judulPertemuan, 2);
    check(!!s.meta.kelas);
    check(!!s.cp.capaianFase, 2);
    check(s.tp.length > 0, 2);
    check(s.atp.pertemuan.length > 0, 2);
    check(s.alur.length >= 3, 2);
    check(s.kuis.length >= 5, 2);
    check(s.modules.length > 0, 1);
    check(!!s.motivasi.pertanyaanPemicu, 1);  // Motivasi has hook question
    check(s.rangkuman.poin.length > 0, 1);    // Rangkuman has key points
    return Math.round((pts / max) * 100);
  },
});
