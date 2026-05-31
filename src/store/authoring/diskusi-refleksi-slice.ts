// ── Diskusi & Refleksi Slice ──────────────────────────────────────
// [Phase 5] Deprecated write actions removed — schema is now the single write path.
// Removed: updateDiskusi, updateRefleksi,
//   addDiskusiPertanyaan, removeDiskusiPertanyaan, updateDiskusiPertanyaan,
//   addRefleksiPertanyaan, removeRefleksiPertanyaan, updateRefleksiPertanyaan
// These 8 actions had zero component callers; all writes go through
// applyGuidedSchemaPatch() via useSchemaDiskusi()/useSchemaRefleksi() hooks.
import type { StateCreator } from 'zustand';
import type { AuthoringState } from './types';
import { DEFAULT_DISKUSI, DEFAULT_REFLEKSI } from './initial-state';

export type DiskusiRefleksiSlice = Pick<AuthoringState, 'diskusi' | 'refleksi'>;

export const createDiskusiRefleksiSlice: StateCreator<AuthoringState, [], [], DiskusiRefleksiSlice> = () => ({
  diskusi: { ...DEFAULT_DISKUSI },
  refleksi: { ...DEFAULT_REFLEKSI },
});
