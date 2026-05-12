'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';

/**
 * Unified auto-save hook — single source of truth for saving both stores.
 *
 * Before this hook existed there were TWO competing auto-save systems:
 *   1. AuthoringTool.tsx — saved both stores every 8 s when `dirty`
 *   2. CanvaBuilder.tsx  — subscribed to canva store changes with 1 500 ms debounce
 *
 * They could race, causing double-writes.  This hook consolidates both into
 * one mechanism: subscribe to change signals from both stores, debounce at
 * 2 000 ms, then save both stores atomically.
 *
 * Called ONCE from CanvaBuilder (the primary editing context).
 */

const DEBOUNCE_MS = 2000;
const HIDE_SAVED_MS = 3000;

export function useAutoSave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Core save logic — also exported so Toolbar / Sidebar can call it ──
  const saveNow = useCallback(async () => {
    try {
      useCanvaStore.setState({ _saveStatus: 'saving' });

      useCanvaStore.getState().saveToStorage();
      useAuthoringStore.getState().saveToStorage();

      useCanvaStore.setState({ _saveStatus: 'saved' });

      // Auto-hide "saved" indicator after HIDE_SAVED_MS
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const current = useCanvaStore.getState()._saveStatus;
        if (current === 'saved') {
          useCanvaStore.setState({ _saveStatus: 'unsaved' });
        }
      }, HIDE_SAVED_MS);
    } catch (error) {
      console.error('[useAutoSave] Auto-save failed:', error);
      useCanvaStore.setState({ _saveStatus: 'error' });
    }
  }, []);

  // ── Subscribe to both stores for change detection ────────────────
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleSave = () => {
      // Mark as "unsaved" immediately so UI responds
      const currentStatus = useCanvaStore.getState()._saveStatus;
      if (currentStatus !== 'saving') {
        useCanvaStore.setState({ _saveStatus: 'unsaved' });
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        saveNow();
      }, DEBOUNCE_MS);
    };

    // Subscribe to canva store — uses subscribeWithSelector so we can
    // watch only the slices that represent meaningful edits.
    const unsubscribeCanva = useCanvaStore.subscribe(
      (state) => ({
        pages: state.pages,
        currentPageIndex: state.currentPageIndex,
      }),
      () => {
        scheduleSave();
      },
    );

    // Subscribe to authoring store — no subscribeWithSelector middleware,
    // so we subscribe to every change and manually check `dirty`.
    let prevDirty = useAuthoringStore.getState().dirty;
    const unsubscribeAuth = useAuthoringStore.subscribe((state) => {
      if (state.dirty && state.dirty !== prevDirty) {
        prevDirty = state.dirty;
        scheduleSave();
      }
    });

    return () => {
      unsubscribeCanva();
      unsubscribeAuth();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [saveNow]);

  return { saveNow };
}
