'use client';

import React from 'react';
import { Scale } from 'lucide-react';
import type { CompareBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { RichText } from './RichText';
import { useBlockCompression } from '../../layout/useBlockCompression';
import type { CompressionDecision } from '../../layout/CompressionEngine';

// ═══════════════════════════════════════════════════════════════════
// COMPARE RENDERER — Side-by-side Comparison Block
// ═══════════════════════════════════════════════════════════════════
// Renders a two-column comparison with:
//   - Left column (kiri): icon, judul, isi
//   - Right column (kanan): icon, judul, isi
//   - VS badge in the center divider
//   - Premium styling with gradient border, progress bar, badge
//
// All text/labels in Indonesian (Bahasa Indonesia).
// ═══════════════════════════════════════════════════════════════════

export const CompareRenderer = React.memo(function CompareRenderer({ block, tokens, isCompact, interactive, isEditing, compression }: {
  block: CompareBlock; tokens: TokenResolver; isCompact: boolean; interactive?: boolean; isEditing?: boolean; compression?: CompressionDecision;
}) {
  const edu = tokens.edu('compare', isCompact);
  const colorKey = block.accentColor || 'c';
  const accentColor = tokens.color(colorKey);
  const accentAlpha = (a: number) => tokens.colorAlpha(colorKey, a);

  // ── Compression support ─────────────────────────────────────
  // Compare has 2 sides (kiri & kanan) — we use compression to
  // optionally collapse isi text. For now, compression is simple:
  // we track if the block is compressed but always show both sides.
  const { isCompressed } = useBlockCompression({
    compression,
    totalItems: 2, // kiri + kanan
  });

  return (
    <PremiumBlockWrapper tokens={tokens} accent={colorKey} staggerIndex={0} gradientBorder>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent={colorKey} height={2} position="top" />
      <div
        className="rounded-xl overflow-hidden premium-card-glow"
        style={{
          background: tokens.colorAlpha(colorKey, 0.06),
          border: `1px solid ${accentAlpha(0.2)}`,
          boxShadow: edu.shadow('card'),
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
                <Scale size={10} style={{ color: accentColor }} />
              </div>
            </MicroInteraction>
            <PremiumBadge tokens={tokens} accent={colorKey} variant="glass">
              Perbandingan
            </PremiumBadge>
          </div>

          {/* Title */}
          {block.title && (
            <div
              className="font-extrabold mb-3"
              style={{
                fontFamily: tokens.fontFamily('display'),
                ...edu.bodyLg(),
                fontWeight: 700,
                color: edu.textColor(),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              <RichText content={block.title} />
            </div>
          )}

          {/* ── Two-column comparison layout ─────────────────────── */}
          <div
            className="flex gap-2 items-stretch"
            style={{
              marginTop: block.title ? undefined : '4px',
            }}
          >
            {/* Left column — Kiri */}
            <div
              className="flex-1 min-w-0 rounded-lg"
              style={{
                ...edu.nestedPadding(),
                background: edu.cardBg(),
                border: `1px solid ${accentAlpha(0.15)}`,
                borderLeft: `${edu.stripeWidth()}px solid ${accentColor}`,
              }}
            >
              {/* Icon circle + Judul */}
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
                  }}
                >
                  {block.kiri?.icon || '🔵'}
                </div>
                <span
                  className="font-extrabold min-w-0 truncate"
                  style={{
                    color: accentColor,
                    ...edu.caption(),
                    fontWeight: 700,
                    fontFamily: tokens.fontFamily('display'),
                  }}
                >
                  <RichText content={block.kiri?.judul || 'Sisi Kiri'} />
                </span>
              </div>

              {/* Isi / body text */}
              <div
                style={{
                  ...edu.body(),
                  color: edu.textColor(),
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                <RichText content={block.kiri?.isi || ''} />
              </div>
            </div>

            {/* ── Center VS badge ──────────────────────────────── */}
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: isCompact ? '28px' : '36px' }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: isCompact ? '26px' : '34px',
                  height: isCompact ? '26px' : '34px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${accentColor}, ${accentAlpha(0.6)})`,
                  boxShadow: `0 4px 14px ${accentAlpha(0.35)}`,
                  ...edu.micro(),
                  fontWeight: 900,
                  color: tokens.color('bg'),
                  letterSpacing: '0.04em',
                  fontFamily: tokens.fontFamily('display'),
                }}
              >
                VS
              </div>
            </div>

            {/* Right column — Kanan */}
            <div
              className="flex-1 min-w-0 rounded-lg"
              style={{
                ...edu.nestedPadding(),
                background: edu.cardBg(),
                border: `1px solid ${accentAlpha(0.15)}`,
                borderLeft: `${edu.stripeWidth()}px solid ${tokens.color('r')}`,
              }}
            >
              {/* Icon circle + Judul */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: isCompact ? '28px' : '34px',
                    height: isCompact ? '28px' : '34px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${tokens.color('r')}, ${tokens.colorAlpha('r', 0.7)})`,
                    boxShadow: `0 4px 12px ${tokens.colorAlpha('r', 0.3)}`,
                    fontSize: isCompact ? '14px' : '17px',
                  }}
                >
                  {block.kanan?.icon || '🔴'}
                </div>
                <span
                  className="font-extrabold min-w-0 truncate"
                  style={{
                    color: tokens.color('r'),
                    ...edu.caption(),
                    fontWeight: 700,
                    fontFamily: tokens.fontFamily('display'),
                  }}
                >
                  <RichText content={block.kanan?.judul || 'Sisi Kanan'} />
                </span>
              </div>

              {/* Isi / body text */}
              <div
                style={{
                  ...edu.body(),
                  color: edu.textColor(),
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                <RichText content={block.kanan?.isi || ''} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PremiumBlockWrapper>
  );
});
