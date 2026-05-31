'use client';

// ═══════════════════════════════════════════════════════════════════
// USE LEARNING EDITOR — Hook for managing inline editing in LearningMediaShell
// ═══════════════════════════════════════════════════════════════════
// This hook provides inline editing capabilities within the
// LearningMediaShell. It manages editing state and provides
// the updateBlock function that writes changes via
// applyGuidedSchemaPatch().
//
// Usage:
//   const editor = useLearningEditor();
//   <LearningEditProvider value={editor.contextValue}>
//     {children}
//   </LearningEditProvider>
// ═══════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useDirtyStore } from '@/store/dirty-store';
import { applyGuidedSchemaPatch } from '@/core/schema/guided-patch';
import type { LearningEditContextValue } from '@/components/canva/LearningEditContext';

// ── Types ──────────────────────────────────────────────────────

export interface UseLearningEditorReturn {
  /** Whether an inline edit session is currently active */
  isEditing: boolean;
  /** The block ID currently being edited, or null */
  editingBlockId: string | null;
  /** Start editing a specific block */
  startEdit: (blockId: string) => void;
  /** Stop editing (save current state) */
  stopEdit: () => void;
  /** Write changes to a block via applyGuidedSchemaPatch */
  updateBlock: (blockId: string, patch: Record<string, unknown>) => void;
  /** Whether the current user can edit (teacherMode is true) */
  canEdit: boolean;
  /** The context value to pass to LearningEditProvider */
  contextValue: LearningEditContextValue;
}

// ── Hook ───────────────────────────────────────────────────────

export function useLearningEditor(editable: boolean): UseLearningEditorReturn {
  const teacherMode = useCanvaStore((s) => s.teacherMode);
  const pages = useCanvaStore((s) => s.pages);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);

  const [isEditing, setIsEditing] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const canEdit = teacherMode && editable;

  const startEdit = useCallback((blockId: string) => {
    if (!canEdit) return;
    setIsEditing(true);
    setEditingBlockId(blockId);
  }, [canEdit]);

  const stopEdit = useCallback(() => {
    // FIX: Force-blur any active contentEditable before clearing editing state.
    // InlineEditableText saves on blur (onBlur → onSave → onStopEdit), but
    // stopEdit can be called directly (page switch, block deselection) before
    // blur fires. Force-blur ensures the save pipeline runs first.
    if (typeof document !== 'undefined') {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && activeEl.contentEditable === 'true') {
        activeEl.blur();
      }
    }
    setIsEditing(false);
    setEditingBlockId(null);
  }, []);

  const updateBlock = useCallback((blockId: string, patch: Record<string, unknown>) => {
    const page = pages[currentPageIndex];
    if (!page?.id) return;

    const result = applyGuidedSchemaPatch({
      pageId: page.id,
      blockId,
      patch,
      source: 'user',
    });

    if (result.success) {
      // Mark dirty so auto-save picks up the change
      try {
        useDirtyStore.getState().markDirty();
      } catch {
        // SSR guard
      }
    } else {
      console.warn(
        `[useLearningEditor] Failed to apply patch to block "${blockId}": ${result.error}`
      );
    }
  }, [pages, currentPageIndex]);

  const pageId = pages[currentPageIndex]?.id || '';

  const contextValue: LearningEditContextValue = {
    editable: canEdit,
    isEditing,
    editingBlockId,
    startEdit,
    stopEdit,
    updateBlock,
    pageId,
  };

  return {
    isEditing,
    editingBlockId,
    startEdit,
    stopEdit,
    updateBlock,
    canEdit,
    contextValue,
  };
}
