'use client';

import React from 'react';
import type { TpBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

export function TpRenderer({ block, tokens, isCompact, isEditing }: {
  block: TpBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
}) {
  // ── Inline editing hooks ─────────────────────────────────────
  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });
  const titleHighlightEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'titleHighlight',
    value: block.titleHighlight ?? '',
    tag: 'span',
  });

  return (
    <div className={isCompact ? 'p-1' : 'p-2'}>
      <h2 className="font-black leading-tight"
        style={{ fontSize: isCompact ? '16px' : '1.6rem', fontFamily: tokens.fontFamily('display') }}>
        <InlineTextEditor
          {...titleEditor}
          className="font-black leading-tight"
          style={{ fontSize: 'inherit', fontFamily: 'inherit', color: tokens.color('text') }}
        /> <InlineTextEditor
          {...titleHighlightEditor}
          className="font-black leading-tight"
          style={{ color: tokens.color('y'), fontSize: 'inherit', fontFamily: 'inherit' }}
        />
      </h2>

      <div className="flex flex-col gap-3 mt-4">
        {(block.items || []).map((item, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl p-3 transition-all hover:-translate-y-0.5 min-w-0"
            style={{
              background: tokens.colorAlpha(item.color, 0.1),
              border: '1px solid ' + tokens.colorAlpha(item.color, 0.25),
              borderLeft: '4px solid ' + tokens.color(item.color),
              borderRadius: tokens.radius('xl') + 'px',
              boxShadow: tokens.raw.shadow.card,
            }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-black flex-shrink-0"
              style={{
                background: tokens.colorAlpha(item.color, 0.2),
                color: tokens.color(item.color),
                boxShadow: '0 4px 12px ' + tokens.colorAlpha(item.color, 0.25),
                fontSize: isCompact ? '11px' : '12px',
              }}>
              {item.num}
            </div>
            <div className="min-w-0">
              <div className="font-extrabold" style={{ color: tokens.color(item.color), fontSize: isCompact ? '12px' : '14px' }}>{item.verb}</div>
              <div className="leading-relaxed mt-0.5" style={{ color: tokens.muted(0.85), fontSize: isCompact ? '11px' : '13px' }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {block.profil && (
        <div className="mt-4 p-3.5 rounded-xl leading-relaxed"
          style={{
            background: tokens.colorAlpha('g', 0.12),
            border: '1px solid ' + tokens.colorAlpha('g', 0.3),
            borderLeft: '4px solid ' + tokens.color('g'),
            borderRadius: tokens.radius('xl') + 'px',
            boxShadow: tokens.raw.shadow.card,
            color: tokens.color('text'),
            fontSize: isCompact ? '11px' : '13px',
          }}>
          <strong style={{ color: tokens.color('g') }}>🔗 Profil Pelajar Pancasila:</strong> {block.profil}
        </div>
      )}
    </div>
  );
}
