// ═══════════════════════════════════════════════════════════════════
// SPRINT 9.0B-Patch-1 — Real saveToStorage() Failure/Success Path
// ═══════════════════════════════════════════════════════════════════
// Senior Review 9.0B RC1 + RC2:
//   RC1 — Existing 9.0B test mocked canva-store entirely, so it never
//         exercised the real saveToStorage() failure path. The four
//         failure-reason cases (quota-exceeded, serialization-error,
//         stack-overflow, unknown) only called recordAutosaveFailure()
//         directly, which proves the helper works but NOT that the
//         persistence-slice is wired to it correctly.
//   RC2 — Dirty-state protection (saveFailed() keeps dirty=true) was
//         also never tested against the real dirty-store.
//
// This file closes both gaps by importing the REAL useCanvaStore
// (only authoring-store + dirty-store are stubbed to keep module
// graph loadable in the test env) and the REAL useDirtyStore.
//
// Coverage:
//   1. localStorage.setItem throws QuotaExceededError →
//      saveToStorage() records telemetry + sets _saveStatus='error'
//   2. localStorage.setItem throws TypeError →
//      saveToStorage() records 'serialization-error' telemetry
//   3. localStorage.setItem throws RangeError →
//      saveToStorage() records 'stack-overflow' AND clears localStorage
//   4. localStorage.setItem throws generic Error →
//      saveToStorage() records 'unknown'
//   5. After a failure, a successful saveToStorage() clears telemetry
//   6. _saveStatus is 'error' after failure, recovers on success
//   7. Real useDirtyStore.saveFailed('msg') keeps dirty=true + sets
//      saveStatus='error' + lastError='msg' + savingRevision=null
//   8. Real useDirtyStore.saveSucceeded() (matching revision) clears
//      dirty — proving dirty is NOT falsely cleared on failure
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';

// ─────────────────────────────────────────────────────────────────
// localStorage polyfill (hoisted BEFORE any module imports).
// We expose a `__setThrow` knob so individual tests can simulate
// localStorage.setItem failures on demand.
//
// IMPORTANT: We FORCE-overwrite globalThis.localStorage even when
// jsdom has provided its own. Otherwise the REAL canva-store's
// saveToStorage() would call jsdom's localStorage.setItem, not our
// polyfill, and our __setThrow knob would never fire.
// ─────────────────────────────────────────────────────────────────

const localStorageStore = vi.hoisted(() => {
  const store = new Map<string, string>();
  let shouldThrow = false;
  let throwError: Error | null = null;
  const ls: Storage & { __setThrow: (err: Error | null) => void } = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (shouldThrow && throwError) throw throwError;
      store.set(k, v);
    },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); shouldThrow = false; throwError = null; },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
    __setThrow: (err: Error | null) => { shouldThrow = !!err; throwError = err; },
  };
  return { store, ls };
});

// Force-overwrite — see note above.
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageStore.ls,
  writable: true,
  configurable: true,
});

// ─────────────────────────────────────────────────────────────────
// Mocks — canva-store transitively imports authoring-store +
// dirty-store, which have heavy init paths. We stub them so the
// real persistence-slice can load without dragging the full
// authoring/dirty init. The REAL useCanvaStore below is NOT mocked.
// ─────────────────────────────────────────────────────────────────

vi.mock('@/store/authoring-store', () => {
  const fakeState: Record<string, unknown> = {
    activePreset: null, meta: {}, cp: { capaianFase: '' }, tp: [], atp: {}, alur: {},
    suara: {}, petunjuk: { langkah: [] }, penutup: { preview: [] }, motivasi: {},
    rangkuman: {}, modules: [], kuis: [], games: [], diskusi: { pertanyaan: [] },
    refleksi: { pertanyaan: [] }, skenario: [], materi: { blok: [] },
    tpList: [], moduleList: [], kuisList: [], activityList: [], templateList: [],
    activePanel: 'dashboard', teacherMode: false,
    saveToStorage: () => {}, loadFromStorage: () => {}, newProject: () => {},
    setActivePanel: () => {}, setMeta: () => {},
  };
  const useAuthoringStore = Object.assign(
    (selector?: (s: Record<string, unknown>) => unknown) =>
      selector ? selector(fakeState) : fakeState,
    { getState: () => fakeState, setState: () => {} },
  );
  return { useAuthoringStore };
});

