'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import type { DefBoxBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

export function DefBoxRenderer({ block, tokens, isCompact, isEditing }: {
  block: DefBoxBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
}) {
  const borderColor = tokens.color(block.borderColor || 'y');
  const colorKey = block.borderColor || 'y';

  // ── Inline editing hooks ─────────────────────────────────────
  const contentEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'content',
    value: block.content ?? '',
    tag: 'span',
  });

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: tokens.colorAlpha(colorKey, 0.08),
        border: '1px solid ' + tokens.colorAlpha(colorKey, 0.25),
        boxShadow: tokens.raw.shadow.card,
      }}>
      {/* Top accent bar */}
      <div className="h-1.5"
        style={{ background: `linear-gradient(90deg, ${borderColor}, ${tokens.colorAlpha(colorKey, 0.4)})` }} />

      <div style={{ padding: isCompact ? '10px 12px' : '13px 15px' }}>
        {/* Icon row */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: tokens.colorAlpha(colorKey, 0.2) }}>
            <BookOpen size={10} className="inline" style={{ color: borderColor }} />
          </div>
          <span className="font-extrabold uppercase tracking-wider"
            style={{ color: borderColor, fontSize: isCompact ? '10px' : '11px' }}>
            Definisi
          </span>
        </div>

        {/* Content */}
        <div style={{
          borderLeft: `${isCompact ? 3 : 4}px solid ${borderColor}`,
          paddingLeft: isCompact ? '10px' : '12px',
          fontSize: isCompact ? '12px' : '14.5px',
          lineHeight: 1.7,
          color: tokens.color('text'),
        }}>
          <InlineTextEditor
            {...contentEditor}
            className=""
            style={{ fontSize: 'inherit', lineHeight: 'inherit', color: 'inherit' }}
          />
        </div>
      </div>
    </div>
  );
}
