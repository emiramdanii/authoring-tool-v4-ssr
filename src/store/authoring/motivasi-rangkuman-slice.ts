// ── Motivasi & Rangkuman Slice ─────────────────────────────────────
// [Phase 5] Deprecated write actions removed — schema is now the single write path.
// Removed: updateMotivasi, updateRangkuman
// These 2 actions had zero component callers; all writes go through
// applyGuidedSchemaPatch() via useSchemaMotivasi()/useSchemaRangkuman() hooks.
import type { StateCreator } from 'zustand';
import type { AuthoringState } from './types';
import { DEFAULT_MOTIVASI, DEFAULT_RANGKUMAN } from './initial-state';

export type MotivasiRangkumanSlice = Pick<AuthoringState, 'motivasi' | 'rangkuman'>;

export const createMotivasiRangkumanSlice: StateCreator<AuthoringState, [], [], MotivasiRangkumanSlice> = () => ({
  motivasi: { ...DEFAULT_MOTIVASI },
  rangkuman: { ...DEFAULT_RANGKUMAN },
});
