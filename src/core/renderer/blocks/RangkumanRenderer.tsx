'use client';

import React from 'react';
import { Shield, BookOpen, CheckCircle2, Sparkles } from 'lucide-react';
import type { RangkumanBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { PremiumStepNavigator, usePremiumStepNavigator } from './PremiumStepNavigator';

// ═══════════════════════════════════════════════════════════════════
// RANGKUMAN RENDERER — BSNP Summary / Reinforcement Block
// ═══════════════════════════════════════════════════════════════════
// Provides a visual summary of key concepts at the end of a lesson
// section. BSNP recommends reinforcement/penguatan to consolidate
// learning before moving to evaluation.
//
// Features:
//   - Section header with accent color and BSNP badge
//   - Concept cards with icons, titles, and descriptions
//   - Step mode when concepts > 2 (PremiumStepNavigator)
//   - Closing statement for lesson wrap-up
//   - Visual emphasis on key takeaways
// ═══════════════════════════════════════════════════════════════════

/** Step mode sub-component for RangkumanRenderer when concepts > 2 */
function RangkumanStepMode({ concepts, blockId, tokens, isCompact }: {
  concepts: RangkumanBlock['concepts'];
  blockId: string | undefined;
  tokens: TokenResolver;
  isCompact: boolean;
}) {
  const STEP_SIZE = 2;
  const totalSteps = Math.ceil(concepts.length / STEP_SIZE);
  const { activeStep, ...nav } = usePremiumStepNavigator(totalSteps);

  // Build step labels: "Konsep 1-2", "Konsep 3-4", etc.
  const labels = Array.from({ length: totalSteps }, (_, i) => {
    const start = i * STEP_SIZE + 1;
    const end = Math.min((i + 1) * STEP_SIZE, concepts.length);
    return end > start ? `Konsep ${start}-${end}` : `Konsep ${start}`;
  });

  // Get concepts for current step
  const stepConcepts = concepts.slice(activeStep * STEP_SIZE, (activeStep + 1) * STEP_SIZE);

  return (
    <PremiumStepNavigator
      labels={labels}
      activeStep={activeStep}
      onStepChange={nav.goTo}
      tokens={tokens}
      accent="c"
      isCompact={isCompact}
    >
      <div
        className="grid gap-2.5"
        style={{
          padding: isCompact ? '10px 12px' : '14px 18px',
          gridTemplateColumns: stepConcepts.length <= 1 ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
        }}
      >
        {stepConcepts.map((concept, i) => {
          const globalIndex = activeStep * STEP_SIZE + i;
          return (
            <div
              key={`rang-concept-${blockId || 'rk'}-step-${activeStep}-${i}`}
              className="rounded-xl p-3 transition-all hover:-translate-y-0.5"
              style={{
                background: tokens.colorAlpha(concept.color, 0.08),
                border: `1px solid ${tokens.colorAlpha(concept.color, 0.2)}`,
                borderLeft: `4px solid ${tokens.color(concept.color)}`,
                borderRadius: tokens.radius('xl') + 'px',
                boxShadow: tokens.raw.shadow.card,
              }}
            >
              {/* Icon + Title row */}
              <div className="flex items-center gap-2 mb-2">
                {concept.icon && (
                  <span className="flex-shrink-0" style={{ fontSize: isCompact ? '14px' : '18px' }}>
                    {concept.icon}
                  </span>
                )}
                <div
                  className="font-extrabold min-w-0"
                  style={{
                    color: tokens.color(concept.color),
                    fontSize: isCompact ? '11px' : '13px',
                    wordBreak: 'break-word',
                  }}
                >
                  {concept.title}
                </div>
              </div>

              {/* Body text */}
              <div
                className="leading-relaxed"
                style={{
                  fontSize: isCompact ? '10px' : '12px',
                  color: tokens.muted(0.85),
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {concept.body}
              </div>

              {/* Subtle check indicator */}
              <div
                className="flex items-center gap-1 mt-2 pt-2"
                style={{
                  borderTop: `1px solid ${tokens.colorAlpha(concept.color, 0.12)}`,
                }}
              >
                <CheckCircle2 size={9} style={{ color: tokens.colorAlpha(concept.color, 0.5) }} />
                <span
                  className="font-bold"
                  style={{
                    fontSize: isCompact ? '8px' : '9px',
                    color: tokens.colorAlpha(concept.color, 0.5),
                    letterSpacing: '0.05em',
                  }}
                >
                  Konsep {globalIndex + 1}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </PremiumStepNavigator>
  );
}

export function RangkumanRenderer({ block, tokens, isCompact, isEditing }: {
  block: RangkumanBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
}) {
  const accentColor = block.accentColor || 'c';
  const accent = tokens.color(accentColor);
  const accentAlpha = (a: number) => tokens.colorAlpha(accentColor, a);

  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });

  const concepts = block.concepts || [];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: tokens.color('card'),
        boxShadow: tokens.raw.shadow.elevated,
        border: `1px solid ${accentAlpha(0.15)}`,
        animation: 'fadeIn 0.4s ease',
      }}
    >
      {/* ═══ HEADER ══════════════════════════════════════════════ */}
      <div
        style={{
          borderLeft: `4px solid ${accent}`,
          background: `linear-gradient(135deg, ${accentAlpha(0.1)}, ${accentAlpha(0.03)})`,
          padding: isCompact ? '10px 12px' : '14px 18px',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: accentAlpha(0.15),
                border: `1px solid ${accentAlpha(0.3)}`,
              }}
            >
              <BookOpen size={16} style={{ color: accent }} />
            </div>
            <h2
              className="font-black leading-tight min-w-0"
              style={{
                fontFamily: tokens.fontFamily('display'),
                fontSize: isCompact ? '14px' : '1.2rem',
                color: tokens.color('text'),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              <InlineTextEditor
                {...titleEditor}
                className="font-black leading-tight"
                style={{ fontSize: 'inherit', fontFamily: 'inherit', color: 'inherit', wordBreak: 'break-word' }}
              />
            </h2>
          </div>

          {block.bsnpRequired && (
            <div
              className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full font-extrabold uppercase"
              style={{
                background: `linear-gradient(135deg, ${tokens.color('y')}, ${tokens.colorAlpha('y', 0.8)})`,
                color: tokens.color('bg'),
                fontSize: isCompact ? '7px' : '8px',
                letterSpacing: '0.1em',
                boxShadow: `0 2px 8px ${tokens.colorAlpha('y', 0.35)}`,
              }}
            >
              <Shield size={isCompact ? 8 : 10} />
              <span>WAJIB</span>
            </div>
          )}
        </div>

        {/* Decorative gradient line */}
        <div
          className="mt-3 h-1 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${accent}, ${accentAlpha(0.3)}, transparent)`,
          }}
        />
      </div>

      {/* ═══ CONCEPT CARDS ═══════════════════════════════════════ */}
      {concepts.length > 2 ? (
        <RangkumanStepMode
          concepts={concepts}
          blockId={block.id}
          tokens={tokens}
          isCompact={isCompact}
        />
      ) : (
        <div
          className="grid gap-2.5"
          style={{
            padding: isCompact ? '10px 12px' : '14px 18px',
            gridTemplateColumns: concepts.length <= 2 ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
          }}
        >
          {concepts.map((concept, i) => (
            <div
              key={`rang-concept-${block.id || 'rk'}-${i}`}
              className="rounded-xl p-3 transition-all hover:-translate-y-0.5"
              style={{
                background: tokens.colorAlpha(concept.color, 0.08),
                border: `1px solid ${tokens.colorAlpha(concept.color, 0.2)}`,
                borderLeft: `4px solid ${tokens.color(concept.color)}`,
                borderRadius: tokens.radius('xl') + 'px',
                boxShadow: tokens.raw.shadow.card,
              }}
            >
              {/* Icon + Title row */}
              <div className="flex items-center gap-2 mb-2">
                {concept.icon && (
                  <span className="flex-shrink-0" style={{ fontSize: isCompact ? '14px' : '18px' }}>
                    {concept.icon}
                  </span>
                )}
                <div
                  className="font-extrabold min-w-0"
                  style={{
                    color: tokens.color(concept.color),
                    fontSize: isCompact ? '11px' : '13px',
                    wordBreak: 'break-word',
                  }}
                >
                  {concept.title}
                </div>
              </div>

              {/* Body text */}
              <div
                className="leading-relaxed"
                style={{
                  fontSize: isCompact ? '10px' : '12px',
                  color: tokens.muted(0.85),
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {concept.body}
              </div>

              {/* Subtle check indicator */}
              <div
                className="flex items-center gap-1 mt-2 pt-2"
                style={{
                  borderTop: `1px solid ${tokens.colorAlpha(concept.color, 0.12)}`,
                }}
              >
                <CheckCircle2 size={9} style={{ color: tokens.colorAlpha(concept.color, 0.5) }} />
                <span
                  className="font-bold"
                  style={{
                    fontSize: isCompact ? '8px' : '9px',
                    color: tokens.colorAlpha(concept.color, 0.5),
                    letterSpacing: '0.05em',
                  }}
                >
                  Konsep {i + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ CLOSING STATEMENT ═══════════════════════════════════ */}
      {block.closingStatement && (
        <div
          style={{
            margin: isCompact ? '0 12px 12px' : '0 18px 16px',
            padding: isCompact ? '10px 14px' : '14px 18px',
            background: `linear-gradient(135deg, ${accentAlpha(0.1)}, ${accentAlpha(0.05)})`,
            border: `1px solid ${accentAlpha(0.2)}`,
            borderRadius: tokens.radius('xl') + 'px',
            borderLeft: `4px solid ${accent}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative sparkle */}
          <div
            className="absolute top-2 right-3"
            style={{ animation: 'float 3s ease-in-out infinite', opacity: 0.2 }}
          >
            <Sparkles size={isCompact ? 12 : 16} style={{ color: accent }} />
          </div>

          <div className="flex items-start gap-2.5 relative">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: accentAlpha(0.2),
              }}
            >
              <CheckCircle2 size={12} style={{ color: accent }} />
            </div>
            <p
              className="leading-relaxed italic"
              style={{
                fontSize: isCompact ? '11px' : '13px',
                color: tokens.color('text'),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {block.closingStatement}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
