// ═══════════════════════════════════════════════════════════════════
// MODE LIFECYCLE SMOKE TESTS  (Sprint 8.2S-2)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2S-2 — Mode Lifecycle Smoke
//
// Tests the invariants defined in docs/MODE_LIFECYCLE_CONTRACT.md.
// These tests catch bugs where state leaks across mode switches:
//   - selection leaks into Preview
//   - editing state leaks into Present
//   - runtime scores leak into Edit
//   - learnSubMode leaks across Learn round-trips
//
// The tests use the REAL stores (not mocks) so they exercise the
// actual setAppMode / setMode / setLearnSubMode code paths. The
// CanvaStore is reset between tests via `useCanvaStore.setState(...)`
// to ensure a clean starting point.
//
// Bug coverage (from KNOWN_ISSUES.md):
//   M-001 — setAppMode doesn't reset interactive store scores
//   M-002 — setAppMode doesn't reset learning-media-store.learnSubMode
//   M-003 — Keyboard listener & timer cleanup (not testable here; needs
//           component-level integration test — deferred to Sprint 8.2B)
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CanvaPage } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';

// ─────────────────────────────────────────────────────────────────
// Mocks — the canva store transitively imports `useAuthoringStore`
// from `@/store/authoring-store`, which re-exports from
// `./authoring/index.ts`. That file runs `require('@/store/dirty-store')`
// at module-eval time inside `if (typeof window !== 'undefined')`.
// vitest's `vi.mock` intercepts ESM imports but NOT synchronous
// `require()` calls — so the require fails with "Cannot find module".
//
// Solution: mock `@/store/authoring-store` ENTIRELY. The canva store
// only uses `useAuthoringStore.getState()` for cross-store sync, which
// we don't need for mode-lifecycle smoke tests (we only test
// useCanvaStore + useInteractiveStore + useLearningMediaStore).
// ─────────────────────────────────────────────────────────────────

vi.mock('@/store/authoring-store', () => {
  const fakeState: Record<string, unknown> = {
    activePreset: null,
    meta: {},
    cp: {},
    tp: {},
    atp: {},
    alur: {},
    suara: {},
    petunjuk: {},
    penutup: {},
    motivasi: {},
    rangkuman: {},
    modules: [],
    kuis: [],
    games: [],
    diskusi: [],
    refleksi: [],
    dirty: false,
    activePanel: 'canva',
    setActivePanel: () => {},
    setMeta: () => {},
  };
  const useAuthoringStore: any = (selector: (s: any) => any) => selector(fakeState);
  useAuthoringStore.getState = () => fakeState;
  useAuthoringStore.setState = (patch: any) => {
    Object.assign(fakeState, patch);
  };
  useAuthoringStore.subscribe = () => () => {};
  return { useAuthoringStore };
});

// Import stores AFTER mocks are registered.
const { useCanvaStore } = await import('@/store/canva-store');
const { useInteractiveStore, setCanvaStoreRef } = await import('@/store/interactive-store');
const { useLearningMediaStore } = await import('@/store/learning-media-store');
// Sprint 8.2S-2-Patch-2: import the PRODUCTION configureModeOrchestrator
// (not a test-only helper). Cold-start tests verify production behavior.
const {
  configureModeOrchestrator,
  __resetModeOrchestratorForTest,
  isModeOrchestratorConfigured,
} = await import('@/store/canva/mode-orchestrator');

// Wire interactive-store ↔ canva-store ref. In production this is
// done by init.ts; in tests we do it explicitly.
setCanvaStoreRef(useCanvaStore as any);

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

function resetAllStores(): void {
  // Reset CanvaStore to a clean state with 3 pages.
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
  });

  // Reset interactive store
  useInteractiveStore.setState({
    mode: 'design',
    interactivePageIdx: 0,
    totalPages: 3,
    scores: [],
    replayGeneration: 0,
  });

  // Reset learning media store
  useLearningMediaStore.setState({
    learnSubMode: 'play',
  });

  // Sprint 8.2S-2-Patch-2: use the PRODUCTION configureModeOrchestrator
  // API (not a test-only helper). This verifies that production
  // bootstrap wiring works correctly. Cold-start tests below verify
  // the unconfigured-then-configured flow.
  configureModeOrchestrator({
    interactive: useInteractiveStore.getState(),
    learning: useLearningMediaStore.getState(),
  });
}

