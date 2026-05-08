'use client';

import { useState, useEffect, useRef } from 'react';
import { EmptyState } from './shared';
import type { GameComponentProps } from './shared';

/* ═══════════════════════════════════════════════════════════════
   FLASHCARD GAME — Proper 3D flip animation
   Score = cards viewed (flashcard = study tool, all viewed = 100%)
   ═══════════════════════════════════════════════════════════════ */
export function FlashcardGame({ data, compact, interactive, onComplete }: GameComponentProps) {
  const kartu = (data.kartu as Array<Record<string, unknown>>) || [];
  const validCards = kartu.filter(k => k.depan || k.belakang);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [viewedCards, setViewedCards] = useState<Set<number>>(new Set());
  const reported = useRef(false);

  // Track viewed cards and report score when all viewed
  useEffect(() => {
    // Guard: validCards.length > 0 prevents spurious onComplete(0,0) on empty data
    if (validCards.length > 0 && viewedCards.size === validCards.length && !reported.current && onComplete) {
      reported.current = true;
      onComplete(validCards.length, validCards.length);
    }
  }, [viewedCards, validCards.length]);

  const handleFlip = () => {
    const newFlipped = !flipped;
    setFlipped(newFlipped);
    // Mark current card as viewed when flipped to back
    if (newFlipped) {
      setViewedCards(prev => new Set([...prev, currentIdx]));
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(i => i - 1);
      setFlipped(false);
    }
  };

  const handleNext = () => {
    if (currentIdx < validCards.length - 1) {
      setCurrentIdx(i => i + 1);
      setFlipped(false);
    }
  };

  if (validCards.length === 0) return <EmptyState icon="🃏" label="Flashcard" compact={compact} interactive={interactive} />;

  const card = validCards[currentIdx];

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2 items-center justify-center">
      <div className="flex justify-between w-full text-[9px] text-cyan-400 mb-1">
        <span className="font-bold">🃏 Flashcard {currentIdx + 1}/{validCards.length}</span>
        <span>{viewedCards.size}/{validCards.length} dilihat</span>
      </div>

      {/* 3D Flip Card Container */}
      <div
        className="w-full flex-1 min-h-0 cursor-pointer"
        style={{ perspective: '800px' }}
        onClick={handleFlip}
      >
        <div
          className="w-full h-full relative transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0 rounded-xl border border-white/10 flex items-center justify-center p-4 backface-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            <span className={`${compact ? 'text-[10px]' : 'text-[13px]'} font-bold text-cyan-200 text-center leading-snug`}>
              {card.depan as string}
            </span>
          </div>
          {/* Back face */}
          <div
            className="absolute inset-0 rounded-xl border border-cyan-400/30 flex items-center justify-center p-4 backface-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: 'rgba(56,217,217,0.12)',
              transform: 'rotateY(180deg)',
            }}
          >
            <span className={`${compact ? 'text-[10px]' : 'text-[13px]'} font-bold text-cyan-100 text-center leading-snug`}>
              {card.belakang as string}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation + flip hint */}
      <div className="text-[8px] text-cyan-400/50 mt-1 mb-0.5">Ketuk kartu untuk membalik</div>
      <div className="flex gap-1 w-full">
        {currentIdx > 0 && (
          <button onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="flex-1 py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] text-cyan-300 border border-white/10 cursor-pointer transition-colors">
            ← Sebelumnya
          </button>
        )}
        {currentIdx < validCards.length - 1 && (
          <button onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="flex-1 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 rounded text-[9px] text-cyan-300 border border-cyan-400/20 cursor-pointer transition-colors">
            Selanjutnya →
          </button>
        )}
      </div>
    </div>
  );
}
