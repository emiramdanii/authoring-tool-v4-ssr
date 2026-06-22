'use client';

// ═══════════════════════════════════════════════════════════════
// MPI TOP BAR — Simple top toolbar for MPI Studio
// ═══════════════════════════════════════════════════════════════
// EDITOR-RADICAL-RESET-01: Replaces the dense 15-button toolbar
// with just 4 things a teacher needs:
//   1. Paket MPI title (read from authoring store meta)
//   2. Save status indicator
//   3. Style selector (MpiStyleControl)
//   4. Preview button → switches to preview mode
//   5. Export HTML button → triggers existing export pipeline
//
// No AI button, no command palette, no tour, no developer tools.
// Those remain in the advanced editor for power users.

import React from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useExportActions } from '@/components/canva/toolbar/use-export-actions';
import { MpiStyleControl } from './MpiStyleControl';

export function MpiTopBar() {
  const appMode = useCanvaStore((s) => s.appMode);
  const setAppMode = useCanvaStore((s) => s.setAppMode);
  const saveStatus = useCanvaStore((s) => s._saveStatus);
  const lastSavedAt = useCanvaStore((s) => s._lastSavedAt);

  // Paket MPI title from authoring store meta
  const meta = useAuthoringStore((s) => s.meta) as { judulPertemuan?: string; mapel?: string };
  const paketTitle = meta?.judulPertemuan || 'Media Pembelajaran Interaktif';

  const { exportHtml, isExporting } = useExportActions();

  const handlePreview = () => {
    setAppMode('preview');
  };

  const handleExport = () => {
    exportHtml();
  };

  const statusLabel = (() => {
    switch (saveStatus) {
      case 'saved': return 'Tersimpan';
      case 'saving': return 'Menyimpan…';
      case 'unsaved': return 'Belum simpan';
      case 'error': return 'Gagal simpan';
      default: return 'Tersimpan';
    }
  })();

  const statusColor = saveStatus === 'saved' ? 'text-emerald-600' :
    saveStatus === 'saving' ? 'text-amber-600' :
    saveStatus === 'error' ? 'text-red-600' :
    'text-slate-500';

  return (
    <header
      className="flex items-center justify-between gap-4 px-6 py-3 bg-white border-b border-slate-200 shadow-sm"
      role="toolbar"
      aria-label="Toolbar MPI Studio"
    >
      {/* Left: Paket MPI title + save status */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="material-symbols-outlined text-emerald-600 flex-shrink-0" aria-hidden="true" style={{ fontSize: '22px' }}>menu_book</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-800 truncate" title={paketTitle}>
            {paketTitle}
          </div>
          <div className={`text-xs flex items-center gap-1 ${statusColor}`} aria-live="polite">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{
                background: saveStatus === 'saved' ? '#10b981' :
                  saveStatus === 'saving' ? '#f59e0b' :
                  saveStatus === 'error' ? '#ef4444' : '#94a3b8'
              }}
              aria-hidden="true"
            />
            {statusLabel}
            {lastSavedAt > 0 && saveStatus === 'saved' && (
              <span className="text-slate-400 ml-1">
                · {new Date(lastSavedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center: Style selector */}
      <div className="hidden md:block flex-shrink-0">
        <MpiStyleControl />
      </div>

      {/* Right: Preview + Export buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handlePreview}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          aria-label="Pratinjau media"
          type="button"
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>visibility</span>
          <span className="hidden sm:inline">Preview</span>
        </button>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          aria-label="Export ke HTML"
          type="button"
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>
            {isExporting ? 'hourglass_empty' : 'download'}
          </span>
          <span className="hidden sm:inline">{isExporting ? 'Mengekspor…' : 'Export HTML'}</span>
        </button>
      </div>
    </header>
  );
}
