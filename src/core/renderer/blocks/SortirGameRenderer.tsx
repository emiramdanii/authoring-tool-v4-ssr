'use client';

import React from 'react';
import { FolderOpen, RotateCcw, Package, AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react';
import type { SortirGameBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti, fireConfettiCelebration } from '@/lib/confetti';
import { announceToScreenReader } from '@/lib/a11y';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';

/** Inner kolom component so hooks are not called in loops */
function SortirKolom({ kolomDef, kolomIndex, blockId, tokens, selected, kolomItems, onKolomClick, isCompact }: {
 kolomDef: SortirGameBlock['kolom'][number];
 kolomIndex: number;
 blockId: string;
 tokens: TokenResolver;
 selected: string | null;
 kolomItems: string[];
 onKolomClick: () => void;
 isCompact?: boolean;
}) {
 const edu = tokens.edu('sortir-game', isCompact);
 const labelEditor = useInlineEditor({
 blockId,
 fieldKey: `kolom.${kolomIndex}.label`,
 value: kolomDef.label ?? '',
 tag: 'span',
 });

 return (
 <div onClick={onKolomClick}
 role="button"
 tabIndex={0}
 aria-label={kolomDef.label || 'Kolom'}
 aria-pressed={selected === kolomDef.id}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onKolomClick?.(); } }}
 className="rounded-xl p-3.5 min-h-[70px] border-2 transition-[background-color,border-color,box-shadow] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
 style={{
 borderColor: selected ? tokens.colorAlpha(kolomDef.color, 0.5) : tokens.colorAlpha(kolomDef.color, 0.2),
 background: selected ? tokens.colorAlpha(kolomDef.color, 0.08) : tokens.colorAlpha(kolomDef.color, 0.04),
 boxShadow: selected ? '0 0 16px ' + tokens.colorAlpha(kolomDef.color, 0.15) : edu.shadow('card'),
 }}>
 <div className="flex items-center gap-2 mb-2">
 <div className="w-7 h-7 rounded-full flex items-center justify-center"
 style={{ background: tokens.colorAlpha(kolomDef.color, 0.2) }}>
 <span className="material-symbols-outlined inline" style={ { fontSize: '12px' } }>folder_open</span>
 </div>
 <div className="font-extrabold uppercase tracking-wider min-w-0"
 style={{ ...edu.caption(), color: tokens.color(kolomDef.color), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
 <InlineTextEditor
 {...labelEditor}
 className="font-extrabold uppercase tracking-wider"
 style={{ color: tokens.color(kolomDef.color), ...edu.micro() }}
 placeholder="Ketik label kolom..."
 />
 </div>
 </div>
 <div className="flex flex-wrap gap-1.5">
 {kolomItems.map((text, i) => (
 <span key={`sortir-item-${blockId}-${kolomIndex}-${i}`} className={`px-2.5 py-1 rounded-full font-bold min-w-0 ${isCompact ? 'canvas-truncate-1' : ''}`}
 style={{
 ...edu.micro(),
 background: tokens.colorAlpha(kolomDef.color, 0.2),
 color: tokens.color(kolomDef.color),
 border: '1px solid ' + tokens.colorAlpha(kolomDef.color, 0.3),
 wordBreak: 'break-word',
 overflowWrap: 'break-word',
 maxWidth: '100%',
 }}>
 {text}
 </span>
 ))}
 </div>
 </div>
 );
}

