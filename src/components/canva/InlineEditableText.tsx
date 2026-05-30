'use client';

// ═══════════════════════════════════════════════════════════════════
// INLINE EDITABLE TEXT — Lightweight click-to-edit text for learning view
// ═══════════════════════════════════════════════════════════════════
// A minimal inline editable text component for the LearningMediaShell.
// When editable=false: renders as plain text (no visual difference).
// When editable=true and user clicks: transforms into a contentEditable
// div with a subtle blue outline.
//
// Behavior:
//   - Click to enter edit mode (when editable)
//   - On blur or Enter (single line): saves via onSave
//   - On Escape: reverts to original value
//   - Visual: subtle hover indicator, blue ring when focused
//   - No toolbar, no formatting — just plain text editing
// ═══════════════════════════════════════════════════════════════════

import React, { useRef, useState, useCallback, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────

export interface InlineEditableTextProps {
  /** Current text value */
  value: string;
  /** Callback when text is saved (on blur or Enter) */
  onSave: (newValue: string) => void;
  /** Whether this text is editable (only when canEdit is true) */
  editable?: boolean;
  /** Whether this is a multiline text field */
  multiline?: boolean;
  /** Placeholder text when empty */
  placeholder?: string;
  /** CSS class name */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

// ── Component ──────────────────────────────────────────────────

export const InlineEditableText = React.memo(function InlineEditableText({
  value,
  onSave,
  editable = false,
  multiline = false,
  placeholder = 'Klik untuk mengedit...',
  className = '',
  style,
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const editRef = useRef<HTMLDivElement>(null);

  // Sync edit value when external value changes (but not while editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus when entering edit mode
  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      // Select all text for easy replacement
      const range = document.createRange();
      range.selectNodeContents(editRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const handleClick = useCallback(() => {
    if (editable && !isEditing) {
      setIsEditing(true);
      setEditValue(value);
    }
  }, [editable, isEditing, value]);

  const handleBlur = useCallback(() => {
    if (!isEditing) return;
    const newText = editRef.current?.textContent || '';
    setIsEditing(false);
    if (newText !== value) {
      onSave(newText);
    }
  }, [isEditing, value, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault();
        editRef.current?.blur();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        // Revert to original value
        setEditValue(value);
        setIsEditing(false);
        if (editRef.current) {
          editRef.current.textContent = value;
        }
      }
    },
    [multiline, value]
  );

  const handleInput = useCallback(() => {
    if (editRef.current) {
      setEditValue(editRef.current.textContent || '');
    }
  }, []);

  // ── Not editable: render plain text ──────────────────────
  if (!editable) {
    return (
      <span className={className} style={style}>
        {value || placeholder}
      </span>
    );
  }

  // ── Editable but not editing: render with hover indicator ──
  if (!isEditing) {
    return (
      <span
        className={`${className} cursor-pointer rounded-sm transition-colors duration-150 hover:bg-blue-50/60`}
        style={style}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        title="Klik untuk mengedit"
      >
        {value || placeholder}
      </span>
    );
  }

  // ── Editing: contentEditable div ──────────────────────────
  return (
    <div
      ref={editRef}
      className={`${className} outline-none ring-2 ring-blue-400/50 rounded-sm px-0.5 -mx-0.5 min-h-[1em]`}
      style={{
        ...style,
        cursor: 'text',
      }}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      data-inline-editable="true"
    >
      {value || placeholder}
    </div>
  );
});
