import React from 'react';
import { MessageCircle } from 'lucide-react';
import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { arr, str } from './helpers';
import { alpha } from '@/lib/color-palette';
import { AccentListItem } from '@/components/shared/AccentListItem';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: DISKUSI
// ═══════════════════════════════════════════════════════════════════
export function PreviewDiskusi({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const pertanyaan = arr<Record<string, unknown>>(mod.pertanyaan);
  if (!pertanyaan.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada pertanyaan diskusi.</div>;
  const max = compact ? 2 : 3;
  const accent = T.g;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {pertanyaan.slice(0, max).map((p, i) => (
          <AccentListItem key={i} accentColor={accent} className="flex items-start gap-2">
            <div className="flex-shrink-0 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold" style={{ background: alpha(accent, 0.15), color: accent }}>{i + 1}</div>
            <span className="text-[11px]" style={{ color: T.text }}>{str(p.teks).slice(0, 80)}</span>
          </AccentListItem>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {pertanyaan.slice(0, max).map((p, i) => (
        <div key={i} className="relative rounded-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${alpha(accent, 0.03)}, ${alpha(accent, 0.01)})`, border: `1px solid ${alpha(accent, 0.13)}`, borderLeft: `3px solid ${accent}`, padding: 14 }}>
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${accent}, ${alpha(accent, 0.31)}, transparent)` }} />
          {/* Header with number badge */}
          <div className="flex items-center gap-2 mb-2">
            <div className="min-w-[26px] h-[26px] rounded-lg flex items-center justify-center text-[10px] font-black" style={{ background: alpha(accent, 0.12), color: accent, border: `1px solid ${alpha(accent, 0.19)}` }}>{i + 1}</div>
            {str(p.label) ? (
              <div className="text-[11px] font-extrabold tracking-wide" style={{ color: accent }}>{str(p.icon) ? <span>{str(p.icon)}</span> : <span className="material-symbols-outlined inline" style={ { fontSize: '12px' } }>chat_bubble</span>} {str(p.label)}</div>
            ) : (
              <div className="text-[11px] font-extrabold tracking-wide" style={{ color: accent }}>{str(p.icon) ? <span>{str(p.icon)}</span> : <span className="material-symbols-outlined inline" style={ { fontSize: '12px' } }>chat_bubble</span>} Pertanyaan {i + 1}</div>
            )}
          </div>
          <p className="text-xs font-bold leading-relaxed" style={{ color: T.text }}>{str(p.teks)}</p>
          {str(p.petunjuk) && <div className="text-[10px] italic mt-1" style={{ color: T.muted }}>{str(p.petunjuk)}</div>}
          {!compact && (
            <div className="mt-2.5 rounded-lg p-2.5 text-[10px]" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.09)', color: T.muted }}>
              Tuliskan jawabanmu di sini…
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
