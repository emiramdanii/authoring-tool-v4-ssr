// ═══════════════════════════════════════════════════════════════════
// DIRTY STORE — Durable Save State Machine with Revision Tracking
// ═══════════════════════════════════════════════════════════════════
// Sprint 7.1: Enhanced from simple boolean to revision-based state
// machine that prevents markClean before durable save succeeds and
// prevents stale save completions from overwriting newer edits.
//
// Sprint 7.2A: Added projectId-scoped save token, hydration
// suppression (depth counter), and project-scoped stale-save detection.
//
// Sprint 7.2A-Patch: Fixed 7 P0s:
//   - Hydration depth counter replaces boolean (P0-6)
//   - resetOnLoad() no longer touches hydration depth
//   - setCurrentProjectId() for createProject without resetting revision (P0-7)
//   - saveSucceeded() with null savingRevision no longer marks clean (P0-1)
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
//      but does NOT touch _hydrationDepth (hydration is managed
//      by startHydration/endHydration pairs)
//   7. Hydration suppression (depth counter) prevents false dirty
//      during load, including nested hydration (e.g., ProjectManager
//      wrapping CanvaStore.loadFromDB)
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
  /**
   * Hydration depth counter — > 0 while loading/hydrating, suppresses markDirty.
   * Uses depth instead of boolean to support nested hydration
   * (e.g., ProjectManager wrapping CanvaStore.loadFromDB).
   * resetOnLoad() does NOT touch this — hydration lifecycle is
   * managed exclusively by startHydration/endHydration pairs.
   */
  _hydrationDepth: number;

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
   * If savingRevision is null (no save was in progress) → no-op, return false.
   * Returns true if fully clean, false if still dirty or no-op.
   */
  saveSucceeded: () => boolean;
  /** Call when a save operation fails — keeps dirty, records error */
  saveFailed: (msg: string) => void;
  /** Reset all counters — call on project load/create. Does NOT touch _hydrationDepth. */
  resetOnLoad: (projectId?: string | null) => void;
  /** Clear error status without changing revision state — for retry */
  clearError: () => void;
  /**
   * Build a save token for the current project state.
   * Used by the coordinator to validate saves belong to the right project.
   */
  buildSaveToken: () => SaveToken;
  /**
   * Strict completion token validation.
   * Returns true ONLY if the token matches the current in-flight save
   * (same project + token.revision === savingRevision).
   * Returns false if no save is in progress (savingRevision === null).
   */
  isSaveTokenValid: (token: SaveToken) => boolean;
  /** Enter hydration mode (+1 depth) — suppresses markDirty */
  startHydration: () => void;
  /** Exit hydration mode (-1 depth) — re-enables markDirty when depth reaches 0 */
  endHydration: () => void;
  /**
   * Update currentProjectId without resetting revision counters.
   * Used by createProject() to bind the new project ID to the token
   * store while preserving any existing dirty state.
   */
  setCurrentProjectId: (id: string | null) => void;
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
  _hydrationDepth: 0,
  dirty: false,

  markDirty: () => {
    // Sprint 7.2A-Patch: Use depth counter instead of boolean.
    // When loading a project, store subscriptions may fire and trigger
    // markDirty() before the data is fully loaded. This would create
    // a false "unsaved" state. The depth counter prevents this,
    // including for nested hydration (e.g., ProjectManager wrapping
    // CanvaStore.loadFromDB).
    if (get()._hydrationDepth > 0) return;

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
      // P0-1 Fix: No save was in progress — this is a stale/double
      // lifecycle call. Do NOT mark clean. Return false to signal
      // that the save was not properly tracked. The coordinator
      // (executeDurableSave) is the ONLY code that should call
      // saveSucceeded(), and it always calls startSaving() first.
      // A null savingRevision means the lifecycle was violated.
      return false;
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
    // P0-6 Fix: resetOnLoad() does NOT touch _hydrationDepth.
    // Hydration lifecycle is managed exclusively by startHydration/
    // endHydration pairs. This prevents the bug where resetOnLoad()
    // cancels hydration suppression before mutations complete.
    set({
      saveStatus: 'idle',
      editRevision: 0,
      lastSavedRevision: 0,
      savingRevision: null,
      lastError: null,
      dirty: false,
      currentProjectId: projectId ?? null,
      // NOTE: _hydrationDepth is intentionally NOT reset here.
      // Use startHydration/endHydration to manage hydration state.
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
    const { currentProjectId, savingRevision } = get();
    // Strict completion token: token must match the in-flight save exactly.
    // Previous check (token.revision <= editRevision) was too loose —
    // it would accept a token from a completely different save attempt
    // as long as its revision wasn't from the future.
    // The strict check ensures:
    //   1. Project hasn't switched (projectId match)
    //   2. Token was issued for the CURRENT in-flight save (revision === savingRevision)
    // If savingRevision is null (no save in progress), token is invalid.
    if (savingRevision === null) return false;
    return token.projectId === currentProjectId && token.revision === savingRevision;
  },

  startHydration: () => {
    // P0-6 Fix: Use depth counter instead of boolean.
    // Each startHydration() increments depth; each endHydration()
    // decrements it. markDirty() is suppressed when depth > 0.
    // This supports nested hydration (e.g., ProjectManager wrapping
    // CanvaStore.loadFromDB) where the outer hydration must remain
    // active even after the inner hydration ends.
    const { _hydrationDepth } = get();
    set({ _hydrationDepth: _hydrationDepth + 1 });
  },

  endHydration: () => {
    // P0-6 Fix: Decrement depth, never go below 0.
    const { _hydrationDepth } = get();
    set({ _hydrationDepth: Math.max(0, _hydrationDepth - 1) });
  },

  setCurrentProjectId: (id: string | null) => {
    // P0-7 Fix: Update currentProjectId without resetting revision.
    // Used by createProject() to bind the new project ID to the
    // token store while preserving existing dirty/editRevision state.
    set({ currentProjectId: id });
  },
}));
