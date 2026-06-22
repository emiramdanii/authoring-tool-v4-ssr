'use client';

// ═══════════════════════════════════════════════════════════════
// MPI ADD CONTENT BAR — Footer with 3 add buttons
// ═══════════════════════════════════════════════════════════════
// EDITOR-RADICAL-RESET-01: Bottom footer with 3 simple buttons:
//   + Tambah Halaman → adds a new blank page
//   + Tambah Blok → adds a block to current page (materi-section default)
//   + Tambah Game → adds a game page
//
// Per sprint scope:
//   - "Tambah Halaman boleh membuka menu sederhana"
//   - "Tambah Blok boleh mengarahkan ke mekanisme existing"
//   - "Tambah Game minimal menambahkan halaman/preset game"

import React, { useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { toast } from 'sonner';

export function MpiAddContentBar() {
  const addPage = useCanvaStore((s) => s.addPage);
  const addSchemaBlock = useCanvaStore((s) => s.addSchemaBlock);
  const pages = useCanvaStore((s) => s.pages);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);

  const [showPageMenu, setShowPageMenu] = useState(false);

  const handleAddPage = (templateType?: string) => {
    addPage();
    // If a templateType is specified, set it on the new page
    if (templateType) {
      const state = useCanvaStore.getState();
      const newIdx = state.pages.length - 1;
      useCanvaStore.setState({
        pages: state.pages.map((p, i) =>
          i === newIdx ? { ...p, templateType: templateType as never, label: templateType } : p
        ),
      });
    }
    setShowPageMenu(false);
    toast.success('Halaman baru ditambahkan');
  };

  const handleAddBlock = () => {
    // Add a materi-section block (most common teacher content type)
    addSchemaBlock('materi-section');
    toast.success('Bagian materi ditambahkan ke halaman ini');
  };

  const handleAddGame = () => {
    // Add a new game page
    addPage();
    const state = useCanvaStore.getState();
    const newIdx = state.pages.length - 1;
    useCanvaStore.setState({
      pages: state.pages.map((p, i) =>
        i === newIdx ? { ...p, templateType: 'game' as never, label: 'Game' } : p
      ),
      currentPageIndex: newIdx,
    });
    toast.success('Halaman game ditambahkan');
  };

  const pageOptions = [
    { type: 'cover', label: 'Cover', icon: 'auto_stories' },
    { type: 'petunjuk', label: 'Petunjuk', icon: 'list_alt' },
    { type: 'tujuan', label: 'Tujuan', icon: 'flag' },
    { type: 'materi', label: 'Materi', icon: 'menu_book' },
    { type: 'kuis', label: 'Kuis', icon: 'quiz' },
    { type: 'game', label: 'Game', icon: 'sports_esports' },
    { type: 'diskusi', label: 'Diskusi', icon: 'forum' },
    { type: 'refleksi', label: 'Refleksi', icon: 'psychology' },
    { type: 'penutup', label: 'Penutup', icon: 'check_circle' },
    { type: 'custom', label: 'Halaman Kosong', icon: 'crop_landscape' },
  ];

  return (
    <footer
      className="flex items-center justify-center gap-3 px-6 py-3 bg-white border-t border-slate-200 shadow-sm"
      role="toolbar"
      aria-label="Tambah konten"
    >
      {/* Tambah Halaman — with dropdown menu */}
      <div className="relative">
        <button
          onClick={() => setShowPageMenu(!showPageMenu)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          aria-label="Tambah halaman baru"
          aria-expanded={showPageMenu}
          aria-haspopup="menu"
          type="button"
        >
          <span className="material-symbols-outlined text-emerald-600" aria-hidden="true" style={{ fontSize: '18px' }}>add</span>
          Tambah Halaman
        </button>

        {showPageMenu && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowPageMenu(false)}
              aria-hidden="true"
            />
            {/* Menu */}
            <div
              className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1"
              role="menu"
              aria-label="Pilih tipe halaman"
            >
              {pageOptions.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => handleAddPage(opt.type)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors text-left"
                  role="menuitem"
                  type="button"
                >
                  <span className="material-symbols-outlined text-slate-400" aria-hidden="true" style={{ fontSize: '16px' }}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Tambah Blok */}
      <button
        onClick={handleAddBlock}
        disabled={!pages[currentPageIndex]}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        aria-label="Tambah bagian materi ke halaman ini"
        type="button"
      >
        <span className="material-symbols-outlined text-emerald-600" aria-hidden="true" style={{ fontSize: '18px' }}>add</span>
        Tambah Blok
      </button>

      {/* Tambah Game */}
      <button
        onClick={handleAddGame}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        aria-label="Tambah halaman game baru"
        type="button"
      >
        <span className="material-symbols-outlined text-emerald-600" aria-hidden="true" style={{ fontSize: '18px' }}>add</span>
        Tambah Game
      </button>
    </footer>
  );
}
