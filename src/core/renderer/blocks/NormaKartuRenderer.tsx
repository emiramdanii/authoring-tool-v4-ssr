'use client';

import React from 'react';
import type { NormaKartuBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

export function NormaKartuRenderer({ block, tokens, isCompact, isEditing }: {
  block: NormaKartuBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
}) {
  const colorMap: Record<string, string> = {
    agama: 'y',
    kesusilaan: 'r',
    kesopanan: 'c',
    hukum: 'p',
  };
  const colorKey = colorMap[block.normaType] || 'y';
  const color = tokens.color(colorKey);

  // ── Inline editing hooks ─────────────────────────────────────
  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });
  const definitionEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'definition',
    value: block.definition ?? '',
    tag: 'span',
  });
  const contohEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'contoh',
    value: block.contoh ?? '',
    tag: 'span',
  });

  return (
    <div className="rounded-2xl p-4" style={{
      background: tokens.colorAlpha(colorKey, 0.12),
      border: '1px solid ' + tokens.colorAlpha(colorKey, 0.3),
      boxShadow: tokens.raw.shadow.card,
      animation: 'fadeIn 0.3s ease',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: tokens.colorAlpha(colorKey, 0.25),
            boxShadow: '0 6px 16px ' + tokens.colorAlpha(colorKey, 0.3),
          }}>
          {block.icon}
        </div>
        <div className="min-w-0">
          <div className="font-extrabold uppercase tracking-wider" style={{ fontSize: '12px', color }}>{block.label}</div>
          <div className="font-black text-[16px] mt-0.5" style={{ fontFamily: tokens.fontFamily('display'), color }}>
            <InlineTextEditor {...titleEditor} className="font-black text-[16px]" style={{ color }} />
          </div>
        </div>
      </div>

      {/* Definition */}
      <div className="leading-relaxed mb-4" style={{ fontSize: '13px', color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        <InlineTextEditor {...definitionEditor} className="text-[11px] leading-relaxed" style={{ overflowWrap: 'break-word' }} placeholder="Ketik definisi..." />
      </div>

      {/* Characteristics 2-col */}
      {(block.characteristics || []).length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {(block.characteristics || []).map((c, i) => (
            <div key={`nk-char-${c.label?.slice(0,8)}-${i}`} className="rounded-xl p-3 min-w-0 overflow-hidden"
              style={{
                background: tokens.colorAlpha(colorKey, 0.08),
                border: '1px solid ' + tokens.colorAlpha(colorKey, 0.15),
              }}>
              <div className="font-extrabold uppercase tracking-wider mb-1" style={{ fontSize: '12px', color, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{c.label}</div>
              <div className="leading-relaxed" style={{ fontSize: '12px', color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sanksi */}
      {block.sanksi && (
        <div className="rounded-xl p-3 mt-3"
          style={{
            background: tokens.colorAlpha('o', 0.08),
            border: '1px solid ' + tokens.colorAlpha('o', 0.2),
            borderLeft: '3px solid ' + tokens.color('o'),
            overflow: 'hidden',
          }}>
          <div className="font-extrabold uppercase tracking-wider mb-1.5" style={{ fontSize: '12px', color: tokens.color('o'), wordBreak: 'break-word' }}>{block.sanksi.title}</div>
          {block.sanksi.items.map((s, i) => (
            <div key={`nk-sanksi-${s.text?.slice(0,8)}-${i}`} className="flex items-start gap-2 mb-1.5 leading-relaxed min-w-0" style={{ fontSize: '12px', color: tokens.color('text') }}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: s.dot || color }} />
              <span className="min-w-0" style={{ wordBreak: 'break-word' }}>{s.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Contoh */}
      {block.contoh && (
        <div className="mt-3 p-3 rounded-xl leading-relaxed"
          style={{
            fontSize: '12px',
            background: tokens.colorAlpha(colorKey, 0.08),
            border: '1px solid ' + tokens.colorAlpha(colorKey, 0.15),
            borderLeft: '3px solid ' + color,
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}>
          <span className="font-extrabold" style={{ color }}>📖 Contoh:</span> <InlineTextEditor {...contohEditor} className="text-[10px] leading-relaxed" style={{ overflowWrap: 'break-word' }} placeholder="Ketik contoh..." />
        </div>
      )}

      {/* Pelanggaran */}
      {block.pelanggaran && (
        <div className="mt-3 p-3 rounded-xl"
          style={{
            background: tokens.colorAlpha('r', 0.08),
            border: '1px solid ' + tokens.colorAlpha('r', 0.25),
            borderLeft: '3px solid ' + tokens.color('r'),
            overflow: 'hidden',
          }}>
          <div className="font-extrabold uppercase tracking-wider mb-1.5"
            style={{ fontSize: '12px', color: tokens.color('r'), wordBreak: 'break-word' }}>{block.pelanggaran.title}</div>
          {block.pelanggaran.items.map((p, i) => (
            <div key={`nk-pelanggaran-${p.text?.slice(0,8)}-${i}`} className="flex gap-2 mb-1.5 leading-relaxed min-w-0" style={{ fontSize: '12px', color: tokens.color('text') }}>
              <span className="flex-shrink-0">{p.icon}</span> <span className="min-w-0" style={{ wordBreak: 'break-word' }}>{p.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