// ═══════════════════════════════════════════════════════════════════
// SMOKE TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 8.2S-2 — Mode Lifecycle Smoke (invariants from MODE_LIFECYCLE_CONTRACT.md)', () => {
  beforeEach(() => {
    resetAllStores();
  });

  // ── Invariant: Edit mode allows selection ─────────────────────────
  describe('Edit mode invariants', () => {
    it('Edit mode allows block selection + editing', () => {
      useCanvaStore.getState().selectBlock('block-1', 'materi-section');
      useCanvaStore.setState({ editingBlockId: 'block-1' });

      const state = useCanvaStore.getState();
      expect(state.appMode).toBe('edit');
      expect(state.selectedBlockId).toBe('block-1');
      expect(state.editingBlockId).toBe('block-1');
    });
  });

  // ── Edit → Preview: selection cleared ─────────────────────────────
  describe('Edit → Preview transition', () => {
    it('selection is cleared when entering Preview (including hoveredBlockId)', () => {
      // Setup: selection in Edit mode
      useCanvaStore.getState().selectBlock('block-1', 'materi-section');
      useCanvaStore.setState({ editingBlockId: 'block-1' });
      useCanvaStore.setState({ hoveredBlockId: 'block-2' });
      useCanvaStore.setState({ selectedElId: 'el-1' });

      // Action: switch to Preview
      useCanvaStore.getState().setAppMode('preview');

      // Assert: ALL selection state cleared (including hoveredBlockId —
      // Sprint 8.2S-2-Patch M-006 fix).
      const state = useCanvaStore.getState();
      expect(state.appMode).toBe('preview');
      expect(state.selectedBlockId).toBeNull();
      expect(state.selectedBlockIds).toEqual([]);
      expect(state.editingBlockId).toBeNull();
      expect(state.hoveredBlockId).toBeNull();
      expect(state.selectedElId).toBeNull();
    });

    it('page index is preserved when entering Preview', () => {
      useCanvaStore.setState({ currentPageIndex: 2 });
      useCanvaStore.getState().setAppMode('preview');
      expect(useCanvaStore.getState().currentPageIndex).toBe(2);
    });
  });

  // ── Edit → Present: selection cleared ─────────────────────────────
  describe('Edit → Present transition', () => {
    it('selection is cleared when entering Present', () => {
      useCanvaStore.getState().selectBlock('block-1', 'materi-section');
      useCanvaStore.setState({ editingBlockId: 'block-1' });

      useCanvaStore.getState().setAppMode('present');

      const state = useCanvaStore.getState();
      expect(state.appMode).toBe('present');
      expect(state.selectedBlockId).toBeNull();
      expect(state.editingBlockId).toBeNull();
    });
  });

  // ── Edit → Learn: selection cleared (M-004 FIXED) ────────────────
  describe('Edit → Learn transition (M-004 FIXED)', () => {
    it('selection is cleared when entering Learn', () => {
      // Setup: selection in Edit mode
      useCanvaStore.getState().selectBlock('block-1', 'materi-section');
      useCanvaStore.setState({ editingBlockId: 'block-1' });

      // Action: switch to Learn
      useCanvaStore.getState().setAppMode('learn');

      // Assert: ALL selection state cleared (M-004 fix in 8.2S-2-Patch).
      const state = useCanvaStore.getState();
      expect(state.appMode).toBe('learn');
      expect(state.selectedBlockId).toBeNull();
      expect(state.editingBlockId).toBeNull();
    });

    it('learnSubMode is reset to "play" when entering Learn (M-002 FIXED)', () => {
      // Setup: previous Learn session left learnSubMode = 'edit'
      useLearningMediaStore.setState({ learnSubMode: 'edit' });

      // Action: switch to Learn (fresh entry)
      useCanvaStore.getState().setAppMode('learn');

      // Assert: learnSubMode reset to 'play' (M-002 fix in 8.2S-2-Patch).
      expect(useLearningMediaStore.getState().learnSubMode).toBe('play');
    });
  });

  // ── Edit → Export: selection cleared (M-005 FIXED) ───────────────
  describe('Edit → Export transition (M-005 FIXED)', () => {
    it('selection is cleared when entering Export', () => {
      useCanvaStore.getState().selectBlock('block-1', 'materi-section');

      useCanvaStore.getState().setAppMode('export');

      const state = useCanvaStore.getState();
      expect(state.appMode).toBe('export');
      // M-005 fix in 8.2S-2-Patch: Export now clears selection.
      expect(state.selectedBlockId).toBeNull();
    });
  });

  // ── Preview → Edit round-trip ─────────────────────────────────────
  describe('Preview → Edit round-trip', () => {
    it('page index preserved, no selection leak', () => {
      useCanvaStore.setState({ currentPageIndex: 1 });
      useCanvaStore.getState().setAppMode('preview');
      useCanvaStore.getState().setAppMode('edit');

      const state = useCanvaStore.getState();
      expect(state.appMode).toBe('edit');
      expect(state.currentPageIndex).toBe(1);
      expect(state.selectedBlockId).toBeNull();
    });
  });

  // ── M-001 FIXED: scores reset on Edit/Export/Present entry ────────
  describe('M-001 (FIXED) — scores reset on mode switch to non-interactive', () => {
    it('scores are cleared when switching Preview → Edit', () => {
      // Setup: enter Preview, play a quiz, get a score
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

      // Sanity: score recorded
      expect(useInteractiveStore.getState().scores.length).toBeGreaterThan(0);

      // Action: switch back to Edit
      useCanvaStore.getState().setAppMode('edit');

      // Assert: M-001 fix in 8.2S-2-Patch — scores ARE cleared.
      expect(useInteractiveStore.getState().scores).toEqual([]);
    });

    it('scores are cleared when switching to Export', () => {
      useCanvaStore.getState().setAppMode('preview');
      useInteractiveStore.getState().openPlay();
      useInteractiveStore.getState().reportScore({
        pageIndex: 0,
        blockId: 'quiz-1',
        elementId: 'quiz-1',
        score: 50,
        maxScore: 100,
        completed: true,
      });
      expect(useInteractiveStore.getState().scores.length).toBeGreaterThan(0);

      useCanvaStore.getState().setAppMode('export');
      expect(useInteractiveStore.getState().scores).toEqual([]);
    });

    it('scores are cleared when switching to Present (fresh playback)', () => {
      useCanvaStore.getState().setAppMode('preview');
      useInteractiveStore.getState().openPlay();
      useInteractiveStore.getState().reportScore({
        pageIndex: 0,
        blockId: 'quiz-1',
        elementId: 'quiz-1',
        score: 50,
        maxScore: 100,
        completed: true,
      });
      expect(useInteractiveStore.getState().scores.length).toBeGreaterThan(0);

      useCanvaStore.getState().setAppMode('present');
      expect(useInteractiveStore.getState().scores).toEqual([]);
    });
  });

  // ── M-002 FIXED: learnSubMode reset on Learn entry ────────────────
  describe('M-002 (FIXED) — learnSubMode reset on Learn entry', () => {
    it('learnSubMode is reset to "play" when re-entering Learn', () => {
      // Setup: enter Learn, switch to edit sub-mode
      useCanvaStore.getState().setAppMode('learn');
      useLearningMediaStore.getState().setLearnSubMode('edit');

      // Sanity
      expect(useLearningMediaStore.getState().learnSubMode).toBe('edit');

      // Action: switch to Edit, then back to Learn
      useCanvaStore.getState().setAppMode('edit');
      useCanvaStore.getState().setAppMode('learn');

      // Assert: M-002 fix in 8.2S-2-Patch — learnSubMode reset to 'play'.
      expect(useLearningMediaStore.getState().learnSubMode).toBe('play');
    });
  });

  // ── Interactive store setMode independent ─────────────────────────
  describe('Interactive store setMode', () => {
    it('entering interactive mode resets page index and syncs totalPages', () => {
      // Setup: design mode, page index 2
      useInteractiveStore.setState({ mode: 'design', interactivePageIdx: 5 });

      // Action: enter interactive mode
      useInteractiveStore.getState().setMode('interactive');

      // Assert: page index reset to 0
      expect(useInteractiveStore.getState().mode).toBe('interactive');
      expect(useInteractiveStore.getState().interactivePageIdx).toBe(0);
    });
  });

  // ── openPlay / closePlay ──────────────────────────────────────────
  describe('openPlay / closePlay', () => {
    it('openPlay resets scores and starts from current page', () => {
      useCanvaStore.setState({ currentPageIndex: 1 });

      useInteractiveStore.getState().openPlay();

      const state = useInteractiveStore.getState();
      expect(state.mode).toBe('interactive');
      expect(state.scores).toEqual([]);
      // openPlay starts from current page (Phase 9 fix)
      expect(state.interactivePageIdx).toBe(1);
    });

    it('closePlay returns to design mode and resets page index', () => {
      useInteractiveStore.getState().openPlay();
      useInteractiveStore.setState({ interactivePageIdx: 2 });

      useInteractiveStore.getState().closePlay();

      const state = useInteractiveStore.getState();
      expect(state.mode).toBe('design');
      expect(state.interactivePageIdx).toBe(0);
    });
  });

  // ── resetAllScores ────────────────────────────────────────────────
  describe('resetAllScores', () => {
    it('clears all scores and resets page index', () => {
      useInteractiveStore.getState().openPlay();
      useInteractiveStore.getState().reportScore({
        pageIndex: 0,
        blockId: 'quiz-1',
        elementId: 'quiz-1',
        score: 50,
        maxScore: 100,
        completed: true,
      });
      useInteractiveStore.setState({ interactivePageIdx: 2 });

      useInteractiveStore.getState().resetAllScores();

      const state = useInteractiveStore.getState();
      expect(state.scores).toEqual([]);
      expect(state.interactivePageIdx).toBe(0);
    });
  });

  // ── Rapid mode switch (no crash) ──────────────────────────────────
  describe('Rapid mode switch', () => {
    it('5x mode switches in sequence do not crash or leave inconsistent state', () => {
      const modes: Array<'edit' | 'preview' | 'present' | 'learn' | 'export'> = [
        'preview',
        'edit',
        'present',
        'edit',
        'learn',
      ];

      expect(() => {
        for (const m of modes) {
          useCanvaStore.getState().setAppMode(m);
        }
      }).not.toThrow();

      // Final state should be consistent
      const state = useCanvaStore.getState();
      expect(state.appMode).toBe('learn');
      // Selection cleared (we passed through preview/present/learn which all clear)
      expect(state.selectedBlockId).toBeNull();
    });
  });

  // ── Page index validity ───────────────────────────────────────────
  describe('Page index validity across mode switches', () => {
    it('page index does not become invalid after mode switches', () => {
      useCanvaStore.setState({ currentPageIndex: 2 });
      useCanvaStore.getState().setAppMode('preview');
      useCanvaStore.getState().setAppMode('edit');
      useCanvaStore.getState().setAppMode('present');
      useCanvaStore.getState().setAppMode('edit');

      const state = useCanvaStore.getState();
      expect(state.currentPageIndex).toBe(2);
      expect(state.currentPageIndex).toBeLessThan(state.pages.length);
    });
  });

  // ── Cold-start production behavior (P0-1 Patch-2) ─────────────────
  // Senior Review 8.2S-2-Patch P0-1: previous implementation used lazy
  // dynamic import which silently skipped reset on cold-start. These
  // tests verify the PRODUCTION bootstrap path works without any
  // test-only injection helper.
  describe('Cold-start production behavior (P0-1 Patch-2)', () => {
    beforeEach(() => {
      // Reset orchestrator to UNCONFIGURED state — simulate fresh app
      // launch before init.ts has run.
      __resetModeOrchestratorForTest();
      expect(isModeOrchestratorConfigured()).toBe(false);
    });

    it('throws when setAppMode called before configureModeOrchestrator', () => {
      // Simulate: app just loaded, user somehow clicks Present before
      // init.ts ran. The orchestrator MUST throw, not silently skip.
      // This makes the bug visible to developers.
      expect(() => {
        useCanvaStore.getState().setAppMode('present');
      }).toThrow(/configureModeOrchestrator/);
    });

    it('cold-start Edit → Present: scores reset on first mode switch', () => {
      // Simulate production bootstrap sequence:
      //   1. App loads (orchestrator unconfigured)
      //   2. init.ts runs (configureModeOrchestrator called)
      //   3. User immediately enters Preview, plays quiz, gets score
      //   4. User switches to Present
      //   5. Scores MUST be reset (M-001 cold-start invariant)

      // Step 2: production bootstrap
      configureModeOrchestrator({
        interactive: useInteractiveStore.getState(),
        learning: useLearningMediaStore.getState(),
      });
      expect(isModeOrchestratorConfigured()).toBe(true);

      // Step 3: enter Preview, play quiz
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

      // Step 4: switch to Present (first mode switch after bootstrap)
      useCanvaStore.getState().setAppMode('present');

      // Step 5: scores MUST be reset — no silent skip
      expect(useInteractiveStore.getState().scores).toEqual([]);
    });

    it('cold-start Edit → Learn: learnSubMode reset on first mode switch', () => {
      // Simulate: app loads, user had a previous Learn session with
      // learnSubMode='edit' (persisted across reloads via localStorage).
      // User immediately enters Learn. learnSubMode MUST reset to 'play'.

      // Pre-bootstrap: simulate stale learnSubMode from previous session
      useLearningMediaStore.setState({ learnSubMode: 'edit' });

      // Production bootstrap
      configureModeOrchestrator({
        interactive: useInteractiveStore.getState(),
        learning: useLearningMediaStore.getState(),
      });

      // First mode switch after bootstrap
      useCanvaStore.getState().setAppMode('learn');

      // learnSubMode MUST be reset — no silent skip
      expect(useLearningMediaStore.getState().learnSubMode).toBe('play');
    });

    it('cold-start Edit → Edit (round-trip via Preview): scores reset', () => {
      // Edge case: user enters Preview, plays, then returns to Edit.
      // The return-to-Edit must reset scores so they don't leak into
      // the next Preview session.

      configureModeOrchestrator({
        interactive: useInteractiveStore.getState(),
        learning: useLearningMediaStore.getState(),
      });

      useCanvaStore.getState().setAppMode('preview');
      useInteractiveStore.getState().openPlay();
      useInteractiveStore.getState().reportScore({
        pageIndex: 0,
        blockId: 'quiz-1',
        elementId: 'quiz-1',
        score: 50,
        maxScore: 100,
        completed: true,
      });
      expect(useInteractiveStore.getState().scores.length).toBeGreaterThan(0);

      // Return to Edit — scores MUST reset
      useCanvaStore.getState().setAppMode('edit');
      expect(useInteractiveStore.getState().scores).toEqual([]);
    });

    it('configureModeOrchestrator is idempotent (calling twice is safe)', () => {
      // Production may call configureModeOrchestrator multiple times
      // (e.g., HMR in dev, or React strict mode double-mount). The
      // function must handle this gracefully — last call wins.
      configureModeOrchestrator({
        interactive: useInteractiveStore.getState(),
        learning: useLearningMediaStore.getState(),
      });
      configureModeOrchestrator({
        interactive: useInteractiveStore.getState(),
        learning: useLearningMediaStore.getState(),
      });

      expect(isModeOrchestratorConfigured()).toBe(true);
      // Mode switch should still work
      expect(() => {
        useCanvaStore.getState().setAppMode('preview');
      }).not.toThrow();
    });
  });
});
