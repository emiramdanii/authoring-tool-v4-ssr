'use client';

import React from 'react';
import type { NcGridBlock } from '../../schema/types';
import type { TokenResolver } from '../types';

export function NcGridRenderer({ block, tokens, isCompact }: {
  block: NcGridBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  return (
    <div className={`grid grid-cols-2 gap-3 my-3`}>
      {(block.cards || []).map((card, i) => (
        <div key={i} className="rounded-xl p-3.5 border transition-all hover:-translate-y-1 hover:shadow-lg"
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
            <span className="font-extrabold text-[11px]" style={{ color: tokens.color(card.color) }}>{card.title}</span>
          </div>
          <div className="text-[10px] text-white/55 leading-relaxed">{card.body}</div>
        </div>
      ))}
    </div>
  );
}
