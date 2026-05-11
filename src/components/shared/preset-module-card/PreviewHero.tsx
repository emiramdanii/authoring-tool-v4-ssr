import React from 'react';
import { Rocket } from 'lucide-react';
import type { M } from './types';
import { T } from './tokens';
import { GRADIENTS } from './tokens';
import { str } from './helpers';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: HERO
// ═══════════════════════════════════════════════════════════════════
export function PreviewHero({ mod, compact }: { mod: M; compact: boolean }) {
  const gradient = str(mod.gradient, 'sunset');
  const bg = GRADIENTS[gradient] || GRADIENTS.sunset;
  const chipsStr = str(mod.chips, '');
  const chips = chipsStr ? chipsStr.split(',').map((c) => c.trim()).filter(Boolean) : [];

  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{ background: bg, minHeight: compact ? 48 : 80 }}
    >
      <div className="relative z-10">
        <div className={`${compact ? 'text-lg' : 'text-2xl'} mb-0.5`}>{str(mod.icon) ? <span>{str(mod.icon)}</span> : <Rocket size={12} />}</div>
        <div className={`font-bold ${compact ? 'text-xs' : 'text-sm'} text-white`}>
          {str(mod.title) || 'Hero Banner'}
        </div>
        {!compact && str(mod.subjudul) && (
          <div className="text-[10px] text-white/80 mt-0.5">{str(mod.subjudul)}</div>
        )}
        {!compact && chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {chips.slice(0, 3).map((c, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/20 text-white/90">{c}</span>
            ))}
            {chips.length > 3 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/20 text-white/90">+{chips.length - 3}</span>}
          </div>
        )}
      </div>
      {/* Decorative circles */}
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full bg-white/5" />
    </div>
  );
}
