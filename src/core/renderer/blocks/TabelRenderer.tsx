'use client';

import React from 'react';
import { Table2 } from 'lucide-react';
import type { TabelBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { RichText } from './RichText';
import type { CompressionDecision } from '../../layout/CompressionEngine';

// ═══════════════════════════════════════════════════════════════════
// TABEL RENDERER — Premium HTML Table for Materi Section
// ═══════════════════════════════════════════════════════════════════
// Renders a proper HTML table with premium styling:
//   - Accent-colored header row with gradient
//   - Alternating row colors
//   - Rounded corners with shadow
//   - Optional title above
//
// All text/labels in Indonesian (Bahasa Indonesia).
// ═══════════════════════════════════════════════════════════════════

export const TabelRenderer = React.memo(function TabelRenderer({ block, tokens, isCompact, isEditing, compression }: {
  block: TabelBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; compression?: CompressionDecision;
}) {
  const colorKey = block.accentColor || 'c';
  const accentColor = tokens.color(colorKey);
  const accentAlpha = (a: number) => tokens.colorAlpha(colorKey, a);
  const edu = tokens.edu('tabel', isCompact);

  const headers = block.headers || [];
  const rows = block.rows || [];

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

        <div style={{ ...edu.sectionPadding() }}>
          {/* Header row with badge */}
          <div className="flex items-center gap-2 mb-3">
            <MicroInteraction tokens={tokens} accent={colorKey} effect="glow">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: accentAlpha(0.2) }}
              >
                <Table2 size={10} style={{ color: accentColor }} />
              </div>
            </MicroInteraction>
            <PremiumBadge tokens={tokens} accent={colorKey} variant="glass">
              Tabel
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

          {/* Table — max-height + scroll saat mode canvas untuk mencegah overflow */}
          <div
            className={`overflow-x-auto ${isCompact ? 'max-h-80 overflow-y-auto' : ''}`}
            style={{
              borderRadius: tokens.radius('lg') + 'px',
              border: `1px solid ${accentAlpha(0.15)}`,
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              {/* Header row */}
              <thead>
                <tr>
                  {headers.map((header, i) => (
                    <th
                      key={`tabel-header-${i}`}
                      style={{
                        ...edu.componentPadding(),
                        ...edu.caption(),
                        textAlign: 'left',
                        fontWeight: 800,
                        letterSpacing: '0.03em',
                        color: tokens.color('bg'),
                        background: `linear-gradient(135deg, ${accentColor}, ${accentAlpha(0.8)})`,
                        borderBottom: `2px solid ${accentAlpha(0.4)}`,
                        whiteSpace: 'nowrap',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                      }}
                    >
                      <RichText content={header} />
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body rows */}
              <tbody>
                {rows.map((row, ri) => (
                  <tr
                    key={`tabel-row-${ri}`}
                    style={{
                      background: ri % 2 === 0
                        ? edu.cardBg()
                        : accentAlpha(0.04),
                      ...edu.transition('background-color', 'fast'),
                    }}
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={`tabel-cell-${ri}-${ci}`}
                        style={{
                          ...edu.nestedPadding(),
                          ...edu.body(),
                          color: edu.textColor(),
                          borderBottom: `1px solid ${accentAlpha(0.1)}`,
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        <RichText content={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PremiumBlockWrapper>
  );
});
