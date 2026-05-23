'use client';

import React, { useState, useCallback } from 'react';
import { Shield, BookOpen, CheckCircle2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { RangkumanBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { RichText } from './RichText';
import { PremiumBlockWrapper, ReadingProgressIndicator } from './PremiumBlockEffects';
import { PremiumStepNavigator, usePremiumStepNavigator } from './PremiumStepNavigator';
import { playSound } from '@/lib/sounds';

import { useCanvaStore } from '../../../store/canva/store';
import { useBlockCompression } from '../../layout/useBlockCompression';
import { ShowMoreButton } from '../../layout/ShowMoreButton';
import type { CompressionDecision } from '../../layout/CompressionEngine';

// ═══════════════════════════════════════════════════════════════════
// RANGKUMAN RENDERER — BSNP Summary / Reinforcement Block
// ═══════════════════════════════════════════════════════════════════
// Provides a visual summary of key concepts at the end of a lesson
// section. BSNP recommends reinforcement/penguatan to consolidate
// learning before moving to evaluation.
//
// Variants:
//   A "Klasik" — Current card grid style with colored concept cards
//   B "Kreatif" — Timeline/stepper style: vertical line on left,
//                 concept cards as timeline nodes with numbered circles.
//   C "Ringkas" — Accordion style: concept titles as clickable headers,
//                 bodies expand on click. Only one open at a time.
//
// Step Mode: When concepts > 2, uses PremiumStepNavigator.
// All text/labels in Indonesian (Bahasa Indonesia).
// ═══════════════════════════════════════════════════════════════════

// ── Variant Selector ─────────────────────────────────────────────
function VariantSelector({
  active,
  onChange,
}: {
  active: 'A' | 'B' | 'C';
  onChange: (v: 'A' | 'B' | 'C') => void;
}) {
  const variants: Array<{ key: 'A' | 'B' | 'C'; label: string }> = [
    { key: 'A', label: 'Klasik' },
    { key: 'B', label: 'Kreatif' },
    { key: 'C', label: 'Ringkas' },
  ];

  return (
    <div className="variant-selector">
      {variants.map((v) => (
        <button
          key={v.key}
          className={`variant-pill ${active === v.key ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onChange(v.key); }}
          aria-label={`Varian ${v.label}`}
          title={`Varian ${v.label}`}
          type="button"
        >
          {v.key}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIANT A "Klasik" — Original concept cards
// ═══════════════════════════════════════════════════════════════════

function RangkumanConceptCardA({ concept, index, tokens, isCompact }: {
  concept: RangkumanBlock['concepts'][number];
  index: number;
  tokens: TokenResolver;
  isCompact: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3 transition-[transform,background-color,border-color,box-shadow] hover:-translate-y-0.5"
      style={{
        background: tokens.colorAlpha(concept.color, 0.08),
        border: `1px solid ${tokens.colorAlpha(concept.color, 0.2)}`,
        borderLeft: `4px solid ${tokens.color(concept.color)}`,
        borderRadius: tokens.radius('xl') + 'px',
        boxShadow: tokens.raw.shadow.card,
        ...tokens.iosEntranceStyle(index, 'slideIn'),
        ...tokens.iosTransitionStyle('background-color, border-color, color, transform, box-shadow', 'fast'),
      }}
    >
      {/* Icon + Title row */}
      <div className="flex items-center gap-2 mb-2">
        {concept.icon && (
          <span className="flex-shrink-0" style={{ fontSize: isCompact ? '14px' : '18px' }}>
            {concept.icon}
          </span>
        )}
        <RichText content={concept.title ?? ''}
          className="font-extrabold min-w-0"
          style={{
            color: tokens.color(concept.color),
            fontSize: isCompact ? '11px' : '13px',
            wordBreak: 'break-word',
          }}
        />
      </div>

      {/* Body text */}
        <RichText content={concept.body ?? ''}
          className="leading-relaxed"
          style={{
            fontSize: isCompact ? '12px' : '12px',
            color: tokens.muted(0.85),
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        />

      {/* Subtle check indicator */}
      <div
        className="flex items-center gap-1 mt-2 pt-2"
        style={{
          borderTop: `1px solid ${tokens.colorAlpha(concept.color, 0.12)}`,
        }}
      >
        <CheckCircle2 size={9} style={{ color: tokens.colorAlpha(concept.color, 0.65) }} />
        <span
          className="font-bold"
          style={{
            fontSize: isCompact ? '11px' : '11px',
            color: tokens.colorAlpha(concept.color, 0.65),
            letterSpacing: '0.05em',
          }}
        >
          Konsep {index + 1}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIANT B "Kreatif" — Timeline/stepper style
// ═══════════════════════════════════════════════════════════════════

function RangkumanConceptCardB({ concept, index, isLast, tokens, isCompact }: {
  concept: RangkumanBlock['concepts'][number];
  index: number;
  isLast: boolean;
  tokens: TokenResolver;
  isCompact: boolean;
}) {
  const conceptColor = tokens.color(concept.color);

  return (
    <div
      className="flex gap-3"
      style={{
        position: 'relative',
        ...tokens.iosEntranceStyle(index, 'slideIn'),
      }}
    >
      {/* Timeline column: vertical line + numbered circle */}
      <div
        className="flex flex-col items-center flex-shrink-0"
        style={{ width: isCompact ? '28px' : '36px' }}
      >
        {/* Numbered circle node */}
        <div
          style={{
            width: isCompact ? '24px' : '32px',
            height: isCompact ? '24px' : '32px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${conceptColor}, ${tokens.colorAlpha(concept.color, 0.7)})`,
            boxShadow: `0 2px 10px ${tokens.colorAlpha(concept.color, 0.3)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isCompact ? '10px' : '12px',
            fontWeight: 900,
            color: tokens.color('bg'),
            zIndex: 1,
            flexShrink: 0,
          }}
        >
          {index + 1}
        </div>

        {/* Vertical connecting line */}
        {!isLast && (
          <div
            style={{
              width: '2px',
              flex: 1,
              minHeight: isCompact ? '16px' : '24px',
              background: `linear-gradient(180deg, ${conceptColor}, ${tokens.colorAlpha(concept.color, 0.2)})`,
              borderRadius: '1px',
            }}
          />
        )}
      </div>

      {/* Content card */}
      <div
        style={{
          flex: 1,
          background: tokens.colorAlpha(concept.color, 0.06),
          border: `1px solid ${tokens.colorAlpha(concept.color, 0.15)}`,
          borderRadius: tokens.radius('xl') + 'px',
          ...tokens.iosCardPadding(isCompact),
          boxShadow: tokens.raw.shadow.card,
          ...tokens.iosTransitionStyle('background-color, border-color, color', 'fast'),
          marginBottom: isLast ? 0 : (isCompact ? '6px' : '10px'),
        }}
      >
        {/* Title row */}
        <div className="flex items-center gap-2 mb-1.5">
          {concept.icon && (
            <span className="flex-shrink-0" style={{ fontSize: isCompact ? '13px' : '16px' }}>
              {concept.icon}
            </span>
          )}
          <RichText content={concept.title ?? ''}
            className="font-extrabold min-w-0"
            style={{
              color: conceptColor,
              fontSize: isCompact ? '11px' : '13px',
              wordBreak: 'break-word',
            }}
          />
        </div>

        {/* Body text */}
        <RichText content={concept.body ?? ''}
          className="leading-relaxed"
          style={{
            fontSize: isCompact ? '12px' : '12px',
            color: tokens.muted(0.85),
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: 1.6,
          }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIANT C "Ringkas" — Accordion style (one open at a time)
// ═══════════════════════════════════════════════════════════════════

function RangkumanAccordionGroup({ concepts, tokens, isCompact }: {
  concepts: RangkumanBlock['concepts'];
  tokens: TokenResolver;
  isCompact: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {concepts.map((concept, i) => {
        const isOpen = openIndex === i;
        const conceptColor = tokens.color(concept.color);

        return (
          <div
            key={`rang-accordion-${i}`}
            style={{
              borderRadius: tokens.radius('xl') + 'px',
              border: `1px solid ${isOpen ? tokens.colorAlpha(concept.color, 0.3) : tokens.colorAlpha(concept.color, 0.12)}`,
              background: isOpen ? tokens.colorAlpha(concept.color, 0.08) : tokens.colorAlpha(concept.color, 0.03),
              overflow: 'hidden',
              ...tokens.iosEntranceStyle(i, 'slideIn'),
              ...tokens.iosTransitionStyle('background-color, border-color, color', 'fast'),
            }}
          >
            {/* Accordion header */}
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className={tokens.iosAccordionTw()}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: isCompact ? '8px' : '10px',
                ...tokens.iosNestedPadding(isCompact),
                background: 'none',
                border: 'none',
                textAlign: 'left',
                color: 'inherit',
                fontSize: 'inherit',
                fontFamily: 'inherit',
              }}
              aria-expanded={isOpen}
              aria-controls={`rangkuman-panel-${i}`}
            >
              {/* Numbered badge */}
              <div
                className="flex-shrink-0"
                style={{
                  width: isCompact ? '20px' : '24px',
                  height: isCompact ? '20px' : '24px',
                  borderRadius: '50%',
                  background: isOpen
                    ? `linear-gradient(135deg, ${conceptColor}, ${tokens.colorAlpha(concept.color, 0.7)})`
                    : tokens.colorAlpha(concept.color, 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isCompact ? '11px' : '11px',
                  fontWeight: 900,
                  color: isOpen ? tokens.color('bg') : conceptColor,
                  ...tokens.iosTransitionStyle('background-color, border-color, color, transform', 'fast'),
                }}
              >
                {i + 1}
              </div>

              {/* Icon */}
              {concept.icon && (
                <span className="flex-shrink-0" style={{ fontSize: isCompact ? '12px' : '15px' }}>
                  {concept.icon}
                </span>
              )}

              {/* Title */}
              <span
                className="font-bold min-w-0 flex-1"
                style={{
                  color: isOpen ? conceptColor : tokens.color('text'),
                  fontSize: isCompact ? '12px' : '13px',
                  wordBreak: 'break-word',
                }}
              >
                <RichText content={concept.title ?? ''} />
              </span>

              {/* Expand/collapse icon */}
              <div className="flex-shrink-0" style={{ color: conceptColor, opacity: 0.6 }}>
                {isOpen ? <ChevronUp size={isCompact ? 12 : 14} /> : <ChevronDown size={isCompact ? 12 : 14} />}
              </div>
            </button>

            {/* Accordion body */}
            {isOpen && (
              <div
                id={`rangkuman-panel-${i}`}
                role="region"
                style={{
                  ...tokens.iosContentPadding(isCompact), paddingTop: 0,
                  paddingLeft: isCompact ? '42px' : '52px',
                  animation: 'fadeIn 0.25s ease',
                }}
              >
                <RichText content={concept.body ?? ''}
                  className="leading-relaxed"
                  style={{
                    fontSize: isCompact ? '12px' : '12px',
                    color: tokens.muted(0.85),
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    lineHeight: 1.6,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CONCEPT RENDERER FACTORY — dispatches to correct variant
// ═══════════════════════════════════════════════════════════════════

function RangkumanConceptList({ concepts, variant, tokens, isCompact }: {
  concepts: RangkumanBlock['concepts'];
  variant: 'A' | 'B' | 'C';
  tokens: TokenResolver;
  isCompact: boolean;
}) {
  // Variant C — Accordion (has its own internal state)
  if (variant === 'C') {
    return <RangkumanAccordionGroup concepts={concepts} tokens={tokens} isCompact={isCompact} />;
  }

  // Variant A — Grid of concept cards
  if (variant === 'A') {
    return (
      <div
        className="grid gap-2.5"
        style={{
          ...tokens.iosCardPadding(isCompact),
          gridTemplateColumns: isCompact ? '1fr' : (concepts.length <= 2 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))'),
        }}
      >
        {concepts.map((concept, i) => (
          <RangkumanConceptCardA
            key={`rang-a-${i}`}
            concept={concept}
            index={i}
            tokens={tokens}
            isCompact={isCompact}
          />
        ))}
      </div>
    );
  }

  // Variant B — Timeline
  return (
    <div
      style={{
        ...tokens.iosCardPadding(isCompact),
      }}
    >
      {concepts.map((concept, i) => (
        <RangkumanConceptCardB
          key={`rang-b-${i}`}
          concept={concept}
          index={i}
          isLast={i === concepts.length - 1}
          tokens={tokens}
          isCompact={isCompact}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STEP MODE SUB-COMPONENT — PremiumStepNavigator wrapper
// ═══════════════════════════════════════════════════════════════════

function RangkumanStepMode({ concepts, tokens, isCompact, variant, onComplete }: {
  concepts: RangkumanBlock['concepts'];
  tokens: TokenResolver;
  isCompact: boolean;
  variant: 'A' | 'B' | 'C';
  onComplete?: () => void;
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
      onComplete={onComplete}
    >
      <RangkumanConceptList
        concepts={stepConcepts}
        variant={variant}
        tokens={tokens}
        isCompact={isCompact}
      />
    </PremiumStepNavigator>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT — RangkumanRenderer
// ═══════════════════════════════════════════════════════════════════

export const RangkumanRenderer = React.memo(function RangkumanRenderer({ block, tokens, isCompact, isEditing, interactive = true, mode, compression }: {
  block: RangkumanBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; interactive?: boolean; mode?: import('../types').SchemaRenderMode; compression?: CompressionDecision;
}) {
  const accentColor = block.accentColor || 'c';
  const accent = tokens.color(accentColor);
  const accentAlpha = (a: number) => tokens.colorAlpha(accentColor, a);

  const variant: 'A' | 'B' | 'C' = (block.variant as 'A' | 'B' | 'C') || 'A';

  const updateSchemaBlock = useCanvaStore((s) => s.updateSchemaBlock);
  const handleVariantChange = useCallback((v: 'A' | 'B' | 'C') => {
    if (block.id) updateSchemaBlock(block.id, { variant: v });
  }, [block.id, updateSchemaBlock]);

  // ── Step completion tracking ──
  const [allStepsCompleted, setAllStepsCompleted] = useState(false);

  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });

  const allConcepts = block.concepts || [];

  // ── Compression-aware concept visibility ──────────────────────
  // When engine decides compression is needed, show fewer concepts
  const { visibleCount, hasMore, hiddenCount, showMore, isCompressed } = useBlockCompression({
    compression,
    totalItems: allConcepts.length,
  });
  const concepts = isCompressed ? allConcepts.slice(0, visibleCount) : allConcepts;

  // ── Fire celebration when all concepts reviewed ──
  const handleStepComplete = React.useCallback(() => {
    setAllStepsCompleted(true);
    if (interactive) {
      playSound('complete');
    }
  }, [interactive]);

  return (
    <PremiumBlockWrapper tokens={tokens} accent={accentColor} staggerIndex={0}>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent={accentColor} height={2} position="top" />
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: tokens.color('card'),
        boxShadow: tokens.raw.shadow.elevated,
        border: `1px solid ${accentAlpha(0.15)}`,
        animation: 'fadeIn 0.4s ease',
        position: 'relative',
      }}
    >
      {/* Variant selector (editing mode only) */}
      {isEditing && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 45 }}>
          <VariantSelector active={variant} onChange={handleVariantChange} />
        </div>
      )}

      {/* ═══ HEADER ══════════════════════════════════════════════ */}
      <div
        style={{
          borderLeft: variant === 'B' ? 'none' : `4px solid ${accent}`,
          background: `linear-gradient(135deg, ${accentAlpha(0.1)}, ${accentAlpha(0.03)})`,
          ...tokens.iosCardPadding(isCompact),
          position: 'relative',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {variant === 'B' ? (
              /* Timeline variant: numbered journey badge */
              <div
                className="flex-shrink-0"
                style={{
                  width: isCompact ? '30px' : '36px',
                  height: isCompact ? '30px' : '36px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${accent}, ${accentAlpha(0.7)})`,
                  boxShadow: `0 3px 12px ${accentAlpha(0.3)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={isCompact ? 13 : 16} style={{ color: tokens.color('bg') }} />
              </div>
            ) : (
              /* Default: rounded icon box */
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: accentAlpha(0.15),
                  border: `1px solid ${accentAlpha(0.3)}`,
                }}
              >
                <BookOpen size={16} style={{ color: accent }} />
              </div>
            )}
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold" style={{ fontSize: '9px', background: tokens.accentBg('y', 0.1), color: tokens.color('y'), border: `1px solid ${tokens.colorAlpha('y', 0.2)}` }}>
              <Shield size={isCompact ? 8 : 10} /> WAJIB
            </span>
          )}
        </div>

        {/* Decorative gradient line */}
        <div
          className="mt-3 h-1 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${accent}, ${accentAlpha(0.3)}, transparent)`,
          }}
        />

        {/* Variant B: subtle journey hint */}
        {variant === 'B' && (
          <div
            className="mt-2 font-bold"
            style={{
              fontSize: isCompact ? '11px' : '11px',
              color: accentAlpha(0.5),
              letterSpacing: '0.05em',
            }}
          >
            Perjalanan Belajar — {concepts.length} Konsep
          </div>
        )}

        {/* Variant C: accordion hint */}
        {variant === 'C' && (
          <div
            className="mt-2 font-bold"
            style={{
              fontSize: isCompact ? '11px' : '11px',
              color: accentAlpha(0.5),
              letterSpacing: '0.05em',
            }}
          >
            Ketuk untuk membuka konsep
          </div>
        )}
      </div>

      {/* ═══ CONCEPT CARDS ═══════════════════════════════════════ */}
      {concepts.length > 2 ? (
        <RangkumanStepMode
          concepts={concepts}
          tokens={tokens}
          isCompact={isCompact}
          variant={variant}
          onComplete={handleStepComplete}
        />
      ) : (
        <RangkumanConceptList
          concepts={concepts}
          variant={variant}
          tokens={tokens}
          isCompact={isCompact}
        />
      )}

      {/* ═══ COMPRESSION: Show More button ════════════════════════ */}
      {hasMore && (
        <div style={{ ...tokens.iosInnerMargin(isCompact) }}>
          <ShowMoreButton
            hiddenCount={hiddenCount}
            onShowMore={showMore}
            itemLabel="konsep lainnya"
            isCompact={isCompact}
            tokens={tokens}
          />
        </div>
      )}

      {/* ═══ CLOSING STATEMENT ═══════════════════════════════════ */}
      {block.closingStatement && (
        <div
          style={{
            ...tokens.iosInnerMargin(isCompact), marginTop: 0,
            ...tokens.iosCardPadding(isCompact),
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
            <RichText content={block.closingStatement ?? ''}
              tag="p"
              className="leading-relaxed italic"
              style={{
                fontSize: isCompact ? '12px' : '13px',
                color: tokens.color('text'),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            />
          </div>
        </div>
      )}
    </div>

    </PremiumBlockWrapper>
  );
});
