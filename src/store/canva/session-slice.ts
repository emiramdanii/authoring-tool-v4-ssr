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
import type { EduDisplayMode } from '@/core/edu/education-typography';
import { editBus } from '@/core/editor/edit-bus';
// Sprint 8.2S-2-Patch — cross-store orchestrator for mode lifecycle.
// Fixes M-001 (score leak), M-002 (learnSubMode leak), M-004 (selection
// leak into Learn), M-005 (selection leak into Export). See
// docs/MODE_LIFECYCLE_CONTRACT.md.
import { resetCrossStoreStateForMode } from './mode-orchestrator';

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
  // ── Educational display mode (classroom/projector/print/student) ──
  | 'displayMode' | 'setDisplayMode'
  // ── Preview viewport ──
  | 'previewViewport' | 'setPreviewViewport'
  // ── Nudge debounce ──
  | '_lastNudgeTime'
  // ── Panels ──
  | 'toggleLeftPanel' | 'toggleRightPanel'
>;

// ── Helper: Clear all selections ────────────────────────────────
// Used when switching modes (preview/present/learn/export) or toggling
// preview. Returns a partial state object that clears all selection
// state.
//
// Sprint 8.2S-2-Patch (M-006 fix): previously `hoveredBlockId` was
// NOT included in the returned object, causing it to leak across
// mode switches. Now it's cleared alongside the other selection
// fields. See KNOWN_ISSUES.md M-006.

function clearAllSelections() {
  return {
    selectedBlockId: null as string | null,
    selectedBlockType: null as string | null,
    editingBlockId: null as string | null,
    selectedBlockIds: [] as string[],
    hoveredBlockId: null as string | null,
    selectedElId: null as string | null,
    selectedElIds: [] as string[],
    activeTabId: null as string | null,
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
  displayMode: 'classroom' as EduDisplayMode,

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
    // FIX: Force-blur any active contentEditable before clearing state.
    // This ensures InlineEditableText's onBlur → onSave fires first,
    // preventing the race condition where clearing editingBlockId causes
    // the component to unmount before it can save the pending edit.
    if (typeof document !== 'undefined') {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && activeEl.contentEditable === 'true') {
        activeEl.blur();
      }
    }
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
  // Controls the overall application mode: edit, preview, present, export, learn.
  //
  // Sprint 8.2S-2-Patch (Senior Review fixes):
  //   - clearAllSelections() now called for ALL non-edit modes
  //     (preview/present/learn/export). Previously only preview/present
  //     cleared — fixes M-004 (Learn leak) and M-005 (Export leak).
  //   - resetCrossStoreStateForMode(nextMode) called after selection
  //     clear — coordinates cross-store resets:
  //       Edit/Export/Present → reset interactive scores (fixes M-001)
  //       Learn → reset learnSubMode to 'play' (fixes M-002)
  //   - See docs/MODE_LIFECYCLE_CONTRACT.md for the full transition table.
  setAppMode: (mode) => {
    // ── Save pending inline edit before mode switch ──
    // Same fix as goPage: blur the active contentEditable element
    // so InlineTextEditor.onBlur fires and saves the edit.
    const activeEl = document.activeElement;
    if (activeEl && (activeEl as HTMLElement).isContentEditable) {
      (activeEl as HTMLElement).blur();
    }

    if (mode === 'edit') {
      // Entering Edit — no selection clear (edit mode allows selection).
      // But DO reset interactive runtime so old scores don't leak.
      set({ appMode: mode });
      resetCrossStoreStateForMode(mode);
    } else {
      // Entering any non-edit mode — clear all selection state.
      // This includes Preview, Present, Learn, Export.
      set({
        appMode: mode,
        ...clearAllSelections(),
      });
      // Coordinate cross-store resets (scores, learnSubMode, etc).
      resetCrossStoreStateForMode(mode);
    }
  },

  // ── Educational Display Mode ────────────────────────────────
  // Controls how content is rendered: font sizes, backgrounds, colors.
  // classroom = white bg, standard sizes (default)
  // projector = warm bg, max sizes for projection (1.15x)
  // print = B&W friendly, slightly smaller (0.95x)
  // student = laptop/HP, slightly smaller (0.9x)
  // This is ephemeral session state — not persisted.
  setDisplayMode: (mode: EduDisplayMode) => set({ displayMode: mode }),

  // ── Preview Viewport ────────────────────────────────────────
  setPreviewViewport: (v: 'desktop' | 'mobile') => set({ previewViewport: v }),

  // ── Panels ──────────────────────────────────────────────────
  toggleLeftPanel: () => set(s => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set(s => ({ rightPanelOpen: !s.rightPanelOpen })),
});
