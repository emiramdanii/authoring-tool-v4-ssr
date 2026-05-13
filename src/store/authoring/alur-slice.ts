// ── Alur Slice ────────────────────────────────────────────────────
import type { StateCreator } from 'zustand';
import type { AuthoringState, AlurItem } from './types';

export type AlurSlice = Pick<AuthoringState, 'alur' | 'addAlur' | 'deleteAlur' | 'updateAlur' | 'reorderAlur'>;

export const createAlurSlice: StateCreator<AuthoringState, [], [], AlurSlice> = (set) => ({
  alur: [],
  addAlur: () => {
    set((s) => ({
      alur: [...s.alur, { fase: 'Inti', durasi: '15 menit', judul: '', deskripsi: '' }],
      dirty: true,
    }));
  },
  deleteAlur: (index: number) => {
    set((s) => ({ alur: s.alur.filter((_, i) => i !== index), dirty: true }));
  },
  updateAlur: (index: number, key: keyof AlurItem, value: string) => {
    set((s) => {
      const newAlur = [...s.alur];
      newAlur[index] = { ...newAlur[index], [key]: value };
      return { alur: newAlur, dirty: true };
    });
  },
  reorderAlur: (fromIndex: number, toIndex: number) => {
    set((s) => {
      const alur = [...s.alur];
      const [moved] = alur.splice(fromIndex, 1);
      alur.splice(toIndex, 0, moved);
      return { alur, dirty: true };
    });
  },
});
