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
    it('selection is cleared when entering Preview', () => {
      // Setup: selection in Edit mode
      useCanvaStore.getState().selectBlock('block-1', 'materi-section');
      useCanvaStore.setState({ editingBlockId: 'block-1' });
      useCanvaStore.setState({ hoveredBlockId: 'block-2' });
      useCanvaStore.setState({ selectedElId: 'el-1' });

      // Action: switch to Preview
      useCanvaStore.getState().setAppMode('preview');

      // Assert: most selection state cleared
      // (NOTE: hoveredBlockId is NOT cleared by clearAllSelections —
      // see KNOWN_ISSUES.md M-006. That's a separate minor bug.)
      const state = useCanvaStore.getState();
      expect(state.appMode).toBe('preview');
      expect(state.selectedBlockId).toBeNull();
      expect(state.selectedBlockIds).toEqual([]);
      expect(state.editingBlockId).toBeNull();
      expect(state.selectedElId).toBeNull();
      // hoveredBlockId is NOT cleared (bug M-006)
      // expect(state.hoveredBlockId).toBeNull(); // uncomment when M-006 fixed
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

  // ── Edit → Learn: selection NOT cleared (BUG M-004) ───────────────
  describe('Edit → Learn transition (BUG M-004)', () => {
    it('documents current behavior: selection LEAKS into Learn (should be cleared)', () => {
      // Setup: selection in Edit mode
      useCanvaStore.getState().selectBlock('block-1', 'materi-section');
      useCanvaStore.setState({ editingBlockId: 'block-1' });

      // Action: switch to Learn
      useCanvaStore.getState().setAppMode('learn');

      const state = useCanvaStore.getState();
      expect(state.appMode).toBe('learn');
      // BUG M-004: setAppMode('learn') does NOT clearAllSelections.
      // The current implementation only clears for preview/present.
      // This is a known issue — see KNOWN_ISSUES.md M-004.
      //
      // WHEN M-004 IS FIXED, this assertion should flip to:
      //   expect(state.selectedBlockId).toBeNull();
      //   expect(state.editingBlockId).toBeNull();
      expect(state.selectedBlockId).toBe('block-1');
      expect(state.editingBlockId).toBe('block-1');
    });
  });

  // ── Edit → Export: selection NOT cleared (BUG M-005) ──────────────
  describe('Edit → Export transition (BUG M-005)', () => {
    it('documents current behavior: selection LEAKS into Export (should be cleared)', () => {
      useCanvaStore.getState().selectBlock('block-1', 'materi-section');

      useCanvaStore.getState().setAppMode('export');

      const state = useCanvaStore.getState();
      expect(state.appMode).toBe('export');
      // BUG M-005: setAppMode('export') does NOT clearAllSelections.
      // The current implementation only clears for preview/present.
      // This is a known issue — see KNOWN_ISSUES.md M-005.
      //
      // WHEN M-005 IS FIXED, this assertion should flip to:
      //   expect(state.selectedBlockId).toBeNull();
      expect(state.selectedBlockId).toBe('block-1');
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

  // ── Bug M-001: setAppMode doesn't reset interactive scores ────────
  // This test documents the KNOWN BUG. When M-001 is fixed, this test
  // will need to assert that scores ARE reset. For now, it asserts the
  // current (buggy) behavior so we know if anything changes.
  describe('M-001 (KNOWN BUG) — score leak across mode switch', () => {
    it('documents current behavior: scores leak from Preview to Edit', () => {
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

      // Assert (CURRENT BUGGY BEHAVIOR — to be fixed):
      // Scores are NOT cleared. This is M-001.
      //
      // WHEN M-001 IS FIXED, this assertion should flip to:
      //   expect(useInteractiveStore.getState().scores).toEqual([])
      expect(useInteractiveStore.getState().scores.length).toBeGreaterThan(0);

      // Document the bug for the fix in Sprint 8.2S-2 (or later):
      // setAppMode should call useInteractiveStore.getState().resetAllScores()
      // when switching to a non-interactive mode (edit/export).
    });
  });

  // ── Bug M-002: setAppMode doesn't reset learnSubMode ──────────────
  describe('M-002 (KNOWN BUG) — learnSubMode leak across mode switch', () => {
    it('documents current behavior: learnSubMode leaks from Learn to Edit', () => {
      // Setup: enter Learn, switch to edit sub-mode
      useCanvaStore.getState().setAppMode('learn');
      useLearningMediaStore.getState().setLearnSubMode('edit');

      // Sanity
      expect(useLearningMediaStore.getState().learnSubMode).toBe('edit');

      // Action: switch to Edit, then back to Learn
      useCanvaStore.getState().setAppMode('edit');
      useCanvaStore.getState().setAppMode('learn');

      // Assert (CURRENT BUGGY BEHAVIOR — to be fixed):
      // learnSubMode is NOT reset to 'play' on re-entry to Learn.
      //
      // WHEN M-002 IS FIXED, this assertion should flip to:
      //   expect(useLearningMediaStore.getState().learnSubMode).toBe('play')
      expect(useLearningMediaStore.getState().learnSubMode).toBe('edit');

      // Document the bug for the fix:
      // setAppMode('learn') should reset learnSubMode to 'play' unless
      // the user has explicitly set it during this Learn session.
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

  // ── Documented deferrals (M-003) ──────────────────────────────────
  describe('M-003 (DEFERRED) — keyboard listener cleanup', () => {
    it('documents that listener cleanup audit is deferred to Sprint 8.2B', () => {
      // This test exists to document that M-003 (keyboard listener
      // cleanup audit) is NOT covered by smoke tests. It requires
      // component-level integration tests that mount/unmount
      // PreviewMode/PresentMode/LearningMediaShell and verify
      // removeEventListener is called.
      //
      // See:
      //   - KNOWN_ISSUES.md M-003
      //   - docs/MODE_LIFECYCLE_CONTRACT.md "Bug Diketahui M-003"
      //
      // Target: Sprint 8.2B (Present wiring) — when we touch
      // PresentMode, audit all useEffect cleanup functions.
      expect(true).toBe(true); // placeholder — see deferred note
    });
  });
});
