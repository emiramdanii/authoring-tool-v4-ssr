'use client';

import React from 'react';
import type { DefBoxBlock } from '../../schema/types';
import type { TokenResolver } from '../types';

export function DefBoxRenderer({ block, tokens, isCompact }: {
  block: DefBoxBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  const borderColor = tokens.color(block.borderColor || 'y');
  const colorKey = block.borderColor || 'y';
  return (
    <div className={isCompact ? 'rounded-lg p-2.5 my-2' : 'rounded-lg p-4 my-3'}
      style={{
        borderLeft: (isCompact ? 3 : 4) + 'px solid ' + borderColor,
        background: tokens.colorAlpha(colorKey, 0.1),
        borderRadius: '0 ' + tokens.radius('xl') + 'px ' + tokens.radius('xl') + 'px 0',
        fontSize: isCompact ? '10px' : '0.91rem',
        lineHeight: 1.7,
        boxShadow: tokens.raw.shadow.card,
      }}>
      <span dangerouslySetInnerHTML={{ __html: block.content }} />
    </div>
  );
}
