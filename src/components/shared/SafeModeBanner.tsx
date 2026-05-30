'use client';

// ═══════════════════════════════════════════════════════════════════
// SAFE MODE BANNER — FASE 6 reactive safe mode indicator
// ═══════════════════════════════════════════════════════════════════
// Reads safeMode from canva store (reactive). Supports:
//   - Exit action via the store method (with confirmation)
//   - Integrity check results display
//   - "Run Check" button to manually verify data integrity
//   - Auto-dismiss when safe mode is turned off
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X, ShieldCheck, Activity, ShieldOff } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import type { PageValidationResult } from '@/core/recovery';

export function SafeModeBanner() {
  const safeMode = useCanvaStore((s) => s.safeMode);
  const exitSafeMode = useCanvaStore((s) => s.exitSafeMode);
  const runIntegrityCheckNow = useCanvaStore((s) => s.runIntegrityCheckNow);
  const _lastIntegrityResult = useCanvaStore((s) => s._lastIntegrityResult);

  const [visible, setVisible] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lastResult, setLastResult] = useState<PageValidationResult | null>(null);

  useEffect(() => {
    if (safeMode) {
      setVisible(true);
      setShowExitConfirm(false);
      // Show latest integrity result when entering safe mode
      if (_lastIntegrityResult) {
        setLastResult(_lastIntegrityResult);
      }
    }
  }, [safeMode, _lastIntegrityResult]);

  const handleRunCheck = useCallback(() => {
    setChecking(true);
    try {
      const result = runIntegrityCheckNow();
      setLastResult(result);
    } catch {
      // Ignore — integrity check is non-destructive
    } finally {
      setChecking(false);
    }
  }, [runIntegrityCheckNow]);

  const handleExit = () => {
    if (!showExitConfirm) {
      setShowExitConfirm(true);
      return;
    }
    // Confirmed — exit safe mode
    exitSafeMode();
    setVisible(false);
    setShowExitConfirm(false);
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible || !safeMode) return null;

  // Build integrity summary
  const integritySummary = lastResult
    ? `${lastResult.validPages}/${lastResult.totalPages} sehat` +
      (lastResult.repairedPages > 0 ? `, ${lastResult.repairedPages} diperbaiki` : '') +
      (lastResult.corruptedPages > 0 ? `, ${lastResult.corruptedPages} rusak` : '')
    : null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[150] bg-amber-500/90 text-amber-950 px-4 py-1.5 flex items-center justify-between text-xs font-medium backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined shrink-0" style={ { fontSize: '14px' } }>warning</span>
        <span>Mode Aman aktif — beberapa fitur dinonaktifkan untuk mencegah kerusakan data</span>
        {integritySummary && (
          <span className="text-[10px] text-amber-800/70 ml-2 border-l border-amber-800/30 pl-2">
            {integritySummary}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Run integrity check button */}
        <button
          onClick={handleRunCheck}
          disabled={checking}
          className="flex items-center gap-1 hover:bg-amber-600/30 rounded px-2 py-0.5 transition-colors"
          title="Jalankan pengecekan integritas"
        >
          <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>monitoring</span>
          <span className="text-[10px]">{checking ? 'Memeriksa...' : 'Cek Integritas'}</span>
        </button>

        {showExitConfirm ? (
          <>
            <span className="text-[10px] text-amber-800">Nonaktifkan mode aman?</span>
            <button
              onClick={handleExit}
              className="flex items-center gap-1 bg-emerald-500/30 hover:bg-emerald-500/50 rounded px-2 py-0.5 transition-colors"
            >
              <ShieldCheck size={12} />
              Ya
            </button>
            <button
              onClick={() => setShowExitConfirm(false)}
              className="hover:bg-amber-600/30 rounded px-2 py-0.5 transition-colors"
            >
              Batal
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleExit}
              className="hover:bg-amber-600/30 rounded px-2 py-0.5 transition-colors flex items-center gap-1"
            >
              <ShieldOff size={12} />
              Nonaktifkan
            </button>
            <button
              onClick={handleDismiss}
              className="hover:bg-amber-600/30 rounded p-0.5 transition-colors"
              aria-label="Tutup banner"
            >
              <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>close</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
