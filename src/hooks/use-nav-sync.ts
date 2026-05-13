// ═══════════════════════════════════════════════════════════════
// USE NAV SYNC — Unified navigation hook that keeps
// InteractiveStore and CanvaStore page indices in sync.
//
// Problem: Two stores track page index independently:
//   - InteractiveStore.interactivePageIdx (preview/export mode)
//   - CanvaStore.currentPageIndex (design/canvas mode)
//
// Without syncing, navigating in one store doesn't update the other,
// causing page jumps and stale state. This hook provides unified
// navigation callbacks that update both stores atomically.
//
// Used by: PageFrame, PlayOverlay, ExportApp, SchemaPlayer
// ═══════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { useInteractiveStore } from '@/store/interactive-store';
import { useCanvaStore } from '@/store/canva-store';

export interface NavSyncActions {
  /** Go to specific page (syncs both stores) */
  goToPage: (idx: number) => void;
  /** Go to next page (syncs both stores) */
  goNext: (currentIdx: number) => void;
  /** Go to previous page (syncs both stores) */
  goPrev: (currentIdx: number) => void;
  /** Reset scores and go to first page */
  goReset: () => void;
}

/**
 * Hook that provides navigation callbacks keeping both
 * InteractiveStore and CanvaStore in sync.
 *
 * @param currentIdx - The current page index from the calling component's context
 * @returns Navigation callbacks that update both stores
 *
 * @example
 * ```tsx
 * const { goNext, goPrev, goToPage, goReset } = useNavSync();
 *
 * <button onClick={() => goNext(currentPageIndex)}>Next</button>
 * <button onClick={() => goPrev(currentPageIndex)}>Prev</button>
 * <button onClick={() => goToPage(0)}>First</button>
 * <button onClick={goReset}>Reset</button>
 * ```
 */
export function useNavSync(): NavSyncActions {
  const goInteractivePage = useInteractiveStore((s) => s.goInteractivePage);
  const nextInteractivePage = useInteractiveStore((s) => s.nextInteractivePage);
  const prevInteractivePage = useInteractiveStore((s) => s.prevInteractivePage);
  const resetAllScores = useInteractiveStore((s) => s.resetAllScores);
  const goPage = useCanvaStore((s) => s.goPage);

  const goToPage = useCallback((idx: number) => {
    goInteractivePage(idx);
    goPage(idx);
  }, [goInteractivePage, goPage]);

  const goNext = useCallback((currentIdx: number) => {
    // Sync interactive store to current page before advancing
    goInteractivePage(currentIdx);
    nextInteractivePage();
    const afterIdx = useInteractiveStore.getState().interactivePageIdx;
    goPage(afterIdx);
  }, [goInteractivePage, nextInteractivePage, goPage]);

  const goPrev = useCallback((currentIdx: number) => {
    goInteractivePage(currentIdx);
    prevInteractivePage();
    const afterIdx = useInteractiveStore.getState().interactivePageIdx;
    goPage(afterIdx);
  }, [goInteractivePage, prevInteractivePage, goPage]);

  const goReset = useCallback(() => {
    resetAllScores();
    goInteractivePage(0);
    goPage(0);
  }, [resetAllScores, goInteractivePage, goPage]);

  return { goToPage, goNext, goPrev, goReset };
}
