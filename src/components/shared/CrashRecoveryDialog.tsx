'use client';

// ═══════════════════════════════════════════════════════════════════════
// CRASH RECOVERY DIALOG — Detects unsaved data from crashed sessions
// ═══════════════════════════════════════════════════════════════════════
// Phase E.4 Enhancement:
//   - Session marker: Set on first interaction, cleared on clean exit
//   - 30-minute window: Only show recovery if data was saved recently
//   - On app load, if saved data exists with no active session marker,
//     it means the app closed/crashed without a clean exit
//   - The dialog shows: "Sesi sebelumnya terdeteksi. Pulihkan data Anda?"
//     with "Pulihkan" and "Mulai Baru" buttons
// ═══════════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Session Marker Keys ──────────────────────────────────────────────
const DIRTY_EXIT_KEY = 'silse_dirty_exit';
const SESSION_ACTIVE_KEY = 'silse_session_active';
const RECOVERY_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Check if the app exited with unsaved changes (dirty exit).
 * Returns true if the dirty exit flag is set in localStorage.
 */
export function hasDirtyExit(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DIRTY_EXIT_KEY) === '1';
}

/**
 * Clear the dirty exit flag. Called when:
 * - User chooses to recover data
 * - User chooses to start fresh
 * - Data is successfully loaded on mount
 */
export function clearDirtyExitFlag(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DIRTY_EXIT_KEY);
}

/**
 * Set the dirty exit flag. Called in beforeunload handler
 * when there are unsaved changes.
 */
export function setDirtyExitFlag(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DIRTY_EXIT_KEY, '1');
}

/**
 * Mark the session as active. Called on first user interaction.
 * This allows us to detect if a previous session ended abnormally
 * (session marker exists but app just loaded = recovery case).
 */
export function markSessionActive(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_ACTIVE_KEY, Date.now().toString());
}

/**
 * Mark the session as cleanly exited. Called on beforeunload
 * when the user is leaving normally (no unsaved changes).
 */
export function markSessionCleanExit(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_ACTIVE_KEY);
}

/**
 * Check if a previous session marker exists (indicating an
 * unclean exit — the app crashed or was force-closed).
 * Returns the timestamp of the session marker, or null if none.
 */
export function getPreviousSessionTimestamp(): number | null {
  if (typeof window === 'undefined') return null;
  const ts = localStorage.getItem(SESSION_ACTIVE_KEY);
  if (!ts) return null;
  const num = parseInt(ts, 10);
  return isNaN(num) ? null : num;
}

/**
 * Check if saved data is recent enough to offer recovery.
 * Returns true if the data was saved within the last 30 minutes.
 */
function isRecoveryDataRecent(): boolean {
  // Check canva store timestamp
  try {
    const canvaSaved = localStorage.getItem('silse_canva_v1');
    if (canvaSaved) {
      const parsed = JSON.parse(canvaSaved);
      if (parsed?._lastSavedAt) {
        const age = Date.now() - parsed._lastSavedAt;
        if (age <= RECOVERY_MAX_AGE_MS) return true;
      }
    }
  } catch {
    // Ignore parse errors
  }

  // Check authoring store timestamp
  try {
    const authoringSaved = localStorage.getItem('at_state_v1');
    if (authoringSaved) {
      const parsed = JSON.parse(authoringSaved);
      if (parsed?._lastSavedAt) {
        const age = Date.now() - parsed._lastSavedAt;
        if (age <= RECOVERY_MAX_AGE_MS) return true;
      }
    }
  } catch {
    // Ignore parse errors
  }

  // If no timestamp found but dirty exit flag is set, still offer recovery
  // (legacy data without timestamps)
  return hasDirtyExit();
}

/**
 * Check if there's meaningful saved data in localStorage that could
 * be recovered.
 */
