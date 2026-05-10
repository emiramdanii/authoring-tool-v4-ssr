// ═══════════════════════════════════════════════════════════════════
// INLINE TEXT EDITOR — ContentEditable wrapper for inline block editing
// ═══════════════════════════════════════════════════════════════════
// When a schema block enters editing mode (double-click → editingBlockId),
// this component wraps text fields with contentEditable behavior.
//
// Architecture:
//   Double-click block → startEditing(blockId) → editingBlockId set
//   → InlineTextEditor becomes active → user edits text
//   → onBlur → updateSchemaBlock(id, { [fieldKey]: newText })
//   → renderer re-renders with new text
//
// This component is used INSIDE individual block renderers,
// NOT in BlockSelectionOverlay. Each renderer decides which fields
// are inline-editable.

'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface InlineTextEditorProps {
  /** The text content to edit */
  value: string;
  /** Callback when text changes (on blur) */
  onSave: (newValue: string) => void;
  /** Whether inline editing is active (block is in edit mode) */
  isEditing: boolean;
  /** CSS class for the editable element */
  className?: string;
  /** Inline styles for the editable element */
  style?: React.CSSProperties;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Tag to render — defaults to 'span' */
  tag?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'p' | 'label';
  /** Whether this is a multiline text field */
  multiline?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function InlineTextEditor({
  value,
  onSave,
  isEditing,
  className = '',
  style,
  placeholder = 'Ketik teks...',
  tag: Tag = 'span',
  multiline = false,
}: InlineTextEditorProps) {
  const ref = useRef<HTMLElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value changes to DOM (but not while user is typing)
  useEffect(() => {
    if (!ref.current) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  // Focus when entering edit mode
  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus();
      // Select all text on focus for easy replacement
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const handleBlur = useCallback(() => {
    if (!ref.current) return;
    const newText = ref.current.textContent || '';
    if (newText !== value) {
      onSave(newText);
    }
  }, [value, onSave]);

  const handleInput = useCallback(() => {
    isInternalChange.current = true;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Enter key behavior
    if (e.key === 'Enter') {
      if (!multiline) {
        // Single-line: Enter saves and exits
        e.preventDefault();
        ref.current?.blur();
      }
      // Multi-line: Enter adds newline (default contentEditable behavior)
    }
    // Escape exits editing
    if (e.key === 'Escape') {
      e.preventDefault();
      // Revert to original value
      if (ref.current) {
        ref.current.textContent = value;
      }
      ref.current?.blur();
    }
  }, [multiline, value]);

  if (!isEditing) {
    // Not editing: render as plain text (no contentEditable)
    return (
      <Tag className={className} style={style}>
        {value || placeholder}
      </Tag>
    );
  }

  // Editing mode: render with contentEditable
  return (
    <Tag
      ref={ref as React.RefObject<any>}
      className={`${className} outline-none ring-2 ring-emerald-400/40 rounded-sm px-0.5 -mx-0.5 transition-shadow`}
      style={style}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      data-inline-editor="true"
    >
      {value || placeholder}
    </Tag>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HOOK: useInlineEditor
// ═══════════════════════════════════════════════════════════════════
// Convenience hook for block renderers to add inline editing support.
// Reads editing state from the canva store and creates onSave handler.
//
// Usage in a block renderer:
//   const titleEditor = useInlineEditor({
//     blockId: block.id,
//     fieldKey: 'title',
//     value: block.title ?? '',
//   });
//   <InlineTextEditor {...titleEditor} tag="h1" />
//
// The hook automatically:
//   1. Checks if the block is in editing mode (editingBlockId === blockId)
//   2. Creates onSave handler that calls updateSchemaBlock with the patch
//   3. Returns all props needed by InlineTextEditor

export interface UseInlineEditorOptions {
  /** The block ID (must match editingBlockId in the store) */
  blockId?: string;
  /** Dot-notation path to the field in the schema (e.g., 'content.title') */
  fieldKey: string;
  /** Current value of the field */
  value: string;
  /** Additional props for InlineTextEditor */
  className?: string;
  style?: React.CSSProperties;
  tag?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'p' | 'label';
  placeholder?: string;
  multiline?: boolean;
}

export function useInlineEditor(options: UseInlineEditorOptions) {
  const { blockId, fieldKey, value, ...rest } = options;

  // Read editing state from store
  const editingBlockId = useCanvaStore(s => s.editingBlockId);
  const updateSchemaBlock = useCanvaStore(s => s.updateSchemaBlock);

  // This block is editing if editingBlockId matches this block's ID
  const isEditing = !!blockId && editingBlockId === blockId;

  const handleSave = useCallback((newValue: string) => {
    if (!blockId) return;
    // Convert dot-notation key to nested patch object
    // 'content.title' → { content: { title: newValue } }
    const patch = dotNotationToPatch(fieldKey, newValue);
    updateSchemaBlock(blockId, patch);
  }, [blockId, fieldKey, updateSchemaBlock]);

  return {
    value,
    onSave: handleSave,
    isEditing,
    ...rest,
  };
}

/**
 * Convert a dot-notation key and value to a nested patch object.
 * Example: dotNotationToPatch('content.title', 'Hello')
 *   → { content: { title: 'Hello' } }
 */
function dotNotationToPatch(key: string, value: string): Record<string, unknown> {
  const parts = key.split('.');
  let result: Record<string, unknown> = {};
  let current = result;
  for (let i = 0; i < parts.length; i++) {
    if (i === parts.length - 1) {
      current[parts[i]] = value;
    } else {
      current[parts[i]] = {};
      current = current[parts[i]] as Record<string, unknown>;
    }
  }
  return result;
}
