'use client';

import React, { useState, useCallback } from 'react';
import { CheckSquare } from 'lucide-react';
import type { ChecklistBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { RichText } from './RichText';
import type { CompressionDecision } from '../../layout/CompressionEngine';

// ═══════════════════════════════════════════════════════════════════
// CHECKLIST RENDERER — Interactive Checklist for Materi Section
// ═══════════════════════════════════════════════════════════════════
// Renders a checklist with:
//   - Checkbox circles (checked = filled, unchecked = outline)
//   - Interactive mode: click to toggle
//   - Each item in a card row
//   - Title above if present
//
// All text/labels in Indonesian (Bahasa Indonesia).
// ═══════════════════════════════════════════════════════════════════

export const ChecklistRenderer = React.memo(function ChecklistRenderer({ block, tokens, isCompact, interactive, isEditing, compression }: {
  block: ChecklistBlock; tokens: TokenResolver; isCompact: boolean; interactive?: boolean; isEditing?: boolean; compression?: CompressionDecision;
}) {
  const colorKey = block.accentColor || 'c';
  const accentColor = tokens.color(colorKey);
  const accentAlpha = (a: number) => tokens.colorAlpha(colorKey, a);

  const items = block.items || [];
  const [checkedState, setCheckedState] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    items.forEach((item, i) => {
      initial[i] = item.checked ?? false;
    });
    return initial;
  });

  const handleToggle = useCallback((index: number) => {
    setCheckedState((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }, []);

  const checkedCount = Object.values(checkedState).filter(Boolean).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? checkedCount / totalCount : 0;

  return (
    <PremiumBlockWrapper tokens={tokens} accent={colorKey} staggerIndex={0} gradientBorder>
      <ReadingProgressIndicator progress={progress} tokens={tokens} accent={colorKey} height={2} position="top" />
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

        <div style={{ ...tokens.iosSectionPadding(isCompact) }}>
          {/* Header row with badge */}
          <div className="flex items-center gap-2 mb-1">
            <MicroInteraction tokens={tokens} accent={colorKey} effect="glow">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: accentAlpha(0.2) }}
              >
                <CheckSquare size={10} style={{ color: accentColor }} />
              </div>
            </MicroInteraction>
            <PremiumBadge tokens={tokens} accent={colorKey} variant="glass">
              Checklist
            </PremiumBadge>
            {totalCount > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: isCompact ? '9px' : '10px',
                  color: tokens.muted(0.6),
                  fontWeight: 700,
                }}
              >
                {checkedCount}/{totalCount}
              </span>
            )}
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

          {/* Checklist items */}
          <div className="flex flex-col gap-2">
            {items.map((item, i) => {
              const isChecked = checkedState[i] ?? false;

              return (
                <MicroInteraction key={`checklist-item-${i}`} tokens={tokens} accent={colorKey} effect="squish">
                  <div
                    className="flex items-center gap-3 rounded-lg transition-[background-color,border-color,opacity]"
                    style={{
                      ...tokens.iosNestedPadding(isCompact),
                      background: isChecked
                        ? accentAlpha(0.1)
                        : tokens.color('card'),
                      border: `1px solid ${isChecked ? accentAlpha(0.25) : accentAlpha(0.1)}`,
                      cursor: interactive ? 'pointer' : 'default',
                      opacity: isChecked ? 0.85 : 1,
                    }}
                    onClick={() => interactive && handleToggle(i)}
                    role={interactive ? 'checkbox' : 'listitem'}
                    aria-checked={interactive ? isChecked : undefined}
                    tabIndex={interactive ? 0 : undefined}
                    onKeyDown={interactive ? ((e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggle(i);
                      }
                    }) : undefined}
                  >
                    {/* Checkbox circle */}
                    <div
                      className="flex-shrink-0 flex items-center justify-center"
                      style={{
                        width: isCompact ? '18px' : '22px',
                        height: isCompact ? '18px' : '22px',
                        borderRadius: '50%',
                        border: isChecked
                          ? 'none'
                          : `2px solid ${accentAlpha(0.4)}`,
                        background: isChecked
                          ? `linear-gradient(135deg, ${accentColor}, ${accentAlpha(0.7)})`
                          : 'transparent',
                        ...tokens.iosTransitionStyle('background-color, border-color, color, transform', 'fast'),
                        boxShadow: isChecked ? `0 2px 6px ${accentAlpha(0.3)}` : 'none',
                      }}
                    >
                      {isChecked && (
                        <svg
                          width={isCompact ? '10' : '12'}
                          height={isCompact ? '10' : '12'}
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2.5 6L5 8.5L9.5 3.5"
                            stroke={tokens.color('bg')}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Text */}
                    <span
                      style={{
                        fontSize: isCompact ? '12px' : '14px',
                        lineHeight: 1.5,
                        color: isChecked ? tokens.muted(0.6) : tokens.color('text'),
                        textDecoration: isChecked ? 'line-through' : 'none',
                        ...tokens.iosTransitionStyle('color, text-decoration-color', 'fast'),
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    >
                      <RichText content={item.text} />
                    </span>
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
