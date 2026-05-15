'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { PageRenderer } from './page-renderer';
import { RATIOS } from './types';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { computeSceneScale } from '@/core/scene/SceneLayoutEngine';
import { ChevronLeft, ChevronRight, Edit3, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ═══════════════════════════════════════════════════════════════
// PREVIEW MODE — Stage-only view with floating navigation controls
// ═══════════════════════════════════════════════════════════════
// Shows the stage viewport without editing chrome (no panels).
// Floating nav bar at bottom with: Back to Edit, scene prev/next.
// Keyboard: Esc → back to edit, Arrow keys → navigate scenes.
// ═══════════════════════════════════════════════════════════════

export default function PreviewMode() {
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const goPage = useCanvaStore(s => s.goPage);
  const setAppMode = useCanvaStore(s => s.setAppMode);
  const ratio = useCanvaStore(s => {
    const r = RATIOS.find(r => r.id === s.ratioId);
    return r || RATIOS[0];
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const page = pages[currentPageIndex];
  const totalPages = pages.length;

  // ResizeObserver for responsive scaling
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setScale(computeSceneScale(
        { w: ratio.w, h: ratio.h },
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, totalPages, goPage, setAppMode, toggleFullscreen]);

  const handlePrev = useCallback(() => {
    if (currentPageIndex > 0) goPage(currentPageIndex - 1);
  }, [currentPageIndex, goPage]);

  const handleNext = useCallback(() => {
    if (currentPageIndex < totalPages - 1) goPage(currentPageIndex + 1);
  }, [currentPageIndex, totalPages, goPage]);

  if (!page) return null;

  return (
    <div className="flex-1 flex flex-col bg-app-bg relative">
      {/* Main canvas area */}
      <div ref={canvasRef} className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <div
          className="relative overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-app-border/30"
          style={{
            width: ratio.w,
            height: ratio.h,
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
        </div>
      </div>

      {/* Floating navigation bar at bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="glass-panel-strong rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-xl">
          {/* Back to Edit */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAppMode('edit')}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold text-app-accent hover:text-app-accent/80"
          >
            <Edit3 size={14} />
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
            <ChevronLeft size={14} />
          </Button>

          {/* Page counter */}
          <span className="text-[11px] font-bold text-app-primary whitespace-nowrap min-w-[60px] text-center">
            {currentPageIndex + 1}/{totalPages}
          </span>

          {/* Next */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={currentPageIndex >= totalPages - 1}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold disabled:opacity-30 active:scale-95 transition-transform"
          >
            <ChevronRight size={14} />
          </Button>

          <div className="w-px h-5 bg-app-border/40" />

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-app-muted hover:text-app-secondary"
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
