// ═══════════════════════════════════════════════════════════════════
// PATCH HISTORY — Immer-based undo/redo infrastructure
// ═══════════════════════════════════════════════════════════════════
// This module provides a patch-level history system that replaces the
// full-snapshot approach in the history slice. Instead of storing
// complete page snapshots, it stores inverse patches that can be
// applied to revert or re-apply changes.
//
// Benefits over snapshot-based undo/redo:
//   - Memory efficient: stores only what changed, not entire pages
//   - Faster: no structuredClone of the entire state on every edit
//   - Enables: patch-level collaboration, AI edit replay, edit debugging
//
// Architecture:
//   edit → produceWithPatches → [newState, patches, inversePatches]
//        → store patches in PatchHistory
//        → undo: apply inversePatch
//        → redo: apply forwardPatch
//
// This module is designed to integrate with the existing edit pipeline:
//   updateSchemaBlock → deepMergeBlock (immer) → emit patch event
//
// Usage:
//   const history = new PatchHistory(maxEntries);
//   history.push({ patches, inversePatches });
//   history.undo(); // → inversePatches
//   history.redo(); // → patches

import { applyPatches, type Patch, type Objectish } from 'immer';
import { logger } from '@/core/utils/logger';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

/** A single history entry containing forward and inverse patches */
export interface PatchHistoryEntry {
  /** Forward patches — apply to go forward (redo) */
  patches: Patch[];
  /** Inverse patches — apply to go backward (undo) */
  inversePatches: Patch[];
  /** Timestamp of the edit */
  timestamp: number;
  /** Optional description for debugging/UI */
  description?: string;
  /** Source of the edit */
  source?: 'user' | 'ai' | 'sync' | 'auto';
  /** Page index this patch applies to — CRITICAL for cross-page undo */
  pageIndex?: number;
  /** Block ID this patch targets — used for undo coalescing */
  blockId?: string;
}

/** The current state of the patch history */
export interface PatchHistoryState {
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Current position in history (0-based) */
  currentIndex: number;
  /** Total number of entries */
  totalEntries: number;
}

// ═══════════════════════════════════════════════════════════════════
// PATCH HISTORY CLASS
// ═══════════════════════════════════════════════════════════════════

export class PatchHistory {
  private entries: PatchHistoryEntry[] = [];
  private currentIndex: number = -1;
  private maxEntries: number;
  private listeners: Set<() => void> = new Set();

  constructor(maxEntries: number = 100) {
    this.maxEntries = maxEntries;
  }

  // ── Core Operations ──────────────────────────────────────────

  /**
   * Push a new history entry. Any entries after the current index
   * are discarded (standard undo/redo behavior).
   */
  push(entry: Omit<PatchHistoryEntry, 'timestamp'> & { timestamp?: number }): void {
    // Discard any redo history beyond current position
    this.entries = this.entries.slice(0, this.currentIndex + 1);

    // Add new entry
    this.entries.push({
      ...entry,
      timestamp: entry.timestamp ?? Date.now(),
    });

    // Enforce max entries
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    } else {
      this.currentIndex++;
    }

