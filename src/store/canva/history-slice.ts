// ═══════════════════════════════════════════════════════════════
// CANVA STORE — History slice (undo/redo)
// ═══════════════════════════════════════════════════════════════

import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { Snapshot } from './types';
import { MAX_HISTORY } from './constants';

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

  canUndo: () => get()._historyIdx > 0,
  canRedo: () => get()._historyIdx < get()._history.length - 1,
});
