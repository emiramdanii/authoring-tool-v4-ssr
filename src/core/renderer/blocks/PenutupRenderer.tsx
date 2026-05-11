'use client';

import React from 'react';
import type { PenutupBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

export function PenutupRenderer({ block, tokens, isCompact, isEditing }: {
  block: PenutupBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
}) {
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
    tag: 'span',
  });

  return (
    <div>
      <h2 className="font-black" style={{ fontFamily: tokens.fontFamily('display'), fontSize: isCompact ? '14px' : '18px', color: tokens.color('text') }}>
        <InlineTextEditor
          {...titleEditor}
          className="font-black"
          style={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
        /> <InlineTextEditor
          {...subtitleEditor}
          className="font-black"
          style={{ color: tokens.color('g'), fontFamily: 'inherit', fontSize: 'inherit' }}
        />
      </h2>

      {/* Preview items */}
      {(block.preview || []).length > 0 && (
        <div className="mt-4 p-4 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, ' + tokens.colorAlpha('c', 0.1) + ', ' + tokens.colorAlpha('p', 0.1) + ')',
            border: '1px solid ' + tokens.colorAlpha('c', 0.25),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="font-extrabold uppercase tracking-wider mb-3" style={{ color: tokens.color('c'), fontSize: isCompact ? '10px' : '12px' }}>
            📋 Ringkasan
          </div>
          {(block.preview || []).map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl mb-2 font-bold leading-relaxed transition-all hover:-translate-y-0.5 min-w-0"
              style={{
                background: tokens.colorAlpha(item.warna, 0.1),
                border: '1px solid ' + tokens.colorAlpha(item.warna, 0.2),
                boxShadow: tokens.raw.shadow.card,
                fontSize: isCompact ? '11px' : '13px',
              }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: tokens.colorAlpha(item.warna, 0.2) }}>
                <span style={{ fontSize: isCompact ? '10px' : '12px' }}>{item.icon}</span>
              </div>
              <div><strong style={{ color: tokens.color(item.warna) }}>{item.judul}</strong> — <span style={{ color: tokens.muted(0.8) }}>{item.isi}</span></div>
            </div>
          ))}
        </div>
      )}

      {/* Next pertemuan preview */}
      {block.nextPertemuan && (
        <div className="mt-4 p-4 rounded-2xl"
          style={{
            background: tokens.colorAlpha('g', 0.08),
            border: '1px solid ' + tokens.colorAlpha('g', 0.2),
            borderLeft: '4px solid ' + tokens.color('g'),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: tokens.colorAlpha('g', 0.2), boxShadow: '0 4px 12px ' + tokens.colorAlpha('g', 0.25) }}>
              <span style={{ fontSize: isCompact ? '12px' : '14px' }}>📌</span>
            </div>
            <div className="font-extrabold" style={{ color: tokens.color('g'), fontSize: isCompact ? '12px' : '14px' }}>Pertemuan Berikutnya: {block.nextPertemuan.judul}</div>
          </div>
          <div className="mb-3" style={{ color: tokens.muted(0.8), fontSize: isCompact ? '11px' : '13px' }}>{block.nextPertemuan.deskripsi}</div>
          <div className="grid grid-cols-2 gap-2">
            {(block.nextPertemuan.items || []).map((item, i) => (
              <div key={i} className="rounded-xl p-2.5 font-bold text-center transition-all hover:-translate-y-0.5 min-w-0"
                style={{
                  background: tokens.colorAlpha(item.warna, 0.12),
                  color: tokens.color(item.warna),
                  border: '1px solid ' + tokens.colorAlpha(item.warna, 0.25),
                  boxShadow: tokens.raw.shadow.card,
                  fontSize: isCompact ? '11px' : '13px',
                }}>
                {item.icon} {item.judul}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
