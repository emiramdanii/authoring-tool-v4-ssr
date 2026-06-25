'use client';

// ═══════════════════════════════════════════════════════════════
// V5 — ExportPanelV5
// ═══════════════════════════════════════════════════════════════
// Triggers the official /api/export pipeline via useExportActions().
// Shows export status + last result. No custom export options —
// single official path.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { useExportActions } from '@/components/canva/toolbar/use-export-actions';
import { useCanvaStore } from '@/store/canva-store';

export interface ExportPanelV5Props {
  onBack: () => void;
}

export function ExportPanelV5({ onBack }: ExportPanelV5Props) {
  const { exportHtml, isExporting } = useExportActions();
  const pages = useCanvaStore((s) => s.pages);
  const [lastExportAt, setLastExportAt] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    try {
      await exportHtml();
      // BATCH-01: Only set lastExportAt if exportHtml succeeded (no throw).
      setLastExportAt(new Date().toLocaleTimeString('id-ID'));
    } catch {
      // BATCH-01: Export failed — do NOT set lastExportAt.
      // Error toast is already shown by exportHtml/exportWithFallback.
      // lastExportAt stays as previous value (or null if never succeeded).
    }
  }, [exportHtml]);

  return (
    <div
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
      data-testid="export-panel-v5"
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
        <h1 className="text-base font-semibold text-slate-800">Export Media</h1>
        <div className="w-20" />
      </header>

      {/* Export panel */}
      <main className="flex-1 flex items-center justify-center bg-slate-50 p-6 overflow-auto">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-700" aria-hidden="true" style={{ fontSize: '28px' }}>download</span>
          </div>

          <h2 className="text-lg font-semibold text-slate-800 text-center mb-2">
            Export ke HTML
          </h2>
          <p className="text-sm text-slate-500 text-center mb-6">
            Media akan diexport ke file HTML siap pakai. Bisa dibuka di browser
            manapun tanpa internet.
          </p>

          {/* Stats */}
          <div className="bg-slate-50 rounded-lg p-3 mb-6 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Jumlah halaman</span>
              <span className="font-medium text-slate-800">{pages.length}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Format</span>
              <span className="font-medium text-slate-800">HTML standalone</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Renderer</span>
              <span className="font-medium text-slate-800">Official (PageRenderer)</span>
            </div>
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={isExporting || pages.length === 0}
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            aria-label="Export sekarang"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>
              {isExporting ? 'hourglass_empty' : 'download'}
            </span>
            {isExporting ? 'Mengexport...' : 'Export Sekarang'}
          </button>

          {/* Last export info */}
          {lastExportAt && !isExporting && (
            <p className="text-xs text-emerald-600 text-center mt-4">
              ✓ Export terakhir: {lastExportAt}
            </p>
          )}

          {pages.length === 0 && (
            <p className="text-xs text-amber-600 text-center mt-4">
              Belum ada halaman untuk diexport. Kembali ke editor dulu.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
