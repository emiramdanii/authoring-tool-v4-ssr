// ═══════════════════════════════════════════════════════════════
// LEARNING MEDIA STORE — Runtime state for student-facing LearningMediaShell
//
// Tracks navigation, completion, scores, and lock state.
// Syncs with useInteractiveStore for score data (single source of truth).
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useInteractiveStore } from '@/store/interactive-store';
import { useCanvaStore } from '@/store/canva-store';
import type { PageTemplateType } from '@/components/canva/types';

// ── Types ─────────────────────────────────────────────────────

export interface ScreenScore {
  score: number;
  maxScore: number;
}

export interface LearningMediaState {
  // ── Navigation ─────────────────────────────────────────────
  /** Current screen/page index (0-based) */
  currentScreenIndex: number;
  /** Total number of screens (synced from canva store pages) */
  totalScreens: number;

  // ── Completion ─────────────────────────────────────────────
  /** Set of completed screen indices */
  completedScreens: Set<number>;
  /** Per-screen score data (synced from interactive store) */
  screenScores: Map<number, ScreenScore>;

  // ── Navigation Lock ────────────────────────────────────────
  /** Whether navigation is currently locked (current screen incomplete) */
  isLocked: boolean;

  // ── Completion Modal ───────────────────────────────────────
  /** Whether the completion modal is showing */
  showCompletionModal: boolean;

  // ── Timing ─────────────────────────────────────────────────
  /** Timestamp when learning session started */
  sessionStartTime: number;

  // ── Actions ────────────────────────────────────────────────
  goToScreen: (idx: number) => void;
  nextScreen: () => void;
  prevScreen: () => void;
  markScreenComplete: (idx: number, score?: number, maxScore?: number) => void;
  resetAll: () => void;
  isScreenComplete: (idx: number) => boolean;
  canAdvance: () => boolean;
  setShowCompletionModal: (show: boolean) => void;
  /** Sync totalScreens from canva store */
  syncTotalScreens: () => void;
  /** Sync screen scores from interactive store */
  syncScores: () => void;
  /** Initialize the learning session */
  initSession: () => void;
  /** Close learning mode and return to edit */
  closeLearning: () => void;

  // ── Computed ───────────────────────────────────────────────
  totalScore: () => number;
  totalMaxScore: () => number;
  totalPct: () => number;
  completedCount: () => number;
  elapsedTime: () => number;
  starRating: () => number;
}

// ── Interactive page types that require completion before advancing ──

const INTERACTIVE_PAGE_TYPES: ReadonlySet<string> = new Set([
  'kuis',
  'game',
  'diskusi',
  'refleksi',
  'skenario',
]);

/**
 * Check if a page type is interactive (requires completion before advancing)
 */
function isInteractivePageType(templateType?: PageTemplateType): boolean {
  if (!templateType) return false;
  return INTERACTIVE_PAGE_TYPES.has(templateType);
}

// ═══════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════

