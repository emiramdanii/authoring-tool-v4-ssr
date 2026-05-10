'use client';

import React from 'react';
import type { DiskusiBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

export function DiskusiRenderer({ block, tokens, interactive, isCompact, isEditing }: {
  block: DiskusiBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean;
}) {
  // ── Inline editing hooks ─────────────────────────────────────
  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });
  const introEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'intro',
    value: block.intro ?? '',
    tag: 'p',
  });

  return (
    <div className="mt-3 rounded-2xl p-4"
      style={{
        background: tokens.colorAlpha('c', 0.1),
        border: '2px solid ' + tokens.colorAlpha('c', 0.3),
        boxShadow: tokens.raw.shadow.card + ', 0 0 24px ' + tokens.colorAlpha('c', 0.08),
      }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: tokens.colorAlpha('c', 0.2), boxShadow: '0 4px 12px ' + tokens.colorAlpha('c', 0.25) }}>
          <span className="text-sm">💬</span>
        </div>
        <div className="text-[12px] font-extrabold" style={{ color: tokens.color('c') }}>
          <InlineTextEditor
            {...titleEditor}
            className="text-[12px] font-extrabold"
            style={{ color: tokens.color('c'), fontSize: 'inherit' }}
          />
        </div>
      </div>
      {block.intro && <InlineTextEditor
        {...introEditor}
        className="text-[11px] mt-1 leading-relaxed font-bold mb-3"
        style={{ fontSize: 'inherit' }}
        placeholder="Ketik intro..."
      />}

      {(block.questions || []).map((q, i) => {
        const qColor = q.color || 'c';
        return (
        <div key={i} className="mt-4 rounded-xl p-3"
          style={{
            background: 'rgba(255,255,255,.05)',
            border: '1px solid ' + tokens.colorAlpha(qColor, 0.15),
            borderLeft: '3px solid ' + tokens.color(qColor),
          }}>
          <div className="flex items-center gap-2">
            <span className="text-base">{q.icon}</span>
            <span className="text-[11px] font-extrabold" style={{ color: tokens.color(qColor) }}>{q.label}</span>
          </div>
          <p className="text-[11px] mt-1.5 leading-relaxed font-bold">{q.teks}</p>
          {interactive ? (
            <textarea className="w-full mt-2 rounded-lg p-2.5 text-[11px] text-white resize-y min-h-[60px]"
              style={{
                background: 'rgba(255,255,255,.06)',
                border: '1px solid ' + tokens.colorAlpha(qColor, 0.2),
              }}
              placeholder={q.petunjuk} />
          ) : (
            <div className="w-full mt-2 rounded-lg p-2.5 text-[10px] text-white/30 min-h-[40px]"
              style={{
                background: 'rgba(255,255,255,.03)',
                border: '1px dashed ' + tokens.colorAlpha(qColor, 0.25),
              }}>
              {q.petunjuk}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
