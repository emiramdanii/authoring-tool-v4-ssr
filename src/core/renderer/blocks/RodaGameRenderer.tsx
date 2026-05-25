'use client';

import React from 'react';
import { RotateCcw, MessageCircle, CheckCircle2, XCircle, Trophy, Star } from 'lucide-react';
import type { RodaGameBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti, fireConfettiCelebration } from '@/lib/confetti';
import { announceToScreenReader } from '@/lib/a11y';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';

export const RodaGameRenderer = React.memo(function RodaGameRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex }: {
 block: RodaGameBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number;
}) {
 const edu = tokens.edu('roda-game', isCompact);
 const [current, setCurrent] = React.useState(0);
 const [answers, setAnswers] = React.useState<Record<number, number>>({});
 const [spinning, setSpinning] = React.useState(false);
 const [spinRotation, setSpinRotation] = React.useState(0);
 const [showQuestion, setShowQuestion] = React.useState(false);
 const tickIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

 // ── Replay watcher: reset all state when replayGeneration bumps ──
 const replayGeneration = useInteractiveStore(s => s.replayGeneration);
 React.useEffect(() => {
 setCurrent(0);
 setAnswers({});
 setSpinRotation(0);
 setShowQuestion(false);
 setSpinning(false);
 }, [replayGeneration]);

 const questions = block.questions || [];
 const q = questions[current];
 const totalCorrect = React.useMemo(
 () => Object.entries(answers).filter(([idx, ans]) => questions[Number(idx)]?.opts?.[ans]?.correct).length,
 [answers, questions],
 );
 const totalAnswered = React.useMemo(
 () => Object.keys(answers).length,
 [answers],
 );
 const isCompleted = totalAnswered >= questions.length && questions.length > 0;

 // ── Theme-aware contrast colors ────────────────────────────────
 const contrastBg = edu.cardBg();
 const contrastText = tokens.isDark() ? tokens.color('bg') : edu.textColor();

 // ── Interactive store: score reporting ──────────────────────
 const reportScore = useInteractiveStore(s => s.reportScore);

 // Report score on completion (guard: only fire once per completion cycle)
 const hasReportedRef = React.useRef(false);
 React.useEffect(() => {
 if (isCompleted && interactive && block.id && !hasReportedRef.current) {
 hasReportedRef.current = true;
 reportScore({
 elementId: block.id,
 pageIndex: pageIndex ?? 0,
 score: totalCorrect * 20,
 maxScore: questions.length * 20,
 completed: true,
 });
 const pct = Math.round((totalCorrect / questions.length) * 100);
 if (pct === 100) { playSound('complete'); fireConfettiCelebration(); }
 else if (pct >= 80) { playSound('complete'); fireConfetti({ count: 60 }); }
 else playSound('ding');
 announceToScreenReader(`Game selesai! Skor kamu: ${totalCorrect} dari ${questions.length}`, 'assertive');
 }
 // Reset reported flag when no longer completed (replay)
 if (!isCompleted) hasReportedRef.current = false;
 }, [isCompleted, interactive, block.id, totalCorrect, questions.length, reportScore, pageIndex]);

 // Cleanup tick interval on unmount
 React.useEffect(() => {
 return () => {
 if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
 };
 }, []);

 // ── Spin animation handler with tick sound ────────────────────
 const handleSpin = () => {
 if (spinning || !interactive) return;
 setSpinning(true);
 setShowQuestion(false);
 playSound('tap');

 // Start tick sound while spinning
 let tickCount = 0;
 tickIntervalRef.current = setInterval(() => {
 tickCount++;
 playSound('tap');
 // Slow down tick frequency as wheel decelerates
 if (tickCount > 12 && tickIntervalRef.current) {
 clearInterval(tickIntervalRef.current);
 tickIntervalRef.current = null;
 // A few slower ticks
 setTimeout(() => playSound('tap'), 200);
 setTimeout(() => playSound('tap'), 500);
 setTimeout(() => playSound('tap'), 900);
 }
 }, 180);

 // Calculate target rotation: 4-6 full rotations for dramatic effect
 const extraRotations = 4 + Math.floor(Math.random() * 3); // 4-6 full spins
 const segmentAngle = 360 / questions.length;
 const targetSegment = current;
 // Add slight random offset within segment for natural feel
 const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.4);
 const targetAngle = extraRotations * 360 + (360 - targetSegment * segmentAngle - segmentAngle / 2) + randomOffset;
 const newRotation = spinRotation + targetAngle;
 setSpinRotation(newRotation);

 // After spin completes, show the question
 setTimeout(() => {
 setSpinning(false);
 setShowQuestion(true);
 playSound('ding');
 if (tickIntervalRef.current) {
 clearInterval(tickIntervalRef.current);
 tickIntervalRef.current = null;
 }
 }, 3200);
 };

 // ── Inline editing hooks ─────────────────────────────────────
 const titleEditor = useInlineEditor({
 blockId: block.id,
 fieldKey: 'title',
 value: block.title ?? '',
 tag: 'span',
 });
 const questionEditor = useInlineEditor({
 blockId: block.id,
 fieldKey: `questions.${current}.q`,
 value: q?.q ?? '',
 tag: 'div',
 multiline: true,
 });
 const diskusiHintEditor = useInlineEditor({
 blockId: block.id,
 fieldKey: `questions.${current}.diskusiHint`,
 value: q?.diskusiHint ?? '',
 tag: 'span',
 });

 // ── Wheel segment colors (token-aware, must be before early returns) ──
 const wheelColors = React.useMemo(
 () => [
 tokens.color('y'), edu.accent(), tokens.color('g'),
 tokens.color('p'), tokens.color('r'), tokens.color('o'),
 ],
 [tokens],
 );

 // ══ COMPLETION SCREEN ═══════════════════════════════════════
 if (isCompleted) {
 const pct = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;
 const grade = pct >= 80 ? 'Sempurna' : pct >= 60 ? 'Bagus' : pct >= 40 ? 'Cukup' : 'Ayo Ulang';
 const gradeEmoji = pct >= 80 ? '🌟' : pct >= 60 ? '👏' : pct >= 40 ? '💪' : '🔄';
 const gradeColor = pct >= 80 ? 'g' : pct >= 60 ? 'c' : pct >= 40 ? 'y' : 'r';
 return (
 <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0} gradientBorder>
 <div className="rounded-2xl overflow-hidden p-6 text-center"
 style={{
 background: tokens.color('bg'),
 border: '2px solid ' + tokens.colorAlpha(gradeColor, 0.3),
 boxShadow: edu.shadow('elevated'),
 }}>
 <ReadingProgressIndicator progress={1} tokens={tokens} accent="y" height={3} position="top" />
 <div className="text-3xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>{gradeEmoji}</div>
 <div className="font-black text-lg mb-1" style={{ fontFamily: tokens.fontFamily('display'), color: tokens.color(gradeColor) }}>
 {grade}!
 </div>
 <div className="mb-3">
 <PremiumBadge tokens={tokens} accent={gradeColor} variant="glass">
 Skor: {totalCorrect}/{questions.length} ({pct}%)
 </PremiumBadge>
 </div>
 {/* Stars based on score */}
 <div className="flex justify-center gap-1 mb-4">
 {[1, 2, 3].map(star => (
 <Star
 key={`star-${block.id || 'roda'}-${star}`}
 size={20}
 fill={pct >= star * 33 ? tokens.color('y') : 'none'}
 stroke={pct >= star * 33 ? tokens.color('y') : edu.mutedText(0.3)}
 strokeWidth={2}
 />
 ))}
 </div>
 {interactive && (
 <MicroInteraction tokens={tokens} accent="y" effect="squish">
 <button className={"px-5 py-2 rounded-xl font-extrabold" + tokens.iosButtonTw(interactive)}
 onClick={() => { setAnswers({}); setCurrent(0); setSpinRotation(0); setShowQuestion(false); hasReportedRef.current = false; playSound('click'); }}
 style={{
 ...edu.caption(),
 background: 'linear-gradient(135deg, ' + edu.accent() + ', ' + edu.accent() + ')',
 color: tokens.color('bg'),
 boxShadow: '0 4px 16px ' + edu.accentAlpha(0.35),
 }}>
 <RotateCcw size={14} className="inline" /> Ulangi Roda
 </button>
 </MicroInteraction>
 )}
 </div>
 </PremiumBlockWrapper>
 );
 }

 if (!q) return null;

 // ── Determine if current question is answered ────────────────
 const isCurrentAnswered = answers[current] !== undefined;

 // ── Wheel size (responsive) ──────────────────────────────────
 const wheelSize = isCompact ? 130 : 180;
 const svgCenter = 100;
 const svgRadius = 94;

 return (
 <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0}>
 <div className="rounded-2xl overflow-hidden game-block"
 {...(interactive ? { role: 'application' } : {})}
 aria-label={`Roda Kuis: Soal ${current + 1} dari ${questions.length}, Skor: ${totalCorrect}${isCurrentAnswered ? ', sudah dijawab' : ''}`}
 aria-describedby={`roda-instructions-${block.id || 'roda'}`}
 data-interactive
 style={{
 background: tokens.color('bg'),
 border: '2px solid ' + edu.accentAlpha(0.3),
 boxShadow: edu.shadow('elevated'),
 }}>
 <ReadingProgressIndicator progress={questions.length > 0 ? totalAnswered / questions.length : 0} tokens={tokens} accent="y" height={3} position="top" />
 {/* Header */}
 <div className="p-3 border-b"
 style={{
 background: 'linear-gradient(90deg, ' + tokens.color('bg') + ', ' + tokens.color('bg2') + ')',
 borderColor: edu.accentAlpha(0.15),
 }}>
 <div className="flex items-center justify-between">
 <span className="font-extrabold" style={{ ...edu.caption(), color: edu.accent(), fontFamily: tokens.fontFamily('display') }}>
 🎡 <InlineTextEditor
 {...titleEditor}
 className="font-extrabold"
 style={{ color: edu.accent(), fontFamily: tokens.fontFamily('display'), ...edu.micro() }}
 placeholder="Ketik judul..."
 />
 </span>
 <PremiumBadge tokens={tokens} accent="c" variant="glass">
 {current + 1}/{questions.length}
 </PremiumBadge>
 </div>
 </div>

 <div className="p-4">
 {/* Hidden instruction for screen readers */}
 <span id={`roda-instructions-${block.id || 'roda'}`} className="sr-only">Putar roda untuk mendapat soal, lalu pilih jawaban yang benar</span>
 {/* Screen reader live region */}
 <div className="sr-only" aria-live="polite" role="status">
 {isCurrentAnswered && (q.opts?.[answers[current]!]?.correct ? 'Jawaban benar!' : 'Jawaban salah.')}
 </div>
 {/* ═══ ENHANCED SPINNING WHEEL ══════════════════════════════ */}
 {!isCurrentAnswered && (
 <div className="flex justify-center mb-4">
 <div className="relative" style={{ width: wheelSize + 30, height: wheelSize + 30 }}>
 {/* Outer glow ring */}
 <div className="absolute inset-0 rounded-full"
 style={{
 boxShadow: spinning
 ? `0 0 50px ${edu.accentAlpha(0.5)}, 0 0 100px ${edu.accentAlpha(0.2)}`
 : `0 0 24px ${edu.accentAlpha(0.15)}`,
 transition: tokens.iosTransitionStyle('box-shadow', 'slow').transition,
 }} />

 {/* Pointer arrow at top — enhanced triangle */}
 <div className="absolute top-0 left-1/2 z-20"
 style={{
 transform: 'translateX(-50%)',
 filter: `drop-shadow(0 3px 8px ${tokens.colorAlpha('y', 0.7)})`,
 }}>
 <svg width="24" height="20" viewBox="0 0 24 20">
 <polygon points="12,18 2,2 22,2" fill={tokens.color('y')} stroke={contrastText} strokeWidth="1.5" />
 </svg>
 </div>

 {/* Wheel container with spin */}
 <div className="rounded-full overflow-hidden"
 style={{
 width: wheelSize,
 height: wheelSize,
 margin: '15px auto 0',
 border: `5px solid ${edu.accent()}`,
 transform: `rotate(${spinRotation}deg)`,
 transition: spinning
 ? 'transform 3.2s cubic-bezier(0.15, 0.60, 0.05, 1.00)'
 : 'none',
 boxShadow: `inset 0 0 30px ${tokens.colorAlpha('bg', 0.4)}`,
 }}>
 <svg viewBox="0 0 200 200" width={wheelSize} height={wheelSize}>
 <defs>
 {/* Gradient for each segment for glossy effect */}
 <radialGradient id="wheelSheen" cx="50%" cy="30%" r="60%">
 <stop offset="0%" stopColor={tokens.isDark() ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.2)'} />
 <stop offset="100%" stopColor={tokens.isDark() ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.06)'} />
 </radialGradient>
 </defs>

 {questions.map((_, i) => {
 const angle = (360 / questions.length) * i;
 const nextAngle = (360 / questions.length) * (i + 1);
 const startRad = (angle - 90) * Math.PI / 180;
 const endRad = (nextAngle - 90) * Math.PI / 180;
 const x1 = svgCenter + svgRadius * Math.cos(startRad);
 const y1 = svgCenter + svgRadius * Math.sin(startRad);
 const x2 = svgCenter + svgRadius * Math.cos(endRad);
 const y2 = svgCenter + svgRadius * Math.sin(endRad);
 const largeArc = (nextAngle - angle) > 180 ? 1 : 0;
 const color = wheelColors[i % wheelColors.length];
 const isAnswered = answers[i] !== undefined;
 const isCurrentQ = i === current;
 const midRad = (startRad + endRad) / 2;

 return (
 <g key={`roda-seg-${block.id || 'roda'}-${i}`}>
 {/* Main segment */}
 <path
 d={`M${svgCenter},${svgCenter} L${x1},${y1} A${svgRadius},${svgRadius} 0 ${largeArc},1 ${x2},${y2} Z`}
 fill={color}
 opacity={isCurrentQ ? 1 : isAnswered ? 0.45 : 0.75}
 stroke={contrastBg}
 strokeWidth="2.5"
 />
 {/* Glossy sheen overlay */}
 <path
 d={`M${svgCenter},${svgCenter} L${x1},${y1} A${svgRadius},${svgRadius} 0 ${largeArc},1 ${x2},${y2} Z`}
 fill="url(#wheelSheen)"
 opacity={isCurrentQ ? 0.8 : 0.5}
 />
 {/* Segment inner border for depth */}
 <path
 d={`M${svgCenter},${svgCenter} L${x1},${y1} A${svgRadius},${svgRadius} 0 ${largeArc},1 ${x2},${y2} Z`}
 fill="none"
 stroke={tokens.isDark() ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.08)'}
 strokeWidth="1"
 transform={`translate(${Math.cos(midRad) * 1.5}, ${Math.sin(midRad) * 1.5})`}
 />
 {/* Question number — larger for better readability */}
 <text
 x={svgCenter + 58 * Math.cos(midRad)}
 y={svgCenter + 58 * Math.sin(midRad)}
 textAnchor="middle"
 dominantBaseline="central"
 fill={contrastText}
 fontSize={questions.length > 6 ?"13" :"16"}
 fontWeight="900"
 style={{ textShadow: `0 1px 3px ${tokens.isDark() ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'}` }}
 >
 {i + 1}
 </text>
 {/* Answered indicator */}
 {isAnswered && (
 <text
 x={svgCenter + 58 * Math.cos(midRad)}
 y={svgCenter + 58 * Math.sin(midRad) + 15}
 textAnchor="middle"
 dominantBaseline="central"
 fontSize="11"
 fill={contrastText}
 fontWeight="900"
 >
 {questions[i]?.opts?.[answers[i]!]?.correct ? '✓' : '✗'}
 </text>
 )}
 </g>
 );
 })}

 {/* Outer decorative ring */}
 <circle cx={svgCenter} cy={svgCenter} r={svgRadius + 1} fill="none"
 stroke={edu.accent()} strokeWidth="3" opacity="0.6" />

 {/* Center hub — layered circles for depth */}
 <circle cx={svgCenter} cy={svgCenter} r="26" fill={contrastBg}
 stroke={edu.accent()} strokeWidth="2" />
 <circle cx={svgCenter} cy={svgCenter} r="20" fill={edu.accent()} opacity="0.9" />
 <circle cx={svgCenter} cy={svgCenter} r="14" fill={tokens.colorAlpha('y', 0.3)} />
 <text x={svgCenter} y={svgCenter} textAnchor="middle" dominantBaseline="central"
 fill={contrastText} fontSize="14" fontWeight="900">
 🎡
 </text>

 {/* Decorative tick marks around wheel edge */}
 {questions.map((_, i) => {
 const tickAngle = ((360 / questions.length) * i - 90) * Math.PI / 180;
 const outerX = svgCenter + (svgRadius - 2) * Math.cos(tickAngle);
 const outerY = svgCenter + (svgRadius - 2) * Math.sin(tickAngle);
 const innerX = svgCenter + (svgRadius - 8) * Math.cos(tickAngle);
 const innerY = svgCenter + (svgRadius - 8) * Math.sin(tickAngle);
 return (
 <line key={`tick-${block.id}-${i}`} x1={outerX} y1={outerY} x2={innerX} y2={innerY}
 stroke={contrastBg} strokeWidth="2" opacity="0.5" />
 );
 })}
 </svg>
 </div>

 {/* Progress dots around the wheel */}
 {questions.map((_, i) => {
 const answered = answers[i] !== undefined;
 if (!answered) return null;
 const angle = (360 / questions.length) * i - 90;
 const rad = angle * Math.PI / 180;
 const dotRadius = (wheelSize / 2) + 16;
 const isCorrect = questions[i]?.opts?.[answers[i]!]?.correct;
 return (
 <div key={`dot-${block.id}-${i}`} className="absolute w-5 h-5 rounded-full flex items-center justify-center"
 style={{
 left: `calc(50% + ${Math.cos(rad) * dotRadius}px - 10px)`,
 top: `calc(50% + ${Math.sin(rad) * dotRadius}px - 10px + 7px)`,
 background: isCorrect ? tokens.color('g') : tokens.color('r'),
 boxShadow: `0 0 10px ${isCorrect ? tokens.colorAlpha('g', 0.5) : tokens.colorAlpha('r', 0.5)}`,
 zIndex: 15,
 border: `2px solid ${contrastBg}`,
 ...edu.micro(),
 color: contrastText,
 fontWeight: 900,
 animation: 'popSuccess 0.3s ease-out',
 }}>
 {isCorrect ? '✓' : '✗'}
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* Spin button */}
 {!isCurrentAnswered && interactive && (
 <div className="text-center mb-4">
 <button className={"px-6 py-2.5 rounded-xl font-extrabold" + tokens.iosButtonTw(interactive && !spinning)}
 aria-label="Putar roda"
 onClick={handleSpin}
 disabled={spinning}
 style={{
 ...edu.body(),
 background: spinning
 ? tokens.subtleBg(0.1)
 : `linear-gradient(135deg, ${edu.accent()}, ${edu.accent()})`,
 color: tokens.color('bg'),
 boxShadow: spinning ? 'none' : `0 4px 16px ${edu.accentAlpha(0.35)}`,
 animation: spinning ? 'none' : 'pulseGlow 2s ease-in-out infinite',
 cursor: spinning ? 'not-allowed' : 'pointer',
 opacity: spinning ? 0.6 : 1,
 }}>
 {spinning ? '⏳ Berputar...' : '🎡 Putar Roda!'}
 </button>
 </div>
 )}

 {/* Discussion hint */}
 {q.diskusiHint && (
 <div className="mb-3 p-3 rounded-xl"
 style={{
 background: edu.accentAlpha(0.08),
 border: '1px solid ' + edu.accentAlpha(0.25),
 borderLeft: `${edu.stripeWidth()}px solid ${edu.accent()}`,
 }}>
 <div className="leading-relaxed" style={{ ...edu.caption() }}><strong style={{ color: edu.accent() }}><MessageCircle size={14} className="inline" /> Diskusi:</strong> <InlineTextEditor
 {...diskusiHintEditor}
 
 style={{ ...edu.micro() }}
 placeholder="Ketik hint diskusi..."
 /></div>
 </div>
 )}

 {/* Question — show after spinning or when answered */}
 {(showQuestion || isCurrentAnswered) && !spinning && (
 <div className="p-3 rounded-xl mb-3 premium-card-glow"
 style={{
 background: edu.accentAlpha(0.08),
 border: '1px solid ' + edu.accentAlpha(0.2),
 animation: 'fadeIn 0.4s ease',
 }}>
 <InlineTextEditor
 {...questionEditor}
 className={` font-bold leading-relaxed ${isCompact ? 'canvas-truncate-2' : ''}`}
 style={{ ...edu.micro() }}
 placeholder="Ketik pertanyaan..."
 />
 </div>
 )}

 {/* Options */}
 {(showQuestion || isCurrentAnswered) && !spinning && (
 <div className="space-y-2.5">
 {(q.opts || []).map((opt, i) => {
 let bg = tokens.subtleBg(0.05);
 let border = tokens.subtleBorder(0.1);
 let boxShd = 'none';
 if (isCurrentAnswered) {
 if (opt.correct) {
 bg = tokens.colorAlpha('g', 0.15);
 border = tokens.color('g');
 boxShd = `0 0 12px ${tokens.colorAlpha('g', 0.2)}`;
 } else if (answers[current] === i) {
 bg = tokens.colorAlpha('r', 0.15);
 border = tokens.color('r');
 boxShd = `0 0 12px ${tokens.colorAlpha('r', 0.2)}`;
 }
 }
 return (
 <button key={`opt-${block.id || 'roda'}-${i}`} disabled={isCurrentAnswered || spinning}
 onClick={() => {
 if (interactive && !isCurrentAnswered && !spinning) {
 setAnswers(prev => ({ ...prev, [current]: i }));
 if (opt.correct) { playSound('correct'); announceToScreenReader('Benar!', 'assertive'); }
 else { playSound('incorrect'); announceToScreenReader('Salah', 'assertive'); }
 }
 }}
 className={`w-full p-3 rounded-xl font-bold text-left ${tokens.iosQuizOptionTw(!isCurrentAnswered && !spinning && interactive)} min-w-0 overflow-hidden ${isCompact ? 'canvas-truncate-1' : ''}`}
 style={{ ...edu.caption(), background: bg, border: '2px solid ' + border, boxShadow: boxShd, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: edu.textColor() }}>
 {opt.text}
 </button>
 );
 })}
 </div>
 )}

 {/* Feedback */}
 {isCurrentAnswered && q.opts[answers[current]!] && (
 <div className="mt-3 p-3 rounded-xl leading-relaxed font-bold"
 style={{
 ...edu.caption(),
 background: q.opts[answers[current]!]!.correct ? tokens.colorAlpha('g', 0.1) : tokens.colorAlpha('r', 0.1),
 border: '1px solid ' + (q.opts[answers[current]!]!.correct ? tokens.colorAlpha('g', 0.3) : tokens.colorAlpha('r', 0.3)),
 color: q.opts[answers[current]!]!.correct ? tokens.color('g') : tokens.color('r'),
 animation: 'fadeIn 0.3s ease',
 }}>
 {q.opts[answers[current]!]!.correct ? <CheckCircle2 size={14} className="inline mr-1" /> : <XCircle size={14} className="inline mr-1" />}
 {q.opts[answers[current]!]!.correct ? (q.feedbackCorrect || 'Benar!') : (q.feedbackWrong || 'Kurang tepat.')}
 </div>
 )}

 {/* Next button */}
 {isCurrentAnswered && current < questions.length - 1 && (
 <button className={"mt-3 px-5 py-2 rounded-xl font-extrabold" + tokens.iosButtonTw(interactive)}
 aria-label="Soal berikutnya"
 onClick={() => { setCurrent(current + 1); setShowQuestion(false); playSound('click'); }}
 style={{
 ...edu.caption(),
 background: 'linear-gradient(135deg, ' + edu.accent() + ', ' + tokens.color('o') + ')',
 color: tokens.color('bg'),
 boxShadow: '0 4px 16px ' + edu.accentAlpha(0.35),
 }}>
 Soal Berikutnya →
 </button>
 )}
 {/* Progress bar */}
 {questions.length > 1 && (
 <div className="mt-4 px-1">
 <div className="flex items-center justify-between mb-1.5">
 <span className="font-extrabold" style={{ ...edu.micro(), color: edu.accent() }}>
 <Trophy size={12} className="inline" /> Progres
 </span>
 <span style={{ ...edu.micro(), color: edu.mutedText(0.6) }}>
 {totalAnswered}/{questions.length} soal
 </span>
 </div>
 <div className="h-2 rounded-full overflow-hidden"
 role="progressbar"
 aria-valuenow={totalAnswered}
 aria-valuemin={0}
 aria-valuemax={questions.length}
 style={{ background: tokens.subtleBg(0.08) }}>
 <div className="h-full rounded-full"
 style={{
 width: `${questions.length > 0 ? (totalAnswered / questions.length) * 100 : 0}%`,
 ...tokens.iosTransitionStyle('width', 'slow'),
 background: `linear-gradient(90deg, ${edu.accent()}, ${edu.accent()})`,
 backgroundSize: '200% 100%',
 animation: 'shimmer 2s linear infinite',
 boxShadow: `0 0 8px ${edu.accentAlpha(0.3)}`,
 }} />
 </div>
 </div>
 )}
 </div>
 </div>
 </PremiumBlockWrapper>
 );
});
