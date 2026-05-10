'use client';

import React from 'react';
import type { RefleksiBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

export function RefleksiRenderer({ block, tokens, interactive, isCompact, isEditing }: {
  block: RefleksiBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean;
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
    <div>
      {block.title && (
        <h2 className="font-black text-sm mb-1" style={{ fontFamily: tokens.fontFamily('display') }}>
          <InlineTextEditor
            {...titleEditor}
            className="font-black text-sm"
            style={{ fontFamily: 'inherit', fontSize: 'inherit' }}
          />
        </h2>
      )}
      {block.intro && <InlineTextEditor
        {...introEditor}
        className="text-[10px] text-white/55 mb-3"
        style={{ fontSize: 'inherit' }}
        placeholder="Ketik intro..."
      />}

      {(block.questions || []).map((q, i) => {
        const qColor = q.warna || 'y';
        return (
          <div key={i} className="rounded-xl p-3.5 mb-3 transition-all hover:-translate-y-0.5"
            style={{
              background: tokens.colorAlpha(qColor, 0.06),
              border: '1px solid ' + tokens.colorAlpha(qColor, 0.2),
              borderLeft: '4px solid ' + tokens.color(qColor),
              boxShadow: tokens.raw.shadow.card,
            }}>
            <label className="text-[11px] font-extrabold block mb-2"
              style={{ color: tokens.color(qColor) }}>
              {q.icon && <span className="mr-1">{q.icon}</span>} {q.teks}
            </label>
            {interactive ? (
              <textarea className="w-full rounded-lg p-2.5 text-[11px] text-white resize-y min-h-[50px]"
                style={{
                  background: 'rgba(255,255,255,.06)',
                  border: '1px solid ' + tokens.colorAlpha(qColor, 0.2),
                }}
                placeholder={q.petunjuk} />
            ) : (
              <div className="w-full mt-1 rounded-lg p-2.5 text-[10px] text-white/30 min-h-[40px]"
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
              <span className="text-sm">📝</span>
            </div>
            <div className="text-[11px] font-extrabold" style={{ color: tokens.color('p') }}>{block.penugasan.judul}</div>
          </div>
          <div className="text-[10px] text-white/60 leading-relaxed">{block.penugasan.isi}</div>
          {block.penugasan.contoh && (
            <div className="mt-2 text-[10px] text-white/40 italic p-2 rounded-lg"
              style={{ background: tokens.colorAlpha('p', 0.06) }}>
              Contoh: {block.penugasan.contoh}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
