'use client';

// ═══════════════════════════════════════════════════════════════════
// SAFE MODE BANNER — FASE 6 reactive safe mode indicator
// ═══════════════════════════════════════════════════════════════════
// Reads safeMode from canva store (reactive) instead of only
// sessionStorage. Supports exit action via the store method.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { AlertTriangle, X, ShieldCheck } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';

export function SafeModeBanner() {
  const safeMode = useCanvaStore((s) => s.safeMode);
  const exitSafeMode = useCanvaStore((s) => s.exitSafeMode);
  const [visible, setVisible] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (safeMode) {
      setVisible(true);
      setShowExitConfirm(false);
    }
  }, [safeMode]);

  if (!visible || !safeMode) return null;

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

  return (
    <div className="fixed top-0 left-0 right-0 z-[150] bg-amber-500/90 text-amber-950 px-4 py-1.5 flex items-center justify-between text-xs font-medium backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} className="shrink-0" />
        <span>Mode Aman aktif — beberapa fitur dinonaktifkan untuk mencegah kerusakan data</span>
      </div>
      <div className="flex items-center gap-2">
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
              <ShieldCheck size={12} />
              Nonaktifkan
            </button>
            <button
              onClick={handleDismiss}
              className="hover:bg-amber-600/30 rounded p-0.5 transition-colors"
              aria-label="Tutup banner"
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
