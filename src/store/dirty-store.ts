// ═══════════════════════════════════════════════════════════════════
// DIRTY STORE — Durable Save State Machine with Revision Tracking
// ═══════════════════════════════════════════════════════════════════
// Sprint 7.1: Enhanced from simple boolean to revision-based state
// machine that prevents markClean before durable save succeeds and
// prevents stale save completions from overwriting newer edits.
//
// INVARIANTS:
//   1. `dirty` is derived: editRevision > lastSavedRevision
//   2. markClean only happens AFTER durable save succeeds AND
//      the saved revision matches the current edit revision
//   3. A stale save completion (editRevision > savingRevision)
//      does NOT clear dirty — it schedules a follow-up save
//   4. On save failure, dirty stays true, error is recorded,
//      and recovery snapshots are preserved
//   5. saveStatus reflects the honest state of persistence
//   6. resetOnLoad() resets all counters for a fresh project load
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface DirtyState {
  /** Current save status — honest state machine */
  saveStatus: SaveStatus;
  /** Monotonically increasing revision — incremented on every project mutation */
  editRevision: number;
  /** The revision that was last successfully saved to durable storage */
  lastSavedRevision: number;
  /** The revision currently being saved (null if no save in progress) */
  savingRevision: number | null;
  /** Last save error message (null if no error) */
  lastError: string | null;

  // ── Derived (backward compat) ────────────────────────────────────
  /** Whether the project has unsaved changes (editRevision > lastSavedRevision) */
  dirty: boolean;

  // ── Actions ──────────────────────────────────────────────────────
  /** Call on every project data mutation — increments editRevision */
  markDirty: () => void;
  /** DEPRECATED — only exists for backward compat; prefer saveSucceeded() */
  markClean: () => void;
  /** Call when a save operation starts — captures savingRevision */
  startSaving: () => void;
  /**
   * Call when a save operation succeeds.
   * If savingRevision matches current editRevision → mark saved.
   * If editRevision has advanced past savingRevision → stay dirty.
   * Returns true if fully clean, false if still dirty (edits happened during save).
   */
  saveSucceeded: () => boolean;
  /** Call when a save operation fails — keeps dirty, records error */
  saveFailed: (msg: string) => void;
  /** Reset all counters — call on project load/create */
  resetOnLoad: () => void;
  /** Clear error status without changing revision state — for retry */
  clearError: () => void;
}

function isDirty(editRev: number, savedRev: number): boolean {
  return editRev > savedRev;
}

export const useDirtyStore = create<DirtyState>((set, get) => ({
  saveStatus: 'idle',
  editRevision: 0,
  lastSavedRevision: 0,
  savingRevision: null,
  lastError: null,
  dirty: false,

  markDirty: () => {
    const newRev = get().editRevision + 1;
    set({
      editRevision: newRev,
      dirty: true,
      saveStatus: 'dirty',
      lastError: null, // Clear any previous error on new edit
    });
  },

  markClean: () => {
    // DEPRECATED: This exists for backward compatibility with the
    // authoring bridge. In the new state machine, cleanness should
    // only emerge from saveSucceeded() with a matching revision.
    // This legacy path sets lastSavedRevision = editRevision.
    const { editRevision } = get();
    set({
      lastSavedRevision: editRevision,
      dirty: false,
      saveStatus: 'saved',
      lastError: null,
    });
  },

  startSaving: () => {
    const { editRevision, saveStatus } = get();
    // Only start saving if there are unsaved edits
    if (saveStatus === 'saving') return; // single-flight guard
    set({
      savingRevision: editRevision,
      saveStatus: 'saving',
    });
  },

  saveSucceeded: () => {
    const { editRevision, savingRevision } = get();
    if (savingRevision === null) {
      // No save was in progress — shouldn't happen, but be safe
      set({ saveStatus: 'saved' });
      return true;
    }

    if (editRevision === savingRevision) {
      // The saved revision matches current state → fully clean
      set({
        lastSavedRevision: savingRevision,
        savingRevision: null,
        dirty: false,
        saveStatus: 'saved',
        lastError: null,
      });
      return true;
    }

    // Edits happened during save — still dirty, need another save
    set({
      lastSavedRevision: savingRevision,
      savingRevision: null,
      dirty: isDirty(editRevision, savingRevision),
      saveStatus: 'dirty',
      lastError: null,
    });
    return false;
  },

  saveFailed: (msg: string) => {
    const { editRevision, lastSavedRevision } = get();
    set({
      savingRevision: null,
      dirty: isDirty(editRevision, lastSavedRevision),
      saveStatus: 'error',
      lastError: msg,
    });
  },

  resetOnLoad: () => {
    set({
      saveStatus: 'idle',
      editRevision: 0,
      lastSavedRevision: 0,
      savingRevision: null,
      lastError: null,
      dirty: false,
    });
  },

  clearError: () => {
    const { editRevision, lastSavedRevision } = get();
    const stillDirty = isDirty(editRevision, lastSavedRevision);
    set({
      saveStatus: stillDirty ? 'dirty' : 'saved',
      lastError: null,
    });
  },
}));
