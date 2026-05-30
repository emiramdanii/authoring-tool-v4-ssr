// ═══════════════════════════════════════════════════════════════
// LEARNING MEDIA STORE — Runtime state for student-facing learn mode
// ═══════════════════════════════════════════════════════════════
// Manages: currentScreenIndex, visitedScreens, scoreEntries,
// pageCompletionStatus, navigation locks, and progress.
// This is EPHEMERAL — not persisted. Each session starts fresh.
//
// ARCHITECTURE:
//   PageRuntimeContract → defines per-page rules
//   → LearningMediaStore → enforces contracts, tracks completion
//   → BottomNav (canGoNext / lockReason)
//   → SceneList (✓ / ○ / 🔒 indicators)
//   → TopNavbar (progress, score)
//   → CompletionModal
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import {
  getPageContract,
  getPageCompletionStatus,
  canNavigateNext,
  isAutoComplete,
  type PageRuntimeContract,
  type PageCompletionStatus,
} from '@/core/edu/page-runtime-contract';

// ── Types ──────────────────────────────────────────────────────

export interface ScoreEntry {
  /** The page/screen ID this score belongs to */
  pageId: string;
  /** Screen index this score belongs to */
  screenIndex: number;
  /** Score value (0-100) */
  score: number;
  /** Maximum possible score */
  maxScore: number;
  /** Timestamp when scored */
  timestamp: number;
}

/** Per-page interaction tracking — not just visited, but what happened */
export interface PageInteraction {
  /** Whether the user submitted an answer (kuis/diskusi/refleksi) */
  hasAnswered: boolean;
  /** Whether the user completed a game */
  hasCompletedGame: boolean;
  /** Whether the user submitted a reflection */
  hasReflected: boolean;
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

  // ── Page Interactions ──
  /** Per-page interaction tracking */
  pageInteractions: Map<number, PageInteraction>;

  // ── Page Contracts ──
  /** Cached contracts per page (keyed by screen index) */
  pageContracts: Map<number, PageRuntimeContract>;
  /** Template types per screen index (synced from canva-store pages) */
  templateTypes: string[];

  // ── Completion ──
  /** Whether the learning session is complete (all required screens completed) */
  isComplete: boolean;
  /** Whether the completion modal is showing */
  showCompletionModal: boolean;

  // ── Session ──
  /** Whether the session has been initialized */
  sessionInitialized: boolean;

  // ── Learn Sub-Mode ──
  /**
   * Within Learn mode, there are two sub-modes:
   *   'edit' — teacher is editing content. Click on text = edit.
   *   'play' — teacher is testing as student. Click on text = nothing/interact.
   *
   * This is CRITICAL for the Edit vs Play separation:
   *   Edit Mode: klik teks = edit
   *   Play Mode: klik teks/interaksi = bermain, bukan edit
   */
  learnSubMode: 'edit' | 'play';

  // ── Navigation Lock ──
  /** Current navigation lock reason (if any) */
  navigationLockReason: string;
  /** Whether navigation lock toast is visible */
  showLockToast: boolean;

  // ── Actions ──
  /** Initialize session with total screen count and template types */
  initSession: (totalScreens: number, templateTypes?: string[]) => void;
  /** Navigate to a specific screen (respects navigation locks) */
  goToScreen: (index: number) => void;
  /** Go to the next screen (respects navigation locks) */
  nextScreen: () => void;
  /** Go to the previous screen (always allowed) */
  prevScreen: () => void;
  /** Force navigate to a screen (bypasses locks, used for dot navigation) */
  forceGoToScreen: (index: number) => void;
  /** Record a score for a page */
  recordScore: (pageId: string, screenIndex: number, score: number, maxScore: number) => void;
  /** Sync scores from interactive widgets */
  syncScores: (entries: ScoreEntry[]) => void;
  /** Mark a page interaction as answered */
  markPageAnswered: (screenIndex: number) => void;
  /** Mark a page game as completed */
  markPageGameCompleted: (screenIndex: number) => void;
  /** Mark a page reflection as submitted */
  markPageReflected: (screenIndex: number) => void;
  /** Toggle between edit and play sub-modes */
  setLearnSubMode: (mode: 'edit' | 'play') => void;
  /** Toggle learn sub-mode */
  toggleLearnSubMode: () => void;
  /** Show the completion modal */
  showCompletion: () => void;
  /** Dismiss the completion modal */
  dismissCompletion: () => void;
  /** Dismiss the navigation lock toast */
  dismissLockToast: () => void;
  /** Reset the entire learning session */
  resetSession: () => void;
  /** Get total score across all scored screens */
  getTotalScore: () => { earned: number; possible: number };
  /** Get progress percentage (0-100) based on COMPLETED pages, not just visited */
  getProgress: () => number;

