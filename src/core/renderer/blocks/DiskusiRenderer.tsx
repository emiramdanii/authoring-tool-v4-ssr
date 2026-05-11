'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import type { DiskusiBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

export function DiskusiRenderer({ block, tokens, interactive, isCompact, isEditing }: {
  block: DiskusiBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean;
}) {
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
          <MessageCircle size={14} className="inline" style={{ color: tokens.color('c') }} />
        </div>
        <div className="font-extrabold" style={{ color: tokens.color('c'), fontSize: isCompact ? '12px' : '14px' }}>
          <InlineTextEditor
            {...titleEditor}
            className="font-extrabold"
            style={{ color: tokens.color('c'), fontSize: 'inherit' }}
          />
        </div>
      </div>
      {block.intro && <InlineTextEditor
        {...introEditor}
        className="mt-1 leading-relaxed font-bold mb-3"
        style={{ fontSize: isCompact ? '12px' : '14px', color: tokens.color('text') }}
        placeholder="Ketik intro..."
      />}

      {(block.questions || []).map((q, i) => {
        const qColor = q.color || 'c';
        return (
        <div key={i} className="mt-4 rounded-xl p-3 min-w-0"
          style={{
            background: tokens.subtleBg(0.05),
            border: '1px solid ' + tokens.colorAlpha(qColor, 0.15),
            borderLeft: '3px solid ' + tokens.color(qColor),
          }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: isCompact ? '14px' : '16px' }}>{q.icon}</span>
            <span className="font-extrabold" style={{ color: tokens.color(qColor), fontSize: isCompact ? '12px' : '14px' }}>{q.label}</span>
          </div>
          <p className="mt-1.5 leading-relaxed font-bold" style={{ fontSize: isCompact ? '12px' : '14px', color: tokens.color('text') }}>{q.teks}</p>
          {interactive ? (
            <textarea className="w-full mt-2 rounded-lg p-2.5 resize-y"
              style={{
                fontSize: isCompact ? '11px' : '13px',
                color: tokens.color('text'),
                background: tokens.subtleBg(0.06),
                border: '1px solid ' + tokens.colorAlpha(qColor, 0.2),
                minHeight: isCompact ? '40px' : '60px',
              }}
              placeholder={q.petunjuk} />
          ) : (
            <div className="w-full mt-2 rounded-lg p-2.5 min-h-[40px]"
              style={{
                fontSize: isCompact ? '10px' : '12px',
                color: tokens.textSubtle(0.5),
                background: tokens.subtleBg(0.03),
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
