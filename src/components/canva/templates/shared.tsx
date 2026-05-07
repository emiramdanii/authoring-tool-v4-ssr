'use client';

import { useRef, useCallback } from 'react';
import type { ColorPalette } from '../types';

// ── SubTemplateProps ────────────────────────────────────────────

export interface SubTemplateProps {
  td: Record<string, unknown>;
  palette: ColorPalette | null;
  isSelected: boolean;
  onEditField: (key: string, value: string) => void;
  interactive?: boolean;
  variant?: 'A' | 'B' | 'C'; // Phase 3: Template layout variant
}

// ── Editable Text Zone ────────────────────────────────────────

export function EditableText({
  value,
  fieldKey,
  isSelected,
  onEdit,
  className = '',
  style = {},
  placeholder = 'Ketik di sini...',
}: {
  value: string;
  fieldKey: string;
  isSelected: boolean;
  onEdit: (key: string, value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleBlur = useCallback(() => {
    if (ref.current) {
      onEdit(fieldKey, ref.current.textContent || '');
    }
  }, [fieldKey, onEdit]);

  return (
    <div
      ref={ref}
      contentEditable={isSelected}
      suppressContentEditableWarning
      onBlur={handleBlur}
      className={`outline-none ${isSelected ? 'ring-1 ring-amber-400/40 ring-offset-2 ring-offset-transparent rounded' : ''} ${className}`}
      style={style}
    >
      {value || placeholder}
    </div>
  );
}
