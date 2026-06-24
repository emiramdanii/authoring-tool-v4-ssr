'use client';

import React, { useState, useRef, useLayoutEffect } from 'react';
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
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const pageBtnRef = useRef<HTMLButtonElement>(null);
  const blockBtnRef = useRef<HTMLButtonElement>(null);
  const [pageMenuPos, setPageMenuPos] = useState({ top: 0, left: 0 });
  const [blockMenuPos, setBlockMenuPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (showPageMenu && pageBtnRef.current) {
      const rect = pageBtnRef.current.getBoundingClientRect();
      const menuWidth = 288;
      const left = Math.max(8, rect.left + rect.width / 2 - menuWidth / 2);
      setPageMenuPos({ top: Math.max(8, rect.top - 400), left });
    }
  }, [showPageMenu]);

  // V3-PHASE-2: Block menu positioning
  useLayoutEffect(() => {
    if (showBlockMenu && blockBtnRef.current) {
      const rect = blockBtnRef.current.getBoundingClientRect();
      const menuWidth = 256;
      const left = Math.max(8, rect.left + rect.width / 2 - menuWidth / 2);
      setBlockMenuPos({ top: Math.max(8, rect.top - 300), left });
    }
  }, [showBlockMenu]);

  const handleAddPage = (templateType: PageTemplateType) => {
    if (templateType === 'custom') {
      addPage();
      toast.success('Halaman kosong ditambahkan');
    } else {
      addTemplatePage(templateType);
    }
    setShowPageMenu(false);
  };

  const handleAddBlock = (blockType: string) => {
    addSchemaBlock(blockType);
    toast.success('Bagian ditambahkan');
    setShowBlockMenu(false);
  };

  const handleAddGame = () => {
    addTemplatePage('game');
  };

  // V3-PHASE-2: Block palette — 5 block types via addSchemaBlock
  const BLOCK_OPTIONS: Array<{ type: string; label: string; icon: string }> = [
    { type: 'materi-section', label: 'Materi', icon: 'menu_book' },
    { type: 'def-box', label: 'Definisi', icon: 'menu_book' },
    { type: 'diskusi', label: 'Pertanyaan Diskusi', icon: 'forum' },
    { type: 'refleksi', label: 'Refleksi', icon: 'psychology' },
    { type: 'rangkuman', label: 'Rangkuman', icon: 'summarize' },
  ];

  const blockMenu = showBlockMenu ? createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setShowBlockMenu(false)} aria-hidden="true" />
      <div
        className="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-64"
        style={{ top: `${blockMenuPos.top}px`, left: `${blockMenuPos.left}px` }}
        role="menu"
        aria-label="Pilih tipe blok"
      >
        <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">Tambah Blok</div>
        {BLOCK_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            onClick={() => handleAddBlock(opt.type)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors text-left"
            role="menuitem"
            type="button"
          >
            <span className="material-symbols-outlined text-slate-400 flex-shrink-0" aria-hidden="true" style={{ fontSize: '18px' }}>{opt.icon}</span>
            <span className="font-medium">{opt.label}</span>
          </button>
        ))}
      </div>
    </>,
    document.body,
  ) : null;

  const pageMenu = showPageMenu ? createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setShowPageMenu(false)} aria-hidden="true" />
      <div
        className="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-72"
        style={{ top: `${pageMenuPos.top}px`, left: `${pageMenuPos.left}px` }}
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
          ref={pageBtnRef}
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
      <div className="relative">
        <button
          ref={blockBtnRef}
          onClick={() => setShowBlockMenu(!showBlockMenu)}
          disabled={!pages[currentPageIndex]}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          aria-label="Tambah blok"
          aria-expanded={showBlockMenu}
          type="button"
        >
          <span className="material-symbols-outlined text-emerald-600" aria-hidden="true" style={{ fontSize: '18px' }}>add</span>
          Tambah Blok
        </button>
        {blockMenu}
      </div>
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
