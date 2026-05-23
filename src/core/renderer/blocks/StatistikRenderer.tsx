'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { StatistikBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { RichText } from './RichText';
import type { CompressionDecision } from '../../layout/CompressionEngine';

// ═══════════════════════════════════════════════════════════════════
// STATISTIK RENDERER — Big Number Cards Grid for Materi Section
// ═══════════════════════════════════════════════════════════════════
// Renders big number cards in a grid (2-3 columns):
//   - Number displayed prominently (large font)
//   - Satuan below the number
//   - Label at bottom
//   - Color-coded per item
//
// All text/labels in Indonesian (Bahasa Indonesia).
// ═══════════════════════════════════════════════════════════════════

export const StatistikRenderer = React.memo(function StatistikRenderer({ block, tokens, isCompact, isEditing, compression }: {
  block: StatistikBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; compression?: CompressionDecision;
}) {
  const colorKey = block.accentColor || 'c';
  const accentColor = tokens.color(colorKey);
  const accentAlpha = (a: number) => tokens.colorAlpha(colorKey, a);

  const items = block.items || [];

  // Determine grid columns: 2 for compact, 3 for normal (max 3)
  const gridCols = isCompact ? 2 : Math.min(items.length, 3);

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
                <BarChart3 size={10} style={{ color: accentColor }} />
              </div>
            </MicroInteraction>
            <PremiumBadge tokens={tokens} accent={colorKey} variant="glass">
              Statistik
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

          {/* Statistics grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              gap: isCompact ? '8px' : '12px',
              minWidth: 0,
            }}
          >
            {items.map((item, i) => {
              const itemColor = tokens.color(item.warna);
              const itemAlpha = (a: number) => tokens.colorAlpha(item.warna, a);

              return (
                <MicroInteraction key={`statistik-item-${i}`} tokens={tokens} accent={item.warna} effect="glow">
                  <div
                    className="flex flex-col items-center text-center"
                    style={{
                      padding: isCompact ? '12px 8px' : '16px 12px',
                      background: itemAlpha(0.08),
                      border: `1px solid ${itemAlpha(0.2)}`,
                      borderRadius: tokens.radius('xl') + 'px',
                      boxShadow: tokens.raw.shadow.card,
                      ...tokens.iosEntranceStyle(i, 'slideIn'),
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Top accent dot */}
                    <div
                      style={{
                        width: isCompact ? '6px' : '8px',
                        height: isCompact ? '6px' : '8px',
                        borderRadius: '50%',
                        background: itemColor,
                        boxShadow: `0 0 8px ${itemAlpha(0.4)}`,
                        marginBottom: isCompact ? '6px' : '8px',
                      }}
                    />

                    {/* Big number */}
                    <div
                      className="font-black"
                      style={{
                        fontFamily: tokens.fontFamily('display'),
                        fontSize: isCompact ? '22px' : '32px',
                        lineHeight: 1.1,
                        color: itemColor,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    >
                      <RichText content={item.angka} />
                    </div>

                    {/* Satuan */}
                    {item.satuan && (
                      <div
                        style={{
                          fontSize: isCompact ? '9px' : '11px',
                          color: itemAlpha(0.7),
                          fontWeight: 700,
                          marginTop: '2px',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        <RichText content={item.satuan} />
                      </div>
                    )}

                    {/* Label */}
                    <div
                      style={{
                        fontSize: isCompact ? '10px' : '12px',
                        color: tokens.muted(0.75),
                        fontWeight: 600,
                        marginTop: isCompact ? '4px' : '6px',
                        lineHeight: 1.4,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    >
                      <RichText content={item.label} />
                    </div>
                  </div>
                </MicroInteraction>
              );
            })}
          </div>
        </div>
      </div>
    </PremiumBlockWrapper>
  );
});
