'use client';

// ═══════════════════════════════════════════════════════════════════
// UNSAVED CHANGES GUARD — Prevents accidental data loss
// ═══════════════════════════════════════════════════════════════════
// Provides:
//   1. Browser beforeunload guard (tab close / refresh)
//   2. In-app navigation guard (panel switching with confirmation)
//   3. Session heartbeat — marks session active for crash detection
//   4. Storage quota monitoring — warns when localStorage is near full
//
// This hook replaces the scattered beforeunload logic that was
// duplicated in AuthoringTool and RecoveryDialog.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useCallback, useRef } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import {
  setDirtyExitFlag,
  clearDirtyExitFlag,
  markSessionActive,
  markSessionCleanExit,
} from '@/components/shared/RecoveryDialog';
import { toast } from 'sonner';

// ── Storage quota check ──────────────────────────────────────────
const STORAGE_QUOTA_WARNING = 0.8; // Warn at 80% of estimated quota
const STORAGE_CHECK_INTERVAL = 30_000; // Check every 30 seconds
const ESTIMATED_QUOTA_MB = 5; // Most browsers allow ~5MB localStorage

function estimateStorageUsage(): number {
  if (typeof window === 'undefined') return 0;
  try {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key) || '';
      totalBytes += key.length + value.length;
    }
    // Convert to MB (2 bytes per char for UTF-16)
    return (totalBytes * 2) / (1024 * 1024);
  } catch {
    return 0;
  }
}

// ── Session heartbeat ────────────────────────────────────────────
const HEARTBEAT_INTERVAL = 60_000; // 1 minute

export function useUnsavedGuard() {
  const quotaWarningShown = useRef(false);

  // ── Check if there are unsaved changes ────────────────────────
  const hasUnsavedChanges = useCallback((): boolean => {
    return useAuthoringStore.getState().dirty ||
      useCanvaStore.getState()._saveStatus === 'unsaved';
  }, []);

  // ── Confirm navigation away (in-app) ──────────────────────────
  const confirmNavigation = useCallback((): boolean => {
    if (!hasUnsavedChanges()) return true;

    // Show a confirmation dialog
    const confirmed = window.confirm(
      'Perubahan belum tersimpan. Yakin ingin pindah? Data yang belum disimpan mungkin hilang.'
    );
    return confirmed;
  }, [hasUnsavedChanges]);

  // ── Set up all guards ─────────────────────────────────────────
  useEffect(() => {
    // 1. Browser beforeunload guard
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        setDirtyExitFlag();
        e.preventDefault();
        e.returnValue = 'Perubahan belum tersimpan. Yakin ingin keluar?';
      }
      markSessionCleanExit();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2. Session heartbeat — marks session as active periodically
    // This helps RecoveryDialog detect crashes on next load
    markSessionActive();
    const heartbeatTimer = setInterval(() => {
      if (hasUnsavedChanges()) {
        markSessionActive();
      }
    }, HEARTBEAT_INTERVAL);

    // 3. Mark active on first user interaction
    const markActiveOnce = () => {
      markSessionActive();
      window.removeEventListener('mousedown', markActiveOnce);
      window.removeEventListener('keydown', markActiveOnce);
      window.removeEventListener('touchstart', markActiveOnce);
    };
    window.addEventListener('mousedown', markActiveOnce, { once: true });
    window.addEventListener('keydown', markActiveOnce, { once: true });
    window.addEventListener('touchstart', markActiveOnce, { once: true });

    // 4. Storage quota monitoring
    const checkQuota = () => {
      const usage = estimateStorageUsage();
      const ratio = usage / ESTIMATED_QUOTA_MB;
      if (ratio > STORAGE_QUOTA_WARNING && !quotaWarningShown.current) {
        quotaWarningShown.current = true;
        toast.warning(
          `Penyimpanan hampir penuh (${(usage).toFixed(1)}MB dari ~${ESTIMATED_QUOTA_MB}MB). ` +
          'Simpan proyek ke database untuk mengosongkan ruang.',
          { duration: 8000 }
        );
      } else if (ratio < STORAGE_QUOTA_WARNING * 0.7) {
        // Reset warning if usage drops significantly (user saved/cleared)
        quotaWarningShown.current = false;
      }
    };
    checkQuota();
    const quotaTimer = setInterval(checkQuota, STORAGE_CHECK_INTERVAL);

    // 5. Clear dirty flag on visibility change (page hidden = clean exit)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (hasUnsavedChanges()) {
          setDirtyExitFlag();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 6. On error — attempt emergency save
    const handleError = () => {
      try {
        const canvaState = useCanvaStore.getState();
        if (canvaState.pages?.length > 0) {
          localStorage.setItem('silse_app_error_recovery', JSON.stringify({
            pages: canvaState.pages,
            ratioId: canvaState.ratioId,
            _emergencySavedAt: Date.now(),
            _source: 'useUnsavedGuard',
          }));
        }
      } catch { /* best effort */ }
    };

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('mousedown', markActiveOnce);
      window.removeEventListener('keydown', markActiveOnce);
      window.removeEventListener('touchstart', markActiveOnce);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeatTimer);
      clearInterval(quotaTimer);
    };
  }, [hasUnsavedChanges]);

  return { hasUnsavedChanges, confirmNavigation };
}
