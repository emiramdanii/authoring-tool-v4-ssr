'use client';

import { useCanvaStore } from '@/store/canva-store';
import { RATIOS } from '@/components/canva/types';
import { RefreshCw } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// SETTINGS SECTION — Ratio selector + Reset canvas
// ═══════════════════════════════════════════════════════════════

export function SettingsSection() {
  const ratioId = useCanvaStore(s => s.ratioId);
  const setRatio = useCanvaStore(s => s.setRatio);
  const resetCanvas = useCanvaStore(s => s.resetCanvas);

  return (
    <div className="space-y-3">
      {/* Ratio selector */}
      <div>
        <div className="text-[9px] font-bold text-app-secondary uppercase tracking-wider mb-2">📐 Rasio: {ratioId}</div>
        <div className="flex flex-wrap gap-1.5">
          {RATIOS.map(r => {
            const isActive = ratioId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRatio(r.id)}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-[background-color,border-color,color] ${
                  isActive
                    ? 'bg-app-accent/10 border border-app-accent/30 text-app-accent'
                    : 'bg-app-elevated border border-app-border-subtle text-app-secondary hover:border-app-border-strong'
                }`}
              >
                {r.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset Canvas */}
      <button
        onClick={() => {
          if (confirm('Reset canvas? Semua halaman akan dibuat ulang dari data authoring. Perubahan manual akan hilang.')) {
            resetCanvas();
          }
        }}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-app-elevated border border-app-border-subtle hover:border-app-error/30 text-app-secondary hover:text-app-error text-[10px] font-bold transition-[transform,box-shadow,background-color] active:scale-95"
      >
        <RefreshCw size={10} className="inline" />
        Reset Canvas
      </button>
    </div>
  );
}
