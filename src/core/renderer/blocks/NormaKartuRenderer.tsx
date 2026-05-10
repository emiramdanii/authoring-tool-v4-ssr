'use client';

import React from 'react';
import type { NormaKartuBlock } from '../../schema/types';
import type { TokenResolver } from '../types';

export function NormaKartuRenderer({ block, tokens, isCompact }: {
  block: NormaKartuBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  const colorMap: Record<string, string> = {
    agama: 'y',
    kesusilaan: 'r',
    kesopanan: 'c',
    hukum: 'p',
  };
  const colorKey = colorMap[block.normaType] || 'y';
  const color = tokens.color(colorKey);

  return (
    <div className="rounded-2xl p-4" style={{
      background: tokens.colorAlpha(colorKey, 0.12),
      border: '1px solid ' + tokens.colorAlpha(colorKey, 0.3),
      boxShadow: tokens.raw.shadow.card,
      animation: 'fadeIn 0.3s ease',
    }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: tokens.colorAlpha(colorKey, 0.25),
            boxShadow: '0 6px 16px ' + tokens.colorAlpha(colorKey, 0.3),
          }}>
          {block.icon}
        </div>
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color }}>{block.label}</div>
          <div className="font-black text-[16px] mt-0.5" style={{ fontFamily: tokens.fontFamily('display'), color }}>{block.title}</div>
        </div>
      </div>

      {/* Definition */}
      <div className="text-[11px] leading-relaxed mb-4">{block.definition}</div>

      {/* Characteristics 2-col */}
      {(block.characteristics || []).length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {(block.characteristics || []).map((c, i) => (
            <div key={i} className="rounded-xl p-3"
              style={{
                background: tokens.colorAlpha(colorKey, 0.08),
                border: '1px solid ' + tokens.colorAlpha(colorKey, 0.15),
              }}>
              <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1" style={{ color }}>{c.label}</div>
              <div className="text-[10px] leading-relaxed">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sanksi */}
      {block.sanksi && (
        <div className="rounded-xl p-3 mt-3"
          style={{
            background: tokens.colorAlpha('o', 0.08),
            border: '1px solid ' + tokens.colorAlpha('o', 0.2),
            borderLeft: '3px solid ' + tokens.color('o'),
          }}>
          <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: tokens.color('o') }}>{block.sanksi.title}</div>
          {block.sanksi.items.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-[10px] mb-1.5 leading-relaxed">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: s.dot || color }} />
              {s.text}
            </div>
          ))}
        </div>
      )}

      {/* Contoh */}
      {block.contoh && (
        <div className="mt-3 p-3 rounded-xl text-[10px] leading-relaxed"
          style={{
            background: tokens.colorAlpha(colorKey, 0.08),
            border: '1px solid ' + tokens.colorAlpha(colorKey, 0.15),
            borderLeft: '3px solid ' + color,
          }}>
          <span className="font-extrabold" style={{ color }}>📖 Contoh:</span> {block.contoh}
        </div>
      )}

      {/* Pelanggaran */}
      {block.pelanggaran && (
        <div className="mt-3 p-3 rounded-xl"
          style={{
            background: tokens.colorAlpha('r', 0.08),
            border: '1px solid ' + tokens.colorAlpha('r', 0.25),
            borderLeft: '3px solid ' + tokens.color('r'),
          }}>
          <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1.5"
            style={{ color: tokens.color('r') }}>{block.pelanggaran.title}</div>
          {block.pelanggaran.items.map((p, i) => (
            <div key={i} className="flex gap-2 text-[10px] mb-1.5 leading-relaxed">
              <span>{p.icon}</span> {p.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