export const SortirGameRenderer = React.memo(function SortirGameRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex }: {
 block: SortirGameBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number;
}) {
 const edu = tokens.edu('sortir-game', isCompact);
 const pool = block.pool || [];
 const kolom = block.kolom || [];

 const [poolState, setPoolState] = React.useState(pool.map(p => ({ ...p, placed: false })));
 const [kolomItems, setKolomItems] = React.useState<Record<string, string[]>>(() => {
 const init: Record<string, string[]> = {};
 kolom.forEach(k => { init[k.id] = []; });
 return init;
 });
 const [selected, setSelected] = React.useState<string | null>(null);
 const [wrongFeedback, setWrongFeedback] = React.useState<{ itemId: string; kolomId: string; message: string } | null>(null);
 const [attempts, setAttempts] = React.useState<Record<string, number>>({});

 // ── Replay watcher: reset all state when replayGeneration bumps ──
 const replayGeneration = useInteractiveStore(s => s.replayGeneration);
 React.useEffect(() => {
 setPoolState(pool.map(p => ({ ...p, placed: false })));
 const init: Record<string, string[]> = {};
 kolom.forEach(k => { init[k.id] = []; });
 setKolomItems(init);
 setSelected(null);
 setWrongFeedback(null);
 setAttempts({});
 }, [replayGeneration]);

 // ── Interactive store: score reporting ──────────────────────
 const reportScore = useInteractiveStore(s => s.reportScore);

 // ── Inline editing hooks ─────────────────────────────────────
 const titleEditor = useInlineEditor({
 blockId: block.id,
 fieldKey: 'title',
 value: block.title ?? '',
 tag: 'span',
 });

 const totalPlaced = React.useMemo(
 () => poolState.filter(p => p.placed).length,
 [poolState],
 );
 const unplacedPoolItems = React.useMemo(
 () => poolState.filter(p => !p.placed),
 [poolState],
 );
 const totalItems = pool.length;
 const isCompleted = totalItems > 0 && totalPlaced >= totalItems;

 // Report score when completed (guard: only fire once per completion cycle)
 const hasReportedRef = React.useRef(false);
 React.useEffect(() => {
 if (isCompleted && interactive && block.id && !hasReportedRef.current) {
 hasReportedRef.current = true;
 const totalAttempts = Object.values(attempts).reduce((s, a) => s + a, 0);
 const accuracy = totalAttempts > 0 ? Math.round((totalItems / totalAttempts) * 100) : 100;
 reportScore({
 elementId: block.id,
 pageIndex: pageIndex ?? 0,
 score: accuracy,
 maxScore: 100,
 completed: true,
 });
 const perfectScore = totalAttempts <= totalItems;
 if (perfectScore) {
 playSound('complete');
 fireConfettiCelebration();
 } else {
 playSound('complete');
 fireConfetti({ count: 50 });
 }
 announceToScreenReader(`Game selesai! Skor kamu: ${accuracy} dari ${totalItems}`, 'assertive');
 }
 if (!isCompleted) hasReportedRef.current = false;
 }, [isCompleted, interactive, block.id, attempts, totalItems, reportScore, pageIndex]);

 // Auto-dismiss wrong feedback after 2.5 seconds
 React.useEffect(() => {
 if (wrongFeedback) {
 const timer = setTimeout(() => setWrongFeedback(null), 2500);
 return () => clearTimeout(timer);
 }
 return undefined;
 }, [wrongFeedback]);

 const handlePoolClick = (id: string) => {
 if (!interactive) return;
 setSelected(prev => prev === id ? null : id);
 playSound('tap');
 };

 const handleKolomClick = (kolomId: string) => {
 if (!interactive || !selected) return;
 const item = poolState.find(p => p.id === selected);
 if (!item) return;

 const isCorrect = item.category === kolomId;
 if (isCorrect) {
 setPoolState(prev => prev.map(p => p.id === selected ? { ...p, placed: true } : p));
 setKolomItems(prev => ({ ...prev, [kolomId]: [...(prev[kolomId] || []), item.text] }));
 playSound('correct');
 announceToScreenReader('Item benar!', 'assertive');
 } else {
 // ── Educational feedback on wrong answer ────────────────
 const correctKolom = kolom.find(k => k.id === item.category);
 const wrongKolom = kolom.find(k => k.id === kolomId);
 const correctLabel = correctKolom?.label ?? 'kategori yang benar';
 const wrongLabel = wrongKolom?.label ?? kolomId;
 setWrongFeedback({
 itemId: item.id,
 kolomId,
 message: `"${item.text}" bukan termasuk ${wrongLabel}. Coba pindahkan ke kolom yang tepat!`,
 });
 // Track attempts
 setAttempts(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
 playSound('incorrect');
 announceToScreenReader('Kolom salah', 'assertive');
 }
 setSelected(null);
 };

 // ══ COMPLETION SCREEN ═══════════════════════════════════════
 if (isCompleted) {
 const totalAttempts = Object.values(attempts).reduce((s, a) => s + a, 0);
 const perfectScore = totalAttempts <= totalItems;

 return (
 <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0} gradientBorder>
 <div className="text-center p-5 rounded-2xl"
 style={{
 background: edu.pageBg(),
 border: '2px solid ' + edu.accentAlpha(0.3),
 boxShadow: edu.shadow('elevated'),
 }}>
 <ReadingProgressIndicator progress={1} tokens={tokens} accent="y" height={3} position="top" />
 <div className="text-3xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>
 {perfectScore ? '🌟' : '🎮'}
 </div>
 <div className="font-black text-lg mb-1" style={{ fontFamily: tokens.fontFamily('display'), color: edu.accent() }}>
 {perfectScore ? 'Sempurna!' : 'Semua Benar!'}
 </div>
 <div className="mb-2" style={{ ...edu.body(), color: edu.mutedText(0.8) }}>
 {totalItems} item berhasil dikelompokkan dengan tepat!
 </div>
 {totalAttempts > totalItems && (
 <PremiumBadge tokens={tokens} accent="c" variant="glass">
 {totalAttempts} percobaan — akurasi {Math.round((totalItems / totalAttempts) * 100)}%
 </PremiumBadge>
 )}
 {interactive && (
 <MicroInteraction tokens={tokens} accent="y" effect="squish">
 <button className={"mt-3 px-5 py-2 rounded-xl font-extrabold" + tokens.iosButtonTw(interactive)}
 onClick={() => {
 setPoolState(pool.map(p => ({ ...p, placed: false })));
 const init: Record<string, string[]> = {};
 kolom.forEach(k => { init[k.id] = []; });
 setKolomItems(init);
 setSelected(null);
 setWrongFeedback(null);
 setAttempts({});
 hasReportedRef.current = false;
 playSound('click');
 }}
 style={{
 ...edu.caption(),
 background: 'linear-gradient(135deg, ' + edu.accent() + ', ' + tokens.color('o') + ')',
 color: tokens.color('bg'),
 boxShadow: '0 4px 16px ' + edu.accentAlpha(0.35),
 }}>
 <span className="material-symbols-outlined inline" style={ { fontSize: '14px' } }>refresh</span> Ulangi Game
 </button>
 </MicroInteraction>
 )}
 </div>
 </PremiumBlockWrapper>
 );
 }

 return (
 <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0}>
 <div className="game-block" {...(interactive ? { role: 'application' } : {})} aria-label={`Sortir: ${totalPlaced} dari ${totalItems} item ditempatkan`} aria-describedby={`sortir-instructions-${block.id || 'sortir'}`} data-interactive>
 <ReadingProgressIndicator progress={totalItems > 0 ? totalPlaced / totalItems : 0} tokens={tokens} accent="y" height={3} position="top" />
 {/* Hidden instruction for screen readers */}
 <span id={`sortir-instructions-${block.id || 'sortir'}`} className="sr-only">Pilih item dari kolam, lalu klik kolom yang tepat untuk mengelompokkannya</span>
 {/* Screen reader live region for sort feedback */}
 <div className="sr-only" aria-live="polite" role="status">
 {selected ? `Item ${selected} dipilih. Pilih kolom yang tepat.` : ''}
 </div>
 {/* Wrong answer feedback toast */}
 {wrongFeedback && (
 <div className="mb-3 p-3 rounded-xl flex items-start gap-2"
 style={{
 background: tokens.colorAlpha('r', 0.12),
 border: '1px solid ' + tokens.colorAlpha('r', 0.35),
 boxShadow: '0 4px 16px ' + tokens.colorAlpha('r', 0.15),
 animation: 'fadeIn 0.3s ease-out',
 }}>
 <span className="material-symbols-outlined inline flex-shrink-0 mt-0.5" style={ { fontSize: '14px' } }>cancel</span>
 <div className="leading-relaxed" style={{ ...edu.caption(), color: tokens.color('r') }}>
 {wrongFeedback.message}
 </div>
 </div>
 )}

 {/* Pool */}
 <div className="flex flex-wrap gap-2.5 min-h-[50px] p-4 border-2 border-dashed rounded-xl mb-4 premium-card-glow"
 style={{
 borderColor: edu.accentAlpha(0.25),
 background: edu.accentAlpha(0.04),
 }}>
 <div className="w-full font-extrabold uppercase tracking-wider mb-2" style={{ ...edu.micro(), color: edu.accent() }}>
 <span className="material-symbols-outlined inline" style={ { fontSize: '14px' } }>inventory_2</span> Pilih Item <PremiumBadge tokens={tokens} accent="y" variant="glass">{totalPlaced}/{totalItems}</PremiumBadge>
 </div>
 {unplacedPoolItems.map(p => (
 <button key={p.id} onClick={() => handlePoolClick(p.id)}
 aria-selected={selected === p.id}
 className={`px-3.5 py-2 rounded-full font-extrabold ${tokens.iosGameButtonTw(interactive)} min-w-0 ${isCompact ? 'canvas-truncate-1' : ''}`}
 style={{
 background: selected === p.id ? edu.accentAlpha(0.2) : tokens.subtleBg(0.07),
 border: '2px solid ' + (selected === p.id ? edu.accent() : tokens.subtleBorder(0.15)),
 boxShadow: selected === p.id ? '0 0 16px ' + edu.accentAlpha(0.35) : edu.shadow('card'),
 ...edu.caption(),
 animation: selected === p.id ? 'pulse 1.5s ease-in-out infinite' : 'none',
 wordBreak: 'break-word',
 overflowWrap: 'break-word',
 }}>
 {p.text}
 </button>
 ))}
 </div>

 {/* Kolom grid */}
 <div className="grid grid-cols-2 gap-3">
 {kolom.map((k, i) => (
 <SortirKolom
 key={k.id}
 kolomDef={k}
 kolomIndex={i}
 blockId={block.id!}
 tokens={tokens}
 selected={selected}
 kolomItems={kolomItems[k.id] || []}
 onKolomClick={() => handleKolomClick(k.id)}
 isCompact={isCompact}
 />
 ))}
 </div>
 </div>
 </PremiumBlockWrapper>
 );
});
