'use client';

import React from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useExportActions } from '@/components/canva/toolbar/use-export-actions';
import { WorkspaceStyleMenu } from './WorkspaceStyleMenu';

const PAGE_LABELS: Record<string, { label: string; icon: string }> = {
  cover: { label: 'Cover', icon: 'auto_stories' },
  petunjuk: { label: 'Petunjuk', icon: 'list_alt' },
  tujuan: { label: 'Tujuan', icon: 'flag' },
  motivasi: { label: 'Motivasi', icon: 'lightbulb' },
  materi: { label: 'Materi', icon: 'menu_book' },
  diskusi: { label: 'Diskusi', icon: 'forum' },
  skenario: { label: 'Skenario', icon: 'theater_comedy' },
  kuis: { label: 'Kuis', icon: 'quiz' },
  game: { label: 'Game', icon: 'sports_esports' },
  hasil: { label: 'Hasil', icon: 'emoji_events' },
  refleksi: { label: 'Refleksi', icon: 'psychology' },
  rangkuman: { label: 'Rangkuman', icon: 'summarize' },
  penutup: { label: 'Penutup', icon: 'check_circle' },
  custom: { label: 'Halaman', icon: 'crop_landscape' },
};

export function WorkspaceSceneList() {
  const pages = useCanvaStore((s) => s.pages);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const goPage = useCanvaStore((s) => s.goPage);

  return (
    <nav className="flex flex-col w-56 min-w-56 bg-slate-50 border-r border-slate-200 overflow-y-auto" aria-label="Alur Media">
      <div className="px-4 py-3 border-b border-slate-200 sticky top-0 bg-slate-50 z-10">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alur Media</h2>
        <p className="text-xs text-slate-400 mt-0.5">{pages.length} halaman</p>
      </div>
      <ul className="flex-1 py-2" role="list">
        {pages.map((page, index) => {
          const t = (page.templateType || 'custom') as string;
          const mapped = PAGE_LABELS[t] ?? { label: page.label || `Halaman ${index + 1}`, icon: 'crop_landscape' };
          const isActive = index === currentPageIndex;
          return (
            <li key={`page-${index}`} role="listitem">
              <button
                onClick={() => goPage(index)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${isActive ? 'bg-emerald-50 text-emerald-800 font-medium border-l-2 border-emerald-600' : 'text-slate-600 hover:bg-slate-100 border-l-2 border-transparent'}`}
                aria-current={isActive ? 'page' : undefined}
                type="button"
              >
                <span className={`material-symbols-outlined flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} aria-hidden="true" style={{ fontSize: '18px' }}>{mapped.icon}</span>
                <span className="flex-1 min-w-0 truncate">{mapped.label}</span>
                <span className={`text-xs flex-shrink-0 ${isActive ? 'text-emerald-500' : 'text-slate-300'}`}>{index + 1}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {pages.length === 0 && (
        <div className="px-4 py-8 text-center">
          <span className="material-symbols-outlined text-slate-300" aria-hidden="true" style={{ fontSize: '40px' }}>folder_open</span>
          <p className="text-xs text-slate-400 mt-2">Belum ada halaman</p>
          <p className="text-xs text-slate-400">Gunakan tombol "Tambah Halaman" di bawah</p>
        </div>
      )}
    </nav>
  );
}

export function WorkspaceTopBar() {
  const setAppMode = useCanvaStore((s) => s.setAppMode);
  const saveStatus = useCanvaStore((s) => s._saveStatus);
  const lastSavedAt = useCanvaStore((s) => s._lastSavedAt);
  const meta = useAuthoringStore((s) => s.meta) as { judulPertemuan?: string };
  const paketTitle = meta?.judulPertemuan || 'Media Pembelajaran Interaktif';
  const { exportHtml, isExporting } = useExportActions();

  const statusLabel = (() => {
    switch (saveStatus) {
      case 'saved': return 'Tersimpan';
      case 'saving': return 'Menyimpan…';
      case 'unsaved': return 'Belum simpan';
      case 'error': return 'Gagal simpan';
      default: return 'Tersimpan';
    }
  })();

  const statusColor = saveStatus === 'saved' ? 'text-emerald-600' : saveStatus === 'saving' ? 'text-amber-600' : saveStatus === 'error' ? 'text-red-600' : 'text-slate-500';

  return (
    <header className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-3 bg-white border-b border-slate-200 shadow-sm" role="toolbar" aria-label="Toolbar MPI Workspace">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <span className="material-symbols-outlined text-emerald-600 flex-shrink-0" aria-hidden="true" style={{ fontSize: '20px' }}>menu_book</span>
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-semibold text-slate-800 truncate" title={paketTitle}>{paketTitle}</div>
          <div className={`text-xs flex items-center gap-1 ${statusColor}`} aria-live="polite">
            <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: saveStatus === 'saved' ? '#10b981' : saveStatus === 'saving' ? '#f59e0b' : saveStatus === 'error' ? '#ef4444' : '#94a3b8' }} aria-hidden="true" />
            <span className="truncate">{statusLabel}</span>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0"><WorkspaceStyleMenu /></div>
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button onClick={() => setAppMode('preview')} className="flex items-center gap-1 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30" aria-label="Pratinjau media" type="button">
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>visibility</span>
          <span className="hidden sm:inline">Preview</span>
        </button>
        <button onClick={() => exportHtml()} disabled={isExporting} className="flex items-center gap-1 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30" aria-label="Export ke HTML" type="button">
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>{isExporting ? 'hourglass_empty' : 'download'}</span>
          <span className="hidden sm:inline">{isExporting ? '…' : 'Export'}</span>
        </button>
      </div>
    </header>
  );
}
