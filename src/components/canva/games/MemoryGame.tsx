'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { EmptyState } from './shared';
import type { GameComponentProps } from './shared';

/* ═══════════════════════════════════════════════════════════════
   MEMORY MATCH GAME — Efficiency-based scoring with 50% floor
   Score = max(ceil(pairs * 0.5), pairs - wrongAttempts)
   ═══════════════════════════════════════════════════════════════ */
export function MemoryGame({ data, compact, interactive, onComplete }: GameComponentProps) {
  const pasangan = (data.pasangan as Array<Record<string, unknown>>) || [];
  const validPairs = pasangan.filter(p => p.kiri || p.kanan);

  const cards = useMemo(() => {
    const c: Array<{ id: number; text: string; pairId: number; type: 'left' | 'right' }> = [];
    validPairs.forEach((p, i) => {
      c.push({ id: i * 2, text: (p.kiri as string) || `?${i + 1}`, pairId: i, type: 'left' });
      c.push({ id: i * 2 + 1, text: (p.kanan as string) || `?${i + 1}`, pairId: i, type: 'right' });
    });
    // Fisher-Yates shuffle (unbiased, unlike sort+random)
    for (let i = c.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [c[i], c[j]] = [c[j], c[i]];
    }
    return c;
  }, [validPairs]);

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
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
  }, [phase, onComplete, validPairs.length, wrongAttempts]);

  const handleFlip = useCallback((cardId: number) => {
    if (flipped.length === 2 || flipped.includes(cardId) || matched.has(cardId)) return;
    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      const c1 = cards.find(c => c.id === first);
      const c2 = cards.find(c => c.id === second);
      if (c1 && c2 && c1.pairId === c2.pairId && c1.type !== c2.type) {
        setMatched(prev => new Set([...prev, first, second]));
        setFlipped([]);
        if (matched.size + 2 === cards.length) {
          setPhase('done');
        }
      } else {
        setWrongAttempts(w => w + 1);
        setTimeout(() => setFlipped([]), 800);
      }
    }
  }, [flipped, matched, cards]);

  const handleRestart = () => {
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setWrongAttempts(0);
    setPhase('play');
    reported.current = false;
  };

  if (validPairs.length === 0) return <EmptyState icon="🧠" label="Memory Match" compact={compact} interactive={interactive} />;

  const finalScore = Math.max(Math.ceil(validPairs.length * 0.5), validPairs.length - wrongAttempts);
  const scorePct = validPairs.length > 0 ? Math.round((finalScore / validPairs.length) * 100) : 0;

  if (phase === 'done') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <span className="text-2xl">🎉</span>
        <div className="text-[11px] font-bold text-cyan-300 mt-1">Selesai!</div>
        <div className="text-[14px] font-black mt-0.5" style={{ color: scorePct >= 85 ? '#34d399' : scorePct >= 70 ? '#f9c12e' : '#f87171' }}>{scorePct}%</div>
        <div className="text-[9px] text-cyan-400/60 mt-0.5">{moves} langkah · {wrongAttempts} salah</div>
        <button onClick={handleRestart}
          className="mt-2 px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30">
          Ulangi
        </button>
      </div>
    );
  }

  const cols = cards.length <= 4 ? 2 : cards.length <= 8 ? 3 : 4;

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2">
      <div className="flex justify-between text-[9px] text-cyan-400 mb-1">
        <span className="font-bold">🧠 Memory</span>
        <span>Langkah: {moves} | {wrongAttempts > 0 && <span className="text-red-400">{wrongAttempts} salah · </span>}{matched.size / 2}/{validPairs.length}</span>
      </div>
      <div className="flex-1 min-h-0 grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map(card => {
          const isFlipped = flipped.includes(card.id);
          const isMatched = matched.has(card.id);
          return (
            <button
              key={card.id}
              onClick={() => handleFlip(card.id)}
              className={`rounded-lg border text-center flex items-center justify-center p-1 transition-all duration-300 ${
                isMatched ? 'bg-emerald-500/20 border-emerald-400/40 scale-95' :
                isFlipped ? 'bg-cyan-500/30 border-cyan-400/40' :
                'bg-white/10 hover:bg-white/15 border-white/10 cursor-pointer'
              }`}
            >
              {(isFlipped || isMatched) ? (
                <span className={`${compact ? 'text-[7px]' : 'text-[9px]'} text-cyan-200 font-medium leading-tight`}>
                  {card.text}
                </span>
              ) : (
                <span className="text-lg">❓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
