import React from 'react';
import type { M } from './types';
import { T } from './tokens';
import { arr, str } from './helpers';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: MATERI
// ═══════════════════════════════════════════════════════════════════
export function PreviewMateri({ mod, compact }: { mod: M; compact: boolean }) {
  const blok = arr<Record<string, unknown>>(mod.blok);
  if (!blok.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada blok materi.</div>;
  const max = compact ? 2 : 4;

  return (
    <div className="space-y-1.5">
      {blok.slice(0, max).map((b, i) => (
        <div key={i} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-[11px] font-extrabold" style={{ color: T.text }}>{str(b.judul)}</div>
          {!compact && str(b.isi) && <div className="text-[10px] leading-relaxed" style={{ color: T.muted }}>{str(b.isi).slice(0, 60)}</div>}
        </div>
      ))}
    </div>
  );
}
