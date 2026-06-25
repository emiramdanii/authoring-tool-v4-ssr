// ═══════════════════════════════════════════════════════════════════
// STORE INIT BOOTSTRAP INTEGRATION TESTS  (Sprint 8.2S-2-Patch-3)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2S-2-Patch-3 — Senior Review "Catatan kecil" (P0-1)
//
// Senior Review noted that cold-start tests call configureModeOrchestrator
// directly, not by rendering StoreInit and running initCanvaStoreSubscriptions
// for real. This file adds a real bootstrap integration test that:
//   1. Renders <StoreInit />
//   2. Verifies initCanvaStoreSubscriptions() ran (canva store ref set,
//      mode orchestrator configured)
//   3. Verifies setAppMode works after bootstrap (no throw)
//   4. Verifies cleanup on unmount
//
// This protects against accidental removal of the configureModeOrchestrator
// call from init.ts.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';

// ─────────────────────────────────────────────────────────────────
// Mocks — same pattern as mode-lifecycle-smoke.test.ts
// ─────────────────────────────────────────────────────────────────

vi.mock('@/store/authoring-store', () => {
  const fakeState: Record<string, unknown> = {
    activePreset: null, meta: {}, cp: {}, tp: {}, atp: {}, alur: {},
    suara: {}, petunjuk: {}, penutup: {}, motivasi: {}, rangkuman: {},
    modules: [], kuis: [], games: [], diskusi: [], refleksi: [],
    dirty: false, activePanel: 'canva', setActivePanel: () => {}, setMeta: () => {},
  };
  const useAuthoringStore: any = (selector: (s: any) => any) => selector(fakeState);
  useAuthoringStore.getState = () => fakeState;
  useAuthoringStore.setState = (patch: any) => { Object.assign(fakeState, patch); };
  useAuthoringStore.subscribe = () => () => {};
  return { useAuthoringStore };
});

vi.mock('@/store/dirty-store', () => {
  const fakeState = {
    dirty: false, saveStatus: 'idle', editRevision: 0, lastSavedRevision: 0,
    savingRevision: null, lastError: null, currentProjectId: null, _hydrationDepth: 0,
    markDirty: () => {}, markClean: () => {}, startSaving: () => {},
    saveSucceeded: () => false, saveFailed: () => {}, resetOnLoad: () => {},
    clearError: () => {}, buildSaveToken: () => ({ projectId: null, revision: 0 }),
    isSaveTokenValid: () => false, startHydration: () => {}, endHydration: () => {},
    setCurrentProjectId: () => {},
  };
  const useDirtyStore: any = (selector: (s: any) => any) => selector(fakeState);
  useDirtyStore.getState = () => fakeState;
  useDirtyStore.setState = () => {};
  useDirtyStore.subscribe = () => () => {};
  return { useDirtyStore };
});

// Mock service worker (StoreInit calls useServiceWorker)
vi.mock('@/hooks/use-service-worker', () => ({
  useServiceWorker: () => {},
}));

// Mock sounds (StoreInit calls preloadSounds)
vi.mock('@/lib/sounds', () => ({
  preloadSounds: () => {},
}));

// Mock offline-sync (StoreInit calls initAutoFlush)
vi.mock('@/lib/offline-sync', () => ({
  initAutoFlush: () => () => {},  // returns cleanup function
}));

// BATCH-04: Mock schema-projection (StoreInit imports deriveProjectionFromPages)
vi.mock('@/core/schema/schema-projection', () => ({
  deriveProjectionFromPages: () => ({ meta: {} }),
}));

