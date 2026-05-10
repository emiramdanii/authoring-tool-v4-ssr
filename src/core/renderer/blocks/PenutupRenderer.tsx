'use client';

import React from 'react';
import type { PenutupBlock } from '../../schema/types';
import type { TokenResolver } from '../types';

export function PenutupRenderer({ block, tokens, isCompact }: {
  block: PenutupBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  return (
    <div>
      <h2 className="font-black text-sm" style={{ fontFamily: tokens.fontFamily('display') }}>
        {block.title} <span style={{ color: tokens.color('g') }}>{block.subtitle}</span>
      </h2>

      {/* Preview items */}
      {block.preview.length > 0 && (
        <div className="mt-4 p-4 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, ' + tokens.colorAlpha('c', 0.1) + ', ' + tokens.colorAlpha('p', 0.1) + ')',
            border: '1px solid ' + tokens.colorAlpha('c', 0.25),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="text-[10px] font-extrabold uppercase tracking-wider mb-3" style={{ color: tokens.color('c') }}>
            📋 Ringkasan
          </div>
          {block.preview.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl mb-2 text-[10px] font-bold leading-relaxed transition-all hover:-translate-y-0.5"
              style={{
                background: tokens.colorAlpha(item.warna, 0.1),
                border: '1px solid ' + tokens.colorAlpha(item.warna, 0.2),
                boxShadow: tokens.raw.shadow.card,
              }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: tokens.colorAlpha(item.warna, 0.2) }}>
                <span className="text-xs">{item.icon}</span>
              </div>
              <div><strong style={{ color: tokens.color(item.warna) }}>{item.judul}</strong> — <span className="text-white/55">{item.isi}</span></div>
            </div>
          ))}
        </div>
      )}

      {/* Next pertemuan preview */}
      {block.nextPertemuan && (
        <div className="mt-4 p-4 rounded-2xl"
          style={{
            background: tokens.colorAlpha('g', 0.08),
            border: '1px solid ' + tokens.colorAlpha('g', 0.2),
            borderLeft: '4px solid ' + tokens.color('g'),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: tokens.colorAlpha('g', 0.2), boxShadow: '0 4px 12px ' + tokens.colorAlpha('g', 0.25) }}>
              <span className="text-sm">📌</span>
            </div>
            <div className="text-[11px] font-extrabold" style={{ color: tokens.color('g') }}>Pertemuan Berikutnya: {block.nextPertemuan.judul}</div>
          </div>
          <div className="text-[10px] text-white/55 mb-3">{block.nextPertemuan.deskripsi}</div>
          <div className="grid grid-cols-2 gap-2">
            {block.nextPertemuan.items.map((item, i) => (
              <div key={i} className="rounded-xl p-2.5 text-[10px] font-bold text-center transition-all hover:-translate-y-0.5"
                style={{
                  background: tokens.colorAlpha(item.warna, 0.12),
                  color: tokens.color(item.warna),
                  border: '1px solid ' + tokens.colorAlpha(item.warna, 0.25),
                  boxShadow: tokens.raw.shadow.card,
                }}>
                {item.icon} {item.judul}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
