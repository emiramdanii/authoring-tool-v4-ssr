'use client';

// ═══════════════════════════════════════════════════════════════
// LEARNING MEDIA SHELL — Student-facing interactive learning mode
// ═══════════════════════════════════════════════════════════════
// Layout:
//   [TopNavbar 48px]  ← Back + Title | Progress bar | Score 🏆
//   [Content flex-1]  PageRenderer mode="preview"
//   [BottomNav 56px]  ← Prev | Dots | Next →
//   [CompletionModal] overlay on "Selesai"
//
// Architecture:
//   - Leverages existing PageRenderer + SchemaScreenRenderer
//   - No custom adapter layer — uses the same rendering pipeline
//   - 1 screen = 1 page (enforced by navigation)
//   - Score synced from interactive kuis/game widgets
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useLearningMediaStore } from '@/store/learning-media-store';
import { PageRenderer } from './page-renderer';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { RATIOS, type CanvaPage } from './types';
import { computeSceneScale } from '@/core/scene/SceneLayoutEngine';
import { PageTransition, type PageDirection } from '@/lib/transition';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Trophy,
  X,
  RotateCcw,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Phase metadata for screen types ─────────────────────────────
const PHASE_META: Record<string, { label: string; emoji: string; color: string }> = {
  cover:      { label: 'Cover',         emoji: '🏠', color: '#6366f1' },
  petunjuk:   { label: 'Petunjuk',      emoji: '📌', color: '#8b5cf6' },
  tujuan:     { label: 'Tujuan',        emoji: '🎯', color: '#3b82f6' },
  motivasi:   { label: 'Motivasi',      emoji: '💡', color: '#f59e0b' },
  skenario:   { label: 'Skenario',      emoji: '🎭', color: '#10b981' },
  materi:     { label: 'Materi',        emoji: '📖', color: '#06b6d4' },
  diskusi:    { label: 'Diskusi',       emoji: '💬', color: '#ec4899' },
  kuis:       { label: 'Kuis',          emoji: '📝', color: '#f43f5e' },
  game:       { label: 'Game',          emoji: '🎮', color: '#22d3ee' },
  refleksi:   { label: 'Refleksi',      emoji: '🪞', color: '#a78bfa' },
  rangkuman:  { label: 'Rangkuman',     emoji: '📋', color: '#14b8a6' },
  penutup:    { label: 'Penutup',       emoji: '🏁', color: '#64748b' },
  custom:     { label: 'Halaman',       emoji: '📄', color: '#94a3b8' },
};

function getPhaseMeta(templateType: string) {
  return PHASE_META[templateType] ?? PHASE_META.custom;
}

// ═══════════════════════════════════════════════════════════════
// TOP NAVBAR — 48px fixed height
// ═══════════════════════════════════════════════════════════════

