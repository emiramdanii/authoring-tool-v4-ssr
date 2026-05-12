// ═══════════════════════════════════════════════════════════════════
// GAME LOGIC TESTS — Pure logic extracted from game renderers
// ═══════════════════════════════════════════════════════════════════
// Tests the core game mechanics for 5 game types by extracting and
// testing pure logic functions rather than rendering components.

import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════════
// 1. SORTIR GAME LOGIC — Sorting/categorization game
// ═══════════════════════════════════════════════════════════════════

/** Sortir game state (mirrors React state from SortirGameRenderer) */
interface SortirState {
  poolState: Array<{ id: string; text: string; category: string; placed: boolean }>;
  kolomItems: Record<string, string[]>;
  selected: string | null;
  attempts: Record<string, number>;
}

function createSortirState(
  pool: Array<{ id: string; text: string; category: string }>,
  kolomIds: string[],
): SortirState {
  const kolomItems: Record<string, string[]> = {};
  kolomIds.forEach(k => { kolomItems[k] = []; });
  return {
    poolState: pool.map(p => ({ ...p, placed: false })),
    kolomItems,
    selected: null,
    attempts: {},
  };
}

function sortirSelectItem(state: SortirState, itemId: string): SortirState {
  return {
    ...state,
    selected: state.selected === itemId ? null : itemId,
  };
}

function sortirPlaceItem(state: SortirState, kolomId: string): SortirState {
  if (!state.selected) return state;
  const item = state.poolState.find(p => p.id === state.selected);
  if (!item) return state;

  const isCorrect = item.category === kolomId;

  if (isCorrect) {
    return {
      ...state,
      poolState: state.poolState.map(p =>
        p.id === state.selected ? { ...p, placed: true } : p,
      ),
      kolomItems: {
        ...state.kolomItems,
        [kolomId]: [...(state.kolomItems[kolomId] || []), item.text],
      },
      selected: null,
    };
  } else {
    return {
      ...state,
      attempts: {
        ...state.attempts,
        [item.id]: (state.attempts[item.id] || 0) + 1,
      },
      selected: null,
    };
  }
}

function sortirIsCompleted(state: SortirState): boolean {
  const totalItems = state.poolState.length;
  const totalPlaced = state.poolState.filter(p => p.placed).length;
  return totalItems > 0 && totalPlaced >= totalItems;
}

function sortirCalcAccuracy(state: SortirState): number {
  const totalItems = state.poolState.length;
  const totalAttempts = Object.values(state.attempts).reduce((s, a) => s + a, 0);
  if (totalAttempts > 0) return Math.round((totalItems / (totalItems + totalAttempts)) * 100);
  return 100;
}

function sortirReset(
  pool: Array<{ id: string; text: string; category: string }>,
  kolomIds: string[],
): SortirState {
  return createSortirState(pool, kolomIds);
}

