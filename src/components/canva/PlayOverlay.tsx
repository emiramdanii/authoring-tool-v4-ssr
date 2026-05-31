'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PageTransition, type PageDirection } from '@/lib/transition';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { PageRenderer } from './page-renderer';
import { RATIOS } from './types';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { COLORS } from '@/lib/color-palette';
import { TEMPLATE_ICON_MAP } from '@/lib/canva-icon-maps';
// All icons migrated to Material Symbols Outlined
import { Button } from '@/components/ui/button';
import { getScoreTier } from './page-renderer/PageFrame';
import { ScoreDisplay } from './page-renderer/ScoreDisplay';
import { computeSceneScale } from '@/core/scene/SceneLayoutEngine';

// ═══════════════════════════════════════════════════════════════
// PLAY OVERLAY — Full-screen interactive preview overlay
//
// Premium v4 enhancements:
// - CSS-based page transitions (slide/fade) via PageTransition
// - Bottom navigation bar with progress dots + score tier
// - Score summary with star rating + tier label
// - Smooth page transition with directional awareness
// - Keyboard shortcuts (Esc, ← →, F, O, Space)
// ═══════════════════════════════════════════════════════════════



export default function PlayOverlay() {
  const mode = useInteractiveStore((s) => s.mode);
  const isPlaying = mode === 'interactive';

  if (!isPlaying) return null;

  return (
    <div
      className="fixed inset-0 bg-app-surface flex flex-col select-none anim-enter-fade"
      style={{ zIndex: 70 }}
    >
      {/* Top bar */}
      <PlayOverlayHeader />

      {/* Main canvas area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PlayCanvas />
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────

function PlayOverlayHeader() {
  const closePlay = useInteractiveStore((s) => s.closePlay);
  const pages = useCanvaStore((s) => s.pages);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);
  const totalPctVal = useInteractiveStore((s) => s.totalPct());
  const totalMaxVal = useInteractiveStore((s) => s.totalMax());

  const page = pages[interactivePageIdx];
  const hasScore = totalMaxVal > 0;
  const tier = hasScore ? getScoreTier(totalPctVal) : null;

  // TokenResolver-like interface for ScoreDisplay
  const headerTokens = {
    color: (token: string) => token === 'muted' ? 'var(--color-app-muted, #94a3b8)' : 'var(--color-app-primary, #ffffff)',
    colorAlpha: (token: string, a: number) => token === 'muted' ? `rgba(148,163,184,${a})` : `rgba(255,255,255,${a})`,
  };

  return (
    <div className="bg-app-surface flex items-center justify-between px-4 py-2 border-b border-app-border">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: '14px' }}>sports_esports</span>
        <span className="text-xs font-bold text-emerald-400">Mode Interaktif</span>
        <span className="text-[10px] text-app-muted">•</span>
        <span className="text-[10px] text-app-primary font-semibold truncate max-w-[200px]">
          {page?.label || `Halaman ${interactivePageIdx + 1}`}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {hasScore && (
          <div className="flex items-center gap-2">
            {/* Premium animated score pill */}
            <ScoreDisplay
              navbarStyle={page?.navConfig?.navbarStyle || 'glass'}
              isCompact={false}
              showDetail={true}
              tokens={headerTokens}
              variant="header"
            />
            {/* Star rating in header */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3].map(star => (
                <span
                  key={`hdr-star-${star}`}
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '10px',
                    fontVariationSettings: totalPctVal >= star * 33 ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400",
                    color: totalPctVal >= star * 33 ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                  }}
                >
                  star
                </span>
              ))}
            </div>
            {/* Tier label */}
            {tier && (
              <span className="text-[9px] font-bold" style={{ color: tier.color }}>
                {tier.label}
              </span>
            )}
          </div>
        )}

        <div className="hidden sm:flex items-center gap-2 text-[10px] text-app-muted">
          <span>← → navigasi</span>
          <span>F fullscreen</span>
          <span>O overview</span>
          <span>Esc tutup</span>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={closePlay}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
          <span>Tutup</span>
        </Button>
      </div>
    </div>
  );
}

