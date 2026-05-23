'use client';

import React from 'react';
import { Target, Link2 } from 'lucide-react';
import type { TpBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { RichText } from './RichText';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { useBlockCompression } from '../../layout/useBlockCompression';
import { ShowMoreButton } from '../../layout/ShowMoreButton';
import type { CompressionDecision } from '../../layout/CompressionEngine';

export const TpRenderer = React.memo(function TpRenderer({ block, tokens, isCompact, isEditing, interactive, compression }: {
  block: TpBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; interactive?: boolean; compression?: CompressionDecision;
}) {
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

  const allItems = block.items || [];

  // ── "Sudah Paham" tracking (interactive mode only) ──────────
  const [understood, setUnderstood] = React.useState<Set<number>>(new Set());
  const toggleUnderstood = (idx: number) => {
    setUnderstood(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };
  const allUnderstood = allItems.length > 0 && allItems.every((_, i) => understood.has(i));

  // ── Compression-aware item visibility ──────────────────────
  const { visibleCount, hasMore, hiddenCount, showMore, isCompressed } = useBlockCompression({
    compression,
    totalItems: allItems.length,
  });
  const items = isCompressed ? allItems.slice(0, visibleCount) : allItems;

  return (
    <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0}>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent="y" height={2} position="top" />
    <div className={isCompact ? 'p-1' : 'p-2'}>
      {/* Header with icon */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: tokens.colorAlpha('y', 0.15),
            border: '1px solid ' + tokens.colorAlpha('y', 0.3),
            boxShadow: '0 0 12px ' + tokens.colorAlpha('y', 0.1),
          }}>
          <Target size={16} style={{ color: tokens.color('y') }} />
        </div>
        <h2 className="font-black leading-tight min-w-0"
          style={{ fontSize: isCompact ? '16px' : '1.6rem', fontFamily: tokens.fontFamily('display'), wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          <InlineTextEditor
            {...titleEditor}
            className="font-black leading-tight"
            style={{ fontSize: 'inherit', fontFamily: 'inherit', color: tokens.color('text'), wordBreak: 'break-word' }}
          /> <InlineTextEditor
            {...titleHighlightEditor}
            className="font-black leading-tight"
            style={{ color: tokens.color('y'), fontSize: 'inherit', fontFamily: 'inherit', wordBreak: 'break-word' }}
          />
        </h2>
      </div>

      {/* All understood indicator — interactive mode */}
      {interactive && allUnderstood && !isCompact && allItems.length > 0 && (
        <MicroInteraction tokens={tokens} accent="g" effect="bounce">
          <div className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2"
            style={{
              background: tokens.colorAlpha('g', 0.1),
              border: `1px solid ${tokens.colorAlpha('g', 0.25)}`,
              fontSize: '12px',
              color: tokens.color('g'),
              fontWeight: 700,
            }}>
            🎉 Semua tujuan sudah dipahami!
          </div>
        </MicroInteraction>
      )}

      {/* Decorative line */}
      <div className="flex gap-1.5 mb-4">
        {['y', 'c', 'g'].map((color, i) => (
          <div key={`tp-line-${i}`} className="h-1 rounded-full flex-1" style={{
            background: tokens.color(color),
            opacity: 0.6 - i * 0.15,
          }} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item, i) => {
          // Animated connector line between items
          const connector = i < items.length - 1;
          return (
            <div key={`tp-item-${item.num || i}-${item.verb?.slice(0,8) || ''}`}>
              <div className="flex items-start gap-3 rounded-xl p-3 transition-all hover:-translate-y-0.5 min-w-0"
                style={{
                  background: tokens.colorAlpha(item.color, 0.1),
                  border: '1px solid ' + tokens.colorAlpha(item.color, 0.25),
                  borderLeft: '4px solid ' + tokens.color(item.color),
                  borderRadius: tokens.radius('xl') + 'px',
                  boxShadow: tokens.raw.shadow.card,
                }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-black flex-shrink-0"
                  style={{
                    background: tokens.colorAlpha(item.color, 0.2),
                    color: tokens.color(item.color),
                    boxShadow: '0 4px 12px ' + tokens.colorAlpha(item.color, 0.25),
                    fontSize: isCompact ? '11px' : '12px',
                  }}>
                  {item.num}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold" style={{ color: tokens.color(item.color), fontSize: isCompact ? '12px' : '14px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{item.verb}</div>
                  <div className={`leading-relaxed mt-0.5 ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ color: tokens.muted(0.85), fontSize: isCompact ? '12px' : '13px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{item.desc}</div>
                </div>
                {/* "Sudah Paham" checkbox — interactive/preview mode only */}
                {interactive && !isCompact && (
                  <button
                    onClick={() => toggleUnderstood(i)}
                    className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
                    style={{
                      background: understood.has(i) ? tokens.colorAlpha('g', 0.15) : tokens.colorAlpha('c', 0.06),
                      border: `1px solid ${understood.has(i) ? tokens.colorAlpha('g', 0.3) : tokens.colorAlpha('c', 0.15)}`,
                      fontSize: '10px',
                      color: understood.has(i) ? tokens.color('g') : tokens.muted(0.6),
                      cursor: 'pointer',
                    }}
                    aria-label={understood.has(i) ? 'Tandai belum paham' : 'Tandai sudah paham'}
                    aria-pressed={understood.has(i)}
                  >
                    {understood.has(i) ? '✅' : '○'} Sudah Paham
                  </button>
                )}
              </div>
              {/* Connector dot between items */}
              {connector && (
                <div className="flex justify-center py-1">
                  <div className="w-1.5 h-1.5 rounded-full"
                    style={{ background: tokens.colorAlpha(item.color, 0.3) }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasMore && (
        <ShowMoreButton
          hiddenCount={hiddenCount}
          onShowMore={showMore}
          itemLabel="tujuan lainnya"
          isCompact={isCompact}
          tokens={tokens}
        />
      )}

      {block.profil && (
        <div className="mt-4 p-3.5 rounded-xl premium-card-glow leading-relaxed"
          style={{
            background: tokens.colorAlpha('g', 0.12),
            border: '1px solid ' + tokens.colorAlpha('g', 0.3),
            borderLeft: '4px solid ' + tokens.color('g'),
            borderRadius: tokens.radius('xl') + 'px',
            boxShadow: tokens.raw.shadow.card,
            color: tokens.color('text'),
            fontSize: isCompact ? '11px' : '13px',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}>
          <div className="flex items-start gap-2">
            <Link2 size={14} className="inline flex-shrink-0 mt-0.5" style={{ color: tokens.color('g') }} />
            <div>
              <PremiumBadge tokens={tokens} accent="g" variant="outline">Profil Pelajar Pancasila</PremiumBadge> <RichText content={block.profil ?? ''} style={{ wordBreak: 'break-word' }} />
            </div>
          </div>
        </div>
      )}
    </div>
    </PremiumBlockWrapper>
  );
});
