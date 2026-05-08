// ═══════════════════════════════════════════════════════════════════════
// EXPORT APP — The main React component for exported HTML
// Renders all pages using the SAME template components as preview
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { PageTemplate } from '@/components/canva/page-template/PageTemplate';
import type { CanvaPage } from '@/components/canva/types';
import { RATIOS } from '@/components/canva/types';

// ── Types ────────────────────────────────────────────────────────

interface ExportProps {
  pages: CanvaPage[];
  ratioId: string;
  meta: {
    judulPertemuan?: string;
    subjudul?: string;
    namaBab?: string;
    mapel?: string;
    kelas?: string;
  };
  gameData: Record<string, unknown>;
  gameEngineJS: string;
}

// ── Screen ID assignment (same as old export) ────────────────────

const TEMPLATE_TO_SCREEN: Record<string, string> = {
  cover: 's-cover', dokumen: 's-cp', materi: 's-materi',
  kuis: 's-kuis', game: 's-games', hasil: 's-hasil',
  hero: 's-hero', skenario: 's-sk', petunjuk: 's-petunjuk',
  diskusi: 's-diskusi', refleksi: 's-refleksi', penutup: 's-penutup',
  custom: 's-custom',
};

const TEMPLATE_ICON: Record<string, string> = {
  cover: '🏠', dokumen: '📋', materi: '📝', kuis: '❓',
  game: '🎮', hasil: '🏆', hero: '🚀', skenario: '🎭',
  petunjuk: '📌', diskusi: '💬', refleksi: '🪞', penutup: '🎓',
  custom: '⬜',
};

function getScreenId(page: CanvaPage, idx: number): string {
  if (page.templateType && page.templateType !== 'custom') {
    return TEMPLATE_TO_SCREEN[page.templateType] || `s-page-${idx}`;
  }
  return `s-page-${idx}`;
}

// ── Context-aware button labels ──────────────────────────────────

function getNextLabel(templateType: string, nextTemplateType: string): string {
  switch (templateType) {
    case 'cover': return 'Mulai Belajar →';
    case 'petunjuk': return 'Tujuan Pembelajaran →';
    case 'dokumen': return 'Mulai Pembelajaran →';
    case 'skenario':
      if (nextTemplateType === 'materi') return 'Lanjut ke Materi →';
      if (nextTemplateType === 'kuis') return 'Lanjut ke Kuis →';
      return 'Lanjut →';
    case 'materi':
      if (nextTemplateType === 'kuis') return 'Mulai Kuis ❓';
      return 'Lanjut →';
    case 'refleksi': return 'Lihat Hasil →';
    case 'penutup': return 'Lihat Hasil →';
    default: return 'Lanjut →';
  }
}

// ── Main Export App Component ────────────────────────────────────

