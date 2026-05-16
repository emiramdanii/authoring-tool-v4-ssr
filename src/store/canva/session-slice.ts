// ═══════════════════════════════════════════════════════════════════
// CANVA STORE — Session Interaction Slice
// ═══════════════════════════════════════════════════════════════════
// Groups ALL ephemeral UI interaction state that should NEVER
// be persisted to localStorage or the database.
//
// DESIGN PRINCIPLE:
//   DocumentState  =  pages, ratioId  (persisted, undoable, shareable)
//                     ↕ NEVER MIX ↕
//   SessionState   =  selection, hover, editing, scene nav, modes
//                     (ephemeral, per-session, discarded on reload)
//
// This slice is the Zustand-side counterpart of SessionInteractionState
// defined in @/core/schema/session-state.ts. The formal type there
// documents the INTENT; this slice provides the RUNTIME storage.
//
// WHY A SEPARATE SLICE?
//   1. Clarity — easy to see which fields are ephemeral
//   2. Purity — persistence-slice only saves {pages, ratioId}
//   3. Reset — session state can be cleared without touching document
//   4. Decomposition — reduces ui-slice.ts from 1911 lines
// ═══════════════════════════════════════════════════════════════════

import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { AppMode } from '@/components/canva/types';
import { editBus } from '@/core/editor/edit-bus';

// ── Slice Type ──────────────────────────────────────────────────

export type SessionSlice = Pick<
  CanvaState,
  // ── Block selection (single + multi) ──
  | 'selectBlock' | 'selectedBlockIds'
  // ── Block hover context ──
  | 'hoverBlock'
  // ── Inline editing context ──
  | 'startEditing' | 'stopEditing'
  // ── Scene navigation (multi-scene overflow) ──
  | 'sceneIndex' | 'sceneTotal' | 'setSceneState' | 'navigateScene'
  // ── View modes ──
  | 'canvasPreview' | 'toggleCanvasPreview'
  | 'appMode' | 'setAppMode'
  // ── Preview viewport ──
  | 'previewViewport' | 'setPreviewViewport'
  // ── Nudge debounce ──
  | '_lastNudgeTime'
  // ── Panels ──
  | 'toggleLeftPanel' | 'toggleRightPanel'
>;

// ── Helper: Clear all selections ────────────────────────────────
// Used when switching modes (preview/present) or toggling preview.
// Returns a partial state object that clears all selection state.

function clearAllSelections() {
  return {
    selectedBlockId: null as string | null,
    selectedBlockType: null as string | null,
    editingBlockId: null as string | null,
    selectedBlockIds: [] as string[],
    selectedElId: null as string | null,
    selectedElIds: [] as string[],
  };
}

// ── Slice Implementation ────────────────────────────────────────

export const createSessionSlice: StateCreator<CanvaState, [], [], SessionSlice> = (set, get) => ({
  // ── Initial state ──────────────────────────────────────────────
  selectedBlockIds: [],
  _lastNudgeTime: undefined,
  sceneIndex: 0,
  sceneTotal: 1,
  canvasPreview: false,
  appMode: 'edit' as AppMode,
  previewViewport: 'desktop' as 'desktop' | 'mobile',

  // ── Schema Block Selection ───────────────────────────────────
  // Central selection action — sets the editing context for a block.
  // Clears element selection when a block is selected (mutual exclusion).
  // Supports shift+click multi-select via addToSelection parameter.
  selectBlock: (blockId, blockType, addToSelection) => {
    editBus.emit({ type: 'select', blockId: blockId ?? null, blockType: blockType ?? null });

    if (!blockId) {
      // Clear all selection
      set({
        selectedBlockId: null,
        selectedBlockType: null,
        editingBlockId: null,
        selectedBlockIds: [],
        selectedElId: null,
        selectedElIds: [],
      });
      return;
    }

    if (addToSelection) {
      // Toggle in multi-select
      const current = get().selectedBlockIds;
      const isSelected = current.includes(blockId);

      if (isSelected) {
        // Deselect from multi-select
        const newIds = current.filter(id => id !== blockId);
        set({
          selectedBlockIds: newIds,
          selectedBlockId: newIds.length > 0 ? newIds[newIds.length - 1] : null,
          selectedBlockType: blockType ?? null,
          editingBlockId: null,
        });
      } else {
        // Add to multi-select
        const newIds = [...current, blockId];
        set({
          selectedBlockIds: newIds,
          selectedBlockId: blockId,
          selectedBlockType: blockType ?? null,
          editingBlockId: null,
        });
      }
    } else {
      // Single select (replace)
      set({
        selectedBlockId: blockId,
        selectedBlockType: blockType ?? null,
        editingBlockId: null,
        selectedBlockIds: [blockId],
        // When selecting a block, clear element selection to avoid confusion
        selectedElId: null,
        selectedElIds: [],
      });
    }
  },

  // ── Schema Block Hover Context ────────────────────────────────
  // Tracks which block the cursor is over — for hover effects,
  // layer panel highlighting, and future multi-select support.
  hoverBlock: (blockId) => {
    editBus.emit({ type: 'hover', blockId: blockId ?? null });
    set({ hoveredBlockId: blockId ?? null });
  },

  // ── Inline Editing Context ────────────────────────────────────
  // Double-click a text block → enter inline editing mode.
  // The editing overlay reads editingBlockId to show a floating editor.
  startEditing: (blockId) => {
    const blockType = get().selectedBlockType;
    editBus.emit({ type: 'edit-start', blockId, blockType: blockType ?? 'unknown' });
    set({ editingBlockId: blockId });
  },
  stopEditing: () => {
    const prevId = get().editingBlockId;
    if (prevId) editBus.emit({ type: 'edit-end', blockId: prevId });
    set({ editingBlockId: null });
  },

  // ── Scene Navigation (multi-scene overflow) ──────────────────
  // SchemaRenderer updates these when the scene plan changes.
  // Keyboard shortcuts (Ctrl+Arrow) and SceneNavigator call navigateScene().
  setSceneState: (index, total) => set({ sceneIndex: index, sceneTotal: total }),
  navigateScene: (index) => {
    const { sceneTotal } = get();
    const clamped = Math.max(0, Math.min(index, sceneTotal - 1));
    set({ sceneIndex: clamped });
  },

  // ── Canvas Preview Mode ────────────────────────────────────
  // Quick toggle to switch between editing (canvas) and preview mode.
  // In preview mode: no selection overlays, no compression badges,
  // no editing handles — content shown as students will see it.
  toggleCanvasPreview: () => set(s => ({
    canvasPreview: !s.canvasPreview,
    // When entering preview, clear selection to avoid editing state lingering
    ...(s.canvasPreview ? {} : clearAllSelections()),
  })),

  // ── App Mode (4-mode architecture) ──────────────────────────
  // Controls the overall application mode: edit, preview, present, export.
  // When switching to preview/present, all selections are cleared
  // to prevent editing state from leaking into non-edit modes.
  // The existing canvasPreview toggle remains for backward compat —
  // setAppMode('preview') is the canonical way going forward.
  setAppMode: (mode) => {
    if (mode === 'preview' || mode === 'present') {
      set({
        appMode: mode,
        ...clearAllSelections(),
      });
    } else {
      set({ appMode: mode });
    }
  },

  // ── Preview Viewport ────────────────────────────────────────
  setPreviewViewport: (v: 'desktop' | 'mobile') => set({ previewViewport: v }),

  // ── Panels ──────────────────────────────────────────────────
  toggleLeftPanel: () => set(s => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set(s => ({ rightPanelOpen: !s.rightPanelOpen })),
});
