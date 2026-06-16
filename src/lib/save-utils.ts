import type { CanvaPage } from '@/components/canva/types';
import { useDirtyStore } from '@/store/dirty-store';
import type { SaveStatus, SaveToken } from '@/store/dirty-store';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
// canvaPagesToSavePages is defined below — no self-import needed
import { enqueueSave, type SyncPayload } from '@/lib/offline-sync';
import { computePagesHash } from '@/core/recovery';
import { logger } from '@/core/utils/logger';
import { toast } from 'sonner';

/**
 * Convert CanvaPage[] to the save API format.
 * Shared between useAutoSave and useProjectManager to avoid duplication.
 */
export function canvaPagesToSavePages(pages: CanvaPage[]) {
  return pages.map((page) => ({
    id: page.id,
    label: page.label,
    templateType: page.templateType,
    templateVariant: page.templateVariant,
    contractId: page.contractId,
    bgColor: page.bgColor,
    bgDataUrl: page.bgDataUrl,
    overlay: page.overlay,
    schema: page.schema || null,
    navConfig: page.navConfig,
    templateData: page.templateData,
    colorPalette: page.colorPalette,
    blocks: (page.schema?.blocks || []).map((block) => ({
      type: block.type,
      id: block.id,
      content: Object.fromEntries(
        Object.entries(block).filter(([k]) => !['type', 'id', 'layout', 'children'].includes(k))
      ),
      layout: block.layout,
      variant: block.variant,
      style: block.style,
      children: block.children,
    })),
    elements: page.elements.map((el) => ({
      type: el.type,
      id: el.id,
      content: Object.fromEntries(
        Object.entries(el).filter(([k]) => !['type', 'id'].includes(k))
      ),
    })),
  }));
}

// ═══════════════════════════════════════════════════════════════════
// UNIFIED DIRTY/SAVE HELPERS — Sprint 7.1: Revision-based
// ═══════════════════════════════════════════════════════════════════
// Sprint 7.1: saveAllToStorage() no longer calls markClean().
// Cleanness is now derived from revision tracking:
//   dirty = (editRevision > lastSavedRevision)
// markClean should ONLY be called through saveSucceeded() after
// a durable save completes with a matching revision.
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if ANY part of the project has unsaved changes.
 * Uses revision-based dirty tracking from dirty-store.
 */
export function isAnyDirty(): boolean {
  return useDirtyStore.getState().dirty;
}

/**
 * Save both stores to their respective storage backends.
 * Sprint 7.1: NO LONGER clears dirty flag.
 * Dirty state is now managed by the revision-based state machine.
 */
export function saveAllToStorage(): void {
  useCanvaStore.getState().saveToStorage();
  useAuthoringStore.getState().saveToStorage();
  // Do NOT call markClean() here — that's the bug we're fixing.
  // Cleanness only emerges from saveSucceeded() after durable save.
}

/**
 * Get a combined save status string for UI display.
 * Now reads from the revision-based state machine.
 */
export function getCombinedSaveStatus(): SaveStatus {
  return useDirtyStore.getState().saveStatus;
}

// ═══════════════════════════════════════════════════════════════════
// Sprint 7.2A: Dirty coverage — notifyMutation() helper
// ═══════════════════════════════════════════════════════════════════
// Re-exported from notify-mutation.ts for backward compatibility.
// New imports should use @/lib/notify-mutation directly.
// ═══════════════════════════════════════════════════════════════════

export { notifyMutation } from './notify-mutation';

// ═══════════════════════════════════════════════════════════════════
// Sprint 7.2A: Durable-Save Coordinator
// ═══════════════════════════════════════════════════════════════════
// Single entry point for ALL saves (auto-save, Ctrl+S, SaveNowButton,
// save-before-switch). Routes through the same revision-based
// state machine with project-scoped save tokens.
//
// Guarantees:
//   1. Only one save in-flight at a time (single-flight)
//   2. Stale saves (wrong project or superseded revision) are rejected
//   3. localStorage backup always runs first (crash recovery)
//   4. DB save only when projectId exists and we're online
//   5. saveSucceeded() only clears dirty if revision matches
// ═══════════════════════════════════════════════════════════════════

const DEBOUNCE_MS = 2000;
const MAX_WAIT_MS = 30000;
const HIDE_SAVED_MS = 3000;
const DB_SAVE_MIN_INTERVAL = 2000;
const ERROR_TOAST_MIN_INTERVAL = 10000;

/** Coordinator state — module-level singleton */
let _debounceTimer: ReturnType<typeof setTimeout> | null = null;
let _maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
let _hideSavedTimer: ReturnType<typeof setTimeout> | null = null;
let _pendingSave = false;
let _lastDBSaveTime = 0;
let _lastErrorToastTime = 0;

/**
 * Build a sync payload from current store state.
 * Used by both auto-save and offline sync queue.
 */
export function buildSyncPayload(): SyncPayload {
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
}

/**
 * Execute a durable save using the revision-based state machine.
 * This is the single coordination point for all saves.
 *
 * @param dbSaveFn - Function that performs the DB save (from useProjectManager)
 * @returns true if save completed (either clean or still dirty due to concurrent edits)
 */
