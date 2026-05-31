'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { PageTransition, type PageDirection } from '@/lib/transition';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useLearningMediaStore } from '@/store/learning-media-store';
import { PageRenderer } from './page-renderer';
import { RATIOS } from './types';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { computeSceneScale } from '@/core/scene/SceneLayoutEngine';
import { getPageContract } from '@/core/edu/page-runtime-contract';
// All icons migrated to Material Symbols Outlined
import { Button } from '@/components/ui/button';

// ═══════════════════════════════════════════════════════════════
// PREVIEW MODE — Stage-only view with floating navigation controls
// ═══════════════════════════════════════════════════════════════
// Shows the stage viewport without editing chrome (no panels).
// Floating nav bar at bottom with: Back to Edit, scene prev/next,
// and "Main sebagai Siswa" to enter interactive learn mode.
// Keyboard: Esc → back to edit, Arrow keys → navigate scenes,
// L → enter learn mode.
// Page transitions for smooth navigation between pages.
//
// Sprint 2: Added "Main sebagai Siswa" button to bridge from
// visual preview to interactive learn mode (LearningMediaShell).
// This ensures guru can preview media AND test as siswa.
// Sprint 2 (cont): Score pill, page completion dots, and progress
// bar in the floating nav — reads from interactive-store.
// ═══════════════════════════════════════════════════════════════

