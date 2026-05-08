// ═══════════════════════════════════════════════════════════════════════
// EXPORT APP — The main React component for exported HTML
// Renders all pages using the SAME template components as preview.
// Navigation, scoring, and interactivity all use Zustand stores
// that are pre-populated by entry-client.tsx.
//
// Phase 9 fixes:
// - Only render ACTIVE page (perf + prevent hidden timers)
// - Full element rendering: kuis, game, materi, modul (not just teks/shape)
// - Top navbar no longer overlaps template content
// - Overlay elements render kuis/game properly
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { PageTemplate } from '@/components/canva/page-template/PageTemplate';
import type { CanvaElement, CanvaPage, NavConfig } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';
import QuizWidget from '@/components/canva/QuizWidget';
import GameWidget from '@/components/canva/GameWidget';
import PresetModuleCard from '@/components/shared/PresetModuleCard';
import type { LayoutVariant } from '@/components/shared/PresetModuleCard';
import { resolveModule } from '@/lib/module-resolver';

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

// Track confetti timeouts for proper cleanup on unmount
let confettiTimers: ReturnType<typeof setTimeout>[] = [];

function launchConfetti() {
  const wrap = document.getElementById('confWrap');
  if (!wrap) return;
  // Clear any previous timers
  confettiTimers.forEach(t => clearTimeout(t));
  confettiTimers = [];
  const colors = ['#f9c12e', '#3ecfcf', '#34d399', '#a78bfa', '#ff6b6b', '#fb923c'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('div');
    c.className = 'conf';
    c.style.cssText = `left:${Math.random() * 100}%;top:-10px;width:${4 + Math.random() * 6}px;height:${4 + Math.random() * 6}px;background:${colors[Math.floor(Math.random() * colors.length)]};animation-duration:${1.5 + Math.random() * 2}s;animation-delay:${Math.random() * 0.5}s`;
    wrap.appendChild(c);
    const timer = setTimeout(() => c.remove(), 4000);
    confettiTimers.push(timer);
  }
}

function clearConfetti() {
  confettiTimers.forEach(t => clearTimeout(t));
  confettiTimers = [];
  const wrap = document.getElementById('confWrap');
  if (wrap) wrap.innerHTML = '';
}

// ── Get effective navConfig for a page (with defaults) ───────────

function getNavConfig(page: CanvaPage): NavConfig {
  return page.navConfig || DEFAULT_NAV_CONFIG;
}

// ── Export Element — Full interactive element renderer ────────────
// Renders kuis, game, materi, modul, teks, shape — same as PlayOverlay

