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
// Sprint 7.2A-Patch: Durable-Save Coordinator
// ═══════════════════════════════════════════════════════════════════
// Single entry point for ALL saves (auto-save, Ctrl+S, SaveNowButton,
// save-before-switch). Routes through the same revision-based
// state machine with project-scoped save tokens.
//
// P0-1 Fix: Only executeDurableSave() owns the save lifecycle
//   (startSaving → dbSaveFn → saveSucceeded/saveFailed).
//   The dbSaveFn must be a pure persistence primitive that throws
//   on error and does NOT touch the state machine.
//
// P0-2 Fix: dbSaveFn errors propagate as exceptions, ensuring
//   failed saves are never marked as clean.
//
// P0-3 Fix: No rate-limit/throttle on durable-save path.
//   Debounce on autosave is sufficient. If a save is needed,
//   it MUST actually reach the DB — skipping it and marking
//   clean is data loss.
//
// Guarantees:
//   1. Only one save in-flight at a time (single-flight)
//   2. Stale saves (wrong project or superseded revision) are rejected
//   3. localStorage backup always runs first (crash recovery)
//   4. DB save only when projectId exists and we're online
//   5. saveSucceeded() only clears dirty if revision matches
//   6. saveSucceeded() with null savingRevision is a no-op (P0-1)
// ═══════════════════════════════════════════════════════════════════

const DEBOUNCE_MS = 2000;
const MAX_WAIT_MS = 30000;
const HIDE_SAVED_MS = 3000;
const ERROR_TOAST_MIN_INTERVAL = 10000;

/** Coordinator state — module-level singleton */
let _debounceTimer: ReturnType<typeof setTimeout> | null = null;
let _maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
let _hideSavedTimer: ReturnType<typeof setTimeout> | null = null;
let _pendingSave = false;
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
 * P0-1 Fix: This is the ONLY place that owns the save lifecycle:
 *   startSaving() → dbSaveFn() → saveSucceeded()/saveFailed()
 * The dbSaveFn must be a pure persistence primitive (no lifecycle calls).
 *
 * P0-3 Fix: No rate-limit. If a save is needed, it reaches the DB.
 * Debounce on autosave handles timing; skipping saves is data loss.
 *
 * @param dbSaveFn - Pure persistence function (build payload + fetch + throw on error)
 * @param options - Optional: { force: true } to save even when not dirty (e.g., createProject)
 * @returns true if save completed, false if failed or deferred
 */