// Dirty store is mocked for the canva-store import path (persistence-slice
// imports it), but the REAL dirty store is tested separately below by
// importing it BEFORE the mock takes effect on the canva-store graph.
// To get the real dirty-store, we re-import via a fresh module boundary
// in the dedicated dirty-store describe block.
vi.mock('@/store/dirty-store', () => ({
  useDirtyStore: Object.assign(() => ({ dirty: false }), {
    getState: () => ({
      dirty: false,
      saveStatus: 'idle' as const,
      editRevision: 0,
      lastSavedRevision: 0,
      savingRevision: null,
      lastError: null,
      currentProjectId: null,
      _hydrationDepth: 0,
      markDirty: () => {},
      markClean: () => {},
      startSaving: () => {},
      saveSucceeded: () => false,
      saveFailed: () => {},
      resetOnLoad: () => {},
      clearError: () => {},
      buildSaveToken: () => ({ projectId: null, revision: 0 }),
      isSaveTokenValid: () => false,
      startHydration: () => {},
      endHydration: () => {},
      setCurrentProjectId: () => {},
    }),
    setState: () => {},
  }),
}));

vi.mock('@/core/schema/capability-registry', () => ({
  BlockCapabilityRegistry: { filterByCapability: () => [] },
}));

// ─────────────────────────────────────────────────────────────────
// Real imports — these pull in the REAL persistence-slice with the
// REAL saveToStorage() implementation, including the 9.0B telemetry
// wiring (recordAutosaveFailure + clearAutosaveTelemetry).
// ─────────────────────────────────────────────────────────────────

import { useCanvaStore } from '@/store/canva-store';
import { CANVA_STORAGE_KEY } from '@/store/canva/constants';
import {
  getAutosaveTelemetry,
  _resetAutosaveTelemetry,
} from '@/lib/autosave-telemetry';
import type { CanvaPage } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function makeMinimalPage(id: string): CanvaPage {
  return {
    id,
    label: `Page ${id}`,
    bgDataUrl: null,
    bgColor: '#0f172a',
    overlay: 0,
    elements: [],
    templateType: 'custom',
    colorPalette: null,
    navConfig: { ...DEFAULT_NAV_CONFIG },
    templateData: {},
    pageMode: 'schema',
    schema: {
      id: `schema-${id}`,
      templateType: 'materi',
      blocks: [],
    },
  };
}

function resetCanvaStore(pages: CanvaPage[]) {
  useCanvaStore.setState({
    appMode: 'edit',
    currentPageIndex: pages.length > 0 ? 0 : -1,
    pages,
    _saveStatus: 'unsaved',
    _lastSavedAt: 0,
    _pagesHashAtSave: '',
    selectedBlockId: null,
    selectedBlockIds: [],
    selectedBlockType: null,
    hoveredBlockId: null,
    editingBlockId: null,
    selectedElId: null,
    selectedElIds: [],
    panelRequest: null,
  } as never);
}

// ─────────────────────────────────────────────────────────────────
// Tests — REAL saveToStorage() failure & success paths
// ─────────────────────────────────────────────────────────────────

