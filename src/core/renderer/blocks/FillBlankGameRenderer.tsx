'use client';

import React from 'react';
import { Trophy, Star, Dumbbell, RotateCcw, Pencil, CheckCircle2, XCircle } from 'lucide-react';
import type { FillBlankGameBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti, fireConfettiCelebration } from '@/lib/confetti';
import { useGameA11y } from '@/lib/use-game-a11y';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';

/* ═══════════════════════════════════════════════════════════════════════
 FILL-IN-THE-BLANK GAME RENDERER (Isian)
 ──────────────────────────────────────────────────────────────────────
 Ported from canva/games/FillBlankGame.tsx to the SSR renderer system.
 Follows the exact same patterns as KuisRenderer and other interactive
 block renderers (replay watcher, score guard, token-aware styling,
 inline editing, stable React keys).
 ═══════════════════════════════════════════════════════════════════════ */

export const FillBlankGameRenderer = React.memo(function FillBlankGameRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex }: {
 block: FillBlankGameBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number;
}) {

 const edu = tokens.edu('fill-blank-game', isCompact);
 // ── Game state ────────────────────────────────────────────────
 const [currentQ, setCurrentQ] = React.useState(0);
 const [score, setScore] = React.useState(0);
 const [answered, setAnswered] = React.useState(false);
 const [userInput, setUserInput] = React.useState('');
 const [lastCorrect, setLastCorrect] = React.useState<boolean | null>(null);
 const [phase, setPhase] = React.useState<'play' | 'result'>('play');

 // ── Timer cleanup on unmount ──────────────────────────────────
 const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);
 React.useEffect(() => {
 return () => { timersRef.current.forEach(clearTimeout); };
 }, []);

 // ── Filter valid questions (must have text and answer) ────────
 const questions = block.questions || [];
 const validQuestions = React.useMemo(
 () => questions.filter(q => q.text && q.answer),
 [questions]
 );

 // ── Data-change state reset (soalKey) ─────────────────────────
 // When the question data changes structurally, reset all game state
 const soalKey = React.useMemo(
 () => JSON.stringify(validQuestions.map(q => ({ t: q.text, a: q.answer }))),
 [validQuestions]
 );
 React.useEffect(() => {
 timersRef.current.forEach(clearTimeout);
 timersRef.current = [];
 setCurrentQ(0);
 setScore(0);
 setAnswered(false);
 setUserInput('');
 setLastCorrect(null);
 setPhase('play');
 }, [soalKey]);

 // ── Replay watcher (MANDATORY) ────────────────────────────────
 // Reset all state when replayGeneration bumps
 const replayGeneration = useInteractiveStore(s => s.replayGeneration);
 React.useEffect(() => {
 timersRef.current.forEach(clearTimeout);
 timersRef.current = [];
 setCurrentQ(0);
 setScore(0);
 setAnswered(false);
 setUserInput('');
 setLastCorrect(null);
 setPhase('play');
 }, [replayGeneration]);

 // ── Interactive store: score reporting ────────────────────────
 const reportScore = useInteractiveStore(s => s.reportScore);

 // ── Accessibility hook ──────────────────────────────────────
 // MUST be declared BEFORE the score guard useEffect that uses a11y.announceComplete()
 const a11y = useGameA11y({
 gameType: 'Isian',
 blockId: block.id,
 score,
 maxScore: validQuestions.length,
 interactive: interactive ?? false,
 });

 // ── Score guard (MANDATORY) ───────────────────────────────────
 // Report score on completion — only fire once per completion cycle
 const hasReportedRef = React.useRef(false);
 React.useEffect(() => {
 if (phase === 'result' && interactive && block.id && !hasReportedRef.current) {
 hasReportedRef.current = true;
 reportScore({
 elementId: block.id,
 pageIndex: pageIndex ?? 0,
 score,
 maxScore: validQuestions.length,
 completed: true,
 });
 // Play tier-appropriate sound & confetti
 const pct = validQuestions.length > 0 ? Math.round((score / validQuestions.length) * 100) : 0;
 if (pct >= 80) { playSound('complete'); fireConfettiCelebration(); }
 else if (pct >= 50) { playSound('complete'); fireConfetti({ count: 30 }); }
 else playSound('ding');
 a11y.announceComplete(score, validQuestions.length);
 }
 // Reset reported flag when no longer in result phase (replay)
 if (phase !== 'result') hasReportedRef.current = false;
 }, [phase, interactive, block.id, score, validQuestions.length, reportScore, pageIndex, a11y]);

 // ── Inline editing hooks ──────────────────────────────────────
 const titleEditor = useInlineEditor({
 blockId: block.id,
 fieldKey: 'title',
 value: block.title ?? '',
 tag: 'span',
 });

 // ── Submit handler ────────────────────────────────────────────
 const handleSubmit = React.useCallback(() => {
 if (answered || !userInput.trim() || currentQ >= validQuestions.length) return;

 const userAns = userInput.trim().toLowerCase();
 const correctAns = (validQuestions[currentQ]!.answer || '').toLowerCase();
 // Support multiple accepted answers separated by '/'
 const acceptList = correctAns.split('/').map(a => a.trim());
 const isCorrect = acceptList.includes(userAns);

 setLastCorrect(isCorrect);
 if (isCorrect) {
 setScore(s => s + 1);
 playSound('correct');
 a11y.announceCorrect();
 } else {
 playSound('incorrect');
 a11y.announceIncorrect(validQuestions[currentQ]!.answer);
 }
 setAnswered(true);

 // Auto-advance after brief delay
 const tid = setTimeout(() => {
 if (currentQ + 1 < validQuestions.length) {
 setCurrentQ(q => q + 1);
 setAnswered(false);
 setUserInput('');
 setLastCorrect(null);
 } else {
 setPhase('result');
 }
 }, 1500);
 timersRef.current.push(tid);
 }, [answered, userInput, currentQ, validQuestions]);

 // ── Restart handler ───────────────────────────────────────────
 const handleRestart = React.useCallback(() => {
 timersRef.current.forEach(clearTimeout);
 timersRef.current = [];
 setCurrentQ(0);
 setScore(0);
 setAnswered(false);
 setUserInput('');
 setLastCorrect(null);
 setPhase('play');
 hasReportedRef.current = false;
 playSound('click');
 }, []);

 // ══ EMPTY STATE ═══════════════════════════════════════════════
 if (validQuestions.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl"
 style={{
 background: tokens.subtleBg(0.04),
 border: '2px dashed ' + tokens.subtleBorder(0.15),
 }}>
 <span className="material-symbols-outlined" style={ { fontSize: '24px' } }>edit</span>
 <div className="mt-2 font-extrabold" style={{ ...edu.caption(), color: edu.mutedText(0.5) }}>
 Isian
 </div>
 <div style={{ ...edu.micro(), color: edu.mutedText(0.35) }}>
 Belum ada soal isian ditambahkan
 </div>
 </div>
 );
 }

 // ══ COMPLETION SCREEN ═════════════════════════════════════════
 if (phase === 'result') {
 const pct = validQuestions.length > 0 ? Math.round((score / validQuestions.length) * 100) : 0;
 const tierIcon = pct >= 80
 ? <span className="material-symbols-outlined inline" style={ { fontSize: '28px' } }>emoji_events</span>
 : pct >= 50
 ? <span className="material-symbols-outlined inline" style={ { fontSize: '28px' } }>star</span>
 : <Dumbbell size={28} className="inline" style={{ color: edu.accent() }} />;
 const tierMessage = pct >= 80 ? 'Luar Biasa!' : pct >= 50 ? 'Bagus!' : 'Terus Berlatih!';

 return (
 <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0} gradientBorder>
 <div className="text-center p-5 rounded-2xl"
 style={{
 background: edu.pageBg(),
 border: '2px solid ' + edu.accentAlpha(0.3),
 boxShadow: edu.shadow('elevated'),
 animation: 'popSuccess 0.5s ease-out',
 }}>
 <ReadingProgressIndicator progress={1} tokens={tokens} accent="y" height={3} position="top" />
 <div className="text-3xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>
 {tierIcon}
 </div>
 <div className="font-black text-lg mb-1"
 style={{ fontFamily: tokens.fontFamily('display'), color: edu.accent() }}>
 {tierMessage}
 </div>
 <div className="mb-4" style={{ ...edu.body(), color: edu.mutedText(0.8) }}>
 Skor kamu: {score}/{validQuestions.length} ({pct}%)
 </div>
 <div className="flex justify-center gap-3 mb-2">
 <PremiumBadge tokens={tokens} accent="g" variant="glass">
 Benar {score}
 </PremiumBadge>
 <PremiumBadge tokens={tokens} accent="r" variant="glass">
 Salah {validQuestions.length - score}
 </PremiumBadge>
 </div>
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
 <span className="material-symbols-outlined inline" style={ { fontSize: '14px' } }>refresh</span> Ulangi
 </button>
 </MicroInteraction>
 )}
 </div>
 </PremiumBlockWrapper>
 );
 }

 // ══ PLAY PHASE ════════════════════════════════════════════════
 const q = validQuestions[currentQ];
 if (!q) return null;

 const progress = ((currentQ + (answered ? 1 : 0)) / validQuestions.length) * 100;

 // ── Format question text with ___ as blank marker ─────────────
 const qText = q.text || '';
 const blankMark = '___';
 const parts = qText.split(blankMark);

 return (
 <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0}>
 <div className="space-y-3 game-block" {...a11y.rootAria} data-interactive>
 <ReadingProgressIndicator progress={validQuestions.length > 0 ? (currentQ + (answered ? 1 : 0)) / validQuestions.length : 0} tokens={tokens} accent="y" height={3} position="top" />
 {/* Hidden instruction for screen readers */}
 <div id={a11y.instructionId} className="sr-only">Ketik jawaban yang benar pada kolom isian</div>
 <div className="sr-only" {...a11y.liveAria('polite')}>
 {answered && (lastCorrect ? 'Jawaban benar!' : `Jawaban salah. Jawaban yang benar: ${q.answer}`)}
 </div>
 <div className="flex items-center justify-between min-w-0">
 <div className="flex items-center gap-2 min-w-0">
 <div className="font-extrabold" style={{ ...edu.caption(), color: edu.accent() }}>
 <span className="material-symbols-outlined inline" style={ { fontSize: '14px' } }>edit</span>{' '}
 <InlineTextEditor
 {...titleEditor}
 className="font-extrabold"
 style={{ color: edu.accent(), ...edu.micro() }}
 placeholder="Ketik judul isian..."
 />
 </div>
 </div>
 <PremiumBadge tokens={tokens} accent="y" variant="glass">
 {currentQ + 1}/{validQuestions.length}
 </PremiumBadge>
 </div>

 {/* ── Progress bar ────────────────────────────────────────── */}
 <div className="h-1.5 rounded-full overflow-hidden relative"
 {...a11y.progressAria('Kemajuan Isian', currentQ + (answered ? 1 : 0), validQuestions.length)}
 style={{ background: tokens.subtleBg(0.08) }}>
 <div className="h-full rounded-full"
 style={{
 width: `${progress}%`,
 ...tokens.iosTransitionStyle('width', 'slow'),
 background: 'linear-gradient(90deg, ' + edu.accent() + ', ' + tokens.color('g') + ')',
 backgroundSize: '200% 100%',
 animation: 'shimmer 2s linear infinite',
 boxShadow: '0 0 8px ' + edu.accentAlpha(0.3),
 }} />
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

 {/* ── Score indicator ─────────────────────────────────────── */}
 <div className="flex justify-between items-center">
 <span className="font-bold" style={{ ...edu.micro(), color: edu.accent() }}>
 Soal {currentQ + 1}/{validQuestions.length}
 </span>
 <span style={{ ...edu.micro(), color: edu.mutedText(0.6) }} aria-live="polite">
 Skor: {score}
 </span>
 </div>

 {/* ── Question card ───────────────────────────────────────── */}
 <div className="p-4 rounded-xl premium-card-glow"
 style={{
 background: edu.accentAlpha(0.06),
 border: '1px solid ' + edu.accentAlpha(0.2),
 boxShadow: edu.shadow('card'),
 overflow: 'hidden',
 }}>
 {/* Question text with blank marker — truncasi saat compact */}
 <p className={`font-bold leading-relaxed mb-3 ${isCompact ? '' : ''} ${isCompact ? 'canvas-truncate-2' : ''}`}
 style={{ color: edu.textColor(), wordBreak: 'break-word', overflowWrap: 'break-word' }}>
 {parts.length > 1 ? (
 <>
 {parts.map((part, i) => (
 <React.Fragment key={`fillblank-part-${block.id || 'fb'}-${currentQ}-${i}`}>
 {part}
 {/* Render blank between parts (not after the last part) */}
 {i < parts.length - 1 && (
 <span
 className="inline-block min-w-[50px] border-b-2 border-dashed mx-1 text-center"
 style={{
 borderColor: edu.accentAlpha(0.4),
 color: answered
 ? lastCorrect
 ? tokens.color('g')
 : tokens.color('r')
 : edu.mutedText(0.3),
 ...edu.micro(),
 }}
 >
 {answered ? '(jawaban)' : '\u00A0'}
 </span>
 )}
 </React.Fragment>
 ))}
 </>
 ) : (
 qText
 )}
 </p>

 {/* ── Hint display (only before answering) ──────────────── */}
 {q.hint && !answered && (
 <div className="mb-3 p-2 rounded-lg flex items-start gap-1.5"
 style={{
 background: tokens.colorAlpha('o', 0.08),
 border: '1px solid ' + tokens.colorAlpha('o', 0.2),
 borderLeft: `${edu.stripeWidth()}px solid ${tokens.color('o')}`,
 }}>
 <span style={{ ...edu.micro() }}>💡</span>
 <span className="italic leading-relaxed"
 style={{ ...edu.micro(), color: tokens.colorAlpha('o', 0.8) }}>
 Petunjuk: {q.hint}
 </span>
 </div>
 )}

 {/* ── Input field ───────────────────────────────────────── */}
 <input
 type="text"
 value={userInput}
 onChange={e => setUserInput(e.target.value)}
 onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
 disabled={answered}
 placeholder="Ketik jawaban..."
 aria-label="Jawaban isian"
 className={"w-full px-3 py-2 rounded-lg font-semibold outline-none" + tokens.iosTextInputTw()}
 style={{
 ...edu.caption(),
 border: '2px solid ' + (
 answered
 ? lastCorrect
 ? tokens.color('g')
 : tokens.color('r')
 : tokens.subtleBorder(0.15)
 ),
 background: answered
 ? lastCorrect
 ? tokens.colorAlpha('g', 0.1)
 : tokens.colorAlpha('r', 0.1)
 : tokens.subtleBg(0.05),
 color: answered
 ? lastCorrect
 ? tokens.color('g')
 : tokens.color('r')
 : edu.textColor(),
 boxShadow: answered
 ? lastCorrect
 ? '0 0 12px ' + tokens.colorAlpha('g', 0.15)
 : '0 0 12px ' + tokens.colorAlpha('r', 0.15)
 : 'none',
 }}
 />

 {/* ── Answer feedback ───────────────────────────────────── */}
 {answered && (
 <div className="mt-3 p-3 rounded-xl leading-relaxed font-bold"
 style={{
 ...edu.caption(),
 background: lastCorrect
 ? tokens.colorAlpha('g', 0.1)
 : tokens.colorAlpha('r', 0.1),
 border: '1px solid ' + (lastCorrect
 ? tokens.colorAlpha('g', 0.3)
 : tokens.colorAlpha('r', 0.3)),
 color: lastCorrect
 ? tokens.color('g')
 : tokens.color('r'),
 animation: 'fadeIn 0.3s ease',
 wordBreak: 'break-word',
 overflowWrap: 'break-word',
 }}>
 {lastCorrect ? (
 <>
 <span className="material-symbols-outlined inline mr-1" style={ { fontSize: '14px' } }>check_circle</span> Benar!
 </>
 ) : (
 <>
 <span className="material-symbols-outlined inline mr-1" style={ { fontSize: '14px' } }>cancel</span> Salah. Jawaban: {q.answer}
 </>
 )}
 </div>
 )}

 {/* ── Submit button (only before answering) ─────────────── */}
 {!answered && (
 <button
 onClick={handleSubmit}
 disabled={!userInput.trim()}
 aria-label="Kirim jawaban"
 className={"mt-3 px-4 py-2 rounded-xl font-extrabold" + tokens.iosButtonTw(!!userInput.trim())}
 style={{
 ...edu.caption(),
 background: userInput.trim()
 ? 'linear-gradient(135deg, ' + edu.accent() + ', ' + tokens.color('o') + ')'
 : tokens.subtleBg(0.08),
 color: userInput.trim() ? tokens.color('bg') : edu.mutedText(0.35),
 boxShadow: userInput.trim()
 ? '0 4px 16px ' + edu.accentAlpha(0.35)
 : 'none',
 border: '1px solid ' + (userInput.trim()
 ? edu.accentAlpha(0.5)
 : tokens.subtleBorder(0.1)),
 cursor: userInput.trim() ? 'pointer' : 'not-allowed',
 }}>
 Jawab
 </button>
 )}
 </div>
 </div>
 </PremiumBlockWrapper>
 );
});