'use client';

import React, { useState, useCallback } from 'react';
import { Gift, Eye, EyeOff } from 'lucide-react';
import type { RevealBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { RichText } from './RichText';
import { playSound } from '@/lib/sounds';
import { fireConfetti } from '@/lib/confetti';
import type { CompressionDecision } from '../../layout/CompressionEngine';

// ═══════════════════════════════════════════════════════════════════
// REVEAL RENDERER — Interactive Hidden Content Block
// ═══════════════════════════════════════════════════════════════════
// Renders an interactive card that hides content until tapped/clicked:
//   - Cover state: large emoji icon + coverText + pulse hint
//   - Revealed state: revealIcon + revealContent + "Sembunyikan" button
//   - When interactive=false: always shows revealed state
//   - Confetti + sound on first reveal
//
// All text/labels in Indonesian (Bahasa Indonesia).
// ═══════════════════════════════════════════════════════════════════

export const RevealRenderer = React.memo(function RevealRenderer({ block, tokens, isCompact, interactive, isEditing, compression }: {
  block: RevealBlock; tokens: TokenResolver; isCompact: boolean; interactive?: boolean; isEditing?: boolean; compression?: CompressionDecision;
}) {
  const colorKey = block.accentColor || 'p';
  const accentColor = tokens.color(colorKey);
  const accentAlpha = (a: number) => tokens.colorAlpha(colorKey, a);
  const edu = tokens.edu('reveal', isCompact);

  // ── Reveal state ────────────────────────────────────────────
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasRevealedOnce, setHasRevealedOnce] = useState(false);

  const handleReveal = useCallback(() => {
    if (!isRevealed) {
      setIsRevealed(true);
      if (!hasRevealedOnce) {
        setHasRevealedOnce(true);
        fireConfetti({ count: 40, duration: 2500 });
        playSound('ding');
      } else {
        playSound('click');
      }
    }
  }, [isRevealed, hasRevealedOnce]);

  const handleHide = useCallback(() => {
    setIsRevealed(false);
    playSound('click');
  }, []);

  // ── When not interactive, always show revealed state ─────────
  const showRevealed = !interactive || isRevealed;

  return (
    <PremiumBlockWrapper tokens={tokens} accent={colorKey} staggerIndex={0} gradientBorder>
      <ReadingProgressIndicator progress={showRevealed ? 1 : 0} tokens={tokens} accent={colorKey} height={2} position="top" />
      <div
        className="rounded-xl overflow-hidden premium-card-glow"
        style={{
          background: tokens.colorAlpha(colorKey, 0.06),
          border: `1px solid ${accentAlpha(0.2)}`,
          boxShadow: tokens.raw.shadow.card,
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-1"
          style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentAlpha(0.4)})` }}
        />

        <div style={{ ...edu.sectionPadding() }}>
          {/* Header row with badge */}
          <div className="flex items-center gap-2 mb-3">
            <MicroInteraction tokens={tokens} accent={colorKey} effect="glow">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: accentAlpha(0.2) }}
              >
                <Gift size={10} style={{ color: accentColor }} />
              </div>
            </MicroInteraction>
            <PremiumBadge tokens={tokens} accent={colorKey} variant="glass">
              Konten Tersembunyi
            </PremiumBadge>
          </div>

          {/* Title */}
          {block.title && (
            <div
              className="font-extrabold mb-3"
              style={{
                ...edu.heading(),
                fontFamily: tokens.fontFamily('display'),
                color: edu.textColor(),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              <RichText content={block.title} />
            </div>
          )}

          {/* ── COVER STATE (hidden) ────────────────────────────── */}
          {!showRevealed && (
            <MicroInteraction tokens={tokens} accent={colorKey} effect="bounce">
              <button
                type="button"
                onClick={handleReveal}
                className={`w-full text-center rounded-lg cursor-pointer ${tokens.iosButtonTw()}  hover:scale-[1.01]`}
                style={{
                  ...edu.componentPadding(),
                  background: `linear-gradient(135deg, ${accentAlpha(0.12)}, ${accentAlpha(0.04)})`,
                  border: `2px dashed ${accentAlpha(0.4)}`,
                  outline: 'none',
                }}
                aria-label="Ketuk untuk membuka konten tersembunyi"
              >
                {/* Large cover icon with pulse animation */}
                <div
                  className="mx-auto mb-3 flex items-center justify-center"
                  style={{
                    width: isCompact ? '48px' : '60px',
                    height: isCompact ? '48px' : '60px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${accentColor}, ${accentAlpha(0.6)})`,
                    boxShadow: `0 6px 20px ${accentAlpha(0.4)}`,
                    fontSize: isCompact ? '24px' : '30px',
                    animation: 'glowPulse 2s ease-in-out infinite',
                    '--glow-color': accentAlpha(0.2),
                    '--glow-color-strong': accentAlpha(0.5),
                  } as React.CSSProperties}
                >
                  {block.coverIcon || '🎁'}
                </div>

                {/* Cover text */}
                <div
                  className="font-bold"
                  style={{
                    ...edu.bodyLg(),
                    fontWeight: 700,
                    color: accentColor,
                    fontFamily: tokens.fontFamily('display'),
                  }}
                >
                  {block.coverText || 'Ketuk untuk membuka!'}
                </div>

                {/* Subtle tap hint */}
                <div
                  className="mt-2"
                  style={{
                    ...edu.caption(),
                    color: edu.mutedText(0.5),
                    animation: 'float 2.5s ease-in-out infinite',
                  }}
                >
                  👆 Ketuk untuk membuka
                </div>
              </button>
            </MicroInteraction>
          )}

          {/* ── REVEALED STATE ──────────────────────────────────── */}
          {showRevealed && (
            <div
              style={{
                ...edu.componentPadding(),
                borderRadius: edu.radius('lg'),
                background: edu.cardBg(),
                border: `1px solid ${accentAlpha(0.25)}`,
                borderLeft: `${edu.stripeWidth()}px solid ${accentColor}`,
                overflow: 'hidden',
              }}
            >
              {/* Reveal icon + label */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: isCompact ? '28px' : '34px',
                    height: isCompact ? '28px' : '34px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${accentColor}, ${accentAlpha(0.7)})`,
                    boxShadow: `0 4px 12px ${accentAlpha(0.3)}`,
                    fontSize: isCompact ? '14px' : '17px',
                    animation: hasRevealedOnce && isRevealed ? 'popIn 0.4s ease-out' : undefined,
                  }}
                >
                  {block.revealIcon || '💡'}
                </div>
                <span
                  className="font-extrabold uppercase tracking-wider"
                  style={{
                    ...edu.micro(),
                    color: accentColor,
                    letterSpacing: '0.06em',
                  }}
                >
                  Terbuka!
                </span>
              </div>

              {/* Reveal content — truncasi saat compact */}
              <div
                className={isCompact ? 'canvas-truncate-2' : ''}
                style={{
                  ...edu.body(),
                  color: edu.textColor(),
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                <RichText content={block.revealContent || ''} />
              </div>

              {/* Hide again button (only when interactive) */}
              {interactive && (
                <MicroInteraction tokens={tokens} accent={colorKey} effect="squish">
                  <button
                    type="button"
                    onClick={handleHide}
                    className={`mt-3 px-4 py-1.5 rounded-lg font-bold ${tokens.iosExpandTw()}  hover:scale-[1.02]`}
                    style={{
                      ...edu.caption(),
                      background: accentAlpha(0.1),
                      color: accentColor,
                      border: `1px solid ${accentAlpha(0.3)}`,
                      cursor: 'pointer',
                    }}
                    aria-label="Sembunyikan konten"
                  >
                    <EyeOff size={11} className="inline mr-1" /> Sembunyikan
                  </button>
                </MicroInteraction>
              )}
            </div>
          )}
        </div>
      </div>
    </PremiumBlockWrapper>
  );
});