// ── Play Canvas — Renders the current page with animated transitions ──

function PlayCanvas() {
  const pages = useCanvaStore((s) => s.pages);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);
  // Subscribe to scores reactively so completion dots update
  const scores = useInteractiveStore((s) => s.scores);
  const isPageComplete = useInteractiveStore((s) => s.isPageComplete);
  const ratio = useCanvaStore((s) => {
    const r = RATIOS.find(r => r.id === s.ratioId);
    return r || RATIOS[0];
  });
  const nextInteractivePage = useInteractiveStore((s) => s.nextInteractivePage);
  const prevInteractivePage = useInteractiveStore((s) => s.prevInteractivePage);
  const replayAll = useInteractiveStore((s) => s.replayAll);
  const goPage = useCanvaStore((s) => s.goPage);
  const replayGeneration = useInteractiveStore((s) => s.replayGeneration);
  // Use store computed functions
  const totalScoreVal = useInteractiveStore((s) => s.totalScore());
  const totalMaxVal = useInteractiveStore((s) => s.totalMax());
  const totalPctVal = useInteractiveStore((s) => s.totalPct());

  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [direction, setDirection] = useState(0);
  const prevIdxRef = useRef(interactivePageIdx);

  const page = pages[interactivePageIdx];
  const totalPages = pages.length;
  const hasScore = totalMaxVal > 0;
  const tier = hasScore ? getScoreTier(totalPctVal) : null;

  // Sync fullscreen state with browser (handles Esc key and other native exits)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Track direction for animation
  useEffect(() => {
    if (interactivePageIdx > prevIdxRef.current) setDirection(1);
    else if (interactivePageIdx < prevIdxRef.current) setDirection(-1);
    prevIdxRef.current = interactivePageIdx;
  }, [interactivePageIdx]);

  // ResizeObserver for responsive scaling — using scene engine
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setScale(computeSceneScale(
        { w: ratio!.w, h: ratio!.h },
        { w: el.clientWidth || 800, h: el.clientHeight || 500 },
        30, // padding
      ));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ratio]);

  // Keyboard shortcuts for overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const iStore = useInteractiveStore.getState();
      const cStore = useCanvaStore.getState();
      const target = e.target as HTMLElement;

      if (target.contentEditable === 'true' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (overviewOpen) { setOverviewOpen(false); return; }
        iStore.closePlay();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        const beforeIdx = iStore.interactivePageIdx;
        iStore.nextInteractivePage();
        const afterIdx = useInteractiveStore.getState().interactivePageIdx;
        if (afterIdx !== beforeIdx) cStore.goPage(afterIdx);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const beforeIdx = iStore.interactivePageIdx;
        iStore.prevInteractivePage();
        const afterIdx = useInteractiveStore.getState().interactivePageIdx;
        if (afterIdx !== beforeIdx) cStore.goPage(afterIdx);
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          setIsFullscreen(true);
        } else {
          document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        }
        return;
      }
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        setOverviewOpen(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [overviewOpen]);

  // Navigation helpers
  const handleNext = useCallback(() => {
    const nextIdx = Math.min(interactivePageIdx + 1, totalPages - 1);
    if (nextIdx !== interactivePageIdx) {
      nextInteractivePage();
      goPage(nextIdx);
    }
  }, [interactivePageIdx, totalPages, nextInteractivePage, goPage]);

  const handlePrev = useCallback(() => {
    const prevIdx = Math.max(interactivePageIdx - 1, 0);
    if (prevIdx !== interactivePageIdx) {
      prevInteractivePage();
      goPage(prevIdx);
    }
  }, [interactivePageIdx, prevInteractivePage, goPage]);

  const handleReplay = useCallback(() => {
    replayAll();
    goPage(0);
    playClickSound();
  }, [replayAll, goPage]);

  if (!page) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-app-muted text-sm">Tidak ada halaman</div>
      </div>
    );
  }

  // Overview Mode
  if (overviewOpen) {
    return <OverviewGrid onClose={() => setOverviewOpen(false)} />;
  }

  return (
    <div ref={canvasRef} className="w-full h-full flex flex-col items-center justify-center relative">
      {/* ══ Animated page content ══════════════════════════════ */}
      <div className="flex-1 min-h-0 flex items-center justify-center w-full">
        <PageTransition
          pageKey={`play-page-${interactivePageIdx}`}
          direction={direction as PageDirection}
          duration={0.35}
          className="relative overflow-hidden shadow-md shadow-black/50 ring-1 ring-app-border/30"
          style={{
            width: ratio!.w,
            height: ratio!.h,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
            <CanvasErrorBoundary name="PlayPreview">
              <PageRenderer
                mode="preview"
                page={page}
                currentPageIndex={interactivePageIdx}
                totalPages={totalPages}
              />
            </CanvasErrorBoundary>
        </PageTransition>
      </div>

      {/* ══ Bottom Navigation Bar — Premium ═══════════════════ */}
      <div className="w-full px-4 pb-3 pt-2">
        <div className="max-w-2xl mx-auto">
          <div className="bg-app-surface border border-app-border rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">

            {/* Prev button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={interactivePageIdx <= 0}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold disabled:opacity-30 active:scale-95 transition-transform"
              title="Halaman sebelumnya (←)"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_left</span>
              <span className="hidden sm:inline">Prev</span>
            </Button>

            {/* Progress dots + score + page counter */}
            <div className="flex items-center gap-2 flex-1 justify-center">
              {/* Progress dots */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-[300px] px-1">
                {pages.map((_, i) => {
                  const isComplete = isPageComplete(i);
                  return (
                    <button
                      key={`play-dot-${i}`}
                      onClick={() => {
                        useInteractiveStore.getState().goInteractivePage(i);
                        goPage(i);
                      }}
                      className={`flex-shrink-0 transition-[width,height,background-color,box-shadow] duration-200 ${
                        i === interactivePageIdx
                          ? 'w-6 h-2 rounded-full'
                          : 'w-2 h-2 rounded-full'
                      }`}
                      style={{
                        background: i === interactivePageIdx
                          ? `linear-gradient(90deg, ${tier?.color || '#34d399'}, #06b6d4)`
                          : isComplete
                            ? 'rgba(52, 211, 153, 0.5)'
                            : 'rgba(255,255,255,0.15)',
                        boxShadow: i === interactivePageIdx
                          ? `0 0 8px ${tier?.glow || 'rgba(52, 211, 153, 0.4)'}`
                          : 'none',
                      }}
                      title={`Halaman ${i + 1}${isComplete ? ' (selesai)' : ''}`}
                    />
                  );
                })}
              </div>

              {/* Score pill — animated with +N popup */}
              {hasScore && (
                <ScoreDisplay
                  navbarStyle={page?.navConfig?.navbarStyle || 'glass'}
                  isCompact={true}
                  showDetail={false}
                  tokens={{
                    color: (token: string) => token === 'muted' ? 'var(--color-app-muted, #94a3b8)' : 'var(--color-app-primary, #ffffff)',
                    colorAlpha: (token: string, a: number) => token === 'muted' ? `rgba(148,163,184,${a})` : `rgba(255,255,255,${a})`,
                  }}
                  variant="bottom"
                />
              )}

              {/* Page counter */}
              <span className="text-[11px] font-bold text-emerald-300/80 whitespace-nowrap">
                {interactivePageIdx + 1}/{totalPages}
              </span>
            </div>

            {/* Next button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              disabled={interactivePageIdx >= totalPages - 1}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold disabled:opacity-30 active:scale-95 transition-transform"
              title="Halaman berikutnya (→)"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
            </Button>
          </div>

          {/* Secondary actions row */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <Button
              variant="ghost"
              onClick={() => setOverviewOpen(true)}
              className="px-2 py-1 rounded-lg text-[10px] font-bold gap-1 text-app-muted hover:text-emerald-300"
              title="Overview (O)"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>grid_view</span> Overview
            </Button>
            <Button
              variant="ghost"
              onClick={handleReplay}
              className="px-2 py-1 rounded-lg text-[10px] font-bold gap-1 text-app-muted hover:text-amber-300"
              title="Ulangi semua (reset skor)"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>refresh</span> Ulangi
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                  setIsFullscreen(true);
                } else {
                  document.exitFullscreen().catch(() => {});
                  setIsFullscreen(false);
                }
              }}
              className="px-2 py-1 rounded-lg text-[10px] font-bold gap-1 text-app-muted hover:text-cyan-300"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>close_fullscreen</span> : <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>open_in_full</span>}
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper: Click sound without importing full sound library ──
function playClickSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 600;
    gain.gain.value = 0.08;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.stop(ctx.currentTime + 0.08);
  } catch { /* Audio not available */ }
}

