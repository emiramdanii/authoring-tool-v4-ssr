// ── Kuis Slice ────────────────────────────────────────────────────
import type { StateCreator } from 'zustand';
import type { AuthoringState } from './types';
import { generateKuisId } from '@/lib/module-resolver';

export type KuisSlice = Pick<AuthoringState, 'kuis' | 'addKuis' | 'deleteKuis' | 'updateKuis' | 'updateKuisOpt' | 'reorderKuis'>;

export const createKuisSlice: StateCreator<AuthoringState, [], [], KuisSlice> = (set) => ({
  kuis: [],
  addKuis: () => {
    set((s) => ({
      kuis: [...s.kuis, { _id: generateKuisId(), q: '', opts: ['', '', '', ''], ans: 0, ex: '' }],
      dirty: true,
    }));
  },
  deleteKuis: (index: number) => {
    set((s) => ({ kuis: s.kuis.filter((_, i) => i !== index), dirty: true }));
  },
  updateKuis: (index: number, key: string, value: unknown) => {
    set((s) => {
      const newKuis = [...s.kuis];
      newKuis[index] = { ...newKuis[index], [key]: value };
      return { kuis: newKuis, dirty: true };
    });
  },
  updateKuisOpt: (index: number, optIndex: number, value: string) => {
    set((s) => {
      const newKuis = [...s.kuis];
      const opts = [...(newKuis[index].opts || ['', '', '', ''])];
      opts[optIndex] = value;
      newKuis[index] = { ...newKuis[index], opts };
      return { kuis: newKuis, dirty: true };
    });
  },
  reorderKuis: (fromIndex: number, toIndex: number) => {
    set((s) => {
      const kuis = [...s.kuis];
      const [moved] = kuis.splice(fromIndex, 1);
      kuis.splice(toIndex, 0, moved);
      return { kuis, dirty: true };
    });
  },
});
