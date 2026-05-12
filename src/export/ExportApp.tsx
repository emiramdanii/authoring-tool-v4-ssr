// ═══════════════════════════════════════════════════════════════════════
// EXPORT APP — The main React component for exported HTML
//
// Refactored: Uses PageRenderer for consistent rendering with
// Stage (canvas) and PlayOverlay (live preview). Only adds
// export-specific features:
// - Aspect-ratio scaling container
// - Confetti effect on completion
// - Touch/swipe navigation
// - Window-scoped interactive store exposure
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Inbox } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { RATIOS } from '@/components/canva/types';
import { CanvasErrorBoundary } from '@/components/canva/CanvasErrorBoundary';
import { PageRenderer } from '@/components/canva/page-renderer';
import { fireConfettiCelebration } from '@/lib/confetti';

// ── Main Export App Component ────────────────────────────────────

export default function ExportApp() {
  const pages = useCanvaStore((s) => s.pages);
  const ratioId = useCanvaStore((s) => s.ratioId);
  const ratio = useCanvaStore((s) => {
    const r = RATIOS.find(r => r.id === s.ratioId);
    return r || RATIOS[0];
  });
  const meta = useAuthoringStore((s) => s.meta);

  // Expose interactive store for Live Preview postMessage bridge
  useEffect(() => {
    (window as any).__INTERACTIVE_STORE__ = useInteractiveStore;
    return () => {
      delete (window as any).__INTERACTIVE_STORE__;
    };
  }, []);

  // Interactive store for navigation + scoring
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);
  const goInteractivePage = useInteractiveStore((s) => s.goInteractivePage);
  const nextInteractivePage = useInteractiveStore((s) => s.nextInteractivePage);
  const prevInteractivePage = useInteractiveStore((s) => s.prevInteractivePage);
  const scores = useInteractiveStore((s) => s.scores);
  const resetAllScores = useInteractiveStore((s) => s.resetAllScores);
  const goPage = useCanvaStore((s) => s.goPage);

  // Suppress unused variable warning — scores subscription needed for reactivity
  void scores;

  const currentIdx = interactivePageIdx;
  const totalPages = pages.length;
  const currentPage = pages[currentIdx];
  const isLastPage = currentIdx >= totalPages - 1;

  // ── Navigation handlers ───────────────────────────────────
  const handleNext = useCallback(() => {
    if (isLastPage) {
      fireConfettiCelebration();
    } else {
      nextInteractivePage();
    }
  }, [isLastPage, nextInteractivePage]);

  const handlePrev = useCallback(() => {
    prevInteractivePage();
  }, [prevInteractivePage]);

  // ── Keyboard navigation ───────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); handleNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNext, handlePrev]);

  // ── Touch/swipe support ───────────────────────────────────
  useEffect(() => {
    let startX = 0;
    let startedOnInteractive = false;
    const onTouchStart = (e: TouchEvent) => {
      // Skip swipe navigation if touch started on interactive elements
      // (games, quizzes, textareas, inputs) to prevent conflicts
      const target = e.target as HTMLElement;
      startedOnInteractive = !!target.closest('textarea, input, [data-game], [data-quiz], [data-interactive], [contenteditable="true"]');
      startX = e.changedTouches[0].screenX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (startedOnInteractive) return; // Don't navigate when touching interactive elements
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

  // ── No pages state ────────────────────────────────────────
  if (totalPages === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Inbox size={36} className="text-white/60" />
          <p className="text-white/60">Belum ada halaman untuk ditampilkan.</p>
        </div>
      </div>
    );
  }

  if (!currentPage) return null;

  return (
    <>
      <div className="min-h-screen bg-slate-900 text-white select-none" style={{ fontFamily: "'Nunito', sans-serif" }}>
        {/* ── Aspect-Ratio Scaling Container ── */}
        <ExportScaleContainer
          designW={ratio.w}
          designH={ratio.h}
        >
          {/* ══ Use PageRenderer for consistent rendering ══════ */}
          <CanvasErrorBoundary name="Export">
            <PageRenderer
              mode="export"
              page={currentPage}
              currentPageIndex={currentIdx}
              totalPages={totalPages}
            />
          </CanvasErrorBoundary>
        </ExportScaleContainer>
      </div>
    </>
  );
}

// ── Aspect-Ratio Scale Container ─────────────────────────────────
// Mirrors PlayCanvas scaling: renders at native aspect ratio, then
// CSS-transform scales to fit the available viewport space.

function ExportScaleContainer({
  designW,
  designH,
  children,
}: {
  designW: number;
  designH: number;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const aW = (el.clientWidth || 800) - 40;
      const aH = (el.clientHeight || 500) - 40;
      const sW = aW / designW;
      const sH = aH / designH;
      setScale(Math.min(sW, sH, 1));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [designW, designH]);

  return (
    <div
      ref={containerRef}
      className="page-transition"
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        className="relative overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-slate-700/30"
        style={{
          width: designW,
          height: designH,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  );
}
