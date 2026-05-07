// ═══════════════════════════════════════════════════════════════
// GAME ENGINE JS BUILDER — Vanilla JS for all interactive game
// engines in exported HTML slideshow (1-file self-contained)
// ═══════════════════════════════════════════════════════════════

// GAMEDATA structure:
//   quizzes: { "pageIdx": [...] }           — keyed by pageIdx only
//   truefalse/memory/...: { "pageIdx-gameIdx": {...} } — keyed by composite
// reportScore(pageIdx, score, max) is already defined in the export.

import { gPageIdxHelper } from './helpers';
import { quizEngine } from './quiz-engine';
import { truefalseEngine } from './truefalse-engine';
import { memoryEngine } from './memory-engine';
import { matchingEngine } from './matching-engine';
import { sortingEngine } from './sorting-engine';
import { rodaEngine } from './roda-engine';
import { spinwheelEngine } from './spinwheel-engine';
import { teambuzzerEngine } from './teambuzzer-engine';
import { wordsearchEngine } from './wordsearch-engine';
import { flashcardEngine } from './flashcard-engine';
import { gameTabsEngine } from './game-tabs';
import { crosswordEngine } from './crossword-engine';
import { fillblankEngine } from './fillblank-engine';
import { dragdropEngine } from './dragdrop-engine';
import { skenarioEngine } from './skenario-engine';

export function buildGameEngineJS(gamedataJSON: string): string {
  const engines = [
    gPageIdxHelper,
    quizEngine,
    truefalseEngine,
    memoryEngine,
    matchingEngine,
    sortingEngine,
    rodaEngine,
    spinwheelEngine,
    teambuzzerEngine,
    wordsearchEngine,
    flashcardEngine,
    gameTabsEngine,
    crosswordEngine,
    fillblankEngine,
    dragdropEngine,
    skenarioEngine,
  ].join('\n\n');

  return `var GAMEDATA = ${gamedataJSON};\n\n${engines}\n\nfunction initAllGames(){initQuizzes();initTrueFalse();initMemory();initMatching();initSorting();initRoda();initSpinWheel();initTeamBuzzer();initWordSearch();initFlashcard();initGameTabs();initCrossword();initFillBlank();initDragDrop();initSkenario();}`;
}
