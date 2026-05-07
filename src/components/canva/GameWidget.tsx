'use client';

import { useAuthoringStore } from '@/store/authoring-store';
import { resolveModule } from '@/lib/module-resolver';
import { GAME_TYPES } from '@/lib/canva-export-helpers';
import type { CanvaElement } from './types';
import { GenericGameWidget } from './games/shared';
import { TrueFalseGame } from './games/TrueFalseGame';
import { MemoryGame } from './games/MemoryGame';
import { MatchingGame } from './games/MatchingGame';
import { RodaGame } from './games/RodaGame';
import { SortingGame } from './games/SortingGame';
import { SpinWheelGame } from './games/SpinWheelGame';
import { TeamBuzzerGame } from './games/TeamBuzzerGame';
import { WordSearchGame } from './games/WordSearchGame';
import { FlashcardGame } from './games/FlashcardGame';
import { CrosswordGame } from './games/CrosswordGame';
import { FillBlankGame } from './games/FillBlankGame';
import { DragDropGame } from './games/DragDropGame';

interface GameWidgetProps {
  dataIdx?: number;
  moduleId?: string; // Stable UUID reference (preferred over dataIdx)
  compact?: boolean;
  onComplete?: (score: number, maxScore: number) => void;
}

// Use canonical GAME_TYPES from canva-export-helpers (single source of truth)

/* ═══════════════════════════════════════════════════════════════
   MAIN GAME WIDGET — routes to specific game renderers
   Uses resolveModule() for stable reference: moduleId > dataIdx
   ═══════════════════════════════════════════════════════════════ */
export default function GameWidget({ dataIdx, moduleId, compact = false, onComplete }: GameWidgetProps) {
  const modules = useAuthoringStore((s) => s.modules);

  // Build a pseudo-element for resolveModule() — supports both moduleId and dataIdx
  const refEl: Partial<CanvaElement> = {
    moduleId: moduleId,
    dataIdx: dataIdx,
  };

  // Resolve module data using stable reference (moduleId > dataIdx)
  const mod = resolveModule(refEl as CanvaElement, modules);

  const gameType = (mod?.type as string) || '';

  if (!mod) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 rounded border border-cyan-500/20 p-3">
        <span className="text-2xl">🎮</span>
        <span className="text-[10px] text-cyan-300/70 mt-1">
          {compact ? 'Belum ada game' : 'Tambahkan game di panel Konten → Modul & Game'}
        </span>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-hidden rounded border border-cyan-500/20"
      onClick={(e) => e.stopPropagation()}
    >
      {gameType === 'truefalse' && <TrueFalseGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'memory' && <MemoryGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'matching' && <MatchingGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'roda' && <RodaGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'sorting' && <SortingGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'spinwheel' && <SpinWheelGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'teambuzzer' && <TeamBuzzerGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'wordsearch' && <WordSearchGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'flashcard' && <FlashcardGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'crossword' && <CrosswordGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'fillblank' && <FillBlankGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'dragdrop' && <DragDropGame data={mod} compact={compact} onComplete={onComplete} />}
      {!(GAME_TYPES as readonly string[]).includes(gameType) && (
        <GenericGameWidget data={mod} compact={compact} />
      )}
    </div>
  );
}
