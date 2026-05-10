'use client';

import React from 'react';
import type { HasilBlock } from '../../schema/types';
import type { TokenResolver } from '../types';

export function HasilRenderer({ block, tokens }: {
  block: HasilBlock; tokens: TokenResolver;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6">
      {/* Circle progress */}
      <div className="relative w-32 h-32 mb-5">
        <div className="w-32 h-32 rounded-full flex items-center justify-center"
          style={{
            background: 'conic-gradient(' + tokens.color('g') + ' 0%, ' + tokens.color('g') + ' 75%, ' + tokens.colorAlpha('g', 0.1) + ' 75%, ' + tokens.colorAlpha('g', 0.1) + ' 100%)',
            boxShadow: '0 0 30px ' + tokens.colorAlpha('g', 0.15),
          }}>
          <div className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{ background: tokens.color('bg2') }}>
            <div className="text-center">
              <div className="text-3xl mb-1" style={{ animation: 'float 3s ease-in-out infinite' }}>🏆</div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="font-black text-lg" style={{ fontFamily: tokens.fontFamily('display') }}>{block.title}</h2>
      <p className="text-[11px] text-white/55 mt-1 max-w-[320px]">{block.subtitle}</p>

      {/* Summary badges */}
      <div className="mt-4 flex gap-3">
        <div className="px-4 py-2 rounded-xl text-center"
          style={{
            background: tokens.colorAlpha('g', 0.12),
            border: '1px solid ' + tokens.colorAlpha('g', 0.3),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="text-[10px] font-extrabold" style={{ color: tokens.color('g') }}>Selesai!</div>
          <div className="font-black text-sm" style={{ color: tokens.color('g') }}>🎉</div>
        </div>
        <div className="px-4 py-2 rounded-xl text-center"
          style={{
            background: tokens.colorAlpha('y', 0.12),
            border: '1px solid ' + tokens.colorAlpha('y', 0.3),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="text-[10px] font-extrabold" style={{ color: tokens.color('y') }}>Hasil</div>
          <div className="font-black text-sm" style={{ color: tokens.color('y') }}>⭐</div>
        </div>
      </div>
    </div>
  );
}