export async function executeDurableSave(
  dbSaveFn?: () => Promise<void>,
): Promise<boolean> {
  const dirtyState = useDirtyStore.getState();

  // Build save token BEFORE starting — validates project scope
  const saveToken = dirtyState.buildSaveToken();

  // SINGLE-FLIGHT GUARD: If a save is already in progress, defer.
  if (dirtyState.saveStatus === 'saving') {
    _pendingSave = true;
    return false;
  }

  // Nothing to save if not dirty and no error
  if (!dirtyState.dirty && dirtyState.saveStatus !== 'error') {
    return true;
  }

  try {
    // ── Step 1: Start saving — capture revision ──
    useDirtyStore.getState().startSaving();
    useCanvaStore.setState({ _saveStatus: 'saving' });

    // ── Step 2: Always save to localStorage as a backup ──
    useCanvaStore.getState().saveToStorage();
    useAuthoringStore.getState().saveToStorage();

    // ── Step 3: DB save (durable) ──
    if (saveToken.projectId && dbSaveFn) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      if (isOffline) {
        // Offline: enqueue for later sync
        enqueueSave(saveToken.projectId, buildSyncPayload());
      } else {
        // Online: save to DB directly with rate limit
        const now = Date.now();
        if (now - _lastDBSaveTime >= DB_SAVE_MIN_INTERVAL) {
          _lastDBSaveTime = now;
          await dbSaveFn();
        }
      }
    }

    // ── Step 4: Validate save token — reject stale saves ──
    // If the project was switched while we were saving, discard the result.
    if (!useDirtyStore.getState().isSaveTokenValid(saveToken)) {
      logger.warn('DurableSave', 'Stale save token — project switched during save, discarding result');
      return false;
    }

    // ── Step 5: Mark save succeeded ──
    const fullyClean = useDirtyStore.getState().saveSucceeded();

    if (fullyClean) {
      useCanvaStore.setState({ _saveStatus: 'saved' });

      // ── Post-save hash verification ──
      try {
        const savedPages = useCanvaStore.getState().pages;
        const currentHash = computePagesHash(savedPages);
        const previousHash = useCanvaStore.getState()._pagesHashAtSave;
        if (previousHash && currentHash !== previousHash) {
          logger.warn('DurableSave', 'Hash mismatch after save — possible write corruption');
        }
      } catch {
        // Hash verification is best-effort
      }

      // Auto-hide "saved" indicator
      if (_hideSavedTimer) clearTimeout(_hideSavedTimer);
      _hideSavedTimer = setTimeout(() => {
        const current = useDirtyStore.getState().saveStatus;
        if (current === 'saved') {
          useCanvaStore.setState({ _saveStatus: 'unsaved' });
        }
      }, HIDE_SAVED_MS);
    } else {
      // Edits happened during save — still dirty
      useCanvaStore.setState({ _saveStatus: 'unsaved' });
    }

    return true;
  } catch (error) {
    logger.error('DurableSave', error);

    // Mark save as failed — dirty stays true, recovery snapshot preserved
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    useDirtyStore.getState().saveFailed(errorMsg);
    useCanvaStore.setState({ _saveStatus: 'error' });

    // Show error toast (throttled)
    const now = Date.now();
    if (now - _lastErrorToastTime >= ERROR_TOAST_MIN_INTERVAL) {
      _lastErrorToastTime = now;
      toast.error('Gagal menyimpan. Periksa koneksi internet Anda.');
    }

    return false;
  } finally {
    // ── After save completes, check if a pending save is needed ──
    if (_pendingSave) {
      _pendingSave = false;
      const currentDirty = useDirtyStore.getState();
      if (currentDirty.dirty) {
        // Schedule next save immediately (no debounce — edits happened during save)
        executeDurableSave(dbSaveFn);
      }
    }
  }
}

/**
 * Schedule an auto-save with debounce.
 * Called by the store subscription when data changes.
 */
export function scheduleAutoSave(
  dbSaveFn?: () => Promise<void>,
): void {
  // Mark as "unsaved" immediately so UI responds
  const currentStatus = useDirtyStore.getState().saveStatus;
  if (currentStatus !== 'saving') {
    useCanvaStore.setState({ _saveStatus: 'unsaved' });
  }

  if (_debounceTimer) clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(() => {
    executeDurableSave(dbSaveFn);
  }, DEBOUNCE_MS);

  // Reset max-wait timer
  if (_maxWaitTimer) clearTimeout(_maxWaitTimer);
  _maxWaitTimer = setTimeout(() => {
    const currentStatus = useDirtyStore.getState().saveStatus;
    if (currentStatus === 'dirty') {
      executeDurableSave(dbSaveFn);
    }
  }, MAX_WAIT_MS);
}

/**
 * Cancel all pending auto-save timers.
 * Call on project switch to prevent stale saves.
 */
export function cancelAutoSaveTimers(): void {
  if (_debounceTimer) {
    clearTimeout(_debounceTimer);
    _debounceTimer = null;
  }
  if (_maxWaitTimer) {
    clearTimeout(_maxWaitTimer);
    _maxWaitTimer = null;
  }
  _pendingSave = false;
}

/**
 * Full cleanup of all timers. Call on component unmount.
 */
export function disposeSaveCoordinator(): void {
  cancelAutoSaveTimers();
  if (_hideSavedTimer) {
    clearTimeout(_hideSavedTimer);
    _hideSavedTimer = null;
  }
}
