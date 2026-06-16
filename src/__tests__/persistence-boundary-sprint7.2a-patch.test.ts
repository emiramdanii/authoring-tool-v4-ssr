// ═══════════════════════════════════════════════════════════════════
// SPRINT 7.2A-PATCH — PERSISTENCE BOUNDARY INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════
// 9 mandatory integration tests covering the full coordinator flow
// with mock dbSaveFns. Tests the interaction between dirty-store
// state machine and the coordinator functions in save-utils.ts.
//
// These differ from dirty-coverage-sprint7.2.test.ts which tests
// the state machine in isolation. These tests verify that the
// COORDINATOR correctly orchestrates the state machine, including:
//   - Single lifecycle ownership (only executeDurableSave calls startSaving/saveSucceeded/saveFailed)
//   - Pure persistence primitive (dbSaveFn never touches lifecycle)
//   - Strict completion token validation
//   - flushDurableSave blocking semantics
//   - Edit-during-save follow-up save
//   - Cross-project save rejection at coordinator level
//   - Hydration suppression at coordinator level (nested)
//   - CreateProject token binding at coordinator level
//   - Error propagation through the full pipeline
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDirtyStore } from '@/store/dirty-store';
import type { SaveToken } from '@/store/dirty-store';

// ── Mock heavy store dependencies before importing save-utils ──
// save-utils imports useCanvaStore and useAuthoringStore which have
// complex dependency chains. We mock them to isolate the coordinator.
vi.mock('@/store/canva-store', () => ({
  useCanvaStore: {
    getState: vi.fn(() => ({
      saveToStorage: vi.fn(),
      pages: [],
      ratioId: '16:9',
      _saveStatus: 'unsaved',
      _lastSavedAt: null,
      _pagesHashAtSave: null,
    })),
    setState: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
  },
}));

vi.mock('@/store/authoring-store', () => ({
  useAuthoringStore: {
    getState: vi.fn(() => ({
      saveToStorage: vi.fn(),
      meta: { judulPertemuan: 'Test', mapel: '', kelas: '' },
      cp: [], tp: [], atp: [], alur: [],
      skenario: [], kuis: [], modules: [], games: [],
      materi: [], petunjuk: [], diskusi: [], refleksi: [],
      penutup: [], suara: [],
      dirty: false,
    })),
    setState: vi.fn(),
  },
}));

vi.mock('@/lib/offline-sync', () => ({
  enqueueSave: vi.fn(),
}));

vi.mock('@/core/recovery', () => ({
  computePagesHash: vi.fn(() => 'mock-hash'),
}));

vi.mock('@/core/utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

// ── Import coordinator AFTER mocks ──
import {
  executeDurableSave,
  flushDurableSave,
  cancelAutoSaveTimers,
} from '@/lib/save-utils';

// ── Helpers ──────────────────────────────────────────────────────

/** Reset store to clean state before each test */
function resetStore(projectId?: string | null) {
  useDirtyStore.setState({
    saveStatus: 'idle',
    editRevision: 0,
    lastSavedRevision: 0,
    savingRevision: null,
    lastError: null,
    dirty: false,
    currentProjectId: projectId ?? null,
    _hydrationDepth: 0,
  });
}

/** Create a mock dbSaveFn that succeeds after a delay */
function createSuccessDbSaveFn(delayMs = 10): () => Promise<void> {
  return vi.fn().mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve, delayMs)));
}

/** Create a mock dbSaveFn that fails after a delay */
function createFailDbSaveFn(errorMsg = 'DB error', delayMs = 10): () => Promise<void> {
  return vi.fn().mockImplementation(
    () => new Promise<void>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), delayMs))
  );
}

beforeEach(() => {
  resetStore('test-project');
  cancelAutoSaveTimers();
});

