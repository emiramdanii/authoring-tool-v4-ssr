'use client';

// ═══════════════════════════════════════════════════════════════════
// DRAG & DROP GAME RENDERER — Seret & Letakkan Game for PPKn
// ═══════════════════════════════════════════════════════════════════
// Players select items from a pool and place them onto the correct
// target zones. Click-to-select interaction (no native drag).
//
// Game logic (ported from canva DragDropGame):
// 1. Items shown in a pool at the top, targets as drop zones below
// 2. Click an item to select it (highlight), then click a target
// 3. If item.target matches target.id → placed successfully
// 4. If wrong → wrongAttempts increments, item deselects
// 5. Placed items can be clicked on a target to remove them back
// 6. Efficiency-based scoring with 50% floor:
// score = max(ceil(items*0.5), items - wrongAttempts)
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import { Trophy, Star, Dumbbell, RotateCcw, GripVertical } from 'lucide-react';
import type { DragDropGameBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti, fireConfettiCelebration } from '@/lib/confetti';
import { useGameA11y } from '@/lib/use-game-a11y';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';

// ── Placed item entry (stored per target) ─────────────────────

interface PlacedItem {
 /** Original index in block.items */
 idx: number;
 /** Display text */
 text: string;
}

// ── Props interface ───────────────────────────────────────────

