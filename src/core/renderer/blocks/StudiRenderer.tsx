'use client';

import React from 'react';
import { BookMarked } from 'lucide-react';
import type { StudiBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { RichText } from './RichText';
import type { CompressionDecision } from '../../layout/CompressionEngine';

// ═══════════════════════════════════════════════════════════════════
// STUDI RENDERER — Case Study Card for Materi Section
// ═══════════════════════════════════════════════════════════════════
// Renders a case study card with:
//   - Karakter avatar circle at top
//   - Situasi in a bordered section
//   - Pertanyaan in a distinct callout
//   - Pesan as a bottom tip
//
// All text/labels in Indonesian (Bahasa Indonesia).
// ═══════════════════════════════════════════════════════════════════

export const StudiRenderer = React.memo(function StudiRenderer({ block, tokens, isCompact, isEditing, compression }: {
  block: StudiBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; compression?: CompressionDecision;
}) {
  const colorKey = block.accentColor || 'c';
  const accentColor = tokens.color(colorKey);
  const accentAlpha = (a: number) => tokens.colorAlpha(colorKey, a);

  return (
    <PremiumBlockWrapper tokens={tokens} accent={colorKey} staggerIndex={0} gradientBorder>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent={colorKey} height={2} position="top" />
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

        <div style={{ padding: isCompact ? '10px 12px' : '13px 15px' }}>
          {/* Header row with badge */}
          <div className="flex items-center gap-2 mb-3">
            <MicroInteraction tokens={tokens} accent={colorKey} effect="glow">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: accentAlpha(0.2) }}
              >
                <BookMarked size={10} style={{ color: accentColor }} />
              </div>
            </MicroInteraction>
            <PremiumBadge tokens={tokens} accent={colorKey} variant="glass">
              Studi Kasus
            </PremiumBadge>
          </div>

          {/* Title */}
          {block.title && (
            <div
              className="font-extrabold mb-3"
              style={{
                fontFamily: tokens.fontFamily('display'),
                fontSize: isCompact ? '13px' : '15px',
                color: tokens.color('text'),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              <RichText content={block.title} />
            </div>
          )}

          {/* Karakter avatar */}
          {block.karakter && (
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: isCompact ? '32px' : '40px',
                  height: isCompact ? '32px' : '40px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${accentColor}, ${accentAlpha(0.7)})`,
                  boxShadow: `0 4px 12px ${accentAlpha(0.3)}`,
                  fontSize: isCompact ? '16px' : '20px',
                }}
              >
                {block.karakter}
              </div>
              <span
                className="font-bold"
                style={{
                  color: accentColor,
                  fontSize: isCompact ? '12px' : '14px',
                }}
              >
                Karakter
              </span>
            </div>
          )}

          {/* Situasi section */}
          <div
            style={{
              padding: isCompact ? '8px 10px' : '10px 14px',
              borderRadius: tokens.radius('lg') + 'px',
              background: tokens.color('card'),
              border: `1px solid ${accentAlpha(0.15)}`,
              borderLeft: `${isCompact ? 3 : 4}px solid ${accentColor}`,
              marginBottom: '10px',
            }}
          >
            <div
              className="font-extrabold uppercase tracking-wider mb-1.5"
              style={{
                color: accentColor,
                fontSize: isCompact ? '9px' : '10px',
                letterSpacing: '0.06em',
              }}
            >
              Situasi
            </div>
            <div
              style={{
                fontSize: isCompact ? '12px' : '14px',
                lineHeight: 1.7,
                color: tokens.color('text'),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              <RichText content={block.situasi} />
            </div>
          </div>

          {/* Pertanyaan callout */}
          <div
            style={{
              padding: isCompact ? '8px 10px' : '10px 14px',
              borderRadius: tokens.radius('lg') + 'px',
              background: accentAlpha(0.1),
              border: `1px solid ${accentAlpha(0.25)}`,
              borderLeft: `${isCompact ? 3 : 4}px solid ${tokens.color('y')}`,
              marginBottom: block.pesan ? '10px' : '0',
            }}
          >
            <div
              className="font-extrabold uppercase tracking-wider mb-1.5"
              style={{
                color: tokens.color('y'),
                fontSize: isCompact ? '9px' : '10px',
                letterSpacing: '0.06em',
              }}
            >
              Pertanyaan
            </div>
            <div
              style={{
                fontSize: isCompact ? '12px' : '14px',
                lineHeight: 1.7,
                color: tokens.color('text'),
                fontStyle: 'italic',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              <RichText content={block.pertanyaan || ''} />
            </div>
          </div>

          {/* Pesan bottom tip */}
          {block.pesan && (
            <MicroInteraction tokens={tokens} accent="g" effect="bounce">
              <div
                style={{
                  padding: isCompact ? '7px 10px' : '9px 12px',
                  borderRadius: tokens.radius('lg') + 'px',
                  background: tokens.colorAlpha('g', 0.08),
                  border: `1px solid ${tokens.colorAlpha('g', 0.2)}`,
                  borderLeft: `${isCompact ? 3 : 4}px solid ${tokens.color('g')}`,
                }}
              >
                <div className="flex items-start gap-2">
                  <span
                    className="flex-shrink-0"
                    style={{ fontSize: isCompact ? '12px' : '14px' }}
                  >
                    💡
                  </span>
                  <div
                    style={{
                      fontSize: isCompact ? '11px' : '12px',
                      lineHeight: 1.6,
                      color: tokens.color('text'),
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
                    <RichText content={block.pesan} />
                  </div>
                </div>
              </div>
            </MicroInteraction>
          )}
        </div>
      </div>
    </PremiumBlockWrapper>
  );
});
