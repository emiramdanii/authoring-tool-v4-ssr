'use client';

// ═══════════════════════════════════════════════════════════════
// LEARNING MEDIA SHELL — Student-facing interactive learning mode
// ═══════════════════════════════════════════════════════════════
// Layout:
//   [TopNavbar 48px]  ← Back + Title | Progress bar | Score 🏆
//   [Content flex-1]  PageRenderer mode="preview"
//   [BottomNav 56px]  ← Prev | Dots | Next → (with navigation lock)
//   [LockToast]       Shows when navigation is locked
//   [CompletionModal] overlay on "Selesai"
//
// Architecture:
//   PageRuntimeContract → LearningMediaStore → BottomNav (lock)
//   Score bridge: interactive-store → learning-media-store → navbar
//   Edit vs Play: mode-aware click handling
//
// Sprint 3 (Runtime):
//   - Added "Mulai" button on cover page (prominent CTA)
//   - BottomNav now context-aware: Mulai/Selanjudnya/Terkunci/Selesai
//   - Verified score bridge: kuis/game/refleksi → completion → unlock
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useLearningMediaStore } from '@/store/learning-media-store';
import { useInteractiveStore, type ScoreEntry as InteractiveScoreEntry } from '@/store/interactive-store';
import { PageRenderer } from './page-renderer';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { RATIOS, type CanvaPage } from './types';
import { computeSceneScale } from '@/core/scene/SceneLayoutEngine';
import { PageTransition, type PageDirection } from '@/lib/transition';
import { getPageContract, type PageCompletionStatus } from '@/core/edu/page-runtime-contract';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Trophy,
  X,
  RotateCcw,
  CheckCircle2,
  Star,
  Lock,
  AlertCircle,
  Pencil,
  Play,
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
  isDark,
}: {
  title: string;
  progress: number;
  totalScore: number;
  maxScore: number;
  onBack: () => void;
  isDark: boolean;
}) {
  return (
    <div className={`h-12 flex items-center gap-3 px-4 shrink-0 z-10 ${
      isDark
        ? 'bg-[#0e1c2f]/95 backdrop-blur-md border-b border-white/10'
        : 'bg-white border-b border-slate-200'
    }`}>
      {/* Back button */}
      <button
        onClick={onBack}
        className={`flex items-center gap-1 transition-colors ${
          isDark
            ? 'text-slate-300 hover:text-white'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        aria-label="Kembali ke editor"
      >
        <ArrowLeft size={18} />
        <span className="text-xs font-medium hidden sm:inline">Kembali</span>
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className={`text-sm font-semibold truncate ${
          isDark ? 'text-white' : 'text-slate-800'
        }`}>{title}</h1>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className={`w-24 h-2 rounded-full overflow-hidden ${
          isDark ? 'bg-white/10' : 'bg-slate-200'
        }`}>
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={`text-[10px] font-medium min-w-[32px] text-right ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {progress}%
        </span>
      </div>

      {/* Score */}
      {maxScore > 0 && (
        <div className={`flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
          <Trophy size={14} />
          <span className="text-xs font-bold">{totalScore}/{maxScore}</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BOTTOM NAVIGATION — 56px fixed height, contract-aware
// ═══════════════════════════════════════════════════════════════

function BottomNav({
  currentScreen,
  totalScreens,
  pageStatuses,
  templateType,
  onNext,
  onPrev,
  onGoToScreen,
  isNextLocked,
  lockReason,
  isDark,
}: {
  currentScreen: number;
  totalScreens: number;
  pageStatuses: PageCompletionStatus[];
  templateType: string;
  onNext: () => void;
  onPrev: () => void;
  onGoToScreen: (index: number) => void;
  isNextLocked: boolean;
  lockReason: string;
  isDark: boolean;
}) {
  // Sprint 3: Cover page gets a prominent "Mulai" button
  const isCoverPage = currentScreen === 0 && templateType === 'cover';

  // Completion indicator for each dot
  const getDotClass = (index: number) => {
    const isCurrent = index === currentScreen;
    const status = pageStatuses[index];

    if (isCurrent) {
      return 'w-6 h-2.5 bg-blue-500';
    }

    switch (status) {
      case 'completed':
        return 'w-2.5 h-2.5 bg-emerald-400 hover:bg-emerald-500';
      case 'locked':
        return 'w-2.5 h-2.5 bg-amber-400 hover:bg-amber-500 ring-1 ring-amber-300';
      case 'incomplete':
      default:
        return 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400';
    }
  };

  return (
    <div className={`h-14 flex items-center justify-between px-4 shrink-0 z-10 ${
      isDark
        ? 'bg-[#0e1c2f]/95 backdrop-blur-md border-t border-white/10'
        : 'bg-white border-t border-slate-200'
    }`}>
      {/* Prev — always allowed (hidden on cover page) */}
      {!isCoverPage ? (
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
      ) : (
        <div className="w-24" /> /* Spacer on cover page — no prev button */
      )}

      {/* Screen dots — with completion indicators */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-[60%] px-2">
        {Array.from({ length: totalScreens }, (_, i) => {
          const status = pageStatuses[i];
          const statusIcon = status === 'completed' ? ' ✓' : status === 'locked' ? ' 🔒' : '';
          return (
            <button
              key={i}
              onClick={() => onGoToScreen(i)}
              className={`
                shrink-0 rounded-full transition-all duration-300
                ${getDotClass(i)}
              `}
              aria-label={`Halaman ${i + 1}${statusIcon}`}
              title={`Halaman ${i + 1}${statusIcon}`}
            />
          );
        })}
      </div>

      {/* Sprint 3: Mulai / Next / Selesai / Terkunci — context-aware */}
      {isCoverPage ? (
        /* ── MULAI button — prominent CTA on cover page ── */
        <Button
          size="sm"
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/25 active:scale-95 transition-all"
        >
          <Play size={16} />
          <span>Mulai</span>
        </Button>
      ) : currentScreen >= totalScreens - 1 ? (
        /* ── SELESAI button — on last page ── */
        <Button
          size="sm"
          onClick={onNext}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <CheckCircle2 size={16} />
          <span>Selesai</span>
        </Button>
      ) : isNextLocked ? (
        /* ── TERKUNCI button — navigation locked by contract ── */
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
          title={lockReason}
        >
          <Lock size={14} className="text-amber-500" />
          <span className="hidden sm:inline text-amber-600">Terkunci</span>
        </Button>
      ) : (
        /* ── SELANJUTNYA button — normal next navigation ── */
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium active:scale-95 transition-transform"
        >
          <span className="hidden sm:inline">Selanjutnya</span>
          <ChevronRight size={18} />
        </Button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION LOCK TOAST — Shown when trying to advance while locked
// ═══════════════════════════════════════════════════════════════

function LockToast({
  reason,
  onDismiss,
}: {
  reason: string;
  onDismiss: () => void;
}) {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl shadow-lg max-w-sm">
        <Lock size={16} className="text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800 flex-1">{reason}</p>
        <button
          onClick={onDismiss}
          className="text-amber-400 hover:text-amber-600 transition-colors shrink-0"
          aria-label="Tutup"
        >
          <X size={14} />
        </button>
      </div>
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
  const showLockToast = useLearningMediaStore(s => s.showLockToast);
  const navigationLockReason = useLearningMediaStore(s => s.navigationLockReason);
  const learnSubMode = useLearningMediaStore(s => s.learnSubMode);
  const initSession = useLearningMediaStore(s => s.initSession);
  const goToScreen = useLearningMediaStore(s => s.goToScreen);
  const nextScreen = useLearningMediaStore(s => s.nextScreen);
  const prevScreen = useLearningMediaStore(s => s.prevScreen);
  const forceGoToScreen = useLearningMediaStore(s => s.forceGoToScreen);
  const getTotalScore = useLearningMediaStore(s => s.getTotalScore);
  const getProgress = useLearningMediaStore(s => s.getProgress);
  const showCompletion = useLearningMediaStore(s => s.showCompletion);
  const dismissCompletion = useLearningMediaStore(s => s.dismissCompletion);
  const dismissLockToast = useLearningMediaStore(s => s.dismissLockToast);
  const resetSession = useLearningMediaStore(s => s.resetSession);
  const canGoNext = useLearningMediaStore(s => s.canGoNext);
  const getAllPageStatuses = useLearningMediaStore(s => s.getAllPageStatuses);
  const toggleLearnSubMode = useLearningMediaStore(s => s.toggleLearnSubMode);

  // Editing state for direct editing
  const editingBlockId = useCanvaStore(s => s.editingBlockId);
  const stopEditing = useCanvaStore(s => s.stopEditing);

  // Clear editing when navigating away from a screen
  useEffect(() => {
    stopEditing();
  }, [currentScreenIndex, stopEditing]);

  // In Play sub-mode, stop any active editing immediately
  useEffect(() => {
    if (learnSubMode === 'play' && editingBlockId) {
      stopEditing();
    }
  }, [learnSubMode, editingBlockId, stopEditing]);

  // Click outside content area → stop editing (save happens via blur on InlineTextEditor)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!editingBlockId) return;
      const target = e.target as HTMLElement;
      // If click is outside the page canvas and outside the editing overlay
      const pageEl = canvasRef.current?.querySelector('[data-page-frame]');
      const inlineEditor = target.closest('[data-inline-editor="true"]');
      const learnBlock = target.closest('[data-block-id]');
      if (!inlineEditor && !learnBlock && pageEl && !pageEl.contains(target)) {
        stopEditing();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingBlockId, stopEditing]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [direction, setDirection] = useState<PageDirection>(0);
  const prevIdxRef = useRef(currentScreenIndex);

  // Initialize session on mount — pass template types for contract mapping
  // Sprint 3: Also reset interactive-store scores so each Learn session
  // starts fresh. Without this, stale persisted scores from localStorage
  // would make pages appear as "completed" before the user even starts.
  useEffect(() => {
    // Clear stale scores from previous sessions — each Learn session
    // should be a fresh start. replayAll() also bumps replayGeneration
    // so that all interactive renderers (kuis, game, refleksi) reset
    // their internal state (answers, current question, etc.).
    useInteractiveStore.getState().replayAll();

    const templateTypes = pages.map(p => p.templateType || 'custom');
    initSession(pages.length, templateTypes);
  }, [pages.length, initSession]); // Only re-init when page count changes

  // Re-sync contracts when template types change
  useEffect(() => {
    const templateTypes = pages.map(p => p.templateType || 'custom');
    const currentTypes = useLearningMediaStore.getState().templateTypes;
    // Check if template types changed
    if (templateTypes.length !== currentTypes.length ||
        templateTypes.some((t, i) => t !== currentTypes[i])) {
      initSession(pages.length, templateTypes);
    }
  }, [pages, initSession]);

  // ═══ Score sync bridge: interactive store → learning media store ═══
  // When interactive widgets (kuis, game, diskusi, refleksi) report scores
  // via the interactive store, we bridge them to the learning media store.
  // This also triggers the appropriate completion action (markPageAnswered,
  // markPageGameCompleted, markPageReflected) so the PageRuntimeContract
  // system properly unlocks navigation and updates completion indicators.
  const syncScores = useLearningMediaStore(s => s.syncScores);
  const markPageAnswered = useLearningMediaStore(s => s.markPageAnswered);
  const markPageGameCompleted = useLearningMediaStore(s => s.markPageGameCompleted);
  const markPageReflected = useLearningMediaStore(s => s.markPageReflected);

  useEffect(() => {
    const unsubscribe = useInteractiveStore.subscribe((state) => {
      const completedScores = state.scores.filter(s => s.completed);
      const entries = completedScores.map((s: InteractiveScoreEntry) => ({
        pageId: s.elementId,
        screenIndex: s.pageIndex,
        score: s.score,
        maxScore: s.maxScore,
        timestamp: Date.now(),
      }));
      if (entries.length > 0) {
        syncScores(entries);

        // Trigger completion actions based on page contract type
        // This is the critical bridge that makes navigation locks work end-to-end:
        //   KuisRenderer → reportScore() → interactive store → this bridge → markPageAnswered()
        //   → pageCompletionStatus changes from 'locked' to 'completed' → BottomNav unlocks
        const learnStore = useLearningMediaStore.getState();
        for (const s of completedScores) {
          const screenIndex = s.pageIndex;
          const contract = learnStore.getContract(screenIndex);
          if (contract) {
            if (contract.completionType === 'answer') {
              markPageAnswered(screenIndex);
            } else if (contract.completionType === 'game') {
              markPageGameCompleted(screenIndex);
            } else if (contract.completionType === 'reflection') {
              markPageReflected(screenIndex);
            }
          }
        }
      }
    });

    // Initial sync on mount
    const initialScores = useInteractiveStore.getState().scores.filter(s => s.completed);
    const initialEntries = initialScores.map((s: InteractiveScoreEntry) => ({
      pageId: s.elementId,
      screenIndex: s.pageIndex,
      score: s.score,
      maxScore: s.maxScore,
      timestamp: Date.now(),
    }));
    if (initialEntries.length > 0) {
      syncScores(initialEntries);

      // Trigger completion actions for initial scores
      const learnStore = useLearningMediaStore.getState();
      for (const s of initialScores) {
        const screenIndex = s.pageIndex;
        const contract = learnStore.getContract(screenIndex);
        if (contract) {
          if (contract.completionType === 'answer') markPageAnswered(screenIndex);
          else if (contract.completionType === 'game') markPageGameCompleted(screenIndex);
          else if (contract.completionType === 'reflection') markPageReflected(screenIndex);
        }
      }
    }

    return () => unsubscribe();
  }, [syncScores, markPageAnswered, markPageGameCompleted, markPageReflected]);

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

  // Handle "Selesai" button — always show completion modal
  const handleSelesai = useCallback(() => {
    stopEditing();
    showCompletion();
  }, [showCompletion, stopEditing]);

  // Handle back to edit — save pending edits first
  const handleBack = useCallback(() => {
    stopEditing();
    setAppMode('edit');
  }, [setAppMode, stopEditing]);

  // Handle restart — reset both stores so the session is truly fresh
  const handleRestart = useCallback(() => {
    // Reset interactive-store: clear scores + bump replayGeneration
    // so all renderers (kuis, game, refleksi, diskusi) reset their
    // internal state. Without this, stale scores persist in
    // interactive-store (localStorage) and the bridge would sync
    // them back to learning-media-store on the next score change.
    useInteractiveStore.getState().replayAll();

    resetSession();
    const templateTypes = pages.map(p => p.templateType || 'custom');
    initSession(pages.length, templateTypes);
  }, [resetSession, initSession, pages]);

  // Compute scores
  const { earned: totalScore, possible: maxScore } = getTotalScore();
  const progress = getProgress();

  // Navigation lock state
  const { allowed: isNextAllowed, reason: nextLockReason } = canGoNext();

  // Page statuses for dots
  const pageStatuses = useMemo(() => getAllPageStatuses(), [currentScreenIndex, getAllPageStatuses]);

  // Current page
  const page = pages[currentScreenIndex];
  const templateType = page?.templateType || 'custom';
  const phaseMeta = getPhaseMeta(templateType);

  // Page title for top navbar
  const pageTitle = page?.label || phaseMeta.label || `Halaman ${currentScreenIndex + 1}`;

  // Detect dark content: check if the theme is a dark theme (based on contractId or themeId)
  // Dark themes: macam-norma, golden-presentation, hakikat-norma, default
  // Light themes: ios-light, ios-warm, minimal, ocean-light, warm-light
  const isDarkContent = (() => {
    const contractId = page?.contractId;
    const schemaThemeId = page?.schema?.themeId || (page?.templateData as Record<string, unknown>)?.schemaThemeId as string | undefined;
    // macam-norma, golden-pertemuan, hakikat-norma → dark
    // ios-light, ios-warm, minimal, ocean-light, warm-light → light
    const lightThemes = ['ios-light', 'ios-warm', 'minimal', 'ocean-light', 'warm-light'];
    if (lightThemes.includes(schemaThemeId || '')) return false;
    // Default to dark for all PPKn learning media (matches HTML originals)
    return true;
  })();

  if (!page) return null;

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${
      isDarkContent ? 'bg-[#080f1a]' : 'bg-slate-100'
    }`}>
      {/* Top Navbar */}
      <TopNavbar
        title={pageTitle}
        progress={progress}
        totalScore={totalScore}
        maxScore={maxScore}
        onBack={handleBack}
        isDark={isDarkContent}
      />

      {/* Phase badge row + Edit/Play toggle */}
      <div className={`flex items-center gap-2 px-4 py-1.5 shrink-0 ${
        isDarkContent
          ? 'bg-[#0e1c2f]/80 border-b border-white/5'
          : 'bg-white/80 border-b border-slate-100'
      }`}>
        <PhaseBadge templateType={templateType} />
        <span className="text-[11px] text-slate-400">
          Halaman {currentScreenIndex + 1} dari {totalScreens}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Edit / Play toggle — CRITICAL for mode separation */}
        <button
          onClick={toggleLearnSubMode}
          className={`
            flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all
            ${learnSubMode === 'edit'
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }
          `}
          title={learnSubMode === 'edit'
            ? 'Mode Edit — klik teks untuk mengedit'
            : 'Mode Main — klik interaksi untuk bermain'
          }
        >
          {learnSubMode === 'edit' ? (
            <>
              <Pencil size={11} />
              <span>Edit</span>
            </>
          ) : (
            <>
              <Play size={11} />
              <span>Main</span>
            </>
          )}
        </button>
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

      {/* Bottom Navigation — contract-aware */}
      <BottomNav
        currentScreen={currentScreenIndex}
        totalScreens={totalScreens}
        pageStatuses={pageStatuses}
        templateType={templateType}
        onPrev={prevScreen}
        onNext={currentScreenIndex >= totalScreens - 1 ? handleSelesai : nextScreen}
        onGoToScreen={forceGoToScreen}
        isNextLocked={!isNextAllowed && currentScreenIndex < totalScreens - 1}
        lockReason={nextLockReason}
        isDark={isDarkContent}
      />

      {/* Navigation Lock Toast */}
      {showLockToast && navigationLockReason && (
        <LockToast
          reason={navigationLockReason}
          onDismiss={dismissLockToast}
        />
      )}

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
