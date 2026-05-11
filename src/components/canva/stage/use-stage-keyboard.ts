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
  undo: () => void;
  redo: () => void;
}

/**
 * Keyboard shortcut handler for the Stage component.
 * Manages multi-select shortcuts, schema block actions, and element shortcuts.
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
  undo,
  redo,
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

      // ── Global shortcuts (always available) ─────────────────────
      // Ctrl+Z / Cmd+Z — undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      // Ctrl+Y / Cmd+Y — redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      // Ctrl+Shift+Z / Cmd+Shift+Z — redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
        return;
      }

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
        // Escape — exit editing mode first, then deselect
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
      // Escape — clear selection
      if (e.key === 'Escape') {
        clearSelection();
        selectBlock(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElIds, selectedBlockId, selectedBlockIds, editingBlockId, selectAllElements, deleteSelectedElements, clearSelection, selectBlock, deleteBlock, duplicateBlock, moveBlockUp, moveBlockDown, stopEditing, copySchemaBlock, pasteSchemaBlock, nudgeSchemaBlocks, deleteSchemaBlocks, undo, redo]);
}