describe('Sprint 9.0B-Patch-1 — Real saveToStorage() failure/success paths', () => {
  beforeEach(() => {
    _resetAutosaveTelemetry();
    localStorageStore.ls.clear();
    localStorageStore.ls.__setThrow(null);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    resetCanvaStore([makeMinimalPage('p1')]);
  });

  afterEach(() => {
    localStorageStore.ls.__setThrow(null);
    vi.restoreAllMocks();
  });

  // ── 1. QuotaExceededError → telemetry records + _saveStatus=error ──

  it('localStorage.setItem throws QuotaExceededError → telemetry records quota-exceeded + _saveStatus=error', () => {
    // Pre-condition: telemetry is clean
    expect(getAutosaveTelemetry().errorCount).toBe(0);
    expect(useCanvaStore.getState()._saveStatus).not.toBe('error');

    // Arm the throw
    const quotaErr = new DOMException('quota exceeded', 'QuotaExceededError');
    localStorageStore.ls.__setThrow(quotaErr);

    // Call the REAL saveToStorage()
    useCanvaStore.getState().saveToStorage();

    // Telemetry should record the failure
    const t = getAutosaveTelemetry();
    expect(t.lastReason).toBe('quota-exceeded');
    expect(t.lastError).toContain('quota');
    expect(t.errorCount).toBe(1);
    expect(t.lastFailureAt).not.toBeNull();

    // Store should reflect the failure
    expect(useCanvaStore.getState()._saveStatus).toBe('error');

    // localStorage should NOT have been written (throw happened before store.set)
    expect(localStorage.getItem(CANVA_STORAGE_KEY)).toBeNull();
  });

  // ── 2. TypeError → telemetry records serialization-error ───────────

  it('localStorage.setItem throws TypeError → telemetry records serialization-error', () => {
    localStorageStore.ls.__setThrow(new TypeError('Converting circular structure to JSON'));

    useCanvaStore.getState().saveToStorage();

    const t = getAutosaveTelemetry();
    expect(t.lastReason).toBe('serialization-error');
    expect(t.lastError).toContain('circular');
    expect(t.errorCount).toBe(1);
    expect(useCanvaStore.getState()._saveStatus).toBe('error');
  });

  // ── 3. RangeError → telemetry records stack-overflow + clears localStorage ──

  it('localStorage.setItem throws RangeError → telemetry records stack-overflow AND clears corrupted localStorage', () => {
    // Pre-seed localStorage with stale data — RangeError branch should clear it
    localStorage.setItem(CANVA_STORAGE_KEY, '{"stale":"data"}');
    expect(localStorage.getItem(CANVA_STORAGE_KEY)).toBe('{"stale":"data"}');

    localStorageStore.ls.__setThrow(new RangeError('Maximum call stack size exceeded'));

    useCanvaStore.getState().saveToStorage();

    const t = getAutosaveTelemetry();
    expect(t.lastReason).toBe('stack-overflow');
    expect(t.lastError).toContain('stack');
    expect(t.errorCount).toBe(1);
    expect(useCanvaStore.getState()._saveStatus).toBe('error');

    // RangeError branch should have cleared the corrupted localStorage entry
    expect(localStorage.getItem(CANVA_STORAGE_KEY)).toBeNull();
  });

  // ── 4. Generic Error → telemetry records unknown ───────────────────

  it('localStorage.setItem throws generic Error → telemetry records unknown', () => {
    localStorageStore.ls.__setThrow(new Error('something went wrong'));

    useCanvaStore.getState().saveToStorage();

    const t = getAutosaveTelemetry();
    expect(t.lastReason).toBe('unknown');
    expect(t.lastError).toBe('something went wrong');
    expect(t.errorCount).toBe(1);
    expect(useCanvaStore.getState()._saveStatus).toBe('error');
  });

  // ── 5. After failure, successful saveToStorage() clears telemetry ──

  it('after a failure, successful saveToStorage() clears telemetry + writes localStorage', () => {
    // Step 1: Trigger a real failure
    localStorageStore.ls.__setThrow(new DOMException('quota', 'QuotaExceededError'));
    useCanvaStore.getState().saveToStorage();
    expect(getAutosaveTelemetry().errorCount).toBe(1);
    expect(getAutosaveTelemetry().lastReason).toBe('quota-exceeded');
    expect(useCanvaStore.getState()._saveStatus).toBe('error');

    // Step 2: Restore localStorage.setItem
    localStorageStore.ls.__setThrow(null);

    // Step 3: Call saveToStorage() again — should succeed
    useCanvaStore.getState().saveToStorage();

    // Telemetry should be cleared
    const t = getAutosaveTelemetry();
    expect(t.errorCount).toBe(0);
    expect(t.lastError).toBeNull();
    expect(t.lastReason).toBeNull();
    expect(t.lastClearedAt).not.toBeNull();

    // localStorage should now contain the saved data
    const stored = localStorage.getItem(CANVA_STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(stored!).toContain('"pages"');
    expect(stored!).toContain('"_lastSavedAt"');
  });

  // ── 6. Multiple failures increment errorCount via real saveToStorage() ──

  it('multiple consecutive saveToStorage() failures increment errorCount', () => {
    localStorageStore.ls.__setThrow(new DOMException('quota', 'QuotaExceededError'));

    useCanvaStore.getState().saveToStorage();
    expect(getAutosaveTelemetry().errorCount).toBe(1);

    useCanvaStore.getState().saveToStorage();
    expect(getAutosaveTelemetry().errorCount).toBe(2);

    useCanvaStore.getState().saveToStorage();
    expect(getAutosaveTelemetry().errorCount).toBe(3);

    // Most recent reason should still be quota-exceeded
    expect(getAutosaveTelemetry().lastReason).toBe('quota-exceeded');
  });

  // ── 7. Mixed failure reasons are classified correctly across calls ──

  it('mixed failure reasons across real saveToStorage() calls are each classified correctly', () => {
    // TypeError first
    localStorageStore.ls.__setThrow(new TypeError('circular'));
    useCanvaStore.getState().saveToStorage();
    expect(getAutosaveTelemetry().lastReason).toBe('serialization-error');
    expect(getAutosaveTelemetry().errorCount).toBe(1);

    // Then QuotaExceededError
    localStorageStore.ls.__setThrow(new DOMException('quota', 'QuotaExceededError'));
    useCanvaStore.getState().saveToStorage();
    expect(getAutosaveTelemetry().lastReason).toBe('quota-exceeded');
    expect(getAutosaveTelemetry().errorCount).toBe(2);

    // Then a generic Error
    localStorageStore.ls.__setThrow(new Error('unknown cause'));
    useCanvaStore.getState().saveToStorage();
    expect(getAutosaveTelemetry().lastReason).toBe('unknown');
    expect(getAutosaveTelemetry().errorCount).toBe(3);
  });

  // ── 8. Success on first try (no prior failure) — telemetry stays clean ──

  it('successful saveToStorage() with no prior failure leaves telemetry clean', () => {
    // No throw armed — saveToStorage should succeed
    useCanvaStore.getState().saveToStorage();

    const t = getAutosaveTelemetry();
    expect(t.errorCount).toBe(0);
    expect(t.lastError).toBeNull();
    expect(t.lastReason).toBeNull();
    // lastClearedAt is only set when clearAutosaveTelemetry() actually clears
    // something — since there was no prior error, it stays null.
    expect(t.lastClearedAt).toBeNull();

    // localStorage should have the saved data
    expect(localStorage.getItem(CANVA_STORAGE_KEY)).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// Tests — REAL useDirtyStore.saveFailed() keeps dirty=true
// (RC2: Dirty-state protection must be tested against the real store)
// ═══════════════════════════════════════════════════════════════════

// Re-import the real dirty-store. The vi.mock above intercepts the
// '@/store/dirty-store' specifier everywhere — including this file —
// so we use vi.importActual to bypass the mock and get the real
// implementation for this dedicated describe block.
describe('Sprint 9.0B-Patch-1 — Real useDirtyStore.saveFailed() keeps dirty=true', () => {
  // Lazy-loaded real dirty store (avoids the top-level mock).
  let realUseDirtyStore: typeof import('@/store/dirty-store')['useDirtyStore'];

  beforeAll(async () => {
    const mod = await vi.importActual<typeof import('@/store/dirty-store')>('@/store/dirty-store');
    realUseDirtyStore = mod.useDirtyStore;
  });

  beforeEach(() => {
    // Reset the REAL dirty store to a clean baseline before each test.
    // We use setState directly to bypass any lifecycle gating.
    realUseDirtyStore.setState({
      saveStatus: 'idle',
      editRevision: 0,
      lastSavedRevision: 0,
      savingRevision: null,
      lastError: null,
      currentProjectId: null,
      _hydrationDepth: 0,
      dirty: false,
    });
  });

  it('saveFailed(msg) keeps dirty=true after a failed save', () => {
    // Setup: user edits → markDirty → startSaving → save fails
    realUseDirtyStore.getState().markDirty();
    expect(realUseDirtyStore.getState().dirty).toBe(true);
    expect(realUseDirtyStore.getState().editRevision).toBe(1);

    realUseDirtyStore.getState().startSaving();
    expect(realUseDirtyStore.getState().savingRevision).toBe(1);
    expect(realUseDirtyStore.getState().saveStatus).toBe('saving');

    // Save fails
    realUseDirtyStore.getState().saveFailed('Storage full');

    const s = realUseDirtyStore.getState();
    // CRITICAL: dirty must remain true — failure must NOT falsely clean
    expect(s.dirty).toBe(true);
    expect(s.saveStatus).toBe('error');
    expect(s.lastError).toBe('Storage full');
    expect(s.savingRevision).toBeNull();
    // editRevision should be unchanged (the edit still happened)
    expect(s.editRevision).toBe(1);
    // lastSavedRevision should still be 0 (save did not succeed)
    expect(s.lastSavedRevision).toBe(0);
  });

  it('saveSucceeded() with matching revision clears dirty — proves failure path is NOT a false-clean', () => {
    // Setup: markDirty + startSaving
    realUseDirtyStore.getState().markDirty();
    realUseDirtyStore.getState().startSaving();
    expect(realUseDirtyStore.getState().dirty).toBe(true);

    // Save succeeds with matching revision → dirty should clear
    const fullyClean = realUseDirtyStore.getState().saveSucceeded();
    expect(fullyClean).toBe(true);

    const s = realUseDirtyStore.getState();
    expect(s.dirty).toBe(false);
    expect(s.saveStatus).toBe('saved');
    expect(s.lastError).toBeNull();
    expect(s.lastSavedRevision).toBe(1);
  });

  it('saveFailed after markDirty preserves editRevision — retry can resume from the same revision', () => {
    realUseDirtyStore.getState().markDirty();
    realUseDirtyStore.getState().markDirty();
    realUseDirtyStore.getState().markDirty();
    expect(realUseDirtyStore.getState().editRevision).toBe(3);

    realUseDirtyStore.getState().startSaving();
    realUseDirtyStore.getState().saveFailed('network down');

    // After failure: dirty=true, editRevision unchanged
    const s = realUseDirtyStore.getState();
    expect(s.dirty).toBe(true);
    expect(s.editRevision).toBe(3);
    expect(s.lastSavedRevision).toBe(0);
    expect(s.saveStatus).toBe('error');
    expect(s.lastError).toBe('network down');

    // Retry: startSaving captures the same editRevision
    realUseDirtyStore.getState().startSaving();
    expect(realUseDirtyStore.getState().savingRevision).toBe(3);
  });

  it('clearError() on a still-dirty store keeps dirty=true (no false-clean)', () => {
    realUseDirtyStore.getState().markDirty();
    realUseDirtyStore.getState().startSaving();
    realUseDirtyStore.getState().saveFailed('transient');

    // clearError should reset error state but NOT clear dirty
    realUseDirtyStore.getState().clearError();

    const s = realUseDirtyStore.getState();
    expect(s.dirty).toBe(true); // still dirty — edits were never saved
    expect(s.lastError).toBeNull();
    expect(s.saveStatus).toBe('dirty'); // back to dirty, not saved
  });
});