  // ── Contract-aware computed ──
  /** Get the completion status of a specific page */
  getPageStatus: (screenIndex: number) => PageCompletionStatus;
  /** Check if navigation to next screen is allowed */
  canGoNext: () => { allowed: boolean; reason: string };
  /** Get the contract for a specific page */
  getContract: (screenIndex: number) => PageRuntimeContract;
  /** Get all page statuses as an array */
  getAllPageStatuses: () => PageCompletionStatus[];
  /** Recalculate isComplete based on current state */
  recalculateCompletion: () => void;
}

// ── Internal helpers ───────────────────────────────────────────

function createDefaultInteraction(): PageInteraction {
  return { hasAnswered: false, hasCompletedGame: false, hasReflected: false };
}

function computePageStatus(
  contract: PageRuntimeContract,
  visitedScreens: Set<number>,
  scoreEntries: Map<string, ScoreEntry>,
  pageInteractions: Map<number, PageInteraction>,
  screenIndex: number,
): PageCompletionStatus {
  const hasBeenVisited = visitedScreens.has(screenIndex);

  // Check score by screenIndex (not pageId) — interactive store scores
  // use elementId (block ID) as key, but we also store screenIndex.
  // So we check if any score entry has a matching screenIndex.
  let hasScore = false;
  scoreEntries.forEach((entry) => {
    if (entry.screenIndex === screenIndex) hasScore = true;
  });

  const interaction = pageInteractions.get(screenIndex);
  const hasInteraction = !!(interaction?.hasAnswered || interaction?.hasReflected);

  return getPageCompletionStatus(contract, hasBeenVisited, hasScore, hasInteraction);
}

// ── Store ──────────────────────────────────────────────────────