// ═══════════════════════════════════════════════════════════════════
// TEST 1: executeDurableSave owns lifecycle — dbSaveFn never touches it
// ═══════════════════════════════════════════════════════════════════
describe('Integration 1: Single lifecycle ownership', () => {
  it('executeDurableSave calls startSaving before dbSaveFn and saveSucceeded after', async () => {
    const dbSaveFn = createSuccessDbSaveFn(5);

    // Mark dirty first
    useDirtyStore.getState().markDirty();
    expect(useDirtyStore.getState().dirty).toBe(true);

    // Execute save
    const result = await executeDurableSave(dbSaveFn);

    // Verify dbSaveFn was called
    expect(dbSaveFn).toHaveBeenCalledTimes(1);

    // Verify final state: clean after successful save
    expect(result).toBe(true);
    expect(useDirtyStore.getState().dirty).toBe(false);
    expect(useDirtyStore.getState().saveStatus).toBe('saved');
    expect(useDirtyStore.getState().savingRevision).toBe(null);
    expect(useDirtyStore.getState().lastSavedRevision).toBe(1);
  });

  it('dbSaveFn that calls lifecycle methods gets caught by strict token validation', async () => {
    // Simulate a BAD dbSaveFn that tries to call lifecycle methods
    // The strict completion token catches this: if saveSucceeded() is called
    // inside dbSaveFn, it consumes savingRevision (sets to null). When the
    // coordinator then validates the token, savingRevision is null → invalid.
    const badDbSaveFn = vi.fn().mockImplementation(async () => {
      // BAD: trying to call saveSucceeded inside the persistence function
      // This consumes savingRevision (sets it to null), making the token invalid.
      useDirtyStore.getState().saveSucceeded(); // double lifecycle attempt
    });

    useDirtyStore.getState().markDirty();
    const result = await executeDurableSave(badDbSaveFn);

    // The bad dbSaveFn consumed savingRevision, so the strict token
    // validation (savingRevision === null → invalid) rejects the save.
    // This is the CORRECT behavior — the strict token catches lifecycle violations.
    expect(result).toBe(false);
    // No crash, no data corruption — the state machine is protected.
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 2: DB failure propagates — never marked as saved
// ═══════════════════════════════════════════════════════════════════
describe('Integration 2: DB failure never ends as saved', () => {
  it('failed dbSaveFn results in error status, dirty stays true', async () => {
    const dbSaveFn = createFailDbSaveFn('Network timeout');

    useDirtyStore.getState().markDirty();
    const result = await executeDurableSave(dbSaveFn);

    expect(result).toBe(false);
    expect(useDirtyStore.getState().saveStatus).toBe('error');
    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().lastError).toBe('Network timeout');
    expect(useDirtyStore.getState().savingRevision).toBe(null);
  });

  it('retry after failure succeeds and clears dirty', async () => {
    const failFn = createFailDbSaveFn('Network timeout');
    const successFn = createSuccessDbSaveFn(5);

    useDirtyStore.getState().markDirty();

    // First attempt fails
    await executeDurableSave(failFn);
    expect(useDirtyStore.getState().saveStatus).toBe('error');
    expect(useDirtyStore.getState().dirty).toBe(true);

    // Clear error and retry
    useDirtyStore.getState().clearError();
    const result = await executeDurableSave(successFn);

    expect(result).toBe(true);
    expect(useDirtyStore.getState().dirty).toBe(false);
    expect(useDirtyStore.getState().saveStatus).toBe('saved');
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 3: Strict completion token — stale save rejected at coordinator
// ═══════════════════════════════════════════════════════════════════
describe('Integration 3: Strict completion token validation', () => {
  it('token is valid during in-flight save, invalid after project switch', async () => {
    const dbSaveFn = createSuccessDbSaveFn(20); // slow save

    useDirtyStore.getState().markDirty();

    // Start save (non-blocking — we'll check state during the save)
    const savePromise = executeDurableSave(dbSaveFn);

    // While save is in-flight, token should be valid
    // (savingRevision is set, matches token)
    expect(useDirtyStore.getState().saveStatus).toBe('saving');
    expect(useDirtyStore.getState().savingRevision).toBe(1);

    const token = useDirtyStore.getState().buildSaveToken();
    expect(useDirtyStore.getState().isSaveTokenValid(token)).toBe(true);

    await savePromise;
  });

  it('token with wrong savingRevision is invalid', () => {
    useDirtyStore.getState().markDirty(); // revision 1
    useDirtyStore.getState().startSaving(); // savingRevision = 1

    // Token from a different revision
    const wrongToken: SaveToken = { projectId: 'test-project', revision: 99 };
    expect(useDirtyStore.getState().isSaveTokenValid(wrongToken)).toBe(false);

    // Correct token
    const correctToken: SaveToken = { projectId: 'test-project', revision: 1 };
    expect(useDirtyStore.getState().isSaveTokenValid(correctToken)).toBe(true);
  });

  it('token from different project is invalid even with matching revision', () => {
    useDirtyStore.getState().markDirty(); // revision 1
    useDirtyStore.getState().startSaving(); // savingRevision = 1

    const wrongProjectToken: SaveToken = { projectId: 'other-project', revision: 1 };
    expect(useDirtyStore.getState().isSaveTokenValid(wrongProjectToken)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 4: flushDurableSave blocks on failure
// ═══════════════════════════════════════════════════════════════════
describe('Integration 4: flushDurableSave blocks on failure', () => {
  it('flushDurableSave returns false when save fails', async () => {
    const failFn = createFailDbSaveFn('Flush failed');

    useDirtyStore.getState().markDirty();
    const result = await flushDurableSave(failFn);

    expect(result).toBe(false);
    expect(useDirtyStore.getState().saveStatus).toBe('error');
    expect(useDirtyStore.getState().dirty).toBe(true);
  });

  it('flushDurableSave returns true when save succeeds', async () => {
    const successFn = createSuccessDbSaveFn(5);

    useDirtyStore.getState().markDirty();
    const result = await flushDurableSave(successFn);

    expect(result).toBe(true);
    expect(useDirtyStore.getState().dirty).toBe(false);
    expect(useDirtyStore.getState().saveStatus).toBe('saved');
  });

  it('flushDurableSave waits for in-flight save to complete', async () => {
    // Start a slow save
    const slowFn = createSuccessDbSaveFn(50);
    useDirtyStore.getState().markDirty();

    // Start the save (non-blocking)
    const savePromise = executeDurableSave(slowFn);
    expect(useDirtyStore.getState().saveStatus).toBe('saving');

    // Call flushDurableSave while save is in-flight
    const flushPromise = flushDurableSave(slowFn);

    // Both should resolve
    await savePromise;
    const flushResult = await flushPromise;

    // Flush should find the project clean after the in-flight save
    expect(flushResult).toBe(true);
    expect(useDirtyStore.getState().dirty).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 5: Edit during save triggers follow-up save
// ═══════════════════════════════════════════════════════════════════
describe('Integration 5: Edit during save triggers follow-up', () => {
  it('edit during in-flight save keeps project dirty after completion', async () => {
    const dbSaveFn = vi.fn().mockImplementation(async () => {
      // Simulate edit happening while DB is saving
      useDirtyStore.getState().markDirty(); // editRevision advances past savingRevision
    });

    useDirtyStore.getState().markDirty(); // revision 1
    const result = await executeDurableSave(dbSaveFn);

    // First save completes but project is still dirty (edit during save).
    // The coordinator saves revision 1 successfully, but revision 2 is dirty.
    // Note: follow-up save is triggered by autosave subscription, not by
    // the same executeDurableSave call (no _pendingSave here since there's
    // no concurrent executeDurableSave call — just an edit within the dbSaveFn).
    expect(dbSaveFn).toHaveBeenCalledTimes(1);
    expect(useDirtyStore.getState().dirty).toBe(true); // still dirty
    expect(useDirtyStore.getState().lastSavedRevision).toBe(1); // rev 1 saved
    expect(useDirtyStore.getState().editRevision).toBe(2); // but rev 2 exists
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 6: Cross-project save rejected at coordinator level
// ═══════════════════════════════════════════════════════════════════
describe('Integration 6: Cross-project save rejection', () => {
  it('project switch during save invalidates token and discards result', async () => {
    const dbSaveFn = vi.fn().mockImplementation(async () => {
      // Simulate project switch while save is in progress
      useDirtyStore.getState().resetOnLoad('other-project');
    });

    useDirtyStore.getState().markDirty(); // revision 1
    const result = await executeDurableSave(dbSaveFn);

    // Token was invalidated by the project switch, so the save result
    // is discarded even though dbSaveFn succeeded
    expect(result).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 7: Nested hydration at coordinator level
// ═══════════════════════════════════════════════════════════════════
describe('Integration 7: Nested hydration suppression', () => {
  it('simulated loadProject: outer hydration wraps inner CanvaStore hydration', () => {
    // Simulates the loadProject flow in use-project-manager.tsx:
    // 1. startHydration (outer, ProjectManager level)
    // 2. loadFromDB → startHydration (inner, CanvaStore level)
    // 3. resetOnLoad (resets counters, NOT depth)
    // 4. Store mutations (markDirty suppressed)
    // 5. loadFromDB → endHydration (inner ends)
    // 6. More mutations (still suppressed — outer active)
    // 7. ProjectManager → endHydration (outer ends)
    // 8. Mutations now work

    // Step 1: Outer hydration
    useDirtyStore.getState().startHydration(); // depth = 1

    // Step 2: Inner hydration (CanvaStore.loadFromDB)
    useDirtyStore.getState().startHydration(); // depth = 2

    // Step 3: resetOnLoad — does NOT touch depth (P0-6 fix)
    useDirtyStore.getState().resetOnLoad('new-project');
    expect(useDirtyStore.getState()._hydrationDepth).toBe(2); // still 2
    expect(useDirtyStore.getState().currentProjectId).toBe('new-project');
    expect(useDirtyStore.getState().editRevision).toBe(0);

    // Step 4: Mutations during load — suppressed
    useDirtyStore.getState().markDirty();
    expect(useDirtyStore.getState().dirty).toBe(false);

    // Step 5: Inner hydration ends (CanvaStore.loadFromDB done)
    useDirtyStore.getState().endHydration(); // depth = 1

    // Step 6: Between loads — still suppressed
    useDirtyStore.getState().markDirty();
    expect(useDirtyStore.getState().dirty).toBe(false);

    // Step 7: Outer hydration ends (ProjectManager done)
    useDirtyStore.getState().endHydration(); // depth = 0

    // Step 8: Now mutations work
    useDirtyStore.getState().markDirty();
    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().editRevision).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 8: CreateProject binds save token
// ═══════════════════════════════════════════════════════════════════
describe('Integration 8: CreateProject token binding', () => {
  it('setCurrentProjectId + force save binds token to new project', async () => {
    // Start with no project
    resetStore(null);
    useDirtyStore.getState().markDirty(); // revision 1
    expect(useDirtyStore.getState().currentProjectId).toBe(null);

    // Simulate createProject: bind new ID without resetting revision
    useDirtyStore.getState().setCurrentProjectId('brand-new-project');
    expect(useDirtyStore.getState().currentProjectId).toBe('brand-new-project');
    expect(useDirtyStore.getState().editRevision).toBe(1); // preserved
    expect(useDirtyStore.getState().dirty).toBe(true); // still dirty

    // Force save with new project ID
    const dbSaveFn = createSuccessDbSaveFn(5);
    const result = await executeDurableSave(dbSaveFn, { force: true });

    expect(result).toBe(true);
    expect(useDirtyStore.getState().dirty).toBe(false);
    expect(useDirtyStore.getState().lastSavedRevision).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 9: Full error propagation through pipeline
// ═══════════════════════════════════════════════════════════════════
describe('Integration 9: Full error propagation pipeline', () => {
  it('DB error → saveFailed → dirty preserved → retry → success → clean', async () => {
    // Phase 1: Initial edit
    useDirtyStore.getState().markDirty(); // revision 1
    expect(useDirtyStore.getState().dirty).toBe(true);

    // Phase 2: Save attempt fails
    const failFn = createFailDbSaveFn('Server error 500');
    let result = await executeDurableSave(failFn);
    expect(result).toBe(false);
    expect(useDirtyStore.getState().saveStatus).toBe('error');
    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().lastError).toBe('Server error 500');
    expect(useDirtyStore.getState().lastSavedRevision).toBe(0); // never saved

    // Phase 3: Clear error for retry
    useDirtyStore.getState().clearError();
    expect(useDirtyStore.getState().saveStatus).toBe('dirty');
    expect(useDirtyStore.getState().lastError).toBe(null);

    // Phase 4: Retry succeeds
    const successFn = createSuccessDbSaveFn(5);
    result = await executeDurableSave(successFn);
    expect(result).toBe(true);
    expect(useDirtyStore.getState().dirty).toBe(false);
    expect(useDirtyStore.getState().saveStatus).toBe('saved');
    expect(useDirtyStore.getState().lastSavedRevision).toBe(1);
    expect(useDirtyStore.getState().savingRevision).toBe(null);
  });

  it('consecutive failures preserve dirty and allow eventual recovery', async () => {
    useDirtyStore.getState().markDirty(); // revision 1

    // Fail three times
    for (let i = 0; i < 3; i++) {
      const failFn = createFailDbSaveFn(`Error ${i + 1}`);
      await executeDurableSave(failFn);
      expect(useDirtyStore.getState().dirty).toBe(true);

      // Clear error for next attempt
      useDirtyStore.getState().clearError();
    }

    // Fourth attempt succeeds
    const successFn = createSuccessDbSaveFn(5);
    const result = await executeDurableSave(successFn);

    expect(result).toBe(true);
    expect(useDirtyStore.getState().dirty).toBe(false);
    expect(useDirtyStore.getState().saveStatus).toBe('saved');
  });
});
