'use client';

import { useRef, useCallback } from 'react';

// ── Editable Text Zone ────────────────────────────────────────

export function EditableText({
  value,
  fieldKey,
  isSelected,
  onEdit,
  className = '',
  style = {},
  placeholder = 'Ketik di sini...',
  interactive,
}: {
  value: string;
  fieldKey: string;
  isSelected: boolean;
  onEdit?: (key: string, value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  interactive?: boolean; // When true, don't show placeholder (students shouldn't see "Ketik di sini...")
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleBlur = useCallback(() => {
    if (ref.current && onEdit) {
      onEdit(fieldKey, ref.current.textContent || '');
    }
  }, [fieldKey, onEdit]);

  // In interactive/export mode: don't show placeholder — students shouldn't
  // see "Ketik di sini...". Just render the value or nothing.
  const displayText = interactive ? (value || '') : (value || placeholder);

  return (
    <div
      ref={ref}
      contentEditable={isSelected && !!onEdit}
      suppressContentEditableWarning
      onBlur={handleBlur}
      className={`outline-none ${isSelected ? 'ring-1 ring-amber-400/40 ring-offset-2 ring-offset-transparent rounded' : ''} ${className}`}
      style={style}
    >
      {displayText}
    </div>
  );
}
