// ── ATP (Alur Tujuan Pembelajaran) Slice ──────────────────────────
import type { StateCreator } from 'zustand';
import type { AuthoringState, AtpPertemuan } from './types';
import { DEFAULT_ATP } from './initial-state';

export type AtpSlice = Pick<AuthoringState, 'atp' | 'updateAtpNamaBab' | 'addAtpPertemuan' | 'deleteAtpPertemuan' | 'updateAtpPertemuan'>;

export const createAtpSlice: StateCreator<AuthoringState, [], [], AtpSlice> = (set) => ({
  atp: { ...DEFAULT_ATP },
  updateAtpNamaBab: (value: string) => {
    set((s) => ({ atp: { ...s.atp, namaBab: value }, dirty: true }));
  },
  addAtpPertemuan: () => {
    set((s) => ({
      atp: {
        ...s.atp,
        pertemuan: [...s.atp.pertemuan, { judul: '', tp: '', durasi: '2\u00D740 menit', kegiatan: '', penilaian: '' }],
      },
      dirty: true,
    }));
  },
  deleteAtpPertemuan: (index: number) => {
    set((s) => ({
      atp: { ...s.atp, pertemuan: s.atp.pertemuan.filter((_, i) => i !== index) },
      dirty: true,
    }));
  },
  updateAtpPertemuan: (index: number, key: keyof AtpPertemuan, value: string) => {
    set((s) => {
      const newPertemuan = [...s.atp.pertemuan];
      newPertemuan[index] = { ...newPertemuan[index], [key]: value };
      return { atp: { ...s.atp, pertemuan: newPertemuan }, dirty: true };
    });
  },
});
