// ═══════════════════════════════════════════════════════════════════
// LISTENER CLEANUP INTEGRATION TESTS  (Sprint 8.2S-2-Patch)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2S-2-Patch — Senior Review P1-A
//
// These tests verify that PreviewMode, PresentMode, LearningMediaShell,
// and PlayOverlay properly clean up their window/document event
// listeners when unmounted. Without cleanup, rapid mode switches
// can double-register handlers and cause double-trigger bugs.
//
// Strategy:
//   - Spy on window.addEventListener / removeEventListener.
//   - Render each component, count listener registrations.
//   - Unmount, verify all listeners removed (net delta = 0).
//   - Render/unmount rapidly (5x), verify no listener accumulation.
//   - Dispatch a keydown event, verify single handler response.
//
// These are ACCEPTANCE tests — they assert the invariant. If a
// component fails to clean up, the test fails (not just documents).
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import type { CanvaPage, NavConfig } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';

// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2S-2-Patch-4 (P0-2): Synchronous localStorage mock via vi.hoisted()
// ═══════════════════════════════════════════════════════════════════
// jsdom's Storage.setItem calls setTimeout(... 0) internally to dispatch
// storage events. This creates pending timers that are NOT from our code.
// In a real browser, localStorage.setItem is synchronous.
//
// vi.hoisted() guarantees the factory runs before ALL imports (including
// top-level await import()), so the mock is active before zustand persist
// middleware initializes.
//
// This is a TEST-HARNESS fix only. Production code uses standard zustand
// createJSONStorage(() => localStorage) — no changes.
// See KNOWN_ISSUES.md M-007 (CLOSED — TEST-HARNESS FALSE POSITIVE).
// ═══════════════════════════════════════════════════════════════════

vi.hoisted(() => {
  if (typeof globalThis.window === 'undefined') return;

  const syncStorageMap = new Map<string, string>();
  const syncLocalStorage: Storage = {
    get length() { return syncStorageMap.size; },
    key(index: number): string | null {
      return [...syncStorageMap.keys()][index] ?? null;
    },
    getItem(name: string): string | null {
      return syncStorageMap.has(name) ? syncStorageMap.get(name)! : null;
    },
    setItem(name: string, value: string): void {
      syncStorageMap.set(name, value);
      // No setTimeout — synchronous. This is the whole point.
    },
    removeItem(name: string): void {
      syncStorageMap.delete(name);
    },
    clear(): void {
      syncStorageMap.clear();
    },
  };

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: syncLocalStorage,
  });
});

// ─────────────────────────────────────────────────────────────────
// Mocks — same as mode-lifecycle-smoke.test.ts. These tests don't
// need real store behavior; they only verify listener cleanup.
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

// Mock stores that the components read from. Provide minimal shape
// so component rendering doesn't crash.
const { useCanvaStore } = await import('@/store/canva-store');
const { useInteractiveStore, setCanvaStoreRef } = await import('@/store/interactive-store');
const { useLearningMediaStore } = await import('@/store/learning-media-store');
// Sprint 8.2S-2-Patch-2: use the PRODUCTION configureModeOrchestrator API.
const { configureModeOrchestrator } = await import('@/store/canva/mode-orchestrator');

setCanvaStoreRef(useCanvaStore as any);

// ─────────────────────────────────────────────────────────────────
// jsdom polyfills — these DOM APIs are not implemented in jsdom
// but the components under test rely on them.
// ─────────────────────────────────────────────────────────────────

// ResizeObserver — used by PreviewMode/PresentMode for canvas scaling.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as any;
}

// requestFullscreen / exitFullscreen — used by PresentMode/PlayOverlay.
// Sprint 8.2B-Patch-1: fix typing — Element.requestFullscreen is correct,
// but exitFullscreen is on Document, not Element.
if (typeof Element !== 'undefined') {
  if (!Element.prototype.requestFullscreen) {
    Object.defineProperty(Element.prototype, 'requestFullscreen', {
      configurable: true,
      value: async function (): Promise<void> {},
    });
  }
}
if (typeof document !== 'undefined' && !document.exitFullscreen) {
  Object.defineProperty(document, 'exitFullscreen', {
    configurable: true,
    value: async function (): Promise<void> {},
  });
}
if (typeof document !== 'undefined' && !document.fullscreenElement) {
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => null,
  });
}

