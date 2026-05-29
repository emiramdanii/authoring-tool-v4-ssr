'use client';

// ═══════════════════════════════════════════════════════════════
// LEARNING MEDIA SHELL — Unified student-facing media player
//
// A single, cohesive shell for student-facing content consumption.
// Replaces the fragmented Preview/Present/Play overlays with one
// unified experience optimized for learners.
//
// Architecture:
//   TopNavbar (48px) → back + title | progress | score
//   Content (flex-1) → PageRenderer with slide transitions
//   BottomNav (56px) ← prev | dots | next
//   CompletionModal → overlay on "Selesai"
// ═══════════════════════════════════════════════════════════════

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Star,
  RotateCcw,
  X,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useLearningMediaStore } from '@/store/learning-media-store';
import { useSchemaMetaProjection } from '@/hooks/use-schema-projection';
import { PageRenderer } from './page-renderer/PageRenderer';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { PageTransition, type PageDirection } from '@/lib/transition';
import { RATIOS } from './types';
import { computeSceneScale } from '@/core/scene/SceneLayoutEngine';
import { getScoreTier } from './page-renderer/PageFrame';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function LearningMediaShell() {
  const appMode = useCanvaStore((s) => s.appMode);
  const isLearning = appMode === 'learn';

  if (!isLearning) return null;

  return (
    <div
      className="fixed inset-0 bg-white flex flex-col select-none"
      style={{ zIndex: 70 }}
    >
      <LearningTopNavbar />
      <LearningContent />
      <LearningBottomNav />
      <CompletionModal />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TOP NAVBAR — 48px fixed header
// ═══════════════════════════════════════════════════════════════

function LearningTopNavbar() {
  const closeLearning = useLearningMediaStore((s) => s.closeLearning);
  const currentScreenIndex = useLearningMediaStore((s) => s.currentScreenIndex);
  const totalScreens = useLearningMediaStore((s) => s.totalScreens);
  const meta = useSchemaMetaProjection();
  const pages = useCanvaStore((s) => s.pages);

  // Score data from interactive store (reactive)
  const totalScore = useInteractiveStore((s) => s.totalScore());
  const totalMax = useInteractiveStore((s) => s.totalMax());
  const hasScore = totalMax > 0;

  // Animated score display
  const [displayScore, setDisplayScore] = useState(totalScore);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevScoreRef = useRef(totalScore);

  useEffect(() => {
    if (totalScore !== prevScoreRef.current) {
      setIsPulsing(true);
      // Animate score counter
      const diff = totalScore - displayScore;
      const steps = Math.min(Math.abs(diff), 10);
      const stepSize = diff / steps;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        if (step >= steps) {
          setDisplayScore(totalScore);
          clearInterval(interval);
        } else {
          setDisplayScore((prev) => Math.round(prev + stepSize));
        }
      }, 50);

      prevScoreRef.current = totalScore;
      const timeout = setTimeout(() => setIsPulsing(false), 600);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [totalScore, displayScore]);

  // Progress
  const progressPct = totalScreens > 0
    ? Math.round(((currentScreenIndex + 1) / totalScreens) * 100)
    : 0;

  const title = meta.judulPertemuan || meta.namaBab || pages[currentScreenIndex]?.label || 'Media Pembelajaran';

  return (
    <>
      <div className="h-12 bg-white flex items-center justify-between px-3 sm:px-5 shadow-sm relative z-10">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={closeLearning}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors active:scale-95"
            aria-label="Kembali ke editor"
            title="Kembali"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <h1 className="text-sm font-semibold text-gray-800 truncate">
            {title}
          </h1>
        </div>

        {/* Center: Progress indicator */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0 mx-4">
          <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
            {currentScreenIndex + 1} / {totalScreens}
          </span>
          <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Right: Score display */}
        {hasScore && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
                isPulsing ? 'scale-110 shadow-md' : 'scale-100'
              }`}
              style={{
                backgroundColor: isPulsing ? '#fef3c7' : '#f0fdf4',
                color: isPulsing ? '#d97706' : '#16a34a',
              }}
            >
              <Trophy className="w-3 h-3" />
              <span className="font-mono">{displayScore}/{totalMax}</span>
            </div>
          </div>
        )}

        {/* Mobile progress (shown on small screens) */}
        <div className="sm:hidden flex items-center gap-1.5 flex-shrink-0 ml-2">
          <span className="text-[10px] font-medium text-gray-400">
            {currentScreenIndex + 1}/{totalScreens}
          </span>
        </div>
      </div>

      {/* Thin 2px accent progress bar below navbar */}
      <div className="h-0.5 bg-gray-100 w-full">
        <div
          className="h-full bg-emerald-500 transition-all duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONTENT AREA — Renders one page at a time with slide transitions
// ═══════════════════════════════════════════════════════════════

function LearningContent() {
  const pages = useCanvaStore((s) => s.pages);
  const currentScreenIndex = useLearningMediaStore((s) => s.currentScreenIndex);
  const syncScores = useLearningMediaStore((s) => s.syncScores);
  const markScreenComplete = useLearningMediaStore((s) => s.markScreenComplete);

  const ratio = useCanvaStore((s) => {
    const r = RATIOS.find((r) => r.id === s.ratioId);
    return r || RATIOS[0];
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [direction, setDirection] = useState<PageDirection>(0);
  const prevIdxRef = useRef(currentScreenIndex);

  const page = pages[currentScreenIndex];
  const totalPages = pages.length;

  // Sync scores from interactive store
  useEffect(() => {
    const unsub = useInteractiveStore.subscribe((state) => {
      // Check if scores changed
      syncScores();

      // Auto-mark current screen complete when interactive store marks page complete
      const currentIdx = useLearningMediaStore.getState().currentScreenIndex;
      if (state.isPageComplete(currentIdx)) {
        const pageScore = state.pageScore(currentIdx);
        markScreenComplete(currentIdx, pageScore.score, pageScore.max);
      }
    });
    return unsub;
  }, [syncScores, markScreenComplete]);

  // Track direction for animation
  useEffect(() => {
    if (currentScreenIndex > prevIdxRef.current) setDirection(1);
    else if (currentScreenIndex < prevIdxRef.current) setDirection(-1);
    prevIdxRef.current = currentScreenIndex;
  }, [currentScreenIndex]);

  // ResizeObserver for responsive scaling
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setScale(
        computeSceneScale(
          { w: ratio!.w, h: ratio!.h },
          { w: el.clientWidth || 800, h: el.clientHeight || 500 },
          30
        )
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ratio]);

  // Touch swipe navigation
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        isSwiping = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const store = useLearningMediaStore.getState();
      if (dx < -50) {
        // Swipe left → next
        store.nextScreen();
      } else if (dx > 50) {
        // Swipe right → prev
        store.prevScreen();
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.contentEditable === 'true' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        useLearningMediaStore.getState().closeLearning();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        useLearningMediaStore.getState().nextScreen();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        useLearningMediaStore.getState().prevScreen();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Edge case: No pages
  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-40">📭</div>
          <p className="text-gray-400 text-sm">Tidak ada halaman untuk ditampilkan</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      className="flex-1 min-h-0 flex items-center justify-center bg-gray-50 relative overflow-hidden"
    >
      <PageTransition
        pageKey={`learn-page-${currentScreenIndex}`}
        direction={direction}
        duration={0.3}
        className="relative overflow-hidden shadow-lg ring-1 ring-gray-200/60 rounded-lg"
        style={{
          width: ratio!.w,
          height: ratio!.h,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <CanvasErrorBoundary name="LearningMediaContent">
          <PageRenderer
            mode="preview"
            page={page}
            currentPageIndex={currentScreenIndex}
            totalPages={totalPages}
          />
        </CanvasErrorBoundary>
      </PageTransition>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BOTTOM NAV — 56px fixed footer
// ═══════════════════════════════════════════════════════════════

function LearningBottomNav() {
  const currentScreenIndex = useLearningMediaStore((s) => s.currentScreenIndex);
  const totalScreens = useLearningMediaStore((s) => s.totalScreens);
  const isLocked = useLearningMediaStore((s) => s.isLocked);
  const nextScreen = useLearningMediaStore((s) => s.nextScreen);
  const prevScreen = useLearningMediaStore((s) => s.prevScreen);
  const goToScreen = useLearningMediaStore((s) => s.goToScreen);
  const completedScreens = useLearningMediaStore((s) => s.completedScreens);
  const isPageComplete = useInteractiveStore((s) => s.isPageComplete);
  const pages = useCanvaStore((s) => s.pages);
  const setShowCompletionModal = useLearningMediaStore((s) => s.setShowCompletionModal);
  const canAdvance = useLearningMediaStore((s) => s.canAdvance);

  const isFirstPage = currentScreenIndex <= 0;
  const isLastPage = currentScreenIndex >= totalScreens - 1;

  const handleNext = useCallback(() => {
    if (isLastPage) {
      setShowCompletionModal(true);
    } else {
      nextScreen();
    }
  }, [isLastPage, nextScreen, setShowCompletionModal]);

  const handlePrev = useCallback(() => {
    prevScreen();
  }, [prevScreen]);

  const handleDotClick = useCallback(
    (idx: number) => {
      goToScreen(idx);
    },
    [goToScreen]
  );

  return (
    <div className="bg-white border-t border-gray-200 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="h-14 flex items-center justify-between px-3 sm:px-5 gap-2">
        {/* Left: Previous button */}
        <button
          onClick={handlePrev}
          disabled={isFirstPage}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95 ${
            isFirstPage
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
          }`}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        {/* Center: Page dots */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[60vw] px-2 scrollbar-none">
          {pages.map((p, i) => {
            const isActive = i === currentScreenIndex;
            const isComplete = completedScreens.has(i) || isPageComplete(i);

            return (
              <button
                key={`dot-${p.id}-${i}`}
                onClick={() => handleDotClick(i)}
                className={`flex-shrink-0 transition-all duration-200 rounded-full cursor-pointer ${
                  isActive
                    ? 'w-6 h-2.5 bg-emerald-500 shadow-sm'
                    : isComplete
                      ? 'w-2.5 h-2.5 bg-emerald-300'
                      : 'w-2.5 h-2.5 bg-gray-200 hover:bg-gray-300'
                }`}
                title={`Halaman ${i + 1}: ${p.label}${isComplete ? ' (selesai)' : ''}`}
                aria-label={`Halaman ${i + 1}${isComplete ? ' selesai' : ''}${isActive ? ' (aktif)' : ''}`}
              />
            );
          })}
        </div>

        {/* Right: Next / Selesai button */}
        {isLastPage ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
            aria-label="Selesai"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Selesai</span>
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={isLocked || !canAdvance()}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95 ${
              isLocked
                ? 'text-amber-500 cursor-not-allowed bg-amber-50'
                : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
            }`}
            aria-label={isLocked ? 'Selesaikan aktivitas terlebih dahulu' : 'Halaman berikutnya'}
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Selesaikan dulu</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPLETION MODAL — Shown when user clicks "Selesai"
// ═══════════════════════════════════════════════════════════════

function CompletionModal() {
  const showCompletionModal = useLearningMediaStore((s) => s.showCompletionModal);
  const setShowCompletionModal = useLearningMediaStore((s) => s.setShowCompletionModal);
  const resetAll = useLearningMediaStore((s) => s.resetAll);
  const closeLearning = useLearningMediaStore((s) => s.closeLearning);
  const totalScore = useLearningMediaStore((s) => s.totalScore());
  const totalMaxScore = useLearningMediaStore((s) => s.totalMaxScore());
  const totalPct = useLearningMediaStore((s) => s.totalPct());
  const elapsedTime = useLearningMediaStore((s) => s.elapsedTime());
  const starRating = useLearningMediaStore((s) => s.starRating());
  const completedCount = useLearningMediaStore((s) => s.completedCount());
  const totalScreens = useLearningMediaStore((s) => s.totalScreens);

  const hasScore = totalMaxScore > 0;
  const tier = hasScore ? getScoreTier(totalPct) : null;

  // Format elapsed time as mm:ss
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!showCompletionModal) return null;

  const handleReplay = () => {
    resetAll();
  };

  const handleClose = () => {
    setShowCompletionModal(false);
    closeLearning();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 80 }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 anim-enter-scale">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">
            {totalPct >= 90 ? '🏆' : totalPct >= 60 ? '🎉' : totalPct > 0 ? '👍' : '📚'}
          </div>
          <h2 className="text-lg font-bold text-gray-800">Pembelajaran Selesai!</h2>
          {tier && (
            <p className="text-sm font-semibold mt-1" style={{ color: tier.color }}>
              {tier.label}
            </p>
          )}
        </div>

        {/* Star Rating */}
        {hasScore && (
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1, 2, 3].map((star) => (
              <Star
                key={`modal-star-${star}`}
                className={`w-7 h-7 transition-all duration-300 ${
                  star <= starRating
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-100 text-gray-200'
                }`}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {hasScore && (
            <>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-emerald-600 font-mono">
                  {totalScore}/{totalMaxScore}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Skor</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-emerald-600 font-mono">
                  {totalPct}%
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Persentase</div>
              </div>
            </>
          )}
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-gray-700 font-mono">
              {completedCount}/{totalScreens}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Halaman Selesai</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-gray-700 font-mono">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Waktu</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${totalScreens > 0 ? (completedCount / totalScreens) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #10b981, #06b6d4)',
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleReplay}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Ulangi
          </Button>
          <Button
            onClick={handleClose}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
