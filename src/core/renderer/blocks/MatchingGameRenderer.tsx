'use client';

import React from 'react';
import { Trophy, Star, Dumbbell, RotateCcw, Shuffle } from 'lucide-react';
import type { MatchingGameBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti, fireConfettiCelebration } from '@/lib/confetti';
import { useGameA11y } from '@/lib/use-game-a11y';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';

// ═══════════════════════════════════════════════════════════════════
// MATCHING GAME RENDERER — Pasangkan Game for PPKn education
// ═══════════════════════════════════════════════════════════════════
// Players match left-column items to their corresponding right-column
// items (shuffled). Score is efficiency-based with a 50% floor:
// score = max(ceil(pairs*0.5), pairs - wrongAttempts)
// ═══════════════════════════════════════════════════════════════════

/** Shuffled right item — tracks original pair index for match logic */
interface ShuffledRight {
 /** Original pair index (matches left column index) */
 idx: number;
 /** Display text from pairs[i].right */
 text: string;
}

/** Fisher-Yates shuffle — deterministic given a seed-like input */
function shuffleRightItems(pairs: Array<{ left: string; right: string }>): ShuffledRight[] {
 const items: ShuffledRight[] = pairs.map((p, i) => ({ idx: i, text: p.right }));
 // Fisher-Yates (Durstenfeld) shuffle
 for (let i = items.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [items[i]!, items[j]!] = [items[j]!!, items[i]];
 }
 return items;
}

// ── Props interface ──────────────────────────────────────────────

