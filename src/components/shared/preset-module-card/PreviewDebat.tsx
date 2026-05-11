import React from 'react';
import { Mic, Check, X } from 'lucide-react';
import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { str, obj } from './helpers';
import { AccentListItem } from '@/components/shared/AccentListItem';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: DEBAT
// ═══════════════════════════════════════════════════════════════════
export function PreviewDebat({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const pA = obj(mod.pihakA);
  const pB = obj(mod.pihakB);

  if (variant === 'D') {
    return (
      <AccentListItem accentColor="#f87171">
        <span className="text-[11px]" style={{ color: T.text }}>{str(mod.pertanyaan)}</span>
      </AccentListItem>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="font-black text-xs mb-1" style={{ color: T.text }}><Mic size={12} className="inline" /> Mosi:</div>
        <p className="text-xs leading-relaxed" style={{ color: T.text }}>{str(mod.pertanyaan)}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg p-3" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <div className="font-black text-xs" style={{ color: T.g }}><Check size={12} className="inline" /> {str(pA.label, 'Pro')}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.2)' }}>
          <div className="font-black text-xs" style={{ color: T.r }}><X size={12} className="inline" /> {str(pB.label, 'Kontra')}</div>
        </div>
      </div>
    </div>
  );
}