// ── Overview Grid: Thumbnail navigation ────────────────────────

function OverviewGrid({ onClose }: { onClose: () => void }) {
  const pages = useCanvaStore((s) => s.pages);
  const goPage = useCanvaStore((s) => s.goPage);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);
  const goInteractivePage = useInteractiveStore((s) => s.goInteractivePage);
  const isPageComplete = useInteractiveStore((s) => s.isPageComplete);
  // Use store computed functions
  const totalScoreVal = useInteractiveStore((s) => s.totalScore());
  const totalMaxVal = useInteractiveStore((s) => s.totalMax());
  const totalPctVal = useInteractiveStore((s) => s.totalPct());
  const ratio = useCanvaStore((s) => {
    const r = RATIOS.find(r => r.id === s.ratioId);
    return r || RATIOS[0];
  });

  const handleSelect = (idx: number) => {
    goInteractivePage(idx);
    goPage(idx);
    onClose();
  };

  const tier = totalMaxVal > 0 ? getScoreTier(totalPctVal) : null;

  return (
    <div className="w-full h-full overflow-auto p-6 anim-enter-scale">
      <div className="text-center mb-4">
        <div className="text-sm font-bold text-app-primary">Overview — {pages.length} Halaman</div>
        {totalMaxVal > 0 && (
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className="text-[10px]" style={{ color: tier?.color || '#34d399' }}>
              Skor: {totalScoreVal}/{totalMaxVal} ({totalPctVal}%) — {tier?.label}
            </span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3].map(star => (
                <span
                  key={`overview-star-${star}`}
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '10px',
                    fontVariationSettings: totalPctVal >= star * 33 ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400",
                    color: totalPctVal >= star * 33 ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                  }}
                >
                  star
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="text-[9px] text-app-muted mt-1">Klik halaman untuk navigasi • Tekan O atau Esc untuk tutup</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
        {pages.map((p, i) => {
          const isActive = i === interactivePageIdx;
          const isComplete = isPageComplete(i);
          const bgStyle = p.bgDataUrl
            ? { backgroundImage: `url('${p.bgDataUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : p.bgColor?.includes('gradient')
              ? { background: p.bgColor }
              : { background: p.bgColor || COLORS.bgDark };
          return (
            <button
              key={p.id}
              onClick={() => handleSelect(i)}
              className={`relative rounded-xl overflow-hidden transition-[transform,background-color,border-color] hover:scale-[1.03] anim-enter-slide-up ${
                isActive
                  ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'ring-1 ring-app-border/40 hover:ring-app-border/60'
              }`}
              style={{ aspectRatio: `${ratio!.w}/${ratio!.h}`, animationDelay: `${i * 0.03}s`, animationFillMode: 'both' }}
            >
              <div className="absolute inset-0" style={bgStyle}>
                <div className="absolute inset-0 bg-black/30" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
                <div className="text-[9px] font-bold text-white truncate flex items-center gap-0.5">
                  {TEMPLATE_ICON_MAP[p.templateType] || '📄'} {p.label}
                </div>
                <div className="text-[7px] text-white/50">
                  Halaman {i + 1}/{pages.length}
                </div>
              </div>
              {isComplete && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">✓</span>
                </div>
              )}
              {isActive && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-500/90 text-[7px] font-bold text-white">
                  AKTIF
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