interface MatchingGameRendererProps {
 block: MatchingGameBlock;
 tokens: TokenResolver;
 interactive: boolean;
 isCompact: boolean;
 isEditing?: boolean;
 pageIndex?: number;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export const MatchingGameRenderer = React.memo(function MatchingGameRenderer({
 block,
 tokens,
 interactive,
 isCompact,
 isEditing,
 pageIndex,
}: MatchingGameRendererProps) {
 const edu = tokens.edu('matching-game', isCompact);
 // ── Game state ──────────────────────────────────────────────────
 const [selectedLeft, setSelectedLeft] = React.useState<number | null>(null);
 const [matchedLeft, setMatchedLeft] = React.useState<Set<number>>(new Set());
 const [matchedRight, setMatchedRight] = React.useState<Set<number>>(new Set());
 const [wrongAttempts, setWrongAttempts] = React.useState(0);
 const [wrongRightIdx, setWrongRightIdx] = React.useState<number | null>(null);
 const [phase, setPhase] = React.useState<'play' | 'done'>('play');

 // ── Shuffled right column — derived from pairs, stable per pairs change ──
 const validPairs = React.useMemo(
 () => (block.pairs || []).filter(p => p.left.trim() && p.right.trim()),
 [block.pairs],
 );

 // Data-key-based state: reset when pairs content changes
 const pairsKey = React.useMemo(
 () => validPairs.map(p => `${p.left}|${p.right}`).join(';;'),
 [validPairs],
 );

 const [shuffledRight, setShuffledRight] = React.useState<ShuffledRight[]>([]);

 // Re-shuffle when pairs change
 React.useEffect(() => {
 setShuffledRight(shuffleRightItems(validPairs));
 // Full reset on data change
 setSelectedLeft(null);
 setMatchedLeft(new Set());
 setMatchedRight(new Set());
 setWrongAttempts(0);
 setWrongRightIdx(null);
 setPhase('play');
 }, [pairsKey]);

 // ── Timer cleanup on unmount ────────────────────────────────────
 const wrongTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
 React.useEffect(() => {
 return () => {
 if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
 };
 }, []);

 // ── Replay watcher: reset all state when replayGeneration bumps ──
 const replayGeneration = useInteractiveStore(s => s.replayGeneration);
 React.useEffect(() => {
 setSelectedLeft(null);
 setMatchedLeft(new Set());
 setMatchedRight(new Set());
 setWrongAttempts(0);
 setWrongRightIdx(null);
 setPhase('play');
 setShuffledRight(shuffleRightItems(validPairs));
 }, [replayGeneration]);

 // ── Interactive store: score reporting ───────────────────────────
 const reportScore = useInteractiveStore(s => s.reportScore);

 // ── Accessibility hook ──────────────────────────────────────────
 // MUST be declared BEFORE the score guard useEffect that uses a11y.announceComplete()
 const a11y = useGameA11y({
 gameType: 'Pasangkan',
 blockId: block.id,
 score: matchedLeft.size,
 maxScore: validPairs.length,
 interactive: interactive ?? false,
 });

 // Score guard — only fire once per completion cycle
 const hasReportedRef = React.useRef(false);
 React.useEffect(() => {
 if (phase === 'done' && interactive && block.id && !hasReportedRef.current) {
 hasReportedRef.current = true;
 const score = Math.max(
 Math.ceil(validPairs.length * 0.5),
 validPairs.length - wrongAttempts,
 );
 reportScore({
 elementId: block.id,
 pageIndex: pageIndex ?? 0,
 score,
 maxScore: validPairs.length,
 completed: true,
 });
 // Tiered celebration
 const pct = Math.round((score / validPairs.length) * 100);
 if (pct >= 80) {
 playSound('complete');
 fireConfettiCelebration();
 } else if (pct >= 50) {
 playSound('complete');
 fireConfetti({ count: 30 });
 } else {
 playSound('ding');
 }
 a11y.announceComplete(score, validPairs.length);
 }
 // Reset reported flag when replaying
 if (phase !== 'done') hasReportedRef.current = false;
 }, [phase, interactive, block.id, wrongAttempts, validPairs.length, reportScore, pageIndex, a11y]);

 // ── Inline editing hooks (before early returns) ─────────────────
 const titleEditor = useInlineEditor({
 blockId: block.id,
 fieldKey: 'title',
 value: block.title ?? '',
 tag: 'span',
 });

 // ── Build matched pair mapping (leftIdx → shuffledRightIdx) ──────
 // Used to draw visual connection lines between matched left-right pairs
 const matchedPairMap = React.useMemo(() => {
 const map = new Map<number, number>();
 matchedLeft.forEach(leftIdx => {
 const rightShuffledIdx = shuffledRight.findIndex(
 r => r.idx === leftIdx && matchedRight.has(shuffledRight.indexOf(r)),
 );
 if (rightShuffledIdx !== -1) {
 map.set(leftIdx, rightShuffledIdx);
 }
 });
 return map;
 }, [matchedLeft, matchedRight, shuffledRight]);

 // ── Refs for SVG line positioning ────────────────────────────────
 const leftItemRefs = React.useRef<Map<number, HTMLButtonElement>>(new Map());
 const rightItemRefs = React.useRef<Map<number, HTMLButtonElement>>(new Map());
 const gridContainerRef = React.useRef<HTMLDivElement>(null);

 // ── SVG line coordinates (recalculated on render) ────────────────
 const [lineCoords, setLineCoords] = React.useState<
 Array<{ x1: number; y1: number; x2: number; y2: number; key: string }>
 >([]);

 // Recompute line positions when matches change
 React.useEffect(() => {
 if (matchedPairMap.size === 0) {
 setLineCoords([]);
 return;
 }

 const container = gridContainerRef.current;
 if (!container) return;

 const containerRect = container.getBoundingClientRect();
 const lines: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = [];

 matchedPairMap.forEach((rightShuffledIdx, leftIdx) => {
 const leftEl = leftItemRefs.current.get(leftIdx);
 const rightEl = rightItemRefs.current.get(rightShuffledIdx);
 if (!leftEl || !rightEl) return;

 const leftRect = leftEl.getBoundingClientRect();
 const rightRect = rightEl.getBoundingClientRect();

 lines.push({
 x1: leftRect.right - containerRect.left,
 y1: leftRect.top + leftRect.height / 2 - containerRect.top,
 x2: rightRect.left - containerRect.left,
 y2: rightRect.top + rightRect.height / 2 - containerRect.top,
 key: `match-line-${block.id || 'match'}-${leftIdx}`,
 });
 });

 setLineCoords(lines);
 }, [matchedPairMap, block.id]);

 // ── Empty state ─────────────────────────────────────────────────
 if (validPairs.length === 0) {
 return (
 <div className="text-center p-6 rounded-xl"
 style={{
 background: tokens.subtleBg(0.04),
 border: '2px dashed ' + tokens.subtleBorder(0.2),
 }}>
 <Shuffle size={24} className="inline mb-2" style={{ color: edu.mutedText(0.4) }} />
 <div className="font-bold" style={{ ...edu.caption(), color: edu.mutedText(0.6) }}>
 Pasangkan Game
 </div>
 <div style={{ ...edu.micro(), color: edu.mutedText(0.4) }}>
 Tambahkan pasangan untuk memulai game
 </div>
 </div>
 );
 }

 // ── Derived values ──────────────────────────────────────────────
 const matchedCount = matchedLeft.size;
 const totalPairs = validPairs.length;

 // ══ COMPLETION SCREEN ═══════════════════════════════════════════
 if (phase === 'done') {
 const score = Math.max(
 Math.ceil(totalPairs * 0.5),
 totalPairs - wrongAttempts,
 );
 const pct = Math.round((score / totalPairs) * 100);

 return (
 <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0} gradientBorder>
 <div className="text-center p-5 rounded-2xl"
 style={{
 background: edu.pageBg(),
 border: '2px solid ' + edu.accentAlpha(0.3),
 boxShadow: edu.shadow('elevated'),
 }}>
 <ReadingProgressIndicator progress={1} tokens={tokens} accent="y" height={3} position="top" />
 {/* Animated icon */}
 <div className="text-3xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>
 {pct >= 80
 ? <span className="material-symbols-outlined inline" style={ { fontSize: '28px' } }>emoji_events</span>
 : pct >= 50
 ? <span className="material-symbols-outlined inline" style={ { fontSize: '28px' } }>star</span>
 : <Dumbbell size={28} className="inline" style={{ color: edu.accent() }} />}
 </div>

 {/* Tiered message */}
 <div className="font-black text-lg mb-1"
 style={{ fontFamily: tokens.fontFamily('display'), color: edu.accent() }}>
 {pct >= 80 ? 'Luar Biasa!' : pct >= 50 ? 'Bagus!' : 'Terus Berlatih!'}
 </div>

 {/* Score display */}
 <div className="mb-3" style={{ ...edu.body(), color: edu.mutedText(0.8) }}>
 Skor kamu: {score}/{totalPairs} ({pct}%)
 </div>

 {/* Stats cards */}
 <div className="flex justify-center gap-3 mb-4">
 <PremiumBadge tokens={tokens} accent="g" variant="glass">
 Cocok {matchedCount}
 </PremiumBadge>
 <PremiumBadge tokens={tokens} accent="r" variant="glass">
 Salah {wrongAttempts}
 </PremiumBadge>
 </div>

 {/* Replay button */}
 {interactive && (
 <MicroInteraction tokens={tokens} accent="y" effect="squish">
 <button
 className={"px-5 py-2 rounded-xl font-extrabold" + tokens.iosButtonTw(interactive)}
 onClick={() => {
 setSelectedLeft(null);
 setMatchedLeft(new Set());
 setMatchedRight(new Set());
 setWrongAttempts(0);
 setWrongRightIdx(null);
 setPhase('play');
 setShuffledRight(shuffleRightItems(validPairs));
 hasReportedRef.current = false;
 playSound('click');
 }}
 style={{
 ...edu.caption(),
 background: 'linear-gradient(135deg, ' + edu.accent() + ', ' + tokens.color('o') + ')',
 color: tokens.color('bg'),
 boxShadow: '0 4px 16px ' + edu.accentAlpha(0.35),
 }}
 >
 <span className="material-symbols-outlined inline" style={ { fontSize: '14px' } }>refresh</span> Ulangi
 </button>
 </MicroInteraction>
 )}
 </div>
 </PremiumBlockWrapper>
 );
 }

 // ── Click handlers ──────────────────────────────────────────────

 const handleLeftClick = (leftIdx: number) => {
 if (!interactive || matchedLeft.has(leftIdx)) return;
 setSelectedLeft(prev => (prev === leftIdx ? null : leftIdx));
 playSound('tap');
 };

 const handleRightClick = (rightItem: ShuffledRight, shuffledIdx: number) => {
 if (!interactive || selectedLeft === null || matchedRight.has(shuffledIdx)) return;

 // Check if right item's original index matches selected left index
 if (rightItem.idx === selectedLeft) {
 // ✅ Correct match
 setMatchedLeft(prev => new Set(prev).add(selectedLeft));
 setMatchedRight(prev => new Set(prev).add(shuffledIdx));
 setSelectedLeft(null);
 playSound('correct');
 a11y.announceCorrect();

 // Check if all pairs matched
 const newMatchedCount = matchedLeft.size + 1;
 if (newMatchedCount >= totalPairs) {
 // Small delay so player sees the last match before completion screen
 setTimeout(() => setPhase('done'), 600);
 }
 } else {
 // ❌ Wrong match
 setWrongAttempts(prev => prev + 1);
 setWrongRightIdx(shuffledIdx);
 playSound('incorrect');
 a11y.announceIncorrect();

 // Clear wrong highlight after brief flash
 if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
 wrongTimerRef.current = setTimeout(() => {
 setWrongRightIdx(null);
 }, 800);
 }
 };

 // ══ PLAY SCREEN ══════════════════════════════════════════════════
 return (
 <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0}>
 <div className="space-y-3 game-block" {...a11y.rootAria} data-interactive>
 <ReadingProgressIndicator progress={totalPairs > 0 ? matchedCount / totalPairs : 0} tokens={tokens} accent="y" height={3} position="top" />
 {/* Hidden instruction for screen readers */}
 <div id={a11y.instructionId} className="sr-only">Pilih item di kolom kiri, lalu cocokkan dengan jawaban di kolom kanan</div>
 <div className="flex items-center justify-between min-w-0">
 <div className="flex items-center gap-2 min-w-0">
 <div className="font-extrabold" style={{ ...edu.caption(), color: edu.accent() }}>
 <Shuffle size={14} className="inline" />{' '}
 <InlineTextEditor
 {...titleEditor}
 className="font-extrabold"
 style={{ color: edu.accent(), ...edu.micro() }}
 placeholder="Ketik judul game..."
 />
 </div>
 </div>
 <PremiumBadge tokens={tokens} accent="y" variant="glass">
 {matchedCount}/{totalPairs}
 </PremiumBadge>
 </div>

 {/* ── Progress bar ───────────────────────────────────────────── */}
 <div
 className="h-1.5 rounded-full overflow-hidden relative"
 {...a11y.progressAria('Kemajuan Pasangkan', matchedCount, totalPairs)}
 style={{ background: tokens.subtleBg(0.08) }}
 >
 <div
 className="h-full rounded-full"
 style={{
 width: `${totalPairs > 0 ? (matchedCount / totalPairs) * 100 : 0}%`,
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

 {/* ── Two-column matching grid ───────────────────────────────── */}
 <div
 className="relative rounded-xl p-4 premium-card-glow"
 style={{
 background: edu.accentAlpha(0.04),
 border: '1px solid ' + edu.accentAlpha(0.15),
 boxShadow: edu.shadow('card'),
 }}
 >
 {/* Column headers */}
 <div className="grid grid-cols-2 gap-3 mb-3">
 <div
 className="text-center font-extrabold uppercase tracking-wider"
 style={{ ...edu.micro(), color: edu.accent() }}
 >
 Soal
 </div>
 <div
 className="text-center font-extrabold uppercase tracking-wider"
 style={{ ...edu.micro(), color: edu.accent() }}
 >
 Jawaban
 </div>
 </div>

 {/* Left and right columns with connecting lines overlay */}
 <div className="relative" ref={gridContainerRef}>
 {/* SVG overlay for connection lines between matched pairs */}
 {lineCoords.length > 0 && (
 <svg
 className="absolute inset-0 pointer-events-none"
 style={{ width: '100%', height: '100%', zIndex: 5, overflow: 'visible' }}
 >
 {lineCoords.map(line => (
 <line
 key={line.key}
 x1={line.x1}
 y1={line.y1}
 x2={line.x2}
 y2={line.y2}
 stroke={tokens.color('g')}
 strokeWidth="2"
 strokeDasharray="6 3"
 opacity="0.5"
 />
 ))}
 </svg>
 )}

 {/* Two-column grid */}
 <div className="grid grid-cols-2 gap-3">
 {/* ── LEFT COLUMN (in order) ────────────────────────────── */}
 <div className="flex flex-col gap-2.5">
 {validPairs.map((pair, i) => {
 const isMatched = matchedLeft.has(i);
 const isSelected = selectedLeft === i;

 // Styling states
 const bg = isMatched
 ? tokens.colorAlpha('g', 0.12)
 : isSelected
 ? edu.accentAlpha(0.15)
 : tokens.subtleBg(0.06);
 const border = isMatched
 ? tokens.color('g')
 : isSelected
 ? edu.accent()
 : tokens.subtleBorder(0.12);
 const boxShadow = isMatched
 ? '0 0 12px ' + tokens.colorAlpha('g', 0.15)
 : isSelected
 ? '0 0 16px ' + edu.accentAlpha(0.3)
 : edu.shadow('card');

 return (
 <button
 key={`match-left-${block.id || 'match'}-${i}`}
 ref={el => { if (el) leftItemRefs.current.set(i, el); }}
 onClick={() => handleLeftClick(i)}
 disabled={isMatched || !interactive}
 aria-label={`Soal: ${pair.left}${isMatched ? ', sudah cocok' : isSelected ? ', dipilih' : ''}`}
 className={`p-2.5 rounded-xl font-bold text-center ${tokens.iosQuizOptionTw(!isMatched && interactive)} min-w-0 ${isCompact ? 'canvas-truncate-1' : ''}`}
 style={{
 ...edu.caption(),
 background: bg,
 border: '2px solid ' + border,
 boxShadow,
 color: isMatched ? tokens.color('g') : edu.textColor(),
 textDecoration: isMatched ? 'line-through' : 'none',
 opacity: isMatched ? 0.7 : 1,
 cursor: isMatched ? 'default' : interactive ? 'pointer' : 'default',
 wordBreak: 'break-word',
 overflowWrap: 'break-word',
 animation: isSelected ? 'pulse 1.5s ease-in-out infinite' : 'none',
 // Green right border indicator for matched left items
 borderRight: isMatched ? '3px solid ' + tokens.color('g') : undefined,
 }}
 >
 {pair.left}
 </button>
 );
 })}
 </div>

 {/* ── RIGHT COLUMN (shuffled) ───────────────────────────── */}
 <div className="flex flex-col gap-2.5">
 {shuffledRight.map((r, si) => {
 const isMatched = matchedRight.has(si);
 const isWrong = wrongRightIdx === si;

 // Styling states
 const bg = isMatched
 ? tokens.colorAlpha('g', 0.12)
 : isWrong
 ? tokens.colorAlpha('r', 0.18)
 : tokens.subtleBg(0.06);
 const border = isMatched
 ? tokens.color('g')
 : isWrong
 ? tokens.color('r')
 : tokens.subtleBorder(0.12);
 const boxShadow = isMatched
 ? '0 0 12px ' + tokens.colorAlpha('g', 0.15)
 : isWrong
 ? '0 0 16px ' + tokens.colorAlpha('r', 0.3)
 : edu.shadow('card');

 return (
 <button
 key={`match-right-${block.id || 'match'}-${r.idx}`}
 ref={el => { if (el) rightItemRefs.current.set(si, el); }}
 onClick={() => handleRightClick(r, si)}
 disabled={isMatched || selectedLeft === null || !interactive}
 aria-label={`Jawaban: ${r.text}${isMatched ? ', sudah cocok' : ''}`}
 className={`p-2.5 rounded-xl font-bold text-center ${tokens.iosQuizOptionTw(!isMatched && interactive)} min-w-0 ${isCompact ? 'canvas-truncate-1' : ''}`}
 style={{
 ...edu.caption(),
 background: bg,
 border: '2px solid ' + border,
 boxShadow,
 color: isMatched
 ? tokens.color('g')
 : isWrong
 ? tokens.color('r')
 : selectedLeft === null
 ? edu.mutedText(0.5)
 : edu.textColor(),
 textDecoration: isMatched ? 'line-through' : 'none',
 opacity: isMatched ? 0.7 : selectedLeft === null ? 0.6 : 1,
 cursor: isMatched || selectedLeft === null
 ? 'default'
 : interactive
 ? 'pointer'
 : 'default',
 wordBreak: 'break-word',
 overflowWrap: 'break-word',
 animation: isWrong ? 'shake 0.4s ease-in-out' : 'none',
 transition: tokens.iosTransitionStyle('background-color, border-color, color, transform, box-shadow', 'fast').transition,
 // Green left border indicator for matched right items
 borderLeft: isMatched ? '3px solid ' + tokens.color('g') : undefined,
 }}
 >
 {r.text}
 </button>
 );
 })}
 </div>
 </div>
 </div>

 {/* ── Instruction hint ─────────────────────────────────────── */}
 {selectedLeft === null && matchedCount < totalPairs && interactive && (
 <div
 className="mt-3 text-center"
 style={{ ...edu.micro(), color: edu.mutedText(0.5) }}
 >
 Pilih item di kolom kiri terlebih dahulu
 </div>
 )}
 {selectedLeft !== null && interactive && (
 <div
 className="mt-3 text-center"
 style={{ ...edu.micro(), color: edu.accent() }}
 >
 Sekarang pilih jawaban yang cocok di kolom kanan
 </div>
 )}
 </div>
 </div>
 </PremiumBlockWrapper>
 );
});