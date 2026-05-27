// ═══════════════════════════════════════════════════════════════════
// OVERFLOW WARNING STORE — Lightweight store for overflow notifications
// ═══════════════════════════════════════════════════════════════════
// Phase 4: Surfaces overflow warnings to the UI.
//
// When applyGuidedSchemaPatch() detects overflow, it writes here.
// Konten tabs and other components subscribe to show warnings.
//
// This is intentionally a SEPARATE store from CanvaStore to avoid
// coupling and unnecessary re-renders (overflow state changes rarely).
// ═══════════════════════════════════════════════════════════════════

import { createStore } from 'zustand/vanilla';
import type { OverflowCheckResult } from '@/core/schema/guided-patch';

export interface OverflowWarning {
  /** The page ID where overflow was detected */
  pageId: string;
  /** The block ID that was patched */
  blockId: string;
  /** Source of the edit that caused overflow */
  source: string;
  /** Rich overflow details */
  details: OverflowCheckResult;
  /** Timestamp of the warning */
  timestamp: number;
}

interface OverflowWarningState {
  /** The latest overflow warning (null if cleared) */
  lastWarning: OverflowWarning | null;
  /** Whether the warning banner should be visible */
  bannerVisible: boolean;
  /** Set a new overflow warning */
  setWarning: (warning: OverflowWarning) => void;
  /** Clear the warning (user dismissed) */
  clearWarning: () => void;
  /** Show the banner */
  showBanner: () => void;
  /** Hide the banner */
  hideBanner: () => void;
}

export const useOverflowWarningStore = createStore<OverflowWarningState>((set) => ({
  lastWarning: null,
  bannerVisible: false,

  setWarning: (warning) => set({
    lastWarning: warning,
    bannerVisible: true,
  }),

  clearWarning: () => set({
    lastWarning: null,
    bannerVisible: false,
  }),

  showBanner: () => set({ bannerVisible: true }),

  hideBanner: () => set({ bannerVisible: false }),
}));
