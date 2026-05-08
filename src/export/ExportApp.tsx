// ═══════════════════════════════════════════════════════════════════════
// EXPORT APP — The main React component for exported HTML
// Renders all pages using the SAME template components as preview.
// Navigation, scoring, and interactivity all use Zustand stores
// that are pre-populated by entry-client.tsx.
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useCallback, useEffect } from 'react';
import { PageTemplate } from '@/components/canva/page-template/PageTemplate';
import type { CanvaPage } from '@/components/canva/types';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';

// ── Constants ────────────────────────────────────────────────────

const TEMPLATE_ICON: Record<string, string> = {
  cover: '🏠', dokumen: '📋', materi: '📝', kuis: '❓',
  game: '🎮', hasil: '🏆', hero: '🚀', skenario: '🎭',
  petunjuk: '📌', diskusi: '💬', refleksi: '🪞', penutup: '🎓',
  custom: '⬜',
};

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

// ── Confetti Effect ──────────────────────────────────────────────

function launchConfetti() {
  const wrap = document.getElementById('confWrap');
  if (!wrap) return;
  const colors = ['#f9c12e', '#3ecfcf', '#34d399', '#a78bfa', '#ff6b6b', '#fb923c'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('div');
    c.className = 'conf';
    c.style.cssText = `left:${Math.random() * 100}%;top:-10px;width:${4 + Math.random() * 6}px;height:${4 + Math.random() * 6}px;background:${colors[Math.floor(Math.random() * colors.length)]};animation-duration:${1.5 + Math.random() * 2}s;animation-delay:${Math.random() * 0.5}s`;
    wrap.appendChild(c);
    setTimeout(() => c.remove(), 4000);
  }
}

// ── Main Export App Component ────────────────────────────────────

