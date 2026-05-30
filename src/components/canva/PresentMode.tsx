'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PageTransition, ShowTransition, type PageDirection } from '@/lib/transition';
import { useCanvaStore } from '@/store/canva-store';
import { PageRenderer } from './page-renderer';
import { RATIOS } from './types';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { computeSceneScale } from '@/core/scene/SceneLayoutEngine';
// All icons migrated to Material Symbols Outlined
import { Button } from '@/components/ui/button';
import { SceneTabBar } from './toolbar/SceneTabBar';

// ═══════════════════════════════════════════════════════════════
// PRESENT MODE — Fullscreen presentation playback
// ═══════════════════════════════════════════════════════════════
// Fullscreen 1280×720 presentation mode.
// Keyboard: Arrow keys → navigate, Esc → exit, F → toggle fullscreen.
// Floating minimal controls on hover at bottom.
// ═══════════════════════════════════════════════════════════════

export default function PresentMode() {
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const goPage = useCanvaStore(s => s.goPage);
  const setAppMode = useCanvaStore(s => s.setAppMode);
  const ratio = useCanvaStore(s => {
    const r = RATIOS.find(r => r.id === s.ratioId);
    return r || RATIOS[0];
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [direction, setDirection] = useState(0);
  const prevIdxRef = useRef(currentPageIndex);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // FASE 10: Tab cycling support
  const activeTabId = useCanvaStore(s => s.activeTabId);
  const setActiveTabId = useCanvaStore(s => s.setActiveTabId);

  const page = pages[currentPageIndex];
  const totalPages = pages.length;

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
    if (currentPageIndex > prevIdxRef.current) setDirection(1);
    else if (currentPageIndex < prevIdxRef.current) setDirection(-1);
    prevIdxRef.current = currentPageIndex;
  }, [currentPageIndex]);

  // ResizeObserver for responsive scaling
  // Uses the INNER page container (below the SceneTabBar) for height measurement.
  // The outer container includes the tab bar height, which would cause the
  // page to be scaled too small and clip at the bottom.
  useEffect(() => {
    const el = canvasRef.current;
    const innerEl = pageContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      // Prefer inner container dimensions (excludes SceneTabBar height)
      const measureEl = innerEl || el;
      setScale(computeSceneScale(
        { w: ratio!.w, h: ratio!.h },
        { w: measureEl.clientWidth || 800, h: measureEl.clientHeight || 500 },
        0,
      ));
    });
    observer.observe(el);
    if (innerEl) observer.observe(innerEl);
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

  // Auto-hide controls after 3 seconds of inactivity
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  // Start auto-hide timer on mount
  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  // Keyboard shortcuts for present mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.contentEditable === 'true' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      resetHideTimer();

      if (e.key === 'Escape') {
        e.preventDefault();
        setAppMode('edit');
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ' ') {
        // Don't intercept Space when a button is focused — let the browser
        // activate it natively (e.g. quiz "Lanjut" button)
        if (e.key === ' ') {
          const el = document.activeElement;
          if (el instanceof HTMLButtonElement || el?.getAttribute('role') === 'button') {
            return; // Let browser handle Space on buttons
          }
        }
        e.preventDefault();
        if (currentPageIndex < totalPages - 1) goPage(currentPageIndex + 1);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentPageIndex > 0) goPage(currentPageIndex - 1);
        return;
      }
      if (e.key === 'f' || e.key === 'F' || e.key === 'F5') {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      // FASE 10: T key cycles through tabs
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        const currentPage = useCanvaStore.getState().pages[currentPageIndex];
        const currentTabs = currentPage?.schema?.tabs;
        if (currentTabs && currentTabs.length >= 2) {
          if (!activeTabId) {
            setActiveTabId(currentTabs[0]!.id);
          } else {
            const currentIdx = currentTabs.findIndex(t => t.id === activeTabId);
            if (currentIdx === -1 || currentIdx >= currentTabs.length - 1) {
              // Wrap around: back to showing all
              setActiveTabId(null);
            } else {
              setActiveTabId(currentTabs[currentIdx + 1]!.id);
            }
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, totalPages, goPage, setAppMode, resetHideTimer, toggleFullscreen, activeTabId, setActiveTabId]);

  const handlePrev = useCallback(() => {
    if (currentPageIndex > 0) {
      resetHideTimer();
      goPage(currentPageIndex - 1);
    }
  }, [currentPageIndex, goPage, resetHideTimer]);

  const handleNext = useCallback(() => {
    if (currentPageIndex < totalPages - 1) {
      resetHideTimer();
      goPage(currentPageIndex + 1);
    }
  }, [currentPageIndex, totalPages, goPage, resetHideTimer]);

  if (!page) return null;

  return (
    <div
      className="fixed inset-0 bg-black flex flex-col select-none"
      onPointerMove={resetHideTimer}
      onPointerDown={resetHideTimer}
    >
      {/* Main canvas area */}
      <div ref={canvasRef} className="flex-1 min-h-0 flex flex-col items-center justify-center overflow-hidden">
        {/* FASE 10: Scene Tab Bar for present mode */}
        <SceneTabBar isCompact={false} className="w-full" />
        <div ref={pageContainerRef} className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <PageTransition
          pageKey={`present-page-${currentPageIndex}`}
          direction={direction as PageDirection}
          duration={0.35}
          className="relative overflow-hidden"
          style={{
            width: ratio!.w,
            height: ratio!.h,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <CanvasErrorBoundary name="PresentMode">
            <PageRenderer
              mode="preview"
              page={page}
              currentPageIndex={currentPageIndex}
              totalPages={totalPages}
            />
          </CanvasErrorBoundary>
        </PageTransition>
        </div>
      </div>

      {/* Floating minimal controls — visible on hover */}
      <ShowTransition
        show={showControls}
        enterClass="anim-enter-slide-up"
        exitClass="anim-exit-slide-down"
        duration={0.2}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="bg-black/70 backdrop-blur-md rounded-xl px-4 py-2.5 flex items-center gap-3 border border-white/10">
          {/* Exit */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAppMode('edit')}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10"
            title="Keluar presentasi (Esc)"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
            <span className="hidden sm:inline">Keluar</span>
          </Button>

          <div className="w-px h-5 bg-white/10" />

          {/* Prev */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentPageIndex <= 0}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-white/70 hover:text-white disabled:opacity-30"
            aria-label="Halaman sebelumnya"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_left</span>
          </Button>

          {/* Page counter + progress bar */}
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            <span className="text-[11px] font-bold text-white/90 whitespace-nowrap">
              {currentPageIndex + 1}/{totalPages}
            </span>
            <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/60 transition-[width] duration-300 ease-out"
                style={{ width: `${((currentPageIndex + 1) / totalPages) * 100}%` }}
              />
            </div>
          </div>

          {/* Next */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={currentPageIndex >= totalPages - 1}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-white/70 hover:text-white disabled:opacity-30"
            aria-label="Halaman berikutnya"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
          </Button>

          <div className="w-px h-5 bg-white/10" />

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-white/50 hover:text-white/80"
            aria-label={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
            title={isFullscreen ? 'Keluar layar penuh (F)' : 'Layar penuh (F)'}
          >
            {isFullscreen ? <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>close_fullscreen</span> : <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>open_in_full</span>}
          </Button>
        </div>
      </ShowTransition>
    </div>
  );
}
