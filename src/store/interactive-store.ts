// ═══════════════════════════════════════════════════════════════
// INTERACTIVE STORE — Runtime state for Interactive Mode
// Tracks mode toggle, navigation, scores across pages
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import { logger } from '@/core/utils/logger';

// ── Score Entry ────────────────────────────────────────────────

export interface ScoreEntry {
  elementId: string;
  pageIndex: number;
  score: number;
  maxScore: number;
  completed: boolean;
}

// ── Store Interface ────────────────────────────────────────────

export interface InteractiveState {
  // ── Mode ───────────────────────────────────────────────────
  mode: 'design' | 'interactive';
  setMode: (mode: 'design' | 'interactive') => void;
  toggleMode: () => void;
  openPlay: () => void;
  closePlay: () => void;

  // ── Navigation ─────────────────────────────────────────────
  interactivePageIdx: number;
  goInteractivePage: (idx: number) => void;
  nextInteractivePage: () => void;
  prevInteractivePage: () => void;
  totalPages: number;
  setTotalPages: (n: number) => void;
  /** Sync totalPages from the canva store's pages length. Public so
   *  external code can trigger a manual sync. */
  syncFromCanva: () => void;

  // ── Scores ─────────────────────────────────────────────────
  scores: ScoreEntry[];
  reportScore: (entry: Omit<ScoreEntry, 'completed'> & { completed?: boolean }) => void;
  resetAllScores: () => void;

  // ── Replay ─────────────────────────────────────────────────
  /** Monotonically increasing counter. Renderers can watch this
   *  value via useEffect — when it changes, they should reset
   *  their internal state (answers, current question, etc.). */
  replayGeneration: number;
  /** Full replay: reset scores, go back to page 0, and bump
   *  `replayGeneration` so that renderer components reinitialise. */
  replayAll: () => void;

  // ── Computed (as functions) ────────────────────────────────
  totalScore: () => number;
  totalMax: () => number;
  totalPct: () => number;
  pageScore: (pageIndex: number) => { score: number; max: number };
  isPageComplete: (pageIndex: number) => boolean;
  allPagesComplete: () => boolean;
}

// ═══════════════════════════════════════════════════════════════
// Canva store reference — injected after creation to break
// the circular dependency between interactive-store and
// canva/store. The canva store is set via setCanvaStoreRef()
// during app initialization (see @/store/canva/init).
// ═══════════════════════════════════════════════════════════════

let _canvaStoreRef: StoreApi<{ pages: unknown[]; currentPageIndex: number; goPage: (idx: number) => void }> | null = null;

/**
 * Inject the canva store reference after both stores are created.
 * This breaks the circular import dependency.
 * Called once from initCanvaStoreSubscriptions().
 */
export function setCanvaStoreRef(store: typeof _canvaStoreRef) {
  _canvaStoreRef = store;
}

function getCanvaStore() {
  if (!_canvaStoreRef) {
    throw new Error('[interactive-store] Canva store ref not set. Call setCanvaStoreRef() first.');
  }
  return _canvaStoreRef;
}

// ── Store ──────────────────────────────────────────────────────

