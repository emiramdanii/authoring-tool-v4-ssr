/**
 * SILSE — Keyboard Shortcuts Hook
 * Registers global keyboard shortcuts for the authoring canvas.
 *
 * Task #5: Undo/Redo keyboard shortcuts
 * - Ctrl+Z / Cmd+Z → Undo
 * - Ctrl+Shift+Z / Cmd+Shift+Z → Redo
 * - Ctrl+Y / Cmd+Y → Redo (alternative)
 * - Delete / Backspace → Remove selected block
 * - Escape → Deselect block / close drawers
 * - Ctrl+D / Cmd+D → Duplicate selected block
 */

'use client';

import { useEffect } from 'react';
import { useCanvaStore } from '../store/canva-store';

export function useKeyboardShortcuts() {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    removeBlock,
    duplicateBlock,
    selectBlock,
    setActiveDrawer,
    session,
    pages,
    currentPageIndex,
  } = useCanvaStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // ─── Undo: Ctrl+Z / Cmd+Z ────────────────────────────────────
      if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
        return;
      }

      // ─── Redo: Ctrl+Shift+Z / Cmd+Shift+Z ────────────────────────
      if (isCtrlOrCmd && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
        return;
      }

      // ─── Redo: Ctrl+Y / Cmd+Y ────────────────────────────────────
      if (isCtrlOrCmd && e.key === 'y') {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
        return;
      }

      // ─── Delete: Delete / Backspace ───────────────────────────────
      if ((e.key === 'Delete' || e.key === 'Backspace') && session.selectedBlockId) {
        // Only if not focused on an input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        removeBlock(session.selectedBlockId);
        return;
      }

      // ─── Duplicate: Ctrl+D / Cmd+D ───────────────────────────────
      if (isCtrlOrCmd && e.key === 'd' && session.selectedBlockId) {
        e.preventDefault();
        duplicateBlock(session.selectedBlockId);
        return;
      }

      // ─── Escape: Deselect / close drawers ─────────────────────────
      if (e.key === 'Escape') {
        if (session.activeDrawer) {
          setActiveDrawer(null);
        } else if (session.selectedBlockId) {
          selectBlock(null);
        }
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, removeBlock, duplicateBlock, selectBlock, setActiveDrawer, session.selectedBlockId, session.activeDrawer, pages, currentPageIndex]);
}
