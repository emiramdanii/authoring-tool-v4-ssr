'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useCanvaStore } from '@/store/canva-store';
import type { PageTemplateType } from '@/components/canva/types';
import { toast } from 'sonner';

const PAGE_OPTIONS: Array<{ type: PageTemplateType; label: string; icon: string; desc: string }> = [
  { type: 'cover', label: 'Cover', icon: 'auto_stories', desc: 'Halaman judul pembuka' },
  { type: 'petunjuk', label: 'Petunjuk', icon: 'list_alt', desc: 'Cara menggunakan media' },
  { type: 'tujuan', label: 'Tujuan', icon: 'flag', desc: 'Tujuan pembelajaran' },
  { type: 'motivasi', label: 'Motivasi', icon: 'lightbulb', desc: 'Apersepsi & pertanyaan pemicu' },
  { type: 'materi', label: 'Materi', icon: 'menu_book', desc: 'Materi pembelajaran' },
  { type: 'diskusi', label: 'Diskusi', icon: 'forum', desc: 'Pertanyaan diskusi' },
  { type: 'kuis', label: 'Kuis', icon: 'quiz', desc: 'Soal pilihan ganda' },
  { type: 'game', label: 'Game', icon: 'sports_esports', desc: 'Game interaktif sortir' },
  { type: 'refleksi', label: 'Refleksi', icon: 'psychology', desc: 'Refleksi diri' },
  { type: 'rangkuman', label: 'Rangkuman', icon: 'summarize', desc: 'Poin penting materi' },
  { type: 'penutup', label: 'Penutup', icon: 'check_circle', desc: 'Penutup & preview' },
  { type: 'custom', label: 'Halaman Kosong', icon: 'crop_landscape', desc: 'Canvas kosong' },
];

export function WorkspaceContentPalette() {
  const addPage = useCanvaStore((s) => s.addPage);
  const addTemplatePage = useCanvaStore((s) => s.addTemplatePage);
  const addSchemaBlock = useCanvaStore((s) => s.addSchemaBlock);
  const pages = useCanvaStore((s) => s.pages);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const [showPageMenu, setShowPageMenu] = useState(false);

  const handleAddPage = (templateType: PageTemplateType) => {
    if (templateType === 'custom') {
      addPage();
      toast.success('Halaman kosong ditambahkan');
    } else {
      addTemplatePage(templateType);
    }
    setShowPageMenu(false);
  };

  const handleAddBlock = () => {
    addSchemaBlock('materi-section');
    toast.success('Bagian materi ditambahkan');
  };

  const handleAddGame = () => {
    addTemplatePage('game');
  };

  const pageMenu = showPageMenu ? createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setShowPageMenu(false)} aria-hidden="true" />
      <div
        className="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-72"
        style={{ top: 'auto', bottom: '60px', left: '50%', transform: 'translateX(-50%)' }}
        role="menu"
        aria-label="Pilih tipe halaman"
      >
        <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">Tambah Halaman</div>
        {PAGE_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            onClick={() => handleAddPage(opt.type)}
            className="w-full flex items-start gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors text-left"
            role="menuitem"
            type="button"
          >
            <span className="material-symbols-outlined text-slate-400 flex-shrink-0 mt-0.5" aria-hidden="true" style={{ fontSize: '18px' }}>{opt.icon}</span>
            <div>
              <div className="font-medium">{opt.label}</div>
              <div className="text-xs text-slate-400">{opt.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </>,
    document.body,
  ) : null;

  return (
    <footer className="flex items-center justify-center gap-3 px-6 py-3 bg-white border-t border-slate-200 shadow-sm" role="toolbar" aria-label="Tambah konten">
      <div className="relative">
        <button
          onClick={() => setShowPageMenu(!showPageMenu)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          aria-label="Tambah halaman baru"
          aria-expanded={showPageMenu}
          type="button"
        >
          <span className="material-symbols-outlined text-emerald-600" aria-hidden="true" style={{ fontSize: '18px' }}>add</span>
          Tambah Halaman
        </button>
        {pageMenu}
      </div>
      <button
        onClick={handleAddBlock}
        disabled={!pages[currentPageIndex]}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        aria-label="Tambah bagian materi"
        type="button"
      >
        <span className="material-symbols-outlined text-emerald-600" aria-hidden="true" style={{ fontSize: '18px' }}>add</span>
        Tambah Blok
      </button>
      <button
        onClick={handleAddGame}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        aria-label="Tambah halaman game"
        type="button"
      >
        <span className="material-symbols-outlined text-emerald-600" aria-hidden="true" style={{ fontSize: '18px' }}>add</span>
        Tambah Game
      </button>
    </footer>
  );
}