export const useInteractiveStore = create<InteractiveState>()(
  devtools(
    persist(
      (set, get) => {
  // ── Helper: Sync totalPages from canva store ─────────────────
  const syncTotalPages = () => {
    try {
      const canvaPages = getCanvaStore().getState().pages;
      const count = canvaPages.length;
      if (count !== get().totalPages) {
        set({ totalPages: count });
      }
    } catch (err) {
      // If canva store is not available, totalPages stays at its last
      // known value. Navigation guards will silently fail-safe.
      if (process.env.NODE_ENV === 'development') {
        logger.warn('interactive-store', 'syncTotalPages failed — canva store may not be ready: ' + String(err));
      }
    }
  };

  return {
  // ── Mode ───────────────────────────────────────────────────
  mode: 'design',

  setMode: (mode) => {
    set({ mode });
    if (mode === 'interactive') {
      // Reset navigation and scores when entering interactive mode
      set({ interactivePageIdx: 0 });
      syncTotalPages();
    }
  },

  toggleMode: () => {
    const next = get().mode === 'design' ? 'interactive' : 'design';
    get().setMode(next);
  },

  openPlay: () => {
    syncTotalPages(); // ← ensure totalPages is correct before navigating
    // Phase 9 fix: start from current page instead of always page 0
    const startIdx = getCanvaStore().getState().currentPageIndex || 0;
    set({ mode: 'interactive', interactivePageIdx: startIdx, scores: [] });
    // Sync canva store to the start page
    try { getCanvaStore().getState().goPage(startIdx); } catch { /* canva store may not be ready */ }
  },

  closePlay: () => {
    set({ mode: 'design', interactivePageIdx: 0 });
  },

  // ── Navigation ─────────────────────────────────────────────
  interactivePageIdx: 0,
  totalPages: 0,

  setTotalPages: (n) => set({ totalPages: n }),

  /** Public method: sync totalPages from the canva store's current
   *  pages length. Call this whenever you suspect the canva page
   *  count may have changed outside of interactive navigation. */
  syncFromCanva: () => {
    syncTotalPages();
  },

  goInteractivePage: (idx) => {
    syncTotalPages(); // ← guard against stale totalPages
    const { totalPages } = get();
    if (idx >= 0 && idx < totalPages) {
      set({ interactivePageIdx: idx });
    }
  },

  nextInteractivePage: () => {
    syncTotalPages(); // ← guard against stale totalPages
    const { interactivePageIdx, totalPages } = get();
    if (interactivePageIdx < totalPages - 1) {
      set({ interactivePageIdx: interactivePageIdx + 1 });
    }
  },

  prevInteractivePage: () => {
    syncTotalPages(); // ← guard against stale totalPages
    const { interactivePageIdx } = get();
    if (interactivePageIdx > 0) {
      set({ interactivePageIdx: interactivePageIdx - 1 });
    }
  },

  // ── Scores ─────────────────────────────────────────────────
  scores: [],

  reportScore: (entry) => {
    const { scores } = get();
    // Update existing entry or add new one
    const existing = scores.findIndex(
      (s) => s.elementId === entry.elementId && s.pageIndex === entry.pageIndex
    );
    const newEntry: ScoreEntry = {
      ...entry,
      completed: entry.completed ?? true,
    };
    if (existing >= 0) {
      const updated = [...scores];
      updated[existing] = newEntry;
      set({ scores: updated });
    } else {
      set({ scores: [...scores, newEntry] });
    }
  },

  resetAllScores: () => set({ scores: [], interactivePageIdx: 0 }),

  // ── Replay ─────────────────────────────────────────────────
  replayGeneration: 0,

  replayAll: () => set({
    scores: [],
    interactivePageIdx: 0,
    replayGeneration: get().replayGeneration + 1,
  }),

  // ── Computed ───────────────────────────────────────────────
  totalScore: () => {
    return get().scores.reduce((sum, s) => sum + s.score, 0);
  },

  totalMax: () => {
    return get().scores.reduce((sum, s) => sum + s.maxScore, 0);
  },

  totalPct: () => {
    const max = get().totalMax();
    if (max === 0) return 0;
    return Math.round((get().totalScore() / max) * 100);
  },

  pageScore: (pageIndex) => {
    const pageScores = get().scores.filter((s) => s.pageIndex === pageIndex);
    return {
      score: pageScores.reduce((sum, s) => sum + s.score, 0),
      max: pageScores.reduce((sum, s) => sum + s.maxScore, 0),
    };
  },

  isPageComplete: (pageIndex) => {
    return get().scores.some(
      (s) => s.pageIndex === pageIndex && s.completed
    );
  },

  allPagesComplete: () => {
    const { scores, totalPages } = get();
    // Check if every page that has interactive content has at least one completed score
    const pagesWithContent = new Set(scores.map((s) => s.pageIndex));
    if (pagesWithContent.size === 0) return false;
    for (const pg of pagesWithContent) {
      if (!scores.some((s) => s.pageIndex === pg && s.completed)) return false;
    }
    return true;
  },
  };
      },
      {
        name: 'mpi-interactive-store',
        partialize: (state) => ({
          scores: state.scores,
          interactivePageIdx: state.interactivePageIdx,
          replayGeneration: state.replayGeneration,
        }),
        version: 1,
      }
    ),
    { name: 'InteractiveStore', enabled: process.env.NODE_ENV === 'development' }
  )
);

// ═══════════════════════════════════════════════════════════════
// Reactive subscription: canva store pages → interactive store totalPages
// ═══════════════════════════════════════════════════════════════
// Moved to @/store/canva/init.ts to avoid circular dependency.
// The subscription is wired up in initCanvaStoreSubscriptions().

let _canvaUnsubscribe: (() => void) | null = null;
let _lastPageCount = -1;

/** Start auto-syncing totalPages from the canva store.
 *  Called from initCanvaStoreSubscriptions() — do NOT call at
 *  module evaluation time. */
export function startInteractiveCanvaSync() {
  if (_canvaUnsubscribe) return; // Already subscribed

  _canvaUnsubscribe = getCanvaStore().subscribe((state) => {
    const count = state.pages.length;
    if (count !== _lastPageCount) {
      _lastPageCount = count;
      useInteractiveStore.getState().syncFromCanva();
    }
  });
}

/** Stop auto-syncing. Call when tearing down. */
export function stopInteractiveCanvaSync() {
  if (_canvaUnsubscribe) {
    _canvaUnsubscribe();
    _canvaUnsubscribe = null;
  }
}
