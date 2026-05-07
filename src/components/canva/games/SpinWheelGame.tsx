'use client';

import { useState } from 'react';
import { EmptyState } from './shared';
import type { GameComponentProps } from './shared';

/* ═══════════════════════════════════════════════════════════════
   SPIN WHEEL (Roda Pertanyaan) — Non-scored tool (random picker)
   reportScore(0, 0) — does not contribute to overall scoring
   ═══════════════════════════════════════════════════════════════ */
export function SpinWheelGame({ data, compact, onComplete }: GameComponentProps) {
  const soal = (data.soal as Array<Record<string, unknown>>) || [];
  const validSoal = soal.filter(s => s.teks);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const colors = ['#f9c82e', '#3ecfcf', '#a78bfa', '#34d399', '#ff6b6b', '#fb923c', '#60a5fa', '#f472b6'];

  const spin = () => {
    if (spinning || validSoal.length < 2) return;
    setSpinning(true);
    setResult(null);
    const extra = Math.floor(Math.random() * 360) + 360 * 3;
    const newRot = rotation + extra;
    setRotation(newRot);
    setTimeout(() => {
      setSpinning(false);
      const normalized = newRot % 360;
      const sliceAngle = 360 / validSoal.length;
      const idx = Math.floor(((360 - normalized + sliceAngle / 2) % 360) / sliceAngle);
      setResult(validSoal[Math.min(idx, validSoal.length - 1)]);
      // SpinWheel is a random picker tool, not a quiz — no scoring contribution
      if (onComplete) onComplete(0, 0);
    }, 2500);
  };

  if (validSoal.length < 2) return <EmptyState icon="🎡" label="Roda Pertanyaan" compact={compact} />;

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2 items-center justify-center">
      <div className="text-[9px] font-bold text-cyan-400 mb-1">🎡 Roda Pertanyaan</div>
      <div className="relative flex-shrink-0">
        <svg width={compact ? 100 : 140} height={compact ? 100 : 140} viewBox="0 0 140 140"
          style={{ transition: spinning ? 'transform 2.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none', transform: `rotate(${rotation}deg)` }}>
          {validSoal.map((s, i) => {
            const startAngle = (i * 360) / validSoal.length;
            const endAngle = ((i + 1) * 360) / validSoal.length;
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            const x1 = 70 + 65 * Math.cos(startRad);
            const y1 = 70 + 65 * Math.sin(startRad);
            const x2 = 70 + 65 * Math.cos(endRad);
            const y2 = 70 + 65 * Math.sin(endRad);
            const midRad = ((startAngle + endAngle) / 2 - 90) * Math.PI / 180;
            const tx = 70 + 38 * Math.cos(midRad);
            const ty = 70 + 38 * Math.sin(midRad);
            const largeArc = endAngle - startAngle > 180 ? 1 : 0;
            return (
              <g key={i}>
                <path d={`M70,70 L${x1},${y1} A65,65 0 ${largeArc},1 ${x2},${y2} Z`}
                  fill={colors[i % colors.length]} opacity={0.8} />
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontSize="8" fontWeight="bold" transform={`rotate(${startAngle + 360/validSoal.length/2}, ${tx}, ${ty})`}>
                  {String(i + 1)}
                </text>
              </g>
            );
          })}
          <circle cx="70" cy="70" r="10" fill="#1a1a2e" />
        </svg>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-lg">▼</div>
      </div>
      {result && (
        <div className="mt-2 text-center px-2 max-w-full">
          <div className="text-[9px] text-cyan-400/60 mb-0.5">{result.kategori as string || 'Soal'}</div>
          <div className={`${compact ? 'text-[9px]' : 'text-[11px]'} font-bold text-amber-300`}>{result.teks as string}</div>
        </div>
      )}
      <button onClick={spin} disabled={spinning}
        className="mt-2 px-4 py-1.5 bg-cyan-500/30 hover:bg-cyan-500/50 disabled:opacity-50 rounded-lg text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30 cursor-pointer">
        {spinning ? 'Berputar...' : 'Putar!'}
      </button>
    </div>
  );
}
