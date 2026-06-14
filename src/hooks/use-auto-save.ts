'use client';

import { useEffect, useRef, useCallback } from 'react';
import { shallow } from 'zustand/shallow';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useDirtyStore } from '@/store/dirty-store';
import { logger } from '@/core/utils/logger';
import { toast } from 'sonner';
import { enqueueSave, type SyncPayload } from '@/lib/offline-sync';
import { canvaPagesToSavePages } from '@/lib/save-utils';
import { computePagesHash } from '@/core/recovery';

/**
 * Unified auto-save hook — Durable Save State Machine (Sprint 7.1)
 *
 * REVISION-BASED COORDINATION:
 *   - Every project mutation increments `editRevision` in dirty-store
 *   - When save starts, `savingRevision` captures current editRevision
 *   - When save succeeds, only matching revision → mark clean
 *   - If edits happened during save → stay dirty, schedule next save
 *   - Stale completions are ignored
 *
 * SINGLE-FLIGHT:
 *   - Only one save can be in-flight at a time
 *   - Additional save requests during a save are deferred
 *   - After save completes, if still dirty → next save fires immediately
 *
 * ERROR HANDLING:
 *   - On failure: status=error, dirty stays true, recovery snapshot kept
 *   - Retry is always possible
 *   - Guru sees honest "Gagal menyimpan" indicator
 *
 * LIFECYCLE:
 *   - beforeunload only warns when dirty (no forced DB save)
 *   - Recovery flush via visibilitychange is Sprint 7.2
 */

const DEBOUNCE_MS = 2000;
const MAX_WAIT_MS = 30000; // Force-save at least every 30 seconds during active editing
const HIDE_SAVED_MS = 3000;

export function useAutoSave(projectId?: string | null, saveProject?: () => Promise<void>) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDBSaveRef = useRef<number>(0);
  const lastErrorToastRef = useRef<number>(0);
  const pendingSaveRef = useRef<boolean>(false);

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

  // ── Core save logic — revision-based, single-flight ─────────────
  const saveNow = useCallback(async () => {
    const dirtyState = useDirtyStore.getState();

    // SINGLE-FLIGHT GUARD: If a save is already in progress, mark
    // pending so we fire another save after the current one completes.
    if (dirtyState.saveStatus === 'saving') {
      pendingSaveRef.current = true;
      return;
    }

    // Nothing to save if not dirty
    if (!dirtyState.dirty && dirtyState.saveStatus !== 'error') {
      return;
    }

    try {
      // ── Step 1: Start saving — capture revision ──
      useDirtyStore.getState().startSaving();

      // Also update CanvaStore's _saveStatus for backward compat
      useCanvaStore.setState({ _saveStatus: 'saving' });

      // ── Step 2: Always save to localStorage as a backup ──
      // This provides crash recovery even if DB save fails.
      // We do NOT markClean here — that only happens after durable save.
      useCanvaStore.getState().saveToStorage();
      useAuthoringStore.getState().saveToStorage();

      // ── Step 3: DB save (durable) ──
      if (projectId && saveProject) {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

        if (isOffline) {
          // Offline: enqueue for later sync instead of trying the DB save
          enqueueSave(projectId, buildSyncPayload());
        } else {
          // Online: save to DB directly with rate limit
          const now = Date.now();
          if (now - lastDBSaveRef.current >= 2000) {
            lastDBSaveRef.current = now;
            await saveProject();
          }
        }
      }

      // ── Step 4: Mark save succeeded ──
      // saveSucceeded() checks if revision still matches.
      // If edits happened during save → returns false (still dirty)
      const fullyClean = useDirtyStore.getState().saveSucceeded();

      if (fullyClean) {
        useCanvaStore.setState({ _saveStatus: 'saved' });

        // ── Post-save hash verification ──
        try {
          const savedPages = useCanvaStore.getState().pages;
          const currentHash = computePagesHash(savedPages);
          const previousHash = useCanvaStore.getState()._pagesHashAtSave;
          if (previousHash && currentHash !== previousHash) {
            logger.warn('AutoSave', 'Hash mismatch after save — possible write corruption');
          }
        } catch {
          // Hash verification is best-effort
        }

        // Auto-hide "saved" indicator after HIDE_SAVED_MS
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          const current = useDirtyStore.getState().saveStatus;
          if (current === 'saved') {
            // Don't change saveStatus — just update legacy _saveStatus for UI
            useCanvaStore.setState({ _saveStatus: 'unsaved' });
          }
        }, HIDE_SAVED_MS);
      } else {
        // Edits happened during save — still dirty
        useCanvaStore.setState({ _saveStatus: 'unsaved' });
      }

    } catch (error) {
      logger.error('useAutoSave', error);

      // Mark save as failed — dirty stays true, recovery snapshot preserved
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      useDirtyStore.getState().saveFailed(errorMsg);
      useCanvaStore.setState({ _saveStatus: 'error' });

      // Show error toast (throttled — max once per 10 seconds to avoid spam)
      const now = Date.now();
      if (now - lastErrorToastRef.current >= 10000) {
        lastErrorToastRef.current = now;
        toast.error('Gagal menyimpan. Periksa koneksi internet Anda.');
      }
    }

    // ── After save completes, check if a pending save is needed ──
    if (pendingSaveRef.current) {
      pendingSaveRef.current = false;
      const currentDirty = useDirtyStore.getState();
      if (currentDirty.dirty) {
        // Schedule next save immediately (no debounce — edits happened during save)
        saveNow();
      }
    }
  }, [projectId, saveProject, buildSyncPayload]);

  // ── Subscribe to both stores for change detection ────────────────
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
    let lastSaveTime = Date.now();

    const scheduleSave = () => {
      // Mark as "unsaved" immediately so UI responds (legacy compat)
      const currentStatus = useDirtyStore.getState().saveStatus;
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
          const currentStatus = useDirtyStore.getState().saveStatus;
          if (currentStatus === 'dirty') {
            lastSaveTime = Date.now();
            saveNow();
          }
        }, MAX_WAIT_MS);
      }, DEBOUNCE_MS);
    };

    // Start the initial max-wait timer
    maxWaitTimer = setTimeout(() => {
      const currentStatus = useDirtyStore.getState().saveStatus;
      if (currentStatus === 'dirty') {
        saveNow();
      }
    }, MAX_WAIT_MS);

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
      { equalityFn: shallow },
    );

    // Subscribe to dirty store — fires when editRevision changes
    let prevRevision = useDirtyStore.getState().editRevision;
    const unsubscribeDirty = useDirtyStore.subscribe((state) => {
      if (state.editRevision !== prevRevision && state.dirty) {
        prevRevision = state.editRevision;
        scheduleSave();
      }
    });

    // Fixed: proper cleanup of both store subscriptions and debounce timer
    return () => {
      unsubscribeCanva();
      unsubscribeDirty();
      if (debounceTimer) clearTimeout(debounceTimer);
      if (maxWaitTimer) clearTimeout(maxWaitTimer);
    };
  }, [saveNow]);

  // Fixed: cleanup the HIDE_SAVED_MS timer on unmount
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
