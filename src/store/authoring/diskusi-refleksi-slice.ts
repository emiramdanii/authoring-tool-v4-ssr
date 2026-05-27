// ── Diskusi & Refleksi Slice ──────────────────────────────────────
// Update actions for diskusi and refleksi data.
// Follows the same pattern as motivasi-rangkuman-slice.
import type { StateCreator } from 'zustand';
import type { AuthoringState, DiskusiData, RefleksiData, DiskusiPertanyaan, RefleksiPertanyaan } from './types';
import { DEFAULT_DISKUSI, DEFAULT_REFLEKSI } from './initial-state';

export type DiskusiRefleksiSlice = Pick<AuthoringState,
  | 'diskusi' | 'refleksi'
  | 'updateDiskusi' | 'updateRefleksi'
  | 'addDiskusiPertanyaan' | 'removeDiskusiPertanyaan' | 'updateDiskusiPertanyaan'
  | 'addRefleksiPertanyaan' | 'removeRefleksiPertanyaan' | 'updateRefleksiPertanyaan'
>;

export const createDiskusiRefleksiSlice: StateCreator<AuthoringState, [], [], DiskusiRefleksiSlice> = (set) => ({
  diskusi: { ...DEFAULT_DISKUSI },
  refleksi: { ...DEFAULT_REFLEKSI },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaDiskusi() hooks instead. Content writes should go through schema. */
  updateDiskusi: (data: Partial<DiskusiData>) => {
    console.warn('[deprecated] updateDiskusi() — Use useSchemaDiskusi() or applyGuidedSchemaPatch() instead');
    set((s) => ({
      diskusi: { ...s.diskusi, ...data },
      dirty: true,
    }));
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaRefleksi() hooks instead. Content writes should go through schema. */
  updateRefleksi: (data: Partial<RefleksiData>) => {
    console.warn('[deprecated] updateRefleksi() — Use useSchemaRefleksi() or applyGuidedSchemaPatch() instead');
    set((s) => ({
      refleksi: { ...s.refleksi, ...data },
      dirty: true,
    }));
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaDiskusi() hooks instead. Content writes should go through schema. */
  addDiskusiPertanyaan: () => {
    console.warn('[deprecated] addDiskusiPertanyaan() — Use useSchemaDiskusi().addQuestion() or applyGuidedSchemaPatch() instead');
    set((s) => ({
      diskusi: {
        ...s.diskusi,
        pertanyaan: [
          ...s.diskusi.pertanyaan,
          { label: `Pertanyaan ${s.diskusi.pertanyaan.length + 1}`, icon: '💭', teks: '', petunjuk: '' },
        ],
      },
      dirty: true,
    }));
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaDiskusi() hooks instead. Content writes should go through schema. */
  removeDiskusiPertanyaan: (index: number) => {
    console.warn('[deprecated] removeDiskusiPertanyaan() — Use useSchemaDiskusi().removeQuestion() or applyGuidedSchemaPatch() instead');
    set((s) => ({
      diskusi: {
        ...s.diskusi,
        pertanyaan: s.diskusi.pertanyaan.filter((_, i) => i !== index),
      },
      dirty: true,
    }));
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaDiskusi() hooks instead. Content writes should go through schema. */
  updateDiskusiPertanyaan: (index: number, data: Partial<DiskusiPertanyaan>) => {
    console.warn('[deprecated] updateDiskusiPertanyaan() — Use useSchemaDiskusi().updateQuestion() or applyGuidedSchemaPatch() instead');
    set((s) => ({
      diskusi: {
        ...s.diskusi,
        pertanyaan: s.diskusi.pertanyaan.map((p, i) => i === index ? { ...p, ...data } : p),
      },
      dirty: true,
    }));
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaRefleksi() hooks instead. Content writes should go through schema. */
  addRefleksiPertanyaan: () => {
    console.warn('[deprecated] addRefleksiPertanyaan() — Use useSchemaRefleksi().addQuestion() or applyGuidedSchemaPatch() instead');
    set((s) => ({
      refleksi: {
        ...s.refleksi,
        pertanyaan: [
          ...s.refleksi.pertanyaan,
          { teks: '', petunjuk: '', warna: 'c', icon: '🪞' },
        ],
      },
      dirty: true,
    }));
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaRefleksi() hooks instead. Content writes should go through schema. */
  removeRefleksiPertanyaan: (index: number) => {
    console.warn('[deprecated] removeRefleksiPertanyaan() — Use useSchemaRefleksi().removeQuestion() or applyGuidedSchemaPatch() instead');
    set((s) => ({
      refleksi: {
        ...s.refleksi,
        pertanyaan: s.refleksi.pertanyaan.filter((_, i) => i !== index),
      },
      dirty: true,
    }));
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaRefleksi() hooks instead. Content writes should go through schema. */
  updateRefleksiPertanyaan: (index: number, data: Partial<RefleksiPertanyaan>) => {
    console.warn('[deprecated] updateRefleksiPertanyaan() — Use useSchemaRefleksi().updateQuestion() or applyGuidedSchemaPatch() instead');
    set((s) => ({
      refleksi: {
        ...s.refleksi,
        pertanyaan: s.refleksi.pertanyaan.map((p, i) => i === index ? { ...p, ...data } : p),
      },
      dirty: true,
    }));
  },
});
