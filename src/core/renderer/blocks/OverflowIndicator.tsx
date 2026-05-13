'use client';

import React from 'react';
import { AlertTriangle, Footprints, LayoutGrid, FilePlus } from 'lucide-react';
import type { TokenResolver } from '../types';
import { PremiumBadge } from './PremiumBlockEffects';

// ═══════════════════════════════════════════════════════════════════
// OVERFLOW INDICATOR — Floating Action Panel for Overflow Handling
// ═══════════════════════════════════════════════════════════════════
// Shows a glassmorphism floating badge at the bottom-right of a block
// when content overflows. Provides 3-tier actions:
//   1. Mode Langkah (Step Mode) — splits content into navigable steps
//   2. Tata Letak Ringkas (Compact Layout) — compresses the layout
//   3. Halaman Baru (New Page) — moves overflow to a new page
//
// All text/labels in Indonesian (Bahasa Indonesia).
// ═══════════════════════════════════════════════════════════════════

export interface OverflowIndicatorProps {
  /** Estimated height of the block in pixels */
  estimatedHeight: number;
  /** Available height in pixels */
  availableHeight: number;
  /** Callback for each overflow action */
  onAction: (action: 'step-mode' | 'compact' | 'new-page') => void;
  tokens?: TokenResolver;
  isCompact?: boolean;
}

export function OverflowIndicator({
  estimatedHeight,
  availableHeight,
  onAction,
  tokens,
  isCompact = false,
}: OverflowIndicatorProps) {
  const overflow = estimatedHeight - availableHeight;

  // Auto-hide when content fits
  if (overflow <= 0) return null;

  const overflowLabel = overflow > 1000
    ? `${Math.round(overflow / 100) / 10}k px`
    : `${Math.round(overflow)}px`;

  const accentColor = tokens ? tokens.color('y') : '#fbbf24';
  const accentAlpha = (a: number) => tokens ? tokens.colorAlpha('y', a) : `rgba(251,191,36,${a})`;

  const actions: Array<{
    key: 'step-mode' | 'compact' | 'new-page';
    icon: React.ReactNode;
    label: string;
  }> = [
    {
      key: 'step-mode',
      icon: <Footprints size={isCompact ? 9 : 10} />,
      label: 'Mode Langkah',
    },
    {
      key: 'compact',
      icon: <LayoutGrid size={isCompact ? 9 : 10} />,
      label: 'Tata Letak Ringkas',
    },
    {
      key: 'new-page',
      icon: <FilePlus size={isCompact ? 9 : 10} />,
      label: 'Halaman Baru',
    },
  ];

  return (
    <div className="overflow-indicator">
      {/* Warning badge */}
      <PremiumBadge
        tokens={tokens}
        accent="y"
        variant="solid"
        isCompact={isCompact}
      >
        <AlertTriangle size={isCompact ? 8 : 9} />
        <span>Konten Meluap</span>
        <span style={{ opacity: 0.7, marginLeft: '2px' }}>
          +{overflowLabel}
        </span>
      </PremiumBadge>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {actions.map((action) => (
          <button
            key={action.key}
            className="overflow-action-btn"
            onClick={() => onAction(action.key)}
            aria-label={action.label}
            type="button"
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
