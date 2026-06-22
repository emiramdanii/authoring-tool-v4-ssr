'use client';

// ═══════════════════════════════════════════════════════════════
// MPI CANVAS PANEL — Center area showing the active page
// ═══════════════════════════════════════════════════════════════
// VISUAL-STABILIZATION-01: Fix canvas clipping.
//
// Before: aspectRatio: 16/9 + maxHeight: 100% + overflow-hidden
//   → canvas content clipped when container shorter than 16:9 ratio
//
// After: Canvas wrapper uses flex-1 to fill available space, then
//   PageRenderer scales to fit using object-fit: contain pattern.
//   The wrapper is relative + overflow-hidden (content stays inside),
//   but the inner page is allowed to scroll if needed (not clipped).
//
// No resizable handles, no zoom controls, no technical chrome.

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { PageRenderer } from '@/components/canva/page-renderer';

export function MpiCanvasPanel() {
  const pages = useCanvaStore((s) => s.pages);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const selectedBlockId = useCanvaStore((s) => s.selectedBlockId);

  const page = pages[currentPageIndex];

  // VISUAL-STABILIZATION-01: Measure container to compute the best
  // 16:9 frame that fits WITHOUT clipping. This replaces the old
  // aspectRatio + maxHeight approach which clipped content.
  const containerRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      const el = containerRef.current;
      if (!el) return;
      const cw = el.clientWidth - 48; // padding
      const ch = el.clientHeight - 80; // title bar + helper text
      // Compute 16:9 frame that fits inside container
      const widthByHeight = ch * (16 / 9);
      const heightByWidth = cw * (9 / 16);
      if (widthByHeight <= cw) {
        // Height-constrained: frame is shorter than container width
        setFrameSize({ width: widthByHeight, height: ch });
      } else {
        // Width-constrained: frame is narrower than container height
        setFrameSize({ width: cw, height: heightByWidth });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      useCanvaStore.setState({ selectedBlockId: null });
    }
  }, []);

  // Empty state
  if (!page) {
    return (
      <div
        className="flex-1 flex items-center justify-center bg-slate-100"
        onClick={handleCanvasClick}
        role="region"
        aria-label="Area kanvas"
      >
        <div className="text-center max-w-sm px-6">
          <span className="material-symbols-outlined text-slate-300" aria-hidden="true" style={{ fontSize: '64px' }}>
            add_photo_alternate
          </span>
          <h3 className="text-base font-medium text-slate-500 mt-3">Belum ada halaman dipilih</h3>
          <p className="text-sm text-slate-400 mt-1">
            Pilih halaman di panel kiri, atau tambah halaman baru lewat tombol di bawah.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center bg-slate-100 overflow-hidden p-6 min-w-0 min-h-0"
      onClick={handleCanvasClick}
      role="region"
      aria-label="Area kanvas — halaman aktif"
      id="mpi-canvas"
    >
      {/* Page title bar */}
      <div className="w-full max-w-4xl mb-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '16px' }}>crop_landscape</span>
          <span>Halaman {currentPageIndex + 1} dari {pages.length}</span>
          {selectedBlockId && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
              Bagian dipilih
            </span>
          )}
        </div>
      </div>

      {/* VISUAL-STABILIZATION-01: Canvas wrapper computed to fit
          container WITHOUT clipping. Uses ResizeObserver to recalculate
          when panel resizes. relative + overflow-hidden keeps content
          contained, but frame is sized to show ALL content. */}
      <div
        className="relative bg-white rounded-lg shadow-md overflow-hidden flex-shrink-0"
        style={{
          width: frameSize.width > 0 ? `${frameSize.width}px` : '100%',
          maxWidth: '100%',
          height: frameSize.height > 0 ? `${frameSize.height}px` : 'auto',
          maxHeight: '100%',
        }}
      >
        <PageRenderer
          mode="canvas"
          page={page}
          currentPageIndex={currentPageIndex}
          totalPages={pages.length}
        />
      </div>

      {/* Helper text */}
      <p className="text-xs text-slate-400 mt-4 text-center max-w-md flex-shrink-0">
        Klik bagian pada halaman untuk mengedit isi. Gunakan panel kanan untuk mengubah konten.
      </p>
    </main>
  );
}
