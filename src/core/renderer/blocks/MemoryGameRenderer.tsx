'use client';

import React from 'react';
import { Trophy, Star, Dumbbell, RotateCcw, Brain } from 'lucide-react';
import type { MemoryGameBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti, fireConfettiCelebration } from '@/lib/confetti';
import { useGameA11y } from '@/lib/use-game-a11y';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';

// ═══════════════════════════════════════════════════════════════════
// MEMORY GAME RENDERER — Card-matching game for PPKn education
// ═══════════════════════════════════════════════════════════════════
// Takes `block.pairs` and creates a shuffled deck of cards. Each
// pair generates 2 cards (left + right) sharing a `pairId`. Player
// flips cards 2 at a time — a match occurs when both flipped cards
// share the same pairId AND have different types (left vs right).
//
// Scoring: efficiency-based with 50% floor
// score = max(ceil(pairs * 0.5), pairs - wrongAttempts)
//
// Architecture mirrors KuisRenderer / SortirGameRenderer exactly:
// - replayGeneration watcher resets all state
// - hasReportedRef guard prevents duplicate score reports
// - Token-aware styling (no hardcoded colors)
// - Inline editing via useInlineEditor
// ═══════════════════════════════════════════════════════════════════

// ── Card data structure ────────────────────────────────────────────
interface MemoryCard {
 /** Unique card identifier for React keys and state tracking */
 id: string;
 /** Shared ID linking two matching cards (left ↔ right) */
 pairId: string;
 /** Which side of the pair this card represents */
 type: 'left' | 'right';
 /** Display text on the card face */
 text: string;
}

// ── Game phases ────────────────────────────────────────────────────
type GamePhase = 'play' | 'done';

// ── Fisher-Yates shuffle (deterministic, unbiased) ─────────────────
function shuffleArray<T>(arr: T[]): T[] {
 const result = [...arr];
 for (let i = result.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [result[i]!, result[j]!] = [result[j]!, result[i]!];
 }
 return result;
}

// ── Build card deck from pairs ─────────────────────────────────────
function buildCards(pairs: MemoryGameBlock['pairs'], blockId?: string): MemoryCard[] {
 const prefix = blockId || 'mem';
 const cards: MemoryCard[] = [];
 pairs.forEach((pair, idx) => {
 // Only create cards for pairs that have both left and right text
 if (pair.left && pair.right) {
 cards.push({
 id: `${prefix}-L${idx}`,
 pairId: `${prefix}-P${idx}`,
 type: 'left',
 text: pair.left,
 });
 cards.push({
 id: `${prefix}-R${idx}`,
 pairId: `${prefix}-P${idx}`,
 type: 'right',
 text: pair.right,
 });
 }
 });
 return shuffleArray(cards);
}

