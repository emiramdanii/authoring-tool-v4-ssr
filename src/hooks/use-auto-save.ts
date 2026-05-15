'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { logger } from '@/core/utils/logger';
import { toast } from 'sonner';

/**
 * Unified auto-save hook — single source of truth for saving both stores.
 *
 * Supports two persistence modes:
 *   1. **Database mode** (preferred): When a `projectId` is available
 *      and a `saveProject` callback is provided, saves via the
 *      ProjectManager's unified save path (no more direct fetch).
 *   2. **localStorage fallback**: When no `projectId`, saves to localStorage
 *      (for offline/new users or before first project creation).
 *
 * Called ONCE from CanvaAutoSaveSync (the primary editing context).
 *
 * Enhancement (Phase E.4):
 *   - Debounced: saves after 2 seconds of inactivity (not every keystroke)
 *   - Visual indicator: "Menyimpan..." briefly shown in status bar during save
 *   - Error toast: "Gagal menyimpan. Periksa koneksi internet Anda."
 *   - _lastSavedAt timestamp added to saved data
 */

const DEBOUNCE_MS = 2000;
const HIDE_SAVED_MS = 3000;

export function useAutoSave(projectId?: string | null, saveProject?: () => Promise<void>) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDBSaveRef = useRef<number>(0);
  const lastErrorToastRef = useRef<number>(0);

  // ── Core save logic ────────────────────────────────────────────
  const saveNow = useCallback(async () => {
    try {
      useCanvaStore.setState({ _saveStatus: 'saving' });

      // Always save to localStorage as a backup
      useCanvaStore.getState().saveToStorage();
      useAuthoringStore.getState().saveToStorage();

      // If projectId and saveProject are available, save to DB via the unified path
      if (projectId && saveProject) {
        const now = Date.now();
        if (now - lastDBSaveRef.current >= 2000) {
          lastDBSaveRef.current = now;
          await saveProject();
        }
      }

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
      logger.error('useAutoSave', error);
      useCanvaStore.setState({ _saveStatus: 'error' });

      // Show error toast (throttled — max once per 10 seconds to avoid spam)
      const now = Date.now();
      if (now - lastErrorToastRef.current >= 10000) {
        lastErrorToastRef.current = now;
        toast.error('Gagal menyimpan. Periksa koneksi internet Anda.');
      }
    }
  }, [projectId, saveProject]);

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
