// ── Meta Slice ────────────────────────────────────────────────────
import type { StateCreator } from 'zustand';
import type { AuthoringState, MetaState } from './types';
import { DEFAULT_META } from './initial-state';

// V5-RELEASE-HARDENING-02-RC2 (P1-1): Import notifyMutation so that
// metadata-only changes (semester, tahunAjaran, namaGuru, etc.)
// increment editRevision in dirty-store. Without this, executeDurableSave()
// returns early because dirtyStore.dirty === false, and authoring
// saveToStorage() is never called — metadata-only changes are lost.
import { notifyMutation } from '@/lib/notify-mutation';

export type MetaSlice = Pick<AuthoringState, 'meta' | 'updateMeta'>;

export const createMetaSlice: StateCreator<AuthoringState, [], [], MetaSlice> = (set, get) => ({
  meta: { ...DEFAULT_META },
  updateMeta: (key: keyof MetaState, value: string) => {
    // V5-METADATA-FINAL (P3): Equality guard — skip if value unchanged.
    // Prevents unnecessary dirty state + autosave when guru clicks Simpan
    // without actually changing any field.
    if (get().meta[key] === value) return;
    set((s) => ({ meta: { ...s.meta, [key]: value }, dirty: true }));
    // V5-RC2 (P1-1): Notify dirty store so durable-save picks up the change.
    // This is REQUIRED for metadata-only changes to persist independently
    // of canva store changes (e.g., cover badge updates).
    notifyMutation();
  },
});
