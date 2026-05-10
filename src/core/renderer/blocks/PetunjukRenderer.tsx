'use client';

import React from 'react';
import type { PetunjukBlock } from '../../schema/types';
import type { TokenResolver } from '../types';

export function PetunjukRenderer({ block, tokens, isCompact }: {
  block: PetunjukBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  const accentKey = block.tipsColor || 'y';

  return (
    <div className={isCompact ? 'p-1' : 'p-2'}>
      <h2 className="font-black leading-tight"
        style={{ fontSize: isCompact ? '14px' : '1.6rem', fontFamily: tokens.fontFamily('display'), color: tokens.color('text') }}>
        {block.title} <span style={{ color: tokens.color('y') }}>{block.titleHighlight}</span>
      </h2>

      <div className={`grid grid-cols-2 gap-3 mt-4`}>
        {(block.items || []).map((item, i) => {
          const colorCycle = ['y', 'c', 'g', 'p'];
          const itemColor = colorCycle[i % colorCycle.length];
          return (
            <div key={i} className="rounded-xl p-3.5 text-center transition-all hover:-translate-y-0.5"
              style={{
                background: tokens.colorAlpha(itemColor, 0.1),
                border: '1px solid ' + tokens.colorAlpha(itemColor, 0.2),
                borderLeftWidth: '3px',
                borderLeftColor: tokens.color(itemColor),
                borderRadius: tokens.radius('xl') + 'px',
                boxShadow: tokens.raw.shadow.card,
              }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{
                  background: tokens.colorAlpha(itemColor, 0.2),
                  boxShadow: '0 4px 12px ' + tokens.colorAlpha(itemColor, 0.25),
                }}>
                <span className="text-xl">{item.icon}</span>
              </div>
              <div className="text-[11px] font-extrabold mb-1.5" style={{ color: tokens.color(itemColor) }}>{item.title}</div>
              <div className="text-[10px] text-white/55 leading-relaxed">{item.body}</div>
            </div>
          );
        })}
      </div>

      {block.tips && (
        <div className="mt-4 p-3.5 rounded-xl text-[11px] leading-relaxed"
          style={{
            background: tokens.colorAlpha(accentKey, 0.12),
            border: '1px solid ' + tokens.colorAlpha(accentKey, 0.3),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: tokens.colorAlpha(accentKey, 0.25), boxShadow: '0 2px 8px ' + tokens.colorAlpha(accentKey, 0.2) }}>
              <span className="text-xs">💡</span>
            </div>
            <div>
              <strong style={{ color: tokens.color(accentKey) }}>Tips:</strong> {block.tips}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
