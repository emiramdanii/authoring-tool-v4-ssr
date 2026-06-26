// @ts-nocheck — BATCH-12: quarantined to src/legacy-disabled/, not type-checked
'use client';

// ═══════════════════════════════════════════════════════════════
// MPI SCENE RAIL — Left sidebar page list for MPI Studio
// ═══════════════════════════════════════════════════════════════
// EDITOR-RADICAL-RESET-01: Replaces the old IconRail + LeftPanel
// (templates/add-block/pages/layers/settings tabs) with a simple
// vertical list of pages.
//
// Each page shows a friendly label (Cover, Petunjuk, Tujuan, Materi,
// Kuis, Game, Refleksi, Penutup) derived from the page's
// templateType — NOT the internal "Scene 1: Cover" developer jargon.
//
// Clicking a page calls useCanvaStore.getState().goPage(index).
// Active page is highlighted with emerald accent.

import React, { useMemo } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import type { CanvaPage } from '@/components/canva/types';

// ── Friendly page labels by templateType ─────────────────────────
// Maps the internal templateType to teacher-friendly Indonesian labels.
// Falls back to the page's label field if templateType is unknown.
const PAGE_LABELS: Record<string, { label: string; icon: string }> = {
  cover: { label: 'Cover', icon: 'auto_stories' },
  petunjuk: { label: 'Petunjuk', icon: 'list_alt' },
  dokumen: { label: 'Dokumen', icon: 'description' },
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
  hero: { label: 'Hero', icon: 'view_carousel' },
  custom: { label: 'Halaman', icon: 'crop_landscape' },
};

function getPageLabel(page: CanvaPage, index: number): { label: string; icon: string } {
  const t = (page.templateType || 'custom') as string;
  const mapped = PAGE_LABELS[t];
  if (mapped) return mapped;
  // Fallback to page's own label, or generic "Halaman N"
  return {
    label: page.label || `Halaman ${index + 1}`,
    icon: 'crop_landscape',
  };
}

export function MpiSceneRail() {
  const pages = useCanvaStore((s) => s.pages);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const goPage = useCanvaStore((s) => s.goPage);

  const pageList = useMemo(() => {
    return pages.map((page, index) => {
      const { label, icon } = getPageLabel(page, index);
      return { index, page, label, icon };
    });
  }, [pages]);

  return (
    <nav
      className="flex flex-col w-56 min-w-56 bg-slate-50 border-r border-slate-200 overflow-y-auto"
      aria-label="Alur Media"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 sticky top-0 bg-slate-50 z-10">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Alur Media
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{pages.length} halaman</p>
      </div>

      {/* Page list */}
      <ul className="flex-1 py-2" role="list">
        {pageList.map(({ index, label, icon }) => {
          const isActive = index === currentPageIndex;
          return (
            <li key={`page-${index}`} role="listitem">
              <button
                onClick={() => goPage(index)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-medium border-l-2 border-emerald-600'
                    : 'text-slate-600 hover:bg-slate-100 border-l-2 border-transparent'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Halaman ${index + 1}: ${label}`}
                type="button"
              >
                <span
                  className={`material-symbols-outlined flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
                  aria-hidden="true"
                  style={{ fontSize: '18px' }}
                >
                  {icon}
                </span>
                <span className="flex-1 min-w-0 truncate">{label}</span>
                <span className={`text-xs flex-shrink-0 ${isActive ? 'text-emerald-500' : 'text-slate-300'}`}>
                  {index + 1}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Empty state */}
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