function TopNavbar({
  title,
  progress,
  totalScore,
  maxScore,
  onBack,
}: {
  title: string;
  progress: number;
  totalScore: number;
  maxScore: number;
  onBack: () => void;
}) {
  return (
    <div className="h-12 flex items-center gap-3 px-4 bg-white border-b border-slate-200 shrink-0 z-10">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
        aria-label="Kembali ke editor"
      >
        <ArrowLeft size={18} />
        <span className="text-xs font-medium hidden sm:inline">Kembali</span>
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-slate-800 truncate">{title}</h1>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] font-medium text-slate-500 min-w-[32px] text-right">
          {progress}%
        </span>
      </div>

      {/* Score */}
      {maxScore > 0 && (
        <div className="flex items-center gap-1 text-amber-600">
          <Trophy size={14} />
          <span className="text-xs font-bold">{totalScore}/{maxScore}</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BOTTOM NAVIGATION — 56px fixed height
// ═══════════════════════════════════════════════════════════════

function BottomNav({
  currentScreen,
  totalScreens,
  visitedScreens,
  onPrev,
  onNext,
  onGoToScreen,
}: {
  currentScreen: number;
  totalScreens: number;
  visitedScreens: Set<number>;
  onPrev: () => void;
  onNext: () => void;
  onGoToScreen: (index: number) => void;
}) {
  return (
    <div className="h-14 flex items-center justify-between px-4 bg-white border-t border-slate-200 shrink-0 z-10">
      {/* Prev */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrev}
        disabled={currentScreen <= 0}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30 active:scale-95 transition-transform"
      >
        <ChevronLeft size={18} />
        <span className="hidden sm:inline">Sebelumnya</span>
      </Button>

      {/* Screen dots */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-[60%] px-2">
        {Array.from({ length: totalScreens }, (_, i) => {
          const isCurrent = i === currentScreen;
          const isVisited = visitedScreens.has(i);
          return (
            <button
              key={i}
              onClick={() => onGoToScreen(i)}
              className={`
                shrink-0 rounded-full transition-all duration-300
                ${isCurrent
                  ? 'w-6 h-2.5 bg-blue-500'
                  : isVisited
                    ? 'w-2.5 h-2.5 bg-emerald-400 hover:bg-emerald-500'
                    : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
                }
              `}
              aria-label={`Halaman ${i + 1}`}
              title={`Halaman ${i + 1}`}
            />
          );
        })}
      </div>

      {/* Next / Selesai */}
      {currentScreen >= totalScreens - 1 ? (
        <Button
          size="sm"
          onClick={onNext}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <CheckCircle2 size={16} />
          <span>Selesai</span>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={currentScreen >= totalScreens - 1}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30 active:scale-95 transition-transform"
        >
          <span className="hidden sm:inline">Selanjutnya</span>
          <ChevronRight size={18} />
        </Button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPLETION MODAL
// ═══════════════════════════════════════════════════════════════

function CompletionModal({
  totalScore,
  maxScore,
  progress,
  onRestart,
  onClose,
}: {
  totalScore: number;
  maxScore: number;
  progress: number;
  onRestart: () => void;
  onClose: () => void;
}) {
  const scorePercent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const starCount = scorePercent >= 80 ? 3 : scorePercent >= 50 ? 2 : scorePercent > 0 ? 1 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X size={18} />
        </button>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3].map(n => (
            <Star
              key={n}
              size={32}
              className={n <= starCount ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
            />
          ))}
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Pembelajaran Selesai!
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Kamu telah menyelesaikan semua halaman pembelajaran.
        </p>

        {/* Score display */}
        {maxScore > 0 && (
          <div className="bg-amber-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy size={20} className="text-amber-500" />
              <span className="text-lg font-bold text-amber-700">
                {totalScore} / {maxScore}
              </span>
            </div>
            <p className="text-xs text-amber-600">Skor Kuis</p>
          </div>
        )}

        {/* Progress */}
        <div className="bg-emerald-50 rounded-xl p-3 mb-4">
          <div className="text-sm font-medium text-emerald-700">
            Progres: {progress}%
          </div>
          <div className="w-full h-2 bg-emerald-200 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Ulangi
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            Kembali
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE BADGE — small indicator of current screen type
// ═══════════════════════════════════════════════════════════════

function PhaseBadge({ templateType }: { templateType: string }) {
  const meta = getPhaseMeta(templateType);
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
      style={{ backgroundColor: meta.color }}
    >
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LEARNING MEDIA SHELL — Main component
// ═══════════════════════════════════════════════════════════════

export default function LearningMediaShell() {
  const pages = useCanvaStore(s => s.pages);
  const goPage = useCanvaStore(s => s.goPage);
  const setAppMode = useCanvaStore(s => s.setAppMode);
  const ratio = useCanvaStore(s => {
    const r = RATIOS.find(r => r.id === s.ratioId);
    return r || RATIOS[0];
  });

  // Learning media store
  const currentScreenIndex = useLearningMediaStore(s => s.currentScreenIndex);
  const totalScreens = useLearningMediaStore(s => s.totalScreens);
  const visitedScreens = useLearningMediaStore(s => s.visitedScreens);
  const isComplete = useLearningMediaStore(s => s.isComplete);
  const showCompletionModal = useLearningMediaStore(s => s.showCompletionModal);
  const initSession = useLearningMediaStore(s => s.initSession);
  const goToScreen = useLearningMediaStore(s => s.goToScreen);
  const nextScreen = useLearningMediaStore(s => s.nextScreen);
  const prevScreen = useLearningMediaStore(s => s.prevScreen);
  const getTotalScore = useLearningMediaStore(s => s.getTotalScore);
  const getProgress = useLearningMediaStore(s => s.getProgress);
  const showCompletion = useLearningMediaStore(s => s.showCompletion);
  const dismissCompletion = useLearningMediaStore(s => s.dismissCompletion);
  const resetSession = useLearningMediaStore(s => s.resetSession);

  // Editing state for direct editing
  const editingBlockId = useCanvaStore(s => s.editingBlockId);
  const startEditing = useCanvaStore(s => s.startEditing);
  const stopEditing = useCanvaStore(s => s.stopEditing);
  const selectBlock = useCanvaStore(s => s.selectBlock);

  // Clear editing when navigating away from a screen
  useEffect(() => {
    stopEditing();
  }, [currentScreenIndex, stopEditing]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [direction, setDirection] = useState<PageDirection>(0);
  const prevIdxRef = useRef(currentScreenIndex);

  // Initialize session on mount
  useEffect(() => {
    initSession(pages.length);
  }, [pages.length, initSession]);

  // Sync canva-store's currentPageIndex with learning store
  useEffect(() => {
    goPage(currentScreenIndex);
  }, [currentScreenIndex, goPage]);

  // Track direction for page transition
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
      setScale(computeSceneScale(
        { w: ratio!.w, h: ratio!.h },
        { w: el.clientWidth || 800, h: el.clientHeight || 500 },
        20,
      ));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ratio]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.contentEditable === 'true' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        // If editing a block, exit editing first before leaving learn mode
        if (editingBlockId) {
          stopEditing();
          return;
        }
        setAppMode('edit');
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextScreen();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevScreen();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextScreen, prevScreen, setAppMode, editingBlockId, stopEditing]);

  // Handle "Selesai" button
  const handleSelesai = useCallback(() => {
    if (isComplete) {
      showCompletion();
    } else {
      // Mark all as complete and show modal
      showCompletion();
    }
  }, [isComplete, showCompletion]);

  // Handle back to edit
  const handleBack = useCallback(() => {
    setAppMode('edit');
  }, [setAppMode]);

  // Handle restart
  const handleRestart = useCallback(() => {
    resetSession();
    initSession(pages.length);
  }, [resetSession, initSession, pages.length]);

  // Compute scores
  const { earned: totalScore, possible: maxScore } = getTotalScore();
  const progress = getProgress();

  // Current page
  const page = pages[currentScreenIndex];
  const templateType = page?.templateType || 'custom';
  const phaseMeta = getPhaseMeta(templateType);

  // Page title for top navbar
  const pageTitle = page?.label || phaseMeta.label || `Halaman ${currentScreenIndex + 1}`;

  if (!page) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden">
      {/* Top Navbar */}
      <TopNavbar
        title={pageTitle}
        progress={progress}
        totalScore={totalScore}
        maxScore={maxScore}
        onBack={handleBack}
      />

      {/* Phase badge row */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-white/80 border-b border-slate-100 shrink-0">
        <PhaseBadge templateType={templateType} />
        <span className="text-[11px] text-slate-400">
          Halaman {currentScreenIndex + 1} dari {totalScreens}
        </span>
      </div>

      {/* Main content area — scaled page preview */}
      <div
        ref={canvasRef}
        className="flex-1 min-h-0 flex items-center justify-center overflow-hidden"
      >
        <PageTransition
          pageKey={`learn-page-${currentScreenIndex}`}
          direction={direction}
          duration={0.3}
          className="relative overflow-hidden shadow-lg shadow-black/20 ring-1 ring-slate-200/50 rounded-sm"
          style={{
            width: ratio!.w,
            height: ratio!.h,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <CanvasErrorBoundary name="LearningMediaShell">
            <PageRenderer
              mode="learn"
              page={page}
              currentPageIndex={currentScreenIndex}
              totalPages={totalScreens}
            />
          </CanvasErrorBoundary>
        </PageTransition>
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        currentScreen={currentScreenIndex}
        totalScreens={totalScreens}
        visitedScreens={visitedScreens}
        onPrev={prevScreen}
        onNext={currentScreenIndex >= totalScreens - 1 ? handleSelesai : nextScreen}
        onGoToScreen={goToScreen}
      />

      {/* Completion Modal */}
      {showCompletionModal && (
        <CompletionModal
          totalScore={totalScore}
          maxScore={maxScore}
          progress={progress}
          onRestart={handleRestart}
          onClose={dismissCompletion}
        />
      )}
    </div>
  );
}
