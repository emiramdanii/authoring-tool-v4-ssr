import React from 'react';
import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { arr, str } from './helpers';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: TIMELINE
// ═══════════════════════════════════════════════════════════════════
export function PreviewTimeline({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const events = arr<Record<string, unknown>>(mod.events);
  const maxItems = compact ? 3 : variant === 'C' ? 5 : 4;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {events.slice(0, maxItems).map((ev, i) => (
          <div key={i} className="flex items-start gap-2" style={{ borderLeft: `2px solid ${T.g}`, paddingLeft: 8 }}>
            <span className="text-[10px]">{str(ev.icon, '📌')}</span>
            <div>
              <span className="text-[10px] font-bold" style={{ color: T.g }}>{str(ev.tahun)}</span>
              <span className="text-xs ml-1" style={{ color: T.text }}>{str(ev.judul) || `Event ${i + 1}`}</span>
            </div>
          </div>
        ))}
        {events.length > maxItems && <div className="text-[10px]" style={{ color: T.muted }}>+{events.length - maxItems} lagi</div>}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.slice(0, maxItems).map((ev, i) => (
        <div key={i} className="flex items-start gap-2 relative" style={{ paddingLeft: 16 }}>
          {/* Dot + line */}
          <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full" style={{ background: T.g, border: `2px solid ${T.card}`, zIndex: 1 }} />
          {i < Math.min(events.length, maxItems) - 1 && (
            <div className="absolute left-[4px] top-3 bottom-0 w-px" style={{ background: T.g + '40' }} />
          )}
          <div className="pb-2 flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={compact ? 'text-[10px]' : 'text-xs'}>{str(ev.icon, '📌')}</span>
              {str(ev.tahun) && <span className="text-[10px] font-bold px-1 py-0.5 rounded" style={{ background: T.g + '20', color: T.g }}>{str(ev.tahun)}</span>}
              <span className={`font-semibold ${compact ? 'text-[10px]' : 'text-xs'}`} style={{ color: T.text }}>{str(ev.judul) || `Event ${i + 1}`}</span>
            </div>
            {!compact && str(ev.isi) && <div className="text-[10px] mt-0.5" style={{ color: T.muted }}>{str(ev.isi).slice(0, 60)}</div>}
          </div>
        </div>
      ))}
      {events.length > maxItems && <div className="text-[10px] pl-4" style={{ color: T.muted }}>+{events.length - maxItems} lagi</div>}
    </div>
  );
}
