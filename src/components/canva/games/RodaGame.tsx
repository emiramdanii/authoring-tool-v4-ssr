'use client';

import { useState } from 'react';
import { EmptyState } from './shared';
import type { GameComponentProps } from './shared';

/* ═══════════════════════════════════════════════════════════════
   RODA PUTAR (Spinning Wheel)
   ═══════════════════════════════════════════════════════════════ */
export function RodaGame({ data, compact, onComplete }: GameComponentProps) {
  const opsi = (data.opsi as string[]) || [];
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const reported = useState(false)[1]; // track if score reported

  const colors = ['#f9c82e', '#3ecfcf', '#a78bfa', '#34d399', '#ff6b6b', '#fb923c', '#60a5fa', '#f472b6'];

  const spin = () => {
    if (spinning || opsi.length < 2) return;
    setSpinning(true);
    setResult(null);
    const extra = Math.floor(Math.random() * 360) + 360 * 3;
    const newRot = rotation + extra;
    setRotation(newRot);
    setTimeout(() => {
      setSpinning(false);
      const normalized = newRot % 360;
      const sliceAngle = 360 / opsi.length;
      const idx = Math.floor(((360 - normalized + sliceAngle / 2) % 360) / sliceAngle);
      setResult(opsi[Math.min(idx, opsi.length - 1)]);
      if (onComplete) onComplete(1, 1);
    }, 2500);
  };

  if (opsi.length < 2) return <EmptyState icon="🎡" label="Roda Putar" compact={compact} />;

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2 items-center justify-center">
      <div className="text-[9px] font-bold text-cyan-400 mb-1">🎡 Roda Putar</div>
      <div className="relative flex-shrink-0">
        <svg width={compact ? 100 : 140} height={compact ? 100 : 140} viewBox="0 0 140 140"
          style={{ transition: spinning ? 'transform 2.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none', transform: `rotate(${rotation}deg)` }}>
          {opsi.map((o, i) => {
            const startAngle = (i * 360) / opsi.length;
            const endAngle = ((i + 1) * 360) / opsi.length;
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            const x1 = 70 + 65 * Math.cos(startRad);
            const y1 = 70 + 65 * Math.sin(startRad);
            const x2 = 70 + 65 * Math.cos(endRad);
            const y2 = 70 + 65 * Math.sin(endRad);
            const largeArc = endAngle - startAngle > 180 ? 1 : 0;
            return (
              <path key={i} d={`M70,70 L${x1},${y1} A65,65 0 ${largeArc},1 ${x2},${y2} Z`}
                fill={colors[i % colors.length]} opacity={0.8} />
            );
          })}
          <circle cx="70" cy="70" r="10" fill="#1a1a2e" />
        </svg>
        {/* Arrow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-lg">▼</div>
      </div>
      {result && (
        <div className="mt-2 text-center">
          <div className={`${compact ? 'text-[10px]' : 'text-[12px]'} font-bold text-amber-300`}>{result}</div>
        </div>
      )}
      <button onClick={spin} disabled={spinning}
        className="mt-2 px-4 py-1.5 bg-cyan-500/30 hover:bg-cyan-500/50 disabled:opacity-50 rounded-lg text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30 cursor-pointer">
        {spinning ? 'Berputar...' : 'Putar!'}
      </button>
    </div>
  );
}
