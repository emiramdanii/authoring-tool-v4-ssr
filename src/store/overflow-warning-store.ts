// ═══════════════════════════════════════════════════════════════════
// OVERFLOW WARNING STORE — Overflow notifications + per-page status
// ═══════════════════════════════════════════════════════════════════
// Phase 4: Surfaces overflow warnings to the UI.
//
// When applyGuidedSchemaPatch() detects overflow, it writes here.
// Konten tabs and other components subscribe to show warnings.
//
// Per-page overflow status enables:
//   - Red dots on overflowing pages in the scene list
//   - Export warnings for pages with overflow
//   - Batch overflow detection after auto-generate
//
// This is intentionally a SEPARATE store from CanvaStore to avoid
// coupling and unnecessary re-renders (overflow state changes rarely).
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
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

/** Per-page overflow status entry */
export interface PageOverflowStatus {
  /** Whether this page has overflow */
  hasOverflow: boolean;
  /** Rich overflow details (null if no overflow) */
  details: OverflowCheckResult | null;
  /** When this status was last computed */
  lastChecked: number;
}

interface OverflowWarningState {
  /** The latest overflow warning (null if cleared) */
  lastWarning: OverflowWarning | null;
  /** Whether the warning banner should be visible */
  bannerVisible: boolean;
  /** Per-page overflow status map */
  pageOverflowStatus: Record<string, PageOverflowStatus>;
  /** Set a new overflow warning */
  setWarning: (warning: OverflowWarning) => void;
  /** Clear the warning (user dismissed) */
  clearWarning: () => void;
  /** Show the banner */
  showBanner: () => void;
  /** Hide the banner */
  hideBanner: () => void;
  /** Set overflow status for a specific page */
  setPageOverflowStatus: (pageId: string, status: PageOverflowStatus) => void;
  /** Clear overflow status for a specific page */
  clearPageOverflowStatus: (pageId: string) => void;
  /** Batch-set overflow status for multiple pages (used after auto-generate scan) */
  batchSetPageOverflowStatus: (statuses: Record<string, PageOverflowStatus>) => void;
  /** Clear all page overflow statuses */
  clearAllPageOverflowStatuses: () => void;
}

export const useOverflowWarningStore = create<OverflowWarningState>((set) => ({
  lastWarning: null,
  bannerVisible: false,
  pageOverflowStatus: {},

  setWarning: (warning) => set((state) => ({
    lastWarning: warning,
    bannerVisible: true,
    // Also update per-page status
    pageOverflowStatus: {
      ...state.pageOverflowStatus,
      [warning.pageId]: {
        hasOverflow: warning.details.overflowDetected,
        details: warning.details,
        lastChecked: warning.timestamp,
      },
    },
  })),

  clearWarning: () => set({
    lastWarning: null,
    bannerVisible: false,
  }),

  showBanner: () => set({ bannerVisible: true }),

  hideBanner: () => set({ bannerVisible: false }),

  setPageOverflowStatus: (pageId, status) => set((state) => ({
    pageOverflowStatus: {
      ...state.pageOverflowStatus,
      [pageId]: status,
    },
  })),

  clearPageOverflowStatus: (pageId) => set((state) => {
    const next = { ...state.pageOverflowStatus };
    delete next[pageId];
    return { pageOverflowStatus: next };
  }),

  batchSetPageOverflowStatus: (statuses) => set((state) => ({
    pageOverflowStatus: {
      ...state.pageOverflowStatus,
      ...statuses,
    },
  })),

  clearAllPageOverflowStatuses: () => set({ pageOverflowStatus: {} }),
}));
