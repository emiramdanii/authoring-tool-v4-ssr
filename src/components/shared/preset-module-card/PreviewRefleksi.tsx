import React from 'react';
import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { arr, str } from './helpers';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: REFLEKSI
// ═══════════════════════════════════════════════════════════════════
export function PreviewRefleksi({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const pertanyaan = arr<Record<string, unknown>>(mod.pertanyaan);
  if (!pertanyaan.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada pertanyaan refleksi.</div>;
  const max = compact ? 2 : 3;
  const accent = T.p;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {pertanyaan.slice(0, max).map((p, i) => (
          <div key={i} className="flex items-start gap-2" style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 10 }}>
            <div className="flex-shrink-0 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold" style={{ background: accent + '25', color: accent }}>{i + 1}</div>
            <span className="text-[11px]" style={{ color: T.text }}>{str(p.teks).slice(0, 80)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {pertanyaan.slice(0, max).map((p, i) => (
        <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${accent}20`, background: `linear-gradient(160deg, ${accent}08, transparent)` }}>
          {/* Gradient accent header */}
          <div className="flex items-center gap-2 px-3.5 py-2.5" style={{ background: `linear-gradient(135deg, ${accent}20, ${accent}08)`, borderBottom: `1px solid ${accent}15` }}>
            <div className="min-w-[24px] h-[24px] rounded-md flex items-center justify-center text-[10px] font-black" style={{ background: accent + '30', color: accent, border: `1px solid ${accent}35` }}>{i + 1}</div>
            <label className="text-[12px] font-extrabold block" style={{ color: T.text }}>{str(p.icon || '💭')} {str(p.teks)}</label>
          </div>
          <div className="px-3.5 py-3">
            {str(p.petunjuk) && <div className="text-[10px] italic mb-2" style={{ color: T.muted }}>{str(p.petunjuk)}</div>}
            {!compact && (
              <div className="rounded-lg p-2.5 text-[10px]" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.09)', color: T.muted }}>
                Tuliskan refleksimu…
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
