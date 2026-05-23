'use client';

import React from 'react';
import { AlertTriangle, Footprints, LayoutGrid, FilePlus, ShieldOff } from 'lucide-react';
import type { TokenResolver } from '../types';
import { resolveColor, resolveColorAlpha } from '../types';
import { PremiumBadge } from './PremiumBlockEffects';
import { isFeatureAllowed, type SafeModeFeature } from '@/core/recovery';

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
  /** Whether safe mode is active (disables split/merge actions) */
  safeMode?: boolean;
}

export const OverflowIndicator = React.memo(function OverflowIndicator({
  estimatedHeight,
  availableHeight,
  onAction,
  tokens,
  isCompact = false,
  safeMode = false,
}: OverflowIndicatorProps) {
  const overflow = estimatedHeight - availableHeight;

  // Auto-hide when content fits
  if (overflow <= 0) return null;

  const overflowLabel = overflow > 1000
    ? `${Math.round(overflow / 100) / 10}k px`
    : `${Math.round(overflow)}px`;

  const accentColor = resolveColor(tokens, 'y', '#fbbf24', '#fbbf24');
  const accentAlpha = (a: number) => resolveColorAlpha(tokens, 'y', a, `rgba(251,191,36,${a})`, `rgba(251,191,36,${a})`);

  // ── FASE 6: Safe mode gates for overflow actions ──
  // In safe mode, scene-overflow-split and scene-overflow-merge are disabled.
  // 'step-mode' uses scene split → gated by 'scene-overflow-split'
  // 'new-page' uses page split → gated by 'scene-overflow-split'
  // 'compact' uses compression engine → gated by 'compression-engine'
  const isStepModeAllowed = isFeatureAllowed('scene-overflow-split' as SafeModeFeature, safeMode);
  const isNewPageAllowed = isFeatureAllowed('scene-overflow-split' as SafeModeFeature, safeMode);
  const isCompactAllowed = isFeatureAllowed('compression-engine' as SafeModeFeature, safeMode);

  const actions: Array<{
    key: 'step-mode' | 'compact' | 'new-page';
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
  }> = [
    {
      key: 'step-mode',
      icon: <Footprints size={isCompact ? 9 : 10} />,
      label: 'Mode Langkah',
      disabled: !isStepModeAllowed,
    },
    {
      key: 'compact',
      icon: <LayoutGrid size={isCompact ? 9 : 10} />,
      label: 'Tata Letak Ringkas',
      disabled: !isCompactAllowed,
    },
    {
      key: 'new-page',
      icon: <FilePlus size={isCompact ? 9 : 10} />,
      label: 'Halaman Baru',
      disabled: !isNewPageAllowed,
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

      {/* Action buttons — disabled in safe mode for gated features */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {actions.map((action) => (
          <button
            key={action.key}
            className="overflow-action-btn focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
            onClick={() => !action.disabled && onAction(action.key)}
            aria-label={action.label}
            type="button"
            disabled={action.disabled}
            style={action.disabled ? { opacity: 0.35, cursor: 'not-allowed', pointerEvents: 'none' } : undefined}
            title={action.disabled ? 'Dinonaktifkan di Mode Aman' : undefined}
          >
            {action.disabled ? <ShieldOff size={isCompact ? 9 : 10} /> : action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});
