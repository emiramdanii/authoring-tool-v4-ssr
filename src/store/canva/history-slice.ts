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
  | 'undo' | 'redo' | 'canUndo' | 'canRedo' | '_pushHistory'
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
    // If PatchHistory has entries, apply inverse patches to the current
    // page's schema blocks. This is more granular than snapshot undo.
    if (patchHistory.canUndo()) {
      const inversePatches = patchHistory.undo();
      if (inversePatches && inversePatches.length > 0) {
        const { pages, currentPageIndex } = get();
        const page = pages[currentPageIndex];
        // FASE 3: Use page.schema directly (not templateData.schemaScreen)
        if (page?.schema) {
          const schema = page.schema;
          const blocks = schema.blocks as SchemaBlock[];
          try {
            const newBlocks = applyPatches(blocks, inversePatches) as SchemaBlock[];
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
      const forwardPatches = patchHistory.redo();
      if (forwardPatches && forwardPatches.length > 0) {
        const { pages, currentPageIndex } = get();
        const page = pages[currentPageIndex];
        // FASE 3: Use page.schema directly (not templateData.schemaScreen)
        if (page?.schema) {
          const schema = page.schema;
          const blocks = schema.blocks as SchemaBlock[];
          try {
            const newBlocks = applyPatches(blocks, forwardPatches) as SchemaBlock[];
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
});