// Sprint 8.2S-2-Patch-4: localStorage mock moved to vi.hoisted() above
// (before store imports). The old inline mock is removed.

// ─────────────────────────────────────────────────────────────────
// Test fixtures
// ─────────────────────────────────────────────────────────────────

function makePage(id: string): CanvaPage {
  return {
    id,
    label: `Page ${id}`,
    bgDataUrl: null,
    bgColor: '#0f172a',
    overlay: 0,
    elements: [],
    templateType: 'materi',
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

function resetStores(): void {
  useCanvaStore.setState({
    appMode: 'edit',
    currentPageIndex: 0,
    pages: [makePage('p1'), makePage('p2'), makePage('p3')],
    selectedBlockId: null,
    selectedBlockIds: [],
    selectedBlockType: null,
    hoveredBlockId: null,
    editingBlockId: null,
    selectedElId: null,
    selectedElIds: [],
    panelRequest: null,
    ratioId: '16:9',
    displayMode: 'classroom',
  });
  useInteractiveStore.setState({
    mode: 'design',
    interactivePageIdx: 0,
    totalPages: 3,
    scores: [],
    replayGeneration: 0,
  });
  useLearningMediaStore.setState({ learnSubMode: 'play' });
  // Sprint 8.2S-2-Patch-2: use PRODUCTION configureModeOrchestrator.
  configureModeOrchestrator({
    interactive: useInteractiveStore.getState(),
    learning: useLearningMediaStore.getState(),
  });
}

// ─────────────────────────────────────────────────────────────────
// Listener spy helpers
// ─────────────────────────────────────────────────────────────────
//
// Sprint 8.2S-2-Patch-2 (P1-1): expanded coverage to include:
//   - window.addEventListener / removeEventListener
//   - document.addEventListener / removeEventListener
//   - setTimeout / clearTimeout (pending timers after unmount)
//   - setInterval / clearInterval (pending intervals after unmount)
//   - ResizeObserver.observe / disconnect
//   - document.fullscreenchange listeners
//
// Each spy tracks call counts so we can verify net delta = 0 after
// unmount. Timer spies also expose a list of pending timer IDs so we
// can verify no timers are left running.

interface ListenerSpy {
  addCalls: Array<{ type: string; listener: EventListenerOrEventListenerObject }>;
  removeCalls: Array<{ type: string; listener: EventListenerOrEventListenerObject }>;
  cleanup: () => void;
}

function spyWindowListeners(): ListenerSpy {
  const addCalls: Array<{ type: string; listener: EventListenerOrEventListenerObject }> = [];
  const removeCalls: Array<{ type: string; listener: EventListenerOrEventListenerObject }> = [];

  const origAdd = window.addEventListener.bind(window);
  const origRemove = window.removeEventListener.bind(window);

  window.addEventListener = vi.fn((type: string, listener: any, options?: any) => {
    addCalls.push({ type, listener });
    return origAdd(type, listener, options);
  }) as any;

  window.removeEventListener = vi.fn((type: string, listener: any, options?: any) => {
    removeCalls.push({ type, listener });
    return origRemove(type, listener, options);
  }) as any;

  return {
    addCalls,
    removeCalls,
    cleanup: () => {
      window.addEventListener = origAdd;
      window.removeEventListener = origRemove;
    },
  };
}

/**
 * Spy on document.addEventListener / removeEventListener.
 * Returns a separate spy object (not combined with window spy) so
 * tests can verify each independently.
 */
function spyDocumentListeners(): ListenerSpy {
  const addCalls: Array<{ type: string; listener: EventListenerOrEventListenerObject }> = [];
  const removeCalls: Array<{ type: string; listener: EventListenerOrEventListenerObject }> = [];

  const origAdd = document.addEventListener.bind(document);
  const origRemove = document.removeEventListener.bind(document);

  document.addEventListener = vi.fn((type: string, listener: any, options?: any) => {
    addCalls.push({ type, listener });
    return origAdd(type, listener, options);
  }) as any;

  document.removeEventListener = vi.fn((type: string, listener: any, options?: any) => {
    removeCalls.push({ type, listener });
    return origRemove(type, listener, options);
  }) as any;

  return {
    addCalls,
    removeCalls,
    cleanup: () => {
      document.addEventListener = origAdd;
      document.removeEventListener = origRemove;
    },
  };
}

interface TimerSpy {
  setTimeoutCalls: number;
  clearTimeoutCalls: number;
  setIntervalCalls: number;
  clearIntervalCalls: number;
  pendingTimers: Set<ReturnType<typeof setTimeout>>;
  pendingIntervals: Set<ReturnType<typeof setInterval>>;
  /** Sprint 8.2S-2-Patch-3: capture stack trace for each setTimeout call
   * to identify which code path created the timer. Useful for debugging
   * M-007 timer leak. */
  setTimeoutStacks: Map<ReturnType<typeof setTimeout>, string>;
  cleanup: () => void;
}

/**
 * Spy on setTimeout/clearTimeout/setInterval/clearInterval.
 * Tracks pending timers so tests can verify no timers are left
 * running after unmount.
 *
 * Sprint 8.2S-2-Patch-3: juga capture stack trace untuk setiap
 * setTimeout call supaya sumber timer leak bisa diidentifikasi.
 */
function spyTimers(): TimerSpy {
  const pendingTimers = new Set<ReturnType<typeof setTimeout>>();
  const pendingIntervals = new Set<ReturnType<typeof setInterval>>();
  const setTimeoutStacks = new Map<ReturnType<typeof setTimeout>, string>();
  let setTimeoutCalls = 0;
  let clearTimeoutCalls = 0;
  let setIntervalCalls = 0;
  let clearIntervalCalls = 0;

  const origSetTimeout = globalThis.setTimeout.bind(globalThis);
  const origClearTimeout = globalThis.clearTimeout.bind(globalThis);
  const origSetInterval = globalThis.setInterval.bind(globalThis);
  const origClearInterval = globalThis.clearInterval.bind(globalThis);

  globalThis.setTimeout = vi.fn((handler: any, timeout?: number, ...args: any[]) => {
    setTimeoutCalls++;
    // Capture stack to identify the caller (skip top 2 frames: this spy + vi.fn)
    const stack = new Error().stack ?? '';
    const id = origSetTimeout((...a: any[]) => {
      pendingTimers.delete(id);
      setTimeoutStacks.delete(id);
      handler(...a);
    }, timeout, ...args);
    pendingTimers.add(id);
    setTimeoutStacks.set(id, stack);
    return id;
  }) as any;

  globalThis.clearTimeout = vi.fn((id: any) => {
    clearTimeoutCalls++;
    pendingTimers.delete(id);
    setTimeoutStacks.delete(id);
    return origClearTimeout(id);
  }) as any;

  globalThis.setInterval = vi.fn((handler: any, timeout?: number, ...args: any[]) => {
    setIntervalCalls++;
    const id = origSetInterval(handler, timeout, ...args);
    pendingIntervals.add(id);
    return id;
  }) as any;

  globalThis.clearInterval = vi.fn((id: any) => {
    clearIntervalCalls++;
    pendingIntervals.delete(id);
    return origClearInterval(id);
  }) as any;

  return {
    get setTimeoutCalls() { return setTimeoutCalls; },
    get clearTimeoutCalls() { return clearTimeoutCalls; },
    get setIntervalCalls() { return setIntervalCalls; },
    get clearIntervalCalls() { return clearIntervalCalls; },
    pendingTimers,
    pendingIntervals,
    setTimeoutStacks,
    cleanup: () => {
      globalThis.setTimeout = origSetTimeout;
      globalThis.clearTimeout = origClearTimeout;
      globalThis.setInterval = origSetInterval;
      globalThis.clearInterval = origClearInterval;
      // Clear any stragglers
      for (const id of pendingTimers) origClearTimeout(id);
      for (const id of pendingIntervals) origClearInterval(id);
      pendingTimers.clear();
      pendingIntervals.clear();
      setTimeoutStacks.clear();
    },
  };
}

/**
 * Sprint 8.2S-2-Patch-3: dump timer stacks untuk debugging M-007.
 * Print stack trace untuk setiap pending setTimeout setelah unmount.
 * Berguna untuk identifikasi komponen/code path yang leak timer.
 */
function dumpPendingTimerStacks(timerSpy: TimerSpy, label: string): void {
  if (timerSpy.pendingTimers.size === 0) return;
  // eslint-disable-next-line no-console
  console.log(`\n=== Pending setTimeout stacks for ${label} (${timerSpy.pendingTimers.size} timers) ===`);
  for (const [id, stack] of timerSpy.setTimeoutStacks) {
    if (!timerSpy.pendingTimers.has(id)) continue;
    // eslint-disable-next-line no-console
    console.log(`\n--- Timer ${id} ---`);
    // Print first 10 lines of stack (skip the Error: line + this function)
    const lines = stack.split('\n').slice(2, 12);
    // eslint-disable-next-line no-console
    console.log(lines.join('\n'));
  }
}

interface ObserverSpy {
  observeCalls: number;
  disconnectCalls: number;
  unobserveCalls: number;
  cleanup: () => void;
}

/**
 * Spy on ResizeObserver.observe / disconnect / unobserve.
 * Replaces the global ResizeObserver with a tracked mock.
 */
function spyResizeObserver(): ObserverSpy {
  let observeCalls = 0;
  let disconnectCalls = 0;
  let unobserveCalls = 0;
  const OrigRO = globalThis.ResizeObserver;

  globalThis.ResizeObserver = class SpyResizeObserver {
    observe(): void { observeCalls++; }
    disconnect(): void { disconnectCalls++; }
    unobserve(): void { unobserveCalls++; }
  } as any;

  return {
    get observeCalls() { return observeCalls; },
    get disconnectCalls() { return disconnectCalls; },
    get unobserveCalls() { return unobserveCalls; },
    cleanup: () => {
      globalThis.ResizeObserver = OrigRO;
    },
  };
}

/**
 * Compute net listener delta: how many listeners of each type are
 * still registered after a render/unmount cycle. A clean component
 * should have net delta = 0 for every event type.
 */
function netListenerDelta(spy: ListenerSpy): Record<string, number> {
  const delta: Record<string, number> = {};
  for (const { type } of spy.addCalls) {
    delta[type] = (delta[type] ?? 0) + 1;
  }
  for (const { type } of spy.removeCalls) {
    delta[type] = (delta[type] ?? 0) - 1;
  }
  return delta;
}

// ═══════════════════════════════════════════════════════════════════
// LISTENER CLEANUP TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 8.2S-2-Patch — Listener Cleanup Integration (P1-A)', () => {
  beforeEach(() => {
    resetStores();
  });

  afterEach(() => {
    cleanup();
  });

  // ── PreviewMode ───────────────────────────────────────────────────
  describe('PreviewMode listener cleanup', () => {
    it('all window listeners removed after unmount (net delta = 0)', async () => {
      const PreviewMode = (await import('@/components/canva/PreviewMode')).default;
      const spy = spyWindowListeners();

      const { unmount } = render(
        React.createElement(PreviewMode, {
          page: makePage('preview-1'),
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      // Sanity: at least one listener registered (keydown for navigation)
      expect(spy.addCalls.length).toBeGreaterThan(0);

      unmount();

      const delta = netListenerDelta(spy);
      // Every event type should have net 0 (all cleaned up).
      for (const [type, count] of Object.entries(delta)) {
        expect(count, `window listener "${type}" not cleaned up`).toBe(0);
      }

      spy.cleanup();
    });

    it('rapid render/unmount (5x) does not accumulate listeners', async () => {
      const PreviewMode = (await import('@/components/canva/PreviewMode')).default;
      const spy = spyWindowListeners();

      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          React.createElement(PreviewMode, {
            page: makePage(`preview-${i}`),
            currentPageIndex: 0,
            totalPages: 1,
          }),
        );
        unmount();
      }

      const delta = netListenerDelta(spy);
      for (const [type, count] of Object.entries(delta)) {
        expect(count, `window listener "${type}" accumulated after 5x render/unmount`).toBe(0);
      }

      spy.cleanup();
    });
  });

  // ── PresentMode ───────────────────────────────────────────────────
  describe('PresentMode listener cleanup', () => {
    it('all window listeners removed after unmount (net delta = 0)', async () => {
      const PresentMode = (await import('@/components/canva/PresentMode')).default;
      const spy = spyWindowListeners();

      const { unmount } = render(
        React.createElement(PresentMode, {
          page: makePage('present-1'),
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      expect(spy.addCalls.length).toBeGreaterThan(0);

      unmount();

      const delta = netListenerDelta(spy);
      for (const [type, count] of Object.entries(delta)) {
        expect(count, `window listener "${type}" not cleaned up`).toBe(0);
      }

      spy.cleanup();
    });

    it('rapid render/unmount (5x) does not accumulate listeners', async () => {
      const PresentMode = (await import('@/components/canva/PresentMode')).default;
      const spy = spyWindowListeners();

      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          React.createElement(PresentMode, {
            page: makePage(`present-${i}`),
            currentPageIndex: 0,
            totalPages: 1,
          }),
        );
        unmount();
      }

      const delta = netListenerDelta(spy);
      for (const [type, count] of Object.entries(delta)) {
        expect(count, `window listener "${type}" accumulated after 5x render/unmount`).toBe(0);
      }

      spy.cleanup();
    });
  });

  // ── PlayOverlay ───────────────────────────────────────────────────
  describe('PlayOverlay listener cleanup', () => {
    it('all window listeners removed after unmount (net delta = 0)', async () => {
      const PlayOverlay = (await import('@/components/canva/PlayOverlay')).default;
      const spy = spyWindowListeners();

      // PlayOverlay expects to be in present mode
      useCanvaStore.setState({ appMode: 'present' });

      const { unmount } = render(
        React.createElement(PlayOverlay, {
          pages: [makePage('play-1'), makePage('play-2')],
          initialPageIndex: 0,
        }),
      );

      // PlayOverlay may or may not register listeners depending on
      // its props — but whatever it registers must be cleaned up.
      const addCount = spy.addCalls.length;

      unmount();

      const delta = netListenerDelta(spy);
      for (const [type, count] of Object.entries(delta)) {
        expect(count, `window listener "${type}" not cleaned up`).toBe(0);
      }

      // If no listeners were registered, that's also fine — the test
      // passes as long as whatever WAS registered was cleaned up.
      if (addCount === 0) {
        // eslint-disable-next-line no-console
        console.log('[PlayOverlay test] no window listeners registered — component may use document listeners instead');
      }

      spy.cleanup();
    });
  });

  // ── Single keypress → single action ───────────────────────────────
  describe('Single keypress produces single action', () => {
    it('PreviewMode: one ArrowRight keydown does not double-trigger navigation', async () => {
      const PreviewMode = (await import('@/components/canva/PreviewMode')).default;
      const pages = [makePage('p1'), makePage('p2'), makePage('p3')];
      useCanvaStore.setState({ pages, currentPageIndex: 0 });

      render(
        React.createElement(PreviewMode, {
          page: pages[0]!,
          currentPageIndex: 0,
          totalPages: 3,
        }),
      );

      // Dispatch ArrowRight
      fireEvent.keyDown(window, { key: 'ArrowRight' });

      // Page index should advance by exactly 1 (not 2 or more).
      // If listeners were double-registered, it would advance by 2+.
      expect(useCanvaStore.getState().currentPageIndex).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Sprint 8.2S-2-Patch-2 (P1-1): EXPANDED COVERAGE
  // ═══════════════════════════════════════════════════════════════════
  // Senior Review 8.2S-2-Patch P1-1: previous tests only monitored
  // window listeners. These expanded tests also verify:
  //   - document.addEventListener / removeEventListener
  //   - setTimeout / clearTimeout (no pending timers after unmount)
  //   - setInterval / clearInterval (no pending intervals after unmount)
  //   - ResizeObserver.observe / disconnect
  //   - LearningMediaShell lifecycle (was not tested before)
  // ═══════════════════════════════════════════════════════════════════

  describe('Sprint 8.2S-2-Patch-2 — Expanded cleanup coverage (P1-1)', () => {
    it('PreviewMode: document listeners cleaned up after unmount', async () => {
      const PreviewMode = (await import('@/components/canva/PreviewMode')).default;
      const docSpy = spyDocumentListeners();

      const { unmount } = render(
        React.createElement(PreviewMode, {
          page: makePage('preview-doc'),
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      const addCount = docSpy.addCalls.length;

      unmount();

      const delta = netListenerDelta(docSpy);
      for (const [type, count] of Object.entries(delta)) {
        expect(count, `document listener "${type}" not cleaned up`).toBe(0);
      }

      // eslint-disable-next-line no-console
      console.log(`[PreviewMode document listeners] registered=${addCount}, all cleaned up`);

      docSpy.cleanup();
    });

    it('PreviewMode: no pending setTimeout timers after unmount (M-007 FIXED)', async () => {
      // Sprint 8.2S-2-Patch-3: M-007 fixed by using synchronous storage
      // in interactive-store's persist middleware (no zustand debounce
      // setTimeout). Verify zero pending timers after unmount.
      const PreviewMode = (await import('@/components/canva/PreviewMode')).default;
      const timerSpy = spyTimers();

      const { unmount } = render(
        React.createElement(PreviewMode, {
          page: makePage('preview-timer'),
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      unmount();

      // M-007 FIXED: zero pending timers after unmount.
      // If still leaking, dump stacks for debugging.
      if (timerSpy.pendingTimers.size > 0) {
        dumpPendingTimerStacks(timerSpy, 'PreviewMode');
      }
      expect(
        timerSpy.pendingTimers.size,
        `${timerSpy.pendingTimers.size} pending setTimeout timers after unmount`,
      ).toBe(0);
      expect(
        timerSpy.pendingIntervals.size,
        `${timerSpy.pendingIntervals.size} pending setInterval intervals after unmount`,
      ).toBe(0);

      timerSpy.cleanup();
    });

    it('PreviewMode: ResizeObserver.disconnect called on unmount', async () => {
      const PreviewMode = (await import('@/components/canva/PreviewMode')).default;
      const roSpy = spyResizeObserver();

      const { unmount } = render(
        React.createElement(PreviewMode, {
          page: makePage('preview-ro'),
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      const observeCount = roSpy.observeCalls;

      unmount();

      if (observeCount > 0) {
        expect(
          roSpy.disconnectCalls,
          `ResizeObserver.observe called ${observeCount}x but disconnect not called on unmount`,
        ).toBeGreaterThanOrEqual(1);
      }

      roSpy.cleanup();
    });

    it('PresentMode: document listeners cleaned up after unmount', async () => {
      const PresentMode = (await import('@/components/canva/PresentMode')).default;
      const docSpy = spyDocumentListeners();

      const { unmount } = render(
        React.createElement(PresentMode, {
          page: makePage('present-doc'),
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      unmount();

      const delta = netListenerDelta(docSpy);
      for (const [type, count] of Object.entries(delta)) {
        expect(count, `document listener "${type}" not cleaned up`).toBe(0);
      }

      docSpy.cleanup();
    });

    it('PresentMode: no pending timers after unmount (M-007 FIXED)', async () => {
      const PresentMode = (await import('@/components/canva/PresentMode')).default;
      const timerSpy = spyTimers();

      const { unmount } = render(
        React.createElement(PresentMode, {
          page: makePage('present-timer'),
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      unmount();

      // M-007 FIXED: zero pending timers after unmount.
      expect(timerSpy.pendingTimers.size, 'pending setTimeout timers after unmount').toBe(0);
      expect(timerSpy.pendingIntervals.size, 'pending setInterval intervals after unmount').toBe(0);

      timerSpy.cleanup();
    });

    it('PresentMode: ResizeObserver.disconnect called on unmount', async () => {
      const PresentMode = (await import('@/components/canva/PresentMode')).default;
      const roSpy = spyResizeObserver();

      const { unmount } = render(
        React.createElement(PresentMode, {
          page: makePage('present-ro'),
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      const observeCount = roSpy.observeCalls;

      unmount();

      if (observeCount > 0) {
        expect(
          roSpy.disconnectCalls,
          `ResizeObserver.observe called ${observeCount}x but disconnect not called`,
        ).toBeGreaterThanOrEqual(1);
      }

      roSpy.cleanup();
    });

    it('LearningMediaShell: window listeners cleaned up after unmount', async () => {
      const LearningMediaShell = (await import('@/components/canva/LearningMediaShell')).default;
      const winSpy = spyWindowListeners();

      useCanvaStore.setState({
        appMode: 'learn',
        pages: [makePage('lms-1'), makePage('lms-2')],
        currentPageIndex: 0,
      });

      const { unmount } = render(
        React.createElement(LearningMediaShell),
      );

      const addCount = winSpy.addCalls.length;

      unmount();

      const delta = netListenerDelta(winSpy);
      for (const [type, count] of Object.entries(delta)) {
        expect(count, `window listener "${type}" not cleaned up`).toBe(0);
      }

      // eslint-disable-next-line no-console
      console.log(`[LearningMediaShell window listeners] registered=${addCount}, all cleaned up`);

      winSpy.cleanup();
    });

    it('LearningMediaShell: document listeners cleaned up after unmount', async () => {
      const LearningMediaShell = (await import('@/components/canva/LearningMediaShell')).default;
      const docSpy = spyDocumentListeners();

      useCanvaStore.setState({
        appMode: 'learn',
        pages: [makePage('lms-doc-1'), makePage('lms-doc-2')],
        currentPageIndex: 0,
      });

      const { unmount } = render(
        React.createElement(LearningMediaShell),
      );

      unmount();

      const delta = netListenerDelta(docSpy);
      for (const [type, count] of Object.entries(delta)) {
        expect(count, `document listener "${type}" not cleaned up`).toBe(0);
      }

      docSpy.cleanup();
    });

    it('LearningMediaShell: no pending timers after unmount (M-007 FIXED)', async () => {
      const LearningMediaShell = (await import('@/components/canva/LearningMediaShell')).default;
      const timerSpy = spyTimers();

      useCanvaStore.setState({
        appMode: 'learn',
        pages: [makePage('lms-timer-1'), makePage('lms-timer-2')],
        currentPageIndex: 0,
      });

      const { unmount } = render(
        React.createElement(LearningMediaShell),
      );

      unmount();

      // M-007 FIXED: zero pending timers after unmount.
      expect(timerSpy.pendingTimers.size, 'pending setTimeout timers after unmount').toBe(0);
      expect(timerSpy.pendingIntervals.size, 'pending setInterval intervals after unmount').toBe(0);

      timerSpy.cleanup();
    });

    it('PlayOverlay: no pending timers after unmount', async () => {
      const PlayOverlay = (await import('@/components/canva/PlayOverlay')).default;
      const timerSpy = spyTimers();

      useCanvaStore.setState({ appMode: 'present' });

      const { unmount } = render(
        React.createElement(PlayOverlay, {
          pages: [makePage('play-timer-1'), makePage('play-timer-2')],
          initialPageIndex: 0,
        }),
      );

      unmount();

      expect(timerSpy.pendingTimers.size, 'pending setTimeout timers after unmount').toBe(0);
      expect(timerSpy.pendingIntervals.size, 'pending setInterval intervals after unmount').toBe(0);

      timerSpy.cleanup();
    });

    it('PlayOverlay: document listeners cleaned up after unmount', async () => {
      const PlayOverlay = (await import('@/components/canva/PlayOverlay')).default;
      const docSpy = spyDocumentListeners();

      useCanvaStore.setState({ appMode: 'present' });

      const { unmount } = render(
        React.createElement(PlayOverlay, {
          pages: [makePage('play-doc-1'), makePage('play-doc-2')],
          initialPageIndex: 0,
        }),
      );

      unmount();

      const delta = netListenerDelta(docSpy);
      for (const [type, count] of Object.entries(delta)) {
        expect(count, `document listener "${type}" not cleaned up`).toBe(0);
      }

      docSpy.cleanup();
    });

    it('fullscreenchange listeners registered on document, cleaned up on unmount (PreviewMode)', async () => {
      const PreviewMode = (await import('@/components/canva/PreviewMode')).default;
      const docSpy = spyDocumentListeners();

      const { unmount } = render(
        React.createElement(PreviewMode, {
          page: makePage('preview-fs'),
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      const fsAdds = docSpy.addCalls.filter(c => c.type === 'fullscreenchange').length;
      expect(fsAdds, 'fullscreenchange listener not registered').toBeGreaterThan(0);

      unmount();

      const fsRemoves = docSpy.removeCalls.filter(c => c.type === 'fullscreenchange').length;
      expect(fsRemoves, 'fullscreenchange listener not removed').toBe(fsAdds);

      docSpy.cleanup();
    });

    it('rapid render/unmount (5x) does not accumulate pending timers (M-007 FIXED)', async () => {
      // M-007 FIXED: zero pending timers after 5x render/unmount.
      const PreviewMode = (await import('@/components/canva/PreviewMode')).default;
      const timerSpy = spyTimers();

      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          React.createElement(PreviewMode, {
            page: makePage(`rapid-${i}`),
            currentPageIndex: 0,
            totalPages: 1,
          }),
        );
        unmount();
      }

      // M-007 FIXED: zero pending timers after 5x rapid render/unmount.
      expect(timerSpy.pendingTimers.size, 'pending timers after 5x render/unmount').toBe(0);
      expect(timerSpy.pendingIntervals.size, 'pending intervals after 5x render/unmount').toBe(0);

      timerSpy.cleanup();
    });
  });

});
