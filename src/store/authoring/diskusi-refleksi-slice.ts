// ── Diskusi & Refleksi Slice ──────────────────────────────────────
// Update actions for diskusi and refleksi data.
// Follows the same pattern as motivasi-rangkuman-slice.
import type { StateCreator } from 'zustand';
import type { AuthoringState, DiskusiData, RefleksiData, DiskusiPertanyaan, RefleksiPertanyaan } from './types';
import { DEFAULT_DISKUSI, DEFAULT_REFLEKSI } from './initial-state';

export type DiskusiRefleksiSlice = Pick<AuthoringState,
  | 'diskusi' | 'refleksi'
  | 'updateDiskusi' | 'updateRefleksi'
  | 'addDiskusiPertanyaan' | 'removeDiskusiPertanyaan' | 'updateDiskusiPertanyaan'
  | 'addRefleksiPertanyaan' | 'removeRefleksiPertanyaan' | 'updateRefleksiPertanyaan'
>;

export const createDiskusiRefleksiSlice: StateCreator<AuthoringState, [], [], DiskusiRefleksiSlice> = (set) => ({
  diskusi: { ...DEFAULT_DISKUSI },
  refleksi: { ...DEFAULT_REFLEKSI },

  updateDiskusi: (data: Partial<DiskusiData>) => {
    set((s) => ({
      diskusi: { ...s.diskusi, ...data },
      dirty: true,
    }));
  },

  updateRefleksi: (data: Partial<RefleksiData>) => {
    set((s) => ({
      refleksi: { ...s.refleksi, ...data },
      dirty: true,
    }));
  },

  addDiskusiPertanyaan: () => {
    set((s) => ({
      diskusi: {
        ...s.diskusi,
        pertanyaan: [
          ...s.diskusi.pertanyaan,
          { label: `Pertanyaan ${s.diskusi.pertanyaan.length + 1}`, icon: '💭', teks: '', petunjuk: '' },
        ],
      },
      dirty: true,
    }));
  },

  removeDiskusiPertanyaan: (index: number) => {
    set((s) => ({
      diskusi: {
        ...s.diskusi,
        pertanyaan: s.diskusi.pertanyaan.filter((_, i) => i !== index),
      },
      dirty: true,
    }));
  },

  updateDiskusiPertanyaan: (index: number, data: Partial<DiskusiPertanyaan>) => {
    set((s) => ({
      diskusi: {
        ...s.diskusi,
        pertanyaan: s.diskusi.pertanyaan.map((p, i) => i === index ? { ...p, ...data } : p),
      },
      dirty: true,
    }));
  },

  addRefleksiPertanyaan: () => {
    set((s) => ({
      refleksi: {
        ...s.refleksi,
        pertanyaan: [
          ...s.refleksi.pertanyaan,
          { teks: '', petunjuk: '', warna: 'c', icon: '🪞' },
        ],
      },
      dirty: true,
    }));
  },

  removeRefleksiPertanyaan: (index: number) => {
    set((s) => ({
      refleksi: {
        ...s.refleksi,
        pertanyaan: s.refleksi.pertanyaan.filter((_, i) => i !== index),
      },
      dirty: true,
    }));
  },

  updateRefleksiPertanyaan: (index: number, data: Partial<RefleksiPertanyaan>) => {
    set((s) => ({
      refleksi: {
        ...s.refleksi,
        pertanyaan: s.refleksi.pertanyaan.map((p, i) => i === index ? { ...p, ...data } : p),
      },
      dirty: true,
    }));
  },
});
