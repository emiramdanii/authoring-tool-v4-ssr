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

// ── Performance middleware (dev-only) ──────────────────────────
// Wraps `set` to track slow state updates and detect action storms.
import { trackAction } from './performance-middleware';

const IS_DEV = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

export const useCanvaStore = create<CanvaState>()(devtools(subscribeWithSelector((...a) => {
  const rawSet = a[0];
  const get = a[1];

  // Wrap set with performance tracking (dev-only)
  const set: typeof rawSet = IS_DEV
    ? (partial, replace) => {
        const start = performance.now();
        rawSet(partial, replace);
        const duration = performance.now() - start;

        // Infer action name from changed keys
        let actionName = 'unknown';
        if (typeof partial === 'function') {
          try {
            const result = partial(get());
            if (result && typeof result === 'object') {
              const keys = Object.keys(result as Record<string, unknown>);
              actionName = keys.length > 0 ? keys.slice(0, 3).join('+') : 'empty-update';
            }
          } catch { actionName = 'fn-update'; }
        } else if (partial && typeof partial === 'object') {
          const keys = Object.keys(partial as Record<string, unknown>);
          actionName = keys.length > 0 ? keys.slice(0, 3).join('+') : 'empty-update';
        }

        trackAction(actionName, duration);
      }
    : rawSet;

  // Create the api object with the tracked set for slices
  const api = [set, get, a[2]] as typeof a;

  return {
    // ── Initial state ────────────────────────────────────────────
    pages: [createPage('Halaman 1', 'custom')],
    currentPageIndex: 0,
    ratioId: '16:9',
    zoom: -1, // -1 = auto-fit (calculated by Stage on mount)
    fitZoom: 0.5, // Updated by Stage's ResizeObserver — initial fallback
    tool: 'select',
    leftTab: 'pages',
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
    ...createHistorySlice(...api),
    ...createPageSlice(...api),
    ...createElementSlice(...api),
    ...createUISlice(...api),
    ...createSessionSlice(...api),
    ...createBackgroundSlice(...api),
    ...createResetCanvasSlice(...api),
    ...createAutoGenerateSlice(...api),
    ...createSyncSlice(...api),
    ...createPersistenceSlice(...api),
    ...createSchemaPresetSlice(...api),
    ...createTeacherModeSlice(...api),
  };
}), { name: 'CanvaStore', enabled: process.env.NODE_ENV === 'development' }));

// NOTE: Auto-sync and edit-bus wiring have been moved to
// @/store/canva/init.ts to avoid circular dependency issues.
// The init code must be called once from the app entry point.
// See initCanvaStoreSubscriptions() in @/store/canva/init.
