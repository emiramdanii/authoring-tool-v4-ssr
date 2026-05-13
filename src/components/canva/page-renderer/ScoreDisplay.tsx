'use client';

import React from 'react';
import { useScoreAnimation } from '@/hooks/use-score-animation';
import { getScoreTier } from './PageFrame';

// ═══════════════════════════════════════════════════════════════
// SCORE DISPLAY — Premium animated score pill with +N popup
//
// Features:
//   - Count-up animation when score increases
//   - Floating "+N" indicator that rises and fades
//   - Pulse/glow effect on score change
//   - Tier-based coloring (Luar Biasa, Hebat, Cukup Baik, Terus Berlatih)
//   - 3 navbar styles: colorful, minimal, glass
//
// Used in: PageFrame (top/bottom nav), PlayOverlay (header)
// ═══════════════════════════════════════════════════════════════

export interface ScoreDisplayProps {
  /** Which navbar style to render */
  navbarStyle: 'colorful' | 'minimal' | 'glass';
  /** Whether in compact (canvas) mode */
  isCompact: boolean;
  /** Whether to show detailed score (score/max) or just percentage */
  showDetail?: boolean;
  /** TokenResolver for theme-aware colors */
  tokens: {
    color: (token: string) => string;
    colorAlpha: (token: string, alpha: number) => string;
  };
  /** Position variant for styling differences */
  variant?: 'top' | 'bottom' | 'header';
}

export function ScoreDisplay({
  navbarStyle,
  isCompact,
  showDetail = true,
  tokens,
  variant = 'top',
}: ScoreDisplayProps) {
  const {
    displayScore,
    displayMax,
    displayPct,
    delta,
    deltaKey,
    isPulsing,
  } = useScoreAnimation(600, 800);

  const hasScore = displayMax > 0;
  if (!hasScore) return null;

  const tier = getScoreTier(displayPct);

  // ── Style per navbar style ──
  const getPillStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: isCompact ? 4 : 6,
      transition: 'box-shadow 0.3s ease, transform 0.2s ease',
    };

    // Pulse effect — brief glow + scale bump on score change
    if (isPulsing) {
      base.transform = 'scale(1.08)';
    }

    switch (navbarStyle) {
      case 'colorful':
        return {
          ...base,
          background: `${tier.color}18`,
          border: `1px solid ${tier.color}33`,
          borderRadius: 9999,
          padding: isCompact ? '2px 8px' : '4px 10px',
          boxShadow: isPulsing
            ? `0 0 20px ${tier.glow}, 0 0 8px ${tier.glow}`
            : `0 0 12px ${tier.glow}`,
        };
      case 'minimal':
        return {
          ...base,
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          padding: isCompact ? '1px 4px' : '2px 6px',
        };
      case 'glass':
        return {
          ...base,
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${tier.color}30`,
          borderRadius: 9999,
          padding: isCompact ? '2px 8px' : '4px 12px',
          backdropFilter: 'blur(8px)',
          boxShadow: isPulsing
            ? `0 0 24px ${tier.glow}, inset 0 0 12px ${tier.color}15`
            : `0 0 16px ${tier.glow}, inset 0 0 8px ${tier.color}10`,
        };
      default:
        return base;
    }
  };

  const getScoreTextStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      color: tier.color,
      fontWeight: 800,
      fontFamily: 'monospace',
      transition: 'color 0.3s ease',
    };

    if (navbarStyle === 'glass') {
      base.textShadow = `0 0 8px ${tier.glow}`;
    }

    return base;
  };

  const iconChar = navbarStyle === 'glass' ? '✦' : navbarStyle === 'minimal' ? '' : '🏆';
  const fontSize = isCompact ? '9px' : variant === 'header' ? '12px' : '11px';

  return (
    <div style={getPillStyle()}>
      {/* Icon */}
      {iconChar && (
        <span style={{ fontSize: isCompact ? 9 : 12 }}>{iconChar}</span>
      )}

      {/* Percentage — animated count-up */}
      <span style={{ ...getScoreTextStyle(), fontSize }}>
        {displayPct}%
      </span>

      {/* Detail: score/max */}
      {showDetail && !isCompact && (
        <span style={{
          fontSize: 9,
          color: tokens.colorAlpha('muted', 0.5),
          fontWeight: 600,
        }}>
          {displayScore}/{displayMax}
        </span>
      )}

      {/* ══ Floating "+N" delta indicator ════════════════════ */}
      {delta !== null && delta > 0 && (
        <span
          key={`score-delta-${deltaKey}`}
          className="score-delta-float"
          style={{
            position: 'absolute',
            top: -4,
            right: navbarStyle === 'minimal' ? 0 : -8,
            fontSize: isCompact ? 9 : 11,
            fontWeight: 900,
            color: tier.color,
            fontFamily: 'monospace',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            textShadow: navbarStyle === 'glass'
              ? `0 0 6px ${tier.glow}`
              : 'none',
          }}
        >
          +{delta}
        </span>
      )}
    </div>
  );
}