export default function ExportApp({ pages, ratioId, meta, gameEngineJS }: ExportProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalMax, setTotalMax] = useState(0);

  const nodes = pages.map((p, i) => ({
    screenId: getScreenId(p, i),
    templateType: p.templateType || 'custom',
    label: p.label || `Halaman ${i + 1}`,
  }));

  const goScreen = useCallback((idx: number) => {
    if (idx >= 0 && idx < pages.length) {
      setCurrentIdx(idx);
      window.scrollTo(0, 0);
    }
  }, [pages.length]);

  const nextScreen = useCallback(() => {
    if (currentIdx < pages.length - 1) goScreen(currentIdx + 1);
  }, [currentIdx, goScreen, pages.length]);

  const prevScreen = useCallback(() => {
    if (currentIdx > 0) goScreen(currentIdx - 1);
  }, [currentIdx, goScreen]);

  const reportScore = useCallback((score: number, max: number) => {
    setTotalScore(prev => prev + score);
    setTotalMax(prev => prev + max);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); nextScreen(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevScreen(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nextScreen, prevScreen]);

  // Touch/swipe
  useEffect(() => {
    let startX = 0;
    const onTouchStart = (e: TouchEvent) => { startX = e.changedTouches[0].screenX; };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].screenX - startX;
      if (Math.abs(dx) > 50) { if (dx < 0) nextScreen(); else prevScreen(); }
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [nextScreen, prevScreen]);

  const progressPct = Math.round(((currentIdx + 1) / pages.length) * 100);
  const currentTemplate = nodes[currentIdx]?.templateType || 'custom';
  const nextTemplate = nodes[currentIdx + 1]?.templateType || '';

  return (
    <>
      {/* ── Google Fonts ── */}
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap" rel="stylesheet" />

      {/* ── Screen Container ── */}
      <div className="min-h-screen bg-slate-900 text-white font-['Nunito',sans-serif]">
        {pages.map((page, i) => {
          const screenId = getScreenId(page, i);
          const isActive = i === currentIdx;
          const templateType = page.templateType || 'custom';
          const isFullPage = ['cover', 'hasil', 'hero'].includes(templateType);

          // Background style
          const bgStyle: React.CSSProperties = page.bgDataUrl
            ? { backgroundImage: `url('${page.bgDataUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: page.bgColor || '#0e1c2f' };

          return (
            <div
              key={screenId}
              id={screenId}
              className={isActive ? 'block' : 'hidden'}
              style={{
                minHeight: '100vh',
                position: 'relative',
                paddingBottom: '80px', // Space for bottom nav
                ...bgStyle,
              }}
            >
              {/* Overlay for background images */}
              {page.bgDataUrl && (
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    background: `rgba(0,0,0,${(page.overlay ?? 20) / 100})`,
                    pointerEvents: 'none', zIndex: 0,
                  }}
                />
              )}

              {/* ── Top Navbar (hidden on cover) ── */}
              {templateType !== 'cover' && (
                <nav className="sticky top-0 z-50 flex items-center gap-2 px-4 py-2.5 border-b border-white/10"
                  style={{ background: 'rgba(14,28,47,0.96)', backdropFilter: 'blur(12px)' }}>
                  <span className="font-['Fredoka_One'] text-sm text-amber-400 whitespace-nowrap">
                    {meta.namaBab || meta.judulPertemuan || 'Media'}
                  </span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full mx-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPct}%`,
                        background: 'linear-gradient(90deg, #f9c12e, #3ecfcf)',
                      }} />
                  </div>
                  <span className="text-xs font-extrabold text-amber-400 whitespace-nowrap">
                    {totalScore} ⭐
                  </span>
                </nav>
              )}

              {/* ── Page Content ── */}
              <div
                className="relative z-10"
                style={{
                  flex: 1,
                  ...(isFullPage
                    ? { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '36px 18px' }
                    : { padding: '22px 16px', maxWidth: '860px', width: '100%', margin: '0 auto' }),
                }}
              >
                <PageTemplate
                  page={page}
                  isSelected={false}
                  onEditField={() => {}}
                  interactive={true}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Navigation Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-[300] border-t border-white/10"
        style={{ background: 'rgba(14,28,47,0.96)', backdropFilter: 'blur(12px)' }}>
        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <div className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #34d399, #3ecfcf)',
            }} />
        </div>

        {/* Nav bar */}
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          {/* Prev button */}
          <button
            onClick={prevScreen}
            disabled={currentIdx <= 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold border border-white/10 bg-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
          >
            ← Prev
          </button>

          {/* Page dots */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-[50vw] py-0.5">
            {nodes.map((n, i) => (
              <button
                key={n.screenId}
                onClick={() => goScreen(i)}
                title={`${n.label} (${i + 1}/${nodes.length})`}
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer border-2 transition-all ${
                  i === currentIdx
                    ? 'border-emerald-400 bg-emerald-400/15 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                    : 'border-transparent bg-white/5 hover:bg-white/10'
                }`}
              >
                {TEMPLATE_ICON[n.templateType] || '📄'}
              </button>
            ))}
          </div>

          {/* Score + Counter + Next */}
          <div className="flex items-center gap-1.5">
            {totalMax > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-[10px] font-extrabold text-emerald-400">
                ⭐ {totalScore}/{totalMax} ({Math.round((totalScore / totalMax) * 100)}%)
              </div>
            )}
            <span className="text-[10px] font-bold text-slate-400">
              {currentIdx + 1}/{pages.length}
            </span>
            <button
              onClick={nextScreen}
              disabled={currentIdx >= pages.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-amber-400 text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              {currentIdx >= pages.length - 1 ? '🎉 Selesai' : getNextLabel(currentTemplate, nextTemplate)}
            </button>
          </div>
        </div>
      </div>

      {/* ── Confetti container ── */}
      <div id="confWrap" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }} />

      {/* ── Game Engine JS (injected as script) ── */}
      {gameEngineJS && (
        <script dangerouslySetInnerHTML={{ __html: gameEngineJS }} />
      )}
    </>
  );
}
