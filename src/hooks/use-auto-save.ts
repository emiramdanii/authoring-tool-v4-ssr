'use client';

import { useEffect, useRef, useCallback } from 'react';
import { shallow } from 'zustand/shallow';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useDirtyStore } from '@/store/dirty-store';
import { logger } from '@/core/utils/logger';
import {
  executeDurableSave,
  scheduleAutoSave,
  cancelAutoSaveTimers,
  disposeSaveCoordinator,
} from '@/lib/save-utils';

/**
 * Unified auto-save hook — Durable Save State Machine (Sprint 7.2A)
 *
 * REVISION-BASED COORDINATION:
 *   - Every project mutation increments `editRevision` in dirty-store
 *   - When save starts, `savingRevision` captures current editRevision
 *   - When save succeeds, only matching revision → mark clean
 *   - If edits happened during save → stay dirty, schedule next save
 *   - Stale completions are rejected via save token validation
 *
 * SINGLE-FLIGHT:
 *   - Only one save can be in-flight at a time
 *   - Additional save requests during a save are deferred
 *   - After save completes, if still dirty → next save fires immediately
 *
 * PROJECT-SCOPED:
 *   - Save tokens include projectId + revision
 *   - Stale saves from a different project are discarded
 *   - Timer cancellation on project switch prevents cross-project contamination
 *
 * HYDRATION-SAFE:
 *   - _hydrating flag suppresses markDirty() during load
 *   - Prevents false "unsaved" state when loading a project
 *
 * LIFECYCLE:
 *   - beforeunload only warns when dirty (no forced DB save)
 *   - All saves route through the single executeDurableSave() coordinator
 */

export function useAutoSave(projectId?: string | null, saveProject?: () => Promise<void>) {
  const projectIdRef = useRef<string | null | undefined>(projectId);
  projectIdRef.current = projectId;

  // ── Stable dbSaveFn ref that updates when saveProject changes ──
  const dbSaveFnRef = useRef<(() => Promise<void>) | undefined>(saveProject);
  dbSaveFnRef.current = saveProject;

  // ── Subscribe to both stores for change detection ────────────────
  useEffect(() => {
    // Start the initial max-wait timer
    const maxWaitTimer = setTimeout(() => {
      const currentStatus = useDirtyStore.getState().saveStatus;
      if (currentStatus === 'dirty') {
        executeDurableSave(dbSaveFnRef.current);
      }
    }, 30000);

    // Subscribe to canva store — uses subscribeWithSelector so we can
    // watch only the slices that represent meaningful edits.
    const unsubscribeCanva = useCanvaStore.subscribe(
      (state) => ({
        pages: state.pages,
        currentPageIndex: state.currentPageIndex,
      }),
      () => {
        scheduleAutoSave(dbSaveFnRef.current);
      },
      { equalityFn: shallow },
    );

    // V5-RELEASE-HARDENING-02 (RC-META-001): Subscribe to authoring store
    // so metadata-only changes (judulPertemuan, namaGuru, namaSekolah, etc.)
    // trigger auto-save independently of canva store changes.
    // Previously, metadata changes only persisted if canva store also
    // changed (e.g., cover badge update). Now any authoring meta change
    // triggers debounced auto-save which saves BOTH stores.
    // Note: authoring store doesn't have subscribeWithSelector, so we
    // use plain subscribe with manual shallow comparison.
    let prevMeta = JSON.stringify(useAuthoringStore.getState().meta);
    const unsubscribeAuthoring = useAuthoringStore.subscribe((state) => {
      const currMeta = JSON.stringify(state.meta);
      if (currMeta !== prevMeta) {
        prevMeta = currMeta;
        scheduleAutoSave(dbSaveFnRef.current);
      }
    });

    // Subscribe to dirty store — fires when editRevision changes
    let prevRevision = useDirtyStore.getState().editRevision;
    const unsubscribeDirty = useDirtyStore.subscribe((state) => {
      if (state.editRevision !== prevRevision && state.dirty) {
        prevRevision = state.editRevision;
        scheduleAutoSave(dbSaveFnRef.current);
      }
    });

    // Cleanup subscriptions and debounce timer
    return () => {
      unsubscribeCanva();
      unsubscribeAuthoring();
      unsubscribeDirty();
      clearTimeout(maxWaitTimer);
      cancelAutoSaveTimers();
    };
  }, []);

  // Cleanup the hide-saved timer on unmount
  useEffect(() => {
    return () => {
      disposeSaveCoordinator();
    };
  }, []);

  // ── Public saveNow API for manual triggers (Ctrl+S, SaveNowButton) ──
  const saveNow = useCallback(async () => {
    // Stale-save guard — if the project ID has changed since this
    // saveNow was created, abort to prevent cross-project contamination.
    if (projectId !== projectIdRef.current) {
      logger.warn('useAutoSave', 'Stale saveNow detected — project ID changed, aborting');
      return;
    }
    await executeDurableSave(dbSaveFnRef.current);
  }, [projectId]);

  return { saveNow };
}
