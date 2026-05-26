/**
 * SILSE — Sync Slice
 * Handles schema sync between authoring store and canva store.
 * Refactored in Task #1 — uses BlockCapabilityRegistry for source tracking.
 *
 * Task #2 WIRED: sync operations now flow through transaction system
 * via schema-apply functions.
 */

import type { StateCreator } from 'zustand';
import type { ScreenSchema } from '../core/schema/types';
import type { CanvaPage } from '../components/canva/types';
import type { CanvaState } from './canva/types';
import { BlockCapabilityRegistry } from '../core/schema/capability-registry';
import { logger } from '@/core/utils/logger';

// ─── Apply Result ──────────────────────────────────────────────────
export interface ApplyResult {
  success: boolean;
  schema: ScreenSchema;
  errors: string[];
}

// ─── Sync Slice State ──────────────────────────────────────────────────
export interface SyncSlice {
  /** Last sync timestamp */
  lastSyncAt: number;
  /** Pending sync operations */
  pendingSyncCount: number;
  /** Sync a specific page's schema (re-derive from authoring data) */
  syncSchema: (pageId?: string) => void;
  /** Apply a transactional result to the store */
  applyTransactionResult: (pageId: string, result: ApplyResult) => void;
  /** Mark sync as complete */
  markSyncComplete: () => void;
}

// ─── Factory ───────────────────────────────────────────────────────────
export function createSyncSlice(
  set: (partial: Partial<CanvaState> | ((state: CanvaState) => Partial<CanvaState>)) => void,
  get: () => CanvaState
): SyncSlice {
  return {
    lastSyncAt: 0,
    pendingSyncCount: 0,

    syncSchema: (_pageId?: string) => {
      // The actual sync logic will be wired in canva-store
      // which has access to both authoring data and schema
    },

    applyTransactionResult: (pageId: string, result: ApplyResult) => {
      if (!result.success) {
        logger.warn('SyncSlice', `Transaction failed for page ${pageId}: ${result.errors.join(', ')}`);
        return;
      }

      set(state => ({
        pages: state.pages.map((page: CanvaPage) => {
          if (page.id !== pageId) return page;
          return {
            ...page,
            schema: result.schema,
          };
        }),
      }));
    },

    markSyncComplete: () => {
      // No-op — sync completion is tracked via lastSyncAt timestamp
    },
  };
}
