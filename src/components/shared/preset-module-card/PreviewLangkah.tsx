import React from 'react';
import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { arr, str } from './helpers';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: LANGKAH
// ═══════════════════════════════════════════════════════════════════
export function PreviewLangkah({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const steps = arr<Record<string, unknown>>(mod.steps);
  const maxItems = compact ? 3 : variant === 'C' ? 5 : 4;

  if (variant === 'D') {
    return (
      <div className="space-y-1.5">
        {steps.slice(0, maxItems).map((s, i) => (
          <div key={i} className="flex items-start gap-2" style={{ borderLeft: `3px solid ${str(s.color, T.c)}`, paddingLeft: 8 }}>
            <span className="text-[10px] font-bold" style={{ color: str(s.color, T.c) }}>{i + 1}.</span>
            <div>
              <span className="text-xs font-semibold" style={{ color: T.text }}>{str(s.icon, '📌')} {str(s.judul) || `Langkah ${i + 1}`}</span>
              {!compact && str(s.isi) && <div className="text-[10px]" style={{ color: T.muted }}>{str(s.isi).slice(0, 50)}</div>}
            </div>
          </div>
        ))}
        {steps.length > maxItems && <div className="text-[10px]" style={{ color: T.muted }}>+{steps.length - maxItems} lagi</div>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {steps.slice(0, maxItems).map((s, i) => (
        <div key={i} className="flex items-start gap-2">
          <div
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: str(s.color, T.c) }}
          >
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={compact ? 'text-[10px]' : 'text-xs'}>{str(s.icon, '📌')}</span>
              <span className={`font-semibold ${compact ? 'text-[10px]' : 'text-xs'}`} style={{ color: T.text }}>
                {str(s.judul) || `Langkah ${i + 1}`}
              </span>
            </div>
            {!compact && str(s.isi) && <div className="text-[10px] mt-0.5" style={{ color: T.muted }}>{str(s.isi).slice(0, 60)}</div>}
          </div>
        </div>
      ))}
      {steps.length > maxItems && <div className="text-[10px] pl-8" style={{ color: T.muted }}>+{steps.length - maxItems} lagi</div>}
    </div>
  );
}
