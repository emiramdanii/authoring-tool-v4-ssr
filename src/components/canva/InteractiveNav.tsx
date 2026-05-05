'use client';

import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';

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
    nextInteractivePage();
    if (currentIdx + 1 < total) goPage(currentIdx + 1);
  };

  const handlePrev = () => {
    prevInteractivePage();
    if (currentIdx - 1 >= 0) goPage(currentIdx - 1);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50">
      {/* Progress bar */}
      <div className="h-1 bg-zinc-800/80">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Navbar */}
      <div className="bg-zinc-900/95 backdrop-blur-md border-t border-zinc-700/50 px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">

          {/* Prev button */}
          <button
            onClick={handlePrev}
            disabled={currentIdx <= 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentIdx > 0
                ? 'bg-white/10 hover:bg-white/15 text-white cursor-pointer'
                : 'bg-white/5 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Page dots */}
          <div className="flex items-center gap-1.5">
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
                  className={`relative transition-all duration-200 ${
                    isActive
                      ? 'w-8 h-8 rounded-lg text-base bg-white/15 border-2 border-emerald-400/60 shadow-lg shadow-emerald-500/20'
                      : 'w-6 h-6 rounded-md text-xs hover:bg-white/10 border border-transparent'
                  } flex items-center justify-center`}
                >
                  {templateIcon[p.templateType] || '📄'}
                  {/* Completion indicator */}
                  {isComplete && !isActive && (
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-zinc-900" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Page info + Score */}
          <div className="flex items-center gap-3">
            {/* Score badge */}
            {hasScore && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25">
                <span className="text-xs">🏆</span>
                <span className="text-xs font-black text-amber-300">{totalPct()}%</span>
                <span className="text-[9px] text-amber-400/50">{totalScore()}/{totalMax()}</span>
              </div>
            )}

            {/* Page counter */}
            <span className="text-[11px] text-zinc-400 font-mono">
              {currentIdx + 1}/{total}
            </span>

            {/* Next button */}
            <button
              onClick={handleNext}
              disabled={currentIdx >= total - 1}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentIdx < total - 1
                  ? 'bg-white/10 hover:bg-white/15 text-white cursor-pointer'
                  : 'bg-white/5 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        {/* Reset button (small) */}
        {hasScore && (
          <div className="flex justify-center mt-1">
            <button
              onClick={() => { resetAllScores(); handleNav(0); }}
              className="text-[9px] text-zinc-600 hover:text-zinc-400 transition-colors px-2 py-0.5"
            >
              🔄 Reset Skor & Ulangi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
