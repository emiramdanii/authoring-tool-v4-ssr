'use client';

import React from 'react';
import type { CoverBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

export function CoverRenderer({ block, tokens, interactive, isCompact, isEditing }: {
  block: CoverBlock; tokens: TokenResolver; interactive?: boolean; isCompact?: boolean; isEditing?: boolean;
}) {
  const y = tokens.color('y');
  const c = tokens.color('c');
  const g = tokens.color('g');
  const accentKey = block.accentColor || 'y';

  // ── Inline editing hooks ─────────────────────────────────────
  // When editing mode is active, text fields become contentEditable.
  // The hook reads editingBlockId from the store and creates onSave
  // handlers that call updateSchemaBlock with deep patches.
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
    tag: 'p',
  });

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
      style={{ background: 'radial-gradient(ellipse 90% 60% at 50% 0%, ' + tokens.colorAlpha(accentKey, 0.22) + ', transparent 60%), linear-gradient(180deg, ' + tokens.color('bg') + ', ' + tokens.color('bg2') + ')' }}>

      {/* Decorative top bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5"
        style={{ background: 'linear-gradient(90deg, ' + y + ', ' + c + ', ' + y + ')' }} />

      {/* Icon with glowing container */}
      <div className="mb-5 relative">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: tokens.colorAlpha(accentKey, 0.18),
            boxShadow: '0 0 40px ' + tokens.colorAlpha(accentKey, 0.25) + ', 0 8px 24px rgba(0,0,0,.3)',
            backdropFilter: 'blur(8px)',
          }}>
          <div className="text-4xl" style={{ animation: 'float 3s ease-in-out infinite' }}>
            {block.icon}
          </div>
        </div>
      </div>

      <div className="text-[11px] font-extrabold tracking-widest uppercase"
        style={{ color: c }}>
        {block.meta?.elemen || ''} · Kelas {block.meta?.fase || 'VII'}
      </div>

      {/* Title — inline editable when in editing mode */}
      <h1 className="font-black text-white leading-tight mt-3"
        style={{ fontSize: 'clamp(18px, 3.5vw, 32px)', fontFamily: tokens.fontFamily('display'), textShadow: '0 2px 12px rgba(0,0,0,.5)' }}>
        <InlineTextEditor
          {...titleEditor}
          className="font-black text-white leading-tight"
          style={{ color: y, fontSize: 'inherit', fontFamily: 'inherit', textShadow: 'inherit' }}
        />
        {block.title.includes(' — ') && <><br /><span>{block.title.split(' — ')[1]}</span></>}
      </h1>

      {/* Subtitle — inline editable when in editing mode */}
      <InlineTextEditor
        {...subtitleEditor}
        className="mt-3 max-w-[380px] text-white/70"
        style={{ fontSize: 'clamp(11px, 1.8vw, 16px)' }}
        placeholder="Ketik subtitle..."
      />

      {/* Badges — glass-morphism pill style */}
      {block.badges && block.badges.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {block.badges.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold"
              style={{
                background: tokens.colorAlpha(b.color, 0.2),
                color: tokens.color(b.color),
                border: '1px solid ' + tokens.colorAlpha(b.color, 0.35),
                backdropFilter: 'blur(12px)',
                boxShadow: '0 2px 8px ' + tokens.colorAlpha(b.color, 0.15),
              }}>
              {b.icon && <span>{b.icon}</span>} {b.text}
            </span>
          ))}
        </div>
      )}

      {/* Meta — glass card */}
      {block.meta && (
        <div className="mt-5 px-4 py-2.5 rounded-xl text-[10px] text-white/60"
          style={{
            background: tokens.colorAlpha('c', 0.08),
            border: '1px solid ' + tokens.colorAlpha('c', 0.2),
            backdropFilter: 'blur(8px)',
          }}>
          ⏱️ {block.meta.durasi} | 🎯 Fase {block.meta.fase} | 📚 Elemen: {block.meta.elemen}
        </div>
      )}

      {/* CTA — show always; interactive hover only in preview/export */}
      {block.cta && (
        <button className={`mt-6 rounded-[99px] text-[0.9rem] font-extrabold transition-all ${
          interactive ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default'
        }`}
          style={{
            background: 'linear-gradient(135deg, ' + y + ', ' + tokens.color('o') + ')',
            color: tokens.color('bg'),
            padding: '12px 28px',
            boxShadow: '0 6px 24px ' + tokens.colorAlpha('y', 0.4) + ', 0 2px 8px rgba(0,0,0,.2)',
          }}>
          {block.cta.label}
        </button>
      )}

      {/* Bottom decoration */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {[y, c, g].map((color, i) => (
          <div key={i} className="w-10 h-1.5 rounded-full" style={{ background: color, opacity: 0.7, boxShadow: '0 0 8px ' + tokens.colorAlpha(['y','c','g'][i], 0.4) }} />
        ))}
      </div>
    </div>
  );
}
