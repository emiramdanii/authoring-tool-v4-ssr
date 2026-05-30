'use client';

import React, { useState } from 'react';
import type { AccordionBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { PremiumBlockWrapper, ReadingProgressIndicator, MicroInteraction } from './PremiumBlockEffects';
import { playSound } from '@/lib/sounds';
import type { CompressionDecision } from '../../layout/CompressionEngine';
import { useBlockCompression } from '../../layout/useBlockCompression';
import { ShowMoreButton } from '../../layout/ShowMoreButton';

// ═══════════════════════════════════════════════════════════════════
// ACCORDION RENDERER — Simple expandable sections with icon/judul/isi
// ═══════════════════════════════════════════════════════════════════
// Renders AccordionBlock — each item has icon, judul, isi.
// Different from TabelAccordionRenderer which renders TabelAccordionBlock
// with rows[].details: Array<{label, value}> (table-like key-value pairs).
//
// This renderer uses simple expandable sections with:
//   - Icon + title header (clickable)
//   - Expandable body text
//   - Optional intro text above
//   - Compression support (show more/less)
// ═══════════════════════════════════════════════════════════════════

/** Inner accordion item — one expandable section */
function AccordionItem({ item, itemIndex, blockId, tokens, isOpen, onToggle, interactive, isCompact, edu, accentColor }: {
  item: AccordionBlock['items'][number];
  itemIndex: number;
  blockId: string;
  tokens: TokenResolver;
  isOpen: boolean;
  onToggle: () => void;
  interactive?: boolean;
  isCompact?: boolean;
  edu: ReturnType<typeof tokens.edu>;
  accentColor: string;
}) {
  const judulEditor = useInlineEditor({
    blockId,
    fieldKey: `items.${itemIndex}.judul`,
    value: item.judul ?? '',
    tag: 'span',
  });
  const isiEditor = useInlineEditor({
    blockId,
    fieldKey: `items.${itemIndex}.isi`,
    value: item.isi ?? '',
    tag: 'div',
    multiline: true,
  });

  const color = tokens.color(accentColor);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        border: `1px solid ${isOpen ? tokens.colorAlpha(accentColor, 0.3) : tokens.colorAlpha(accentColor, 0.1)}`,
        background: isOpen ? tokens.colorAlpha(accentColor, 0.06) : tokens.colorAlpha(accentColor, 0.02),
        boxShadow: isOpen ? `0 2px 8px ${tokens.colorAlpha(accentColor, 0.1)}` : 'none',
      }}
    >
      <MicroInteraction tokens={tokens} accent={accentColor} effect="squish">
        <button
          className="w-full flex items-center gap-2.5 p-3 cursor-pointer text-left"
          style={{ background: isOpen ? tokens.colorAlpha(accentColor, 0.03) : 'transparent' }}
          aria-expanded={isOpen}
          aria-controls={`accord-simple-${blockId}-${itemIndex}`}
          onClick={() => {
            onToggle();
            if (interactive) playSound(isOpen ? 'click' : 'tap');
          }}
        >
          {/* Icon circle */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: tokens.colorAlpha(accentColor, 0.15),
              boxShadow: isOpen ? `0 2px 6px ${tokens.colorAlpha(accentColor, 0.2)}` : 'none',
            }}
          >
            <span style={{ fontSize: isCompact ? '14px' : '16px' }}>{item.icon}</span>
          </div>

          {/* Judul */}
          <InlineTextEditor
            {...judulEditor}
            className="font-bold min-w-0 flex-1"
            style={{
              ...edu.bodyLg(),
              fontWeight: 700,
              color: isOpen ? color : edu.textColor(),
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
            placeholder="Ketik judul..."
          />

          {/* Expand chevron */}
          <span
            className="flex-shrink-0 transition-transform duration-200"
            style={{
              ...edu.caption(),
              transform: isOpen ? 'rotate(180deg)' : 'none',
              color: tokens.color(accentColor),
            }}
          >
            ▼
          </span>
        </button>
      </MicroInteraction>

      {/* Expandable content */}
      {isOpen && (
        <div
          className="px-3.5 pb-3.5"
          id={`accord-simple-${blockId}-${itemIndex}`}
          style={{ animation: 'fadeIn 0.3s ease' }}
        >
          {/* Divider */}
          <div
            className="mb-2.5 h-px"
            style={{ background: tokens.colorAlpha(accentColor, 0.1) }}
          />
          <InlineTextEditor
            {...isiEditor}
            className="leading-relaxed"
            style={{
              ...edu.body(),
              color: edu.mutedText(0.9),
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
            placeholder="Ketik isi..."
          />
        </div>
      )}
    </div>
  );
}

export const AccordionRenderer = React.memo(function AccordionRenderer({
  block, tokens, isCompact, isEditing, interactive, compression
}: {
  block: AccordionBlock;
  tokens: TokenResolver;
  isCompact: boolean;
  isEditing?: boolean;
  interactive?: boolean;
  compression?: CompressionDecision;
}) {
  const edu = tokens.edu('accordion', isCompact);
  const accentColor = block.accentColor || 'c';

  const [openIdx, setOpenIdx] = useState<number | null>(0); // First item open by default

  const allItems = block.items || [];

  // Compression-aware visibility
  const { visibleCount, hasMore, hiddenCount, showMore, isCompressed } = useBlockCompression({
    compression,
    totalItems: allItems.length,
  });
  const items = isCompressed ? allItems.slice(0, visibleCount) : allItems;

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
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>unfold_more</span>
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

        {/* Accordion items */}
        <div className="flex flex-col gap-2">
          {items.map((item: AccordionBlock['items'][number], i: number) => (
            <AccordionItem
              key={`accord-item-${item.judul?.slice(0,8)}-${i}`}
              item={item}
              itemIndex={i}
              blockId={block.id!}
              tokens={tokens}
              isOpen={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? null : i)}
              interactive={interactive}
              isCompact={isCompact}
              edu={edu}
              accentColor={accentColor}
            />
          ))}

          {/* Compression: Show More button */}
          {hasMore && (
            <ShowMoreButton
              hiddenCount={hiddenCount}
              onShowMore={showMore}
              itemLabel="bagian lagi"
              isCompact={isCompact}
              tokens={tokens}
            />
          )}
        </div>

        {/* Expand/Collapse all — when more than 3 items */}
        {allItems.length > 3 && !isCompressed && (
          <div className="mt-2 flex justify-center">
            <button
              className="px-3 py-1 rounded-lg text-xs font-bold transition-colors"
              style={{
                color: tokens.color(accentColor),
                background: tokens.colorAlpha(accentColor, 0.06),
                border: `1px solid ${tokens.colorAlpha(accentColor, 0.15)}`,
              }}
              onClick={() => setOpenIdx(openIdx !== null ? null : 0)}
            >
              {openIdx !== null ? 'Tutup Semua' : 'Buka Semua'}
            </button>
          </div>
        )}
      </div>
    </PremiumBlockWrapper>
  );
});
