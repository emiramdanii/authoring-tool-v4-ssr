'use client';

import React, { useState, useCallback } from 'react';
import type { NcGridBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { PremiumBlockWrapper } from './PremiumBlockEffects';
import { PremiumStepNavigator, usePremiumStepNavigator } from './PremiumStepNavigator';
import type { CompressionDecision } from '../../layout/CompressionEngine';
import { useBlockCompression } from '../../layout/useBlockCompression';
import { useCanvaStore } from '../../../store/canva/store';

// ═══════════════════════════════════════════════════════════════════
// NC GRID RENDERER — BSNP Norma Card Grid with Creative Variants
// ═══════════════════════════════════════════════════════════════════
// Variants:
//   A "Klasik" — Current card grid style (colored cards with icon, title, body)
//   B "Kreatif" — Magazine-style horizontal cards (full-width rows, icon on left,
//                 text on right, gradient accent bar on left side)
//   C "Ringkas" — Minimal pill badges: small horizontal pill with icon + title only.
//                 Body text hidden behind hover/expand.
//
// Step Mode: When cards > 2, uses PremiumStepNavigator (2 cards per step).
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
          className={`variant-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent ${active === v.key ? 'active' : ''}`}
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

// ── Variant A "Klasik" — Original card grid ──────────────────────
function NcGridCardA({ card, cardIndex, blockId, tokens, isCompact, interactive }: {
  card: NcGridBlock['cards'][number];
  cardIndex: number;
  blockId: string;
  tokens: TokenResolver;
  isCompact: boolean;
  interactive?: boolean;
}) {
  const edu = tokens.edu('nc-grid', isCompact);
  const [expanded, setExpanded] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const titleEditor = useInlineEditor({
    blockId,
    fieldKey: `cards.${cardIndex}.title`,
    value: card.title ?? '',
    tag: 'span',
  });
  const bodyEditor = useInlineEditor({
    blockId,
    fieldKey: `cards.${cardIndex}.body`,
    value: card.body ?? '',
    tag: 'div',
    multiline: true,
    allowHtml: true,  // NcGrid body may contain <strong>, <em> from schema
  });

  const cardColor = tokens.color(card.color);
  const cardBg = tokens.colorAlpha(card.color, 0.1);
  const cardBorder = tokens.colorAlpha(card.color, 0.25);
  const bodyText = card.body || '';
  const isLong = bodyText.length > 80;

  return (
    <div className={`rounded-xl border ${tokens.iosCardTw()} min-w-0 group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: cardBg,
        borderColor: cardBorder,
        borderRadius: tokens.radius('xl') + 'px',
        boxShadow: edu.shadow('card'),
        ...edu.componentPadding(),
        overflow: 'hidden',
        position: 'relative',
        ...edu.entrance(cardIndex),
        ...tokens.iosHoverBgStyle(isHovered, 0.03),
      }}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ background: cardColor }} />

      <div className="flex items-center gap-2.5 mb-2 min-w-0">
        <div className="rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            ...tokens.iosIconSize('md'),
            background: tokens.colorAlpha(card.color, 0.2),
            boxShadow: 'none',
          }}>
          <span style={{ fontSize: isCompact ? '16px' : '20px' }}>{card.icon}</span>
        </div>
        <InlineTextEditor
          {...titleEditor}
          className="font-extrabold min-w-0"
          style={{ ...edu.bodyLg(), fontWeight: 700, color: cardColor, wordBreak: 'break-word', overflowWrap: 'break-word' }}
        />
      </div>
      <InlineTextEditor
        {...bodyEditor}
        className={`leading-relaxed ${isCompact ? 'line-clamp-3' : ''}`}
        style={{ ...edu.body(), color: edu.mutedText(0.85), wordBreak: 'break-word', overflowWrap: 'break-word' }}
        placeholder="Ketik deskripsi kartu..."
        allowHtml={true}
      />
      {/* Expand toggle for long text in compact mode */}
      {isLong && isCompact && (
        <button className={`mt-1 font-bold ${tokens.iosExpandTw()}`}
          style={{ ...edu.caption(), color: cardColor }}
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          aria-expanded={expanded}>
          {expanded ? 'Sembunyikan ↑' : 'Selengkapnya ↓'}
        </button>
      )}
    </div>
  );
}

// ── Variant B "Kreatif" — Magazine-style horizontal cards ────────
function NcGridCardB({ card, cardIndex, blockId, tokens, isCompact, interactive }: {
  card: NcGridBlock['cards'][number];
  cardIndex: number;
  blockId: string;
  tokens: TokenResolver;
  isCompact: boolean;
  interactive?: boolean;
}) {
  const edu = tokens.edu('nc-grid', isCompact);
  const [expanded, setExpanded] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const titleEditor = useInlineEditor({
    blockId,
    fieldKey: `cards.${cardIndex}.title`,
    value: card.title ?? '',
    tag: 'span',
  });
  const bodyEditor = useInlineEditor({
    blockId,
    fieldKey: `cards.${cardIndex}.body`,
    value: card.body ?? '',
    tag: 'div',
    multiline: true,
    allowHtml: true,  // NcGrid body may contain <strong>, <em> from schema
  });

  const cardColor = tokens.color(card.color);
  const cardBg = tokens.colorAlpha(card.color, 0.06);
  const cardBorder = tokens.colorAlpha(card.color, 0.2);
  const bodyText = card.body || '';
  const isLong = bodyText.length > 120;

  return (
    <div
      className={`rounded-xl ${tokens.iosCardTw()} min-w-0 group`}
      role={isLong ? 'button' : undefined}
      tabIndex={isLong ? 0 : undefined}
      aria-expanded={isLong ? expanded : undefined}
      aria-label={isLong ? (expanded ? 'Sembunyikan' : 'Selengkapnya') : undefined}
      onKeyDown={isLong ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } } : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: cardBg,
        borderColor: cardBorder,
        border: `1px solid ${cardBorder}`,
        borderLeft: `${edu.stripeWidth()}px solid ${tokens.color(card.color)}`,
        borderRadius: tokens.radius('xl') + 'px',
        boxShadow: edu.shadow('card'),
        overflow: 'hidden',
        position: 'relative',
        ...edu.entrance(cardIndex),
        cursor: 'pointer',
        ...tokens.iosHoverBgStyle(isHovered, 0.03),
      }}
      onClick={() => { if (isLong) setExpanded(!expanded); }}
    >
      {/* Left accent stripe via borderLeft */}

      <div
        className="flex items-start gap-3"
        style={{
          ...edu.componentPadding(),
          paddingLeft: isCompact ? '16px' : '22px',
        }}
      >
        {/* Icon on the left */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            ...tokens.iosIconSize('lg'),
            borderRadius: tokens.radius('md'),
            background: tokens.colorAlpha(card.color, 0.1),
            boxShadow: 'none',
          }}
        >
          <span style={{ fontSize: isCompact ? '18px' : '24px' }}>{card.icon}</span>
        </div>

        {/* Text on the right */}
        <div className="min-w-0 flex-1">
          <InlineTextEditor
            {...titleEditor}
            className="font-extrabold min-w-0"
            style={{
              ...edu.bodyLg(),
              fontWeight: 700,
              color: cardColor,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              marginBottom: '4px',
            }}
          />
          <InlineTextEditor
            {...bodyEditor}
            className="leading-relaxed"
            style={{
              ...edu.body(),
              color: edu.mutedText(0.85),
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
            placeholder="Ketik deskripsi kartu..."
            allowHtml={true}
          />
          {/* Expand toggle for long text */}
          {isLong && (
            <button
              className={`mt-1 font-bold ${tokens.iosExpandTw()}`}
              style={{ ...edu.caption(), color: cardColor }}
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              aria-expanded={expanded}
            >
              {expanded ? 'Sembunyikan ↑' : 'Selengkapnya ↓'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Variant C "Ringkas" — Minimal pill badges ────────────────────
function NcGridCardC({ card, cardIndex, blockId, tokens, isCompact, interactive }: {
  card: NcGridBlock['cards'][number];
  cardIndex: number;
  blockId: string;
  tokens: TokenResolver;
  isCompact: boolean;
  interactive?: boolean;
}) {
  const edu = tokens.edu('nc-grid', isCompact);
  const [expanded, setExpanded] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const titleEditor = useInlineEditor({
    blockId,
    fieldKey: `cards.${cardIndex}.title`,
    value: card.title ?? '',
    tag: 'span',
  });
  const bodyEditor = useInlineEditor({
    blockId,
    fieldKey: `cards.${cardIndex}.body`,
    value: card.body ?? '',
    tag: 'div',
    multiline: true,
    allowHtml: true,  // NcGrid body may contain <strong>, <em> from schema
  });

  const cardColor = tokens.color(card.color);
  const cardBg = tokens.colorAlpha(card.color, 0.06);
  const cardBorder = tokens.colorAlpha(card.color, 0.18);
  // Sprint 3C: React-state hover instead of broken dynamic Tailwind classes
  // Tailwind cannot JIT-compile `hover:bg-[${...}]` at runtime
  const hoverBg = tokens.colorAlpha(card.color, 0.12);
  const hoverBorder = tokens.colorAlpha(card.color, 0.35);

  return (
    <div
      className={`${tokens.iosCardTw()} min-w-0 group
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent`}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={card.title || 'Kartu'}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
      style={{
        borderRadius: expanded ? tokens.radius('xl') + 'px' : '9999px',
        background: isHovered ? hoverBg : cardBg,
        border: `1px solid ${isHovered ? hoverBorder : cardBorder}`,
        ...edu.componentPadding(),
        paddingTop: isCompact ? 5 : 7,
        paddingBottom: isCompact ? 5 : 7,
        paddingLeft: isCompact ? 8 : 10,
        display: expanded ? 'flex' : 'inline-flex',
        flexDirection: expanded ? 'column' : 'row',
        alignItems: expanded ? 'flex-start' : 'center',
        gap: isCompact ? '5px' : '7px',
        cursor: 'pointer',
        ...edu.entrance(cardIndex),
        maxWidth: '100%',
        // Sprint 3C: border-radius transition for smooth pill→card morph
        ...tokens.iosTransitionStyle('background-color, border-color, border-radius', 'standard'),
      }}
      onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon circle */}
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          ...tokens.iosIconSize('sm'),
          borderRadius: '50%',
          background: tokens.colorAlpha(card.color, 0.2),
        }}
      >
        <span style={{ fontSize: isCompact ? '16px' : '18px' }}>{card.icon}</span>
      </div>

      {/* Title (always visible) */}
      <InlineTextEditor
        {...titleEditor}
        className="font-bold min-w-0"
        style={{
          ...edu.caption(),
          fontWeight: 700,
          color: cardColor,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: expanded ? 'normal' : 'nowrap',
          overflow: expanded ? 'visible' : 'hidden',
          textOverflow: expanded ? 'unset' : 'ellipsis',
        }}
      />

      {/* Body text — only visible on expand */}
      {expanded && (
        <div
          style={{
            marginTop: '4px',
            paddingTop: '4px',
            borderTop: `1px solid ${tokens.colorAlpha(card.color, 0.15)}`,
            width: '100%',
          }}
        >
          <InlineTextEditor
            {...bodyEditor}
            className="leading-relaxed"
            style={{
              ...edu.body(),
              color: edu.mutedText(0.85),
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
            placeholder="Ketik deskripsi kartu..."
            allowHtml={true}
          />
        </div>
      )}
    </div>
  );
}

// ── Card renderer factory ────────────────────────────────────────
function NcGridCardByVariant(variant: 'A' | 'B' | 'C') {
  if (variant === 'B') return NcGridCardB;
  if (variant === 'C') return NcGridCardC;
  return NcGridCardA;
}

// ── Step mode sub-component for NcGridRenderer when cards > 2 ───
function NcGridStepMode({ block, tokens, isCompact, interactive, variant }: {
  block: NcGridBlock; tokens: TokenResolver; isCompact: boolean; interactive?: boolean; variant: 'A' | 'B' | 'C';
}) {
  const cards = block.cards || [];
  const STEP_SIZE = 2;
  const totalSteps = Math.ceil(cards.length / STEP_SIZE);
  const { activeStep, ...nav } = usePremiumStepNavigator(totalSteps);
  const edu = tokens.edu('nc-grid', isCompact);

  // Build step labels: "Norma 1-2", "Norma 3-4", etc.
  const labels = Array.from({ length: totalSteps }, (_, i) => {
    const start = i * STEP_SIZE + 1;
    const end = Math.min((i + 1) * STEP_SIZE, cards.length);
    return end > start ? `Norma ${start}-${end}` : `Norma ${start}`;
  });

  // Get cards for current step
  const stepCards = cards.slice(activeStep * STEP_SIZE, (activeStep + 1) * STEP_SIZE);
  const CardComponent = NcGridCardByVariant(variant);

  // Variant B uses full-width vertical stack, C uses flex-wrap pills
  const contentStyle: React.CSSProperties = variant === 'B'
    ? { display: 'flex', flexDirection: 'column', gap: edu.gap('generous'), minWidth: 0, padding: '8px 0' }
    : variant === 'C'
      ? { display: 'flex', flexWrap: 'wrap', gap: edu.gap('tight'), minWidth: 0, padding: '8px 0' }
      : { minWidth: 0 };

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
        className={variant === 'A' ? 'grid gap-3 my-3' : ''}
        style={variant === 'A' ? { minWidth: 0, gridTemplateColumns: isCompact ? '1fr' : 'repeat(2, 1fr)' } : contentStyle}
      >
        {stepCards.map((card, i) => (
          <CardComponent
            key={`nc-card-step-${card.title?.slice(0,8)}-${activeStep}-${i}`}
            card={card}
            cardIndex={activeStep * STEP_SIZE + i}
            blockId={block.id!}
            tokens={tokens}
            isCompact={isCompact}
            interactive={interactive}
          />
        ))}
      </div>
    </PremiumStepNavigator>
  );
}

// ── Main Component ───────────────────────────────────────────────
export const NcGridRenderer = React.memo(function NcGridRenderer({ block, tokens, isCompact, isEditing, interactive, compression }: {
  block: NcGridBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; interactive?: boolean; compression?: CompressionDecision;
}) {
  const cards = block.cards || [];
  const edu = tokens.edu('nc-grid', isCompact);
  const [currentVariant, setCurrentVariant] = useState<'A' | 'B' | 'C'>(
    (block.variant as 'A' | 'B' | 'C') || 'A'
  );
  const variant = currentVariant;

  // Persist variant changes to schema (so they survive reload)
  const updateSchemaBlock = useCanvaStore((s) => s.updateSchemaBlock);
  const handleVariantChange = useCallback((v: 'A' | 'B' | 'C') => {
    setCurrentVariant(v);
    if (block.id) updateSchemaBlock(block.id, { variant: v });
  }, [block.id, updateSchemaBlock]);

  // ── Compression-aware visibility (reveal-set strategy) ───────
  const { isCompressed } = useBlockCompression({
    compression,
    totalItems: cards.length,
  });

  // Determine the card list container based on variant
  const CardComponent = NcGridCardByVariant(variant);

  // When compressed, skip step mode and show cards directly (compact variant C)
  // Step mode is hidden to save vertical space
  if (cards.length > 2 && !isCompressed) {
    return (
      <PremiumBlockWrapper tokens={tokens} accent="c" staggerIndex={0}>
      <div style={{ position: 'relative' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold"
            style={{ ...edu.micro(), background: tokens.accentBg('c', 0.08), color: tokens.color('c'), border: `1px solid ${tokens.colorAlpha('c', 0.2)}` }}>
            Norma
          </span>
        </div>
        {isEditing && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 45 }}>
            <VariantSelector active={variant} onChange={handleVariantChange} />
          </div>
        )}
        <NcGridStepMode
          block={block}
          tokens={tokens}
          isCompact={isCompact}
          interactive={interactive}
          variant={variant}
        />
      </div>
      </PremiumBlockWrapper>
    );
  }

  // Non-step mode (cards <= 2)
  const containerStyle: React.CSSProperties = variant === 'B'
    ? { display: 'flex', flexDirection: 'column', gap: edu.gap('generous'), minWidth: 0 }
    : variant === 'C'
      ? { display: 'flex', flexWrap: 'wrap', gap: edu.gap('tight'), minWidth: 0 }
      : { minWidth: 0 };

  return (
    <PremiumBlockWrapper tokens={tokens} accent="c" staggerIndex={0}>
      <div
        className={variant === 'A' ? 'grid gap-3 my-3' : 'my-3'}
        style={{ ...(variant === 'A' ? { minWidth: 0, gridTemplateColumns: isCompact ? '1fr' : 'repeat(2, 1fr)' } : containerStyle), position: 'relative' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold"
            style={{ ...edu.micro(), background: tokens.accentBg('c', 0.08), color: tokens.color('c'), border: `1px solid ${tokens.colorAlpha('c', 0.2)}` }}>
            Norma
          </span>
        </div>
        {isEditing && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 45 }}>
            <VariantSelector active={variant} onChange={handleVariantChange} />
          </div>
        )}
        {cards.map((card, i) => (
          <CardComponent
            key={`nc-card-${card.title?.slice(0,8)}-${i}`}
            card={card}
            cardIndex={i}
            blockId={block.id!}
            tokens={tokens}
            isCompact={isCompact}
            interactive={interactive}
          />
        ))}
      </div>
    </PremiumBlockWrapper>
  );
});