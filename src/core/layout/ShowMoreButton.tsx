// ═══════════════════════════════════════════════════════════════════
// SHOW MORE BUTTON — Reusable "Lihat lainnya" component
// ═══════════════════════════════════════════════════════════════════
// Standardized button for revealing compressed/hidden items.
// Used by all block renderers when compression hides some items.
//
// Sprint 3C: Added focus-visible ring, active/press state,
// transition polish per iOS Visual Contract interaction tokens.

'use client';

import React, { useCallback, useRef, useState } from 'react';
import { ChevronDown, Eye } from 'lucide-react';

export interface ShowMoreButtonProps {
  /** Number of hidden items */
  hiddenCount: number;
  /** Callback when user clicks to reveal */
  onShowMore: () => void;
  /** Item label (e.g., "item", "langkah", "tujuan") */
  itemLabel?: string;
  /** Whether in compact (canvas) mode */
  isCompact?: boolean;
  /** Accent color token key */
  accent?: string;
}

export const ShowMoreButton = React.memo(function ShowMoreButton({
  hiddenCount,
  onShowMore,
  itemLabel = 'lainnya',
  isCompact = false,
  accent = 'c',
}: ShowMoreButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = useCallback(() => setIsPressed(true), []);
  const handlePointerUp = useCallback(() => setIsPressed(false), []);

  return (
    <button
      onClick={onShowMore}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="w-full flex items-center justify-center gap-1.5 rounded-xl
        transition-[transform,background-color,box-shadow] duration-150 ease-out
        hover:brightness-110 active:scale-[0.97]
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
      style={{
        padding: isCompact ? '6px 12px' : '8px 16px',
        background: `rgba(52, 211, 153, 0.06)`,
        border: `1px dashed rgba(52, 211, 153, 0.3)`,
        color: 'rgba(52, 211, 153, 0.85)',
        fontSize: isCompact ? '9px' : '11px',
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: '0.02em',
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
        // Press state handled by Tailwind class + inline fallback
      }}
    >
      <Eye size={isCompact ? 10 : 12} />
      Lihat {hiddenCount} {itemLabel}
      <ChevronDown size={isCompact ? 10 : 12} style={{ opacity: 0.6 }} />
    </button>
  );
});
