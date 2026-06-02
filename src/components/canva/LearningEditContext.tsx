'use client';

// ═══════════════════════════════════════════════════════════════════
// LEARNING EDIT CONTEXT — Provides inline editing state to block renderers
// ═══════════════════════════════════════════════════════════════════
// This context is provided by screen adapters in the LearningMediaShell.
// Block renderers can optionally read from this context to enable
// inline editing when the teacher toggles edit mode.
//
// The context provides:
//   - editable: whether inline editing is enabled (teacherMode + isEditing toggle)
//   - isEditing: whether an inline edit is currently active
//   - editingBlockId: which block is being edited
//   - startEdit: begin editing a specific block
//   - stopEdit: save and exit editing
//   - updateBlock: write changes via applyGuidedSchemaPatch
//   - pageId: the current page ID (needed for applyGuidedSchemaPatch)
// ═══════════════════════════════════════════════════════════════════

import React, { createContext, useContext } from 'react';

// ── Types ──────────────────────────────────────────────────────

export interface LearningEditContextValue {
  /** Whether inline editing is enabled in this screen */
  editable: boolean;
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
  /** The current page ID for applying patches */
  pageId: string;
}

// ── Context ────────────────────────────────────────────────────

const LearningEditContext = createContext<LearningEditContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────

export const LearningEditProvider = LearningEditContext.Provider;

// ── Hook ───────────────────────────────────────────────────────

/**
 * Read the LearningEditContext from the nearest provider.
 * Returns null if no provider is found (i.e., not in learning mode).
 *
 * Block renderers can use this to conditionally enable inline editing:
 *
 *   const editCtx = useLearningEditContext();
 *   if (editCtx?.editable) {
 *     // Render with InlineEditableText
 *   }
 */
export function useLearningEditContext(): LearningEditContextValue | null {
  return useContext(LearningEditContext);
}
