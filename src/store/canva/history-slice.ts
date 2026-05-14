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

import { applyPatches } from 'immer';
import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { Snapshot } from './types';
import { MAX_HISTORY } from './constants';
import { patchHistory } from '@/core/editor/patch-history';
import type { SchemaBlock } from '@/core/schema/types';

export type HistorySlice = Pick<
  CanvaState,
  | '_history' | '_historyIdx' | '_skipHistory'
  | 'undo' | 'redo' | 'canUndo' | 'canRedo' | '_pushHistory' | 'timeTravel'
>;

export const createHistorySlice: StateCreator<CanvaState, [], [], HistorySlice> = (_set, get) => ({
  _history: [],
  _historyIdx: -1,
  _skipHistory: false,

  _pushHistory: () => {
    const { pages, currentPageIndex, ratioId, _history, _historyIdx, _skipHistory } = get();
    if (_skipHistory) return;
    const snapshot: Snapshot = { pages: structuredClone(pages), currentPageIndex, ratioId };
    const newHistory = _history.slice(0, _historyIdx + 1);
    newHistory.push(snapshot);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    _set({ _history: newHistory, _historyIdx: newHistory.length - 1 });
  },

  undo: () => {
    // ═══ PRIORITY 1: Patch-based undo (SchemaBlock edits) ═══
    // If PatchHistory has entries, apply inverse patches to the CORRECT
    // page's schema blocks (cross-page undo fix).
    if (patchHistory.canUndo()) {
      // Peek at the pageIndex BEFORE consuming the entry
      const targetPageIndex = patchHistory.peekUndoPageIndex();
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
            return;
          } catch {
            // Patch application failed (state diverged) — fall through to snapshot undo
            console.warn('[History] Patch-based undo failed, falling back to snapshot undo');
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
      ...structuredClone(prev),
      _historyIdx: _historyIdx - 1,
      _skipHistory: true,
      selectedElId: null,
    });
    _set({ _skipHistory: false });
  },

  redo: () => {
    // ═══ PRIORITY 1: Patch-based redo (SchemaBlock edits) ═══
    if (patchHistory.canRedo()) {
      // Peek at the pageIndex BEFORE consuming the entry
      const targetPageIndex = patchHistory.peekRedoPageIndex();
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
            return;
          } catch {
            console.warn('[History] Patch-based redo failed, falling back to snapshot redo');
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
      ...structuredClone(next),
      _historyIdx: _historyIdx + 1,
      _skipHistory: true,
      selectedElId: null,
    });
    _set({ _skipHistory: false });
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
      console.warn('[History] Time-travel patch application failed — state may have diverged');
    }
  },
});
