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
import type { TokenResolver } from '../renderer/types';

export interface ShowMoreButtonProps {
  /** Number of hidden items */
  hiddenCount: number;
  /** Callback when user clicks to reveal */
  onShowMore: () => void;
  /** Item label (e.g., "item", "langkah", "tujuan") */
  itemLabel?: string;
  /** Whether in compact (canvas) mode */
  isCompact?: boolean;
  /** Accent color token key — defaults to 'g' (green) for reveal/expand actions */
  accent?: string;
  /** Token resolver for theme-aware colors. If omitted, falls back to CSS custom properties. */
  tokens?: TokenResolver;
}

export const ShowMoreButton = React.memo(function ShowMoreButton({
  hiddenCount,
  onShowMore,
  itemLabel = 'lainnya',
  isCompact = false,
  accent = 'g',
  tokens,
}: ShowMoreButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = useCallback(() => setIsPressed(true), []);
  const handlePointerUp = useCallback(() => setIsPressed(false), []);

  // Token-aware colors: use TokenResolver if available, fall back to CSS custom properties
  const accentColor = tokens ? tokens.color(accent) : `var(--color-g, #34d399)`;
  const accentBg = tokens ? tokens.colorAlpha(accent, 0.06) : `rgba(52,211,153,0.06)`;
  const accentBorder = tokens ? tokens.colorAlpha(accent, 0.3) : `rgba(52,211,153,0.3)`;
  const accentText = tokens ? tokens.colorAlpha(accent, 0.85) : `rgba(52,211,153,0.85)`;

  return (
    <button
      onClick={onShowMore}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="w-full flex items-center justify-center gap-1.5 rounded-xl
        transition-[transform,background-color,box-shadow,border-color] duration-150 ease-out
        hover:brightness-110 active:scale-[0.97]
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
      style={{
        padding: isCompact ? '6px 12px' : '8px 16px',
        background: accentBg,
        border: `1px dashed ${accentBorder}`,
        color: accentText,
        fontSize: isCompact ? '9px' : '11px',
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: '0.02em',
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
      }}
    >
      <span className="material-symbols-outlined" style={ { fontSize: '16px' } }>visibility</span>
      Lihat {hiddenCount} {itemLabel}
      <span className="material-symbols-outlined" style={ { fontSize: '16px' } }>expand_more</span>
    </button>
  );
});
