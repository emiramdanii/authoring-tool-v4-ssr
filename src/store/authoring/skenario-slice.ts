// ── Skenario Slice ────────────────────────────────────────────────
// [Phase 5] Deprecated write actions removed — schema is now the single write path.
// Removed: setSkenario, addSkenarioChapter, removeSkenarioChapter, updateSkenarioChapter,
//   addSkenarioSetup, removeSkenarioSetup, updateSkenarioSetup,
//   addSkenarioChoice, removeSkenarioChoice, updateSkenarioChoice,
//   addSkenarioConsequence, removeSkenarioConsequence, updateSkenarioConsequence
// These 13 actions had zero component callers; all writes go through
// applyGuidedSchemaPatch() with skenario blocks.
import type { StateCreator } from 'zustand';
import type { AuthoringState } from './types';

export type SkenarioSlice = Pick<AuthoringState, 'skenario'>;

export const createSkenarioSlice: StateCreator<AuthoringState, [], [], SkenarioSlice> = () => ({
  skenario: [],
});
