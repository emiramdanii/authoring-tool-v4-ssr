import React from 'react';
import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { str, obj } from './helpers';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: DEBAT
// ═══════════════════════════════════════════════════════════════════
export function PreviewDebat({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const pA = obj(mod.pihakA);
  const pB = obj(mod.pihakB);

  if (variant === 'D') {
    return (
      <div style={{ borderLeft: '3px solid #f87171', paddingLeft: 8 }}>
        <span className="text-[11px]" style={{ color: T.text }}>{str(mod.pertanyaan)}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="font-black text-xs mb-1" style={{ color: T.text }}>🗣️ Mosi:</div>
        <p className="text-xs leading-relaxed" style={{ color: T.text }}>{str(mod.pertanyaan)}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg p-3" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <div className="font-black text-xs" style={{ color: T.g }}>✅ {str(pA.label, 'Pro')}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.2)' }}>
          <div className="font-black text-xs" style={{ color: T.r }}>❌ {str(pB.label, 'Kontra')}</div>
        </div>
      </div>
    </div>
  );
}
