'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { PageRenderer } from '@/components/canva/page-renderer';
import { RATIOS } from '@/components/canva/types';
import { handleCanvasClick } from './workspace-selection';

export function WorkspaceCanvasStage() {
  const pages = useCanvaStore((s) => s.pages);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const selectedBlockId = useCanvaStore((s) => s.selectedBlockId);
  const ratioId = useCanvaStore((s) => s.ratioId);

  const page = pages[currentPageIndex];
  const ratio = RATIOS.find((r) => r.id === ratioId) ?? RATIOS[0]!;
  const nativeW = ratio.w;
  const nativeH = ratio.h;

  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

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

  // V3-PHASE-2: Selection visual feedback — outline ring on selected block.
  // After each render/selection change, find the [data-block-id] element
  // matching selectedBlockId and apply an outline. Remove outline from
  // previously selected block. This does NOT change layout — only visual.
  useEffect(() => {
    if (!innerRef.current) return;
    // Remove all existing selection rings
    innerRef.current.querySelectorAll('[data-block-id]').forEach((el) => {
      (el as HTMLElement).style.outline = '';
      (el as HTMLElement).style.outlineOffset = '';
    });
    // Add ring to selected block
    if (selectedBlockId) {
      const el = innerRef.current.querySelector(`[data-block-id="${selectedBlockId}"]`) as HTMLElement | null;
      if (el) {
        el.style.outline = '3px solid #10b981';
        el.style.outlineOffset = '2px';
      }
    }
  }, [selectedBlockId, page, scale]);

  const onCanvasClick = useCallback((e: React.MouseEvent) => {
    handleCanvasClick(e);
  }, []);

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100" role="region" aria-label="Area kanvas">
        <div className="text-center max-w-sm px-6">
          <span className="material-symbols-outlined text-slate-300" aria-hidden="true" style={{ fontSize: '64px' }}>add_photo_alternate</span>
          <h3 className="text-base font-medium text-slate-500 mt-3">Belum ada halaman dipilih</h3>
          <p className="text-sm text-slate-400 mt-1">Pilih halaman di panel kiri, atau tambah halaman baru.</p>
        </div>
      </div>
    );
  }

  const scaledW = nativeW * scale;
  const scaledH = nativeH * scale;

  return (
    <main
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center bg-slate-100 overflow-hidden p-6 min-w-0 min-h-0"
      onClick={onCanvasClick}
      role="region"
      aria-label="Area kanvas — halaman aktif"
      id="mpi-canvas-v2"
    >
      <div className="w-full max-w-4xl mb-2 flex items-center justify-between flex-shrink-0">
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

      <div
        className="relative bg-white rounded-lg shadow-md overflow-hidden flex-shrink-0"
        style={{ width: `${scaledW}px`, height: `${scaledH}px` }}
      >
        <div
          ref={innerRef}
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

      <p className="text-xs text-slate-400 mt-3 text-center max-w-md flex-shrink-0">
        Klik bagian pada halaman untuk mengedit isi.
      </p>
    </main>
  );
}
