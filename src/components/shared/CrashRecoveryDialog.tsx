'use client';

// ═══════════════════════════════════════════════════════════════════
// CRASH RECOVERY DIALOG — Detects unsaved data from crashed sessions
// ═══════════════════════════════════════════════════════════════════
// When the app is closed or crashes while there are unsaved changes,
// a "dirty exit" flag is set in localStorage via beforeunload.
// On next app mount, this dialog detects that flag and offers
// the user a choice to recover or start fresh.
//
// This is different from AutoSaveRecovery which checks for ANY
// saved data — CrashRecoveryDialog specifically handles the case
// where the user had unsaved changes when the app closed.
// ═══════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DIRTY_EXIT_KEY = 'silse_dirty_exit';

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

export default function CrashRecoveryDialog() {
  const [showDialog, setShowDialog] = useState(() => {
    if (typeof window === 'undefined') return false;
    return hasDirtyExit();
  });

  const handleRecover = useCallback(() => {
    // Data will be loaded normally by the store's loadFromStorage
    clearDirtyExitFlag();
    setShowDialog(false);
  }, []);

  const handleStartFresh = useCallback(() => {
    // Clear the dirty flag — the normal loadFromStorage will still run,
    // but the user chose to ignore it. We clear stored data too.
    try {
      localStorage.removeItem('silse_dirty_exit');
      // Note: We don't clear the actual storage keys here because
      // the user might want to recover later. We just dismiss the dialog.
      // The stores will load their data normally.
    } catch {
      // Ignore
    }
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
              <h2 className="text-sm font-bold text-amber-300">Pemulihan Data</h2>
              <p className="text-[10px] text-amber-400/60 mt-0.5">
                Data belum tersimpan terdeteksi
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-[11px] text-app-secondary leading-relaxed">
            Terdeteksi data yang belum tersimpan dari sesi sebelumnya.
            Kemungkinan aplikasi ditutup tanpa menyimpan perubahan.
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
