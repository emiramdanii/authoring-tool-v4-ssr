// ── System Slice ──────────────────────────────────────────────────
import type { StateCreator } from 'zustand';
import { toast } from 'sonner';
import type { AuthoringState, KuisItem } from './types';
import { STORAGE_KEY } from './types';
import { ensureModuleIds, ensureKuisIds } from '@/lib/module-resolver';

export type SystemSlice = Pick<AuthoringState, 'dirty' | 'guruPw' | 'markDirty' | 'markClean' | 'saveToStorage' | 'loadFromStorage' | 'calcCompleteness'>;

export const createSystemSlice: StateCreator<AuthoringState, [], [], SystemSlice> = (set, get) => ({
  dirty: false,
  guruPw: 'guru123',

  markDirty: () => set({ dirty: true }),
  markClean: () => set({ dirty: false }),

  saveToStorage: () => {
    try {
      const s = get();
      const data = {
        meta: s.meta, cp: s.cp, tp: s.tp, atp: s.atp, alur: s.alur,
        skenario: s.skenario, kuis: s.kuis, modules: s.modules,
        games: s.games, materi: s.materi, guruPw: s.guruPw,
        petunjuk: s.petunjuk, diskusi: s.diskusi, refleksi: s.refleksi,
        penutup: s.penutup, suara: s.suara,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      set({ dirty: false });
      toast.success('\u2705 Tersimpan ke browser');
      return true;
    } catch {
      toast.error('\u274C Gagal menyimpan');
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
        modules: ensureModuleIds(data.modules || []),
        games: ensureModuleIds(data.games || []),
        materi: data.materi || { blok: [] },
        guruPw: data.guruPw || 'guru123',
        petunjuk: data.petunjuk || get().petunjuk,
        diskusi: data.diskusi || get().diskusi,
        refleksi: data.refleksi || get().refleksi,
        penutup: data.penutup || get().penutup,
        suara: data.suara || get().suara,
        dirty: false,
      });
      toast.info('\uD83D\uDCC2 Data tersimpan dimuat');
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
    return Math.round((pts / max) * 100);
  },
});
