'use client';

import React from 'react';
import type { TabelAccordionBlock } from '../../schema/types';
import type { TokenResolver } from '../types';

export function TabelAccordionRenderer({ block, tokens, isCompact }: {
  block: TabelAccordionBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2 mt-3">
      {(block.rows || []).map((row, i) => (
        <div key={i} className="rounded-xl overflow-hidden transition-all"
          style={{
            border: '1px solid ' + (openIdx === i ? tokens.colorAlpha(row.color, 0.35) : tokens.colorAlpha(row.color, 0.12)),
            background: openIdx === i ? tokens.colorAlpha(row.color, 0.08) : tokens.colorAlpha(row.color, 0.04),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <button className="w-full flex items-center gap-2.5 p-3 font-extrabold text-[11px] cursor-pointer transition-all hover:bg-white/[0.03]"
            onClick={() => setOpenIdx(openIdx === i ? null : i)}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: tokens.colorAlpha(row.color, 0.2), boxShadow: '0 2px 8px ' + tokens.colorAlpha(row.color, 0.2) }}>
              <span className="text-sm">{row.icon}</span>
            </div>
            <span style={{ color: tokens.color(row.color) }}>{row.title}</span>
            <span className="ml-auto text-[10px] transition-transform duration-300"
              style={{ transform: openIdx === i ? 'rotate(180deg)' : 'none', color: tokens.color(row.color) }}>▼</span>
          </button>
          {openIdx === i && (
            <div className="px-3.5 pb-3.5"
              style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="grid grid-cols-2 gap-2.5">
                {(row.details || []).map((d, j) => (
                  <div key={j} className="rounded-xl p-2.5"
                    style={{
                      background: tokens.colorAlpha(row.color, 0.08),
                      border: '1px solid ' + tokens.colorAlpha(row.color, 0.12),
                    }}>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1" style={{ color: tokens.color(row.color) }}>{d.label}</div>
                    <div className="text-[10px] leading-relaxed">{d.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
