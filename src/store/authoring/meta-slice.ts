// ── Meta Slice ────────────────────────────────────────────────────
import type { StateCreator } from 'zustand';
import type { AuthoringState, MetaState } from './types';
import { DEFAULT_META } from './initial-state';

export type MetaSlice = Pick<AuthoringState, 'meta' | 'updateMeta'>;

export const createMetaSlice: StateCreator<AuthoringState, [], [], MetaSlice> = (set) => ({
  meta: { ...DEFAULT_META },
  updateMeta: (key: keyof MetaState, value: string) => {
    set((s) => ({ meta: { ...s.meta, [key]: value }, dirty: true }));
  },
});