    this.notify();
  }

  /**
   * Get the inverse patches for undo.
   * Returns null if no undo is available.
   */
  undo(): Patch[] | null {
    if (!this.canUndo()) return null;
    const entry = this.entries[this.currentIndex];
    this.currentIndex--;
    this.notify();
    return entry.inversePatches;
  }

  /**
   * Get the forward patches for redo.
   * Returns null if no redo is available.
   */
  redo(): Patch[] | null {
    if (!this.canRedo()) return null;
    this.currentIndex++;
    const entry = this.entries[this.currentIndex];
    this.notify();
    return entry.patches;
  }

  /**
   * Apply undo to a state object using immer's applyPatches.
   * Returns the new state or null if undo not available.
   */
  undoState<T extends Objectish>(state: T): T | null {
    const inversePatches = this.undo();
    if (!inversePatches || inversePatches.length === 0) return null;
    return applyPatches(state, inversePatches) as T;
  }

  /**
   * Apply redo to a state object using immer's applyPatches.
   * Returns the new state or null if redo not available.
   */
  redoState<T extends Objectish>(state: T): T | null {
    const forwardPatches = this.redo();
    if (!forwardPatches || forwardPatches.length === 0) return null;
    return applyPatches(state, forwardPatches) as T;
  }

  // ── Query Methods ────────────────────────────────────────────

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.entries.length - 1;
  }

  getState(): PatchHistoryState {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      currentIndex: this.currentIndex,
      totalEntries: this.entries.length,
    };
  }

  /** Get recent history entries for debugging */
  getRecentEntries(limit: number = 10): PatchHistoryEntry[] {
    return this.entries.slice(-limit);
  }

  /** Get all history entries */
  getAllEntries(): PatchHistoryEntry[] {
    return this.entries;
  }

  /** Get a specific entry by index */
  getEntry(index: number): PatchHistoryEntry | undefined {
    return this.entries[index];
  }

  /**
   * Get the patches needed to jump from currentIndex to targetIndex.
   * Returns { patches, inversePatches } or null if target is invalid.
   *
   * To go BACKWARD (targetIndex < currentIndex): collect inversePatches from entries [targetIndex+1 .. currentIndex]
   * To go FORWARD  (targetIndex > currentIndex): collect forward patches from entries [currentIndex+1 .. targetIndex]
   */
  jumpTo(targetIndex: number): { patches: Patch[]; inversePatches: Patch[] } | null {
    if (targetIndex < -1 || targetIndex >= this.entries.length) return null;
    if (targetIndex === this.currentIndex) return null;

    const allPatches: Patch[] = [];
    const allInverse: Patch[] = [];

    if (targetIndex < this.currentIndex) {
      // Going backward: apply inverse patches in reverse order
      for (let i = this.currentIndex; i > targetIndex; i--) {
        allPatches.push(...this.entries[i].inversePatches);
        allInverse.push(...this.entries[i].patches);
      }
    } else {
      // Going forward: apply forward patches in order
      for (let i = this.currentIndex + 1; i <= targetIndex; i++) {
        allPatches.push(...this.entries[i].patches);
        allInverse.push(...this.entries[i].inversePatches);
      }
    }

    this.currentIndex = targetIndex;
    this.notify();
    return { patches: allPatches, inversePatches: allInverse };
  }

  // ── Batch Operations ─────────────────────────────────────────

  /**
   * Push a batch of patches as a single history entry.
   * Useful for multi-block edits that should undo/redo together.
   */
  pushBatch(entries: Array<Omit<PatchHistoryEntry, 'timestamp'> & { timestamp?: number }>, description?: string): void {
    const allPatches: Patch[] = [];
    const allInverse: Patch[] = [];
    let source: PatchHistoryEntry['source'] = 'user';

    for (const entry of entries) {
      allPatches.push(...entry.patches);
      allInverse.push(...entry.inversePatches);
      if (entry.source) source = entry.source;
    }

    this.push({
      patches: allPatches,
      inversePatches: allInverse,
      source,
      description: description ?? `Batch: ${entries.length} operations`,
    });
  }

  // ── Lifecycle ────────────────────────────────────────────────

  /** Clear all history */
  clear(): void {
    this.entries = [];
    this.currentIndex = -1;
    this.notify();
  }

  /** Subscribe to history changes */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Destroy the history and release all references */
  destroy(): void {
    this.entries = [];
    this.listeners.clear();
    this.currentIndex = -1;
  }

  /**
   * Replace a specific entry (used for undo coalescing).
   * Replaces the entry at the given index with new content.
   * This is ONLY safe for the last entry (current index).
   */
  replaceEntry(index: number, entry: Omit<PatchHistoryEntry, 'timestamp'> & { timestamp?: number }): void {
    if (index < 0 || index >= this.entries.length) return;
    // Only allow replacing the current (latest) entry — replacing
    // historical entries would break undo/redo consistency
    if (index !== this.currentIndex) return;

    this.entries[index] = {
      ...entry,
      timestamp: entry.timestamp ?? Date.now(),
    };
    this.notify();
  }

  /**
   * Get the pageIndex of the next undo entry.
   * Used by history-slice to apply patches to the correct page.
   */
  peekUndoPageIndex(): number | undefined {
    if (!this.canUndo()) return undefined;
    return this.entries[this.currentIndex]?.pageIndex;
  }

  /**
   * Get the pageIndex of the next redo entry.
   * Used by history-slice to apply patches to the correct page.
   */
  peekRedoPageIndex(): number | undefined {
    if (!this.canRedo()) return undefined;
    return this.entries[this.currentIndex + 1]?.pageIndex;
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        logger.error('PatchHistory', err);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// GLOBAL SINGLETON
// ═══════════════════════════════════════════════════════════════════
// Shared across the app. Can be imported and used directly.
// The existing editBus can be used to feed patches into this history.

export const patchHistory = new PatchHistory(100);

// ═══════════════════════════════════════════════════════════════════
// INTEGRATION HELPER
// ═══════════════════════════════════════════════════════════════════
// Connects the editBus to the patchHistory so that every edit
// automatically records inverse patches for undo/redo.
//
// Usage (call once at app init):
//   import { connectHistoryToEditBus } from '@/core/editor/patch-history';
//   connectHistoryToEditBus();

import { editBus } from './edit-bus';

/**
 * Connect PatchHistory to the EditBus so that schema block edits
 * automatically record immer patches for undo/redo.
 *
 * The editBus 'patch' event carries forward+inverse immer patches
 * when updateSchemaBlock uses produceWithPatches.
 *
 * Usage (call once at app init):
 *   const disconnect = connectHistoryToEditBus();
 *   // Later: disconnect() to stop recording
 */
// ── Undo Coalescing State ────────────────────────────────────
// Consecutive edits to the SAME block within COALESCE_WINDOW_MS
// are merged into a single undo entry. This prevents each
// keystroke from creating a separate undo step.
const COALESCE_WINDOW_MS = 400; // 400ms — matches typical typing cadence
let lastPushTime = 0;
let lastPushBlockId: string | null = null;
let coalesceTimer: ReturnType<typeof setTimeout> | null = null;

export function connectHistoryToEditBus(): () => void {
  return editBus.subscribe((event) => {
    if (event.type === 'patch' && event.patch._immerPatches) {
      const { _immerPatches } = event.patch;
      const blockId = event.patch.blockId;
      const pageIndex = _immerPatches.pageIndex;
      const now = Date.now();

      // ═══ UNDO COALESCING ══════════════════════════════════════
      // If this edit is to the SAME block as the previous edit AND
      // within the coalesce window, replace the last entry instead
      // of creating a new one. This means typing "hello" in a text
      // field produces ONE undo entry, not five.
      const timeDelta = now - lastPushTime;
      const sameBlock = blockId === lastPushBlockId && blockId != null;
      const shouldCoalesce = sameBlock && timeDelta < COALESCE_WINDOW_MS;

      if (shouldCoalesce) {
        // Replace the last entry with merged patches
        // Forward patches accumulate; inverse patches keep the OLDEST
        // (so undo reverts to the state BEFORE the coalesced group)
        const entries = patchHistory.getAllEntries();
        const lastIdx = entries.length - 1;
        if (lastIdx >= 0 && patchHistory.getEntry(lastIdx)) {
          const lastEntry = entries[lastIdx];
          // Merge: keep the oldest inverse, accumulate forward patches
          patchHistory.replaceEntry(lastIdx, {
            patches: [...lastEntry.patches, ..._immerPatches.forward],
            inversePatches: _immerPatches.inverse, // Keep the OLDEST inverse
            source: event.patch.source ?? 'user',
            description: lastEntry.description,
            timestamp: lastEntry.timestamp, // Keep original timestamp
            pageIndex,
            blockId,
          });
        }
      } else {
        // Normal push — new undo entry
        patchHistory.push({
          patches: _immerPatches.forward,
          inversePatches: _immerPatches.inverse,
          source: event.patch.source ?? 'user',
          description: `${event.patch.blockType}.${event.patch.blockId}`,
          pageIndex,
          blockId,
        });
      }

      // Track coalescing state
      lastPushTime = now;
      lastPushBlockId = blockId;

      // Reset coalescing after window expires (next edit starts fresh)
      if (coalesceTimer) clearTimeout(coalesceTimer);
      coalesceTimer = setTimeout(() => {
        lastPushBlockId = null;
        coalesceTimer = null;
      }, COALESCE_WINDOW_MS);
    }
  });
}