export default function PreviewMode() {
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const goPage = useCanvaStore(s => s.goPage);
  const setAppMode = useCanvaStore(s => s.setAppMode);
  const previewViewport = useCanvaStore(s => s.previewViewport);
  const ratio = useCanvaStore(s => {
    const r = RATIOS.find(r => r.id === s.ratioId);
    return r || RATIOS[0];
  });

  // ── Interactive store: scores & completion (subscribe to scores for reactivity) ──
  const iScores = useInteractiveStore(s => s.scores);
  const replayAll = useInteractiveStore(s => s.replayAll);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [direction, setDirection] = useState(0);
  const prevIdxRef = useRef(currentPageIndex);

  const page = pages[currentPageIndex];
  const totalPages = pages.length;

  // Computed score & completion from scores array (must be after totalPages)
  const earnedScore = useMemo(() => iScores.reduce((sum, s) => sum + s.score, 0), [iScores]);
  const maxScore = useMemo(() => iScores.reduce((sum, s) => sum + s.maxScore, 0), [iScores]);
  const hasScores = maxScore > 0;
  const completedPageSet = useMemo(() => {
    const set = new Set<number>();
    for (const s of iScores) {
      if (s.completed) set.add(s.pageIndex);
    }
    return set;
  }, [iScores]);
  const completedCount = completedPageSet.size;
  const progressPct = totalPages > 0 ? (completedCount / totalPages) * 100 : 0;

  // ── Initialize learning session when entering preview ──
  // So that when user clicks "Main sebagai Siswa", the session is ready
  const initSession = useLearningMediaStore(s => s.initSession);
  useEffect(() => {
    if (pages.length > 0) {
      const templateTypes = pages.map(p => p.templateType || 'custom');
      initSession(pages.length, templateTypes);
    }
  }, [pages.length, initSession]);

  // ── Determine current page contract info for display ──
  const templateType = page?.templateType || 'custom';
  const contract = getPageContract(templateType);
  const isInteractivePage = contract.scoring.enabled || contract.navigationLock.enabled;

  // Sync fullscreen state with browser (handles Esc key and other native exits)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Track direction for page transition animation
  useEffect(() => {
    if (currentPageIndex > prevIdxRef.current) setDirection(1);
    else if (currentPageIndex < prevIdxRef.current) setDirection(-1);
    prevIdxRef.current = currentPageIndex;
  }, [currentPageIndex]);

  // ResizeObserver for responsive scaling
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setScale(computeSceneScale(
        { w: ratio!.w, h: ratio!.h },
        { w: el.clientWidth || 800, h: el.clientHeight || 500 },
        30,
      ));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ratio]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Enter learn mode — bridge to LearningMediaShell
  const handleEnterLearnMode = useCallback(() => {
    setAppMode('learn');
  }, [setAppMode]);

  // Keyboard shortcuts for preview mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.contentEditable === 'true' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setAppMode('edit');
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentPageIndex < totalPages - 1) goPage(currentPageIndex + 1);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentPageIndex > 0) goPage(currentPageIndex - 1);
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      // L → enter learn mode (interactive play as student)
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleEnterLearnMode();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, totalPages, goPage, setAppMode, toggleFullscreen, handleEnterLearnMode]);

  const handlePrev = useCallback(() => {
    if (currentPageIndex > 0) goPage(currentPageIndex - 1);
  }, [currentPageIndex, goPage]);

  const handleNext = useCallback(() => {
    if (currentPageIndex < totalPages - 1) goPage(currentPageIndex + 1);
  }, [currentPageIndex, totalPages, goPage]);

  if (!page) return null;

  const isMobile = previewViewport === 'mobile';

  return (
    <div className="flex-1 flex flex-col bg-app-bg relative">
      {/* Main canvas area */}
      <div ref={canvasRef} className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        {isMobile ? (
          /* Mobile phone frame — constrains to phone-like aspect ratio */
          <div className="flex items-center justify-center w-full h-full">
            <div
              className="relative bg-black rounded-[2.5rem] p-3 shadow-md shadow-black/60 ring-1 ring-white/10"
              style={{ maxWidth: 430, aspectRatio: '9/16', height: '90%' }}
            >
              {/* Phone notch indicator */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-b-2xl z-10" />
              {/* Phone screen area */}
              <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-app-canvas">
                <div
                  className="relative overflow-hidden"
                  style={{
                    width: 393,
                    height: 852,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <CanvasErrorBoundary name="PreviewMode">
                    <PageRenderer
                      mode="preview"
                      page={page}
                      currentPageIndex={currentPageIndex}
                      totalPages={totalPages}
                    />
                  </CanvasErrorBoundary>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop — normal preview with page transition */
          <PageTransition
            pageKey={`preview-page-${currentPageIndex}`}
            direction={direction as PageDirection}
            duration={0.3}
            className="relative overflow-hidden shadow-md shadow-black/50 ring-1 ring-app-border/30"
            style={{
              width: ratio!.w,
              height: ratio!.h,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
          >
            <CanvasErrorBoundary name="PreviewMode">
              <PageRenderer
                mode="preview"
                page={page}
                currentPageIndex={currentPageIndex}
                totalPages={totalPages}
              />
            </CanvasErrorBoundary>
          </PageTransition>
        )}
      </div>

      {/* Floating navigation bar at bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-app-surface border-b border-app-border rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-md">
          {/* Back to Edit */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAppMode('edit')}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold text-app-accent hover:text-app-accent/80"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
            <span className="hidden sm:inline">Edit</span>
          </Button>

          <div className="w-px h-5 bg-app-border/40" />

          {/* Prev */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentPageIndex <= 0}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold disabled:opacity-30 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_left</span>
          </Button>

          {/* Page dots + progress bar + interactive badge */}
          <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
            {/* Row: completion dots */}
            <div className="flex items-center gap-[3px]">
              {Array.from({ length: totalPages }, (_, i) => {
                const isCurrent = i === currentPageIndex;
                const isCompleted = completedPageSet.has(i);
                return (
                  <button
                    key={i}
                    onClick={() => goPage(i)}
                    className="focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 rounded-full"
                    aria-label={`Halaman ${i + 1}${isCompleted ? ' (selesai)' : ''}${isCurrent ? ' (aktif)' : ''}`}
                  >
                    <span
                      className={`block rounded-full transition-all duration-200 ${
                        isCurrent
                          ? 'w-[6px] h-[6px] bg-emerald-500 ring-2 ring-emerald-500/30'
                          : isCompleted
                            ? 'w-[5px] h-[5px] bg-emerald-400'
                            : 'w-[5px] h-[5px] bg-app-muted/40'
                      }`}
                    />
                  </button>
                );
              })}
              {isInteractivePage && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/20 ml-1">
                  {contract.scoring.enabled ? 'Kuis/Game' : 'Interaktif'}
                </span>
              )}
            </div>
            {/* Progress bar */}
            <div className="w-full h-[2px] rounded-full bg-app-muted/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Next */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={currentPageIndex >= totalPages - 1}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold disabled:opacity-30 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
          </Button>

          {/* Score pill — shown when there are scored interactions */}
          {hasScores && (
            <>
              <div className="w-px h-5 bg-app-border/40" />
              <button
                onClick={replayAll}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
                title="Klik untuk ulangi semua skor"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>emoji_events</span>
                {earnedScore}/{maxScore}
              </button>
            </>
          )}

          <div className="w-px h-5 bg-app-border/40" />

          {/* Main sebagai Siswa — Sprint 2: Bridge to LearningMediaShell */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEnterLearnMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 ring-1 ring-emerald-500/20 transition-all"
            title="Main sebagai Siswa (L) — coba kuis, game, dan progress seperti siswa"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>play_circle</span>
            <span className="hidden sm:inline">Main</span>
          </Button>

          <div className="w-px h-5 bg-app-border/40" />

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-app-muted hover:text-app-secondary"
          >
            {isFullscreen ? <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>close_fullscreen</span> : <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>open_in_full</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
