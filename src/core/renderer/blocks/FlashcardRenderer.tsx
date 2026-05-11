'use client';

import React from 'react';
import type { FlashcardSetBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

export function FlashcardRenderer({ block, tokens, isCompact, interactive, isEditing }: {
  block: FlashcardSetBlock; tokens: TokenResolver; isCompact: boolean; interactive?: boolean; isEditing?: boolean;
}) {
  const [idx, setIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const cards = block.cards || [];
  if (cards.length === 0) return null;
  const card = cards[idx];

  // ── Inline editing hooks ─────────────────────────────────────
  const qEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: `cards.${idx}.q`,
    value: card.q ?? '',
    tag: 'div',
  });
  const aEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: `cards.${idx}.a`,
    value: card.a ?? '',
    tag: 'div',
    multiline: true,
  });

  return (
    <div className={isCompact ? 'mt-2' : 'mt-4'}>
      <div className="text-[10px] font-extrabold uppercase tracking-wider mb-3"
        style={{ color: tokens.color('y') }}>
        🃏 Kartu Kilat — Uji Ingatanmu
      </div>
      <div className={`rounded-xl ${interactive ? 'cursor-pointer' : ''}`}
        style={{
          minHeight: isCompact ? 80 : 130,
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'none',
          transition: 'transform 0.6s',
        }}
        onClick={() => interactive && setFlipped(!flipped)}>

        {/* Front */}
        <div className="rounded-xl p-4 flex flex-col justify-center"
          style={{
            background: tokens.color('card'),
            border: '2px solid ' + tokens.colorAlpha('y', 0.3),
            backfaceVisibility: 'hidden',
            boxShadow: tokens.raw.shadow.card + ', 0 0 20px ' + tokens.colorAlpha('y', 0.1),
          }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: tokens.colorAlpha('y', 0.2) }}>
              <span className="text-[10px]">❓</span>
            </div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: tokens.color('y') }}>Pertanyaan</div>
          </div>
          <InlineTextEditor
            {...qEditor}
            className="font-extrabold text-[12px] leading-relaxed"
            style={{ fontSize: 'inherit' }}
            placeholder="Ketik pertanyaan..."
          />
        </div>

        {/* Back */}
        {flipped && (
          <div className="rounded-xl p-4 mt-2"
            style={{
              background: tokens.colorAlpha('g', 0.12),
              border: '2px solid ' + tokens.colorAlpha('g', 0.35),
              boxShadow: tokens.raw.shadow.card + ', 0 0 20px ' + tokens.colorAlpha('g', 0.1),
            }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: tokens.colorAlpha('g', 0.2) }}>
                <span className="text-[10px]">✅</span>
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: tokens.color('g') }}>Jawaban</div>
            </div>
            <InlineTextEditor
              {...aEditor}
              className="text-[11px] leading-relaxed"
              style={{ color: tokens.color('g'), fontSize: 'inherit' }}
              placeholder="Ketik jawaban..."
            />
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between mt-3">
        <button className="px-3 py-1.5 rounded-full text-[10px] font-bold transition-all hover:scale-105"
          style={{
            background: tokens.colorAlpha('y', 0.15),
            color: tokens.color('y'),
            border: '1px solid ' + tokens.colorAlpha('y', 0.3),
          }}
          onClick={() => { setIdx(Math.max(0, idx - 1)); setFlipped(false); }} disabled={idx === 0}>
          ← Prev
        </button>
        <div className="flex gap-1.5">
          {cards.map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-all"
              style={{
                background: i === idx ? tokens.color('y') : i < idx ? tokens.color('g') : 'rgba(255,255,255,.12)',
                boxShadow: i === idx ? '0 0 8px ' + tokens.colorAlpha('y', 0.5) : 'none',
              }} />
          ))}
        </div>
        <button className="px-3 py-1.5 rounded-full text-[10px] font-bold transition-all hover:scale-105"
          style={{
            background: tokens.colorAlpha('y', 0.15),
            color: tokens.color('y'),
            border: '1px solid ' + tokens.colorAlpha('y', 0.3),
          }}
          onClick={() => { setIdx(Math.min(cards.length - 1, idx + 1)); setFlipped(false); }}
          disabled={idx >= cards.length - 1}>
          Next →
        </button>
      </div>
    </div>
  );
}
