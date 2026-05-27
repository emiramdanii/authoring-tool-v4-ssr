'use client';

// ═══════════════════════════════════════════════════════════════════
// KONTEN OVERFLOW BANNER — Compact overflow warning for Konten tabs
// ═══════════════════════════════════════════════════════════════════
// Phase 4: Shows a compact warning when content exceeds page capacity.
// Unlike the full OverflowWarningBanner in the right panel (which has
// Compress / Split / Keep buttons), this is a streamlined notification
// for the Konten panel with a single action: navigate to the canvas
// to see the overflow and fix it.
// ═══════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { useOverflowWarningStore } from '@/store/overflow-warning-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';

export function KontenOverflowBanner() {
  const warning = useOverflowWarningStore(s => s.lastWarning);
  const bannerVisible = useOverflowWarningStore(s => s.bannerVisible);
  const clearWarning = useOverflowWarningStore(s => s.clearWarning);
  const hideBanner = useOverflowWarningStore(s => s.hideBanner);

  const handleDismiss = useCallback(() => {
    clearWarning();
  }, [clearWarning]);

  const handleGoToCanvas = useCallback(() => {
    // Navigate to canvas panel to see the overflow
    useAuthoringStore.getState().setActivePanel('canva');
    hideBanner();
  }, [hideBanner]);

  if (!warning || !bannerVisible) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 overflow-hidden animate-in slide-in-from-top-2 duration-200">
      <div className="px-3 py-2 flex items-center gap-2">
        <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-amber-300">
            Konten melebihi kapasitas halaman
          </div>
          <div className="text-[10px] text-amber-200/70 mt-0.5 leading-relaxed truncate">
            {warning.details.summary}
          </div>
        </div>
        <button
          onClick={handleGoToCanvas}
          className="flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-semibold
                     bg-amber-500/20 text-amber-200 border border-amber-500/30
                     hover:bg-amber-500/30 transition-colors
                     inline-flex items-center gap-1"
        >
          Lihat <ArrowRight size={10} />
        </button>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-amber-200/50 hover:text-amber-200 transition-colors"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
