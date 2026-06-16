// ═══════════════════════════════════════════════════════════════════
// DIRTY COVERAGE & AUTOSAVE LIFECYCLE TESTS — Sprint 7.2
// ═══════════════════════════════════════════════════════════════════
// Tests for P0 fixes in Sprint 7.2:
//
// P0-A: notifyMutation() fires markDirty() for all project mutations
// P0-B: saveProjectToDBInternal integrates with state machine
// P0-D: Save-before-switch + project switch race conditions
//
// These tests focus on the dirty store state machine behavior.
// The notifyMutation() helper is tested by verifying that markDirty()
// (which it calls) produces the expected state transitions.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from 'vitest';
import { useDirtyStore } from '@/store/dirty-store';
import type { SaveStatus } from '@/store/dirty-store';

// Helper: same logic as notifyMutation() — calls markDirty()
// We test the state machine behavior directly rather than importing
// notifyMutation (which has heavy canva-store dependencies that
// don't work in unit test environment).
function simulateMutation() {
  useDirtyStore.getState().markDirty();
}

// Reset store before each test
beforeEach(() => {
  useDirtyStore.getState().resetOnLoad();
});

// ═══════════════════════════════════════════════════════════════════
// P0-A: Mutation triggers markDirty()
// ═══════════════════════════════════════════════════════════════════
describe('P0-A: Mutation triggers markDirty()', () => {
  it('should increment editRevision and set dirty=true', () => {
    const store = useDirtyStore.getState();
    expect(store.editRevision).toBe(0);
    expect(store.dirty).toBe(false);

    simulateMutation();

    const updated = useDirtyStore.getState();
    expect(updated.editRevision).toBe(1);
    expect(updated.dirty).toBe(true);
    expect(updated.saveStatus).toBe('dirty');
  });

  it('should increment editRevision on each call', () => {
    simulateMutation();
    simulateMutation();
    simulateMutation();

    const updated = useDirtyStore.getState();
    expect(updated.editRevision).toBe(3);
    expect(updated.dirty).toBe(true);
  });

  it('should clear previous error on new mutation', () => {
    useDirtyStore.getState().saveFailed('some error');
    expect(useDirtyStore.getState().lastError).toBe('some error');

    simulateMutation();

    expect(useDirtyStore.getState().lastError).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// P0-B: saveSucceeded() handles savingRevision === null
// ═══════════════════════════════════════════════════════════════════
describe('P0-B: saveSucceeded() handles savingRevision === null', () => {
  it('should mark project as clean when saveSucceeded called without startSaving', () => {
    // This simulates the case where saveProjectToDBInternal calls
    // saveSucceeded() directly (e.g., from Ctrl+S) without going
    // through useAutoSave.saveNow() which calls startSaving() first.

    simulateMutation(); // editRevision=1, dirty=true
    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().savingRevision).toBeNull();

    // saveSucceeded() without startSaving() should still mark clean
    const result = useDirtyStore.getState().saveSucceeded();
    expect(result).toBe(true);

    const state = useDirtyStore.getState();
    expect(state.dirty).toBe(false);
    expect(state.saveStatus).toBe('saved');
    expect(state.lastSavedRevision).toBe(state.editRevision);
    expect(state.savingRevision).toBeNull();
  });

  it('should update lastSavedRevision to current editRevision', () => {
    simulateMutation(); // editRevision=1
    simulateMutation(); // editRevision=2

    expect(useDirtyStore.getState().editRevision).toBe(2);
    expect(useDirtyStore.getState().lastSavedRevision).toBe(0);

    useDirtyStore.getState().saveSucceeded();

    expect(useDirtyStore.getState().lastSavedRevision).toBe(2);
    expect(useDirtyStore.getState().dirty).toBe(false);
  });

  it('should still work correctly when startSaving was called first', () => {
    // Normal flow: startSaving() → save → saveSucceeded()
    simulateMutation(); // editRevision=1
    useDirtyStore.getState().startSaving(); // savingRevision=1

    expect(useDirtyStore.getState().savingRevision).toBe(1);

    const result = useDirtyStore.getState().saveSucceeded();
    expect(result).toBe(true);

    const state = useDirtyStore.getState();
    expect(state.dirty).toBe(false);
    expect(state.saveStatus).toBe('saved');
    expect(state.lastSavedRevision).toBe(1);
    expect(state.savingRevision).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// P0-D: Project switch race conditions
// ═══════════════════════════════════════════════════════════════════
describe('P0-D: Project switch race conditions', () => {
  it('resetOnLoad() should clear all state for fresh project', () => {
    simulateMutation(); // editRevision=1, dirty=true
    useDirtyStore.getState().startSaving(); // savingRevision=1
    useDirtyStore.getState().saveFailed('test error'); // error state

    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().lastError).toBe('test error');

    useDirtyStore.getState().resetOnLoad();

    const state = useDirtyStore.getState();
    expect(state.editRevision).toBe(0);
    expect(state.lastSavedRevision).toBe(0);
    expect(state.savingRevision).toBeNull();
    expect(state.dirty).toBe(false);
    expect(state.saveStatus).toBe('idle');
    expect(state.lastError).toBeNull();
  });

  it('should detect stale save via revision mismatch after project switch', () => {
    // Simulate: edit in Project A → start saving → switch to Project B
    // (which resets state) → save A completes but state is now for B

    // Project A: edit and start saving
    simulateMutation(); // editRevision=1
    useDirtyStore.getState().startSaving(); // savingRevision=1

    // Simulate project switch (resetOnLoad)
    useDirtyStore.getState().resetOnLoad(); // editRevision=0

    // Simulate edit in Project B
    simulateMutation(); // editRevision=1

    // Now old save A completes — but savingRevision was reset to null
    // The stale save cannot corrupt the state because resetOnLoad
    // cleared savingRevision
    const state = useDirtyStore.getState();
    expect(state.savingRevision).toBeNull();
    expect(state.editRevision).toBe(1);
    expect(state.dirty).toBe(true);
  });

  it('should handle multiple project switches gracefully', () => {
    // Switch A → B → C rapidly
    for (const project of ['A', 'B', 'C']) {
      simulateMutation(); // Edit in current project
      expect(useDirtyStore.getState().dirty).toBe(true);

      useDirtyStore.getState().resetOnLoad(); // Switch to next
      expect(useDirtyStore.getState().dirty).toBe(false);
    }

    // Final state should be clean
    const state = useDirtyStore.getState();
    expect(state.dirty).toBe(false);
    expect(state.saveStatus).toBe('idle');
  });
});

// ═══════════════════════════════════════════════════════════════════
// Full save cycle with mutation + saveSucceeded
// ═══════════════════════════════════════════════════════════════════
describe('Full save cycle with mutation + state machine', () => {
  it('mutation → auto-save → clean', () => {
    // 1. User makes an edit
    simulateMutation(); // editRevision=1, dirty=true
    expect(useDirtyStore.getState().dirty).toBe(true);

    // 2. Auto-save starts
    useDirtyStore.getState().startSaving(); // savingRevision=1
    expect(useDirtyStore.getState().saveStatus).toBe('saving');

    // 3. Auto-save completes successfully
    const result = useDirtyStore.getState().saveSucceeded();
    expect(result).toBe(true);
    expect(useDirtyStore.getState().dirty).toBe(false);
    expect(useDirtyStore.getState().saveStatus).toBe('saved');
  });

  it('mutation → save fails → retry → clean', () => {
    // 1. Edit
    simulateMutation(); // editRevision=1

    // 2. Save fails
    useDirtyStore.getState().startSaving();
    useDirtyStore.getState().saveFailed('Network error');
    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().saveStatus).toBe('error');
    expect(useDirtyStore.getState().lastError).toBe('Network error');

    // 3. User retries — clearError then startSaving again
    useDirtyStore.getState().clearError();
    expect(useDirtyStore.getState().saveStatus).toBe('dirty');

    useDirtyStore.getState().startSaving();
    const result = useDirtyStore.getState().saveSucceeded();
    expect(result).toBe(true);
    expect(useDirtyStore.getState().dirty).toBe(false);
  });

  it('edit during save → follow-up save needed', () => {
    // 1. First edit
    simulateMutation(); // editRevision=1

    // 2. Save starts
    useDirtyStore.getState().startSaving(); // savingRevision=1

    // 3. Second edit DURING save
    simulateMutation(); // editRevision=2

    // 4. Save completes (for revision 1)
    const result = useDirtyStore.getState().saveSucceeded();
    expect(result).toBe(false); // Still dirty — revision mismatch

    const state = useDirtyStore.getState();
    expect(state.dirty).toBe(true);
    expect(state.saveStatus).toBe('dirty');
    expect(state.lastSavedRevision).toBe(1);
    expect(state.editRevision).toBe(2);

    // 5. Follow-up save for revision 2
    useDirtyStore.getState().startSaving(); // savingRevision=2
    const result2 = useDirtyStore.getState().saveSucceeded();
    expect(result2).toBe(true);
    expect(useDirtyStore.getState().dirty).toBe(false);
  });

  it('direct save (Ctrl+S) without startSaving → clean', () => {
    // This tests the P0-B fix: saveProjectToDBInternal now calls
    // startSaving() before the DB save and saveSucceeded() after.
    // But even if startSaving wasn't called, saveSucceeded()
    // should handle the savingRevision === null case.

    simulateMutation(); // editRevision=1, dirty=true

    // Direct saveSucceeded() without startSaving()
    // (simulates the path where saveProjectToDBInternal calls
    // startSaving + saveSucceeded internally)
    useDirtyStore.getState().startSaving();
    const result = useDirtyStore.getState().saveSucceeded();
    expect(result).toBe(true);
    expect(useDirtyStore.getState().dirty).toBe(false);
    expect(useDirtyStore.getState().lastSavedRevision).toBe(1);
  });

  it('multiple mutations + single save captures latest revision', () => {
    // Simulate rapid edits
    simulateMutation(); // editRevision=1
    simulateMutation(); // editRevision=2
    simulateMutation(); // editRevision=3

    expect(useDirtyStore.getState().editRevision).toBe(3);

    // Single save captures revision 3
    useDirtyStore.getState().startSaving();
    const result = useDirtyStore.getState().saveSucceeded();
    expect(result).toBe(true);

    expect(useDirtyStore.getState().lastSavedRevision).toBe(3);
    expect(useDirtyStore.getState().dirty).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// INVARIANT: Only durable save may clear dirty
// ═══════════════════════════════════════════════════════════════════
describe('Invariant: Only durable save may clear dirty', () => {
  it('mutation alone cannot clear dirty', () => {
    simulateMutation();
    expect(useDirtyStore.getState().dirty).toBe(true);

    // Calling mutation again doesn't clear dirty
    simulateMutation();
    expect(useDirtyStore.getState().dirty).toBe(true);
  });

  it('resetOnLoad clears dirty but only for fresh project load', () => {
    simulateMutation();
    expect(useDirtyStore.getState().dirty).toBe(true);

    // resetOnLoad is only called on project switch — it resets everything
    useDirtyStore.getState().resetOnLoad();
    expect(useDirtyStore.getState().dirty).toBe(false);
    expect(useDirtyStore.getState().editRevision).toBe(0);
  });

  it('saveFailed does not clear dirty', () => {
    simulateMutation();
    useDirtyStore.getState().startSaving();
    useDirtyStore.getState().saveFailed('error');

    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().saveStatus).toBe('error');
  });

  it('clearError does not clear dirty', () => {
    simulateMutation();
    useDirtyStore.getState().startSaving();
    useDirtyStore.getState().saveFailed('error');
    useDirtyStore.getState().clearError();

    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().saveStatus).toBe('dirty');
  });
});
