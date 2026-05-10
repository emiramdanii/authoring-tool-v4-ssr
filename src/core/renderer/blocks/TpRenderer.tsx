'use client';

import React from 'react';
import type { TpBlock } from '../../schema/types';
import type { TokenResolver } from '../types';

export function TpRenderer({ block, tokens, isCompact }: {
  block: TpBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  return (
    <div className={isCompact ? 'p-1' : 'p-2'}>
      <h2 className="font-black leading-tight"
        style={{ fontSize: isCompact ? '14px' : '1.6rem', fontFamily: tokens.fontFamily('display') }}>
        {block.title} <span style={{ color: tokens.color('y') }}>{block.titleHighlight}</span>
      </h2>

      <div className="flex flex-col gap-3 mt-4">
        {(block.items || []).map((item, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl p-3 transition-all hover:-translate-y-0.5"
            style={{
              background: tokens.colorAlpha(item.color, 0.1),
              border: '1px solid ' + tokens.colorAlpha(item.color, 0.25),
              borderLeft: '4px solid ' + tokens.color(item.color),
              borderRadius: tokens.radius('xl') + 'px',
              boxShadow: tokens.raw.shadow.card,
            }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-black flex-shrink-0"
              style={{
                background: tokens.colorAlpha(item.color, 0.2),
                color: tokens.color(item.color),
                boxShadow: '0 4px 12px ' + tokens.colorAlpha(item.color, 0.25),
              }}>
              {item.num}
            </div>
            <div>
              <div className="text-[11px] font-extrabold" style={{ color: tokens.color(item.color) }}>{item.verb}</div>
              <div className="text-[10px] text-white/60 leading-relaxed mt-0.5">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {block.profil && (
        <div className="mt-4 p-3.5 rounded-xl text-[11px] leading-relaxed"
          style={{
            background: tokens.colorAlpha('g', 0.12),
            border: '1px solid ' + tokens.colorAlpha('g', 0.3),
            borderLeft: '4px solid ' + tokens.color('g'),
            borderRadius: tokens.radius('xl') + 'px',
            boxShadow: tokens.raw.shadow.card,
          }}>
          <strong style={{ color: tokens.color('g') }}>🔗 Profil Pelajar Pancasila:</strong> {block.profil}
        </div>
      )}
    </div>
  );
}
