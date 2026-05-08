'use client';

import { useState, useEffect, useRef } from 'react';
import { EmptyState } from './shared';
import type { GameComponentProps } from './shared';

/* ═══════════════════════════════════════════════════════════════
   MATCHING GAME (Pasangkan) — Efficiency-based scoring with 50% floor
   Score = max(ceil(pairs * 0.5), pairs - wrongAttempts)
   Completing the game always gives at least 50%
   ═══════════════════════════════════════════════════════════════ */
export function MatchingGame({ data, compact, onComplete }: GameComponentProps) {
  const pasangan = (data.pasangan as Array<Record<string, unknown>>) || [];
  const validPairs = pasangan.filter(p => p.kiri || p.kanan);

  const [shuffledRight] = useState(() => {
    const r = validPairs.map((p, i) => ({ idx: i, text: (p.kanan as string) || '' }));
    // Fisher-Yates shuffle (unbiased, unlike sort+random)
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  });
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matchedLeft, setMatchedLeft] = useState<Set<number>>(new Set());
  const [matchedRight, setMatchedRight] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [phase, setPhase] = useState<'play' | 'done'>('play');
  const reported = useRef(false);

  // Efficiency-based scoring with 50% floor: score = max(ceil(pairs*0.5), pairs - wrongAttempts)
  useEffect(() => {
    if (phase === 'done' && !reported.current && onComplete) {
      reported.current = true;
      const score = Math.max(Math.ceil(validPairs.length * 0.5), validPairs.length - wrongAttempts);
      onComplete(score, validPairs.length);
    }
  }, [phase]);

  const handleLeftClick = (idx: number) => {
    if (matchedLeft.has(idx)) return;
    setSelectedLeft(idx);
  };

  const handleRightClick = (originalIdx: number) => {
    if (selectedLeft === null || matchedRight.has(originalIdx)) return;
    if (selectedLeft === originalIdx) {
      setMatchedLeft(prev => new Set([...prev, selectedLeft]));
      setMatchedRight(prev => new Set([...prev, originalIdx]));
      if (matchedLeft.size + 1 === validPairs.length) setPhase('done');
    } else {
      setWrongAttempts(w => w + 1);
      setWrong(`${selectedLeft}-${originalIdx}`);
      setTimeout(() => setWrong(null), 600);
    }
    setSelectedLeft(null);
  };

  if (validPairs.length === 0) return <EmptyState icon="🔀" label="Game Pasangkan" compact={compact} />;

  const finalScore = Math.max(Math.ceil(validPairs.length * 0.5), validPairs.length - wrongAttempts);
  const scorePct = validPairs.length > 0 ? Math.round((finalScore / validPairs.length) * 100) : 0;

  if (phase === 'done') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <span className="text-2xl">🎉</span>
        <div className="text-[11px] font-bold text-cyan-300 mt-1">Semua Cocok!</div>
        <div className="text-[14px] font-black mt-0.5" style={{ color: scorePct >= 85 ? '#34d399' : scorePct >= 70 ? '#f9c12e' : '#f87171' }}>{scorePct}%</div>
        {wrongAttempts > 0 && <div className="text-[9px] text-cyan-400/60">{wrongAttempts} kesalahan</div>}
        <button onClick={() => { setSelectedLeft(null); setMatchedLeft(new Set()); setMatchedRight(new Set()); setWrongAttempts(0); setPhase('play'); reported.current = false; }}
          className="mt-2 px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30">
          Ulangi
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2">
      <div className="flex justify-between text-[9px] text-cyan-400 mb-1">
        <span className="font-bold">🔀 Pasangkan</span>
        <span>{wrongAttempts > 0 && <span className="text-red-400">{wrongAttempts} salah · </span>}{matchedLeft.size}/{validPairs.length}</span>
      </div>
      <div className="flex-1 min-h-0 flex gap-1 overflow-hidden">
        {/* Left column */}
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {validPairs.map((p, i) => (
            <button key={i} onClick={() => handleLeftClick(i)}
              className={`px-1.5 py-1.5 rounded border text-[9px] text-left transition-all ${
                matchedLeft.has(i) ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 line-through opacity-60' :
                selectedLeft === i ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-200' :
                'bg-white/5 hover:bg-white/10 border-white/10 text-cyan-200 cursor-pointer'
              }`}>
              {p.kiri as string}
            </button>
          ))}
        </div>
        {/* Right column (shuffled) */}
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {shuffledRight.map(r => (
            <button key={r.idx} onClick={() => handleRightClick(r.idx)}
              className={`px-1.5 py-1.5 rounded border text-[9px] text-left transition-all ${
                matchedRight.has(r.idx) ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 line-through opacity-60' :
                wrong === `${selectedLeft}-${r.idx}` ? 'bg-red-500/30 border-red-400/40 text-red-300' :
                'bg-white/5 hover:bg-white/10 border-white/10 text-cyan-200 cursor-pointer'
              }`}>
              {r.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
