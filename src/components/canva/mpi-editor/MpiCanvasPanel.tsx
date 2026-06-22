'use client';

// ═══════════════════════════════════════════════════════════════
// MPI CANVAS PANEL — Center area showing the active page
// ═══════════════════════════════════════════════════════════════
// EDITOR-RADICAL-RESET-01: Replaces the old Stage + IconRail +
// SceneTabBar + BottomPageStrip + StatusBar with a clean canvas
// that uses the existing PageRenderer engine.
//
// This is NOT a free-form canvas — it's a "media preview that's
// editable". The teacher sees their page rendered exactly as
// students will see it, and can click blocks to select them for
// editing in the MpiInspector panel.
//
// No resizable handles, no zoom controls, no technical chrome.

import React, { useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { PageRenderer } from '@/components/canva/page-renderer';

export function MpiCanvasPanel() {
  const pages = useCanvaStore((s) => s.pages);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const selectedBlockId = useCanvaStore((s) => s.selectedBlockId);

  const page = pages[currentPageIndex];

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Click on empty canvas area deselects the current block
    if (e.target === e.currentTarget) {
      useCanvaStore.setState({ selectedBlockId: null });
    }
  }, []);

  // Empty state — no pages or no current page
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
      className="flex-1 flex flex-col items-center justify-center bg-slate-100 overflow-hidden p-6 min-w-0 min-h-0"
      onClick={handleCanvasClick}
      role="region"
      aria-label="Area kanvas — halaman aktif"
      id="mpi-canvas"
    >
      {/* Page title bar (teacher-friendly, not technical) */}
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

      {/* PageRenderer — relative wrapper so absolute-positioned
          children inside PageRenderer stay contained. overflow-hidden
          clips anything that would escape the 16:9 frame.
          PATCH-2A: max-h-full + aspect-ratio keeps the canvas from
          growing taller than available space; relative + overflow-hidden
          prevents PageRenderer from leaking outside. */}
      <div
        className="relative w-full max-w-4xl bg-white rounded-lg shadow-md overflow-hidden"
        style={{ aspectRatio: '16 / 9', maxHeight: '100%' }}
      >
        <PageRenderer
          mode="canvas"
          page={page}
          currentPageIndex={currentPageIndex}
          totalPages={pages.length}
        />
      </div>

      {/* Helper text below canvas */}
      <p className="text-xs text-slate-400 mt-4 text-center max-w-md flex-shrink-0">
        Klik bagian pada halaman untuk mengedit isi. Gunakan panel kanan untuk mengubah konten.
      </p>
    </main>
  );
}
