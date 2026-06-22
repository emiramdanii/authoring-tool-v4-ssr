'use client';

// ═══════════════════════════════════════════════════════════════
// MPI TOP BAR — Simple top toolbar for MPI Studio
// ═══════════════════════════════════════════════════════════════
// VISUAL-STABILIZATION-01: Fix 3 visual blockers:
//   1. Style button always visible (removed hidden md:block)
//   2. Mode Advanced toggle button added (switches to old editor)
//   3. All buttons responsive (visible on all viewport sizes)
//
// Teacher toolbar has: Title | Style | Preview | Export | Mode Lanjutan

import React from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useExportActions } from '@/components/canva/toolbar/use-export-actions';
import { MpiStyleControl } from './MpiStyleControl';

export function MpiTopBar() {
  const setAppMode = useCanvaStore((s) => s.setAppMode);
  const setTeacherMode = useCanvaStore((s) => s.setTeacherMode);
  const saveStatus = useCanvaStore((s) => s._saveStatus);
  const lastSavedAt = useCanvaStore((s) => s._lastSavedAt);

  const meta = useAuthoringStore((s) => s.meta) as { judulPertemuan?: string; mapel?: string };
  const paketTitle = meta?.judulPertemuan || 'Media Pembelajaran Interaktif';

  const { exportHtml, isExporting } = useExportActions();

  const handlePreview = () => setAppMode('preview');
  const handleExport = () => exportHtml();

  // VISUAL-STABILIZATION-01: Mode Advanced toggle — switches to old
  // 3-panel editor (IconRail + Stage + RightPanel). Teacher can switch
  // back to MPI Studio via the "Mode Guru" button in the old sidebar.
  const handleAdvancedMode = () => {
    setTeacherMode(false);
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
      className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-3 bg-white border-b border-slate-200 shadow-sm"
      role="toolbar"
      aria-label="Toolbar MPI Studio"
    >
      {/* Left: Paket MPI title + save status */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <span className="material-symbols-outlined text-emerald-600 flex-shrink-0" aria-hidden="true" style={{ fontSize: '20px' }}>menu_book</span>
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-semibold text-slate-800 truncate" title={paketTitle}>
            {paketTitle}
          </div>
          <div className={`text-xs flex items-center gap-1 ${statusColor}`} aria-live="polite">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: saveStatus === 'saved' ? '#10b981' :
                  saveStatus === 'saving' ? '#f59e0b' :
                  saveStatus === 'error' ? '#ef4444' : '#94a3b8'
              }}
              aria-hidden="true"
            />
            <span className="truncate">{statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Center: Style selector — VISUAL-STABILIZATION-01: always visible */}
      <div className="flex-shrink-0">
        <MpiStyleControl />
      </div>

      {/* Right: Preview + Export + Mode Advanced */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button
          onClick={handlePreview}
          className="flex items-center gap-1 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          aria-label="Pratinjau media"
          type="button"
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>visibility</span>
          <span className="hidden xs:inline sm:inline">Preview</span>
        </button>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-1 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          aria-label="Export ke HTML"
          type="button"
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>
            {isExporting ? 'hourglass_empty' : 'download'}
          </span>
          <span className="hidden xs:inline sm:inline">{isExporting ? '…' : 'Export'}</span>
        </button>
        {/* VISUAL-STABILIZATION-01: Mode Advanced toggle — always visible */}
        <button
          onClick={handleAdvancedMode}
          className="flex items-center gap-1 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/30"
          aria-label="Beralih ke mode editor lanjutan"
          title="Mode Editor Lanjutan (3-panel)"
          type="button"
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>tune</span>
          <span className="hidden xs:inline sm:inline">Lanjutan</span>
        </button>
      </div>
    </header>
  );
}