export async function executeDurableSave(
  dbSaveFn?: () => Promise<void>,
  options?: { force?: boolean },
): Promise<boolean> {
  const dirtyState = useDirtyStore.getState();

  // Build save token BEFORE starting — validates project scope
  const saveToken = dirtyState.buildSaveToken();

  // SINGLE-FLIGHT GUARD: If a save is already in progress, defer.
  if (dirtyState.saveStatus === 'saving') {
    _pendingSave = true;
    return false;
  }

  // Nothing to save if not dirty and no error (unless force=true)
  if (!dirtyState.dirty && dirtyState.saveStatus !== 'error' && !options?.force) {
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
    // P0-3 Fix: No rate-limit. If we need to save, we save.
    // The dbSaveFn is a pure persistence primitive — it does NOT
    // call startSaving/saveSucceeded/saveFailed. It just builds
    // the payload, fetches, and throws on error.
    if (saveToken.projectId && dbSaveFn) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      if (isOffline) {
        // Offline: enqueue for later sync
        enqueueSave(saveToken.projectId, buildSyncPayload());
      } else {
        // Online: save to DB directly — no rate limit
        await dbSaveFn();
      }
    }

    // ── Step 4: Validate save token — reject stale saves ──
    // If the project was switched while we were saving, discard the result.
    if (!useDirtyStore.getState().isSaveTokenValid(saveToken)) {
      logger.warn('DurableSave', 'Stale save token — project switched during save, discarding result');
      return false;
    }

    // ── Step 5: Mark save succeeded ──
    // P0-1 Fix: saveSucceeded() with null savingRevision is now a no-op.
    // This prevents double-lifecycle bugs where a stale saveSucceeded()
    // call incorrectly marks the project clean.
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

    // Patch-4 P0-3a Fix: Return the ACTUAL clean state.
    // If saveSucceeded() returned false (edits happened during save),
    // the project is still dirty. Callers (especially flushDurableSave)
    // need to know the project isn't fully saved yet.
    // Previously we always returned true, which meant flushDurableSave
    // would report success even when the project was still dirty.
    return fullyClean;
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
 * Flush any in-flight save and ensure the project is fully saved.
 * Used by save-before-switch to guarantee data is persisted before
 * loading a different project.
 *
 * P0-4 Fix: This function WAITS for any in-flight save to complete,
 * then loops until the project is fully clean. If any save attempt
 * fails, returns false. If the project keeps getting edited during
 * saves, we keep retrying up to a maximum number of attempts.
 *
 * Patch-4 P0-3b Fix: Loop until actually clean (dirty === false).
 * Previously, executeDurableSave returned true even when the project
 * was still dirty (edits happened during save). flushDurableSave
 * would then report success, allowing a project switch with unsaved
 * data. Now we loop: save → check dirty → save again if needed.
 *
 * P1 Hardening: When executeDurableSave() returns false because
 * save succeeded but edits happened during save (still dirty),
 * we continue looping instead of returning false immediately.
 * Only hard failures (error / project change / max attempts)
 * cause an early return of false. This ensures flush retries
 * until the project is truly clean, so the user doesn't need
 * to manually retry a project switch.
 *
 * @param dbSaveFn - Pure persistence function (same as executeDurableSave)
 * @returns true if project is clean, false if save failed
 */
const MAX_FLUSH_ATTEMPTS = 5;

export async function flushDurableSave(dbSaveFn?: () => Promise<void>): Promise<boolean> {
  const dirtyState = useDirtyStore.getState();

  // If a save is in-flight, wait for it to complete
  if (dirtyState.saveStatus === 'saving') {
    await new Promise<void>((resolve) => {
      const unsubscribe = useDirtyStore.subscribe((state) => {
        if (state.saveStatus !== 'saving') {
          unsubscribe();
          resolve();
        }
      });
      // Safety timeout — don't wait forever (30s max)
      setTimeout(() => {
        unsubscribe();
        resolve();
      }, 30000);
    });
  }

  let afterState = useDirtyStore.getState();

  // If save failed, return false — don't switch projects
  if (afterState.saveStatus === 'error') {
    return false;
  }

  // Patch-4 P0-3b Fix: Loop until clean.
  // Each iteration: if dirty → executeDurableSave → recheck.
  // Break on: clean (success), error (fail), max attempts (fail),
  // or project change (fail — should not switch projects).
  const projectIdAtStart = afterState.currentProjectId;

  for (let attempt = 0; attempt < MAX_FLUSH_ATTEMPTS; attempt++) {
    afterState = useDirtyStore.getState();

    // Project changed mid-flush — abort
    if (afterState.currentProjectId !== projectIdAtStart) {
      return false;
    }

    // Error state — abort
    if (afterState.saveStatus === 'error') {
      return false;
    }

    // Clean — done!
    if (!afterState.dirty) {
      return true;
    }

    // Still dirty — attempt save
    await executeDurableSave(dbSaveFn);

    // P1 Hardening: Don't return on executeDurableSave() === false.
    // A false return can mean "save succeeded but edits happened during save"
    // (still dirty). We must re-check state instead of aborting, because:
    //   - If error → caught by saveStatus === 'error' above on next iteration
    //   - If project changed → caught by projectId check above on next iteration
    //   - If still dirty from edit-during-save → loop will try again
    //   - If clean → !dirty check above will return true on next iteration
    //
    // Only abort on hard failures (error / project change), not on
    // "saved but still dirty" (which just means we need another iteration).
  }

  // Max attempts reached — project is still dirty
  logger.warn('DurableSave', `flushDurableSave: max attempts (${MAX_FLUSH_ATTEMPTS}) reached, project still dirty`);
  return false;
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
