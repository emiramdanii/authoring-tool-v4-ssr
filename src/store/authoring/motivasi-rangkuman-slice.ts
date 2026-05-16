// ── Motivasi & Rangkuman Slice ─────────────────────────────────────
import type { StateCreator } from 'zustand';
import type { AuthoringState, MotivasiData, RangkumanData } from './types';
import { DEFAULT_MOTIVASI, DEFAULT_RANGKUMAN } from './initial-state';

export type MotivasiRangkumanSlice = Pick<AuthoringState,
  | 'motivasi' | 'rangkuman'
  | 'updateMotivasi' | 'updateRangkuman'
>;

export const createMotivasiRangkumanSlice: StateCreator<AuthoringState, [], [], MotivasiRangkumanSlice> = (set) => ({
  motivasi: { ...DEFAULT_MOTIVASI },
  rangkuman: { ...DEFAULT_RANGKUMAN },

  updateMotivasi: (data: Partial<MotivasiData>) => {
    set((s) => ({
      motivasi: { ...s.motivasi, ...data },
      dirty: true,
    }));
  },

  updateRangkuman: (data: Partial<RangkumanData>) => {
    set((s) => ({
      rangkuman: { ...s.rangkuman, ...data },
      dirty: true,
    }));
  },
});