export default function ExportApp() {
  // Read data from stores (pre-populated by entry-client.tsx)
  const pages = useCanvaStore((s) => s.pages);
  const ratioId = useCanvaStore((s) => s.ratioId);
  const meta = useAuthoringStore((s) => s.meta);

  // ── Expose interactive store for Live Preview postMessage bridge ──
  // This allows the parent iframe (use-preview-builder.ts) to navigate
  // slides via window.__INTERACTIVE_STORE__.getState().goInteractivePage(idx)
  useEffect(() => {
    (window as any).__INTERACTIVE_STORE__ = useInteractiveStore;
    return () => { delete (window as any).__INTERACTIVE_STORE__; };
  }, []);

  // Interactive store for navigation + scoring
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);
  const goInteractivePage = useInteractiveStore((s) => s.goInteractivePage);
  const nextInteractivePage = useInteractiveStore((s) => s.nextInteractivePage);
  const prevInteractivePage = useInteractiveStore((s) => s.prevInteractivePage);
  const totalScore = useInteractiveStore((s) => s.totalScore);
  const totalMax = useInteractiveStore((s) => s.totalMax);
  const totalPct = useInteractiveStore((s) => s.totalPct);
  const resetAllScores = useInteractiveStore((s) => s.resetAllScores);

  const currentIdx = interactivePageIdx;
  const totalPages = pages.length;

  // Derived values
  const progressPct = totalPages > 0 ? Math.round(((currentIdx + 1) / totalPages) * 100) : 0;
  const currentTemplate = pages[currentIdx]?.templateType || 'custom';
  const nextTemplate = pages[currentIdx + 1]?.templateType || '';
  const hasScore = totalMax() > 0;
  const isLastPage = currentIdx >= totalPages - 1;
  const currentPage = pages[currentIdx];

  // ── Navigation handlers ───────────────────────────────────────
  const handleNext = useCallback(() => {
    if (isLastPage) {
      launchConfetti();
    } else {
      nextInteractivePage();
    }
  }, [isLastPage, nextInteractivePage]);

  const handlePrev = useCallback(() => {
    prevInteractivePage();
  }, [prevInteractivePage]);

  const handleNav = useCallback((idx: number) => {
    goInteractivePage(idx);
    window.scrollTo(0, 0);
  }, [goInteractivePage]);

  const handleReset = useCallback(() => {
    resetAllScores();
    goInteractivePage(0);
    window.scrollTo(0, 0);
  }, [resetAllScores, goInteractivePage]);

  // ── Dynamic bottom nav height observer ─────────────────────────
  // Observes the bottom nav bar height and updates --export-nav-h CSS variable
  // so the page content always fills the remaining viewport space accurately.
  useEffect(() => {
    const navEl = document.getElementById('exportBottomNav');
    if (!navEl) return;
    const updateHeight = () => {
      const h = navEl.offsetHeight;
      document.documentElement.style.setProperty('--export-nav-h', `${h}px`);
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(navEl);
    return () => ro.disconnect();
  }, [hasScore]);

  // ── Keyboard navigation ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); handleNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNext, handlePrev]);

  // ── Touch/swipe support ───────────────────────────────────────
  useEffect(() => {
    let startX = 0;
    const onTouchStart = (e: TouchEvent) => { startX = e.changedTouches[0].screenX; };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].screenX - startX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) handleNext();
        else handlePrev();
      }
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleNext, handlePrev]);

  // ── No pages state ─────────────────────────────────────────────
  if (totalPages === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-white/60">Belum ada halaman untuk ditampilkan.</p>
        </div>
      </div>
    );
  }

  const isFullPage = ['cover', 'hasil', 'hero'].includes(currentTemplate);
  const isTemplateMode = currentPage?.templateType && currentPage.templateType !== 'custom';

  return (
    <>
      <div className="min-h-screen bg-slate-900 text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>
        {pages.map((page, i) => {
          const isActive = i === currentIdx;
          const templateType = page.templateType || 'custom';
          const isFull = ['cover', 'hasil', 'hero'].includes(templateType);
          const isTemplate = templateType !== 'custom';

          // Background style
          const bgStyle: React.CSSProperties = page.bgDataUrl
            ? { backgroundImage: `url('${page.bgDataUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: page.bgColor || '#0e1c2f' };

          return (
            <div
              key={page.id || i}
              className={isActive ? 'block' : 'hidden'}
              style={{
                // Dynamic height: full viewport minus bottom nav bar.
                // We use a CSS variable --export-nav-h updated by a resize observer
                // so the page content always fills exactly the right space.
                height: 'calc(100vh - var(--export-nav-h, 72px))',
                position: 'relative',
                overflow: 'hidden',
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
                    {totalScore()} ⭐
                  </span>
                </nav>
              )}

              {/* ── Page Content ── */}
              {isTemplate ? (
                // Template mode: render PageTemplate directly
                // It uses absolute inset-0, so it fills the container
                <>
                  <PageTemplate
                    key={page.id}
                    page={page}
                    isSelected={false}
                    onEditField={() => {}}
                    interactive={true}
                  />
                  {/* Overlay elements on template pages */}
                  {(page.overlayElements || []).filter(el => !el.hidden).length > 0 && (
                    <div className="absolute inset-0" style={{ zIndex: 10 }}>
                      {page.overlayElements.filter(el => !el.hidden).map(el => (
                        <div key={el.id} style={{
                          position: 'absolute',
                          left: `${el.x}%`, top: `${el.y}%`,
                          width: `${el.w}%`, height: `${el.h}%`,
                          opacity: (el.opacity || 100) / 100,
                          pointerEvents: 'auto',
                          zIndex: 20,
                        }}>
                          {el.type === 'teks' && (
                            <div style={{ fontSize: `${el.fontSize || 20}px`, fontWeight: 700, color: el.textColor || '#fff', padding: 8, lineHeight: 1.4 }}>
                              {el.text || ''}
                            </div>
                          )}
                          {el.type === 'shape' && (
                            <div style={{ width: '100%', height: '100%', background: el.color || 'rgba(255,255,255,.15)', borderRadius: `${el.radius || 8}px` }} />
                          )}
                          {el.icon && el.type !== 'teks' && el.type !== 'shape' && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                              <span style={{ fontSize: '2rem' }}>{el.icon}</span>
                            </div>
                          )}
                          {!el.type && el.icon && (
                            <span className="text-2xl">{el.icon}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Custom mode: render elements manually
                <div className="absolute inset-0">
                  {page.elements.filter(el => !el.hidden).map(el => (
                    <div key={el.id} style={{
                      position: 'absolute',
                      left: `${el.x}%`, top: `${el.y}%`,
                      width: `${el.w}%`, height: `${el.h}%`,
                      opacity: (el.opacity || 100) / 100,
                    }}>
                      {el.type === 'teks' && (
                        <div style={{ fontSize: `${el.fontSize || 20}px`, fontWeight: 700, color: el.textColor || '#fff', padding: 8, lineHeight: 1.4 }}>
                          {el.text || ''}
                        </div>
                      )}
                      {el.type === 'shape' && (
                        <div style={{ width: '100%', height: '100%', background: el.color || 'rgba(255,255,255,.15)', borderRadius: `${el.radius || 8}px` }} />
                      )}
                      {el.icon && el.type !== 'teks' && el.type !== 'shape' && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <span style={{ fontSize: '2rem' }}>{el.icon}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Bottom Navigation Bar ── */}
      <div id="exportBottomNav" className="fixed bottom-0 left-0 right-0 z-[300] border-t border-white/10"
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
            onClick={handlePrev}
            disabled={currentIdx <= 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold border border-white/10 bg-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
          >
            ← Prev
          </button>

          {/* Page dots */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-[50vw] py-0.5">
            {pages.map((p, i) => (
              <button
                key={p.id || i}
                onClick={() => handleNav(i)}
                title={`${p.label || `Halaman ${i + 1}`} (${i + 1}/${totalPages})`}
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer border-2 transition-all ${
                  i === currentIdx
                    ? 'border-emerald-400 bg-emerald-400/15 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                    : 'border-transparent bg-white/5 hover:bg-white/10'
                }`}
              >
                {TEMPLATE_ICON[p.templateType || 'custom'] || '📄'}
              </button>
            ))}
          </div>

          {/* Score + Counter + Next */}
          <div className="flex items-center gap-1.5">
            {hasScore && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-[10px] font-extrabold text-emerald-400">
                ⭐ {totalScore()}/{totalMax()} ({totalPct()}%)
              </div>
            )}
            <span className="text-[10px] font-bold text-slate-400">
              {currentIdx + 1}/{totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={false}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-amber-400 text-slate-900 hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              {isLastPage ? '🎉 Selesai' : getNextLabel(currentTemplate, nextTemplate)}
            </button>
          </div>
        </div>

        {/* Reset button */}
        {hasScore && (
          <div className="flex justify-center pb-1">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 transition-all"
            >
              ↩ Ulangi Semua
            </button>
          </div>
        )}
      </div>

      {/* ── Confetti container ── */}
      <div id="confWrap" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }} />
    </>
  );
}
