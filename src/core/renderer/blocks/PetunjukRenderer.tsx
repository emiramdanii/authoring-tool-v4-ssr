'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';
import type { PetunjukBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

export function PetunjukRenderer({ block, tokens, isCompact, isEditing }: {
  block: PetunjukBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
}) {
  const accentKey = block.tipsColor || 'y';

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
  const tipsEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'tips',
    value: block.tips ?? '',
    tag: 'span',
  });

  return (
    <div className={isCompact ? 'p-1' : 'p-2'}>
      <h2 className="font-black leading-tight"
        style={{ fontSize: isCompact ? '16px' : '1.6rem', fontFamily: tokens.fontFamily('display'), color: tokens.color('text') }}>
        <InlineTextEditor
          {...titleEditor}
          className="font-black leading-tight"
          style={{ fontSize: 'inherit', fontFamily: 'inherit', color: 'inherit' }}
        /> <InlineTextEditor
          {...titleHighlightEditor}
          className="font-black leading-tight"
          style={{ color: tokens.color('y'), fontSize: 'inherit', fontFamily: 'inherit' }}
        />
      </h2>

      <div className="grid grid-cols-2 gap-3 mt-4">
        {(block.items || []).map((item, i) => {
          const colorCycle = ['y', 'c', 'g', 'p'];
          const itemColor = colorCycle[i % colorCycle.length];
          return (
            <div key={i} className="rounded-xl text-center transition-all hover:-translate-y-0.5 min-w-0"
              style={{
                background: tokens.colorAlpha(itemColor, 0.1),
                border: '1px solid ' + tokens.colorAlpha(itemColor, 0.2),
                borderLeftWidth: '3px',
                borderLeftColor: tokens.color(itemColor),
                borderRadius: tokens.radius('xl') + 'px',
                boxShadow: tokens.raw.shadow.card,
                padding: isCompact ? '10px' : '14px',
                overflow: 'hidden',
              }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{
                  background: tokens.colorAlpha(itemColor, 0.2),
                  boxShadow: '0 4px 12px ' + tokens.colorAlpha(itemColor, 0.25),
                }}>
                <span style={{ fontSize: isCompact ? '15px' : '20px' }}>{item.icon}</span>
              </div>
              <div className="font-extrabold mb-1.5" style={{ color: tokens.color(itemColor), fontSize: isCompact ? '12px' : '14px', wordBreak: 'break-word' }}>{item.title}</div>
              <div className="leading-relaxed" style={{ color: tokens.muted(0.8), fontSize: isCompact ? '11px' : '13px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{item.body}</div>
            </div>
          );
        })}
      </div>

      {block.tips && (
        <div className="mt-4 p-3.5 rounded-xl leading-relaxed"
          style={{
            background: tokens.colorAlpha(accentKey, 0.12),
            border: '1px solid ' + tokens.colorAlpha(accentKey, 0.3),
            boxShadow: tokens.raw.shadow.card,
            color: tokens.color('text'),
            fontSize: isCompact ? '11px' : '13px',
          }}>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: tokens.colorAlpha(accentKey, 0.25), boxShadow: '0 2px 8px ' + tokens.colorAlpha(accentKey, 0.2) }}>
              <Lightbulb size={12} className="inline" />
            </div>
            <div>
              <strong style={{ color: tokens.color(accentKey) }}>Tips:</strong> <InlineTextEditor
                {...tipsEditor}
                className="leading-relaxed"
                style={{ fontSize: 'inherit' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
