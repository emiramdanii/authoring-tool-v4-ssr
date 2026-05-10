'use client';

import React from 'react';
import type { AlurBlock } from '../../schema/types';
import type { TokenResolver } from '../types';

export function AlurRenderer({ block, tokens, isCompact }: {
  block: AlurBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  return (
    <div className={`mt-3 rounded-xl ${isCompact ? 'p-2' : 'p-4'}`}
      style={{
        background: tokens.colorAlpha('c', 0.08),
        border: '1px solid ' + tokens.colorAlpha('c', 0.2),
        boxShadow: tokens.raw.shadow.card,
      }}>
      <div className="text-[10px] font-extrabold uppercase tracking-wider mb-3"
        style={{ color: tokens.color('c') }}>
        ⏱️ Alur Kegiatan {block.totalDurasi || ''}
      </div>
      <div className="flex flex-col gap-2">
        {block.steps.map((step, i) => (
          <div key={i} className="flex gap-2.5 items-start p-3 rounded-lg transition-all hover:-translate-y-0.5"
            style={{
              background: tokens.colorAlpha(step.dot, 0.08),
              border: '1px solid ' + tokens.colorAlpha(step.dot, 0.15),
              borderLeft: '3px solid ' + tokens.color(step.dot),
            }}>
            <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
              style={{ background: tokens.color(step.dot), boxShadow: '0 0 8px ' + tokens.colorAlpha(step.dot, 0.4) }} />
            <span className="text-[11px] font-black min-w-[36px] flex-shrink-0 mt-0.5"
              style={{ color: tokens.color(step.dot) }}>
              {step.durasi}
            </span>
            <span className="text-[10px] leading-relaxed">
              <strong className="text-white">{step.judul}</strong> — {step.deskripsi}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
