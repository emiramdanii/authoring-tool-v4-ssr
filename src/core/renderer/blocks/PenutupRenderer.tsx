'use client';

import React from 'react';
import { CheckCircle2, ArrowRight, BookOpen, Trophy, Star, Target, Zap } from 'lucide-react';
import type { PenutupBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { RichText } from './RichText';
import { playSound } from '@/lib/sounds';
import { useCanvaStore } from '../../../store/canva/store';
import { useInteractiveStore } from '@/store/interactive-store';
import { PremiumBlockWrapper, ReadingProgressIndicator } from './PremiumBlockEffects';
import type { CompressionDecision } from '../../layout/CompressionEngine';
import { useBlockCompression } from '../../layout/useBlockCompression';
import { ShowMoreButton } from '../../layout/ShowMoreButton';

export const PenutupRenderer = React.memo(function PenutupRenderer({ block, tokens, isCompact, isEditing, interactive, compression }: {
  block: PenutupBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; interactive?: boolean; compression?: CompressionDecision;
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

  // ── Score-based badge (Phase 21) ───────────────────────────────
  const scores = useInteractiveStore(s => s.scores);
  const totalScore = useInteractiveStore(s => s.totalScore());
  const totalMax = useInteractiveStore(s => s.totalMax());
  const totalPct = useInteractiveStore(s => s.totalPct());
  const allComplete = useInteractiveStore(s => s.allPagesComplete());
  const hasScores = scores.length > 0;

  const tier = totalPct >= 90 ? 'excellent' : totalPct >= 75 ? 'good' : totalPct >= 50 ? 'fair' : 'needs-practice';
  const tierConfig = React.useMemo(() => hasScores ? {
    'excellent': { label: 'Luar Biasa!', color: 'y', emoji: '🏆', icon: <Trophy size={16} /> },
    'good': { label: 'Hebat!', color: 'g', emoji: '⭐', icon: <Star size={16} /> },
    'fair': { label: 'Cukup Baik', color: 'c', emoji: '🎯', icon: <Target size={16} /> },
    'needs-practice': { label: 'Terus Berlatih!', color: 'o', emoji: '💪', icon: <Zap size={16} /> },
  }[tier] : null, [hasScores, tier]);

  const isCompressed = compression?.isCompressed ?? false;

  // ── Compression-aware preview item visibility (reveal-set) ─
  const allPreviewItems = block.preview || [];
  const { visibleCount, hasMore, hiddenCount, showMore } = useBlockCompression({
    compression,
    totalItems: allPreviewItems.length,
  });
  const previewItems = isCompressed ? allPreviewItems.slice(0, visibleCount) : allPreviewItems;

  return (
    <PremiumBlockWrapper tokens={tokens} accent="g" staggerIndex={0}>
    <ReadingProgressIndicator progress={1} tokens={tokens} accent="g" height={2} position="top" />
    <div style={{ position: 'relative', maxWidth: tokens.contentWidth(), margin: '0 auto' }}>
      {/* Header with completion icon */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: tokens.accentBg('g', 0.08),
            border: `1px solid ${tokens.colorAlpha('g', 0.15)}`,
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
          <div key={`penutup-line-${i}`} className="h-1 rounded-full flex-1" style={{
            background: tokens.color(color),
            opacity: 0.6 - i * 0.15,
          }} />
        ))}
      </div>

      {/* ── Score-based badge (Phase 21) — shown when scores exist ── */}
      {hasScores && tierConfig && !isCompressed && (
        <div className="mb-4 p-3 rounded-xl"
          style={{
            ...tokens.cardStyle(),
          }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: isCompact ? '16px' : '18px' }}>{tierConfig.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: tokens.color(tierConfig.color), fontSize: isCompact ? '13px' : '15px' }}>
                  {tierConfig.label}
                </span>
                <span className="font-black text-lg" style={{ color: tokens.color(tierConfig.color) }}>
                  {totalPct}%
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px]" style={{ color: tokens.muted(0.65) }}>
                  {totalScore}/{totalMax} poin
                </span>
                <span className="text-[10px]" style={{ color: tokens.muted(0.55) }}>
                  · {scores.filter(s => s.completed).length} aktivitas
                </span>
              </div>
              {/* Thin progress bar */}
              <div className="mt-1.5 w-full h-1 rounded-full overflow-hidden"
                style={{ background: tokens.subtleBg(0.06) }}>
                <div className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${totalPct}%`,
                    background: tokens.color(tierConfig.color),
                  }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview items - improved with card styling */}
      {previewItems.length > 0 && (
        <div className="mb-4 p-4 rounded-xl"
          style={{
            ...tokens.cardStyle(),
          }}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={14} style={{ color: tokens.color('c') }} />
            <div className="font-bold uppercase tracking-wider" style={{ color: tokens.color('c'), fontSize: isCompact ? '10px' : '12px' }}>
              Ringkasan Pembelajaran
            </div>
          </div>
          {previewItems.map((item, i) => (
            <div key={`penutup-preview-${item.judul?.slice(0,8)}-${i}`} className="flex items-start gap-2.5 py-2 leading-relaxed min-w-0"
              style={{
                fontSize: isCompact ? '11px' : '13px',
                borderBottom: i < previewItems.length - 1 ? `1px solid ${tokens.subtleBorder(0.06)}` : 'none',
              }}>
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: tokens.color(item.warna) }} />
              <div style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}><strong style={{ color: tokens.color(item.warna) }}>{item.judul}</strong> — <span className={isCompact ? 'canvas-truncate-2' : ''} style={{ color: tokens.muted(0.8) }}><RichText content={item.isi ?? ''} /></span></div>
            </div>
          ))}
        </div>
      )}

      {/* Next pertemuan preview — hidden when compressed */}
      {!isCompressed && block.nextPertemuan && (
        <div className="mt-4 p-4 rounded-xl"
          style={{
            ...tokens.cardStyle(),
            borderLeft: `3px solid ${tokens.color('g')}`,
          }}>
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight size={14} style={{ color: tokens.color('g') }} />
            <div className="font-bold" style={{ color: tokens.color('g'), fontSize: isCompact ? '12px' : '14px' }}>Pertemuan Berikutnya</div>
          </div>
          <div className="mb-3 font-bold" style={{ color: tokens.color('text'), fontSize: isCompact ? '12px' : '14px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            <RichText content={block.nextPertemuan.judul ?? ''} />
          </div>
          <div className={`mb-3 ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ color: tokens.muted(0.8), fontSize: isCompact ? '11px' : '13px', wordBreak: 'break-word', overflowWrap: 'break-word' }}><RichText content={block.nextPertemuan.deskripsi ?? ''} /></div>
          <div className="space-y-1.5">
            {(block.nextPertemuan.items || []).map((item, i) => (
              <div key={`penutup-next-${item.judul?.slice(0,8)}-${i}`} className="flex items-center gap-2 py-1 min-w-0"
                style={{
                  fontSize: isCompact ? '11px' : '13px',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tokens.color(item.warna) }} />
                <span style={{ color: tokens.color(item.warna) }}>{item.icon}</span>
                <span className="font-bold" style={{ color: tokens.color('text') }}>{item.judul}</span>
              </div>
            ))}
          </div>

          {/* Call-to-action for next meeting — navigates to next page */}
          {interactive && (
            <button className="w-full mt-3 py-2.5 rounded-xl font-bold transition-all"
              onClick={() => {
                playSound('click');
                // Navigate to next page if available
                const store = useCanvaStore.getState();
                const { currentPageIndex, pages } = store;
                if (currentPageIndex < pages.length - 1) {
                  store.goPage(currentPageIndex + 1);
                }
              }}
              style={{
                fontSize: '13px',
                background: tokens.accentBg('g', 0.1),
                color: tokens.color('g'),
                border: `1px solid ${tokens.colorAlpha('g', 0.2)}`,
              }}>
              <ArrowRight size={14} className="inline mr-1" /> Lanjut ke Pertemuan Berikutnya
            </button>
          )}
        </div>
      )}
      {/* ═══ COMPRESSION: Show More button ════════════════════════ */}
      {hasMore && (
        <ShowMoreButton
          hiddenCount={hiddenCount}
          onShowMore={showMore}
          itemLabel="ringkasan lagi"
          isCompact={isCompact}
        />
      )}
    </div>
    </PremiumBlockWrapper>
  );
});