// Import stores AFTER mocks
const { useCanvaStore } = await import('@/store/canva-store');
const { useInteractiveStore } = await import('@/store/interactive-store');
const { useLearningMediaStore } = await import('@/store/learning-media-store');
const { isModeOrchestratorConfigured, __resetModeOrchestratorForTest } = await import('@/store/canva/mode-orchestrator');
const { StoreInit } = await import('@/components/providers/StoreInit');

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 8.2S-2-Patch-3 — StoreInit bootstrap integration (P0-1 wiring)', () => {
  beforeEach(() => {
    // Reset orchestrator to unconfigured state before each test
    __resetModeOrchestratorForTest();
    expect(isModeOrchestratorConfigured()).toBe(false);

    // Reset stores
    useCanvaStore.setState({
      appMode: 'edit',
      currentPageIndex: 0,
      pages: [],
      selectedBlockId: null,
      selectedBlockIds: [],
      selectedBlockType: null,
      hoveredBlockId: null,
      editingBlockId: null,
      selectedElId: null,
      selectedElIds: [],
      panelRequest: null,
    });
    useInteractiveStore.setState({
      mode: 'design',
      interactivePageIdx: 0,
      totalPages: 0,
      scores: [],
      replayGeneration: 0,
    });
    useLearningMediaStore.setState({ learnSubMode: 'play' });
  });

  afterEach(() => {
    cleanup();
  });

  it('StoreInit render configures mode orchestrator (bootstrap wiring intact)', () => {
    // Before render: orchestrator unconfigured
    expect(isModeOrchestratorConfigured()).toBe(false);

    // Render StoreInit — this calls initCanvaStoreSubscriptions() in useEffect
    render(React.createElement(StoreInit));

    // After render: orchestrator SHOULD be configured
    // (initCanvaStoreSubscriptions calls configureModeOrchestrator)
    expect(isModeOrchestratorConfigured()).toBe(true);
  });

  it('after StoreInit bootstrap, setAppMode does NOT throw (cold-start safe)', () => {
    render(React.createElement(StoreInit));

    // setAppMode should work — orchestrator is configured
    expect(() => {
      useCanvaStore.getState().setAppMode('preview');
    }).not.toThrow();

    expect(useCanvaStore.getState().appMode).toBe('preview');
  });

  it('after StoreInit bootstrap, Edit → Present resets scores (cold-start invariant)', () => {
    render(React.createElement(StoreInit));

    // Setup: enter Preview, play quiz, get score
    useCanvaStore.getState().setAppMode('preview');
    useInteractiveStore.getState().openPlay();
    useInteractiveStore.getState().reportScore({
      pageIndex: 0,
      blockId: 'quiz-1',
      elementId: 'quiz-1',
      score: 80,
      maxScore: 100,
      completed: true,
    });
    expect(useInteractiveStore.getState().scores.length).toBeGreaterThan(0);

    // Switch to Present — scores MUST reset (M-001 cold-start via real bootstrap)
    useCanvaStore.getState().setAppMode('present');
    expect(useInteractiveStore.getState().scores).toEqual([]);
  });

  it('after StoreInit bootstrap, Edit → Learn resets learnSubMode (cold-start invariant)', () => {
    render(React.createElement(StoreInit));

    // Pre-bootstrap stale state
    useLearningMediaStore.setState({ learnSubMode: 'edit' });

    // Enter Learn — learnSubMode MUST reset to 'play' (M-002 cold-start via real bootstrap)
    useCanvaStore.getState().setAppMode('learn');
    expect(useLearningMediaStore.getState().learnSubMode).toBe('play');
  });

  it('StoreInit unmount cleans up subscriptions (no error)', () => {
    const { unmount } = render(React.createElement(StoreInit));
    expect(isModeOrchestratorConfigured()).toBe(true);

    // Unmount should not throw — cleanupCanvaStoreSubscriptions runs
    expect(() => {
      unmount();
    }).not.toThrow();
  });

  it('StoreInit is idempotent — multiple mounts do not double-init', () => {
    // First mount
    const { unmount: unmount1 } = render(React.createElement(StoreInit));
    expect(isModeOrchestratorConfigured()).toBe(true);

    // Unmount (cleanup)
    unmount1();

    // Second mount — should re-init cleanly (init guard _initCalled reset on unmount)
    const { unmount: unmount2 } = render(React.createElement(StoreInit));
    expect(isModeOrchestratorConfigured()).toBe(true);

    // setAppMode should still work
    expect(() => {
      useCanvaStore.getState().setAppMode('preview');
    }).not.toThrow();

    unmount2();
  });
});
