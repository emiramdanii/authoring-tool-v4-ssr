'use client';

import React from 'react';
import type { TabelAccordionBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

/** Inner detail item component so hooks are not called in loops */
function AccordionDetail({ detail, rowIndex, detailIndex, blockId, rowColor, tokens }: {
  detail: { label: string; value: string };
  rowIndex: number;
  detailIndex: number;
  blockId: string;
  rowColor: string;
  tokens: TokenResolver;
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
    <div className="rounded-xl p-2.5"
      style={{
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
        className="text-[10px] leading-relaxed"
        style={{ fontSize: 'inherit' }}
        placeholder="Ketik nilai..."
      />
    </div>
  );
}

/** Inner row component so hooks are not called in loops */
function AccordionRow({ row, rowIndex, blockId, tokens, isOpen, onToggle }: {
  row: TabelAccordionBlock['rows'][number];
  rowIndex: number;
  blockId: string;
  tokens: TokenResolver;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const titleEditor = useInlineEditor({
    blockId,
    fieldKey: `rows.${rowIndex}.title`,
    value: row.title ?? '',
    tag: 'span',
  });

  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{
        border: '1px solid ' + (isOpen ? tokens.colorAlpha(row.color, 0.35) : tokens.colorAlpha(row.color, 0.12)),
        background: isOpen ? tokens.colorAlpha(row.color, 0.08) : tokens.colorAlpha(row.color, 0.04),
        boxShadow: tokens.raw.shadow.card,
      }}>
      <button className="w-full flex items-center gap-2.5 p-3 font-extrabold text-[11px] cursor-pointer transition-all hover:bg-white/[0.03]"
        onClick={onToggle}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: tokens.colorAlpha(row.color, 0.2), boxShadow: '0 2px 8px ' + tokens.colorAlpha(row.color, 0.2) }}>
          <span className="text-sm">{row.icon}</span>
        </div>
        <InlineTextEditor
          {...titleEditor}
          className="font-extrabold text-[11px]"
          style={{ color: tokens.color(row.color), fontSize: 'inherit' }}
          placeholder="Ketik judul baris..."
        />
        <span className="ml-auto text-[10px] transition-transform duration-300"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', color: tokens.color(row.color) }}>▼</span>
      </button>
      {isOpen && (
        <div className="px-3.5 pb-3.5"
          style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="grid grid-cols-2 gap-2.5">
            {(row.details || []).map((d, j) => (
              <AccordionDetail
                key={j}
                detail={d}
                rowIndex={rowIndex}
                detailIndex={j}
                blockId={blockId}
                rowColor={row.color}
                tokens={tokens}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TabelAccordionRenderer({ block, tokens, isCompact, isEditing }: {
  block: TabelAccordionBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
}) {
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2 mt-3">
      {(block.rows || []).map((row, i) => (
        <AccordionRow
          key={i}
          row={row}
          rowIndex={i}
          blockId={block.id!}
          tokens={tokens}
          isOpen={openIdx === i}
          onToggle={() => setOpenIdx(openIdx === i ? null : i)}
        />
      ))}
    </div>
  );
}
