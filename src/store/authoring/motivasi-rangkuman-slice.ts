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

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaMotivasi() hooks instead. Content writes should go through schema. */
  updateMotivasi: (data: Partial<MotivasiData>) => {
    console.warn('[deprecated] updateMotivasi() — Use useSchemaMotivasi() or applyGuidedSchemaPatch() instead');
    set((s) => ({
      motivasi: { ...s.motivasi, ...data },
      dirty: true,
    }));
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaRangkuman() hooks instead. Content writes should go through schema. */
  updateRangkuman: (data: Partial<RangkumanData>) => {
    console.warn('[deprecated] updateRangkuman() — Use useSchemaRangkuman() or applyGuidedSchemaPatch() instead');
    set((s) => ({
      rangkuman: { ...s.rangkuman, ...data },
      dirty: true,
    }));
  },
});
