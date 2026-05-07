import React from 'react';
import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { arr, str } from './helpers';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: STATISTIK
// ═══════════════════════════════════════════════════════════════════
export function PreviewStatistik({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const items = arr<Record<string, unknown>>(mod.items);
  const maxItems = compact ? 3 : 4;

  if (variant === 'D') {
    return (
      <div className="space-y-1.5">
        {items.slice(0, maxItems).map((it, i) => (
          <div key={i} className="flex items-center gap-2" style={{ borderLeft: `3px solid ${str(it.color, T.o)}`, paddingLeft: 8 }}>
            <span className="text-xs">{str(it.icon, '📊')}</span>
            <span className="font-bold text-sm" style={{ color: str(it.color, T.o) }}>{str(it.angka, '-')}{str(it.satuan)}</span>
            <span className="text-[10px]" style={{ color: T.muted }}>{str(it.label)}</span>
          </div>
        ))}
      </div>
    );
  }

  const cols = variant === 'B' ? 'grid-cols-4' : variant === 'C' ? 'grid-cols-2' : 'grid-cols-2';

  return (
    <div className={`grid ${cols} gap-2`}>
      {items.slice(0, maxItems).map((it, i) => (
        <div key={i} className="rounded-lg p-2 text-center" style={{ background: str(it.color, T.o) + '12', border: `1px solid ${str(it.color, T.o)}25` }}>
          <div className={compact ? 'text-sm' : 'text-lg'}>{str(it.icon, '📊')}</div>
          <div className={`font-bold ${compact ? 'text-sm' : 'text-xl'}`} style={{ color: str(it.color, T.o) }}>
            {str(it.angka, '-')}
          </div>
          {str(it.satuan) && <div className="text-[10px]" style={{ color: T.muted }}>{str(it.satuan)}</div>}
          <div className="text-[10px]" style={{ color: T.muted }}>{str(it.label)}</div>
        </div>
      ))}
    </div>
  );
}
