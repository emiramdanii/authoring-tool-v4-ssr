// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Main store (composes all slices)
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { RATIOS } from '@/components/canva/types';
import type { CanvaState } from './types';
import { createPage } from './constants';
import { createHistorySlice } from './history-slice';
import { createPageSlice } from './page-slice';
import { createElementSlice } from './element-slice';
import { createUISlice } from './ui-slice';
import { createBackgroundSlice } from './background-slice';
import { createAutoRakitSlice } from './auto-rakit';
import { createPersistenceSlice } from './persistence-slice';

export const useCanvaStore = create<CanvaState>()((...a) => {
  const set = a[0];
  const get = a[1];

  return {
    // ── Initial state ────────────────────────────────────────────
    pages: [createPage('Halaman 1', 'custom')],
    currentPageIndex: 0,
    ratioId: '16:9',
    zoom: 1.0,
    tool: 'select',
    leftTab: 'rakit',
    selectedElId: null,
    rightPanelOpen: true,
    showGrid: false,
    gridSize: 5,
    snapEnabled: true,

    // ── Computed ─────────────────────────────────────────────────
    currentPage: () => get().pages[get().currentPageIndex],
    currentRatio: () => RATIOS.find(r => r.id === get().ratioId) || RATIOS[0],
    selectedElement: () => {
      const state = get();
      const page = state.pages[state.currentPageIndex];
      if (!page) return undefined;
      return page.elements.find(e => e.id === state.selectedElId);
    },

    // ── Composed slices ─────────────────────────────────────────
    ...createHistorySlice(...a),
    ...createPageSlice(...a),
    ...createElementSlice(...a),
    ...createUISlice(...a),
    ...createBackgroundSlice(...a),
    ...createAutoRakitSlice(...a),
    ...createPersistenceSlice(...a),
  };
});
