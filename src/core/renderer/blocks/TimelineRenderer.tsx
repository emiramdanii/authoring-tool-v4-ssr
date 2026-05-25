'use client';

import React from 'react';
import { GitBranch } from 'lucide-react';
import type { TimelineBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { RichText } from './RichText';
import type { CompressionDecision } from '../../layout/CompressionEngine';

// ═══════════════════════════════════════════════════════════════════
// TIMELINE RENDERER — Vertical Timeline for Materi Section
// ═══════════════════════════════════════════════════════════════════
// Renders a vertical timeline with:
//   - Step dots with icons
//   - Connecting lines between steps
//   - Step cards with label and description
//   - Color-coded per step
//
// All text/labels in Indonesian (Bahasa Indonesia).
// ═══════════════════════════════════════════════════════════════════

export const TimelineRenderer = React.memo(function TimelineRenderer({ block, tokens, isCompact, isEditing, compression }: {
  block: TimelineBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; compression?: CompressionDecision;
}) {
  const colorKey = block.accentColor || 'c';
  const accentColor = tokens.color(colorKey);
  const accentAlpha = (a: number) => tokens.colorAlpha(colorKey, a);
  const edu = tokens.edu('timeline', isCompact);

  const steps = block.steps || [];

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

        <div style={{ ...tokens.iosSectionPadding(isCompact) }}>
          {/* Header row with badge */}
          <div className="flex items-center gap-2 mb-3">
            <MicroInteraction tokens={tokens} accent={colorKey} effect="glow">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: accentAlpha(0.2) }}
              >
                <GitBranch size={10} style={{ color: accentColor }} />
              </div>
            </MicroInteraction>
            <PremiumBadge tokens={tokens} accent={colorKey} variant="glass">
              Timeline
            </PremiumBadge>
          </div>

          {/* Title */}
          {block.title && (
            <div
              className="font-extrabold mb-3"
              style={{
                ...edu.bodyLg(),
                fontWeight: 700,
                color: tokens.color('text'),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              <RichText content={block.title} />
            </div>
          )}

          {/* Timeline steps — overflow protection saat mode canvas */}
          <div className="flex flex-col" style={{ gap: '0px', ...(isCompact ? { maxHeight: '280px', overflow: 'hidden' as const } : {}) }}>
            {steps.map((step, i) => {
              const stepColor = tokens.color(step.color);
              const stepAlpha = (a: number) => tokens.colorAlpha(step.color, a);
              const isLast = i === steps.length - 1;

              return (
                <div
                  key={`timeline-step-${i}`}
                  className="flex"
                  style={{
                    ...edu.entrance(i),
                  }}
                >
                  {/* Left column: dot + line */}
                  <div
                    className="flex flex-col items-center flex-shrink-0"
                    style={{ width: isCompact ? '28px' : '36px' }}
                  >
                    {/* Dot with icon */}
                    <MicroInteraction tokens={tokens} accent={step.color} effect="glow">
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: isCompact ? '24px' : '32px',
                          height: isCompact ? '24px' : '32px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${stepColor}, ${stepAlpha(0.7)})`,
                          boxShadow: `0 2px 8px ${stepAlpha(0.3)}`,
                          fontSize: isCompact ? '11px' : '14px',
                          zIndex: 2,
                        }}
                      >
                        {step.icon}
                      </div>
                    </MicroInteraction>

                    {/* Connecting line */}
                    {!isLast && (
                      <div
                        style={{
                          width: '2px',
                          flex: 1,
                          minHeight: isCompact ? '16px' : '24px',
                          background: `linear-gradient(180deg, ${stepAlpha(0.4)}, ${stepAlpha(0.1)})`,
                        }}
                      />
                    )}
                  </div>

                  {/* Right column: step card */}
                  <div
                    className="flex-1 min-w-0"
                    style={{
                      paddingBottom: isLast ? 0 : (isCompact ? '10px' : '14px'),
                    }}
                  >
                    <div
                      style={{
                        background: stepAlpha(0.06),
                        border: `1px solid ${stepAlpha(0.15)}`,
                        borderRadius: tokens.radius('lg') + 'px',
                        ...tokens.iosNestedPadding(isCompact),
                      }}
                    >
                      <div
                        className="font-extrabold mb-1"
                        style={{
                          ...edu.body(),
                          fontWeight: 700,
                          color: stepColor,
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        <RichText content={step.label} />
                      </div>
                      <div
                        className={isCompact ? 'canvas-truncate-2' : ''}
                        style={{
                          ...edu.body(),
                          color: tokens.color('text'),
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        <RichText content={step.description} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PremiumBlockWrapper>
  );
});
