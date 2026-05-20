// ═══════════════════════════════════════════════════════════════
// CANVA STORE — History slice (undo/redo)
// ═══════════════════════════════════════════════════════════════
// Hybrid undo/redo system:
//   - Snapshot-based: for legacy CanvaElement operations (structuredClone)
//   - Patch-based: for SchemaBlock operations via PatchHistory (immer patches)
//
// The patch-based system is more memory-efficient and enables:
//   - Fine-grained undo at the block property level
//   - Edit history debugging and replay
//   - Future: collaboration sync via patches
//
// Both systems coexist. SchemaBlock edits record patches via the
// editBus → PatchHistory pipeline, while legacy edits use snapshots.
//
// [G.4] Added: getHistorySize() and trimHistory() for memory management.
// History queue is now explicitly capped and can be trimmed when
// total snapshot memory exceeds 5MB estimated.

import { applyPatches } from 'immer';
import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { Snapshot } from './types';
import { MAX_HISTORY } from './constants';
import { patchHistory } from '@/core/editor/patch-history';
import type { SchemaBlock } from '@/core/schema/types';
import type { CanvaPage } from '@/components/canva/types';
import { showUndoRedoToast } from '@/components/shared/StatusToast';
import { getBlockDefinition } from '@/core/registry/SceneRegistry';
import { teacherTerm } from '@/core/i18n/teacher-terminology';
import { logger } from '@/core/utils/logger';

export type HistorySlice = Pick<
  CanvaState,
  | '_history' | '_historyIdx' | '_skipHistory'
  | 'undo' | 'redo' | 'canUndo' | 'canRedo' | '_pushHistory' | 'timeTravel'
>;

// ── Descriptive undo/redo toast messages ─────────────────────────
// The patch history entries have descriptions like "hero-block.abc123"
// We extract the block type and convert to teacher-friendly labels.

function formatUndoMessage(description?: string): string {
  if (!description) return 'Kembalikan';
  const blockType = description.split('.')[0];
  const def = getBlockDefinition(blockType);
  if (def) {
    const name = teacherTerm(def.name, true);
    return `Kembalikan · ${name}`;
  }
  return `Kembalikan`;
}

function formatRedoMessage(description?: string): string {
  if (!description) return 'Ulangi';
  const blockType = description.split('.')[0];
  const def = getBlockDefinition(blockType);
  if (def) {
    const name = teacherTerm(def.name, true);
    return `Ulangi · ${name}`;
  }
  return `Ulangi`;
}

// ── [G.4] Memory estimation constants ──────────────────────────
/** Maximum estimated total history size in bytes before trimming */
const MAX_HISTORY_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Estimate the byte size of a snapshot by serializing to JSON.
 * This is expensive, so it should only be called periodically.
 */
function estimateSnapshotBytes(snapshot: Snapshot): number {
  try {
    return new Blob([JSON.stringify(snapshot)]).size;
  } catch {
    // Fallback: rough estimate based on page count
    return snapshot.pages.length * 10000; // ~10KB per page as rough guess
  }
}

/**
 * [G.4] Estimate total memory used by the history queue.
 * Iterates all snapshots and estimates their serialized size.
 */
export function getHistorySize(history: Snapshot[]): number {
  let totalBytes = 0;
  for (const snapshot of history) {
    totalBytes += estimateSnapshotBytes(snapshot);
  }
  return totalBytes;
}

/**
 * [G.4] Trim history queue if total estimated size exceeds MAX_HISTORY_BYTES.
 * Drops oldest entries first, keeping at least 5 entries so undo still works.
 * Returns the trimmed history array.
 */
