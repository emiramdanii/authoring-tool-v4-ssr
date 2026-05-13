'use client';

import React from 'react';
import type { AlurBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';

export function AlurRenderer({ block, tokens, isCompact, isEditing }: {
  block: AlurBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
}) {
  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });
  const durasiEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'totalDurasi',
    value: block.totalDurasi ?? '',
    tag: 'span',
  });

  return (
    <PremiumBlockWrapper tokens={tokens} accent="c" staggerIndex={0}>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent="c" height={2} position="top" />
    <div className="mt-3 rounded-xl premium-card-glow"
      style={{
        padding: isCompact ? '8px' : '14px',
        background: tokens.colorAlpha('c', 0.08),
        border: '1px solid ' + tokens.colorAlpha('c', 0.2),
        boxShadow: tokens.raw.shadow.card,
      }}>
      <div className="font-extrabold uppercase tracking-wider mb-3"
        style={{ color: tokens.color('c'), fontSize: isCompact ? '10px' : '12px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        ⏱️ <InlineTextEditor {...titleEditor} /> — <InlineTextEditor {...durasiEditor} placeholder="Durasi..." />
      </div>
      <div className="flex flex-col gap-2">
        {(block.steps || []).map((step, i) => (
          <div key={`alur-step-${step.judul?.slice(0,8)}-${i}`} className="flex gap-2.5 items-start p-3 rounded-lg transition-all hover:-translate-y-0.5 min-w-0"
            style={{
              background: tokens.colorAlpha(step.dot, 0.08),
              border: '1px solid ' + tokens.colorAlpha(step.dot, 0.15),
              borderLeft: '3px solid ' + tokens.color(step.dot),
            }}>
            <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
              style={{ background: tokens.color(step.dot), boxShadow: '0 0 8px ' + tokens.colorAlpha(step.dot, 0.4) }} />
            <PremiumBadge tokens={tokens} accent={step.dot} variant="glass" isCompact={isCompact}>{step.durasi}</PremiumBadge>
            <span className={`leading-relaxed min-w-0 ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ fontSize: isCompact ? '11px' : '13px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              <strong style={{ color: tokens.color('text') }}>{step.judul}</strong> — <span style={{ color: tokens.muted(0.8) }}>{step.deskripsi}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
    </PremiumBlockWrapper>
  );
}
