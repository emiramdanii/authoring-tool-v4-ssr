// ═══════════════════════════════════════════════════════════════
// LEARNING MEDIA STORE — Runtime state for student-facing learn mode
// ═══════════════════════════════════════════════════════════════
// Manages: currentScreenIndex, visitedScreens, scoreEntries,
// completion state, and navigation locks.
// This is EPHEMERAL — not persisted. Each session starts fresh.
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';

// ── Types ──────────────────────────────────────────────────────

export interface ScoreEntry {
  /** The page/screen ID this score belongs to */
  pageId: string;
  /** Score value (0-100) */
  score: number;
  /** Maximum possible score */
  maxScore: number;
  /** Timestamp when scored */
  timestamp: number;
}

export interface LearningMediaState {
  // ── Navigation ──
  /** Current screen index (0-based, maps to pages[]) */
  currentScreenIndex: number;
  /** Total screens (synced from canva-store pages.length) */
  totalScreens: number;
  /** Set of visited screen indices */
  visitedScreens: Set<number>;

  // ── Score ──
  /** Score entries per page */
  scoreEntries: Map<string, ScoreEntry>;

  // ── Completion ──
  /** Whether the learning session is complete (all screens visited) */
  isComplete: boolean;
  /** Whether the completion modal is showing */
  showCompletionModal: boolean;

  // ── Session ──
  /** Whether the session has been initialized */
  sessionInitialized: boolean;

  // ── Actions ──
  /** Initialize session with total screen count */
  initSession: (totalScreens: number) => void;
  /** Navigate to a specific screen */
  goToScreen: (index: number) => void;
  /** Go to the next screen */
  nextScreen: () => void;
  /** Go to the previous screen */
  prevScreen: () => void;
  /** Record a score for a page */
  recordScore: (pageId: string, score: number, maxScore: number) => void;
  /** Sync scores from interactive widgets */
  syncScores: (entries: ScoreEntry[]) => void;
  /** Show the completion modal */
  showCompletion: () => void;
  /** Dismiss the completion modal */
  dismissCompletion: () => void;
  /** Reset the entire learning session */
  resetSession: () => void;
  /** Get total score across all scored screens */
  getTotalScore: () => { earned: number; possible: number };
  /** Get progress percentage (0-100) */
  getProgress: () => number;
}

// ── Store ──────────────────────────────────────────────────────

export const useLearningMediaStore = create<LearningMediaState>((set, get) => ({
  // ── Initial state ──
  currentScreenIndex: 0,
  totalScreens: 0,
  visitedScreens: new Set<number>(),
  scoreEntries: new Map<string, ScoreEntry>(),
  isComplete: false,
  showCompletionModal: false,
  sessionInitialized: false,

  // ── Actions ──

  initSession: (totalScreens) => {
    const state = get();
    if (state.sessionInitialized && state.totalScreens === totalScreens) return;
    set({
      totalScreens,
      currentScreenIndex: 0,
      visitedScreens: new Set([0]),
      scoreEntries: new Map(),
      isComplete: false,
      showCompletionModal: false,
      sessionInitialized: true,
    });
  },

  goToScreen: (index) => {
    const { totalScreens, visitedScreens, isComplete } = get();
    if (index < 0 || index >= totalScreens) return;
    const newVisited = new Set(visitedScreens);
    newVisited.add(index);
    const allVisited = newVisited.size >= totalScreens;
    set({
      currentScreenIndex: index,
      visitedScreens: newVisited,
      isComplete: allVisited && !isComplete ? true : isComplete,
    });
  },

  nextScreen: () => {
    const { currentScreenIndex, totalScreens } = get();
    if (currentScreenIndex < totalScreens - 1) {
      get().goToScreen(currentScreenIndex + 1);
    }
  },

  prevScreen: () => {
    const { currentScreenIndex } = get();
    if (currentScreenIndex > 0) {
      get().goToScreen(currentScreenIndex - 1);
    }
  },

  recordScore: (pageId, score, maxScore) => {
    const { scoreEntries } = get();
    const newEntries = new Map(scoreEntries);
    newEntries.set(pageId, { pageId, score, maxScore, timestamp: Date.now() });
    set({ scoreEntries: newEntries });
  },

  syncScores: (entries) => {
    const newEntries = new Map(get().scoreEntries);
    for (const entry of entries) {
      newEntries.set(entry.pageId, entry);
    }
    set({ scoreEntries: newEntries });
  },

  showCompletion: () => set({ showCompletionModal: true }),
  dismissCompletion: () => set({ showCompletionModal: false }),

  resetSession: () => set({
    currentScreenIndex: 0,
    totalScreens: 0,
    visitedScreens: new Set<number>(),
    scoreEntries: new Map<string, ScoreEntry>(),
    isComplete: false,
    showCompletionModal: false,
    sessionInitialized: false,
  }),

  getTotalScore: () => {
    const { scoreEntries } = get();
    let earned = 0;
    let possible = 0;
    scoreEntries.forEach((entry) => {
      earned += entry.score;
      possible += entry.maxScore;
    });
    return { earned, possible };
  },

  getProgress: () => {
    const { visitedScreens, totalScreens } = get();
    if (totalScreens === 0) return 0;
    return Math.round((visitedScreens.size / totalScreens) * 100);
  },
}));
