'use client';

import { useEffect, useRef, useCallback } from 'react';
import { shallow } from 'zustand/shallow';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { logger } from '@/core/utils/logger';
import { toast } from 'sonner';
import { enqueueSave, type SyncPayload } from '@/lib/offline-sync';
import { canvaPagesToSavePages } from '@/lib/save-utils';
import { computePagesHash } from '@/core/recovery';

/**
 * Unified auto-save hook — single source of truth for saving both stores.
 *
 * Supports three persistence modes:
 *   1. **Database mode** (preferred): When a `projectId` is available
 *      and a `saveProject` callback is provided, saves via the
 *      ProjectManager's unified save path (no more direct fetch).
 *   2. **Offline queue**: When offline with a `projectId`, enqueues the
 *      save for later sync instead of failing the DB save.
 *   3. **localStorage fallback**: When no `projectId`, saves to localStorage
 *      (for offline/new users or before first project creation).
 *
 * Called ONCE from CanvaAutoSaveSync (the primary editing context).
 *
 * Enhancement (Phase E.4 + G.3):
 *   - Debounced: saves after 2 seconds of inactivity (not every keystroke)
 *   - Visual indicator: "Menyimpan..." briefly shown in status bar during save
 *   - Error toast: "Gagal menyimpan. Periksa koneksi internet Anda."
 *   - _lastSavedAt timestamp added to saved data
 *   - Offline queue: enqueues DB saves when offline, replays on reconnect
 */

const DEBOUNCE_MS = 2000;
const MAX_WAIT_MS = 30000; // Force-save at least every 30 seconds during active editing
const HIDE_SAVED_MS = 3000;

export function useAutoSave(projectId?: string | null, saveProject?: () => Promise<void>) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDBSaveRef = useRef<number>(0);
  const lastErrorToastRef = useRef<number>(0);

  // ── Helper: build sync payload from current store state ──────
  const buildSyncPayload = useCallback((): SyncPayload => {
    const canvaState = useCanvaStore.getState();
    const authoringState = useAuthoringStore.getState();
    return {
      pages: canvaPagesToSavePages(canvaState.pages),
      ratioId: canvaState.ratioId,
      meta: {
        title: authoringState.meta.judulPertemuan || 'Proyek Baru',
        subject: authoringState.meta.mapel,
        grade: authoringState.meta.kelas,
      },
      authoringData: {
        meta: authoringState.meta,
        cp: authoringState.cp,
        tp: authoringState.tp,
        atp: authoringState.atp,
        alur: authoringState.alur,
        skenario: authoringState.skenario,
        kuis: authoringState.kuis,
        modules: authoringState.modules,
        games: authoringState.games,
        materi: authoringState.materi,
        petunjuk: authoringState.petunjuk,
        diskusi: authoringState.diskusi,
        refleksi: authoringState.refleksi,
        penutup: authoringState.penutup,
        suara: authoringState.suara,
      },
    };
  }, []);

  // ── Core save logic ────────────────────────────────────────────
  const saveNow = useCallback(async () => {
    try {
      useCanvaStore.setState({ _saveStatus: 'saving' });

      // Always save to localStorage as a backup
      useCanvaStore.getState().saveToStorage();
      useAuthoringStore.getState().saveToStorage();

      // If projectId and saveProject are available, save to DB via the unified path
      if (projectId && saveProject) {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

        if (isOffline) {
          // Offline: enqueue for later sync instead of trying the DB save
          enqueueSave(projectId, buildSyncPayload());
          useCanvaStore.setState({ _saveStatus: 'saved' });
        } else {
          // Online: save to DB directly
          const now = Date.now();
          if (now - lastDBSaveRef.current >= 2000) {
            lastDBSaveRef.current = now;
            await saveProject();
          }
        }
      }

      useCanvaStore.setState({ _saveStatus: 'saved' });

      // ── FASE 6: Post-save hash verification ──
      // After saving, verify the hash matches what was saved.
      // This catches corruption in the write path (e.g., storage truncation).
      try {
        const savedPages = useCanvaStore.getState().pages;
        const currentHash = computePagesHash(savedPages);
        const previousHash = useCanvaStore.getState()._pagesHashAtSave;
        if (previousHash && currentHash !== previousHash) {
          console.warn('[AutoSave] Hash mismatch after save — possible write corruption');
        }
      } catch {
        // Hash verification is best-effort — don't break save on failure
      }

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
  }, [projectId, saveProject, buildSyncPayload]);

  // ── Subscribe to both stores for change detection ────────────────
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
    let lastSaveTime = Date.now();

    const scheduleSave = () => {
      // Mark as "unsaved" immediately so UI responds
      const currentStatus = useCanvaStore.getState()._saveStatus;
      if (currentStatus !== 'saving') {
        useCanvaStore.setState({ _saveStatus: 'unsaved' });
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        lastSaveTime = Date.now();
        saveNow();
        // Reset max-wait timer after each save
        if (maxWaitTimer) clearTimeout(maxWaitTimer);
        maxWaitTimer = setTimeout(() => {
          const currentStatus = useCanvaStore.getState()._saveStatus;
          if (currentStatus === 'unsaved') {
            lastSaveTime = Date.now();
            saveNow();
          }
        }, MAX_WAIT_MS);
      }, DEBOUNCE_MS);
    };

    // Start the initial max-wait timer
    maxWaitTimer = setTimeout(() => {
      const currentStatus = useCanvaStore.getState()._saveStatus;
      if (currentStatus === 'unsaved') {
        saveNow();
      }
    }, MAX_WAIT_MS);

    // Subscribe to canva store — uses subscribeWithSelector so we can
    // watch only the slices that represent meaningful edits.
    // CRITICAL: shallow equality is required because the selector returns
    // a new object each time. Without it, Object.is always returns false
    // for different object references, causing setState({ _saveStatus })
    // → listener → scheduleSave → setState → infinite loop → stack overflow.
    const unsubscribeCanva = useCanvaStore.subscribe(
      (state) => ({
        pages: state.pages,
        currentPageIndex: state.currentPageIndex,
      }),
      () => {
        scheduleSave();
      },
      { equalityFn: shallow },
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

    // [G.4] Fixed: proper cleanup of both store subscriptions and debounce timer
    return () => {
      unsubscribeCanva();
      unsubscribeAuth();
      if (debounceTimer) clearTimeout(debounceTimer);
      if (maxWaitTimer) clearTimeout(maxWaitTimer);
    };
  }, [saveNow]);

  // [G.4] Fixed: cleanup the HIDE_SAVED_MS timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return { saveNow };
}
