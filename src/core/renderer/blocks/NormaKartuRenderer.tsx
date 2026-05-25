'use client';

import React from 'react';
import type { NormaKartuBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { RichText } from './RichText';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { fireConfettiMini } from '@/lib/confetti';
import type { CompressionDecision } from '../../layout/CompressionEngine';
import { useBlockCompression } from '../../layout/useBlockCompression';

export const NormaKartuRenderer = React.memo(function NormaKartuRenderer({ block, tokens, isCompact, isEditing, compression }: {
  block: NormaKartuBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; compression?: CompressionDecision;
}) {
  // ── Edu rendering context ────────────────────────────────────
  const edu = tokens.edu('nk-card', isCompact);

  const colorMap: Record<string, string> = {
    agama: 'y',
    kesusilaan: 'r',
    kesopanan: 'c',
    hukum: 'p',
  };
  const colorKey = colorMap[block.normaType] || 'y';
  const color = tokens.color(colorKey);

  // ── Compression-aware visibility (accordion strategy) ────────
  const { isCompressed } = useBlockCompression({
    compression,
    totalItems: 1, // NormaKartu is a single card unit
  });

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
    <PremiumBlockWrapper tokens={tokens} accent="c" staggerIndex={0} gradientBorder>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent="c" height={2} position="top" />
    <div className="rounded-2xl premium-card-glow p-4" style={{
      background: tokens.colorAlpha(colorKey, 0.12),
      border: '1px solid ' + tokens.colorAlpha(colorKey, 0.3),
      boxShadow: edu.shadow('card'),
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
          <PremiumBadge tokens={tokens} accent={colorKey} variant="solid">{block.label}</PremiumBadge>
          <div className="font-black mt-0.5" style={{ ...edu.heading(), fontFamily: tokens.fontFamily('display'), color }}>
            <InlineTextEditor {...titleEditor} className="font-black" style={{ color, fontSize: 'inherit', fontFamily: 'inherit' }} />
          </div>
        </div>
      </div>

      {/* Definition */}
      <div className={`leading-relaxed mb-4 ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ ...edu.body(), color: edu.textColor(), wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        <InlineTextEditor {...definitionEditor} className="leading-relaxed" style={{ overflowWrap: 'break-word', fontSize: 'inherit' }} placeholder="Ketik definisi..." />
      </div>

      {/* Characteristics 2-col — hidden when compressed */}
      {!isCompressed && (block.characteristics || []).length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {(block.characteristics || []).map((c, i) => (
            <MicroInteraction key={`nk-char-mi-${c.label?.slice(0,8)}-${i}`} tokens={tokens} accent={colorKey} effect="squish">
            <div className="rounded-xl p-3 min-w-0 overflow-hidden"
              style={{
                background: tokens.colorAlpha(colorKey, 0.08),
                border: '1px solid ' + tokens.colorAlpha(colorKey, 0.15),
              }}>
              <div className="font-extrabold uppercase tracking-wider mb-1" style={{ ...edu.caption(), color, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{c.label}</div>
              <div className={`leading-relaxed ${isCompact ? 'canvas-truncate-1' : ''}`} style={{ ...edu.body(), color: edu.textColor(), wordBreak: 'break-word', overflowWrap: 'break-word' }}><RichText content={c.value ?? ''} /></div>
            </div>
            </MicroInteraction>
          ))}
        </div>
      )}

      {/* Sanksi — hidden when compressed */}
      {!isCompressed && block.sanksi && (
        <MicroInteraction tokens={tokens} accent="o" effect="squish">
        <div className="rounded-xl p-3 mt-3"
          style={{
            background: tokens.colorAlpha('o', 0.08),
            border: '1px solid ' + tokens.colorAlpha('o', 0.2),
            borderLeft: `${edu.stripeWidth()}px solid ${tokens.color('o')}`,
            overflow: 'hidden',
          }}>
          <div className="font-extrabold uppercase tracking-wider mb-1.5" style={{ ...edu.caption(), color: tokens.color('o'), wordBreak: 'break-word' }}>{block.sanksi.title}</div>
          {block.sanksi.items.map((s, i) => (
            <div key={`nk-sanksi-${s.text?.slice(0,8)}-${i}`} className={`flex items-start gap-2 mb-1.5 leading-relaxed min-w-0 ${isCompact ? 'canvas-truncate-1' : ''}`} style={{ ...edu.body(), color: edu.textColor() }}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: s.dot || color }} />
              <span className="min-w-0" style={{ wordBreak: 'break-word' }}><RichText content={s.text ?? ''} /></span>
            </div>
          ))}
        </div>
        </MicroInteraction>
      )}

      {/* Contoh — hidden when compressed */}
      {!isCompressed && block.contoh && (
        <MicroInteraction tokens={tokens} accent={colorKey} effect="bounce">
        <div className="mt-3 p-3 rounded-xl leading-relaxed"
          style={{
            ...edu.body(),
            background: tokens.colorAlpha(colorKey, 0.08),
            border: '1px solid ' + tokens.colorAlpha(colorKey, 0.15),
            borderLeft: `${edu.stripeWidth()}px solid ${color}`,
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}>
          <span className="font-extrabold" style={{ color }}>📖 Contoh:</span> <InlineTextEditor {...contohEditor} className={`leading-relaxed ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word', fontSize: 'inherit' }} placeholder="Ketik contoh..." />
        </div>
        </MicroInteraction>
      )}

      {/* Pelanggaran — hidden when compressed */}
      {!isCompressed && block.pelanggaran && (
        <MicroInteraction tokens={tokens} accent="r" effect="squish">
        <div className="mt-3 p-3 rounded-xl"
          style={{
            background: tokens.colorAlpha('r', 0.08),
            border: '1px solid ' + tokens.colorAlpha('r', 0.25),
            borderLeft: `${edu.stripeWidth()}px solid ${tokens.color('r')}`,
            overflow: 'hidden',
          }}>
          <div className="font-extrabold uppercase tracking-wider mb-1.5"
            style={{ ...edu.caption(), color: tokens.color('r'), wordBreak: 'break-word' }}>{block.pelanggaran.title}</div>
          {block.pelanggaran.items.map((p, i) => (
            <div key={`nk-pelanggaran-${p.text?.slice(0,8)}-${i}`} className="flex gap-2 mb-1.5 leading-relaxed min-w-0" style={{ ...edu.body(), color: edu.textColor() }}>
              <span className="flex-shrink-0">{p.icon}</span> <span className="min-w-0" style={{ wordBreak: 'break-word' }}><RichText content={p.text ?? ''} /></span>
            </div>
          ))}
        </div>
        </MicroInteraction>
      )}
    </div>
    </PremiumBlockWrapper>
  );
});