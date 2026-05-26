'use client';

import React from 'react';
import { Trophy, Star, Dumbbell, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import type { TrueFalseGameBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti, fireConfettiCelebration } from '@/lib/confetti';
import { useGameA11y } from '@/lib/use-game-a11y';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';

/* ═══════════════════════════════════════════════════════════════════════
 TRUE/FALSE GAME RENDERER (Benar/Salah)
 ──────────────────────────────────────────────────────────────────────
 Ported from canva/games/TrueFalseGame.tsx to the SSR renderer system.
 Follows the exact same patterns as KuisRenderer and FillBlankGameRenderer
 (replay watcher, score guard, token-aware styling, inline editing,
 stable React keys, timer cleanup on unmount).

 Game flow:
 1. Show questions one at a time with progress bar
 2. Player clicks"Benar" (true) or"Salah" (false) button
 3. Compare user's choice with question.correct (normalized)
 4. Show feedback with explanation if available
 5. Auto-advance to next question after 1200ms delay
 6. On completion, show tiered result screen with score
 ═══════════════════════════════════════════════════════════════════════ */

export const TrueFalseGameRenderer = React.memo(function TrueFalseGameRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex }: {
 block: TrueFalseGameBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number;
}) {

 const edu = tokens.edu('true-false-game', isCompact);
 // ── Game state ────────────────────────────────────────────────
 const [currentQ, setCurrentQ] = React.useState(0);
 const [score, setScore] = React.useState(0);
 const [answered, setAnswered] = React.useState(false);
 const [selected, setSelected] = React.useState<boolean | null>(null);
 const [phase, setPhase] = React.useState<'play' | 'result'>('play');

 // ── Timer cleanup on unmount ──────────────────────────────────
 const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);
 React.useEffect(() => {
 return () => { timersRef.current.forEach(clearTimeout); };
 }, []);

 // ── Normalize questions ───────────────────────────────────────
 // Filter out questions with empty text; also normalize the `correct`
 // field which may arrive as the string"true"/"false" from JSON
 const rawQuestions = block.questions || [];
 const validQuestions = React.useMemo(
 () => rawQuestions
 .filter(q => q.text)
 .map(q => ({
 ...q,
 correct: typeof q.correct === 'string'
 ? (q.correct as string).toLowerCase() === 'true'
 : Boolean(q.correct),
 })),
 [rawQuestions]
 );

 // ── Data-change state reset (soalKey) ─────────────────────────
 // When the question data changes structurally, reset all game state
 const soalKey = React.useMemo(
 () => JSON.stringify(validQuestions.map(q => ({ t: q.text, c: q.correct }))),
 [validQuestions]
 );
 React.useEffect(() => {
 timersRef.current.forEach(clearTimeout);
 timersRef.current = [];
 setCurrentQ(0);
 setScore(0);
 setAnswered(false);
 setSelected(null);
 setPhase('play');
 }, [soalKey]);

 // ── Replay watcher (MANDATORY) ────────────────────────────────
 // Reset all state when replayGeneration bumps
 const replayGeneration = useInteractiveStore(s => s.replayGeneration);
 React.useEffect(() => {
 setCurrentQ(0);
 setScore(0);
 setAnswered(false);
 setSelected(null);
 setPhase('play');
 }, [replayGeneration]);

 // ── Interactive store: score reporting ────────────────────────
 const reportScore = useInteractiveStore(s => s.reportScore);

 // ── Accessibility hook ──────────────────────────────────────
 // MUST be declared BEFORE the score guard useEffect that uses a11y.announceComplete()
 const a11y = useGameA11y({
 gameType: 'Benar/Salah',
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

 // ── Answer handler ────────────────────────────────────────────
 const handleAnswer = React.useCallback((userChoice: boolean) => {
 if (answered || currentQ >= validQuestions.length) return;

 const q = validQuestions[currentQ];
 const isCorrect = userChoice === q!.correct;

 setSelected(userChoice);
 setAnswered(true);

 if (isCorrect) {
 setScore(s => s + 1);
 playSound('correct');
 a11y.announceCorrect();
 } else {
 playSound('incorrect');
 a11y.announceIncorrect(q!.correct ? 'Benar' : 'Salah');
 }

 // Auto-advance after brief delay
 const tid = setTimeout(() => {
 if (currentQ + 1 < validQuestions.length) {
 setCurrentQ(q => q + 1);
 setAnswered(false);
 setSelected(null);
 } else {
 setPhase('result');
 }
 }, 1200);
 timersRef.current.push(tid);
 }, [answered, currentQ, validQuestions]);

 // ── Restart handler ───────────────────────────────────────────
 const handleRestart = React.useCallback(() => {
 timersRef.current.forEach(clearTimeout);
 timersRef.current = [];
 setCurrentQ(0);
 setScore(0);
 setAnswered(false);
 setSelected(null);
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
 <CheckCircle2 size={24} style={{ color: edu.mutedText(0.4) }} />
 <div className="mt-2 font-extrabold" style={{ ...edu.caption(), color: edu.mutedText(0.5) }}>
 Benar / Salah
 </div>
 <div style={{ ...edu.micro(), color: edu.mutedText(0.35) }}>
 Belum ada soal Benar/Salah ditambahkan
 </div>
 </div>
 );
 }

 // ══ COMPLETION SCREEN ═════════════════════════════════════════
 if (phase === 'result') {
 const pct = validQuestions.length > 0 ? Math.round((score / validQuestions.length) * 100) : 0;
 const tierIcon = pct >= 80
 ? <Trophy size={28} className="inline" style={{ color: edu.accent() }} />
 : pct >= 50
 ? <Star size={28} className="inline" style={{ color: edu.accent() }} />
 : <Dumbbell size={28} className="inline" style={{ color: edu.accent() }} />;
 const tierMessage = pct >= 80 ? 'Luar Biasa!' : pct >= 50 ? 'Bagus!' : 'Terus Berlatih!';

 return (
 <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0} gradientBorder>
 <div className="text-center p-5 rounded-2xl"
 style={{
 background: tokens.color('bg'),
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
 <RotateCcw size={14} className="inline" /> Ulangi
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

 const isCorrectAnswer = selected !== null && selected === q.correct;
 const progress = ((currentQ + (answered ? 1 : 0)) / validQuestions.length) * 100;

 return (
 <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0}>
 <div className="space-y-3 game-block" {...a11y.rootAria} data-interactive>
 <ReadingProgressIndicator progress={validQuestions.length > 0 ? (currentQ + (answered ? 1 : 0)) / validQuestions.length : 0} tokens={tokens} accent="y" height={3} position="top" />
 {/* Hidden instruction for screen readers */}
 <div id={a11y.instructionId} className="sr-only">Tentukan apakah pernyataan benar atau salah</div>
 {/* ── Header with title and question counter ──────────────── */}
 <div className="flex items-center justify-between min-w-0">
 <div className="flex items-center gap-2 min-w-0">
 <div className="font-extrabold" style={{ ...edu.caption(), color: edu.accent() }}>
 <CheckCircle2 size={14} className="inline" />{' '}
 <InlineTextEditor
 {...titleEditor}
 className="font-extrabold"
 style={{ color: edu.accent(), ...edu.micro() }}
 placeholder="Ketik judul Benar/Salah..."
 />
 </div>
 </div>
 <PremiumBadge tokens={tokens} accent="y" variant="glass">
 {currentQ + 1}/{validQuestions.length}
 </PremiumBadge>
 </div>

 {/* ── Progress bar ────────────────────────────────────────── */}
 <div className="h-1.5 rounded-full overflow-hidden relative"
 {...a11y.progressAria('Kemajuan Benar/Salah', currentQ + (answered ? 1 : 0), validQuestions.length)}
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
 {/* Question text — truncasi saat compact */}
 <p className={`font-bold leading-relaxed mb-4 ${isCompact ? '' : ''} ${isCompact ? 'canvas-truncate-2' : ''}`}
 style={{ color: edu.textColor(), wordBreak: 'break-word', overflowWrap: 'break-word' }}>
 {q.text}
 </p>

 {/* ── Benar / Salah buttons ────────────────────────────── */}
 <div className="grid grid-cols-2 gap-3">
 {/* ✅ Benar button — truncasi saat compact */}
 <button
 key={`tf-opt-${block.id || 'tf'}-${currentQ}-benar`}
 disabled={answered}
 onClick={() => { if (interactive) handleAnswer(true); }}
 aria-pressed={selected === true}
 aria-label="Benar"
 className={`p-3 rounded-xl font-extrabold text-center ${tokens.iosQuizOptionTw(!answered && interactive)} min-w-0 ${isCompact ? 'canvas-truncate-1' : ''}`}
 style={{
 ...edu.body(),
 background: !answered
 ? tokens.colorAlpha('g', 0.08)
 : selected === true
 ? isCorrectAnswer
 ? tokens.colorAlpha('g', 0.2)
 : tokens.colorAlpha('r', 0.2)
 : tokens.colorAlpha('g', 0.04),
 border: '2px solid ' + (
 !answered
 ? tokens.colorAlpha('g', 0.3)
 : selected === true
 ? isCorrectAnswer
 ? tokens.color('g')
 : tokens.color('r')
 : tokens.subtleBorder(0.08)
 ),
 boxShadow: !answered
 ? 'none'
 : selected === true
 ? isCorrectAnswer
 ? '0 0 12px ' + tokens.colorAlpha('g', 0.25)
 : '0 0 12px ' + tokens.colorAlpha('r', 0.25)
 : 'none',
 color: !answered
 ? tokens.color('g')
 : selected === true
 ? isCorrectAnswer
 ? tokens.color('g')
 : tokens.color('r')
 : edu.mutedText(0.35),
 cursor: answered ? 'default' : 'pointer',
 opacity: answered && selected !== true ? 0.55 : 1,
 }}>
 ✅ Benar
 </button>

 {/* ❌ Salah button — truncasi saat compact */}
 <button
 key={`tf-opt-${block.id || 'tf'}-${currentQ}-salah`}
 disabled={answered}
 onClick={() => { if (interactive) handleAnswer(false); }}
 aria-pressed={selected === false}
 aria-label="Salah"
 className={`p-3 rounded-xl font-extrabold text-center ${tokens.iosQuizOptionTw(!answered && interactive)} min-w-0 ${isCompact ? 'canvas-truncate-1' : ''}`}
 style={{
 ...edu.body(),
 background: !answered
 ? tokens.colorAlpha('r', 0.08)
 : selected === false
 ? isCorrectAnswer
 ? tokens.colorAlpha('g', 0.2)
 : tokens.colorAlpha('r', 0.2)
 : tokens.colorAlpha('r', 0.04),
 border: '2px solid ' + (
 !answered
 ? tokens.colorAlpha('r', 0.3)
 : selected === false
 ? isCorrectAnswer
 ? tokens.color('g')
 : tokens.color('r')
 : tokens.subtleBorder(0.08)
 ),
 boxShadow: !answered
 ? 'none'
 : selected === false
 ? isCorrectAnswer
 ? '0 0 12px ' + tokens.colorAlpha('g', 0.25)
 : '0 0 12px ' + tokens.colorAlpha('r', 0.25)
 : 'none',
 color: !answered
 ? tokens.color('r')
 : selected === false
 ? isCorrectAnswer
 ? tokens.color('g')
 : tokens.color('r')
 : edu.mutedText(0.35),
 cursor: answered ? 'default' : 'pointer',
 opacity: answered && selected !== false ? 0.55 : 1,
 }}>
 ❌ Salah
 </button>
 </div>

 {/* ── Answer feedback ───────────────────────────────────── */}
 {answered && (
 <div className="mt-3 p-3 rounded-xl leading-relaxed"
 style={{
 ...edu.caption(),
 background: isCorrectAnswer
 ? tokens.colorAlpha('g', 0.1)
 : tokens.colorAlpha('r', 0.1),
 border: '1px solid ' + (isCorrectAnswer
 ? tokens.colorAlpha('g', 0.3)
 : tokens.colorAlpha('r', 0.3)),
 color: isCorrectAnswer
 ? tokens.color('g')
 : tokens.color('r'),
 animation: 'fadeIn 0.3s ease',
 wordBreak: 'break-word',
 overflowWrap: 'break-word',
 }}>
 {isCorrectAnswer ? (
 <>
 <CheckCircle2 size={14} className="inline mr-1" /> Benar!
 </>
 ) : (
 <>
 <XCircle size={14} className="inline mr-1" /> Salah. Jawaban yang benar: {q.correct ? 'Benar' : 'Salah'}
 </>
 )}
 {/* Show explanation if available */}
 {q.explanation && (
 <div className="mt-1" style={{ ...edu.micro(), opacity: 0.85, overflowWrap: 'break-word' }}>
 {q.explanation}
 </div>
 )}
 </div>
 )}
 </div>

 {/* ── Print Answer Key (teacher only) ── */}
 <div className="print-only print-answer-key">
 <h3>Kunci Jawaban: Benar/Salah</h3>
 <ul>
 {validQuestions.map((q, i) => (
 <li key={`tf-ans-${block.id || 'tf'}-${i}`}>{i + 1}. {q.text} — <strong>{q.correct ? 'Benar' : 'Salah'}</strong>{q.explanation ? ` (${q.explanation})` : ''}</li>
 ))}
 </ul>
 </div>
 </div>
 </PremiumBlockWrapper>
 );
});