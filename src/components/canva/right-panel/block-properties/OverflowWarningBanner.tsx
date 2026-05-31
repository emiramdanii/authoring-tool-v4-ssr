'use client';

// ═══════════════════════════════════════════════════════════════
// OVERFLOW WARNING BANNER — Shown when content exceeds page capacity
// ═══════════════════════════════════════════════════════════════
// Phase 4 — Safe Page Split / Overflow Policy
//
// This banner appears inside the GuidedFormEditor when a content
// edit causes overflow. It shows:
//   - A warning message with overflow details
//   - Action buttons: Compress / Split / Keep anyway
//
// The banner reads OverflowCheckResult from the last patch result
// and calls the appropriate store action when the user clicks.
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import type { OverflowCheckResult } from '@/core/schema/guided-patch';
import { useCanvaStore } from '@/store/canva-store';

interface OverflowWarningBannerProps {
  /** Rich overflow details from the last patch */
  details: OverflowCheckResult;
  /** The page ID where overflow was detected */
  pageId: string;
  /** Callback when user dismisses the banner (keeps content as-is) */
  onDismiss: () => void;
}

export function OverflowWarningBanner({ details, pageId, onDismiss }: OverflowWarningBannerProps) {
  const [isSplitting, setIsSplitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rebalanceCurrentPage = useCanvaStore(s => s.rebalanceCurrentPage);
  const promoteSceneSplit = useCanvaStore(s => s.promoteSceneSplit);

  // ── Action: Compress (rebalance with compression-first) ──
  const handleCompress = useCallback(() => {
    setIsCompressing(true);
    setError(null);
    try {
      rebalanceCurrentPage();
      // If rebalance succeeds, the overflow may be resolved
      onDismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kompresi gagal');
    } finally {
      setIsCompressing(false);
    }
  }, [rebalanceCurrentPage, onDismiss]);

  // ── Action: Split to new page ──
  const handleSplit = useCallback(() => {
    if (!details.canSplit) {
      setError('Tipe halaman ini tidak bisa di-split');
      return;
    }
    setIsSplitting(true);
    setError(null);
    try {
      promoteSceneSplit(1);
      onDismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Split gagal');
    } finally {
      setIsSplitting(false);
    }
  }, [details.canSplit, promoteSceneSplit, onDismiss]);

  // ── Render ──
  return (
    <div className="rounded-xl border-silse-tertiary-container/30 border bg-silse-tertiary-container/5 overflow-hidden">
      {/* ── Warning header ── */}
      <div className="px-4 py-3 flex items-start gap-2.5">
        <div className="mt-0.5 text-silse-tertiary text-sm shrink-0">⚠</div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-silse-tertiary tracking-wide uppercase">
            Konten Melebihi Kapasitas
          </div>
          <div className="text-[11px] text-silse-on-surface-variant mt-0.5 leading-relaxed">
            {details.summary}
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {/* Compress button — only if compression is available */}
        {details.canCompress && (
          <button
            onClick={handleCompress}
            disabled={isCompressing}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold
                       bg-silse-tertiary-container/15 text-silse-tertiary border border-silse-tertiary-container/30
                       hover:bg-silse-tertiary-container/25 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompressing ? 'Mengompres...' : 'Kompakkan'}
          </button>
        )}

        {/* Split button — only if page type allows split */}
        {details.canSplit && (
          <button
            onClick={handleSplit}
            disabled={isSplitting}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold
                       bg-silse-primary/15 text-silse-primary border border-silse-primary/30
                       hover:bg-silse-primary/25 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSplitting ? 'Mem-split...' : 'Split ke Halaman Baru'}
          </button>
        )}

        {/* Keep anyway — always available */}
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 rounded-xl text-[11px] font-semibold
                     bg-silse-surface-container/50 text-silse-on-surface-variant border border-silse-outline-variant/30
                     hover:bg-silse-surface-container hover:text-silse-on-surface transition-colors"
        >
          Tetap Simpan
        </button>
      </div>

      {/* ── Error message ── */}
      {error && (
        <div className="px-4 pb-3">
          <div className="text-[11px] text-silse-error bg-silse-error-container/10 rounded-xl px-3 py-1.5">
            {error}
          </div>
        </div>
      )}

      {/* ── Contract info for non-splittable pages ── */}
      {!details.canSplit && (
        <div className="px-4 pb-3">
          <div className="text-[11px] text-silse-on-surface-variant/60 leading-relaxed">
            Tipe halaman ini tidak mendukung pemisahan otomatis.
            Persingkat konten agar muat dalam satu halaman.
          </div>
        </div>
      )}
    </div>
  );
}
