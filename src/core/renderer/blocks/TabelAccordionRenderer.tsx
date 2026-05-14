'use client';

import React from 'react';
import type { TabelAccordionBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { playSound } from '@/lib/sounds';
import type { CompressionDecision } from '../../layout/CompressionEngine';
import { useBlockCompression } from '../../layout/useBlockCompression';
import { ShowMoreButton } from '../../layout/ShowMoreButton';

/** Inner detail item component so hooks are not called in loops */
function AccordionDetail({ detail, rowIndex, detailIndex, blockId, rowColor, tokens, isCompact }: {
  detail: { label: string; value: string };
  rowIndex: number;
  detailIndex: number;
  blockId: string;
  rowColor: string;
  tokens: TokenResolver;
  isCompact?: boolean;
}) {
  const labelEditor = useInlineEditor({
    blockId,
    fieldKey: `rows.${rowIndex}.details.${detailIndex}.label`,
    value: detail.label ?? '',
    tag: 'div',
  });
  const valueEditor = useInlineEditor({
    blockId,
    fieldKey: `rows.${rowIndex}.details.${detailIndex}.value`,
    value: detail.value ?? '',
    tag: 'div',
    multiline: true,
  });

  return (
    <div className="rounded-xl p-2.5 min-w-0"
      style={{
        fontSize: '12px',
        background: tokens.colorAlpha(rowColor, 0.08),
        border: '1px solid ' + tokens.colorAlpha(rowColor, 0.12),
      }}>
      <InlineTextEditor
        {...labelEditor}
        className="text-[10px] font-extrabold uppercase tracking-wider mb-1"
        style={{ color: tokens.color(rowColor), fontSize: 'inherit' }}
        placeholder="Ketik label..."
      />
      <InlineTextEditor
        {...valueEditor}
        className={`text-[10px] leading-relaxed ${isCompact ? 'canvas-truncate-1' : ''}`}
        style={{ fontSize: 'inherit', color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }}
        placeholder="Ketik nilai..."
      />
    </div>
  );
}

/** Inner row component so hooks are not called in loops */
function AccordionRow({ row, rowIndex, blockId, tokens, isOpen, onToggle, interactive, isCompact }: {
  row: TabelAccordionBlock['rows'][number];
  rowIndex: number;
  blockId: string;
  tokens: TokenResolver;
  isOpen: boolean;
  onToggle: () => void;
  interactive?: boolean;
  isCompact?: boolean;
}) {
  const titleEditor = useInlineEditor({
    blockId,
    fieldKey: `rows.${rowIndex}.title`,
    value: row.title ?? '',
    tag: 'span',
  });

  return (
    <div className="rounded-xl overflow-hidden premium-card-glow transition-all"
      style={{
        border: '1px solid ' + (isOpen ? tokens.colorAlpha(row.color, 0.35) : tokens.colorAlpha(row.color, 0.12)),
        background: isOpen ? tokens.colorAlpha(row.color, 0.08) : tokens.colorAlpha(row.color, 0.04),
        boxShadow: tokens.raw.shadow.card,
      }}>
      <MicroInteraction tokens={tokens} accent={row.color} effect="squish">
      <button className="w-full flex items-center gap-2.5 p-3 font-extrabold cursor-pointer transition-all"
        style={{
          fontSize: '13px',
          background: isOpen ? tokens.colorAlpha(row.color, 0.04) : 'transparent',
        }}
        aria-expanded={isOpen}
        aria-controls={`accord-panel-${blockId}-${rowIndex}`}
        onClick={() => {
          onToggle();
          if (interactive) playSound(isOpen ? 'click' : 'tap');
        }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: tokens.colorAlpha(row.color, 0.2), boxShadow: '0 2px 8px ' + tokens.colorAlpha(row.color, 0.2) }}>
          <span className="text-sm">{row.icon}</span>
        </div>
        <InlineTextEditor
          {...titleEditor}
          className="font-extrabold text-[11px] text-left min-w-0"
          style={{ color: tokens.color(row.color), fontSize: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
          placeholder="Ketik judul baris..."
        />
        <span className="ml-auto transition-transform duration-300 flex-shrink-0"
          style={{ fontSize: '12px', transform: isOpen ? 'rotate(180deg)' : 'none', color: tokens.color(row.color) }}>▼</span>
      </button>
      </MicroInteraction>
      {isOpen && (
        <div className="px-3.5 pb-3.5" id={`accord-panel-${blockId}-${rowIndex}`}
          style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="grid grid-cols-2 gap-2.5">
            {(row.details || []).map((d, j) => (
              <AccordionDetail
                key={`accord-detail-${d.label?.slice(0,6)}-${j}`}
                detail={d}
                rowIndex={rowIndex}
                detailIndex={j}
                blockId={blockId}
                rowColor={row.color}
                tokens={tokens}
                isCompact={isCompact}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const TabelAccordionRenderer = React.memo(function TabelAccordionRenderer({ block, tokens, isCompact, isEditing, interactive, compression }: {
  block: TabelAccordionBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; interactive?: boolean; compression?: CompressionDecision;
}) {
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);

  const allRows = block.rows || [];

  // ── Compression-aware row visibility (accordion) ────────────
  const { visibleCount, hasMore, hiddenCount, showMore, isCompressed } = useBlockCompression({
    compression,
    totalItems: allRows.length,
  });
  const rows = isCompressed ? allRows.slice(0, visibleCount) : allRows;

  return (
    <PremiumBlockWrapper tokens={tokens} accent="c" staggerIndex={0}>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent="c" height={2} position="top" />
    <div className="flex flex-col gap-2 mt-3">
      {rows.map((row, i) => (
        <AccordionRow
          key={`accord-row-${row.title?.slice(0,8)}-${i}`}
          row={row}
          rowIndex={i}
          blockId={block.id!}
          tokens={tokens}
          isOpen={openIdx === i}
          onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          interactive={interactive}
          isCompact={isCompact}
        />
      ))}
      {/* ═══ COMPRESSION: Show More button ════════════════════════ */}
      {hasMore && (
        <ShowMoreButton
          hiddenCount={hiddenCount}
          onShowMore={showMore}
          itemLabel="baris lagi"
          isCompact={isCompact}
        />
      )}
    </div>
    </PremiumBlockWrapper>
  );
});
