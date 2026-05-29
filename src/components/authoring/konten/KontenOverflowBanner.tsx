'use client';

// ═══════════════════════════════════════════════════════════════════
// KONTEN OVERFLOW BANNER — Compact overflow warning for Konten tabs
// ═══════════════════════════════════════════════════════════════════
// Phase 4: Shows a compact warning when content exceeds page capacity.
// Uses SILSE v4 MD3 semantic tokens (silse-tertiary for warning, 
// silse-secondary for info, silse-primary-container for success).
// ═══════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useOverflowWarningStore } from '@/store/overflow-warning-store';
import { useCanvaStore } from '@/store/canva-store';
import { promoteSceneSplitToPage } from '@/core/schema/schema-apply';
// All icons migrated to Material Symbols Outlined
export function KontenOverflowBanner() {
  const warning = useOverflowWarningStore(s => s.lastWarning);
  const bannerVisible = useOverflowWarningStore(s => s.bannerVisible);
  const clearWarning = useOverflowWarningStore(s => s.clearWarning);
  const hideBanner = useOverflowWarningStore(s => s.hideBanner);

  const handleDismiss = useCallback(() => {
    clearWarning();
  }, [clearWarning]);

  const handleGoToCanvas = useCallback(() => {
    useCanvaStore.setState({ panelRequest: 'canva' });
    hideBanner();
  }, [hideBanner]);

  const handleCompress = useCallback(() => {
    if (!warning) return;
    try {
      const store = useCanvaStore.getState();
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
    <div className="rounded-lg border border-silse-tertiary-container/30 bg-silse-tertiary-container/10 overflow-hidden animate-in slide-in-from-top-2 duration-200">
      <div className="px-3 py-2">
        {/* Header row */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-silse-tertiary flex-shrink-0" style={ { fontSize: '14px' } }>warning</span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-silse-tertiary">
              Konten melebihi kapasitas halaman
            </div>
            <div className="text-[10px] text-silse-on-surface-variant/70 mt-0.5 leading-relaxed">
              {warning.details.summary}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-silse-on-surface-variant/50 hover:text-silse-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>close</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 mt-2">
          {canCompress && (
            <button
              onClick={handleCompress}
              className="px-2 py-1 rounded-md text-[10px] font-semibold
                         bg-silse-secondary-container/20 text-silse-secondary border border-silse-secondary-container/30
                         hover:bg-silse-secondary-container/30 transition-colors
                         inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined" style={ { fontSize: '9px' } }>close_fullscreen</span> Kompakkan
            </button>
          )}
          {canSplit && (
            <button
              onClick={handleSplit}
              className="px-2 py-1 rounded-md text-[10px] font-semibold
                         bg-silse-primary-container/20 text-silse-primary border border-silse-primary-container/30
                         hover:bg-silse-primary-container/30 transition-colors
                         inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined" style={ { fontSize: '9px' } }>vertical_split</span> Split Halaman
            </button>
          )}
          <button
            onClick={handleGoToCanvas}
            className="px-2.5 py-1 rounded-md text-[10px] font-semibold
                       bg-silse-tertiary-container/20 text-silse-tertiary border border-silse-tertiary-container/30
                       hover:bg-silse-tertiary-container/30 transition-colors
                       inline-flex items-center gap-1"
          >
            Lihat <span className="material-symbols-outlined" style={ { fontSize: '9px' } }>arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
