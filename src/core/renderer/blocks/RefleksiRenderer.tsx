'use client';

import React from 'react';
import { PenLine } from 'lucide-react';
import type { RefleksiBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

export function RefleksiRenderer({ block, tokens, interactive, isCompact, isEditing }: {
  block: RefleksiBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean;
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
    <div>
      {block.title && (
        <h2 className="font-black mb-1" style={{ fontFamily: tokens.fontFamily('display'), fontSize: isCompact ? '14px' : '18px', color: tokens.color('text') }}>
          <InlineTextEditor
            {...titleEditor}
            className="font-black"
            style={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
          />
        </h2>
      )}
      {block.intro && <InlineTextEditor
        {...introEditor}
        className="mb-3"
        style={{ fontSize: isCompact ? '11px' : '13px', color: tokens.muted(0.8) }}
        placeholder="Ketik intro..."
      />}

      {(block.questions || []).map((q, i) => {
        const qColor = q.warna || 'y';
        return (
          <div key={i} className="rounded-xl p-3.5 mb-3 transition-all hover:-translate-y-0.5 min-w-0"
            style={{
              background: tokens.colorAlpha(qColor, 0.06),
              border: '1px solid ' + tokens.colorAlpha(qColor, 0.2),
              borderLeft: '4px solid ' + tokens.color(qColor),
              boxShadow: tokens.raw.shadow.card,
            }}>
            <label className="font-extrabold block mb-2"
              style={{ color: tokens.color(qColor), fontSize: isCompact ? '12px' : '14px' }}>
              {q.icon && <span className="mr-1">{q.icon}</span>} {q.teks}
            </label>
            {interactive ? (
              <textarea className="w-full rounded-lg p-2.5 resize-y"
                style={{
                  fontSize: isCompact ? '11px' : '13px',
                  color: tokens.color('text'),
                  background: tokens.subtleBg(0.06),
                  border: '1px solid ' + tokens.colorAlpha(qColor, 0.2),
                  minHeight: isCompact ? '40px' : '50px',
                }}
                placeholder={q.petunjuk} />
            ) : (
              <div className="w-full mt-1 rounded-lg p-2.5 min-h-[40px]"
                style={{
                  fontSize: isCompact ? '10px' : '12px',
                  color: tokens.textSubtle(0.4),
                  background: tokens.subtleBg(0.03),
                  border: '1px dashed ' + tokens.colorAlpha(qColor, 0.25),
                }}>
                {q.petunjuk}
              </div>
            )}
          </div>
        );
      })}

      {block.penugasan && (
        <div className="mt-4 p-4 rounded-xl"
          style={{
            background: tokens.colorAlpha('p', 0.1),
            border: '1px solid ' + tokens.colorAlpha('p', 0.25),
            borderLeft: '4px solid ' + tokens.color('p'),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: tokens.colorAlpha('p', 0.2), boxShadow: '0 4px 12px ' + tokens.colorAlpha('p', 0.25) }}>
              <PenLine size={14} className="inline" style={{ color: tokens.color('p') }} />
            </div>
            <div className="font-extrabold" style={{ color: tokens.color('p'), fontSize: isCompact ? '12px' : '14px' }}>{block.penugasan.judul}</div>
          </div>
          <div className="leading-relaxed" style={{ color: tokens.muted(0.8), fontSize: isCompact ? '11px' : '13px' }}>{block.penugasan.isi}</div>
          {block.penugasan.contoh && (
            <div className="mt-2 italic p-2 rounded-lg"
              style={{ fontSize: isCompact ? '10px' : '12px', color: tokens.textSubtle(0.5), background: tokens.colorAlpha('p', 0.06) }}>
              Contoh: {block.penugasan.contoh}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
