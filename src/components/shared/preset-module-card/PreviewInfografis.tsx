import React from 'react';
import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { arr, str } from './helpers';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: INFOGRAFIS
// ═══════════════════════════════════════════════════════════════════
export function PreviewInfografis({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const kartu = arr<Record<string, unknown>>(mod.kartu);
  const maxItems = compact ? 3 : variant === 'C' ? 6 : variant === 'B' ? 4 : 4;

  if (variant === 'D') {
    return (
      <div className="space-y-1.5">
        {kartu.slice(0, maxItems).map((k, i) => (
          <div key={i} className="flex items-start gap-2" style={{ borderLeft: `3px solid ${str(k.color, T.c)}`, paddingLeft: 8 }}>
            <span className="text-xs">{str(k.icon, '📌')}</span>
            <div>
              <div className="text-xs font-semibold" style={{ color: T.text }}>{str(k.judul) || `Kartu ${i + 1}`}</div>
              {str(k.isi) && <div className="text-[10px]" style={{ color: T.muted }}>{str(k.isi).slice(0, 60)}</div>}
            </div>
          </div>
        ))}
        {kartu.length > maxItems && <div className="text-[10px]" style={{ color: T.muted }}>+{kartu.length - maxItems} lagi</div>}
      </div>
    );
  }

  const gridCols = variant === 'C' ? 'grid-cols-2' : variant === 'B' ? 'grid-cols-2' : 'grid-cols-2';
  const cardP = variant === 'C' ? 'p-3' : compact ? 'p-1.5' : 'p-2';

  return (
    <div className={`grid ${gridCols} gap-2`}>
      {kartu.slice(0, maxItems).map((k, i) => (
        <div key={i} className={`rounded-lg ${cardP}`} style={{ background: str(k.color, T.c) + '18', border: `1px solid ${str(k.color, T.c)}30` }}>
          <div className={`${compact ? 'text-sm' : variant === 'C' ? 'text-xl' : 'text-lg'} mb-1`}>{str(k.icon, '📌')}</div>
          <div className="font-semibold text-xs" style={{ color: str(k.color, T.c) }}>{str(k.judul) || `Kartu ${i + 1}`}</div>
          {!compact && str(k.isi) && <div className="text-[10px] mt-0.5" style={{ color: T.muted }}>{str(k.isi).slice(0, 50)}</div>}
        </div>
      ))}
      {kartu.length > maxItems && (
        <div className="flex items-center justify-center text-[10px] rounded-lg p-2" style={{ background: T.bg2, color: T.muted }}>
          +{kartu.length - maxItems} lagi
        </div>
      )}
    </div>
  );
}