export const useLearningMediaStore = create<LearningMediaState>((set, get) => ({
  // ── Initial state ──
  currentScreenIndex: 0,
  totalScreens: 0,
  visitedScreens: new Set<number>(),
  scoreEntries: new Map<string, ScoreEntry>(),
  pageInteractions: new Map<number, PageInteraction>(),
  pageContracts: new Map<number, PageRuntimeContract>(),
  templateTypes: [],
  isComplete: false,
  showCompletionModal: false,
  sessionInitialized: false,
  learnSubMode: 'edit' as 'edit' | 'play',
  navigationLockReason: '',
  showLockToast: false,

  // ── Actions ──

  initSession: (totalScreens, templateTypes) => {
    const state = get();
    if (state.sessionInitialized && state.totalScreens === totalScreens) return;

    // Build contracts map from template types
    const contracts = new Map<number, PageRuntimeContract>();
    const types = templateTypes || new Array(totalScreens).fill('custom');
    for (let i = 0; i < totalScreens; i++) {
      const tt = types[i] || 'custom';
      contracts.set(i, getPageContract(tt));
    }

    set({
      totalScreens,
      currentScreenIndex: 0,
      visitedScreens: new Set([0]),
      scoreEntries: new Map(),
      pageInteractions: new Map(),
      pageContracts: contracts,
      templateTypes: types,
      isComplete: false,
      showCompletionModal: false,
      sessionInitialized: true,
      learnSubMode: 'edit',
      navigationLockReason: '',
      showLockToast: false,
    });

    // Auto-complete the first page if it's a view/auto type
    const firstContract = contracts.get(0);
    if (firstContract && isAutoComplete(firstContract)) {
      // Already visited via Set([0]) above, no extra action needed
    }
  },

  goToScreen: (index) => {
    const { totalScreens, visitedScreens } = get();
    if (index < 0 || index >= totalScreens) return;

    const newVisited = new Set(visitedScreens);
    newVisited.add(index);

    // Auto-complete pages with view/auto completion
    const contract = get().pageContracts.get(index);
    if (contract && isAutoComplete(contract)) {
      // Visiting = completing for these pages
    }

    set({
      currentScreenIndex: index,
      visitedScreens: newVisited,
    });

    // Recalculate completion after navigation
    get().recalculateCompletion();
  },

  nextScreen: () => {
    const { currentScreenIndex, totalScreens } = get();
    if (currentScreenIndex >= totalScreens - 1) return;

    const nextIndex = currentScreenIndex + 1;

    // Check if current page allows navigation forward
    const currentContract = get().getContract(currentScreenIndex);
    const currentStatus = get().getPageStatus(currentScreenIndex);
    const navCheck = canNavigateNext(currentContract, currentStatus);

    if (!navCheck.allowed) {
      set({
        navigationLockReason: navCheck.reason,
        showLockToast: true,
      });
      return;
    }

    // Clear lock state and navigate
    set({
      navigationLockReason: '',
      showLockToast: false,
    });
    get().goToScreen(nextIndex);
  },

  prevScreen: () => {
    const { currentScreenIndex } = get();
    if (currentScreenIndex > 0) {
      set({ navigationLockReason: '', showLockToast: false });
      get().goToScreen(currentScreenIndex - 1);
    }
  },

  forceGoToScreen: (index) => {
    // Bypass navigation locks — used for dot navigation in BottomNav
    // and SceneList clicks (user explicitly chose this page)
    set({ navigationLockReason: '', showLockToast: false });
    get().goToScreen(index);
  },

  recordScore: (pageId, screenIndex, score, maxScore) => {
    const { scoreEntries } = get();
    const newEntries = new Map(scoreEntries);
    newEntries.set(pageId, { pageId, screenIndex, score, maxScore, timestamp: Date.now() });
    set({ scoreEntries: newEntries });

    // Auto-mark interaction based on contract
    const contract = get().pageContracts.get(screenIndex);
    if (contract) {
      if (contract.completionType === 'answer') {
        get().markPageAnswered(screenIndex);
      } else if (contract.completionType === 'game') {
        get().markPageGameCompleted(screenIndex);
      }
    }

    get().recalculateCompletion();
  },

  syncScores: (entries) => {
    const newEntries = new Map(get().scoreEntries);
    for (const entry of entries) {
      newEntries.set(entry.pageId, entry);
    }
    set({ scoreEntries: newEntries });
    get().recalculateCompletion();
  },

  markPageAnswered: (screenIndex) => {
    const { pageInteractions } = get();
    const newInteractions = new Map(pageInteractions);
    const existing = newInteractions.get(screenIndex) || createDefaultInteraction();
    newInteractions.set(screenIndex, { ...existing, hasAnswered: true });
    set({ pageInteractions: newInteractions });
    get().recalculateCompletion();
  },

  markPageGameCompleted: (screenIndex) => {
    const { pageInteractions } = get();
    const newInteractions = new Map(pageInteractions);
    const existing = newInteractions.get(screenIndex) || createDefaultInteraction();
    newInteractions.set(screenIndex, { ...existing, hasCompletedGame: true });
    set({ pageInteractions: newInteractions });
    get().recalculateCompletion();
  },

  markPageReflected: (screenIndex) => {
    const { pageInteractions } = get();
    const newInteractions = new Map(pageInteractions);
    const existing = newInteractions.get(screenIndex) || createDefaultInteraction();
    newInteractions.set(screenIndex, { ...existing, hasReflected: true });
    set({ pageInteractions: newInteractions });
    get().recalculateCompletion();
  },

  setLearnSubMode: (mode) => {
    // When switching to play mode, stop any active editing
    if (mode === 'play') {
      const { stopEditing } = require('@/store/canva-store').useCanvaStore.getState();
      if (stopEditing) stopEditing();
    }
    set({ learnSubMode: mode });
  },

  toggleLearnSubMode: () => {
    const current = get().learnSubMode;
    get().setLearnSubMode(current === 'edit' ? 'play' : 'edit');
  },

  showCompletion: () => set({ showCompletionModal: true }),
  dismissCompletion: () => set({ showCompletionModal: false }),
  dismissLockToast: () => set({ showLockToast: false }),

  resetSession: () => set({
    currentScreenIndex: 0,
    totalScreens: 0,
    visitedScreens: new Set<number>(),
    scoreEntries: new Map<string, ScoreEntry>(),
    pageInteractions: new Map<number, PageInteraction>(),
    pageContracts: new Map<number, PageRuntimeContract>(),
    templateTypes: [],
    isComplete: false,
    showCompletionModal: false,
    sessionInitialized: false,
    learnSubMode: 'edit' as 'edit' | 'play',
    navigationLockReason: '',
    showLockToast: false,
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
    const { totalScreens } = get();
    if (totalScreens === 0) return 0;

    const statuses = get().getAllPageStatuses();
    const completedCount = statuses.filter(s => s === 'completed').length;
    return Math.round((completedCount / totalScreens) * 100);
  },

  // ── Contract-aware computed ──

  getPageStatus: (screenIndex) => {
    const { visitedScreens, scoreEntries, pageInteractions, pageContracts, templateTypes } = get();
    const contract = pageContracts.get(screenIndex);
    if (!contract) {
      // Fallback: derive contract from templateTypes
      const tt = templateTypes[screenIndex] || 'custom';
      const fallbackContract = getPageContract(tt);
      return computePageStatus(fallbackContract, visitedScreens, scoreEntries, pageInteractions, screenIndex);
    }
    return computePageStatus(contract, visitedScreens, scoreEntries, pageInteractions, screenIndex);
  },

  canGoNext: () => {
    const { currentScreenIndex, totalScreens } = get();
    if (currentScreenIndex >= totalScreens - 1) {
      // On last page — "Selesai" is always available
      return { allowed: true, reason: '' };
    }

    const currentContract = get().getContract(currentScreenIndex);
    const currentStatus = get().getPageStatus(currentScreenIndex);
    return canNavigateNext(currentContract, currentStatus);
  },

  getContract: (screenIndex) => {
    const { pageContracts, templateTypes } = get();
    const contract = pageContracts.get(screenIndex);
    if (contract) return contract;
    const tt = templateTypes[screenIndex] || 'custom';
    return getPageContract(tt);
  },

  getAllPageStatuses: () => {
    const { totalScreens } = get();
    const statuses: PageCompletionStatus[] = [];
    for (let i = 0; i < totalScreens; i++) {
      statuses.push(get().getPageStatus(i));
    }
    return statuses;
  },

  recalculateCompletion: () => {
    const { totalScreens, isComplete } = get();
    if (totalScreens === 0) return;

    const statuses = get().getAllPageStatuses();

    // A learning session is "complete" when ALL pages are either
    // completed OR incomplete (not locked). Locked pages prevent completion.
    const allDone = statuses.every(s => s === 'completed');
    // Also consider it complete if all visited pages are done
    // and no locked pages remain (some pages are just incomplete, not locked)
    const noLockedPages = statuses.every(s => s !== 'locked');

    if (allDone && !isComplete) {
      set({ isComplete: true });
    } else if (!allDone && isComplete) {
      set({ isComplete: false });
    }

    // If all pages are completed, auto-trigger completion
    if (allDone && !get().showCompletionModal) {
      // Don't auto-show — let the user press "Selesai"
      // But mark isComplete so the "Selesai" button is highlighted
    }
  },
}));
