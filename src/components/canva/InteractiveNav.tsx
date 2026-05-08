'use client';

import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { ChevronLeft, ChevronRight, Trophy, RotateCcw } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// INTERACTIVE NAV — Navigation overlay for Interactive Mode
// Shows prev/next, page dots, score badge, progress bar
// ═══════════════════════════════════════════════════════════════

export default function InteractiveNav() {
  const pages = useCanvaStore((s) => s.pages);
  const goPage = useCanvaStore((s) => s.goPage);
  const mode = useInteractiveStore((s) => s.mode);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);
  const goInteractivePage = useInteractiveStore((s) => s.goInteractivePage);
  const nextInteractivePage = useInteractiveStore((s) => s.nextInteractivePage);
  const prevInteractivePage = useInteractiveStore((s) => s.prevInteractivePage);
  const totalScore = useInteractiveStore((s) => s.totalScore);
  const totalMax = useInteractiveStore((s) => s.totalMax);
  const totalPct = useInteractiveStore((s) => s.totalPct);
  const isPageComplete = useInteractiveStore((s) => s.isPageComplete);
  const resetAllScores = useInteractiveStore((s) => s.resetAllScores);

  if (mode !== 'interactive') return null;

  const currentIdx = interactivePageIdx;
  const total = pages.length;
  const hasScore = totalMax() > 0;
  const progress = total > 1 ? ((currentIdx + 1) / total) * 100 : 100;

  const handleNav = (idx: number) => {
    goInteractivePage(idx);
    goPage(idx);
  };

  const handleNext = () => {
    const beforeIdx = interactivePageIdx;
    nextInteractivePage();
    // Re-read the interactive store to check if navigation actually succeeded.
    // If nextInteractivePage() silently failed (e.g. on last page or totalPages
    // was out of sync), we should not update the canva store either.
    const afterIdx = useInteractiveStore.getState().interactivePageIdx;
    if (afterIdx !== beforeIdx) goPage(afterIdx);
  };

  const handlePrev = () => {
    const beforeIdx = interactivePageIdx;
    prevInteractivePage();
    // Same guard as handleNext — only sync canva store if navigation happened.
    const afterIdx = useInteractiveStore.getState().interactivePageIdx;
    if (afterIdx !== beforeIdx) goPage(afterIdx);
  };

  return (
    <div className="flex-shrink-0 z-50">
      {/* Progress bar */}
      <div className="h-1 bg-slate-800/80">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Navbar */}
      <div className="glass-panel-strong border-t border-slate-700/50 px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">

          {/* Prev button */}
          <button
            onClick={handlePrev}
            disabled={currentIdx <= 0}
            className={`btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentIdx > 0
                ? 'hover:bg-slate-800/60 text-slate-200 cursor-pointer'
                : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Page dots */}
          <div className="flex items-center gap-2">
            {pages.map((p, i) => {
              const isActive = i === currentIdx;
              const isComplete = isPageComplete(i);
              const templateIcon: Record<string, string> = {
                cover: '🏠', dokumen: '📋', materi: '📝', kuis: '❓',
                game: '🎮', hasil: '🏆', hero: '🚀', skenario: '🎭', custom: '⬜',
              };
              return (
                <button
                  key={p.id}
                  onClick={() => handleNav(i)}
                  title={`${p.label} (${i + 1}/${total})`}
                  className={`relative transition-all duration-200 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'w-8 h-8 text-base bg-slate-700/40 ring-2 ring-emerald-400/60 shadow-lg shadow-emerald-500/20'
                      : `w-6 h-6 text-xs hover:bg-slate-800/40 ${isComplete ? 'ring-2 ring-emerald-400' : ''}`
                  }`}
                >
                  {/* Dot indicator behind the icon */}
                  <span className={`absolute rounded-full ${
                    isActive
                      ? 'w-2.5 h-2.5 bg-emerald-400'
                      : 'w-1.5 h-1.5 bg-slate-600'
                  }`} style={{ bottom: isActive ? 1 : 2, right: isActive ? 1 : 2 }} />
                  <span className="relative z-10">{templateIcon[p.templateType] || '📄'}</span>
                </button>
              );
            })}
          </div>

          {/* Page info + Score */}
          <div className="flex items-center gap-3">
            {/* Score badge */}
            {hasScore && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Trophy size={12} className="text-emerald-300" />
                <span className="font-mono font-bold text-[11px] text-emerald-300">{totalPct()}%</span>
                <span className="text-[9px] text-emerald-400/50">{totalScore()}/{totalMax()}</span>
              </div>
            )}

            {/* Page counter */}
            <span className="text-[10px] text-slate-500 font-mono">
              {currentIdx + 1}/{total}
            </span>

            {/* Next button */}
            <button
              onClick={handleNext}
              disabled={currentIdx >= total - 1}
              className={`btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentIdx < total - 1
                  ? 'hover:bg-slate-800/60 text-slate-200 cursor-pointer'
                  : 'opacity-30 cursor-not-allowed'
                }`}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Reset button */}
        {hasScore && (
          <div className="flex justify-center mt-1">
            <button
              onClick={() => { resetAllScores(); handleNav(0); }}
              className="btn-ghost flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors px-2 py-0.5 rounded"
            >
              <RotateCcw size={14} />
              <span>Ulangi</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
