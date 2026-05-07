import React from 'react';
import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { arr, str } from './helpers';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: PETUNJUK PENGGUNAAN
// ═══════════════════════════════════════════════════════════════════
export function PreviewPetunjuk({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const langkah = arr<Record<string, unknown>>(mod.langkah);
  if (!langkah.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada langkah petunjuk.</div>;
  const max = compact ? 3 : variant === 'C' ? 6 : 4;
  const accent = T.c;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {langkah.slice(0, max).map((l, i) => (
          <div key={i} className="flex items-start gap-2" style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 10 }}>
            <div className="flex-shrink-0 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold" style={{ background: accent + '25', color: accent }}>{i + 1}</div>
            <div>
              <span className="text-[11px] font-semibold" style={{ color: T.text }}>{str(l.icon, '📌')} {str(l.judul)}</span>
              {!compact && str(l.isi) && <div className="text-[10px]" style={{ color: T.muted }}>{str(l.isi).slice(0, 60)}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const intro = str(mod.intro);
  const gridCols = variant === 'C' ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div>
      {intro && <div className="text-[13px] mb-3 px-0.5 leading-relaxed" style={{ color: T.muted }}>{intro}</div>}
      <div className={`grid ${gridCols} gap-2.5`}>
        {langkah.slice(0, max).map((l, i) => {
          const stepColor = str(l.color, accent);
          return (
            <div key={i} className="relative rounded-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${stepColor}0a, ${stepColor}04)`, border: `1px solid ${stepColor}22`, borderLeft: `3px solid ${stepColor}`, padding: '14px 12px 12px' }}>
              <div className="absolute top-2 right-2 min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm" style={{ background: stepColor, boxShadow: `0 2px 6px ${stepColor}40` }}>{i + 1}</div>
              <div className={`${compact ? 'text-base' : 'text-2xl'} mb-1.5`}>{str(l.icon, '📌')}</div>
              <div className="font-extrabold text-xs mb-0.5 pr-6" style={{ color: T.text }}>{str(l.judul)}</div>
              {!compact && str(l.isi) && <div className="text-[10px] leading-relaxed" style={{ color: T.muted }}>{str(l.isi)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