function ExportElement({ element, pageIndex }: { element: CanvaElement; pageIndex: number }) {
  const reportScore = useInteractiveStore((s) => s.reportScore);
  const modules = useAuthoringStore((s) => s.modules);

  const handleComplete = useCallback(
    (score: number, maxScore: number) => {
      if (maxScore === 0) return; // Skip non-scored games
      reportScore({ elementId: element.id, pageIndex, score, maxScore, completed: true });
    },
    [element.id, pageIndex, reportScore],
  );

  const isInteractive = element.type === 'kuis' || element.type === 'game';

  return (
    <div
      className={`absolute ${isInteractive ? 'ring-2 ring-emerald-400/50 rounded' : ''}`}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.w}%`,
        height: `${element.h}%`,
        opacity: (element.opacity ?? 100) / 100,
      }}
    >
      {element.type === 'kuis' && (
        <QuizWidget
          dataIdx={element.dataIdx}
          kuisId={element.kuisId}
          kuisIds={element.kuisIds}
          compact={false}
          interactive
          onComplete={handleComplete}
        />
      )}
      {element.type === 'game' && (
        <GameWidget
          dataIdx={element.dataIdx}
          moduleId={element.moduleId}
          compact={false}
          interactive
          onComplete={handleComplete}
        />
      )}
      {(element.type === 'materi' || element.type === 'modul') && (
        <ExportModuleElement element={element} />
      )}
      {element.type === 'teks' && (
        <div
          className="w-full h-full outline-none"
          style={{
            fontSize: `${element.fontSize || 20}px`,
            fontWeight: 700,
            color: element.textColor || '#ffffff',
            textShadow: '0 2px 8px rgba(0,0,0,.5)',
            lineHeight: 1.4,
            padding: 8,
          }}
        >
          {element.text || ''}
        </div>
      )}
      {element.type === 'shape' && (
        <div
          className="w-full h-full"
          style={{
            background: element.color || 'rgba(255,255,255,.15)',
            borderRadius: element.radius || 8,
          }}
        />
      )}
    </div>
  );
}

// ── Export Module Element ────────────────────────────────────────
// Phase 9 fix: use full PresetModuleCard for visual fidelity with preview
// (was a simplified card that looked different from the PlayOverlay rendering)

function ExportModuleElement({ element }: { element: CanvaElement }) {
  const modules = useAuthoringStore((s) => s.modules);
  const mod = resolveModule(element, modules);

  if (!mod) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-emerald-500/10 rounded border border-emerald-500/20 p-2">
        <span className="text-2xl">🧩</span>
        <span className="text-[10px] font-bold text-emerald-300 mt-1">Modul</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-1">
      <PresetModuleCard
        mode="canvas"
        module={mod as Parameters<typeof PresetModuleCard>[0]['module']}
        layoutVariant={(mod.layoutVariant as LayoutVariant) || 'A'}
      />
    </div>
  );
}

// ── Main Export App Component ────────────────────────────────────

export default function ExportApp() {
  // Read data from stores (pre-populated by entry-client.tsx)
  const pages = useCanvaStore((s) => s.pages);
  const meta = useAuthoringStore((s) => s.meta);

  // ── Expose interactive store for Live Preview postMessage bridge ──
  useEffect(() => {
    (window as any).__INTERACTIVE_STORE__ = useInteractiveStore;
    return () => {
      delete (window as any).__INTERACTIVE_STORE__;
      clearConfetti();
    };
  }, []);

  // Interactive store for navigation + scoring
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);
  const goInteractivePage = useInteractiveStore((s) => s.goInteractivePage);
  const nextInteractivePage = useInteractiveStore((s) => s.nextInteractivePage);
  const prevInteractivePage = useInteractiveStore((s) => s.prevInteractivePage);
  // Subscribe to scores[] for reactive updates
  const scores = useInteractiveStore((s) => s.scores);
  const _totalScore = useInteractiveStore((s) => s.scores.reduce((sum: number, sc: { score: number }) => sum + sc.score, 0));
  const _totalMax = useInteractiveStore((s) => s.scores.reduce((sum: number, sc: { maxScore: number }) => sum + sc.maxScore, 0));
  const _totalPct = useInteractiveStore((s) => {
    const max = s.scores.reduce((sum: number, sc: { maxScore: number }) => sum + sc.maxScore, 0);
    if (max === 0) return 0;
    return Math.round((s.scores.reduce((sum: number, sc: { score: number }) => sum + sc.score, 0) / max) * 100);
  });
  const isPageComplete = useInteractiveStore((s) => s.isPageComplete);
  const resetAllScores = useInteractiveStore((s) => s.resetAllScores);
  const goPage = useCanvaStore((s) => s.goPage);

  // Suppress unused variable warning — scores subscription needed for reactivity
  void scores;

  const currentIdx = interactivePageIdx;
  const totalPages = pages.length;

  // Derived values
  const progressPct = totalPages > 0 ? Math.round(((currentIdx + 1) / totalPages) * 100) : 0;
  const currentTemplate = pages[currentIdx]?.templateType || 'custom';
  const nextTemplate = pages[currentIdx + 1]?.templateType || '';
  const hasScore = _totalMax > 0;
  const isLastPage = currentIdx >= totalPages - 1;
  const currentPage = pages[currentIdx];

  // NavConfig for current page
  const navConfig = currentPage ? getNavConfig(currentPage) : DEFAULT_NAV_CONFIG;
  const showNavbar = navConfig.showNavbar !== false;
  const showPrevNext = navConfig.showPrevNext !== false;
  const showScore = navConfig.showScore !== false;
  const showProgress = navConfig.showProgress !== false;

  // Compute showTopNav early (needed by useEffect before early returns)
  // TDZ fix: moved before useEffect that references it
  const currentTemplateType = currentPage?.templateType || 'custom';
  const showTopNav = currentTemplateType !== 'cover' && navConfig.showNavbar !== false;

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
    goPage(idx);
    window.scrollTo(0, 0);
  }, [goInteractivePage, goPage]);

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

  // ── Dynamic top nav height observer ─────────────────────────
  useEffect(() => {
    const topNavEl = document.getElementById('exportTopNav');
    if (!topNavEl) {
      // No top nav on cover pages — reset to default
      document.documentElement.style.setProperty('--export-topnav-h', '44px');
      return;
    }
    const updateHeight = () => {
      const h = topNavEl.offsetHeight;
      document.documentElement.style.setProperty('--export-topnav-h', `${h}px`);
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(topNavEl);
    return () => ro.disconnect();
  }, [showTopNav]);

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

  // ── Render ONLY the active page ────────────────────────────────
  // Phase 9 fix: previously all pages were rendered simultaneously (hidden/shown).
  // This caused all game timers to run on hidden pages, wasting resources and
  // causing score desyncs. Now only the active page is mounted.
  const page = currentPage;
  if (!page) return null;

  const templateType = page.templateType || 'custom';
  const isTemplate = templateType !== 'custom';
  const pageNavConfig = getNavConfig(page);
  const pageShowProgress = pageNavConfig.showProgress !== false;
  // showTopNav is already computed above (before early returns for TDZ safety)

  // Background style — Phase 9 visual fidelity fix:
  // - Default fallback matches PlayOverlay (#1a1a2e, not #0e1c2f)
  // - Background image uses <img> tag (like PlayOverlay) for pixel-perfect rendering
  // - Overlay is ALWAYS rendered (like PlayOverlay), not just when bgDataUrl exists
  const safeBgDataUrl = page.bgDataUrl?.startsWith('data:image/') ? page.bgDataUrl : null;
  const bgStyle: React.CSSProperties = page.bgColor?.includes('gradient')
    ? { background: page.bgColor }
    : { background: page.bgColor || '#1a1a2e' };

  return (
    <>
      <div className="min-h-screen bg-slate-900 text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>
        {/* ── Page Container with page-transition for smooth navigation ── */}
        <div
          key={page.id}
          className="page-transition"
          style={{
            height: 'calc(100vh - var(--export-nav-h, 72px))',
            position: 'relative',
            overflow: 'hidden',
            ...bgStyle,
          }}
        >
          {/* Background image — uses <img> tag like PlayOverlay for pixel-perfect rendering */}
          {safeBgDataUrl && (
            <img
              src={safeBgDataUrl}
              alt=""
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Overlay — ALWAYS rendered (matching PlayOverlay behavior) */}
          {/* Note: uses || (not ??) to match PlayOverlay — overlay=0 still shows 20% */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: `rgba(14,28,47,${(page.overlay || 20) / 100})`,
              pointerEvents: 'none', zIndex: 0,
            }}
          />

          {/* ── Top Navbar (hidden on cover, respects navConfig) ── */}
          {/* Phase 9 fix: navbar is position: absolute now, with a spacer div
              below it so template content is NOT hidden behind the navbar */}
          {showTopNav && (
            <>
              <nav id="exportTopNav" className="glass-panel-strong absolute top-0 left-0 right-0 z-50 flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
                <span className="font-['Fredoka_One'] text-sm text-amber-400 whitespace-nowrap">
                  {meta.namaBab || meta.judulPertemuan || 'Media'}
                </span>
                {pageShowProgress && (
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full mx-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPct}%`,
                        background: 'linear-gradient(90deg, #34d399, #3ecfcf)',
                      }} />
                  </div>
                )}
                {hasScore && pageNavConfig.showScore !== false && (
                  <span className="text-xs font-extrabold text-amber-400 whitespace-nowrap">
                    {_totalScore} ⭐
                  </span>
                )}
              </nav>
              {/* Spacer measured dynamically from actual navbar height */}
              <div style={{ height: 'var(--export-topnav-h, 44px)' }} />
            </>
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
              {/* Overlay elements on template pages — now with full element rendering */}
              {(page.overlayElements || []).filter(el => !el.hidden).length > 0 && (
                <div className="absolute inset-0" style={{ zIndex: 10 }}>
                  {page.overlayElements.filter(el => !el.hidden).map(el => (
                    <ExportElement key={el.id} element={el} pageIndex={currentIdx} />
                  ))}
                </div>
              )}
            </>
          ) : (
            // Custom mode: render ALL element types including kuis/game/modul
            <div className="absolute inset-0">
              {page.elements.filter(el => !el.hidden).map(el => (
                <ExportElement key={el.id} element={el} pageIndex={currentIdx} />
              ))}
            </div>
          )}
        </div>
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
                  <span className="font-mono font-bold text-[11px] text-emerald-300">{_totalPct}%</span>
                  <span className="text-[9px] text-emerald-400/50">{_totalScore}/{_totalMax}</span>
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
                      ? 'bg-amber-400/30 text-slate-900/50 cursor-not-allowed opacity-50'
                      : 'bg-amber-400 text-slate-900 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer'
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
