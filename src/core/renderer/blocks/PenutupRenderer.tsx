'use client';

import React from 'react';
import { CheckCircle2, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import type { PenutupBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { playSound } from '@/lib/sounds';

export function PenutupRenderer({ block, tokens, isCompact, isEditing, interactive }: {
  block: PenutupBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; interactive?: boolean;
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
      {/* Header with completion icon */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: tokens.colorAlpha('g', 0.15),
            border: '1px solid ' + tokens.colorAlpha('g', 0.3),
            boxShadow: '0 0 16px ' + tokens.colorAlpha('g', 0.1),
          }}>
          <CheckCircle2 size={18} style={{ color: tokens.color('g') }} />
        </div>
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
        </div>
      </div>

      {/* Decorative divider */}
      <div className="flex gap-1.5 mb-4">
        {['g', 'y', 'c'].map((color, i) => (
          <div key={i} className="h-1 rounded-full flex-1" style={{
            background: tokens.color(color),
            opacity: 0.6 - i * 0.15,
          }} />
        ))}
      </div>

      {/* Preview items - improved with card styling */}
      {(block.preview || []).length > 0 && (
        <div className="p-4 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, ' + tokens.colorAlpha('c', 0.08) + ', ' + tokens.colorAlpha('p', 0.08) + ')',
            border: '1px solid ' + tokens.colorAlpha('c', 0.2),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={14} style={{ color: tokens.color('c') }} />
            <div className="font-extrabold uppercase tracking-wider" style={{ color: tokens.color('c'), fontSize: isCompact ? '10px' : '12px' }}>
              Ringkasan Pembelajaran
            </div>
          </div>
          {(block.preview || []).map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl mb-2 font-bold leading-relaxed transition-all hover:-translate-y-0.5 min-w-0"
              style={{
                background: tokens.colorAlpha(item.warna, 0.08),
                border: '1px solid ' + tokens.colorAlpha(item.warna, 0.18),
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

      {/* Next pertemuan preview - enhanced with call-to-action */}
      {block.nextPertemuan && (
        <div className="mt-4 p-4 rounded-2xl"
          style={{
            background: tokens.colorAlpha('g', 0.06),
            border: '1px solid ' + tokens.colorAlpha('g', 0.2),
            borderLeft: '4px solid ' + tokens.color('g'),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: tokens.colorAlpha('g', 0.2), boxShadow: '0 4px 12px ' + tokens.colorAlpha('g', 0.25) }}>
              <Sparkles size={14} style={{ color: tokens.color('g') }} />
            </div>
            <div className="font-extrabold" style={{ color: tokens.color('g'), fontSize: isCompact ? '12px' : '14px' }}>Pertemuan Berikutnya</div>
          </div>
          <div className="mb-3 font-bold" style={{ color: tokens.color('text'), fontSize: isCompact ? '12px' : '14px' }}>
            {block.nextPertemuan.judul}
          </div>
          <div className="mb-3" style={{ color: tokens.muted(0.8), fontSize: isCompact ? '11px' : '13px' }}>{block.nextPertemuan.deskripsi}</div>
          <div className="grid grid-cols-2 gap-2">
            {(block.nextPertemuan.items || []).map((item, i) => (
              <div key={i} className="rounded-xl p-2.5 font-bold text-center transition-all hover:-translate-y-0.5 min-w-0"
                style={{
                  background: tokens.colorAlpha(item.warna, 0.1),
                  color: tokens.color(item.warna),
                  border: '1px solid ' + tokens.colorAlpha(item.warna, 0.25),
                  boxShadow: tokens.raw.shadow.card,
                  fontSize: isCompact ? '11px' : '13px',
                }}>
                {item.icon} {item.judul}
              </div>
            ))}
          </div>

          {/* Call-to-action for next meeting */}
          {interactive && (
            <button className="w-full mt-3 py-2.5 rounded-xl font-extrabold transition-all hover:scale-[1.02]"
              onClick={() => playSound('click')}
              style={{
                fontSize: '13px',
                background: 'linear-gradient(135deg, ' + tokens.color('g') + ', ' + tokens.color('c') + ')',
                color: tokens.color('bg'),
                boxShadow: '0 4px 16px ' + tokens.colorAlpha('g', 0.35),
              }}>
              <ArrowRight size={14} className="inline mr-1" /> Lanjut ke Pertemuan Berikutnya
            </button>
          )}
        </div>
      )}
    </div>
  );
}
