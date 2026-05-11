'use client';

import React from 'react';
import type { HasilBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

export function HasilRenderer({ block, tokens, interactive, isEditing }: {
  block: HasilBlock; tokens: TokenResolver; interactive?: boolean; isEditing?: boolean;
}) {
  const totalScoreVal = interactive ? 0 : 0;
  const totalMaxVal = interactive ? 100 : 100;
  const pct = totalMaxVal > 0 ? Math.round((totalScoreVal / totalMaxVal) * 100) : 75;
  const displayPct = pct || 75;

  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });
  const subtitleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'subtitle',
    value: block.subtitle ?? '',
    tag: 'p',
  });

  return (
    <div className="flex flex-col items-center justify-center text-center p-6">
      {/* Circle progress */}
      <div className="relative w-32 h-32 mb-5">
        <div className="w-32 h-32 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(${tokens.color('g')} 0%, ${tokens.color('g')} ${displayPct}%, ${tokens.colorAlpha('g', 0.1)} ${displayPct}%, ${tokens.colorAlpha('g', 0.1)} 100%)`,
            boxShadow: '0 0 30px ' + tokens.colorAlpha('g', 0.15),
          }}>
          <div className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{ background: tokens.color('bg2') }}>
            <div className="text-center">
              <div className="text-3xl mb-1" style={{ animation: 'float 3s ease-in-out infinite' }}>🏆</div>
              <div className="text-lg font-black" style={{ color: tokens.color('g') }}>{displayPct}%</div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="font-black text-lg" style={{ fontFamily: tokens.fontFamily('display'), color: tokens.color('text') }}>
        <InlineTextEditor
          {...titleEditor}
          className="font-black text-lg"
          style={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
        />
      </h2>
      <InlineTextEditor
        {...subtitleEditor}
        className="mt-1 max-w-[320px]"
        style={{ fontSize: '13px', color: tokens.muted(0.8) }}
        placeholder="Ketik subtitle..."
      />

      {/* Summary badges */}
      <div className="mt-4 flex gap-3">
        <div className="px-4 py-2 rounded-xl text-center"
          style={{
            background: tokens.colorAlpha('g', 0.12),
            border: '1px solid ' + tokens.colorAlpha('g', 0.3),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="font-extrabold" style={{ color: tokens.color('g'), fontSize: '11px' }}>Selesai!</div>
          <div className="font-black text-sm" style={{ color: tokens.color('g') }}>🎉</div>
        </div>
        <div className="px-4 py-2 rounded-xl text-center"
          style={{
            background: tokens.colorAlpha('y', 0.12),
            border: '1px solid ' + tokens.colorAlpha('y', 0.3),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="font-extrabold" style={{ color: tokens.color('y'), fontSize: '11px' }}>Hasil</div>
          <div className="font-black text-sm" style={{ color: tokens.color('y') }}>⭐</div>
        </div>
      </div>
    </div>
  );
}