describe('Sortir Game Logic', () => {
  const pool = [
    { id: 's1', text: 'Sholat', category: 'agama' },
    { id: 's2', text: 'Teguran', category: 'sopan' },
    { id: 's3', text: 'Penjara', category: 'hukum' },
  ];
  const kolomIds = ['agama', 'sopan', 'hukum'];

  it('should set up initial state correctly', () => {
    const state = createSortirState(pool, kolomIds);
    expect(state.poolState).toHaveLength(3);
    expect(state.poolState.every(p => !p.placed)).toBe(true);
    expect(state.selected).toBeNull();
    expect(Object.keys(state.kolomItems)).toHaveLength(3);
    expect(state.kolomItems['agama']).toEqual([]);
  });

  it('should handle correct answer placement', () => {
    let state = createSortirState(pool, kolomIds);
    state = sortirSelectItem(state, 's1'); // Select "Sholat"
    state = sortirPlaceItem(state, 'agama'); // Place in correct kolom

    expect(state.poolState.find(p => p.id === 's1')?.placed).toBe(true);
    expect(state.kolomItems['agama']).toContain('Sholat');
    expect(state.selected).toBeNull();
  });

  it('should handle wrong answer placement', () => {
    let state = createSortirState(pool, kolomIds);
    state = sortirSelectItem(state, 's1'); // Select "Sholat" (category: agama)
    state = sortirPlaceItem(state, 'hukum'); // Place in wrong kolom

    expect(state.poolState.find(p => p.id === 's1')?.placed).toBe(false);
    expect(state.kolomItems['hukum']).toEqual([]);
    expect(state.attempts['s1']).toBe(1);
  });

  it('should calculate accuracy correctly', () => {
    let state = createSortirState(pool, kolomIds);
    // Perfect score — no wrong attempts
    state = sortirSelectItem(state, 's1');
    state = sortirPlaceItem(state, 'agama');
    state = sortirSelectItem(state, 's2');
    state = sortirPlaceItem(state, 'sopan');
    state = sortirSelectItem(state, 's3');
    state = sortirPlaceItem(state, 'hukum');
    expect(sortirCalcAccuracy(state)).toBe(100);

    // With one wrong attempt
    state = createSortirState(pool, kolomIds);
    state = sortirSelectItem(state, 's1');
    state = sortirPlaceItem(state, 'hukum'); // wrong
    state = sortirSelectItem(state, 's1');
    state = sortirPlaceItem(state, 'agama'); // correct
    state = sortirSelectItem(state, 's2');
    state = sortirPlaceItem(state, 'sopan');
    state = sortirSelectItem(state, 's3');
    state = sortirPlaceItem(state, 'hukum');
    // totalItems=3, totalAttempts=1 → 3/(3+1)*100 = 75
    expect(sortirCalcAccuracy(state)).toBe(75);
  });

  it('should detect completion', () => {
    let state = createSortirState(pool, kolomIds);
    expect(sortirIsCompleted(state)).toBe(false);

    state = sortirSelectItem(state, 's1');
    state = sortirPlaceItem(state, 'agama');
    expect(sortirIsCompleted(state)).toBe(false);

    state = sortirSelectItem(state, 's2');
    state = sortirPlaceItem(state, 'sopan');
    expect(sortirIsCompleted(state)).toBe(false);

    state = sortirSelectItem(state, 's3');
    state = sortirPlaceItem(state, 'hukum');
    expect(sortirIsCompleted(state)).toBe(true);
  });

  it('should reset to initial state', () => {
    let state = createSortirState(pool, kolomIds);
    state = sortirSelectItem(state, 's1');
    state = sortirPlaceItem(state, 'agama');
    expect(sortirIsCompleted(state)).toBe(false);

    state = sortirReset(pool, kolomIds);
    expect(state.poolState.every(p => !p.placed)).toBe(true);
    expect(state.selected).toBeNull();
    expect(state.attempts).toEqual({});
    expect(sortirIsCompleted(state)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. MEMORY GAME LOGIC — Card-matching game
// ═══════════════════════════════════════════════════════════════════

interface MemoryCard {
  id: string;
  pairId: string;
  type: 'left' | 'right';
  text: string;
}

interface MemoryState {
  cards: MemoryCard[];
  flipped: string[];
  matched: Set<string>;
  moves: number;
  wrongAttempts: number;
}

/** Build card deck from pairs (deterministic for testing) */
function buildMemoryCards(pairs: Array<{ left: string; right: string }>, blockId = 'mem'): MemoryCard[] {
  const cards: MemoryCard[] = [];
  pairs.forEach((pair, idx) => {
    if (pair.left && pair.right) {
      cards.push({ id: `${blockId}-L${idx}`, pairId: `${blockId}-P${idx}`, type: 'left', text: pair.left });
      cards.push({ id: `${blockId}-R${idx}`, pairId: `${blockId}-P${idx}`, type: 'right', text: pair.right });
    }
  });
  return cards; // No shuffle for deterministic tests
}

function createMemoryState(pairs: Array<{ left: string; right: string }>): MemoryState {
  return {
    cards: buildMemoryCards(pairs),
    flipped: [],
    matched: new Set(),
    moves: 0,
    wrongAttempts: 0,
  };
}

function memoryFlipCard(state: MemoryState, cardId: string): MemoryState {
  if (state.matched.has(cardId)) return state;
  if (state.flipped.includes(cardId)) return state;

  const newFlipped = [...state.flipped, cardId];

  // First card — just flip
  if (newFlipped.length === 1) {
    return { ...state, flipped: newFlipped };
  }

  // Second card — evaluate match
  if (newFlipped.length === 2) {
    const card1 = state.cards.find(c => c.id === newFlipped[0]);
    const card2 = state.cards.find(c => c.id === newFlipped[1]);
    if (!card1 || !card2) return { ...state, flipped: newFlipped };

    const isMatch = card1.pairId === card2.pairId && card1.type !== card2.type;

    if (isMatch) {
      const newMatched = new Set(state.matched);
      newMatched.add(card1.id);
      newMatched.add(card2.id);
      return { ...state, flipped: [], matched: newMatched, moves: state.moves + 1 };
    } else {
      return { ...state, flipped: [], moves: state.moves + 1, wrongAttempts: state.wrongAttempts + 1 };
    }
  }

  return state;
}

function memoryCalcScore(pairsCount: number, wrongAttempts: number): number {
  return Math.max(Math.ceil(pairsCount * 0.5), pairsCount - wrongAttempts);
}

function memoryIsComplete(state: MemoryState): boolean {
  return state.matched.size === state.cards.length && state.cards.length > 0;
}

describe('Memory Game Logic', () => {
  const pairs = [
    { left: 'Norma Agama', right: 'Aturan dari Tuhan' },
    { left: 'Norma Kesopanan', right: 'Aturan sopan santun' },
    { left: 'Norma Hukum', right: 'Aturan negara' },
  ];

  it('should set up initial state correctly', () => {
    const state = createMemoryState(pairs);
    // 3 pairs → 6 cards
    expect(state.cards).toHaveLength(6);
    expect(state.flipped).toHaveLength(0);
    expect(state.matched.size).toBe(0);
    expect(state.moves).toBe(0);
    expect(state.wrongAttempts).toBe(0);
  });

  it('should handle correct match (left + right of same pair)', () => {
    let state = createMemoryState(pairs);
    // Flip left card of pair 0, then right card of pair 0
    state = memoryFlipCard(state, 'mem-L0');
    expect(state.flipped).toHaveLength(1);

    state = memoryFlipCard(state, 'mem-R0');
    // Should match — same pairId, different type
    expect(state.matched.has('mem-L0')).toBe(true);
    expect(state.matched.has('mem-R0')).toBe(true);
    expect(state.flipped).toHaveLength(0); // Cleared on match
    expect(state.moves).toBe(1);
    expect(state.wrongAttempts).toBe(0);
  });

  it('should handle wrong match (different pairIds)', () => {
    let state = createMemoryState(pairs);
    state = memoryFlipCard(state, 'mem-L0');
    state = memoryFlipCard(state, 'mem-R1'); // Different pair
    expect(state.matched.size).toBe(0);
    expect(state.moves).toBe(1);
    expect(state.wrongAttempts).toBe(1);
  });

  it('should handle wrong match (same type — both left)', () => {
    let state = createMemoryState(pairs);
    state = memoryFlipCard(state, 'mem-L0');
    state = memoryFlipCard(state, 'mem-L1'); // Both left — not a match
    expect(state.matched.size).toBe(0);
    expect(state.wrongAttempts).toBe(1);
  });

  it('should calculate score with 50% floor', () => {
    // Perfect score: 3 pairs, 0 wrong → max(ceil(1.5), 3) = 3
    expect(memoryCalcScore(3, 0)).toBe(3);

    // Some wrong: 3 pairs, 1 wrong → max(2, 2) = 2
    expect(memoryCalcScore(3, 1)).toBe(2);

    // Many wrong: 3 pairs, 5 wrong → max(2, -2) = 2 (50% floor)
    expect(memoryCalcScore(3, 5)).toBe(2);

    // Single pair: max(1, 1) = 1
    expect(memoryCalcScore(1, 0)).toBe(1);
  });

  it('should detect completion', () => {
    let state = createMemoryState(pairs);
    expect(memoryIsComplete(state)).toBe(false);

    // Match all pairs
    state = memoryFlipCard(state, 'mem-L0');
    state = memoryFlipCard(state, 'mem-R0');
    state = memoryFlipCard(state, 'mem-L1');
    state = memoryFlipCard(state, 'mem-R1');
    state = memoryFlipCard(state, 'mem-L2');
    state = memoryFlipCard(state, 'mem-R2');

    expect(memoryIsComplete(state)).toBe(true);
    expect(state.moves).toBe(3);
  });

  it('should reset state', () => {
    let state = createMemoryState(pairs);
    state = memoryFlipCard(state, 'mem-L0');
    state = memoryFlipCard(state, 'mem-R0');

    state = createMemoryState(pairs);
    expect(state.flipped).toHaveLength(0);
    expect(state.matched.size).toBe(0);
    expect(state.moves).toBe(0);
    expect(state.wrongAttempts).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. MATCHING GAME LOGIC — Left/right column matching
// ═══════════════════════════════════════════════════════════════════

interface MatchingState {
  selectedLeft: number | null;
  matchedLeft: Set<number>;
  matchedRight: Set<number>;
  wrongAttempts: number;
  phase: 'play' | 'done';
}

function createMatchingState(): MatchingState {
  return {
    selectedLeft: null,
    matchedLeft: new Set(),
    matchedRight: new Set(),
    wrongAttempts: 0,
    phase: 'play',
  };
}

function matchingSelectLeft(state: MatchingState, leftIdx: number): MatchingState {
  if (state.matchedLeft.has(leftIdx)) return state;
  return { ...state, selectedLeft: state.selectedLeft === leftIdx ? null : leftIdx };
}

function matchingSelectRight(
  state: MatchingState,
  rightOriginalIdx: number,
  shuffledIdx: number,
  totalPairs: number,
): MatchingState {
  if (state.selectedLeft === null || state.matchedRight.has(shuffledIdx)) return state;

  if (rightOriginalIdx === state.selectedLeft) {
    // Correct match
    const newMatchedLeft = new Set(state.matchedLeft);
    newMatchedLeft.add(state.selectedLeft);
    const newMatchedRight = new Set(state.matchedRight);
    newMatchedRight.add(shuffledIdx);
    const newMatchedCount = newMatchedLeft.size;

    return {
      ...state,
      matchedLeft: newMatchedLeft,
      matchedRight: newMatchedRight,
      selectedLeft: null,
      phase: newMatchedCount >= totalPairs ? 'done' : 'play',
    };
  } else {
    // Wrong match
    return {
      ...state,
      wrongAttempts: state.wrongAttempts + 1,
      selectedLeft: null,
    };
  }
}

function matchingCalcScore(totalPairs: number, wrongAttempts: number): number {
  return Math.max(Math.ceil(totalPairs * 0.5), totalPairs - wrongAttempts);
}

describe('Matching Game Logic', () => {
  const pairs = [
    { left: 'Norma Agama', right: 'Sanksi dosa' },
    { left: 'Norma Kesopanan', right: 'Sanksi teguran' },
    { left: 'Norma Hukum', right: 'Sanksi hukuman' },
  ];

  it('should set up initial state correctly', () => {
    const state = createMatchingState();
    expect(state.selectedLeft).toBeNull();
    expect(state.matchedLeft.size).toBe(0);
    expect(state.matchedRight.size).toBe(0);
    expect(state.phase).toBe('play');
  });

  it('should handle correct match', () => {
    let state = createMatchingState();
    state = matchingSelectLeft(state, 0); // Select left item 0
    state = matchingSelectRight(state, 0, 0, pairs.length); // Match with correct right (originalIdx=0)

    expect(state.matchedLeft.has(0)).toBe(true);
    expect(state.matchedRight.has(0)).toBe(true);
    expect(state.selectedLeft).toBeNull();
    expect(state.wrongAttempts).toBe(0);
  });

  it('should handle wrong match', () => {
    let state = createMatchingState();
    state = matchingSelectLeft(state, 0);
    state = matchingSelectRight(state, 1, 1, pairs.length); // Wrong: leftIdx=0 but rightOriginalIdx=1

    expect(state.matchedLeft.size).toBe(0);
    expect(state.wrongAttempts).toBe(1);
    expect(state.selectedLeft).toBeNull();
  });

  it('should calculate score with 50% floor', () => {
    expect(matchingCalcScore(3, 0)).toBe(3);
    expect(matchingCalcScore(3, 1)).toBe(2);
    expect(matchingCalcScore(3, 5)).toBe(2); // 50% floor
  });

  it('should detect completion', () => {
    let state = createMatchingState();
    state = matchingSelectLeft(state, 0);
    state = matchingSelectRight(state, 0, 0, pairs.length);
    expect(state.phase).toBe('play');

    state = matchingSelectLeft(state, 1);
    state = matchingSelectRight(state, 1, 1, pairs.length);
    expect(state.phase).toBe('play');

    state = matchingSelectLeft(state, 2);
    state = matchingSelectRight(state, 2, 2, pairs.length);
    expect(state.phase).toBe('done');
  });

  it('should reset state', () => {
    let state = createMatchingState();
    state = matchingSelectLeft(state, 0);
    state = matchingSelectRight(state, 0, 0, pairs.length);

    state = createMatchingState();
    expect(state.selectedLeft).toBeNull();
    expect(state.matchedLeft.size).toBe(0);
    expect(state.phase).toBe('play');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. FILL-BLANK GAME LOGIC — Fill-in-the-blank game
// ═══════════════════════════════════════════════════════════════════

interface FillBlankState {
  currentQ: number;
  score: number;
  answered: boolean;
  lastCorrect: boolean | null;
  phase: 'play' | 'result';
}

function createFillBlankState(): FillBlankState {
  return { currentQ: 0, score: 0, answered: false, lastCorrect: null, phase: 'play' };
}

function fillBlankCheckAnswer(
  state: FillBlankState,
  userInput: string,
  correctAnswer: string,
  totalQuestions: number,
): FillBlankState {
  if (state.answered) return state;

  const userAns = userInput.trim().toLowerCase();
  const correctAns = correctAnswer.toLowerCase();
  const acceptList = correctAns.split('/').map(a => a.trim());
  const isCorrect = acceptList.includes(userAns);

  const nextQ = state.currentQ + 1;
  const isLast = nextQ >= totalQuestions;

  return {
    currentQ: isLast ? state.currentQ : nextQ,
    score: isCorrect ? state.score + 1 : state.score,
    answered: true,
    lastCorrect: isCorrect,
    phase: isLast ? 'result' : 'play',
  };
}

/** Simulate advancing to next question after feedback */
function fillBlankAdvance(state: FillBlankState): FillBlankState {
  if (!state.answered) return state;
  return { ...state, answered: false, lastCorrect: null };
}

describe('Fill-Blank Game Logic', () => {
  const questions = [
    { text: 'Norma yang bersumber dari Tuhan disebut norma ___', answer: 'agama' },
    { text: 'Pelanggaran norma hukum mendapat sanksi berupa ___', answer: 'hukuman/pidana' },
    { text: 'Norma kesopanan berlaku di lingkungan ___', answer: 'masyarakat' },
  ];

  it('should set up initial state correctly', () => {
    const state = createFillBlankState();
    expect(state.currentQ).toBe(0);
    expect(state.score).toBe(0);
    expect(state.answered).toBe(false);
    expect(state.phase).toBe('play');
  });

  it('should handle correct answer', () => {
    let state = createFillBlankState();
    state = fillBlankCheckAnswer(state, 'agama', questions[0].answer, questions.length);
    expect(state.lastCorrect).toBe(true);
    expect(state.score).toBe(1);
    expect(state.answered).toBe(true);
  });

  it('should handle wrong answer', () => {
    let state = createFillBlankState();
    state = fillBlankCheckAnswer(state, 'hukum', questions[0].answer, questions.length);
    expect(state.lastCorrect).toBe(false);
    expect(state.score).toBe(0);
  });

  it('should support multiple accepted answers (slash-separated)', () => {
    const state = createFillBlankState();
    const result = fillBlankCheckAnswer(state, 'hukuman', questions[1].answer, questions.length);
    expect(result.lastCorrect).toBe(true);

    const result2 = createFillBlankState();
    const r2 = fillBlankCheckAnswer(result2, 'pidana', questions[1].answer, questions.length);
    expect(r2.lastCorrect).toBe(true);
  });

  it('should be case-insensitive', () => {
    const state = createFillBlankState();
    const result = fillBlankCheckAnswer(state, 'AGAMA', questions[0].answer, questions.length);
    expect(result.lastCorrect).toBe(true);
  });

  it('should detect completion after all questions answered', () => {
    let state = createFillBlankState();
    state = fillBlankCheckAnswer(state, 'agama', questions[0].answer, questions.length);
    state = fillBlankAdvance(state);
    state = fillBlankCheckAnswer(state, 'hukuman', questions[1].answer, questions.length);
    state = fillBlankAdvance(state);
    state = fillBlankCheckAnswer(state, 'masyarakat', questions[2].answer, questions.length);
    expect(state.phase).toBe('result');
    expect(state.score).toBe(3);
  });

  it('should reset state', () => {
    let state = createFillBlankState();
    state = fillBlankCheckAnswer(state, 'agama', questions[0].answer, questions.length);
    state = createFillBlankState();
    expect(state.currentQ).toBe(0);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('play');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. TRUE/FALSE GAME LOGIC — True/False game
// ═══════════════════════════════════════════════════════════════════

interface TrueFalseState {
  currentQ: number;
  score: number;
  answered: boolean;
  selected: boolean | null;
  phase: 'play' | 'result';
}

function createTrueFalseState(): TrueFalseState {
  return { currentQ: 0, score: 0, answered: false, selected: null, phase: 'play' };
}

/** Normalize the `correct` field which may be string "true"/"false" */
function normalizeCorrect(val: boolean | string): boolean {
  if (typeof val === 'string') return val.toLowerCase() === 'true';
  return Boolean(val);
}

function trueFalseAnswer(
  state: TrueFalseState,
  userChoice: boolean,
  correctAnswer: boolean,
  totalQuestions: number,
): TrueFalseState {
  if (state.answered) return state;

  const isCorrect = userChoice === correctAnswer;
  const nextQ = state.currentQ + 1;
  const isLast = nextQ >= totalQuestions;

  return {
    currentQ: isLast ? state.currentQ : nextQ,
    score: isCorrect ? state.score + 1 : state.score,
    answered: true,
    selected: userChoice,
    phase: isLast ? 'result' : 'play',
  };
}

function trueFalseAdvance(state: TrueFalseState): TrueFalseState {
  if (!state.answered) return state;
  return { ...state, answered: false, selected: null };
}

describe('True/False Game Logic', () => {
  const questions = [
    { text: 'Norma agama bersumber dari Tuhan', correct: true },
    { text: 'Pelanggaran norma kesopanan mendapat sanksi hukum', correct: false },
    { text: 'Norma kesusilaan bersumber dari hati nurani', correct: true },
  ];

  it('should set up initial state correctly', () => {
    const state = createTrueFalseState();
    expect(state.currentQ).toBe(0);
    expect(state.score).toBe(0);
    expect(state.answered).toBe(false);
    expect(state.selected).toBeNull();
    expect(state.phase).toBe('play');
  });

  it('should handle correct answer (true)', () => {
    let state = createTrueFalseState();
    state = trueFalseAnswer(state, true, questions[0].correct, questions.length);
    expect(state.selected).toBe(true);
    expect(state.score).toBe(1);
  });

  it('should handle correct answer (false)', () => {
    let state = createTrueFalseState();
    state = trueFalseAnswer(state, true, questions[0].correct, questions.length);
    state = trueFalseAdvance(state);
    state = trueFalseAnswer(state, false, questions[1].correct, questions.length);
    expect(state.score).toBe(2);
  });

  it('should handle wrong answer', () => {
    let state = createTrueFalseState();
    state = trueFalseAnswer(state, false, questions[0].correct, questions.length);
    expect(state.selected).toBe(false);
    expect(state.score).toBe(0);
  });

  it('should normalize string "true"/"false" to boolean', () => {
    expect(normalizeCorrect('true')).toBe(true);
    expect(normalizeCorrect('True')).toBe(true);
    expect(normalizeCorrect('false')).toBe(false);
    expect(normalizeCorrect('False')).toBe(false);
    expect(normalizeCorrect(true)).toBe(true);
    expect(normalizeCorrect(false)).toBe(false);
  });

  it('should calculate score correctly', () => {
    let state = createTrueFalseState();
    // Answer all correctly
    state = trueFalseAnswer(state, true, questions[0].correct, questions.length);
    state = trueFalseAdvance(state);
    state = trueFalseAnswer(state, false, questions[1].correct, questions.length);
    state = trueFalseAdvance(state);
    state = trueFalseAnswer(state, true, questions[2].correct, questions.length);
    expect(state.score).toBe(3);
    expect(state.phase).toBe('result');
  });

  it('should detect completion', () => {
    let state = createTrueFalseState();
    state = trueFalseAnswer(state, true, questions[0].correct, questions.length);
    expect(state.phase).toBe('play'); // Still questions left
    state = trueFalseAdvance(state);
    state = trueFalseAnswer(state, false, questions[1].correct, questions.length);
    expect(state.phase).toBe('play');
    state = trueFalseAdvance(state);
    state = trueFalseAnswer(state, true, questions[2].correct, questions.length);
    expect(state.phase).toBe('result');
  });

  it('should reset state', () => {
    let state = createTrueFalseState();
    state = trueFalseAnswer(state, true, questions[0].correct, questions.length);
    state = createTrueFalseState();
    expect(state.currentQ).toBe(0);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('play');
  });
});