export function trimHistory(history: Snapshot[], historyIdx: number): { history: Snapshot[]; historyIdx: number } {
  const totalBytes = getHistorySize(history);
  if (totalBytes <= MAX_HISTORY_BYTES) {
    return { history, historyIdx };
  }

  // Drop oldest entries until we're under the limit, keeping at least 5
  let newHistory = [...history];
  let newIdx = historyIdx;
  const minEntries = 5;

  while (newHistory.length > minEntries && getHistorySize(newHistory) > MAX_HISTORY_BYTES * 0.7) {
    newHistory.shift();
    newIdx = Math.max(-1, newIdx - 1);
  }

  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    const newBytes = getHistorySize(newHistory);
    console.log(
      `[G.4] Trimmed history: ${history.length} → ${newHistory.length} entries, ` +
      `${(totalBytes / 1048576).toFixed(1)}MB → ${(newBytes / 1048576).toFixed(1)}MB`
    );
  }

  return { history: newHistory, historyIdx: newIdx };
}

export const createHistorySlice: StateCreator<CanvaState, [], [], HistorySlice> = (_set, get) => ({
  _history: [],
  _historyIdx: -1,
  _skipHistory: false,

  _pushHistory: () => {
    const { pages, currentPageIndex, ratioId, _history, _historyIdx, _skipHistory } = get();
    if (_skipHistory) return;
    // FIX: Wrap structuredClone in try-catch with JSON fallback.
    // structuredClone can throw on non-cloneable values, which would
    // silently kill the entire _pushHistory operation.
    let snapshotPages: CanvaPage[];
    try {
      snapshotPages = structuredClone(pages);
    } catch {
      snapshotPages = JSON.parse(JSON.stringify(pages));
    }
    const snapshot: Snapshot = { pages: snapshotPages, currentPageIndex, ratioId };
    const newHistory = _history.slice(0, _historyIdx + 1);
    newHistory.push(snapshot);

    // [G.4] Ensure history is capped at MAX_HISTORY
    if (newHistory.length > MAX_HISTORY) {
      // Drop the oldest entry — this dereferences the snapshot
      // allowing GC to reclaim the structuredClone'd pages
      newHistory.shift();
    }

    // [G.4] Periodic memory check: trim if total history exceeds 5MB
    // Only check every 10 pushes to avoid expensive estimation on every edit
    if (newHistory.length > 0 && newHistory.length % 10 === 0) {
      const trimmed = trimHistory(newHistory, newHistory.length - 1);
      _set({ _history: trimmed.history, _historyIdx: trimmed.historyIdx });
    } else {
      _set({ _history: newHistory, _historyIdx: newHistory.length - 1 });
    }
  },

  undo: () => {
    // ═══ PRIORITY 1: Patch-based undo (SchemaBlock edits) ═══
    // If PatchHistory has entries, apply inverse patches to the CORRECT
    // page's schema blocks (cross-page undo fix).
    if (patchHistory.canUndo()) {
      // Peek at the pageIndex BEFORE consuming the entry
      const targetPageIndex = patchHistory.peekUndoPageIndex();
      const undoDescription = patchHistory.peekUndoDescription(); // Capture before undo consumes
      const inversePatches = patchHistory.undo();
      if (inversePatches && inversePatches.length > 0) {
        const { pages, currentPageIndex } = get();
        // Use the patch's pageIndex if available, otherwise fall back to current page
        // This fixes the cross-page undo bug where patches from page 0
        // were being applied to page 2 (wrong page).
        const pageIndex = targetPageIndex ?? currentPageIndex;
        const page = pages[pageIndex];
        if (page?.schema) {
          const schema = page.schema;
          const blocks = schema.blocks as SchemaBlock[];
          try {
            const newBlocks = applyPatches(blocks, inversePatches) as SchemaBlock[];
            const newPages = [...pages];
            newPages[pageIndex] = {
              ...page,
              schema: { ...schema, blocks: newBlocks },
            };
            _set({
              pages: newPages,
              // Navigate to the target page so the user sees the undo result
              currentPageIndex: pageIndex,
              selectedBlockId: null,
              selectedBlockType: null,
              editingBlockId: null,
              selectedBlockIds: [],
            });
            showUndoRedoToast(formatUndoMessage(undoDescription));
            return;
          } catch {
            // Patch application failed (state diverged) — fall through to snapshot undo
            logger.warn('History', 'Patch-based undo failed, falling back to snapshot undo');
          }
        }
      }
    }

    // ═══ FALLBACK: Snapshot-based undo (legacy) ═══
    const { _history, _historyIdx } = get();
    if (_historyIdx <= 0) return;
    const prev = _history[_historyIdx - 1];
    if (!prev) return;
    _set({
      // FIX: structuredClone with JSON fallback
      ...((() => { try { return structuredClone(prev); } catch { return JSON.parse(JSON.stringify(prev)); } })()),
      _historyIdx: _historyIdx - 1,
      _skipHistory: true,
      selectedElId: null,
      selectedElIds: [],
      selectedBlockId: null,
      selectedBlockType: null,
      selectedBlockIds: [],
      editingBlockId: null,
    });
    _set({ _skipHistory: false });
    showUndoRedoToast('Kembalikan'); // Snapshot fallback
  },

  redo: () => {
    // ═══ PRIORITY 1: Patch-based redo (SchemaBlock edits) ═══
    if (patchHistory.canRedo()) {
      // Peek at the pageIndex BEFORE consuming the entry
      const targetPageIndex = patchHistory.peekRedoPageIndex();
      const redoDescription = patchHistory.peekRedoDescription(); // Capture before redo consumes
      const forwardPatches = patchHistory.redo();
      if (forwardPatches && forwardPatches.length > 0) {
        const { pages, currentPageIndex } = get();
        // Use the patch's pageIndex if available (cross-page redo fix)
        const pageIndex = targetPageIndex ?? currentPageIndex;
        const page = pages[pageIndex];
        if (page?.schema) {
          const schema = page.schema;
          const blocks = schema.blocks as SchemaBlock[];
          try {
            const newBlocks = applyPatches(blocks, forwardPatches) as SchemaBlock[];
            const newPages = [...pages];
            newPages[pageIndex] = {
              ...page,
              schema: { ...schema, blocks: newBlocks },
            };
            _set({
              pages: newPages,
              // Navigate to the target page so the user sees the redo result
              currentPageIndex: pageIndex,
              selectedBlockId: null,
              selectedBlockType: null,
              editingBlockId: null,
              selectedBlockIds: [],
            });
            showUndoRedoToast(formatRedoMessage(redoDescription));
            return;
          } catch {
            logger.warn('History', 'Patch-based redo failed, falling back to snapshot redo');
          }
        }
      }
    }

    // ═══ FALLBACK: Snapshot-based redo (legacy) ═══
    const { _history, _historyIdx } = get();
    if (_historyIdx >= _history.length - 1) return;
    const next = _history[_historyIdx + 1];
    if (!next) return;
    _set({
      // FIX: structuredClone with JSON fallback
      ...((() => { try { return structuredClone(next); } catch { return JSON.parse(JSON.stringify(next)); } })()),
      _historyIdx: _historyIdx + 1,
      _skipHistory: true,
      selectedElId: null,
    });
    _set({ _skipHistory: false });
    showUndoRedoToast('Ulangi'); // Snapshot fallback
  },

  canUndo: () => get()._historyIdx > 0 || patchHistory.canUndo(),
  canRedo: () => get()._historyIdx < get()._history.length - 1 || patchHistory.canRedo(),

  timeTravel: (targetIndex: number) => {
    const result = patchHistory.jumpTo(targetIndex);
    if (!result || result.patches.length === 0) return;

    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page?.schema) return;

    const schema = page.schema;
    const blocks = schema.blocks as SchemaBlock[];
    try {
      const newBlocks = applyPatches(blocks, result.patches) as SchemaBlock[];
      const newPages = [...pages];
      newPages[currentPageIndex] = {
        ...page,
        schema: { ...schema, blocks: newBlocks },
      };
      _set({
        pages: newPages,
        selectedBlockId: null,
        selectedBlockType: null,
        editingBlockId: null,
        selectedBlockIds: [],
      });
    } catch {
      logger.warn('History', 'Time-travel patch application failed — state may have diverged');
    }
  },
});
