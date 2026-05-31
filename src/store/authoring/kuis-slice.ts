// ── Kuis Slice ────────────────────────────────────────────────────
// [Phase 5] Deprecated write actions removed — schema is now the single write path.
// Removed: addKuis, deleteKuis, updateKuis, updateKuisOpt, reorderKuis
// These actions had zero component callers; all writes go through
// applyGuidedSchemaPatch() via useSchemaKuis() hooks.
import type { StateCreator } from 'zustand';
import type { AuthoringState } from './types';

export type KuisSlice = Pick<AuthoringState, 'kuis'>;

export const createKuisSlice: StateCreator<AuthoringState, [], [], KuisSlice> = () => ({
  kuis: [],
});
