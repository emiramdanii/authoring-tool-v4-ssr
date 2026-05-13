// ── CP (Capaian Pembelajaran) Slice ───────────────────────────────
import type { StateCreator } from 'zustand';
import type { AuthoringState } from './types';
import { DEFAULT_CP } from './initial-state';

export type CpSlice = Pick<AuthoringState, 'cp' | 'updateCp' | 'addProfil' | 'removeProfil'>;

export const createCpSlice: StateCreator<AuthoringState, [], [], CpSlice> = (set) => ({
  cp: { ...DEFAULT_CP },
  updateCp: (key: string, value: unknown) => {
    set((s) => ({ cp: { ...s.cp, [key]: value }, dirty: true }));
  },
  addProfil: (value: string) => {
    set((s) => ({ cp: { ...s.cp, profil: [...s.cp.profil, value] }, dirty: true }));
  },
  removeProfil: (index: number) => {
    set((s) => ({
      cp: { ...s.cp, profil: s.cp.profil.filter((_, i) => i !== index) },
      dirty: true,
    }));
  },
});
