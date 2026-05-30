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
  const edu = tokens.edu('rangkuman', isCompact);
  return (
    <div
      className="rounded-xl p-3 transition-[transform,background-color,border-color,box-shadow] hover:-translate-y-0.5"
      style={{
        background: tokens.colorAlpha(concept.color, 0.08),
        border: `1px solid ${tokens.colorAlpha(concept.color, 0.2)}`,
        borderLeft: `${edu.stripeWidth()}px solid ${tokens.color(concept.color)}`,
        borderRadius: tokens.radius('xl') + 'px',
        boxShadow: edu.shadow('card'),
        ...edu.entrance(index, 'slideUp'),
        ...edu.transition('background-color, border-color, color, transform, box-shadow', 'fast'),
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
            ...edu.bodyLg(),
            fontWeight: 700,
            color: tokens.color(concept.color),
            wordBreak: 'break-word',
          }}
        />
      </div>

      {/* Body text */}
        <RichText content={concept.body ?? ''}
          className="leading-relaxed"
          style={{
            ...edu.body(),
            color: edu.mutedText(0.85),
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
        <span className="material-symbols-outlined" style={ { fontSize: '9px' } }>check_circle</span>
        <span
          className="font-bold"
          style={{
            ...edu.micro(),
            color: tokens.colorAlpha(concept.color, 0.65),
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
  const edu = tokens.edu('rangkuman', isCompact);
  const conceptColor = tokens.color(concept.color);

  return (
    <div
      className="flex gap-3"
      style={{
        position: 'relative',
        ...edu.entrance(index, 'slideUp'),
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
            ...edu.micro(),
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
          ...edu.componentPadding(),
          boxShadow: edu.shadow('card'),
          ...edu.transition('background-color, border-color, color', 'fast'),
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
              ...edu.bodyLg(),
              fontWeight: 700,
              color: conceptColor,
              wordBreak: 'break-word',
            }}
          />
        </div>

        {/* Body text */}
        <RichText content={concept.body ?? ''}
          className="leading-relaxed"
          style={{
            ...edu.body(),
            color: edu.mutedText(0.85),
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
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
  const edu = tokens.edu('rangkuman', isCompact);
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
              ...edu.entrance(i, 'slideUp'),
              ...edu.transition('background-color, border-color, color', 'fast'),
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
                ...edu.nestedPadding(),
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
                  ...edu.micro(),
                  fontWeight: 900,
                  color: isOpen ? tokens.color('bg') : conceptColor,
                  ...edu.transition('background-color, border-color, color, transform', 'fast'),
                }}
              >
                {i + 1}
              </div>

              {/* Icon */}
              {concept.icon && (
                <span className="flex-shrink-0" style={{ fontSize: edu.body().fontSize }}>
                  {concept.icon}
                </span>
              )}

              {/* Title */}
              <span
                className="font-bold min-w-0 flex-1"
                style={{
                  ...edu.bodyLg(),
                  fontWeight: 700,
                  color: isOpen ? conceptColor : edu.textColor(),
                  wordBreak: 'break-word',
                }}
              >
                <RichText content={concept.title ?? ''} />
              </span>

              {/* Expand/collapse icon */}
              <div className="flex-shrink-0" style={{ color: conceptColor, opacity: 0.6 }}>
                {isOpen ? <span className="material-symbols-outlined" style={ { fontSize: '16px' } }>expand_less</span> : <span className="material-symbols-outlined" style={ { fontSize: '16px' } }>expand_more</span>}
              </div>
            </button>

            {/* Accordion body */}
            {isOpen && (
              <div
                id={`rangkuman-panel-${i}`}
                role="region"
                style={{
                  ...edu.sectionPadding(), paddingTop: 0,
                  paddingLeft: isCompact ? '42px' : '52px',
                  animation: 'fadeIn 0.25s ease',
                }}
              >
                <RichText content={concept.body ?? ''}
                  className="leading-relaxed"
                  style={{
                    ...edu.body(),
                    color: edu.mutedText(0.85),
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
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
  const edu = tokens.edu('rangkuman', isCompact);
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
          ...edu.componentPadding(),
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
        ...edu.componentPadding(),
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
  const edu = tokens.edu('rangkuman', isCompact);

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
        background: edu.cardBg(),
        boxShadow: edu.shadow('elevated'),
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
          borderLeft: variant === 'B' ? 'none' : `${edu.stripeWidth()}px solid ${accent}`,
          background: `linear-gradient(135deg, ${accentAlpha(0.1)}, ${accentAlpha(0.03)})`,
          ...edu.componentPadding(),
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
                <span className="material-symbols-outlined" style={ { fontSize: '16px' } }>menu_book</span>
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
                <span className="material-symbols-outlined" style={ { fontSize: '16px' } }>menu_book</span>
              </div>
            )}
            <h2
              className="font-black leading-tight min-w-0"
              style={{
                ...edu.heading(),
                color: edu.textColor(),
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold" style={{ ...edu.micro(), background: tokens.accentBg('y', 0.1), color: tokens.color('y'), border: `1px solid ${tokens.colorAlpha('y', 0.2)}` }}>
              <span className="material-symbols-outlined" style={ { fontSize: '16px' } }>shield</span> WAJIB
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
              ...edu.caption(),
              color: accentAlpha(0.5),
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
              ...edu.caption(),
              color: accentAlpha(0.5),
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
            ...edu.componentPadding(),
            background: `linear-gradient(135deg, ${accentAlpha(0.1)}, ${accentAlpha(0.05)})`,
            border: `1px solid ${accentAlpha(0.2)}`,
            borderRadius: tokens.radius('xl') + 'px',
            borderLeft: `${edu.stripeWidth()}px solid ${accent}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative sparkle */}
          <div
            className="absolute top-2 right-3"
            style={{ animation: 'float 3s ease-in-out infinite', opacity: 0.2 }}
          >
            <span className="material-symbols-outlined" style={ { fontSize: '16px' } }>auto_awesome</span>
          </div>

          <div className="flex items-start gap-2.5 relative">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: accentAlpha(0.2),
              }}
            >
              <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>check_circle</span>
            </div>
            <RichText content={block.closingStatement ?? ''}
              tag="p"
              className="leading-relaxed italic"
              style={{
                ...edu.body(),
                color: edu.textColor(),
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