function hasRecoverableData(): boolean {
  try {
    // Check canva store
    const canvaSaved = localStorage.getItem('silse_canva_v1');
    if (canvaSaved) {
      const parsed = JSON.parse(canvaSaved);
      if (parsed?.pages && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
        return true;
      }
    }

    // Check authoring store
    const authoringSaved = localStorage.getItem('at_state_v1');
    if (authoringSaved) {
      const parsed = JSON.parse(authoringSaved);
      const hasData =
        (parsed.tp && Array.isArray(parsed.tp) && parsed.tp.length > 0) ||
        (parsed.kuis && Array.isArray(parsed.kuis) && parsed.kuis.length > 0) ||
        (parsed.modules && Array.isArray(parsed.modules) && parsed.modules.length > 0) ||
        (parsed.alur && Array.isArray(parsed.alur) && parsed.alur.length > 0) ||
        (parsed.materi?.blok && Array.isArray(parsed.materi.blok) && parsed.materi.blok.length > 0) ||
        (parsed.cp?.capaianFase) ||
        (parsed.atp?.pertemuan && Array.isArray(parsed.atp.pertemuan) && parsed.atp.pertemuan.length > 0);
      if (hasData) return true;
    }
  } catch {
    // Corrupted data — ignore
  }

  return false;
}

export default function CrashRecoveryDialog() {
  const [showDialog, setShowDialog] = useState(() => {
    if (typeof window === 'undefined') return false;

    // Show dialog if:
    // 1. There's a previous session marker (unclean exit), OR
    // 2. The dirty exit flag is set
    // AND there's recoverable data that was saved recently
    const prevSession = getPreviousSessionTimestamp();
    const dirtyExit = hasDirtyExit();
    const hasData = hasRecoverableData();
    const isRecent = isRecoveryDataRecent();

    if (!hasData) return false;
    if (!isRecent) return false;

    // Show if there was an unclean exit or a dirty exit
    return !!(prevSession || dirtyExit);
  });

  // Set up session marker on first interaction
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Mark session as active on first user interaction
    const markActive = () => {
      markSessionActive();
      // Remove listeners after first interaction
      window.removeEventListener('mousedown', markActive);
      window.removeEventListener('keydown', markActive);
      window.removeEventListener('touchstart', markActive);
    };

    window.addEventListener('mousedown', markActive, { once: true });
    window.addEventListener('keydown', markActive, { once: true });
    window.addEventListener('touchstart', markActive, { once: true });

    // Set up beforeunload handler
    const handleBeforeUnload = () => {
      const canvaStore = localStorage.getItem('silse_canva_v1');
      const authStore = localStorage.getItem('at_state_v1');
      if (canvaStore || authStore) {
        // Mark as dirty exit (will be cleared by clean exit logic if applicable)
        setDirtyExitFlag();
      }
      // Clear session marker on clean exit
      // Note: If the user has unsaved changes, the dirty flag will remain
      // and the session marker will be cleared, indicating a potential crash
      markSessionCleanExit();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('mousedown', markActive);
      window.removeEventListener('keydown', markActive);
      window.removeEventListener('touchstart', markActive);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleRecover = useCallback(() => {
    // Data will be loaded normally by the store's loadFromStorage
    clearDirtyExitFlag();
    markSessionActive();
    setShowDialog(false);
  }, []);

  const handleStartFresh = useCallback(() => {
    // Clear the dirty flag and session marker
    clearDirtyExitFlag();
    markSessionCleanExit();
    // Note: We don't clear the actual storage keys here because
    // the user might want to recover later. We just dismiss the dialog.
    // The stores will load their data normally.
    setShowDialog(false);
  }, []);

  if (!showDialog) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm mx-4 rounded-2xl bg-app-surface border border-app-border shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <AlertTriangle size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-300">Sesi Sebelumnya Terdeteksi</h2>
              <p className="text-[10px] text-amber-400/60 mt-0.5">
                Pulihkan data Anda?
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-[11px] text-app-secondary leading-relaxed">
            Terdeteksi data yang tersimpan dari sesi sebelumnya.
            Kemungkinan aplikasi ditutup tanpa menyimpan perubahan terakhir.
          </p>
          <div className="p-3 rounded-lg bg-app-elevated/40 border border-app-border/20">
            <p className="text-[10px] text-app-muted leading-relaxed">
              Pilih &quot;Pulihkan&quot; untuk memuat data dari sesi sebelumnya,
              atau &quot;Mulai Baru&quot; untuk mengabaikan dan memulai dari data tersimpan terakhir.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-app-border/20 flex items-center gap-3">
          <Button
            onClick={handleRecover}
            className="flex-1 gap-2 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 font-bold text-[11px]"
            variant="outline"
          >
            <RotateCcw size={14} />
            Pulihkan
          </Button>
          <Button
            onClick={handleStartFresh}
            className="flex-1 gap-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 font-bold text-[11px]"
            variant="outline"
          >
            <Trash2 size={14} />
            Mulai Baru
          </Button>
        </div>
      </div>
    </div>
  );
}
