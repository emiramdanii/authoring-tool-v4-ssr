'use client';

// ═══════════════════════════════════════════════════════════════
// V5 — PreviewV5
// ═══════════════════════════════════════════════════════════════
// Uses PageRenderer mode="preview" — same renderer as canvas + export.
// Minimal chrome: top bar with Back + page nav + Export.
// ═══════════════════════════════════════════════════════════════

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { PageRenderer } from '@/components/canva/page-renderer';
import { RATIOS } from '@/components/canva/types';

export interface PreviewV5Props {
  onBack: () => void;
  onExport: () => void;
}

export function PreviewV5({ onBack, onExport }: PreviewV5Props) {
  const pages = useCanvaStore((s) => s.pages);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const goPage = useCanvaStore((s) => s.goPage);
  const ratioId = useCanvaStore((s) => s.ratioId);

  const ratio = RATIOS.find((r) => r.id === ratioId) ?? RATIOS[0]!;
  const nativeW = ratio.w;
  const nativeH = ratio.h;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);

  useEffect(() => {
    const updateScale = () => {
      const el = containerRef.current;
      if (!el) return;
      const cw = el.clientWidth - 48;
      const ch = el.clientHeight - 60;
      const scaleW = cw / nativeW;
      const scaleH = ch / nativeH;
      setScale(Math.max(0.1, Math.min(scaleW, scaleH, 1)));
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [nativeW, nativeH]);

  const handlePrev = useCallback(() => {
    if (currentPageIndex > 0) goPage(currentPageIndex - 1);
  }, [currentPageIndex, goPage]);

  const handleNext = useCallback(() => {
    if (currentPageIndex < pages.length - 1) goPage(currentPageIndex + 1);
  }, [currentPageIndex, pages.length, goPage]);

  const page = pages[currentPageIndex];

  if (!page) {
    return (
      <main className="flex-1 flex items-center justify-center bg-slate-100">
        <div className="text-center max-w-sm px-6">
          <span className="material-symbols-outlined text-slate-300" aria-hidden="true" style={{ fontSize: '64px' }}>visibility_off</span>
          <h3 className="text-base font-medium text-slate-500 mt-3">Tidak ada halaman untuk dipratinjau</h3>
          <button
            onClick={onBack}
            type="button"
            className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Kembali ke Editor
          </button>
        </div>
      </main>
    );
  }

  const scaledW = nativeW * scale;
  const scaledH = nativeH * scale;

  return (
    <div
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
      data-testid="preview-v5"
    >
      {/* Top bar */}
      <header className="flex items-center justify-between gap-2 px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
        <button
          onClick={onBack}
          type="button"
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          aria-label="Kembali ke editor"
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>edit</span>
          <span className="hidden sm:inline">Editor</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentPageIndex <= 0}
            type="button"
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            aria-label="Halaman sebelumnya"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>chevron_left</span>
          </button>
          <span className="text-sm font-medium text-slate-700 min-w-[80px] text-center">
            {currentPageIndex + 1} / {pages.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPageIndex >= pages.length - 1}
            type="button"
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            aria-label="Halaman berikutnya"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>chevron_right</span>
          </button>
        </div>

        <button
          onClick={onExport}
          type="button"
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          aria-label="Export ke HTML"
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>download</span>
          <span className="hidden sm:inline">Export</span>
        </button>
      </header>

      {/* Page nav strip */}
      {pages.length > 1 && (
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          {pages.map((p, i) => (
            <button
              key={`preview-nav-${i}`}
              onClick={() => goPage(i)}
              type="button"
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                i === currentPageIndex
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
              aria-current={i === currentPageIndex ? 'page' : undefined}
            >
              {i + 1}. {p.label || p.templateType || 'Halaman'}
            </button>
          ))}
        </div>
      )}

      {/* Preview canvas */}
      <main
        ref={containerRef}
        className="flex-1 flex items-center justify-center bg-slate-100 overflow-hidden p-6"
        role="region"
        aria-label="Pratinjau media"
      >
        <div
          className="relative bg-white rounded-lg shadow-xl overflow-hidden"
          style={{ width: `${scaledW}px`, height: `${scaledH}px` }}
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
              overflow: 'hidden',
            }}
          >
            <PageRenderer
              mode="preview"
              page={page}
              currentPageIndex={currentPageIndex}
              totalPages={pages.length}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
