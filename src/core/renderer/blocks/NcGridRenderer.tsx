'use client';

import React from 'react';
import type { NcGridBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { PremiumStepNavigator, usePremiumStepNavigator } from './PremiumStepNavigator';

/** Inner card component so hooks are not called in loops */
function NcGridCard({ card, cardIndex, blockId, tokens, isCompact, interactive }: {
  card: NcGridBlock['cards'][number];
  cardIndex: number;
  blockId: string;
  tokens: TokenResolver;
  isCompact: boolean;
  interactive?: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
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
  });

  const cardColor = tokens.color(card.color);
  const cardBg = tokens.colorAlpha(card.color, 0.1);
  const cardBorder = tokens.colorAlpha(card.color, 0.25);
  const bodyText = card.body || '';
  const isLong = bodyText.length > 80;
  const displayBody = isLong && !expanded && isCompact ? bodyText.slice(0, 80) + '...' : bodyText;

  return (
    <div className="rounded-xl border transition-all hover:-translate-y-0.5 min-w-0 group"
      style={{
        background: cardBg,
        borderColor: cardBorder,
        borderRadius: tokens.radius('xl') + 'px',
        boxShadow: tokens.raw.shadow.card,
        padding: isCompact ? '10px' : '15px',
        overflow: 'hidden',
        position: 'relative',
      }}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ background: `linear-gradient(90deg, ${cardColor}, ${tokens.colorAlpha(card.color, 0.3)})` }} />

      <div className="flex items-center gap-2.5 mb-2 min-w-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: tokens.colorAlpha(card.color, 0.2),
            boxShadow: '0 4px 12px ' + tokens.colorAlpha(card.color, 0.25),
          }}>
          <span style={{ fontSize: isCompact ? '15px' : '20px' }}>{card.icon}</span>
        </div>
        <InlineTextEditor
          {...titleEditor}
          className="font-extrabold min-w-0"
          style={{ color: cardColor, fontSize: isCompact ? '12px' : '14px', wordBreak: 'break-word', overflowWrap: 'break-word' }}
        />
      </div>
      <InlineTextEditor
        {...bodyEditor}
        className={`leading-relaxed ${isCompact ? 'line-clamp-3' : ''}`}
        style={{ color: tokens.muted(0.85), fontSize: isCompact ? '11px' : '13px', lineHeight: 1.55, wordBreak: 'break-word', overflowWrap: 'break-word' }}
        placeholder="Ketik deskripsi kartu..."
      />
      {/* Expand toggle for long text in compact mode */}
      {isLong && isCompact && (
        <button className="mt-1 text-[10px] font-bold"
          style={{ color: cardColor }}
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
          {expanded ? 'Sembunyikan ↑' : 'Selengkapnya ↓'}
        </button>
      )}
    </div>
  );
}

/** Step mode sub-component for NcGridRenderer when cards > 2 */
function NcGridStepMode({ block, tokens, isCompact, interactive }: {
  block: NcGridBlock; tokens: TokenResolver; isCompact: boolean; interactive?: boolean;
}) {
  const cards = block.cards || [];
  const STEP_SIZE = 2;
  const totalSteps = Math.ceil(cards.length / STEP_SIZE);
  const { activeStep, ...nav } = usePremiumStepNavigator(totalSteps);

  // Build step labels: "Norma 1-2", "Norma 3-4", etc.
  const labels = Array.from({ length: totalSteps }, (_, i) => {
    const start = i * STEP_SIZE + 1;
    const end = Math.min((i + 1) * STEP_SIZE, cards.length);
    return end > start ? `Norma ${start}-${end}` : `Norma ${start}`;
  });

  // Get cards for current step
  const stepCards = cards.slice(activeStep * STEP_SIZE, (activeStep + 1) * STEP_SIZE);

  return (
    <PremiumStepNavigator
      labels={labels}
      activeStep={activeStep}
      onStepChange={nav.goTo}
      tokens={tokens}
      accent="c"
      isCompact={isCompact}
    >
      <div className="grid grid-cols-2 gap-3 my-3" style={{ minWidth: 0 }}>
        {stepCards.map((card, i) => (
          <NcGridCard
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

export function NcGridRenderer({ block, tokens, isCompact, isEditing, interactive }: {
  block: NcGridBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; interactive?: boolean;
}) {
  const cards = block.cards || [];

  // Use step mode when there are more than 2 cards
  if (cards.length > 2) {
    return (
      <NcGridStepMode
        block={block}
        tokens={tokens}
        isCompact={isCompact}
        interactive={interactive}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 my-3" style={{ minWidth: 0 }}>
      {cards.map((card, i) => (
        <NcGridCard
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
  );
}
