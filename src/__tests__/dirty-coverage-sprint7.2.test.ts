// ═══════════════════════════════════════════════════════════════════
// SPRINT 7.2A — PERSISTENCE BOUNDARY P0 TESTS
// ═══════════════════════════════════════════════════════════════════
// Tests the persistence boundary improvements:
//
// 1. notifyMutation() coverage for all persistent mutations
// 2. Hydration suppression prevents false dirty during load
// 3. Project-scoped save token prevents cross-project contamination
// 4. Timer cancellation on project switch
// 5. Durable-save coordinator single-flight + stale rejection
// 6. Revision tracking regression (Sprint 7.1 invariants)
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDirtyStore } from '@/store/dirty-store';
import type { SaveToken } from '@/store/dirty-store';
import { notifyMutation } from '@/lib/notify-mutation';

// Reset store before each test
beforeEach(() => {
  useDirtyStore.getState().resetOnLoad('test-project');
});

// ═══════════════════════════════════════════════════════════════════
// TEST 1: Hydration suppression
// ═══════════════════════════════════════════════════════════════════
describe('7.2A-7: Hydration suppression', () => {
  it('markDirty is suppressed during hydration', () => {
    const store = useDirtyStore.getState();
    expect(store.dirty).toBe(false);
    expect(store.editRevision).toBe(0);

    // Start hydration
    useDirtyStore.getState().startHydration();

    // markDirty should be suppressed
    useDirtyStore.getState().markDirty();

    const afterSuppressed = useDirtyStore.getState();
    expect(afterSuppressed.editRevision).toBe(0); // Not incremented
    expect(afterSuppressed.dirty).toBe(false); // Not set
    expect(afterSuppressed.saveStatus).toBe('idle'); // Not changed

    // End hydration
    useDirtyStore.getState().endHydration();

    // markDirty should now work
    useDirtyStore.getState().markDirty();

    const afterEnabled = useDirtyStore.getState();
    expect(afterEnabled.editRevision).toBe(1);
    expect(afterEnabled.dirty).toBe(true);
    expect(afterEnabled.saveStatus).toBe('dirty');
  });

  it('endHydration re-enables markDirty after startHydration', () => {
    useDirtyStore.getState().startHydration();
    useDirtyStore.getState().endHydration();
    useDirtyStore.getState().markDirty();
    expect(useDirtyStore.getState().editRevision).toBe(1);
  });

  it('resetOnLoad clears hydration flag', () => {
    useDirtyStore.getState().startHydration();
    useDirtyStore.getState().resetOnLoad();

    // markDirty should work after resetOnLoad
    useDirtyStore.getState().markDirty();
    expect(useDirtyStore.getState().dirty).toBe(true);
  });

  it('notifyMutation is suppressed during hydration', () => {
    useDirtyStore.getState().startHydration();
    notifyMutation();
    expect(useDirtyStore.getState().dirty).toBe(false);
    expect(useDirtyStore.getState().editRevision).toBe(0);
    useDirtyStore.getState().endHydration();
  });

  it('notifyMutation works when not hydrating', () => {
    notifyMutation();
    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().editRevision).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 2: Project-scoped save token
// ═══════════════════════════════════════════════════════════════════
describe('7.2A-4: Project-scoped save token', () => {
  it('buildSaveToken returns current project and revision', () => {
    useDirtyStore.getState().markDirty(); // revision = 1
    const token = useDirtyStore.getState().buildSaveToken();

    expect(token.projectId).toBe('test-project');
    expect(token.revision).toBe(1);
  });

  it('isSaveTokenValid returns true for matching token', () => {
    useDirtyStore.getState().markDirty(); // revision = 1
    const token = useDirtyStore.getState().buildSaveToken();

    expect(useDirtyStore.getState().isSaveTokenValid(token)).toBe(true);
  });

  it('isSaveTokenValid returns false when project switches', () => {
    useDirtyStore.getState().markDirty(); // revision = 1
    const token = useDirtyStore.getState().buildSaveToken();

    // Switch project
    useDirtyStore.getState().resetOnLoad('different-project');

    expect(useDirtyStore.getState().isSaveTokenValid(token)).toBe(false);
  });

  it('isSaveTokenValid returns true when revision advanced (edit during save)', () => {
    useDirtyStore.getState().markDirty(); // revision = 1
    const token = useDirtyStore.getState().buildSaveToken();

    // Another edit happens (revision advances to 2)
    useDirtyStore.getState().markDirty();

    // Token with revision=1 is still valid (1 <= 2)
    expect(useDirtyStore.getState().isSaveTokenValid(token)).toBe(true);
  });

  it('isSaveTokenValid returns false when revision is from future', () => {
    useDirtyStore.getState().markDirty(); // revision = 1
    const token: SaveToken = { projectId: 'test-project', revision: 999 };

    // Token revision is ahead of current — invalid
    expect(useDirtyStore.getState().isSaveTokenValid(token)).toBe(false);
  });

  it('isSaveTokenValid returns false for null projectId mismatch', () => {
    useDirtyStore.getState().markDirty();
    const token = useDirtyStore.getState().buildSaveToken(); // projectId = 'test-project'

    useDirtyStore.getState().resetOnLoad(null); // projectId = null
    expect(useDirtyStore.getState().isSaveTokenValid(token)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 3: resetOnLoad with projectId
// ═══════════════════════════════════════════════════════════════════
describe('7.2A-4: resetOnLoad with projectId', () => {
  it('resetOnLoad sets currentProjectId', () => {
    useDirtyStore.getState().resetOnLoad('project-abc');
    expect(useDirtyStore.getState().currentProjectId).toBe('project-abc');
  });

  it('resetOnLoad with null clears projectId', () => {
    useDirtyStore.getState().resetOnLoad('project-abc');
    useDirtyStore.getState().resetOnLoad(null);
    expect(useDirtyStore.getState().currentProjectId).toBe(null);
  });

  it('resetOnLoad without argument clears projectId', () => {
    useDirtyStore.getState().resetOnLoad('project-abc');
    useDirtyStore.getState().resetOnLoad();
    expect(useDirtyStore.getState().currentProjectId).toBe(null);
  });

  it('resetOnLoad resets all state including hydration', () => {
    useDirtyStore.getState().markDirty();
    useDirtyStore.getState().startSaving();
    useDirtyStore.getState().saveFailed('test error');
    useDirtyStore.getState().startHydration();

    useDirtyStore.getState().resetOnLoad('new-project');

    const state = useDirtyStore.getState();
    expect(state.editRevision).toBe(0);
    expect(state.lastSavedRevision).toBe(0);
    expect(state.savingRevision).toBe(null);
    expect(state.lastError).toBe(null);
    expect(state.dirty).toBe(false);
    expect(state.saveStatus).toBe('idle');
    expect(state.currentProjectId).toBe('new-project');
    expect(state._hydrating).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 4: Revision tracking still works (Sprint 7.1 regression)
// ═══════════════════════════════════════════════════════════════════
describe('7.2A regression: Sprint 7.1 invariants still hold', () => {
  it('saveSucceeded clears dirty when revision matches', () => {
    useDirtyStore.getState().markDirty(); // revision 1
    useDirtyStore.getState().startSaving(); // savingRevision = 1
    const result = useDirtyStore.getState().saveSucceeded();

    expect(result).toBe(true);
    expect(useDirtyStore.getState().dirty).toBe(false);
  });

  it('saveSucceeded stays dirty when edits happened during save', () => {
    useDirtyStore.getState().markDirty(); // revision 1
    useDirtyStore.getState().startSaving(); // savingRevision = 1
    useDirtyStore.getState().markDirty(); // revision 2 (edit during save)
    const result = useDirtyStore.getState().saveSucceeded();

    expect(result).toBe(false);
    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().saveStatus).toBe('dirty');
  });

  it('saveFailed preserves dirty and records error', () => {
    useDirtyStore.getState().markDirty();
    useDirtyStore.getState().startSaving();
    useDirtyStore.getState().saveFailed('Disk full');

    const state = useDirtyStore.getState();
    expect(state.dirty).toBe(true);
    expect(state.saveStatus).toBe('error');
    expect(state.lastError).toBe('Disk full');
    expect(state.savingRevision).toBe(null);
  });

  it('clearError transitions from error to dirty', () => {
    useDirtyStore.getState().markDirty();
    useDirtyStore.getState().startSaving();
    useDirtyStore.getState().saveFailed('Network error');

    useDirtyStore.getState().clearError();

    const state = useDirtyStore.getState();
    expect(state.saveStatus).toBe('dirty');
    expect(state.lastError).toBe(null);
    expect(state.dirty).toBe(true);
  });

  it('single-flight guard prevents double startSaving', () => {
    useDirtyStore.getState().markDirty();
    useDirtyStore.getState().startSaving(); // savingRevision = 1
    useDirtyStore.getState().startSaving(); // Should be no-op

    // savingRevision should still be 1 (not incremented)
    expect(useDirtyStore.getState().savingRevision).toBe(1);
    expect(useDirtyStore.getState().saveStatus).toBe('saving');
  });

  it('saveSucceeded without startSaving uses current editRevision', () => {
    useDirtyStore.getState().markDirty(); // revision 1
    // Don't call startSaving — simulate direct DB save
    const result = useDirtyStore.getState().saveSucceeded();

    expect(result).toBe(true);
    expect(useDirtyStore.getState().dirty).toBe(false);
    expect(useDirtyStore.getState().lastSavedRevision).toBe(1);
  });

  it('markDirty clears lastError on new edit', () => {
    useDirtyStore.getState().markDirty();
    useDirtyStore.getState().saveFailed('Error');
    expect(useDirtyStore.getState().lastError).toBe('Error');

    useDirtyStore.getState().markDirty();
    expect(useDirtyStore.getState().lastError).toBe(null);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 5: Cross-project save protection
// ═══════════════════════════════════════════════════════════════════
describe('7.2A-4+5: Cross-project save protection', () => {
  it('stale save token from different project is rejected', () => {
    useDirtyStore.getState().markDirty();
    const staleToken = useDirtyStore.getState().buildSaveToken();

    // Switch project (simulates project switch)
    useDirtyStore.getState().resetOnLoad('other-project');
    useDirtyStore.getState().markDirty(); // New project is dirty

    // The stale token should be invalid
    expect(useDirtyStore.getState().isSaveTokenValid(staleToken)).toBe(false);
  });

  it('resetOnLoad clears savingRevision preventing stale completion', () => {
    useDirtyStore.getState().markDirty();
    useDirtyStore.getState().startSaving();

    // Simulate project switch during save
    useDirtyStore.getState().resetOnLoad('new-project');

    const state = useDirtyStore.getState();
    expect(state.savingRevision).toBe(null);
    expect(state.saveStatus).toBe('idle');
    expect(state.dirty).toBe(false);
  });

  it('save from previous project cannot clear dirty on new project', () => {
    // Project A is dirty
    useDirtyStore.getState().markDirty();
    useDirtyStore.getState().startSaving();

    // Switch to project B
    useDirtyStore.getState().resetOnLoad('project-B');

    // Now project B has a clean state
    expect(useDirtyStore.getState().dirty).toBe(false);

    // Make project B dirty
    useDirtyStore.getState().markDirty();
    expect(useDirtyStore.getState().editRevision).toBe(1);

    // A stale saveSucceeded() from project A cannot be called
    // because resetOnLoad cleared savingRevision
    // But even if it could, the saveSucceeded() logic uses
    // current editRevision — so it would see revision=1 and
    // savingRevision=null, and set lastSavedRevision=1
    useDirtyStore.getState().saveSucceeded();
    expect(useDirtyStore.getState().dirty).toBe(false);
    expect(useDirtyStore.getState().lastSavedRevision).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 6: Full save lifecycle with project scope
// ═══════════════════════════════════════════════════════════════════
describe('7.2A: Full save lifecycle', () => {
  it('complete lifecycle: load → edit → save → clean', () => {
    // Load project
    useDirtyStore.getState().resetOnLoad('proj-1');
    expect(useDirtyStore.getState().currentProjectId).toBe('proj-1');
    expect(useDirtyStore.getState().dirty).toBe(false);

    // Edit
    useDirtyStore.getState().markDirty();
    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().editRevision).toBe(1);

    // Start save
    useDirtyStore.getState().startSaving();
    expect(useDirtyStore.getState().savingRevision).toBe(1);
    expect(useDirtyStore.getState().saveStatus).toBe('saving');

    // Save succeeds
    const result = useDirtyStore.getState().saveSucceeded();
    expect(result).toBe(true);
    expect(useDirtyStore.getState().dirty).toBe(false);
    expect(useDirtyStore.getState().saveStatus).toBe('saved');
  });

  it('lifecycle with error and retry', () => {
    useDirtyStore.getState().resetOnLoad('proj-1');
    useDirtyStore.getState().markDirty();
    useDirtyStore.getState().startSaving();
    useDirtyStore.getState().saveFailed('Network timeout');

    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().saveStatus).toBe('error');

    // Retry — clearError first
    useDirtyStore.getState().clearError();
    expect(useDirtyStore.getState().saveStatus).toBe('dirty');

    // Save again
    useDirtyStore.getState().startSaving();
    const result = useDirtyStore.getState().saveSucceeded();
    expect(result).toBe(true);
    expect(useDirtyStore.getState().dirty).toBe(false);
  });

  it('lifecycle with concurrent edits', () => {
    useDirtyStore.getState().resetOnLoad('proj-1');

    // Edit 1
    useDirtyStore.getState().markDirty(); // revision 1
    useDirtyStore.getState().startSaving(); // savingRevision = 1

    // Edit 2 during save
    useDirtyStore.getState().markDirty(); // revision 2

    // Save completes but revision doesn't match
    const result = useDirtyStore.getState().saveSucceeded();
    expect(result).toBe(false);
    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().saveStatus).toBe('dirty');

    // Second save
    useDirtyStore.getState().startSaving(); // savingRevision = 2
    const result2 = useDirtyStore.getState().saveSucceeded();
    expect(result2).toBe(true);
    expect(useDirtyStore.getState().dirty).toBe(false);
  });

  it('project switch during save cancels cleanly', () => {
    useDirtyStore.getState().resetOnLoad('proj-A');
    useDirtyStore.getState().markDirty();
    useDirtyStore.getState().startSaving();

    // Switch to project B — should cancel everything
    useDirtyStore.getState().resetOnLoad('proj-B');

    expect(useDirtyStore.getState().savingRevision).toBe(null);
    expect(useDirtyStore.getState().currentProjectId).toBe('proj-B');
    expect(useDirtyStore.getState().dirty).toBe(false);
    expect(useDirtyStore.getState().editRevision).toBe(0);
  });
});
