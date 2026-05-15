// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Main store (composes all slices)
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { RATIOS } from '@/components/canva/types';
import type { CanvaState } from './types';
import { createPage } from './constants';
import { createHistorySlice } from './history-slice';
import { createPageSlice } from './page-slice';
import { createElementSlice } from './element-slice';
import { createUISlice } from './ui-slice';
import { createSessionSlice } from './session-slice';
import { createBackgroundSlice } from './background-slice';
import { createResetCanvasSlice } from './reset-canvas';
import { createAutoGenerateSlice } from './auto-generate';
import { createSyncSlice } from './sync-slice';
import { createPersistenceSlice } from './persistence-slice';
import { createSchemaPresetSlice } from './schema-preset-slice';
import { createTeacherModeSlice } from './teacher-mode-slice';
// connectHistoryToEditBus moved to @/store/canva/init.ts

export const useCanvaStore = create<CanvaState>()(devtools(subscribeWithSelector((...a) => {
  const set = a[0];
  const get = a[1];

  return {
    // ── Initial state ────────────────────────────────────────────
    pages: [createPage('Halaman 1', 'custom')],
    currentPageIndex: 0,
    ratioId: '16:9',
    zoom: -1, // -1 = auto-fit (calculated by Stage on mount)
    fitZoom: 0.5, // Updated by Stage's ResizeObserver — initial fallback
    tool: 'select',
    leftTab: 'halaman',
    selectedElId: null,
    selectedElIds: [], // Phase 4: Multi-select
    selectedBlockId: null, // Schema block selection for editing overlay
    selectedBlockType: null,
    hoveredBlockId: null, // Hover context for blocks
    editingBlockId: null, // Inline editing context
    // NOTE: selectedBlockIds, sceneIndex, sceneTotal, canvasPreview, appMode,
    // _lastNudgeTime are now initialized in SessionSlice
    leftPanelOpen: true,
    rightPanelOpen: true,
    _saveStatus: 'unsaved',
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
    ...createSessionSlice(...a),
    ...createBackgroundSlice(...a),
    ...createResetCanvasSlice(...a),
    ...createAutoGenerateSlice(...a),
    ...createSyncSlice(...a),
    ...createPersistenceSlice(...a),
    ...createSchemaPresetSlice(...a),
    ...createTeacherModeSlice(...a),
  };
}), { name: 'CanvaStore', enabled: process.env.NODE_ENV === 'development' }));

// NOTE: Auto-sync and edit-bus wiring have been moved to
// @/store/canva/init.ts to avoid circular dependency issues.
// The init code must be called once from the app entry point.
// See initCanvaStoreSubscriptions() in @/store/canva/init.
