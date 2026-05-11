'use client';

import dynamic from 'next/dynamic';
import { useAuthoringStore } from '@/store/authoring-store';
import { resolveModule } from '@/lib/module-resolver';
import { GAME_TYPES } from '@/lib/canva-constants';
import type { CanvaElement } from './types';
import { playSound } from '@/lib/sounds';

// Lazy-loaded game renderers — only one game is rendered at a time based on gameType.
// Using dynamic imports with ssr: false since these are purely client-side interactive components.
const GenericGameWidget = dynamic(() => import('./games/shared').then(mod => ({ default: mod.GenericGameWidget })), { ssr: false });
const TrueFalseGame = dynamic(() => import('./games/TrueFalseGame').then(mod => ({ default: mod.TrueFalseGame })), { ssr: false });
const MemoryGame = dynamic(() => import('./games/MemoryGame').then(mod => ({ default: mod.MemoryGame })), { ssr: false });
const MatchingGame = dynamic(() => import('./games/MatchingGame').then(mod => ({ default: mod.MatchingGame })), { ssr: false });
const RodaGame = dynamic(() => import('./games/RodaGame').then(mod => ({ default: mod.RodaGame })), { ssr: false });
const SortingGame = dynamic(() => import('./games/SortingGame').then(mod => ({ default: mod.SortingGame })), { ssr: false });
const SpinWheelGame = dynamic(() => import('./games/SpinWheelGame').then(mod => ({ default: mod.SpinWheelGame })), { ssr: false });
const TeamBuzzerGame = dynamic(() => import('./games/TeamBuzzerGame').then(mod => ({ default: mod.TeamBuzzerGame })), { ssr: false });
const WordSearchGame = dynamic(() => import('./games/WordSearchGame').then(mod => ({ default: mod.WordSearchGame })), { ssr: false });
const FlashcardGame = dynamic(() => import('./games/FlashcardGame').then(mod => ({ default: mod.FlashcardGame })), { ssr: false });
const CrosswordGame = dynamic(() => import('./games/CrosswordGame').then(mod => ({ default: mod.CrosswordGame })), { ssr: false });
const FillBlankGame = dynamic(() => import('./games/FillBlankGame').then(mod => ({ default: mod.FillBlankGame })), { ssr: false });
const DragDropGame = dynamic(() => import('./games/DragDropGame').then(mod => ({ default: mod.DragDropGame })), { ssr: false });

interface GameWidgetProps {
  dataIdx?: number;
  moduleId?: string; // Stable UUID reference (preferred over dataIdx)
  compact?: boolean;
  interactive?: boolean; // When true, widget is in export mode — hide authoring prompts
  onComplete?: (score: number, maxScore: number) => void;
}

// Use canonical GAME_TYPES from canva-export-helpers (single source of truth)

/* ═══════════════════════════════════════════════════════════════
   MAIN GAME WIDGET — routes to specific game renderers
   Uses resolveModule() for stable reference: moduleId > dataIdx
   ═══════════════════════════════════════════════════════════════ */
export default function GameWidget({ dataIdx, moduleId, compact = false, interactive = false, onComplete }: GameWidgetProps) {
  const modules = useAuthoringStore((s) => s.modules);

  // Build a pseudo-element for resolveModule() — supports both moduleId and dataIdx
  const refEl: Partial<CanvaElement> = {
    moduleId: moduleId,
    dataIdx: dataIdx,
  };

  // Resolve module data using stable reference (moduleId > dataIdx)
  const mod = resolveModule(refEl as CanvaElement, modules);

  const gameType = (mod?.type as string) || '';

  // Wrap onComplete to add sound effect when game finishes
  const handleComplete = interactive ? (score: number, maxScore: number) => {
    playSound('complete');
    onComplete?.(score, maxScore);
  } : undefined;

  if (!mod) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 rounded border border-cyan-500/20 p-3">
        <span className="text-2xl">🎮</span>
        <span className="text-[10px] text-cyan-300/70 mt-1">
          {interactive ? 'Belum ada game tersedia' : compact ? 'Belum ada game' : 'Tambahkan game di panel Konten → Modul & Game'}
        </span>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-auto rounded border border-cyan-500/20"
      onClick={(e) => e.stopPropagation()}
    >
      {gameType === 'truefalse' && <TrueFalseGame data={mod} compact={compact} interactive={interactive} onComplete={handleComplete} />}
      {gameType === 'memory' && <MemoryGame data={mod} compact={compact} interactive={interactive} onComplete={handleComplete} />}
      {gameType === 'matching' && <MatchingGame data={mod} compact={compact} interactive={interactive} onComplete={handleComplete} />}
      {gameType === 'roda' && <RodaGame data={mod} compact={compact} interactive={interactive} onComplete={handleComplete} />}
      {gameType === 'sorting' && <SortingGame data={mod} compact={compact} interactive={interactive} onComplete={handleComplete} />}
      {gameType === 'spinwheel' && <SpinWheelGame data={mod} compact={compact} interactive={interactive} onComplete={handleComplete} />}
      {gameType === 'teambuzzer' && <TeamBuzzerGame data={mod} compact={compact} interactive={interactive} onComplete={handleComplete} />}
      {gameType === 'wordsearch' && <WordSearchGame data={mod} compact={compact} interactive={interactive} onComplete={handleComplete} />}
      {gameType === 'flashcard' && <FlashcardGame data={mod} compact={compact} interactive={interactive} onComplete={handleComplete} />}
      {gameType === 'crossword' && <CrosswordGame data={mod} compact={compact} interactive={interactive} onComplete={handleComplete} />}
      {gameType === 'fillblank' && <FillBlankGame data={mod} compact={compact} interactive={interactive} onComplete={handleComplete} />}
      {gameType === 'dragdrop' && <DragDropGame data={mod} compact={compact} interactive={interactive} onComplete={handleComplete} />}
      {!(GAME_TYPES as readonly string[]).includes(gameType) && (
        <GenericGameWidget data={mod} compact={compact} />
      )}
    </div>
  );
}
