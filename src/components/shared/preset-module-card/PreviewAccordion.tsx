import React from 'react';
import { Pin, ChevronDown } from 'lucide-react';
import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { arr, str } from './helpers';
import { alpha } from '@/lib/color-palette';
import { AccentListItem } from '@/components/shared/AccentListItem';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: ACCORDION
// ═══════════════════════════════════════════════════════════════════
export function PreviewAccordion({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const items = arr<Record<string, unknown>>(mod.items);
  const maxItems = compact ? 2 : variant === 'C' ? 5 : 3;

  if (variant === 'D') {
    return (
      <div className="space-y-1.5">
        {items.slice(0, maxItems).map((it, i) => (
          <AccentListItem key={i} accentColor={T.p} className="flex items-start gap-2">
            <span className="text-[10px]">{str(it.icon) ? <span>{str(it.icon)}</span> : <Pin size={12} className="inline" />}</span>
            <div>
              <div className="text-xs font-semibold" style={{ color: T.text }}>{str(it.judul) || `Item ${i + 1}`}</div>
              {!compact && str(it.isi) && <div className="text-[10px]" style={{ color: T.muted }}>{str(it.isi).slice(0, 60)}</div>}
            </div>
          </AccentListItem>
        ))}
        {items.length > maxItems && <div className="text-[10px]" style={{ color: T.muted }}>+{items.length - maxItems} lagi</div>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {items.slice(0, maxItems).map((it, i) => (
        <div key={i} className="rounded-lg p-2 flex items-start gap-2" style={{ background: T.bg2, border: `1px solid ${alpha(T.p, 0.09)}` }}>
          <span className={compact ? 'text-[10px]' : 'text-sm'}>{str(it.icon) ? <span>{str(it.icon)}</span> : <Pin size={12} className="inline" />}</span>
          <div className="flex-1 min-w-0">
            <div className={`font-semibold ${compact ? 'text-[10px]' : 'text-xs'}`} style={{ color: T.text }}>
              {str(it.judul) || `Item ${i + 1}`}
            </div>
            {!compact && str(it.isi) && <div className="text-[10px] mt-0.5" style={{ color: T.muted }}>{str(it.isi).slice(0, 50)}</div>}
          </div>
          <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={ { fontSize: '12px' } }>expand_more</span>
        </div>
      ))}
      {items.length > maxItems && <div className="text-[10px]" style={{ color: T.muted }}>+{items.length - maxItems} lagi</div>}
    </div>
  );
}