export const useLearningMediaStore = create<LearningMediaState>()(
  devtools(
    (set, get) => {
      // ── Helper: Get current page template type from canva store ──
      const getCurrentPageType = (): PageTemplateType | undefined => {
        try {
          const pages = useCanvaStore.getState().pages;
          const idx = get().currentScreenIndex;
          return pages[idx]?.templateType;
        } catch {
          return undefined;
        }
      };

      // ── Helper: Update lock state based on current screen ──
      const updateLockState = () => {
        const { currentScreenIndex, completedScreens } = get();
        const pageType = getCurrentPageType();

        // If current page is interactive and not completed, lock navigation
        const shouldLock = isInteractivePageType(pageType) && !completedScreens.has(currentScreenIndex);

        set({ isLocked: shouldLock });
      };

      return {
        // ── Navigation ─────────────────────────────────────────
        currentScreenIndex: 0,
        totalScreens: 0,

        // ── Completion ─────────────────────────────────────────
        completedScreens: new Set<number>(),
        screenScores: new Map<number, ScreenScore>(),

        // ── Navigation Lock ────────────────────────────────────
        isLocked: false,

        // ── Completion Modal ───────────────────────────────────
        showCompletionModal: false,

        // ── Timing ─────────────────────────────────────────────
        sessionStartTime: 0,

        // ── Actions ────────────────────────────────────────────
        goToScreen: (idx) => {
          const { totalScreens } = get();
          if (idx >= 0 && idx < totalScreens) {
            set({ currentScreenIndex: idx });
            // Sync canva store page index
            try {
              useCanvaStore.getState().goPage(idx);
            } catch { /* canva store may not be ready */ }
            updateLockState();
          }
        },

        nextScreen: () => {
          const { currentScreenIndex, totalScreens, isLocked } = get();
          if (isLocked) return; // Cannot advance when locked
          if (currentScreenIndex < totalScreens - 1) {
            const nextIdx = currentScreenIndex + 1;
            set({ currentScreenIndex: nextIdx });
            try {
              useCanvaStore.getState().goPage(nextIdx);
            } catch { /* canva store may not be ready */ }
            updateLockState();
          }
        },

        prevScreen: () => {
          const { currentScreenIndex } = get();
          if (currentScreenIndex > 0) {
            const prevIdx = currentScreenIndex - 1;
            set({ currentScreenIndex: prevIdx });
            try {
              useCanvaStore.getState().goPage(prevIdx);
            } catch { /* canva store may not be ready */ }
            updateLockState();
          }
        },

        markScreenComplete: (idx, score, maxScore) => {
          const { completedScreens, screenScores } = get();
          const newCompleted = new Set(completedScreens);
          newCompleted.add(idx);

          const newScores = new Map(screenScores);
          if (score !== undefined && maxScore !== undefined) {
            newScores.set(idx, { score, maxScore });
          }

          set({ completedScreens: newCompleted, screenScores: newScores });
          updateLockState();
        },

        resetAll: () => {
          set({
            currentScreenIndex: 0,
            completedScreens: new Set<number>(),
            screenScores: new Map<number, ScreenScore>(),
            isLocked: false,
            showCompletionModal: false,
            sessionStartTime: Date.now(),
          });
          // Also reset interactive store scores
          try {
            useInteractiveStore.getState().replayAll();
            useCanvaStore.getState().goPage(0);
          } catch { /* stores may not be ready */ }
        },

        isScreenComplete: (idx) => {
          return get().completedScreens.has(idx);
        },

        canAdvance: () => {
          const { isLocked, currentScreenIndex, totalScreens } = get();
          if (isLocked) return false;
          return currentScreenIndex < totalScreens - 1;
        },

        setShowCompletionModal: (show) => {
          set({ showCompletionModal: show });
        },

        syncTotalScreens: () => {
          try {
            const pages = useCanvaStore.getState().pages;
            const count = pages.length;
            if (count !== get().totalScreens) {
              set({ totalScreens: count });
            }
          } catch { /* canva store may not be ready */ }
        },

        syncScores: () => {
          try {
            const iStore = useInteractiveStore.getState();
            const pages = useCanvaStore.getState().pages;
            const newScores = new Map<number, ScreenScore>();
            const newCompleted = new Set(get().completedScreens);

            for (let i = 0; i < pages.length; i++) {
              const pageScore = iStore.pageScore(i);
              if (pageScore.max > 0) {
                newScores.set(i, { score: pageScore.score, maxScore: pageScore.max });
                // Auto-mark as complete if there's a completed score entry
                if (iStore.isPageComplete(i)) {
                  newCompleted.add(i);
                }
              }
            }

            set({
              screenScores: newScores,
              completedScreens: newCompleted,
            });
          } catch { /* stores may not be ready */ }
        },

        initSession: () => {
          try {
            const pages = useCanvaStore.getState().pages;
            const startIdx = useCanvaStore.getState().currentPageIndex || 0;
            set({
              currentScreenIndex: startIdx,
              totalScreens: pages.length,
              completedScreens: new Set<number>(),
              screenScores: new Map<number, ScreenScore>(),
              isLocked: false,
              showCompletionModal: false,
              sessionStartTime: Date.now(),
            });
            // Enter interactive mode in the interactive store
            useInteractiveStore.getState().openPlay();
            useInteractiveStore.getState().goInteractivePage(startIdx);
          } catch { /* stores may not be ready */ }
        },

        closeLearning: () => {
          try {
            useInteractiveStore.getState().closePlay();
            useCanvaStore.getState().setAppMode('edit');
          } catch { /* stores may not be ready */ }
        },

        // ── Computed ───────────────────────────────────────────
        totalScore: () => {
          // Delegate to interactive store for authoritative score
          try {
            return useInteractiveStore.getState().totalScore();
          } catch {
            // Fallback: sum from screenScores map
            let total = 0;
            get().screenScores.forEach((s) => { total += s.score; });
            return total;
          }
        },

        totalMaxScore: () => {
          try {
            return useInteractiveStore.getState().totalMax();
          } catch {
            let total = 0;
            get().screenScores.forEach((s) => { total += s.maxScore; });
            return total;
          }
        },

        totalPct: () => {
          const max = get().totalMaxScore();
          if (max === 0) return 0;
          return Math.round((get().totalScore() / max) * 100);
        },

        completedCount: () => {
          return get().completedScreens.size;
        },

        elapsedTime: () => {
          const { sessionStartTime } = get();
          if (!sessionStartTime) return 0;
          return Math.floor((Date.now() - sessionStartTime) / 1000);
        },

        starRating: () => {
          const pct = get().totalPct();
          if (pct >= 90) return 3;
          if (pct >= 60) return 2;
          if (pct > 0) return 1;
          return 0;
        },
      };
    },
    { name: 'LearningMediaStore', enabled: process.env.NODE_ENV === 'development' }
  )
);
