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
import { createResetCanvasSlice } from './reset-canvas';
import { createAutoGenerateSlice } from './auto-generate';
import { createSyncSlice, startAutoSync } from './sync-slice';
import { createPersistenceSlice } from './persistence-slice';

export const useCanvaStore = create<CanvaState>()((...a) => {
  const set = a[0];
  const get = a[1];

  return {
    // ── Initial state ────────────────────────────────────────────
    pages: [createPage('Halaman 1', 'custom')],
    currentPageIndex: 0,
    ratioId: '9:16',
    zoom: 1.0,
    tool: 'select',
    leftTab: 'halaman',
    selectedElId: null,
    selectedElIds: [], // Phase 4: Multi-select
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
      return page.elements.find(e => e.id === state.selectedElId)
        || (page.overlayElements || []).find(e => e.id === state.selectedElId);
    },

    // ── Composed slices ─────────────────────────────────────────
    ...createHistorySlice(...a),
    ...createPageSlice(...a),
    ...createElementSlice(...a),
    ...createUISlice(...a),
    ...createBackgroundSlice(...a),
    ...createResetCanvasSlice(...a),
    ...createAutoGenerateSlice(...a),
    ...createSyncSlice(...a),
    ...createPersistenceSlice(...a),
  };
});

// ── Auto-sync: Wire authoring store changes → canva syncTemplateData ──
// When authoring data changes (kuis, modules, meta, etc.), automatically
// sync the canva store's templateData so canvas stays up-to-date.
if (typeof window !== 'undefined') {
  startAutoSync(() => useCanvaStore.getState().syncTemplateData());
}
