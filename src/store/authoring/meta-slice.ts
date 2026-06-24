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

export const createMetaSlice: StateCreator<AuthoringState, [], [], MetaSlice> = (set) => ({
  meta: { ...DEFAULT_META },
  updateMeta: (key: keyof MetaState, value: string) => {
    set((s) => ({ meta: { ...s.meta, [key]: value }, dirty: true }));
    // V5-RC2 (P1-1): Notify dirty store so durable-save picks up the change.
    // This is REQUIRED for metadata-only changes to persist independently
    // of canva store changes (e.g., cover badge updates).
    notifyMutation();
  },
});
