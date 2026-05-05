// ═══════════════════════════════════════════════════════════════
// INTERACTIVE STORE — Runtime state for Interactive Mode
// Tracks mode toggle, navigation, scores across pages
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';

// ── Score Entry ────────────────────────────────────────────────

export interface ScoreEntry {
  elementId: string;
  pageIndex: number;
  score: number;
  maxScore: number;
  completed: boolean;
}

// ── Store Interface ────────────────────────────────────────────

interface InteractiveState {
  // ── Mode ───────────────────────────────────────────────────
  mode: 'design' | 'interactive';
  setMode: (mode: 'design' | 'interactive') => void;
  toggleMode: () => void;
  openPlay: () => void;
  closePlay: () => void;

  // ── Navigation ─────────────────────────────────────────────
  interactivePageIdx: number;
  goInteractivePage: (idx: number) => void;
  nextInteractivePage: () => void;
  prevInteractivePage: () => void;
  totalPages: number;
  setTotalPages: (n: number) => void;

  // ── Scores ─────────────────────────────────────────────────
  scores: ScoreEntry[];
  reportScore: (entry: Omit<ScoreEntry, 'completed'> & { completed?: boolean }) => void;
  resetAllScores: () => void;

  // ── Computed (as functions) ────────────────────────────────
  totalScore: () => number;
  totalMax: () => number;
  totalPct: () => number;
  pageScore: (pageIndex: number) => { score: number; max: number };
  isPageComplete: (pageIndex: number) => boolean;
  allPagesComplete: () => boolean;
}

// ── Store ──────────────────────────────────────────────────────

export const useInteractiveStore = create<InteractiveState>((set, get) => ({
  // ── Mode ───────────────────────────────────────────────────
  mode: 'design',

  setMode: (mode) => {
    set({ mode });
    if (mode === 'interactive') {
      // Reset navigation and scores when entering interactive mode
      set({ interactivePageIdx: 0 });
    }
  },

  toggleMode: () => {
    const next = get().mode === 'design' ? 'interactive' : 'design';
    get().setMode(next);
  },

  openPlay: () => {
    set({ mode: 'interactive', interactivePageIdx: 0, scores: [] });
  },

  closePlay: () => {
    set({ mode: 'design' });
  },

  // ── Navigation ─────────────────────────────────────────────
  interactivePageIdx: 0,
  totalPages: 0,

  setTotalPages: (n) => set({ totalPages: n }),

  goInteractivePage: (idx) => {
    const { totalPages } = get();
    if (idx >= 0 && idx < totalPages) {
      set({ interactivePageIdx: idx });
    }
  },

  nextInteractivePage: () => {
    const { interactivePageIdx, totalPages } = get();
    if (interactivePageIdx < totalPages - 1) {
      set({ interactivePageIdx: interactivePageIdx + 1 });
    }
  },

  prevInteractivePage: () => {
    const { interactivePageIdx } = get();
    if (interactivePageIdx > 0) {
      set({ interactivePageIdx: interactivePageIdx - 1 });
    }
  },

  // ── Scores ─────────────────────────────────────────────────
  scores: [],

  reportScore: (entry) => {
    const { scores } = get();
    // Update existing entry or add new one
    const existing = scores.findIndex(
      (s) => s.elementId === entry.elementId && s.pageIndex === entry.pageIndex
    );
    const newEntry: ScoreEntry = {
      ...entry,
      completed: entry.completed ?? true,
    };
    if (existing >= 0) {
      const updated = [...scores];
      updated[existing] = newEntry;
      set({ scores: updated });
    } else {
      set({ scores: [...scores, newEntry] });
    }
  },

  resetAllScores: () => set({ scores: [], interactivePageIdx: 0 }),

  // ── Computed ───────────────────────────────────────────────
  totalScore: () => {
    return get().scores.reduce((sum, s) => sum + s.score, 0);
  },

  totalMax: () => {
    return get().scores.reduce((sum, s) => sum + s.maxScore, 0);
  },

  totalPct: () => {
    const max = get().totalMax();
    if (max === 0) return 0;
    return Math.round((get().totalScore() / max) * 100);
  },

  pageScore: (pageIndex) => {
    const pageScores = get().scores.filter((s) => s.pageIndex === pageIndex);
    return {
      score: pageScores.reduce((sum, s) => sum + s.score, 0),
      max: pageScores.reduce((sum, s) => sum + s.maxScore, 0),
    };
  },

  isPageComplete: (pageIndex) => {
    return get().scores.some(
      (s) => s.pageIndex === pageIndex && s.completed
    );
  },

  allPagesComplete: () => {
    const { scores, totalPages } = get();
    // Check if every page that has interactive content has at least one completed score
    const pagesWithContent = new Set(scores.map((s) => s.pageIndex));
    if (pagesWithContent.size === 0) return false;
    for (const pg of pagesWithContent) {
      if (!scores.some((s) => s.pageIndex === pg && s.completed)) return false;
    }
    return true;
  },
}));
