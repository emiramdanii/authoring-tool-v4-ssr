// ── TP (Tujuan Pembelajaran) Slice ────────────────────────────────
import type { StateCreator } from 'zustand';
import type { AuthoringState, TpItem } from './types';
import { colorForIndex } from './types';

export type TpSlice = Pick<AuthoringState, 'tp' | 'addTp' | 'deleteTp' | 'updateTp' | 'reorderTp'>;

export const createTpSlice: StateCreator<AuthoringState, [], [], TpSlice> = (set, get) => ({
  tp: [],
  addTp: () => {
    const { tp } = get();
    const newTp: TpItem = {
      verb: 'Menjelaskan', desc: '', pertemuan: 1,
      color: colorForIndex(tp.length),
    };
    set({ tp: [...tp, newTp], dirty: true });
  },
  deleteTp: (index: number) => {
    set((s) => ({ tp: s.tp.filter((_, i) => i !== index), dirty: true }));
  },
  updateTp: (index: number, key: keyof TpItem, value: unknown) => {
    set((s) => {
      const newTp = [...s.tp];
      newTp[index] = { ...newTp[index], [key]: value };
      return { tp: newTp, dirty: true };
    });
  },
  reorderTp: (fromIndex: number, toIndex: number) => {
    set((s) => {
      const tp = [...s.tp];
      const [moved] = tp.splice(fromIndex, 1);
      tp.splice(toIndex, 0, moved);
      return { tp, dirty: true };
    });
  },
});