interface DragDropGameRendererProps {
 block: DragDropGameBlock;
 tokens: TokenResolver;
 interactive: boolean;
 isCompact: boolean;
 isEditing?: boolean;
 pageIndex?: number;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export const DragDropGameRenderer = React.memo(function DragDropGameRenderer({
 block,
 tokens,
 interactive,
 isCompact,
 isEditing,
 pageIndex,
}: DragDropGameRendererProps) {
 const edu = tokens.edu('drag-drop-game', isCompact);
 // ── Game state ──────────────────────────────────────────────────
 const [placed, setPlaced] = React.useState<Record<string, PlacedItem[]>>({});
 const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null);
 const [wrongAttempts, setWrongAttempts] = React.useState(0);
 const [phase, setPhase] = React.useState<'play' | 'done'>('play');

 // ── Derived data ────────────────────────────────────────────────
 const validItems = React.useMemo(
 () => (block.items || []).filter(it => it.text.trim() && it.target.trim()),
 [block.items],
 );
 const targets = block.targets || [];

 // Data-key-based state: reset when items or targets content changes
 const dataKey = React.useMemo(
 () => validItems.map(it => `${it.text}|${it.target}`).join(';;')
 + '||' + targets.map(t => `${t.id}|${t.label}|${t.color ?? ''}`).join(';;'),
 [validItems, targets],
 );

 // Reset all game state when block data changes
 React.useEffect(() => {
 setPlaced({});
 setSelectedIdx(null);
 setWrongAttempts(0);
 setPhase('play');
 }, [dataKey]);

 // ── Replay watcher: reset all state when replayGeneration bumps ──
 const replayGeneration = useInteractiveStore(s => s.replayGeneration);
 React.useEffect(() => {
 setPlaced({});
 setSelectedIdx(null);
 setWrongAttempts(0);
 setPhase('play');
 }, [replayGeneration]);

 // ── Interactive store: score reporting ───────────────────────────
 const reportScore = useInteractiveStore(s => s.reportScore);

 // ── Compute total placed count ──────────────────────────────────
 const totalPlaced = React.useMemo(
 () => Object.values(placed).reduce((sum, arr) => sum + arr.length, 0),
 [placed],
 );
 const totalItems = validItems.length;

 // ── Accessibility hook ──────────────────────────────────────────
 const a11y = useGameA11y({
 gameType: 'Seret & Letakkan',
 blockId: block.id,
 score: totalPlaced,
 maxScore: totalItems,
 interactive: interactive ?? false,
 });

 // ── Inline editing hooks (before early returns) ─────────────────
 const titleEditor = useInlineEditor({
 blockId: block.id,
 fieldKey: 'title',
 value: block.title ?? '',
 tag: 'span',
 });

 const isCompleted = totalItems > 0 && totalPlaced >= totalItems;

 // Auto-transition to 'done' when all items placed
 React.useEffect(() => {
 if (isCompleted && phase === 'play') {
 // Brief delay so player sees the last placement before completion screen
 const timer = setTimeout(() => setPhase('done'), 600);
 return () => clearTimeout(timer);
 }
 return undefined;
 }, [isCompleted, phase]);

 // ── Score guard — only fire once per completion cycle ────────────
 const hasReportedRef = React.useRef(false);
 React.useEffect(() => {
 if (phase === 'done' && interactive && block.id && !hasReportedRef.current) {
 hasReportedRef.current = true;
 const score = Math.max(
 Math.ceil(validItems.length * 0.5),
 validItems.length - wrongAttempts,
 );
 reportScore({
 elementId: block.id,
 pageIndex: pageIndex ?? 0,
 score,
 maxScore: validItems.length,
 completed: true,
 });
 // Tiered celebration
 const pct = Math.round((score / validItems.length) * 100);
 if (pct >= 80) {
 playSound('complete');
 fireConfettiCelebration();
 } else if (pct >= 50) {
 playSound('complete');
 fireConfetti({ count: 30 });
 } else {
 playSound('ding');
 }
 a11y.announceComplete(score, validItems.length);
 }
 // Reset reported flag when replaying
 if (phase !== 'done') hasReportedRef.current = false;
 }, [phase, interactive, block.id, wrongAttempts, validItems.length, reportScore, pageIndex]);

 // ── Build set of placed item indices (for filtering pool) ───────
 const placedIdxSet = React.useMemo(() => {
 const set = new Set<number>();
 Object.values(placed).forEach(arr => {
 arr.forEach(it => set.add(it.idx));
 });
 return set;
 }, [placed]);

 // ── Empty state ─────────────────────────────────────────────────
 if (validItems.length === 0 || targets.length === 0) {
 return (
 <div className="text-center p-6 rounded-xl"
 style={{
 background: tokens.subtleBg(0.04),
 border: '2px dashed ' + tokens.subtleBorder(0.2),
 }}>
 <span className="material-symbols-outlined inline mb-2" style={ { fontSize: '24px' } }>drag_indicator</span>
 <div className="font-bold" style={{ ...edu.caption(), color: edu.mutedText(0.6) }}>
 Seret & Letakkan Game
 </div>
 <div style={{ ...edu.micro(), color: edu.mutedText(0.4) }}>
 Tambahkan item dan target untuk memulai game
 </div>
 </div>
 );
 }

 // ══ COMPLETION SCREEN ═══════════════════════════════════════════
 if (phase === 'done') {
 const score = Math.max(
 Math.ceil(totalItems * 0.5),
 totalItems - wrongAttempts,
 );
 const pct = Math.round((score / totalItems) * 100);

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
 Skor kamu: {score}/{totalItems} ({pct}%)
 </div>

 {/* Stats cards */}
 <div className="flex justify-center gap-3 mb-4">
 <PremiumBadge tokens={tokens} accent="g" variant="glass">Benar: {totalItems}</PremiumBadge>
 <PremiumBadge tokens={tokens} accent="r" variant="glass">Salah: {wrongAttempts}</PremiumBadge>
 </div>

 {/* Replay button */}
 {interactive && (
 <MicroInteraction tokens={tokens} accent="y" effect="squish">
 <button
 className={"px-5 py-2 rounded-xl font-extrabold" + tokens.iosButtonTw(interactive)}
 onClick={() => {
 setPlaced({});
 setSelectedIdx(null);
 setWrongAttempts(0);
 setPhase('play');
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

 /** Click an item in the pool to select it (or deselect if already selected) */
 const handleItemClick = (origIdx: number) => {
 if (!interactive) return;
 setSelectedIdx(prev => (prev === origIdx ? null : origIdx));
 playSound('click');
 };

 /** Click a target zone to place the selected item */
 const handleTargetClick = (targetId: string) => {
 if (!interactive || selectedIdx === null) return;

 const item = validItems[selectedIdx];
 if (!item) return;

 if (item.target === targetId) {
 // ✅ Correct placement — add item to target's placed list
 setPlaced(prev => ({
 ...prev,
 [targetId]: [...(prev[targetId] || []), { idx: selectedIdx, text: item.text }],
 }));
 setSelectedIdx(null);
 playSound('correct');
 a11y.announceCorrect();
 } else {
 // ❌ Wrong target — increment wrong attempts and deselect
 setWrongAttempts(prev => prev + 1);
 setSelectedIdx(null);
 playSound('incorrect');
 a11y.announceIncorrect();
 }
 };

 /** Click a placed item on a target to remove it back to pool */
 const handlePlacedItemClick = (targetId: string, itemIdx: number) => {
 if (!interactive) return;

 setPlaced(prev => {
 const items = prev[targetId] || [];
 return {
 ...prev,
 [targetId]: items.filter(it => it.idx !== itemIdx),
 };
 });
 playSound('click');
 };

 // ══ PLAY SCREEN ══════════════════════════════════════════════════
 return (
 <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0}>
 <div className="space-y-3 game-block" {...a11y.rootAria} data-interactive>
 {/* Hidden instruction for screen readers */}
 <div id={a11y.instructionId} className="sr-only">Pilih item dari kolam, lalu klik target yang tepat untuk menempatkannya</div>
 <ReadingProgressIndicator progress={totalItems > 0 ? totalPlaced / totalItems : 0} tokens={tokens} accent="y" height={3} position="top" />
 <div className="flex items-center justify-between min-w-0">
 <div className="flex items-center gap-2 min-w-0">
 <div className="font-extrabold" style={{ ...edu.caption(), color: edu.accent() }}>
 <span className="material-symbols-outlined inline" style={ { fontSize: '14px' } }>drag_indicator</span>{' '}
 <InlineTextEditor
 {...titleEditor}
 className="font-extrabold"
 style={{ color: edu.accent(), ...edu.micro() }}
 placeholder="Ketik judul game..."
 />
 </div>
 </div>
 <PremiumBadge tokens={tokens} accent="y" variant="glass">
 {totalPlaced}/{totalItems}
 </PremiumBadge>
 </div>

 {/* ── Progress bar ───────────────────────────────────────────── */}
 <div
 className="h-1.5 rounded-full overflow-hidden"
 {...a11y.progressAria('Kemajuan Seret & Letakkan', totalPlaced, totalItems)}
 style={{ background: tokens.subtleBg(0.08) }}
 >
 <div
 className="h-full rounded-full"
 style={{
 width: `${totalItems > 0 ? (totalPlaced / totalItems) * 100 : 0}%`,
 ...tokens.iosTransitionStyle('width', 'slow'),
 background: 'linear-gradient(90deg, ' + edu.accent() + ', ' + tokens.color('g') + ')',
 backgroundSize: '200% 100%',
 animation: 'shimmer 2s linear infinite',
 boxShadow: '0 0 8px ' + edu.accentAlpha(0.3),
 }}
 />
 </div>

 {/* ── Item Pool ──────────────────────────────────────────────── */}
 <div
 className="flex flex-wrap gap-2.5 min-h-[50px] p-4 border-2 border-dashed rounded-xl premium-card-glow"
 style={{
 borderColor: edu.accentAlpha(0.25),
 background: edu.accentAlpha(0.04),
 }}
 >
 {/* Pool header */}
 <div className="w-full font-extrabold uppercase tracking-wider mb-2"
 style={{ ...edu.micro(), color: edu.accent() }}>
 <span className="material-symbols-outlined inline" style={ { fontSize: '14px' } }>drag_indicator</span> Pilih Item ({totalPlaced}/{totalItems})
 </div>

 {/* Pool items — only show items not yet placed */}
 {validItems.map((item, origIdx) => {
 // Skip items that are already placed on a target
 if (placedIdxSet.has(origIdx)) return null;

 const isSelected = selectedIdx === origIdx;

 // Styling for selected vs unselected items
 const bg = isSelected
 ? edu.accentAlpha(0.2)
 : tokens.subtleBg(0.07);
 const border = isSelected
 ? edu.accent()
 : tokens.subtleBorder(0.15);
 const boxShadow = isSelected
 ? '0 0 16px ' + edu.accentAlpha(0.35)
 : edu.shadow('card');

 return (
 <button
 key={`dd-item-${block.id || 'dd'}-${origIdx}`}
 onClick={() => handleItemClick(origIdx)}
 aria-pressed={selectedIdx === origIdx}
 aria-label={`Item: ${item.text}${selectedIdx === origIdx ? ', dipilih' : ''}`}
 className={`px-3.5 py-2 rounded-full font-extrabold ${tokens.iosGameButtonTw(interactive)} min-w-0 ${isCompact ? 'canvas-truncate-1' : ''}`}
 style={{
 background: bg,
 border: '2px solid ' + border,
 boxShadow,
 ...edu.caption(),
 animation: isSelected ? 'pulse 1.5s ease-in-out infinite' : 'none',
 wordBreak: 'break-word',
 overflowWrap: 'break-word',
 // Ring highlight for selected item
 outline: isSelected ? '3px solid ' + edu.accentAlpha(0.5) : 'none',
 outlineOffset: '2px',
 }}
 >
 {item.text}
 </button>
 );
 })}

 {/* All items placed — pool empty message */}
 {validItems.every((_, idx) => placedIdxSet.has(idx)) && (
 <div className="w-full text-center py-1" style={{ ...edu.micro(), color: edu.mutedText(0.5) }}>
 Semua item telah ditempatkan!
 </div>
 )}
 </div>

 {/* ── Target Zones ───────────────────────────────────────────── */}
 <div className="space-y-2.5">
 {targets.map((target) => {
 const tid = target.id;
 const targetItems = placed[tid] || [];
 const hasSelection = selectedIdx !== null;
 // Use the target's color property, fallback to 'y' (yellow)
 const targetColor = target.color || 'y';

 // Styling varies by state: active (item selected) vs passive
 const bg = hasSelection
 ? tokens.colorAlpha(targetColor, 0.08)
 : tokens.colorAlpha(targetColor, 0.03);
 const borderStyle = hasSelection ? 'solid' : 'dashed';
 const borderColor = hasSelection
 ? tokens.colorAlpha(targetColor, 0.5)
 : tokens.colorAlpha(targetColor, 0.25);
 const boxShadow = hasSelection
 ? '0 0 12px ' + tokens.colorAlpha(targetColor, 0.12)
 : edu.shadow('card');

 return (
 <div
 key={`dd-target-${block.id || 'dd'}-${tid}`}
 onClick={() => handleTargetClick(tid)}
 role="button"
 tabIndex={0}
 aria-label={`Target ${tid + 1}`}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTargetClick(tid); } }}
 className="rounded-xl p-3.5 min-h-[60px] border-2 transition-[background-color,border-color,box-shadow] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
 style={{
 borderStyle,
 borderColor,
 background: bg,
 boxShadow,
 }}
 >
 {/* Target label header */}
 <div className="flex items-center gap-2 mb-2 min-w-0">
 <div
 className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
 style={{ background: tokens.colorAlpha(targetColor, 0.2) }}
 >
 <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>drag_indicator</span>
 </div>
 <div
 className="font-extrabold uppercase tracking-wider min-w-0"
 style={{ ...edu.caption(), color: tokens.color(targetColor), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
 >
 {target.label}
 </div>
 </div>

 {/* Placed items inside this target */}
 {targetItems.length > 0 ? (
 <div className="flex flex-wrap gap-1.5">
 {targetItems.map((it) => (
 <button
 key={`dd-placed-${block.id || 'dd'}-${it.idx}`}
 onClick={(e) => {
 // Stop propagation so target click doesn't fire
 e.stopPropagation();
 handlePlacedItemClick(tid, it.idx);
 }}
 className={"px-2.5 py-1 rounded-full font-bold" + tokens.iosGameButtonTw(interactive) +" min-w-0"}
 style={{
 ...edu.micro(),
 background: tokens.colorAlpha(targetColor, 0.2),
 color: tokens.color(targetColor),
 border: '1px solid ' + tokens.colorAlpha(targetColor, 0.3),
 wordBreak: 'break-word',
 overflowWrap: 'break-word',
 maxWidth: '100%',
 // Hint that items can be removed by clicking
 cursor: interactive ? 'pointer' : 'default',
 textDecoration: 'none',
 }}
 title="Klik untuk menghapus dari target"
 aria-label={`Hapus ${it.text} dari target`}
 >
 {it.text}
 </button>
 ))}
 </div>
 ) : (
 /* Empty drop zone hint */
 <div style={{ ...edu.micro(), color: edu.mutedText(0.4) }}>
 {hasSelection
 ? 'Klik di sini untuk menempatkan item'
 : 'Area target — tempatkan item di sini'}
 </div>
 )}
 </div>
 );
 })}
 </div>

 {/* ── Instruction hint ───────────────────────────────────────── */}
 {selectedIdx === null && totalPlaced < totalItems && interactive && (
 <div className="text-center" style={{ ...edu.micro(), color: edu.mutedText(0.5) }}>
 Pilih item di kolam terlebih dahulu
 </div>
 )}
 {selectedIdx !== null && interactive && (
 <div className="text-center" style={{ ...edu.micro(), color: edu.accent() }}>
 Sekarang klik target yang tepat untuk menempatkan item
 </div>
 )}

 {/* ── Print Answer Key (teacher only) ── */}
 <div className="print-only print-answer-key">
 <h3>Kunci Jawaban: Seret & Letakkan</h3>
 <ul>
 {validItems.map((item, i) => {
 const target = targets.find(t => t.id === item.target);
 return (
 <li key={`dd-ans-${block.id || 'dd'}-${i}`}><strong>{item.text}</strong> → {target?.label || item.target}</li>
 );
 })}
 </ul>
 </div>
 </div>
 </PremiumBlockWrapper>
 );
});