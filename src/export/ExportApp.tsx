// ═══════════════════════════════════════════════════════════════════════
// EXPORT APP — The main React component for exported HTML
// Renders all pages using the SAME template components as preview.
// Navigation, scoring, and interactivity all use Zustand stores
// that are pre-populated by entry-client.tsx.
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useCallback, useEffect } from 'react';
import { PageTemplate } from '@/components/canva/page-template/PageTemplate';
import type { CanvaPage, NavConfig } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';
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

// ── Get effective navConfig for a page (with defaults) ───────────

function getNavConfig(page: CanvaPage): NavConfig {
  return page.navConfig || DEFAULT_NAV_CONFIG;
}

// ── Main Export App Component ────────────────────────────────────

export default function ExportApp() {
  // Read data from stores (pre-populated by entry-client.tsx)
  const pages = useCanvaStore((s) => s.pages);
  const meta = useAuthoringStore((s) => s.meta);

  // ── Expose interactive store for Live Preview postMessage bridge ──
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
  const isPageComplete = useInteractiveStore((s) => s.isPageComplete);
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

  // NavConfig for current page
  const navConfig = currentPage ? getNavConfig(currentPage) : DEFAULT_NAV_CONFIG;
  const showNavbar = navConfig.showNavbar !== false;
  const showPrevNext = navConfig.showPrevNext !== false;
  const showScore = navConfig.showScore !== false;
  const showProgress = navConfig.showProgress !== false;

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
  }, [hasScore, showNavbar]);

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

  return (
    <>
      <div className="min-h-screen bg-slate-900 text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>
        {pages.map((page, i) => {
          const isActive = i === currentIdx;
          const templateType = page.templateType || 'custom';
          const isTemplate = templateType !== 'custom';
          const pageNavConfig = getNavConfig(page);
          const pageShowProgress = pageNavConfig.showProgress !== false;

          // Background style — validate bgDataUrl starts with data:image/ to prevent CSS injection
          const safeBgDataUrl = page.bgDataUrl?.startsWith('data:image/') ? page.bgDataUrl : null;
          const bgStyle: React.CSSProperties = safeBgDataUrl
            ? { backgroundImage: `url('${safeBgDataUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: page.bgColor || '#0e1c2f' };

          return (
            <div
              key={page.id || i}
              className={isActive ? 'block' : 'hidden'}
              style={{
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

              {/* ── Top Navbar (hidden on cover, respects navConfig) ── */}
              {templateType !== 'cover' && pageNavConfig.showNavbar !== false && (
                <nav className="glass-panel-strong sticky top-0 z-50 flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
                  <span className="font-['Fredoka_One'] text-sm text-amber-400 whitespace-nowrap">
                    {meta.namaBab || meta.judulPertemuan || 'Media'}
                  </span>
                  {pageShowProgress && (
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full mx-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progressPct}%`,
                          background: 'linear-gradient(90deg, #f9c12e, #3ecfcf)',
                        }} />
                    </div>
                  )}
                  {hasScore && pageNavConfig.showScore !== false && (
                    <span className="text-xs font-extrabold text-amber-400 whitespace-nowrap">
                      {totalScore()} ⭐
                    </span>
                  )}
                </nav>
              )}

              {/* ── Page Content ── */}
              {isTemplate ? (
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

      {/* ── Bottom Navigation Bar (respects navConfig) ── */}
      {showNavbar && (
        <div id="exportBottomNav" className="glass-panel-strong fixed bottom-0 left-0 right-0 z-[300] border-t border-white/10">
          {/* Progress bar */}
          {showProgress && (
            <div className="h-1 bg-white/5">
              <div className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, #34d399, #3ecfcf)',
                }} />
            </div>
          )}

          {/* Nav bar */}
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            {/* Prev button */}
            {showPrevNext && (
              <button
                onClick={handlePrev}
                disabled={currentIdx <= 0}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentIdx > 0
                    ? 'hover:bg-white/10 text-white cursor-pointer'
                    : 'opacity-30 cursor-not-allowed text-white/50'
                }`}
              >
                ← Prev
              </button>
            )}

            {/* Page dots with completion indicators */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-[50vw] py-0.5">
              {pages.map((p, i) => {
                const isActive = i === currentIdx;
                const isComplete = isPageComplete(i);
                return (
                  <button
                    key={p.id || i}
                    onClick={() => handleNav(i)}
                    title={`${p.label || `Halaman ${i + 1}`} (${i + 1}/${totalPages})${isComplete ? ' ✓' : ''}`}
                    className={`relative flex-shrink-0 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'w-8 h-8 text-base bg-slate-700/40 ring-2 ring-emerald-400/60 shadow-lg shadow-emerald-500/20'
                        : `w-6 h-6 text-xs hover:bg-slate-800/40 ${isComplete ? 'ring-2 ring-emerald-400' : ''}`
                    }`}
                  >
                    {/* Completion dot indicator */}
                    <span className={`absolute rounded-full ${
                      isActive
                        ? 'w-2.5 h-2.5 bg-emerald-400'
                        : 'w-1.5 h-1.5 bg-slate-600'
                    }`} style={{ bottom: isActive ? 1 : 2, right: isActive ? 1 : 2 }} />
                    <span className="relative z-10">{TEMPLATE_ICON[p.templateType || 'custom'] || '📄'}</span>
                  </button>
                );
              })}
            </div>

            {/* Score + Counter + Next */}
            <div className="flex items-center gap-1.5">
              {hasScore && showScore && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px]">🏆</span>
                  <span className="font-mono font-bold text-[11px] text-emerald-300">{totalPct()}%</span>
                  <span className="text-[9px] text-emerald-400/50">{totalScore()}/{totalMax()}</span>
                </div>
              )}
              <span className="text-[10px] font-mono text-slate-500">
                {currentIdx + 1}/{totalPages}
              </span>
              {showPrevNext && (
                <button
                  onClick={handleNext}
                  disabled={isLastPage}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    isLastPage
                      ? 'bg-amber-400/80 text-slate-900 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg'
                      : 'bg-amber-400 text-slate-900 hover:-translate-y-0.5 hover:shadow-lg'
                  }`}
                >
                  {isLastPage ? '🎉 Selesai' : getNextLabel(currentTemplate, nextTemplate)}
                </button>
              )}
            </div>
          </div>

          {/* Reset button */}
          {hasScore && showScore && (
            <div className="flex justify-center pb-1">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors px-2 py-0.5 rounded"
              >
                ↩ Ulangi
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Confetti container ── */}
      <div id="confWrap" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }} />
    </>
  );
}
