'use client';

import { useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';

interface UseStageKeyboardParams {
  selectedElIds: string[];
  selectedBlockId: string | null;
  selectedBlockIds: string[];
  editingBlockId: string | null;
  selectAllElements: () => void;
  deleteSelectedElements: () => void;
  clearSelection: () => void;
  selectBlock: (id: string | null) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  moveBlockUp: (id: string) => void;
  moveBlockDown: (id: string) => void;
  stopEditing: () => void;
  copySchemaBlock: (id: string) => void;
  pasteSchemaBlock: () => void;
  nudgeSchemaBlocks: (dx: number, dy: number) => void;
  deleteSchemaBlocks: (ids: string[]) => void;
  // NOTE: undo/redo removed — handled by CanvaBuilder's keyboardManager
  // to avoid double-firing (both systems listen on keydown).
}

/**
 * Keyboard shortcut handler for the Stage component.
 *
 * ARCHITECTURE NOTE:
 *   Undo/Redo (Ctrl+Z/Y/Shift+Z) and Escape are handled by
 *   CanvaBuilder's useKeyboardShortcuts registry (scope: 'canvas').
 *   They are NOT handled here to avoid double-firing, because
 *   both systems listen on `window.addEventListener('keydown')`.
 *
 *   This hook handles ONLY schema-block-specific shortcuts that
 *   aren't covered by the registry:
 *   - Arrow key nudge (schema blocks)
 *   - Delete/Backspace (schema blocks)
 *   - Ctrl+D duplicate (schema blocks)
 *   - Ctrl+C copy (schema blocks)
 *   - Alt+Arrow reorder (schema blocks)
 *   - Ctrl+V paste (schema clipboard)
 *   - Ctrl+A select all elements
 *   - Escape from contentEditable editing
 */
export function useStageKeyboard({
  selectedElIds,
  selectedBlockId,
  selectedBlockIds,
  editingBlockId,
  selectAllElements,
  deleteSelectedElements,
  clearSelection,
  selectBlock,
  deleteBlock,
  duplicateBlock,
  moveBlockUp,
  moveBlockDown,
  stopEditing,
  copySchemaBlock,
  pasteSchemaBlock,
  nudgeSchemaBlocks,
  deleteSchemaBlocks,
}: UseStageKeyboardParams) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Allow typing in contentEditable (inline editing), inputs, textareas
      if (target.contentEditable === 'true' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // But still handle Escape in contentEditable to exit editing
        if (e.key === 'Escape' && target.contentEditable === 'true') {
          e.preventDefault();
          stopEditing();
          (target as HTMLElement).blur();
        }
        return;
      }

      // ── NOTE: Undo/Redo (Ctrl+Z/Y/Shift+Z) are handled by
      // CanvaBuilder's useKeyboardShortcuts registry (scope: 'canvas').
      // They are NOT handled here to avoid double-firing.
      // See: CanvaBuilder.tsx lines 78-121

      // ── Schema block shortcuts (when a block is selected) ─────
      if (selectedBlockId) {
        // Arrow keys — nudge selected block(s)
        if (e.key === 'ArrowUp' && !e.altKey) {
          e.preventDefault();
          nudgeSchemaBlocks(0, e.shiftKey ? -5 : -1);
          return;
        }
        if (e.key === 'ArrowDown' && !e.altKey) {
          e.preventDefault();
          nudgeSchemaBlocks(0, e.shiftKey ? 5 : 1);
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          nudgeSchemaBlocks(e.shiftKey ? -5 : -1, 0);
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          nudgeSchemaBlocks(e.shiftKey ? 5 : 1, 0);
          return;
        }
        // Delete / Backspace — delete selected block(s)
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          if (selectedBlockIds.length > 1) {
            deleteSchemaBlocks(selectedBlockIds);
          } else {
            deleteBlock(selectedBlockId);
          }
          return;
        }
        // Ctrl+D / Cmd+D — duplicate selected block
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
          e.preventDefault();
          duplicateBlock(selectedBlockId);
          return;
        }
        // Ctrl+C / Cmd+C — copy selected block
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          e.preventDefault();
          copySchemaBlock(selectedBlockId);
          return;
        }
        // Alt+Arrow Up — move block up
        if (e.altKey && e.key === 'ArrowUp') {
          e.preventDefault();
          moveBlockUp(selectedBlockId);
          return;
        }
        // Alt+Arrow Down — move block down
        if (e.altKey && e.key === 'ArrowDown') {
          e.preventDefault();
          moveBlockDown(selectedBlockId);
          return;
        }
        // Escape — exit editing mode first, then deselect block.
        // NOTE: CanvaBuilder's escape handler clears element selection.
        // We only handle block-specific deselection here.
        if (e.key === 'Escape') {
          if (editingBlockId) {
            stopEditing();
          } else {
            selectBlock(null);
          }
          return;
        }
      }

      // ── Ctrl+V / Cmd+V — paste block from clipboard (always available) ──
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // Only intercept if we have a schema clipboard (don't block native paste for text inputs)
        if (useCanvaStore.getState()._schemaClipboard) {
          e.preventDefault();
          pasteSchemaBlock();
          return;
        }
      }

      // ── Element shortcuts (legacy CanvaElements) ──────────────
      // Ctrl+A / Cmd+A — select all elements
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAllElements();
        return;
      }
      // Delete / Backspace — delete selected elements
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElIds.length > 1) {
          e.preventDefault();
          deleteSelectedElements();
          return;
        }
      }
      // NOTE: Bare Escape (when no block selected) is handled by
      // CanvaBuilder's keyboardManager 'canvas.escape' handler.
      // Do NOT add another Escape handler here — it causes double-deselect.
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElIds, selectedBlockId, selectedBlockIds, editingBlockId, selectAllElements, deleteSelectedElements, clearSelection, selectBlock, deleteBlock, duplicateBlock, moveBlockUp, moveBlockDown, stopEditing, copySchemaBlock, pasteSchemaBlock, nudgeSchemaBlocks, deleteSchemaBlocks]);
}
