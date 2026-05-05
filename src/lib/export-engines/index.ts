export { GAME_ENGINE_CSS } from './css';

import { quizEngineJS } from './quiz';
import { truefalseEngineJS } from './truefalse';
import { memoryEngineJS } from './memory';
import { matchingEngineJS } from './matching';
import { sortingEngineJS } from './sorting';
import { rodaEngineJS } from './roda';
import { spinwheelEngineJS } from './spinwheel';
import { teambuzzerEngineJS } from './teambuzzer';
import { wordsearchEngineJS } from './wordsearch';
import { flashcardEngineJS } from './flashcard';
import { crosswordEngineJS } from './crossword';
import { fillblankEngineJS } from './fillblank';
import { dragdropEngineJS } from './dragdrop';
import { gametabsEngineJS } from './gametabs';
import { initallEngineJS } from './initall';

export function buildGameEngineJS(gamedataJSON: string): string {
  return `
var GAMEDATA = ${gamedataJSON};

/* Helper: extract pageIdx from composite key "pageIdx-gameIdx" or plain "pageIdx" */
function gPageIdx(key){return parseInt(String(key).split('-')[0])}

${quizEngineJS}

${truefalseEngineJS}

${memoryEngineJS}

${matchingEngineJS}

${sortingEngineJS}

${rodaEngineJS}

${spinwheelEngineJS}

${teambuzzerEngineJS}

${wordsearchEngineJS}

${flashcardEngineJS}

${gametabsEngineJS}

${crosswordEngineJS}

${fillblankEngineJS}

${dragdropEngineJS}

${initallEngineJS}
`;
}
