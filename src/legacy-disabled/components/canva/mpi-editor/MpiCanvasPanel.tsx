// @ts-nocheck — BATCH-12: quarantined to src/legacy-disabled/, not type-checked
'use client';

// ═══════════════════════════════════════════════════════════════
// MPI CANVAS PANEL — Center area showing the active page
// ═══════════════════════════════════════════════════════════════
// PHASE-3B: Fixed 1280×720 base stage + scale wrapper.
//
// PageRenderer renders at native 1280×720. We scale it down to fit
// the available container space using CSS transform: scale().
// This is the SAME approach as PreviewMode.tsx — the design stays
// at native resolution, only the visual size changes.
//
// Benefits:
//   - No clipping (content always at 1280×720)
//   - No layout shift (scale is visual only)
//   - Preview/Export match exactly (same native size)
//   - No zoom confusion (auto-fit, no manual zoom)

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { PageRenderer } from '@/components/canva/page-renderer';
import { RATIOS } from '@/components/canva/types';

export function MpiCanvasPanel() {
  const pages = useCanvaStore((s) => s.pages);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const selectedBlockId = useCanvaStore((s) => s.selectedBlockId);
  const ratioId = useCanvaStore((s) => s.ratioId);

  const page = pages[currentPageIndex];

  // Get native dimensions from ratio (default 1280×720 for 16:9)
  const ratio = RATIOS.find((r) => r.id === ratioId) ?? RATIOS[0]!;
  const nativeW = ratio.w;
  const nativeH = ratio.h;

  // PHASE-3B: Measure container to compute scale factor
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const updateScale = () => {
      const el = containerRef.current;
      if (!el) return;
      const cw = el.clientWidth - 48; // padding
      const ch = el.clientHeight - 80; // title bar + helper text
      // Compute scale that fits native size into container
      const scaleW = cw / nativeW;
      const scaleH = ch / nativeH;
      const newScale = Math.min(scaleW, scaleH, 1); // never upscale beyond 1:1
      setScale(Math.max(0.1, newScale)); // floor at 10%
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [nativeW, nativeH]);

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

  // Scaled dimensions (what the teacher sees)
  const scaledW = nativeW * scale;
  const scaledH = nativeH * scale;

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

      {/* PHASE-3B: Fixed 1280×720 stage scaled to fit container.
          The outer div is the visible area (scaledW × scaledH).
          The inner div is at native 1280×720 with transform: scale().
          This matches PreviewMode's approach exactly. */}
      <div
        className="relative bg-white rounded-lg shadow-md overflow-hidden flex-shrink-0"
        style={{
          width: `${scaledW}px`,
          height: `${scaledH}px`,
        }}
      >
        <div
          style={{
            width: `${nativeW}px`,
            height: `${nativeH}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <PageRenderer
            mode="canvas"
            page={page}
            currentPageIndex={currentPageIndex}
            totalPages={pages.length}
          />
        </div>
      </div>

      {/* Helper text */}
      <p className="text-xs text-slate-400 mt-4 text-center max-w-md flex-shrink-0">
        Klik bagian pada halaman untuk mengedit isi. Gunakan panel kanan untuk mengubah konten.
      </p>
    </main>
  );
}
