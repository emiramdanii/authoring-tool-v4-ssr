'use client';

import React from 'react';
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
      style={{
        borderLeft: `${isCompact ? 3 : 4}px solid ${borderColor}`,
        background: tokens.colorAlpha(colorKey, 0.1),
        borderRadius: `0 ${tokens.radius('xl')}px ${tokens.radius('xl')}px 0`,
        fontSize: isCompact ? '12px' : '14.5px',
        lineHeight: 1.7,
        boxShadow: tokens.raw.shadow.card,
        padding: isCompact ? '10px 12px' : '13px 15px',
        margin: isCompact ? '6px 0' : '13px 0',
        overflow: 'hidden',
        color: tokens.color('text'),
      }}>
      <InlineTextEditor
        {...contentEditor}
        className=""
        style={{ fontSize: 'inherit', lineHeight: 'inherit', color: 'inherit' }}
      />
    </div>
  );
}
