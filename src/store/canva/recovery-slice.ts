// ═══════════════════════════════════════════════════════════════════
// CANVA STORE — Recovery slice (FASE 6)
// ═══════════════════════════════════════════════════════════════════
// Integrates the Recovery Layer into the canva store:
//   - Safe mode flag (reactive, synced with sessionStorage)
//   - Transaction begin/commit/rollback for multi-step operations
//   - Integrity check status
//   - Crash checkpoint coordination
//
// DESIGN: Recovery is ALWAYS non-destructive. Rollback only restores
// to a previously-saved checkpoint — never creates new data.
// ═══════════════════════════════════════════════════════════════════

import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import {
  transactionRollback,
  saveCrashCheckpoint,
  clearCrashRecovery,
  validateAndRepairPages,
  computePagesHash,
} from '@/core/recovery';
import type { PageValidationResult } from '@/core/recovery';
import { logger } from '@/core/utils/logger';

// ── Types ────────────────────────────────────────────────────────

export interface RecoverySlice {
  // ── Safe Mode ──────────────────────────────────────────────────
  /** Whether the app is in safe mode (degraded features due to corruption) */
  safeMode: boolean;
  /** Enter safe mode — disables complex features to prevent further corruption */
  enterSafeMode: (reason?: string) => void;
  /** Exit safe mode — re-enables all features after user confirms data is OK */
  exitSafeMode: () => void;

  // ── Transaction Rollback ───────────────────────────────────────
  /** Active transaction ID (null = no active transaction) */
  _activeTransactionId: string | null;
  /** Begin a recoverable transaction — saves checkpoint before operation */
  beginTransaction: (description: string) => string;
  /** Commit a transaction — clears its checkpoint (operation succeeded) */
  commitTransaction: (transactionId: string) => void;
  /** Rollback a transaction — restores pages to pre-transaction state */
  rollbackTransaction: (transactionId: string) => void;

  // ── Integrity ──────────────────────────────────────────────────
  /** Last integrity check result (null = never checked) */
  _lastIntegrityResult: PageValidationResult | null;
  /** Run integrity check on all pages now */
  runIntegrityCheckNow: () => PageValidationResult;
  /** Hash of pages at last save (for corruption detection) */
  _pagesHashAtSave: string;
}

// ── Safe Mode Helpers ────────────────────────────────────────────

function syncSafeModeToSession(safeMode: boolean): void {
  try {
    if (safeMode) {
      sessionStorage.setItem('silse_safe_mode', '1');
    } else {
      sessionStorage.removeItem('silse_safe_mode');
    }
  } catch { /* ignore */ }
}

function readSafeModeFromSession(): boolean {
  try {
    return sessionStorage.getItem('silse_safe_mode') === '1';
  } catch {
    return false;
  }
}

// ── Toast helper (lazy-loaded to avoid circular deps) ─────────────

function showToast(type: 'warning' | 'success' | 'info', title: string, description?: string): void {
  try {
    const { toast } = require('sonner');
    if (type === 'warning') toast.warning(title, { description, duration: 5000 });
    else if (type === 'success') toast.success(title, { description, duration: 3000 });
    else toast.info(title, { description, duration: 3000 });
  } catch { /* ignore */ }
}

// ── Slice ────────────────────────────────────────────────────────

export const createRecoverySlice: StateCreator<CanvaState, [], [], RecoverySlice> = (set, get) => ({
  // ── Safe Mode ──────────────────────────────────────────────────
  safeMode: typeof window !== 'undefined' ? readSafeModeFromSession() : false,

  enterSafeMode: (reason?: string) => {
    set({ safeMode: true });
    syncSafeModeToSession(true);
    showToast('warning', 'Mode Aman aktif',
      reason || 'Beberapa fitur dinonaktifkan untuk mencegah kerusakan data.');
  },

  exitSafeMode: () => {
    set({ safeMode: false });
    syncSafeModeToSession(false);
    showToast('success', 'Mode Aman dinonaktifkan', 'Semua fitur kembali aktif.');
  },

  // ── Transaction Rollback ───────────────────────────────────────
  _activeTransactionId: null,

  beginTransaction: (description: string) => {
    const { pages, ratioId } = get();

    // Save crash checkpoint before the transaction
    saveCrashCheckpoint(pages, ratioId, `transaction:${description}`);

    // Save transaction checkpoint for rollback
    const txId = transactionRollback.checkpoint(pages, ratioId, description);

    set({ _activeTransactionId: txId });

    return txId;
  },

  commitTransaction: (transactionId: string) => {
    // Clear the transaction checkpoint (operation succeeded)
    transactionRollback.commit(transactionId);

    // Clear crash checkpoint too (no longer needed)
    try { clearCrashRecovery(); } catch { /* ignore */ }

    const activeId = get()._activeTransactionId;
    if (activeId === transactionId) {
      set({ _activeTransactionId: null });
    }
  },

  rollbackTransaction: (transactionId: string) => {
    const checkpoint = transactionRollback.rollback(transactionId);
    if (!checkpoint) {
      logger.warn('Recovery', 'No checkpoint found for transaction: ' + transactionId);
      return;
    }

    // Restore pages from checkpoint
    try {
      const restoredPages = checkpoint.pages as CanvaState['pages'];
      set({
        pages: restoredPages,
        ratioId: checkpoint.ratioId,
        _activeTransactionId: null,
      });

      showToast('info', 'Transaksi dibatalkan', `Kembali ke: ${checkpoint.description}`);
    } catch (err) {
      logger.error('Recovery', 'Failed to rollback transaction: ' + String(err));
      // Don't throw — recovery must be non-destructive
    }
  },

  // ── Integrity ──────────────────────────────────────────────────
  _lastIntegrityResult: null,
  _pagesHashAtSave: '',

  runIntegrityCheckNow: () => {
    const { pages } = get();
    const result = validateAndRepairPages(pages as unknown as Array<{ id: string; schema?: any; [k: string]: unknown }>, { autoRepair: true });

    // If repairs were made, update the pages in the store
    if (result.repairedPages > 0) {
      set({
        pages: [...pages], // Trigger re-render with repaired pages
        _lastIntegrityResult: result,
      });

      // Enter safe mode if there were repairs
      get().enterSafeMode(
        `${result.repairedPages} halaman diperbaiki otomatis`
      );
    } else if (result.corruptedPages > 0 && result.repairedPages === 0) {
      // Corruption detected but couldn't repair — definitely enter safe mode
      set({ _lastIntegrityResult: result });
      get().enterSafeMode(
        `${result.corruptedPages} halaman tidak dapat diperbaiki`
      );
    } else {
      set({ _lastIntegrityResult: result });
    }

    // Compute hash for next verification
    const hash = computePagesHash(pages);
    set({ _pagesHashAtSave: hash });

    return result;
  },
});
