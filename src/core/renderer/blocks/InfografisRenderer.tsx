'use client';

import React from 'react';
import type { InfografisBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { PremiumBlockWrapper, ReadingProgressIndicator } from './PremiumBlockEffects';
import type { CompressionDecision } from '../../layout/CompressionEngine';
import { useBlockCompression } from '../../layout/useBlockCompression';
import { ShowMoreButton } from '../../layout/ShowMoreButton';

// ═══════════════════════════════════════════════════════════════════
// INFOGRAFIS RENDERER — Visual info cards with icon/judul/isi/warna
// ═══════════════════════════════════════════════════════════════════
// Renders InfografisBlock — each kartu has icon, judul, isi, warna.
// Different from NcGridRenderer which renders NcGridBlock with
// cards[].icon/title/body/color (different field names!).
//
// Layout variants:
//   grid — 2-column card grid (default)
//   list — vertical stacked cards with accent stripe
//   timeline — vertical timeline with dot + connector line
// ═══════════════════════════════════════════════════════════════════

/** Single info card — grid layout */
function InfografisCardGrid({ kartu, kartuIndex, blockId, tokens, isCompact, edu, accentColor }: {
  kartu: InfografisBlock['kartu'][number];
  kartuIndex: number;
  blockId: string;
  tokens: TokenResolver;
  isCompact: boolean;
  edu: ReturnType<typeof tokens.edu>;
  accentColor: string;
}) {
  const judulEditor = useInlineEditor({
    blockId,
    fieldKey: `kartu.${kartuIndex}.judul`,
    value: kartu.judul ?? '',
    tag: 'span',
  });
  const isiEditor = useInlineEditor({
    blockId,
    fieldKey: `kartu.${kartuIndex}.isi`,
    value: kartu.isi ?? '',
    tag: 'div',
    multiline: true,
  });

  const cardColor = tokens.color(kartu.warna || accentColor);

  return (
    <div
      className="rounded-xl min-w-0 relative overflow-hidden"
      style={{
        background: tokens.colorAlpha(kartu.warna || accentColor, 0.06),
        border: `1px solid ${tokens.colorAlpha(kartu.warna || accentColor, 0.18)}`,
        boxShadow: edu.shadow('card'),
        ...edu.componentPadding(),
        ...edu.entrance(kartuIndex),
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: cardColor }}
      />

      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
        style={{
          background: tokens.colorAlpha(kartu.warna || accentColor, 0.12),
        }}
      >
        <span style={{ fontSize: isCompact ? '16px' : '20px' }}>{kartu.icon}</span>
      </div>

      {/* Judul */}
      <InlineTextEditor
        {...judulEditor}
        className="font-bold mb-1"
        style={{
          ...edu.bodyLg(),
          fontWeight: 700,
          color: cardColor,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
        placeholder="Ketik judul..."
      />

      {/* Isi */}
      <InlineTextEditor
        {...isiEditor}
        className={`leading-relaxed ${isCompact ? 'line-clamp-3' : ''}`}
        style={{
          ...edu.body(),
          color: edu.mutedText(0.85),
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
        placeholder="Ketik isi..."
      />
    </div>
  );
}

/** Single info card — list layout (horizontal with accent stripe) */
function InfografisCardList({ kartu, kartuIndex, blockId, tokens, isCompact, edu, accentColor }: {
  kartu: InfografisBlock['kartu'][number];
  kartuIndex: number;
  blockId: string;
  tokens: TokenResolver;
  isCompact: boolean;
  edu: ReturnType<typeof tokens.edu>;
  accentColor: string;
}) {
  const judulEditor = useInlineEditor({
    blockId,
    fieldKey: `kartu.${kartuIndex}.judul`,
    value: kartu.judul ?? '',
    tag: 'span',
  });
  const isiEditor = useInlineEditor({
    blockId,
    fieldKey: `kartu.${kartuIndex}.isi`,
    value: kartu.isi ?? '',
    tag: 'div',
    multiline: true,
  });

  const cardColor = tokens.color(kartu.warna || accentColor);

  return (
    <div
      className="rounded-xl min-w-0"
      style={{
        background: tokens.colorAlpha(kartu.warna || accentColor, 0.04),
        border: `1px solid ${tokens.colorAlpha(kartu.warna || accentColor, 0.15)}`,
        borderLeft: `${edu.stripeWidth()}px solid ${cardColor}`,
        boxShadow: edu.shadow('card'),
        overflow: 'hidden',
        ...edu.entrance(kartuIndex),
      }}
    >
      <div className="flex items-start gap-3" style={{ ...edu.componentPadding(), paddingLeft: isCompact ? '14px' : '20px' }}>
        {/* Icon */}
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-lg"
          style={{
            ...tokens.iosIconSize('md'),
            background: tokens.colorAlpha(kartu.warna || accentColor, 0.1),
          }}
        >
          <span style={{ fontSize: isCompact ? '16px' : '20px' }}>{kartu.icon}</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <InlineTextEditor
            {...judulEditor}
            className="font-bold mb-0.5"
            style={{
              ...edu.bodyLg(),
              fontWeight: 700,
              color: cardColor,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
            placeholder="Ketik judul..."
          />
          <InlineTextEditor
            {...isiEditor}
            className="leading-relaxed"
            style={{
              ...edu.body(),
              color: edu.mutedText(0.85),
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
            placeholder="Ketik isi..."
          />
        </div>
      </div>
    </div>
  );
}

/** Single info card — timeline layout (vertical with dot + line) */
function InfografisCardTimeline({ kartu, kartuIndex, blockId, tokens, isCompact, edu, accentColor, isLast }: {
  kartu: InfografisBlock['kartu'][number];
  kartuIndex: number;
  blockId: string;
  tokens: TokenResolver;
  isCompact: boolean;
  edu: ReturnType<typeof tokens.edu>;
  accentColor: string;
  isLast: boolean;
}) {
  const judulEditor = useInlineEditor({
    blockId,
    fieldKey: `kartu.${kartuIndex}.judul`,
    value: kartu.judul ?? '',
    tag: 'span',
  });
  const isiEditor = useInlineEditor({
    blockId,
    fieldKey: `kartu.${kartuIndex}.isi`,
    value: kartu.isi ?? '',
    tag: 'div',
    multiline: true,
  });

  const cardColor = tokens.color(kartu.warna || accentColor);

  return (
    <div className="flex gap-3" style={{ ...edu.entrance(kartuIndex) }}>
      {/* Timeline dot + connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            background: tokens.colorAlpha(kartu.warna || accentColor, 0.15),
            border: `2px solid ${cardColor}`,
          }}
        >
          <span style={{ fontSize: '12px' }}>{kartu.icon}</span>
        </div>
        {!isLast && (
          <div
            className="w-0.5 flex-1 mt-1"
            style={{ background: tokens.colorAlpha(kartu.warna || accentColor, 0.15) }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-3">
        <InlineTextEditor
          {...judulEditor}
          className="font-bold mb-0.5"
          style={{
            ...edu.bodyLg(),
            fontWeight: 700,
            color: cardColor,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
          placeholder="Ketik judul..."
        />
        <InlineTextEditor
          {...isiEditor}
          className="leading-relaxed"
          style={{
            ...edu.body(),
            color: edu.mutedText(0.85),
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
          placeholder="Ketik isi..."
        />
      </div>
    </div>
  );
}

export const InfografisRenderer = React.memo(function InfografisRenderer({
  block, tokens, isCompact, isEditing, interactive, compression
}: {
  block: InfografisBlock;
  tokens: TokenResolver;
  isCompact: boolean;
  isEditing?: boolean;
  interactive?: boolean;
  compression?: CompressionDecision;
}) {
  const edu = tokens.edu('infografis', isCompact);
  const layout = block.layoutVariant || block.layout || 'grid';
  const accentColor = block.accentColor || 'c';

  const allKartu = block.kartu || [];

  // Compression-aware visibility
  const { visibleCount, hasMore, hiddenCount, showMore, isCompressed } = useBlockCompression({
    compression,
    totalItems: allKartu.length,
  });
  const kartu = isCompressed ? allKartu.slice(0, visibleCount) : allKartu;

  return (
    <PremiumBlockWrapper tokens={tokens} accent={accentColor} staggerIndex={0}>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent={accentColor} height={2} position="top" />

      <div>
        {/* Block title */}
        {block.title && (
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold"
              style={{
                ...edu.caption(),
                background: tokens.accentBg(accentColor, 0.08),
                color: tokens.color(accentColor),
                border: `1px solid ${tokens.colorAlpha(accentColor, 0.2)}`,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>info</span>
              {block.title}
            </span>
          </div>
        )}

        {/* Intro text */}
        {block.intro && (
          <p className="mb-3" style={{ ...edu.body(), color: edu.mutedText(0.8) }}>
            {block.intro}
          </p>
        )}

        {/* Cards container — layout dependent */}
        {layout === 'grid' && (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: isCompact ? '1fr' : 'repeat(2, 1fr)',
              minWidth: 0,
            }}
          >
            {kartu.map((k: InfografisBlock['kartu'][number], i: number) => (
              <InfografisCardGrid
                key={`info-grid-${k.judul?.slice(0,8)}-${i}`}
                kartu={k}
                kartuIndex={i}
                blockId={block.id!}
                tokens={tokens}
                isCompact={isCompact}
                edu={edu}
                accentColor={accentColor}
              />
            ))}
          </div>
        )}

        {layout === 'list' && (
          <div className="flex flex-col gap-2.5">
            {kartu.map((k: InfografisBlock['kartu'][number], i: number) => (
              <InfografisCardList
                key={`info-list-${k.judul?.slice(0,8)}-${i}`}
                kartu={k}
                kartuIndex={i}
                blockId={block.id!}
                tokens={tokens}
                isCompact={isCompact}
                edu={edu}
                accentColor={accentColor}
              />
            ))}
          </div>
        )}

        {layout === 'timeline' && (
          <div className="flex flex-col">
            {kartu.map((k: InfografisBlock['kartu'][number], i: number) => (
              <InfografisCardTimeline
                key={`info-tl-${k.judul?.slice(0,8)}-${i}`}
                kartu={k}
                kartuIndex={i}
                blockId={block.id!}
                tokens={tokens}
                isCompact={isCompact}
                edu={edu}
                accentColor={accentColor}
                isLast={i === kartu.length - 1}
              />
            ))}
          </div>
        )}

        {/* Compression: Show More */}
        {hasMore && (
          <ShowMoreButton
            hiddenCount={hiddenCount}
            onShowMore={showMore}
            itemLabel="kartu lagi"
            isCompact={isCompact}
            tokens={tokens}
          />
        )}
      </div>
    </PremiumBlockWrapper>
  );
});
