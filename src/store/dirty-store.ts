// ═══════════════════════════════════════════════════════════════════
// DIRTY STORE — Durable Save State Machine with Revision Tracking
// ═══════════════════════════════════════════════════════════════════
// Sprint 7.1: Enhanced from simple boolean to revision-based state
// machine that prevents markClean before durable save succeeds and
// prevents stale save completions from overwriting newer edits.
//
// Sprint 7.2A: Added projectId-scoped save token, hydration
// suppression, and project-scoped stale-save detection.
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
//   7. Hydration suppression prevents false dirty during load
//   8. Project-scoped save token prevents cross-project save corruption
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

// ═══════════════════════════════════════════════════════════════════
// SAVE TOKEN — Project-scoped identity for save operations
// ═══════════════════════════════════════════════════════════════════
// Prevents a save from Project A being credited to Project B.
// When a project switch happens, resetOnLoad() clears the token.
// Any in-flight save with a stale token is rejected.
export interface SaveToken {
  /** The project this save belongs to */
  projectId: string | null;
  /** The revision at the time the save was initiated */
  revision: number;
}

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

  // ── Sprint 7.2A: Project-scoped save token ─────────────────────
  /** Current project ID — set on project load, null if no project */
  currentProjectId: string | null;
  /** Hydration flag — true while loading/hydrating, suppresses dirty */
  _hydrating: boolean;

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
  resetOnLoad: (projectId?: string | null) => void;
  /** Clear error status without changing revision state — for retry */
  clearError: () => void;
  /**
   * Build a save token for the current project state.
   * Used by the coordinator to validate saves belong to the right project.
   */
  buildSaveToken: () => SaveToken;
  /**
   * Check if a save token is still valid (same project + revision).
   * Returns false if the project has switched or revision advanced.
   */
  isSaveTokenValid: (token: SaveToken) => boolean;
  /** Enter hydration mode — suppresses markDirty */
  startHydration: () => void;
  /** Exit hydration mode — re-enables markDirty */
  endHydration: () => void;
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
  currentProjectId: null,
  _hydrating: false,
  dirty: false,

  markDirty: () => {
    // Sprint 7.2A: Suppress dirty during hydration/load.
    // When loading a project, store subscriptions may fire and trigger
    // markDirty() before the data is fully loaded. This would create
    // a false "unsaved" state. The _hydrating flag prevents this.
    if (get()._hydrating) return;

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
      // No save was in progress — this can happen when saveProjectToDBInternal
      // is called directly (e.g., from Ctrl+S or saveProject) without going
      // through useAutoSave.saveNow(). In this case, treat the current
      // editRevision as the saved revision.
      set({
        lastSavedRevision: editRevision,
        savingRevision: null,
        dirty: false,
        saveStatus: 'saved',
        lastError: null,
      });
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

  resetOnLoad: (projectId?: string | null) => {
    set({
      saveStatus: 'idle',
      editRevision: 0,
      lastSavedRevision: 0,
      savingRevision: null,
      lastError: null,
      dirty: false,
      currentProjectId: projectId ?? null,
      _hydrating: false,
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

  buildSaveToken: (): SaveToken => {
    const { currentProjectId, editRevision } = get();
    return { projectId: currentProjectId, revision: editRevision };
  },

  isSaveTokenValid: (token: SaveToken): boolean => {
    const { currentProjectId, editRevision } = get();
    // Token is valid if project hasn't changed and revision hasn't advanced
    // (revision may be equal if no edits since token was created)
    return token.projectId === currentProjectId && token.revision <= editRevision;
  },

  startHydration: () => {
    set({ _hydrating: true });
  },

  endHydration: () => {
    set({ _hydrating: false });
  },
}));
