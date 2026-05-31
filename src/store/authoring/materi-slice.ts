// ── Materi Slice ──────────────────────────────────────────────────
// [Phase 5] Deprecated write actions removed — schema is now the single write path.
// Removed: addMateriBlok, removeMateriBlok, updateMateriBlok, moveMateriBlok
// These actions had zero component callers; all writes go through
// applyGuidedSchemaPatch() via useSchemaMateri() hooks.
import type { StateCreator } from 'zustand';
import type { AuthoringState } from './types';
import { DEFAULT_MATERI } from './initial-state';

export type MateriSlice = Pick<AuthoringState, 'materi'>;

export const createMateriSlice: StateCreator<AuthoringState, [], [], MateriSlice> = () => ({
  materi: { ...DEFAULT_MATERI },
});
