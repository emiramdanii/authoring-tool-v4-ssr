'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { PageRenderer } from './page-renderer';
import { RATIOS } from './types';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { COLORS } from '@/lib/color-palette';
import { TEMPLATE_ICON_MAP } from '@/lib/canva-icon-maps';
import { Gamepad2, Trophy, X, Grid3X3, Maximize2, Minimize2, ChevronLeft, ChevronRight, RotateCcw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getScoreTier } from './page-renderer/PageFrame';

// ═══════════════════════════════════════════════════════════════
// PLAY OVERLAY — Full-screen interactive preview overlay
//
// Premium v4 enhancements:
// - Framer Motion page transitions (slide/fade)
// - Bottom navigation bar with progress dots + score tier
// - Score summary with star rating + tier label
// - Smooth page transition with directional awareness
// - Keyboard shortcuts (Esc, ← →, F, O, Space)
// ═══════════════════════════════════════════════════════════════

// ── Transition variants ────────────────────────────────────────
const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
    scale: 0.96,
  }),
};

const pageTransition: Record<string, unknown> = {
  type: 'tween',
  ease: [0.25, 0.46, 0.45, 0.94], // ease-out quad
  duration: 0.35,
};

export default function PlayOverlay() {
  const mode = useInteractiveStore((s) => s.mode);
  const isPlaying = mode === 'interactive';

  if (!isPlaying) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-app-surface flex flex-col select-none"
      style={{ zIndex: 70 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Top bar */}
      <PlayOverlayHeader />

      {/* Main canvas area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PlayCanvas />
      </div>
    </motion.div>
  );
}

// ── Header ────────────────────────────────────────────────────

function PlayOverlayHeader() {
  const closePlay = useInteractiveStore((s) => s.closePlay);
  const pages = useCanvaStore((s) => s.pages);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);
  // Use store computed functions — reactive + DRY (same as PageFrame)
  const totalScoreVal = useInteractiveStore((s) => s.totalScore());
  const totalMaxVal = useInteractiveStore((s) => s.totalMax());
  const totalPctVal = useInteractiveStore((s) => s.totalPct());

  const page = pages[interactivePageIdx];
  const hasScore = totalMaxVal > 0;
  const tier = hasScore ? getScoreTier(totalPctVal) : null;

  return (
    <div className="glass-panel-strong flex items-center justify-between px-4 py-2 border-b border-app-border/50">
      <div className="flex items-center gap-3">
        <Gamepad2 size={14} className="text-emerald-400" />
        <span className="text-xs font-bold text-emerald-400">Mode Interaktif</span>
        <span className="text-[10px] text-app-muted">•</span>
        <span className="text-[10px] text-app-primary font-semibold truncate max-w-[200px]">
          {page?.label || `Halaman ${interactivePageIdx + 1}`}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {hasScore && (
          <div className="flex items-center gap-2">
            {/* Premium score pill with tier color */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{
                background: `${tier?.color}18`,
                border: `1px solid ${tier?.color}33`,
                boxShadow: `0 0 12px ${tier?.glow}`,
              }}
            >
              <Trophy size={12} style={{ color: tier?.color }} />
              <span className="text-xs font-black" style={{ color: tier?.color }}>{totalScoreVal}/{totalMaxVal}</span>
              <span className="text-[10px] font-mono font-bold" style={{ color: tier?.color }}>{totalPctVal}%</span>
            </div>
            {/* Star rating in header */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3].map(star => (
                <Star
                  key={`hdr-star-${star}`}
                  size={10}
                  fill={totalPctVal >= star * 33 ? '#fbbf24' : 'none'}
                  stroke={totalPctVal >= star * 33 ? '#fbbf24' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={2}
                />
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
          <X size={14} />
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

  // Track direction for animation
  useEffect(() => {
    if (interactivePageIdx > prevIdxRef.current) setDirection(1);
    else if (interactivePageIdx < prevIdxRef.current) setDirection(-1);
    prevIdxRef.current = interactivePageIdx;
  }, [interactivePageIdx]);

  // ResizeObserver for responsive scaling
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const aW = (el.clientWidth || 800) - 60;
      const aH = (el.clientHeight || 500) - 60;
      const sW = aW / ratio.w;
      const sH = aH / ratio.h;
      setScale(Math.min(sW, sH, 1));
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
    const beforeIdx = interactivePageIdx;
    nextInteractivePage();
    const afterIdx = useInteractiveStore.getState().interactivePageIdx;
    if (afterIdx !== beforeIdx) goPage(afterIdx);
  }, [interactivePageIdx, nextInteractivePage, goPage]);

  const handlePrev = useCallback(() => {
    const beforeIdx = interactivePageIdx;
    prevInteractivePage();
    const afterIdx = useInteractiveStore.getState().interactivePageIdx;
    if (afterIdx !== beforeIdx) goPage(afterIdx);
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
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`play-page-${interactivePageIdx}`}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={pageTransition}
            className="relative overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-app-border/30"
            style={{
              width: ratio.w,
              height: ratio.h,
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
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ══ Bottom Navigation Bar — Premium ═══════════════════ */}
      <div className="w-full px-4 pb-3 pt-2">
        <div className="max-w-2xl mx-auto">
          <div className="glass-panel-strong rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">

            {/* Prev button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={interactivePageIdx <= 0}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold disabled:opacity-30 active:scale-95 transition-transform"
              title="Halaman sebelumnya (←)"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">Prev</span>
            </Button>

            {/* Progress dots + score + page counter */}
            <div className="flex items-center gap-2 flex-1 justify-center">
              {/* Progress dots */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-[300px] px-1">
                {pages.map((_, i) => {
                  const isComplete = useInteractiveStore.getState().isPageComplete(i);
                  return (
                    <button
                      key={`play-dot-${i}`}
                      onClick={() => {
                        useInteractiveStore.getState().goInteractivePage(i);
                        goPage(i);
                      }}
                      className={`flex-shrink-0 transition-all duration-200 ${
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

              {/* Score pill (when has score) */}
              {hasScore && (
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{
                    background: `${tier?.color}15`,
                    border: `1px solid ${tier?.color}30`,
                  }}
                >
                  <span className="text-[9px]" style={{ color: tier?.color }}>{totalPctVal}%</span>
                </div>
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
              <ChevronRight size={14} />
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
              <Grid3X3 size={10} /> Overview
            </Button>
            <Button
              variant="ghost"
              onClick={handleReplay}
              className="px-2 py-1 rounded-lg text-[10px] font-bold gap-1 text-app-muted hover:text-amber-300"
              title="Ulangi semua (reset skor)"
            >
              <RotateCcw size={10} /> Ulangi
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
              {isFullscreen ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
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
    <motion.div
      className="w-full h-full overflow-auto p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-center mb-4">
        <div className="text-sm font-bold text-app-primary">Overview — {pages.length} Halaman</div>
        {totalMaxVal > 0 && (
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className="text-[10px]" style={{ color: tier?.color || '#34d399' }}>
              Skor: {totalScoreVal}/{totalMaxVal} ({totalPctVal}%) — {tier?.label}
            </span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3].map(star => (
                <Star
                  key={`overview-star-${star}`}
                  size={10}
                  fill={totalPctVal >= star * 33 ? '#fbbf24' : 'none'}
                  stroke={totalPctVal >= star * 33 ? '#fbbf24' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={2}
                />
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
            <motion.button
              key={p.id}
              onClick={() => handleSelect(i)}
              className={`relative rounded-xl overflow-hidden transition-all hover:scale-105 ${
                isActive
                  ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'ring-1 ring-app-border/40 hover:ring-app-border/60'
              }`}
              style={{ aspectRatio: `${ratio.w}/${ratio.h}` }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
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
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
