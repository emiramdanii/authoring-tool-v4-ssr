// ═══════════════════════════════════════════════════════════════════
// PERIODIC INTEGRITY HOOK — FASE 6 scheduled schema verification
// ═══════════════════════════════════════════════════════════════════
// Runs integrity checks every 5 minutes while the app is active.
// Auto-repairs corrupted schemas and enters safe mode if needed.
// Only runs when the document is visible (not in background tab).
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { logger } from '@/core/utils/logger';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MIN_EDIT_COUNT_BETWEEN_CHECKS = 5; // Only check after some edits

export function usePeriodicIntegrityCheck() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const editCountRef = useRef(0);
  const runIntegrityCheckNow = useCanvaStore((s) => s.runIntegrityCheckNow);

  const check = useCallback(() => {
    // Only check if the document is visible (not in background tab)
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    // Only check if there have been enough edits to warrant a check
    if (editCountRef.current < MIN_EDIT_COUNT_BETWEEN_CHECKS) {
      return;
    }

    try {
      const result = runIntegrityCheckNow();
      if (result.corruptedPages > 0) {
        logger.warn('Integrity', `Periodic check found ${result.corruptedPages} corrupted pages (${result.repairedPages} repaired)`);
      }
      editCountRef.current = 0; // Reset after check
    } catch (err) {
      logger.warn('Integrity', 'Periodic check failed: ' + String(err));
    }
  }, [runIntegrityCheckNow]);

  useEffect(() => {
    // Track edit count via store subscription
    const unsub = useCanvaStore.subscribe(
      (state) => ({ pages: state.pages }),
      () => {
        editCountRef.current++;
      },
      { equalityFn: (a, b) => a.pages === b.pages }
    );

    // Start periodic timer
    timerRef.current = setInterval(check, CHECK_INTERVAL_MS);

    // Also check when the tab becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Reset the timer when tab becomes visible
        if (timerRef.current) clearInterval(timerRef.current);
        check(); // Check immediately on tab focus
        timerRef.current = setInterval(check, CHECK_INTERVAL_MS);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      unsub();
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [check]);
}
