// ═══════════════════════════════════════════════════════════════════
// INTERACTION STORE — Isolated selection / hover / editing state
// ═══════════════════════════════════════════════════════════════════
// FASE 3: Separated from CanvaStore to eliminate rerender storms.
//
// WHY SEPARATE?
//   1. Selection changes (every click/hover) no longer trigger re-renders
//      in document-only subscribers (pages, ratioId)
//   2. Document mutations no longer trigger re-renders in interaction-only
//      subscribers (selection overlay, hover effects, edit panel)
//   3. Memoization becomes possible — components subscribe to only the
//      store they need, avoiding unnecessary re-computation
//   4. Undo/redo history is cleaner — only document mutations are tracked,
//      not ephemeral UI interactions
//
// ARCHITECTURE:
//   ┌───────────────────────────────────────────────┐
//   │  CanvaStore (DOCUMENT)                        │
//   │    pages · ratioId · history                  │
//   ├───────────────────────────────────────────────┤
//   │  InteractionStore (SESSION)  ← THIS FILE      │
//   │    selection · hover · editing                │
//   │    NEVER persisted · NEVER in undo history     │
//   └───────────────────────────────────────────────┘
//
// CROSS-STORE COMMUNICATION:
//   - CanvaStore actions call InteractionStore.getState()
//     when they need to clear selection (e.g., deleteBlock)
//   - InteractionStore never imports CanvaStore — it's pure
//   - Components can use both stores in the same render
//
// RULES:
//   1. This store is NEVER persisted to localStorage or DB
//   2. This store is NEVER included in undo/redo snapshots
//   3. This store is reset on project change and page reload
//   4. All fields are session-scoped — per-user, per-tab
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { editBus } from '@/core/editor/edit-bus';

// ── State Interface ──────────────────────────────────────────────

export interface InteractionState {
  // ── Block Selection (schema-driven pages) ──
  /** Currently selected block ID (null = no selection) */
  selectedBlockId: string | null;
  /** Type of the currently selected block */
  selectedBlockType: string | null;
  /** Multi-selected block IDs (shift+click) */
  selectedBlockIds: string[];

  // ── Element Selection (legacy pages) ──
  /** Legacy element selection (single) */
  selectedElId: string | null;
  /** Legacy element multi-selection */
  selectedElIds: string[];

  // ── Hover ──
  /** Block under cursor — hover effects only */
  hoveredBlockId: string | null;

  // ── Inline Editing ──
  /** Block being inline-edited (double-click) */
  editingBlockId: string | null;

  // ── Actions: Block Selection ──
  /**
   * Select a schema block. Mutual exclusion with element selection.
   * - blockId=null → clear all selection
   * - addToSelection=true → toggle in multi-select (shift+click)
   * - Otherwise → single select (replace)
   */
  selectBlock: (blockId: string | null, blockType?: string | null, addToSelection?: boolean) => void;
  /** Set hover context for a block */
  hoverBlock: (blockId: string | null) => void;
  /** Enter inline editing mode for a block */
  startEditing: (blockId: string) => void;
  /** Exit inline editing mode */
  stopEditing: () => void;

  // ── Actions: Element Selection (legacy) ──
  /** Select a legacy element */
  selectElement: (elId: string | null) => void;
  /** Toggle element in multi-select */
  toggleElementSelection: (elId: string) => void;
  /** Select all elements on current page (requires external page data) */
  selectAllElements: (allElIds: string[]) => void;
  /** Clear only element selection */
  clearSelection: () => void;

  // ── Actions: Universal ──
  /** Clear ALL selection state (blocks + elements + editing) */
  clearAllSelections: () => void;
  /** Clear only block selection */
  clearBlockSelection: () => void;
}

// ── Store Creation ───────────────────────────────────────────────

export const useInteractionStore = create<InteractionState>()(
  devtools(
    (set, get) => ({
      // ── Initial State ──
      selectedBlockId: null,
      selectedBlockType: null,
      selectedBlockIds: [],
      selectedElId: null,
      selectedElIds: [],
      hoveredBlockId: null,
      editingBlockId: null,

      // ── Block Selection ──────────────────────────────────────
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

      // ── Hover ────────────────────────────────────────────────
      hoverBlock: (blockId) => {
        editBus.emit({ type: 'hover', blockId: blockId ?? null });
        set({ hoveredBlockId: blockId ?? null });
      },

      // ── Inline Editing ──────────────────────────────────────
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

      // ── Element Selection (legacy) ──────────────────────────
      selectElement: (elId) => set({
        selectedElId: elId,
        selectedElIds: elId ? [elId] : [],
        // Clear block selection when selecting element (mutual exclusion)
        selectedBlockId: null,
        selectedBlockType: null,
        selectedBlockIds: [],
        editingBlockId: null,
      }),

      toggleElementSelection: (elId) => {
        const { selectedElIds, selectedElId } = get();
        if (selectedElIds.includes(elId)) {
          const newIds = selectedElIds.filter(id => id !== elId);
          set({
            selectedElIds: newIds,
            selectedElId: newIds.length > 0 ? newIds[0] : null,
          });
        } else {
          const newIds = [...selectedElIds, elId];
          set({
            selectedElIds: newIds,
            selectedElId: elId,
            // Clear block selection when selecting elements
            selectedBlockId: null,
            selectedBlockType: null,
            selectedBlockIds: [],
          });
        }
      },

      selectAllElements: (allElIds) => set({
        selectedElIds: allElIds,
        selectedElId: allElIds.length > 0 ? allElIds[0] : null,
        // Clear block selection when selecting elements
        selectedBlockId: null,
        selectedBlockType: null,
        selectedBlockIds: [],
      }),

      clearSelection: () => set({
        selectedElIds: [],
        selectedElId: null,
      }),

      // ── Universal ────────────────────────────────────────────
      clearAllSelections: () => set({
        selectedBlockId: null,
        selectedBlockType: null,
        selectedBlockIds: [],
        selectedElId: null,
        selectedElIds: [],
        hoveredBlockId: null,
        editingBlockId: null,
      }),

      clearBlockSelection: () => set({
        selectedBlockId: null,
        selectedBlockType: null,
        selectedBlockIds: [],
        editingBlockId: null,
      }),
    }),
    { name: 'InteractionStore', enabled: typeof process !== 'undefined' && process.env.NODE_ENV === 'development' }
  )
);

// ═══ DEBUG BRIDGE ─══════════════════════════════════════════════
if (typeof window !== 'undefined') {
  (window as any).__useInteractionStore = useInteractionStore;
}
