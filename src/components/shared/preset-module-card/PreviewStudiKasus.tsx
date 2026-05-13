import React from 'react';
import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { arr, str } from './helpers';
import { alpha } from '@/lib/color-palette';
import { AccentListItem } from '@/components/shared/AccentListItem';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: STUDI-KASUS
// ═══════════════════════════════════════════════════════════════════
export function PreviewStudiKasus({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const pertanyaan = arr<Record<string, unknown>>(mod.pertanyaan);

  if (variant === 'D') {
    return (
      <div>
        <AccentListItem accentColor={T.o}>
          <span className="text-[11px]" style={{ color: T.muted }}>{str(mod.teks).slice(0, 100)}</span>
        </AccentListItem>
        {pertanyaan.map((p, i) => <div key={i} className="text-[10px] py-0.5" style={{ color: T.text }}>📌 {str(p.teks || p.label)}</div>)}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-xs leading-relaxed" style={{ color: T.text }}>{str(mod.teks)}</p>
        {str(mod.sumber) && <p className="text-[10px] mt-1" style={{ color: T.muted }}>Sumber: {str(mod.sumber)}</p>}
      </div>
      {pertanyaan.length > 0 && !compact && (
        <>
          <div className="font-bold text-xs" style={{ color: T.text }}>📝 Pertanyaan Analisis</div>
          {pertanyaan.slice(0, 2).map((p, i) => (
            <div key={i} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: T.p, background: alpha(T.p, 0.09) }}>{str(p.level, 'C2')}</span>
              <p className="text-xs font-semibold mt-1" style={{ color: T.text }}>{str(p.teks || p.label)}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
