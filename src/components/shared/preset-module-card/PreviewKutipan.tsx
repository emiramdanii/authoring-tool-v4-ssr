import React from 'react';
import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { str } from './helpers';
import { alpha } from '@/lib/color-palette';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: KUTIPAN
// ═══════════════════════════════════════════════════════════════════
export function PreviewKutipan({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const accent = str(mod.accent, T.y);
  const quote = str(mod.quote, '');
  const source = str(mod.source, '');
  const display = str(mod.display, 'card');

  if (variant === 'D' || display === 'minimal') {
    return (
      <div className="pl-3" style={{ borderLeft: `3px solid ${accent}` }}>
        <div className={`italic ${compact ? 'text-[10px]' : 'text-xs'}`} style={{ color: T.text }}>
          &ldquo;{quote || 'Belum ada kutipan'}&rdquo;
        </div>
        {source && <div className="text-[10px] mt-1" style={{ color: accent }}>— {source}</div>}
      </div>
    );
  }

  return (
    <div className="rounded-lg p-3 relative" style={{ background: alpha(accent, 0.06), border: `1px solid ${alpha(accent, 0.19)}` }}>
      <div className="absolute -top-1 left-2 text-xl leading-none" style={{ color: accent }}>&ldquo;</div>
      <div className={`italic ${compact ? 'text-[10px]' : variant === 'C' ? 'text-sm' : 'text-xs'} mt-2`} style={{ color: T.text }}>
        {quote || 'Belum ada kutipan'}
      </div>
      {source && (
        <div className="text-[10px] mt-1.5 font-semibold" style={{ color: accent }}>— {source}</div>
      )}
      {str(mod.title) && <div className="text-[10px] mt-0.5" style={{ color: T.muted }}>{str(mod.title)}</div>}
    </div>
  );
}
