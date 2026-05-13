import React from 'react';
import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { arr, str } from './helpers';
import { alpha } from '@/lib/color-palette';
import { AccentListItem } from '@/components/shared/AccentListItem';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: REVIEW
// ═══════════════════════════════════════════════════════════════════
export function PreviewReview({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const kartu = arr<Record<string, unknown>>(mod.kartu);
  if (!kartu.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada konten review.</div>;
  const max = compact ? 2 : 4;
  const accent = T.y;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {kartu.slice(0, max).map((k, i) => (
          <AccentListItem key={i} accentColor={accent} className="flex items-start gap-2">
            <span className="text-xs">{str(k.icon, '🔄')}</span>
            <div>
              <span className="text-[11px] font-semibold" style={{ color: T.text }}>{str(k.judul)}</span>
              {!compact && str(k.isi) && <div className="text-[10px]" style={{ color: T.muted }}>{str(k.isi).slice(0, 60)}</div>}
            </div>
          </AccentListItem>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {kartu.slice(0, max).map((k, i) => {
        const color = str(k.warna, accent);
        return (
          <div key={i} className="relative rounded-xl overflow-hidden" style={{ background: `linear-gradient(160deg, ${alpha(color, 0.06)}, ${alpha(color, 0.02)})`, border: `1px solid ${alpha(color, 0.13)}`, padding: 14 }}>
            {/* Decorative circle */}
            <div className="absolute -top-2.5 -right-2.5 w-12 h-12 rounded-full" style={{ background: alpha(color, 0.04) }} />
            {/* Icon area */}
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-2.5" style={{ background: alpha(color, 0.09), border: `1px solid ${alpha(color, 0.12)}` }}>
              {str(k.icon, '✅')}
            </div>
            <div className="font-extrabold text-xs mb-0.5" style={{ color: T.text }}>{str(k.judul)}</div>
            {!compact && str(k.isi) && <div className="text-[10px] leading-relaxed" style={{ color: T.muted }}>{str(k.isi)}</div>}
          </div>
        );
      })}
    </div>
  );
}
