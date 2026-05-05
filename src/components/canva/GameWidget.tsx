'use client';

import { useAuthoringStore } from '@/store/authoring-store';
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
  compact?: boolean;
  onComplete?: (score: number, maxScore: number) => void;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN GAME WIDGET — routes to specific game renderers
   ═══════════════════════════════════════════════════════════════ */
export default function GameWidget({ dataIdx, compact = false, onComplete }: GameWidgetProps) {
  const modules = useAuthoringStore((s) => s.modules);

  // Get the specific module data
  const mod = dataIdx !== undefined && dataIdx >= 0 && dataIdx < modules.length
    ? modules[dataIdx]
    : null;

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
      {gameType === 'roda' && <RodaGame data={mod} compact={compact} />}
      {gameType === 'sorting' && <SortingGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'spinwheel' && <SpinWheelGame data={mod} compact={compact} />}
      {gameType === 'teambuzzer' && <TeamBuzzerGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'wordsearch' && <WordSearchGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'flashcard' && <FlashcardGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'crossword' && <CrosswordGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'fillblank' && <FillBlankGame data={mod} compact={compact} onComplete={onComplete} />}
      {gameType === 'dragdrop' && <DragDropGame data={mod} compact={compact} onComplete={onComplete} />}
      {!['truefalse','memory','matching','roda','sorting','spinwheel','teambuzzer','wordsearch','flashcard','crossword','fillblank','dragdrop'].includes(gameType) && (
        <GenericGameWidget data={mod} compact={compact} />
      )}
    </div>
  );
}
