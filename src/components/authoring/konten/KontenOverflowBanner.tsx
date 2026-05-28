'use client';

// ═══════════════════════════════════════════════════════════════════
// KONTEN OVERFLOW BANNER — Compact overflow warning for Konten tabs
// ═══════════════════════════════════════════════════════════════════
// Phase 4: Shows a compact warning when content exceeds page capacity.
// Unlike the full OverflowWarningBanner in the right panel (which has
// Compress / Split / Keep buttons), this is a streamlined notification
// for the Konten panel with direct action buttons.
//
// Actions available:
//   - Kompakkan (Compress): rebalanceCurrentPage() if canCompress
//   - Split: promoteSceneSplitToPage() if canSplit
//   - Lihat (See): navigate to canvas for manual fix
//   - Abaikan (Dismiss): hide the banner
// ═══════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useOverflowWarningStore } from '@/store/overflow-warning-store';
import { useCanvaStore } from '@/store/canva-store';
import { promoteSceneSplitToPage } from '@/core/schema/schema-apply';
import { AlertTriangle, X, ArrowRight, Minimize2, SplitSquareHorizontal } from 'lucide-react';

export function KontenOverflowBanner() {
  const warning = useOverflowWarningStore(s => s.lastWarning);
  const bannerVisible = useOverflowWarningStore(s => s.bannerVisible);
  const clearWarning = useOverflowWarningStore(s => s.clearWarning);
  const hideBanner = useOverflowWarningStore(s => s.hideBanner);

  const handleDismiss = useCallback(() => {
    clearWarning();
  }, [clearWarning]);

  const handleGoToCanvas = useCallback(() => {
    // Phase 3: Use CanvaStore panelRequest instead of useAuthoringStore.setActivePanel
    useCanvaStore.setState({ panelRequest: 'canva' });
    hideBanner();
  }, [hideBanner]);

  const handleCompress = useCallback(() => {
    if (!warning) return;
    try {
      const store = useCanvaStore.getState();
      // Navigate to the overflowing page first
      const pageIdx = store.pages.findIndex(p => p.id === warning.pageId);
      if (pageIdx >= 0) {
        useCanvaStore.setState({ currentPageIndex: pageIdx });
        store.rebalanceCurrentPage();
        toast.success('Halaman dikompres — konten dipadatkan agar muat');
        clearWarning();
      }
    } catch (err) {
      toast.error('Gagal mengompres halaman');
    }
  }, [warning, clearWarning]);

  const handleSplit = useCallback(() => {
    if (!warning?.details.scenePlan) return;
    try {
      const result = promoteSceneSplitToPage(
        warning.pageId,
        warning.details.scenePlan,
        1,
      );
      if (result.success && result.pageUpdated) {
        toast.success('Konten di-split ke halaman baru');
        clearWarning();
      } else {
        toast.error('Gagal split halaman: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      toast.error('Gagal split halaman');
    }
  }, [warning, clearWarning]);

  if (!warning || !bannerVisible) return null;

  const { canSplit, canCompress } = warning.details;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 overflow-hidden animate-in slide-in-from-top-2 duration-200">
      <div className="px-3 py-2">
        {/* Header row */}
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-amber-300">
              Konten melebihi kapasitas halaman
            </div>
            <div className="text-[10px] text-amber-200/70 mt-0.5 leading-relaxed">
              {warning.details.summary}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-amber-200/50 hover:text-amber-200 transition-colors"
          >
            <X size={12} />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 mt-2">
          {canCompress && (
            <button
              onClick={handleCompress}
              className="px-2 py-1 rounded-md text-[10px] font-semibold
                         bg-cyan-500/20 text-cyan-200 border border-cyan-500/30
                         hover:bg-cyan-500/30 transition-colors
                         inline-flex items-center gap-1"
            >
              <Minimize2 size={9} /> Kompakkan
            </button>
          )}
          {canSplit && (
            <button
              onClick={handleSplit}
              className="px-2 py-1 rounded-md text-[10px] font-semibold
                         bg-green-500/20 text-green-200 border border-green-500/30
                         hover:bg-green-500/30 transition-colors
                         inline-flex items-center gap-1"
            >
              <SplitSquareHorizontal size={9} /> Split Halaman
            </button>
          )}
          <button
            onClick={handleGoToCanvas}
            className="px-2.5 py-1 rounded-md text-[10px] font-semibold
                       bg-amber-500/20 text-amber-200 border border-amber-500/30
                       hover:bg-amber-500/30 transition-colors
                       inline-flex items-center gap-1"
          >
            Lihat <ArrowRight size={9} />
          </button>
        </div>
      </div>
    </div>
  );
}
