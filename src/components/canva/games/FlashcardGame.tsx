'use client';

import { useState, useEffect, useRef } from 'react';
import { EmptyState } from './shared';
import type { GameComponentProps } from './shared';

/* ═══════════════════════════════════════════════════════════════
   FLASHCARD GAME
   ═══════════════════════════════════════════════════════════════ */
export function FlashcardGame({ data, compact, onComplete }: GameComponentProps) {
  const kartu = (data.kartu as Array<Record<string, unknown>>) || [];
  const validCards = kartu.filter(k => k.depan || k.belakang);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const reported = useRef(false);

  // Report completion when user has viewed all cards
  useEffect(() => { if (currentIdx === validCards.length - 1 && flipped && !reported.current && onComplete) { reported.current = true; onComplete(validCards.length, validCards.length); } }, [currentIdx, flipped]);

  if (validCards.length === 0) return <EmptyState icon="🃏" label="Flashcard" compact={compact} />;

  const card = validCards[currentIdx];

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2 items-center justify-center">
      <div className="text-[9px] font-bold text-cyan-400 mb-1">🃏 Flashcard {currentIdx + 1}/{validCards.length}</div>
      <button
        onClick={() => setFlipped(!flipped)}
        className="w-full flex-1 min-h-0 rounded-xl border border-white/10 flex items-center justify-center p-3 transition-all cursor-pointer hover:border-cyan-400/30"
        style={{
          background: flipped ? 'rgba(56,217,217,0.15)' : 'rgba(255,255,255,0.05)',
          transform: flipped ? 'rotateY(0deg)' : 'rotateY(0deg)',
        }}
      >
        <span className={`${compact ? 'text-[10px]' : 'text-[12px]'} font-bold text-cyan-200 text-center`}>
          {flipped ? (card.belakang as string) : (card.depan as string)}
        </span>
      </button>
      <div className="flex gap-1 mt-1 w-full">
        {currentIdx > 0 && (
          <button onClick={() => { setCurrentIdx(i => i - 1); setFlipped(false); }}
            className="flex-1 py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] text-cyan-300 border border-white/10 cursor-pointer">
            ← Sebelumnya
          </button>
        )}
        {currentIdx < validCards.length - 1 && (
          <button onClick={() => { setCurrentIdx(i => i + 1); setFlipped(false); }}
            className="flex-1 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 rounded text-[9px] text-cyan-300 border border-cyan-400/20 cursor-pointer">
            Selanjutnya →
          </button>
        )}
      </div>
    </div>
  );
}