// ── Determine grid column count based on card count ────────────────
function getGridCols(cardCount: number): number {
 if (cardCount <= 4) return 2;
 if (cardCount <= 8) return 3;
 return 4;
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export const MemoryGameRenderer = React.memo(function MemoryGameRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex }: {
 block: MemoryGameBlock;
 tokens: TokenResolver;
 interactive: boolean;
 isCompact: boolean;
 isEditing?: boolean;
 pageIndex?: number;
}) {

 const edu = tokens.edu('memory-game', isCompact);
 // ── Derived data ──────────────────────────────────────────────────
 const pairs = block.pairs || [];
 // Filter valid pairs (both sides non-empty) for scoring
 const validPairs = React.useMemo(
 () => pairs.filter(p => p.left && p.right),
 [pairs],
 );
 const validPairsLen = validPairs.length;

 // ── Game state ────────────────────────────────────────────────────
 const [cards, setCards] = React.useState<MemoryCard[]>(() => buildCards(pairs, block.id));
 const [flipped, setFlipped] = React.useState<string[]>([]);
 const [matched, setMatched] = React.useState<Set<string>>(new Set());
 const [moves, setMoves] = React.useState(0);
 const [wrongAttempts, setWrongAttempts] = React.useState(0);
 const [phase, setPhase] = React.useState<GamePhase>('play');

 // ── Ref for atomic flip tracking (prevents stale closure on rapid clicks) ──
 const flippedRef = React.useRef<string[]>([]);
 // Keep ref in sync with state
 React.useEffect(() => {
 flippedRef.current = flipped;
 }, [flipped]);

 // ── Timer ref for mismatch flip-back delay ────────────────────────
 const mismatchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

 // ── Cleanup timer on unmount ──────────────────────────────────────
 React.useEffect(() => {
 return () => {
 if (mismatchTimerRef.current) {
 clearTimeout(mismatchTimerRef.current);
 }
 };
 }, []);

 // ── Replay watcher: reset all state when replayGeneration bumps ───
 const replayGeneration = useInteractiveStore(s => s.replayGeneration);
 React.useEffect(() => {
 // Reset all game state
 setFlipped([]);
 setMatched(new Set());
 setMoves(0);
 setWrongAttempts(0);
 flippedRef.current = [];
 setPhase('play');
 // Re-shuffle cards
 setCards(buildCards(pairs, block.id));
 // Clear any pending mismatch timer
 if (mismatchTimerRef.current) {
 clearTimeout(mismatchTimerRef.current);
 mismatchTimerRef.current = null;
 }
 }, [replayGeneration]);

 // ── Interactive store: score reporting ─────────────────────────────
 const reportScore = useInteractiveStore(s => s.reportScore);

 // ── Accessibility hook ──────────────────────────────────────────
 // MUST be declared BEFORE the score guard useEffect that uses a11y.announceComplete()
 const a11y = useGameA11y({
 gameType: 'Cocokkan Kartu',
 blockId: block.id,
 score: matched.size / 2,
 maxScore: validPairsLen,
 interactive: interactive ?? false,
 });

 // ── Score guard: report once per completion cycle ─────────────────
 const hasReportedRef = React.useRef(false);
 React.useEffect(() => {
 if (phase === 'done' && interactive && block.id && !hasReportedRef.current) {
 hasReportedRef.current = true;
 // Efficiency-based scoring with 50% floor
 const score = Math.max(Math.ceil(validPairsLen * 0.5), validPairsLen - wrongAttempts);
 reportScore({
 elementId: block.id,
 pageIndex: pageIndex ?? 0,
 score,
 maxScore: validPairsLen,
 completed: true,
 });
 // Tiered sound & confetti based on percentage
 const pct = validPairsLen > 0 ? Math.round((score / validPairsLen) * 100) : 0;
 if (pct >= 80) {
 playSound('complete');
 fireConfettiCelebration();
 } else if (pct >= 50) {
 playSound('complete');
 fireConfetti({ count: 30 });
 } else {
 playSound('ding');
 }
 a11y.announceComplete(score, validPairsLen);
 }
 // Reset guard when game is no longer done (e.g., after replay)
 if (phase !== 'done') {
 hasReportedRef.current = false;
 }
 }, [phase, interactive, block.id, wrongAttempts, validPairsLen, reportScore, pageIndex, a11y]);

 // ── Inline editing hooks ──────────────────────────────────────────
 const titleEditor = useInlineEditor({
 blockId: block.id,
 fieldKey: 'title',
 value: block.title ?? '',
 tag: 'span',
 });

 // ── Card click handler ────────────────────────────────────────────
 const handleCardClick = React.useCallback((cardId: string) => {
 if (!interactive || phase !== 'play') return;

 // Prevent clicking already-matched or already-flipped cards
 if (matched.has(cardId)) return;
 if (flippedRef.current.includes(cardId)) return;

 const newFlipped = [...flippedRef.current, cardId];
 flippedRef.current = newFlipped;
 setFlipped(newFlipped);

 // First card of the pair — just flip it
 if (newFlipped.length === 1) return;

 // Second card flipped — evaluate match
 if (newFlipped.length === 2) {
 setMoves(prev => prev + 1);

 const card1 = cards.find(c => c.id === newFlipped[0]);
 const card2 = cards.find(c => c.id === newFlipped[1]);

 if (!card1 || !card2) return;

 // Match: same pairId AND different types (left vs right)
 const isMatch = card1.pairId === card2.pairId && card1.type !== card2.type;

 if (isMatch) {
 // ── Match found ──
 playSound('correct');
 a11y.announceCorrect();
 const newMatched = new Set(matched);
 newMatched.add(card1.id);
 newMatched.add(card2.id);
 setMatched(newMatched);

 // Clear flipped immediately on match
 flippedRef.current = [];
 setFlipped([]);

 // Check if game is complete
 if (newMatched.size === cards.length) {
 setPhase('done');
 }
 } else {
 // ── Mismatch ──
 playSound('incorrect');
 a11y.announceIncorrect();
 setWrongAttempts(prev => prev + 1);

 // Flip cards back after a short delay so the player can see both
 if (mismatchTimerRef.current) {
 clearTimeout(mismatchTimerRef.current);
 }
 mismatchTimerRef.current = setTimeout(() => {
 flippedRef.current = [];
 setFlipped([]);
 mismatchTimerRef.current = null;
 }, 900);
 }
 }

 // Safety: if somehow 3+ cards are flipped, reset to just the latest
 if (newFlipped.length > 2) {
 flippedRef.current = [cardId];
 setFlipped([cardId]);
 }
 }, [interactive, phase, matched, cards]);

 // ── Restart handler ───────────────────────────────────────────────
 const handleRestart = React.useCallback(() => {
 setFlipped([]);
 setMatched(new Set());
 setMoves(0);
 setWrongAttempts(0);
 flippedRef.current = [];
 setPhase('play');
 setCards(buildCards(pairs, block.id));
 hasReportedRef.current = false;
 if (mismatchTimerRef.current) {
 clearTimeout(mismatchTimerRef.current);
 mismatchTimerRef.current = null;
 }
 playSound('click');
 }, [pairs, block.id]);

 // ── Empty state: no valid pairs configured ────────────────────────
 if (validPairsLen === 0) {
 return (
 <div className="text-center p-5 rounded-xl"
 style={{
 background: edu.accentAlpha(0.06),
 border: '2px dashed ' + edu.accentAlpha(0.25),
 }}>
 <div className="text-2xl mb-2">🧠</div>
 <div className="font-extrabold mb-1" style={{ ...edu.caption(), color: edu.accent() }}>
 <InlineTextEditor
 {...titleEditor}
 className="font-extrabold"
 style={{ color: edu.accent(), ...edu.micro() }}
 placeholder="Ketik judul game..."
 />
 </div>
 <div style={{ ...edu.caption(), color: edu.mutedText(0.7) }}>
 Tambahkan pasangan kartu untuk memulai game Cocokkan Kartu!
 </div>
 </div>
 );
 }

 // ── Completion screen ─────────────────────────────────────────────
 if (phase === 'done') {
 const score = Math.max(Math.ceil(validPairsLen * 0.5), validPairsLen - wrongAttempts);
 const pct = validPairsLen > 0 ? Math.round((score / validPairsLen) * 100) : 0;

 return (
 <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0} gradientBorder>
 <div className="text-center p-5">
 <ReadingProgressIndicator progress={1} tokens={tokens} accent="y" height={3} position="top" />
 {/* Tiered icon */}
 <div className="text-3xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>
 {pct >= 80
 ? <Trophy size={28} className="inline text-app-accent" />
 : pct >= 50
 ? <Star size={28} className="inline text-app-accent" />
 : <Dumbbell size={28} className="inline text-app-accent" />}
 </div>

 {/* Tiered message */}
 <div className="font-black text-lg mb-1"
 style={{ fontFamily: tokens.fontFamily('display'), color: edu.accent() }}>
 {pct >= 80 ? 'Luar Biasa!' : pct >= 50 ? 'Bagus!' : 'Terus Berlatih!'}
 </div>

 {/* Score display */}
 <div className="mb-4" style={{ ...edu.body(), color: edu.mutedText(0.8) }}>
 Skor kamu: {score}/{validPairsLen} ({pct}%)
 </div>

 {/* Stats row */}
 <div className="flex justify-center gap-3">
 <PremiumBadge tokens={tokens} accent="g" variant="glass">
 Langkah {moves}
 </PremiumBadge>
 <PremiumBadge tokens={tokens} accent="r" variant="glass">
 Salah {wrongAttempts}
 </PremiumBadge>
 </div>

 {/* Replay button */}
 {interactive && (
 <MicroInteraction tokens={tokens} accent="y" effect="squish">
 <button className={"mt-4 px-5 py-2 rounded-xl font-extrabold" + tokens.iosButtonTw(interactive)}
 onClick={handleRestart}
 style={{
 ...edu.caption(),
 background: 'linear-gradient(135deg, ' + edu.accent() + ', ' + tokens.color('o') + ')',
 color: tokens.color('bg'),
 boxShadow: '0 4px 16px ' + edu.accentAlpha(0.35),
 }}>
 <RotateCcw size={14} className="inline" /> Ulangi
 </button>
 </MicroInteraction>
 )}
 </div>
 </PremiumBlockWrapper>
 );
 }

 // ── Active game screen ────────────────────────────────────────────
 const gridCols = getGridCols(cards.length);

 return (
 <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0}>
 <div className="space-y-3 game-block" {...a11y.rootAria} data-interactive>
 <ReadingProgressIndicator progress={validPairsLen > 0 ? (matched.size / 2) / validPairsLen : 0} tokens={tokens} accent="y" height={3} position="top" />
 {/* Hidden instruction for screen readers */}
 <div id={a11y.instructionId} className="sr-only">Balik kartu untuk menemukan pasangan yang cocok</div>
 {/* Header with title and move counter */}
 <div className="flex items-center justify-between min-w-0">
 <div className="flex items-center gap-2 min-w-0">
 <div className="font-extrabold" style={{ ...edu.caption(), color: edu.accent() }}>
 <Brain size={14} className="inline" />{' '}
 <InlineTextEditor
 {...titleEditor}
 className="font-extrabold"
 style={{ color: edu.accent(), ...edu.micro() }}
 placeholder="Ketik judul game..."
 />
 </div>
 </div>
 <div className="flex items-center gap-2">
 {/* Match progress badge */}
 <PremiumBadge tokens={tokens} accent="y" variant="glass">
 {matched.size / 2}/{validPairsLen}
 </PremiumBadge>
 {/* Move counter badge */}
 <span className="px-2.5 py-1 rounded-full font-extrabold"
 style={{
 ...edu.micro(),
 background: tokens.colorAlpha('c', 0.15),
 color: tokens.color('c'),
 border: '1px solid ' + tokens.colorAlpha('c', 0.3),
 }}>
 {moves} langkah
 </span>
 </div>
 </div>

 {/* Progress bar */}
 <div className="h-1.5 rounded-full overflow-hidden relative"
 {...a11y.progressAria('Kemajuan Cocokkan Kartu', matched.size / 2, validPairsLen)}
 style={{ background: tokens.subtleBg(0.08) }}>
 <div className="h-full rounded-full"
 style={{
 width: validPairsLen > 0 ? (matched.size / cards.length) * 100 + '%' : '0%',
 ...tokens.iosTransitionStyle('width', 'slow'),
 background: 'linear-gradient(90deg, ' + edu.accent() + ', ' + tokens.color('g') + ')',
 backgroundSize: '200% 100%',
 animation: 'shimmer 2s linear infinite',
 boxShadow: '0 0 8px ' + edu.accentAlpha(0.3),
 }}
 />
 {/* Aurora shimmer overlay */}
 <div
 style={{
 position: 'absolute',
 top: 0,
 left: 0,
 right: 0,
 bottom: 0,
 background: 'linear-gradient(90deg, transparent, ' + edu.accentAlpha(0.2) + ', transparent)',
 backgroundSize: '200% 100%',
 animation: 'shimmer 3s ease-in-out infinite',
 pointerEvents: 'none',
 borderRadius: 'inherit',
 }}
 />
 </div>

 {/* Card grid — constraint saat compact untuk mencegah overflow scene */}
 <div
 className={`grid gap-2.5 premium-card-glow ${isCompact ? 'max-h-72 overflow-hidden' : ''}`}
 style={{
 gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
 perspective: '1000px',
 }}
 role="group"
 aria-label="Kartu memory"
 >
 {cards.map((card) => {
 const isFlipped = flipped.includes(card.id);
 const isMatched = matched.has(card.id);
 const isRevealed = isFlipped || isMatched;

 return (
 <button
 key={`mem-card-${block.id || 'mem'}-${card.id}`}
 onClick={() => handleCardClick(card.id)}
 disabled={!interactive || isMatched}
 className={"relative w-full rounded-xl transition-transform duration-300 cursor-pointer" + tokens.iosFocusRing()}
 aria-label={isRevealed ? card.text : 'Kartu tersembunyi'}
 aria-pressed={isRevealed}
 style={{
 aspectRatio: '3 / 4',
 perspective: '1000px',
 transformStyle: 'preserve-3d',
 }}
 >
 {/* Card inner wrapper — rotates on flip */}
 <div
 className="absolute inset-0 transition-transform duration-300"
 style={{
 transformStyle: 'preserve-3d',
 transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
 }}
 >
 {/* ── Front face (hidden / question mark) ── */}
 <div
 className="absolute inset-0 flex items-center justify-center rounded-xl backface-hidden"
 style={{
 backfaceVisibility: 'hidden',
 WebkitBackfaceVisibility: 'hidden',
 background: isMatched
 ? tokens.colorAlpha('g', 0.15)
 : edu.accentAlpha(0.08),
 border: '2px solid ' + (isMatched
 ? tokens.colorAlpha('g', 0.4)
 : edu.accentAlpha(0.25)),
 boxShadow: edu.shadow('card'),
 }}
 >
 <span
 className="text-2xl select-none"
 style={{ color: edu.accent(), opacity: 0.6 }}
 >
 ❓
 </span>
 </div>

 {/* ── Back face (revealed text) ── */}
 <div
 className={`absolute inset-0 flex items-center justify-center rounded-xl backface-hidden p-2 ${isCompact ? 'canvas-truncate-2' : ''}`}
 style={{
 backfaceVisibility: 'hidden',
 WebkitBackfaceVisibility: 'hidden',
 transform: 'rotateY(180deg)',
 background: isMatched
 ? tokens.colorAlpha('g', 0.12)
 : card.type === 'left'
 ? tokens.colorAlpha('c', 0.1)
 : tokens.colorAlpha('p', 0.1),
 border: '2px solid ' + (isMatched
 ? tokens.color('g')
 : card.type === 'left'
 ? tokens.colorAlpha('c', 0.4)
 : tokens.colorAlpha('p', 0.4)),
 boxShadow: isMatched
 ? '0 0 12px ' + tokens.colorAlpha('g', 0.2)
 : 'none',
 }}
 >
 <span
 className="font-bold text-center leading-tight"
 style={{
 ...edu.micro(),
 color: isMatched
 ? tokens.color('g')
 : card.type === 'left'
 ? tokens.color('c')
 : tokens.color('p'),
 wordBreak: 'break-word',
 overflowWrap: 'break-word',
 }}
 >
 {card.text}
 </span>
 </div>
 </div>
 </button>
 );
 })}
 </div>
 </div>
 </PremiumBlockWrapper>
 );
});