'use client';

import React from 'react';
import type { NcGridBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

/** Inner card component so hooks are not called in loops */
function NcGridCard({ card, cardIndex, blockId, tokens, isCompact }: {
  card: NcGridBlock['cards'][number];
  cardIndex: number;
  blockId: string;
  tokens: TokenResolver;
  isCompact: boolean;
}) {
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

  return (
    <div className="rounded-xl border transition-all hover:-translate-y-0.5 min-w-0"
      style={{
        background: cardBg,
        borderColor: cardBorder,
        borderRadius: tokens.radius('xl') + 'px',
        boxShadow: tokens.raw.shadow.card,
        padding: isCompact ? '10px' : '15px',
        overflow: 'hidden',
      }}>
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: tokens.colorAlpha(card.color, 0.2),
            boxShadow: '0 4px 12px ' + tokens.colorAlpha(card.color, 0.25),
          }}>
          <span style={{ fontSize: isCompact ? '15px' : '20px' }}>{card.icon}</span>
        </div>
        <InlineTextEditor
          {...titleEditor}
          className="font-extrabold truncate"
          style={{ color: cardColor, fontSize: isCompact ? '12px' : '14px' }}
        />
      </div>
      <InlineTextEditor
        {...bodyEditor}
        className="leading-relaxed"
        style={{ color: tokens.muted(0.85), fontSize: isCompact ? '11px' : '13px', lineHeight: 1.55 }}
        placeholder="Ketik deskripsi kartu..."
      />
    </div>
  );
}

export function NcGridRenderer({ block, tokens, isCompact, isEditing }: {
  block: NcGridBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 my-3" style={{ minWidth: 0 }}>
      {(block.cards || []).map((card, i) => (
        <NcGridCard
          key={i}
          card={card}
          cardIndex={i}
          blockId={block.id!}
          tokens={tokens}
          isCompact={isCompact}
        />
      ))}
    </div>
  );
}
