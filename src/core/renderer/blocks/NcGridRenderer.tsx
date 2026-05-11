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

  return (
    <div className="rounded-xl p-3.5 border transition-all hover:-translate-y-1 hover:shadow-lg"
      style={{
        background: tokens.colorAlpha(card.color, 0.1),
        borderColor: tokens.colorAlpha(card.color, 0.25),
        borderRadius: tokens.radius('xl') + 'px',
        boxShadow: tokens.raw.shadow.card,
      }}>
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}
          style={{
            background: tokens.colorAlpha(card.color, 0.2),
            boxShadow: '0 4px 12px ' + tokens.colorAlpha(card.color, 0.25),
          }}>
          <span className={isCompact ? 'text-base' : 'text-xl'}>{card.icon}</span>
        </div>
        <InlineTextEditor
          {...titleEditor}
          className="font-extrabold text-[11px]"
          style={{ color: tokens.color(card.color), fontSize: 'inherit' }}
        />
      </div>
      <InlineTextEditor
        {...bodyEditor}
        className="text-[10px] text-white/55 leading-relaxed"
        style={{ fontSize: 'inherit' }}
        placeholder="Ketik deskripsi kartu..."
      />
    </div>
  );
}

export function NcGridRenderer({ block, tokens, isCompact, isEditing }: {
  block: NcGridBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
}) {
  return (
    <div className={`grid grid-cols-2 gap-3 my-3`}>
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
