'use client';

import React from 'react';
import { CheckCircle2, RotateCcw, Sparkles, Eye, EyeOff } from 'lucide-react';
import type { FlashcardSetBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti } from '@/lib/confetti';

export const FlashcardRenderer = React.memo(function FlashcardRenderer({ block, tokens, isCompact, interactive, isEditing, pageIndex }: {
  block: FlashcardSetBlock; tokens: TokenResolver; isCompact: boolean; interactive?: boolean; isEditing?: boolean; pageIndex?: number;
}) {
  // ── Edu rendering context ────────────────────────────────────
  const edu = tokens.edu('flashcard-set', isCompact);

  const [idx, setIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [viewedCards, setViewedCards] = React.useState<Set<number>>(new Set());

  // ── Replay watcher: reset all state when replayGeneration bumps ──
  const replayGeneration = useInteractiveStore(s => s.replayGeneration);
  React.useEffect(() => {
    setIdx(0);
    setFlipped(false);
    setViewedCards(new Set());
  }, [replayGeneration]);

  const cards = block.cards || [];
  const card = cards[idx];
  const isCompleted = interactive && viewedCards.size >= cards.length && cards.length > 0;

  // ── Interactive store: score reporting ──────────────────────
  const reportScore = useInteractiveStore(s => s.reportScore);

  // Track viewed cards & report completion (guard: only fire once)
  const hasReportedRef = React.useRef(false);
  React.useEffect(() => {
    if (flipped && interactive && idx < cards.length) {
      setViewedCards(prev => {
        const next = new Set(prev);
        next.add(idx);
        return next;
      });
    }
  }, [flipped, idx, interactive, cards.length]);

  React.useEffect(() => {
    if (isCompleted && block.id && !hasReportedRef.current) {
      hasReportedRef.current = true;
      reportScore({
        elementId: block.id,
        pageIndex: pageIndex ?? 0,
        score: cards.length,
        maxScore: cards.length,
        completed: true,
      });
      playSound('complete');
      fireConfetti({ count: 40 });
    }
    if (!isCompleted) hasReportedRef.current = false;
  }, [isCompleted, block.id, cards.length, reportScore, pageIndex]);

  // ── Inline editing hooks — must be called before any early returns ──
  const qEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: `cards.${idx}.q`,
    value: card?.q ?? '',
    tag: 'div',
  });
  const aEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: `cards.${idx}.a`,
    value: card?.a ?? '',
    tag: 'div',
    multiline: true,
  });

  if (cards.length === 0) return null;

  // ══ COMPLETION SCREEN ═══════════════════════════════════════
  if (isCompleted) {
    return (
      <div className="text-center p-5 rounded-2xl premium-card-glow"
        style={{
          background: edu.pageBg(),
          border: '2px solid ' + tokens.colorAlpha('g', 0.3),
          boxShadow: edu.shadow('elevated'),
          animation: 'popSuccess 0.5s ease-out',
        }}>
        <div className="text-3xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>🧠</div>
        <div className="font-black text-lg mb-1" style={{ fontFamily: tokens.fontFamily('display'), color: tokens.color('g') }}>
          Semua Kartu Dipelajari!
        </div>
        <div className="mb-4" style={{ ...edu.caption(), color: edu.mutedText(0.8) }}>
          Kamu telah mempelajari semua {cards.length} kartu kilat.
        </div>
        <div className="inline-flex items-center gap-2 mb-4">
          {cards.map((_, i) => (
            <div key={`card-dot-${block.id || 'fc'}-${i}`} className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: tokens.colorAlpha('g', 0.2),
                border: '1px solid ' + tokens.colorAlpha('g', 0.3),
                animation: `popSuccess 0.3s ease-out ${i * 0.1}s both`,
              }}>
              <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>check_circle</span>
            </div>
          ))}
        </div>
        <div>
          <MicroInteraction tokens={tokens} accent="g" effect="squish">
          <button className={"px-5 py-2 rounded-xl font-extrabold " + tokens.iosButtonTw(interactive)}
            onClick={() => {
              setIdx(0);
              setFlipped(false);
              setViewedCards(new Set());
              playSound('click');
            }}
            style={{
              ...edu.caption(),
              background: 'linear-gradient(135deg, ' + tokens.color('g') + ', ' + tokens.color('c') + ')',
              color: tokens.color('bg'),
              boxShadow: '0 4px 16px ' + tokens.colorAlpha('g', 0.35),
            }}>
            <span className="material-symbols-outlined inline" style={ { fontSize: '14px' } }>refresh</span> Ulangi Kartu
          </button>
          </MicroInteraction>
        </div>
      </div>
    );
  }

  const handleFlip = () => {
    if (!interactive) return;
    const newFlipped = !flipped;
    setFlipped(newFlipped);
    if (newFlipped) playSound('tap');
    else playSound('correct');
  };

  return (
    <PremiumBlockWrapper tokens={tokens} accent="p" staggerIndex={0}>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent="p" height={2} position="top" />
    <div className={isCompact ? 'mt-2' : 'mt-4'}>
      <div className="flex items-center justify-between mb-3">
        <PremiumBadge tokens={tokens} accent="y" variant="glass">🃏 Kartu Kilat</PremiumBadge>
        <div className="flex items-center gap-1.5">
          <span className="font-bold" style={{ ...edu.micro(), color: edu.mutedText(0.6) }}>
            {viewedCards.size}/{cards.length}
          </span>
          {flipped ? <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>visibility_off</span> : <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>visibility</span>}
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div className="relative" style={{ perspective: '1000px' }}>
        <div
          className={`rounded-xl ${interactive ? 'cursor-pointer' : ''}`}
          style={{
            minHeight: isCompact ? 110 : 130,
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: tokens.iosTransitionStyle('transform', 'slow', 'ios').transition,
          }}
          onClick={handleFlip}
        >
          {/* FRONT FACE */}
          <div className="rounded-xl p-4 flex flex-col justify-center"
            style={{
              background: edu.cardBg(),
              border: '2px solid ' + edu.accentAlpha(0.3),
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              position: 'absolute',
              inset: 0,
              overflowY: 'auto',
              boxShadow: edu.shadow('card') + ', 0 0 20px ' + edu.accentAlpha(0.1),
            }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: edu.accentAlpha(0.2) }}>
                <span style={{ fontSize: '12px' }}>❓</span>
              </div>
              <div className="font-extrabold uppercase tracking-wider" style={{ ...edu.caption(), color: edu.accent() }}>Pertanyaan</div>
            </div>
            <InlineTextEditor
              {...qEditor}
              className={`font-extrabold leading-relaxed ${isCompact ? 'canvas-truncate-2' : ''}`}
              style={{ ...edu.bodyLg(), wordBreak: 'break-word', overflowWrap: 'break-word' }}
              placeholder="Ketik pertanyaan..."
            />
            {interactive && (
              <div className="mt-3 text-center">
                <span className="font-bold px-2 py-1 rounded-full"
                  style={{ ...edu.micro(), background: edu.accentAlpha(0.1), color: edu.accent(), border: `1px solid ${edu.accentAlpha(0.2)}` }}>
                  👆 Ketuk untuk membalik
                </span>
              </div>
            )}
          </div>

          {/* BACK FACE */}
          <div className="rounded-xl p-4 flex flex-col justify-center"
            style={{
              background: tokens.colorAlpha('g', 0.12),
              border: '2px solid ' + tokens.colorAlpha('g', 0.35),
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              position: 'absolute',
              inset: 0,
              overflowY: 'auto',
              boxShadow: edu.shadow('card') + ', 0 0 20px ' + tokens.colorAlpha('g', 0.1),
            }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: tokens.colorAlpha('g', 0.2) }}>
                <span className="material-symbols-outlined inline" style={ { fontSize: '10px' } }>check_circle</span>
              </div>
              <div className="font-extrabold uppercase tracking-wider" style={{ ...edu.caption(), color: tokens.color('g') }}>Jawaban</div>
            </div>
            <InlineTextEditor
              {...aEditor}
              className={`leading-relaxed ${isCompact ? 'canvas-truncate-2' : ''}`}
              style={{ ...edu.body(), color: tokens.color('g'), wordBreak: 'break-word', overflowWrap: 'break-word' }}
              placeholder="Ketik jawaban..."
            />
          </div>
        </div>

        {/* Spacer to maintain height */}
        <div style={{ minHeight: isCompact ? 110 : 130 }} />
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between mt-3">
        <button className={"px-4 py-2.5 rounded-full font-bold " + tokens.iosButtonTw(interactive)}
          style={{
            ...edu.caption(),
            background: edu.accentAlpha(0.15),
            color: edu.accent(),
            border: `1px solid ${edu.accentAlpha(0.3)}`,
          }}
          onClick={() => { setIdx(Math.max(0, idx - 1)); setFlipped(false); playSound('click'); }} disabled={idx === 0}>
          ← Prev
        </button>
        <div className="flex gap-1.5">
          {cards.map((_, i) => (
            <div key={`nav-dot-${block.id || 'fc'}-${i}`} className="w-2 h-2 rounded-full transition-[background-color,box-shadow]"
              style={{
                background: i === idx ? edu.accent() : viewedCards.has(i) ? tokens.color('g') : tokens.subtleBg(0.12),
                boxShadow: i === idx ? '0 0 8px ' + edu.accentAlpha(0.5) : 'none',
              }} />
          ))}
        </div>
        <button className={"px-4 py-2.5 rounded-full font-bold " + tokens.iosButtonTw(interactive)}
          style={{
            ...edu.caption(),
            background: edu.accentAlpha(0.15),
            color: edu.accent(),
            border: `1px solid ${edu.accentAlpha(0.3)}`,
          }}
          onClick={() => { setIdx(Math.min(cards.length - 1, idx + 1)); setFlipped(false); playSound('click'); }}
          disabled={idx >= cards.length - 1}>
          Next →
        </button>
      </div>
    </div>
    </PremiumBlockWrapper>
  );
});
