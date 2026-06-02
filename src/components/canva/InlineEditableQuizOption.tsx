'use client';

// ═══════════════════════════════════════════════════════════════════
// INLINE EDITABLE QUIZ OPTION — Click-to-edit quiz answer option
// ═══════════════════════════════════════════════════════════════════
// For editing quiz answer options inline in the learning view.
// Shows option text with letter prefix (A, B, C, D).
// Click text to edit inline (same behavior as InlineEditableText).
// Click the circle/badge to toggle correct/incorrect (only when editable).
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────

export interface InlineEditableQuizOptionProps {
  /** The option text */
  optionText: string;
  /** Whether this option is the correct answer */
  isCorrect: boolean;
  /** Callback when option text is saved */
  onSave: (newText: string) => void;
  /** Callback to toggle correct/incorrect status */
  onToggleCorrect?: () => void;
  /** Whether this option is editable */
  editable?: boolean;
  /** Option index (0=A, 1=B, 2=C, 3=D) */
  index: number;
  /** Accent color key */
  accentColor?: string;
}

// ── Letter mapping ─────────────────────────────────────────────

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

// ── Component ──────────────────────────────────────────────────

export const InlineEditableQuizOption = React.memo(function InlineEditableQuizOption({
  optionText,
  isCorrect,
  onSave,
  onToggleCorrect,
  editable = false,
  index,
  accentColor,
}: InlineEditableQuizOptionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(optionText);
  const editRef = useRef<HTMLSpanElement>(null);
  const letter = OPTION_LETTERS[index] || '?';

  // Sync edit value when external value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(optionText);
    }
  }, [optionText, isEditing]);

  // Focus when entering edit mode
  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(editRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const handleTextClick = useCallback(
    (e: React.MouseEvent) => {
      if (editable && !isEditing) {
        e.stopPropagation();
        setIsEditing(true);
        setEditValue(optionText);
      }
    },
    [editable, isEditing, optionText]
  );

  const handleBlur = useCallback(() => {
    if (!isEditing) return;
    const newText = editRef.current?.textContent || '';
    setIsEditing(false);
    if (newText !== optionText) {
      onSave(newText);
    }
  }, [isEditing, optionText, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        editRef.current?.blur();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
        setEditValue(optionText);
        if (editRef.current) {
          editRef.current.textContent = optionText;
        }
      }
    },
    [optionText]
  );

  const handleInput = useCallback(() => {
    if (editRef.current) {
      setEditValue(editRef.current.textContent || '');
    }
  }, []);

  const handleToggleClick = useCallback(
    (e: React.MouseEvent) => {
      if (editable && onToggleCorrect) {
        e.stopPropagation();
        onToggleCorrect();
      }
    },
    [editable, onToggleCorrect]
  );

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors duration-150 ${
        editable ? 'hover:bg-blue-50/40 cursor-default' : ''
      }`}
      style={{
        border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(0,0,0,0.06)'}`,
        background: isCorrect ? 'rgba(34,197,94,0.06)' : 'transparent',
      }}
    >
      {/* Correct/incorrect indicator */}
      <button
        type="button"
        onClick={handleToggleClick}
        className={`flex-shrink-0 transition-colors duration-150 ${
          editable ? 'cursor-pointer hover:scale-110' : 'cursor-default'
        }`}
        disabled={!editable}
        title={editable ? (isCorrect ? 'Tandai sebagai salah' : 'Tandai sebagai benar') : undefined}
        aria-label={isCorrect ? 'Jawaban benar' : 'Bukan jawaban benar'}
      >
        {isCorrect ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300" />
        )}
      </button>

      {/* Letter prefix */}
      <span
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
        style={{
          background: isCorrect ? 'rgba(34,197,94,0.12)' : 'rgba(0,0,0,0.05)',
          color: isCorrect ? '#16a34a' : '#6b7280',
        }}
      >
        {letter}
      </span>

      {/* Option text */}
      {isEditing ? (
        <span
          ref={editRef}
          className="flex-1 min-w-0 outline-none ring-2 ring-blue-400/50 rounded-sm px-0.5"
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          data-inline-editable="true"
          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
        >
          {optionText}
        </span>
      ) : (
        <span
          className={`flex-1 min-w-0 ${editable ? 'cursor-pointer rounded-sm transition-colors duration-150 hover:bg-blue-50/60 px-0.5 -mx-0.5' : ''}`}
          onClick={handleTextClick}
          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
          title={editable ? 'Klik untuk mengedit' : undefined}
          role={editable ? 'button' : undefined}
          tabIndex={editable ? 0 : undefined}
          onKeyDown={
            editable
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTextClick(e as unknown as React.MouseEvent);
                  }
                }
              : undefined
          }
        >
          {optionText}
        </span>
      )}
    </div>
  );
});
