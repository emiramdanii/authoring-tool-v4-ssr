'use client';

import React, { useState } from 'react';
import { Trophy, Star, Dumbbell, RotateCcw, Gamepad2, CheckCircle2, XCircle, Flame, Sparkles, Zap } from 'lucide-react';
import type { KuisBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { PremiumBlockWrapper, ReadingProgressIndicator, StepCompletionOverlay, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti, fireConfettiCelebration, fireConfettiMini } from '@/lib/confetti';
import { useBlockCompression } from '../../layout/useBlockCompression';

// ═══════════════════════════════════════════════════════════════════
// KUIS RENDERER — Premium Quiz with Full Visual FX + Variant A/B/C
// ═══════════════════════════════════════════════════════════════════
// Premium Features:
//   - Holographic aurora progress bar
//   - 3D hover micro-interactions on options (ripple + glow)
//   - Confetti burst on correct answer & completion
//   - Streak flame badge with glow pulse
//   - StepCompletionOverlay when quiz finished
//   - Premium spring-physics buttons
//   - Score tier with holographic aurora ring
//   - Animated sparkles on completion
//   - Variant A (Klasik) / B (Kartu) / C (Ringkas) support
// ═══════════════════════════════════════════════════════════════════

// ── Variant Selector ─────────────────────────────────────────────
function VariantSelector({
  active,
  onChange,
}: {
  active: 'A' | 'B' | 'C';
  onChange: (v: 'A' | 'B' | 'C') => void;
}) {
  const variants: Array<{ key: 'A' | 'B' | 'C'; label: string }> = [
    { key: 'A', label: 'Klasik' },
    { key: 'B', label: 'Kartu' },
    { key: 'C', label: 'Ringkas' },
  ];

  return (
    <div className="variant-selector" style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '9999px', padding: '3px' }}>
      {variants.map((v) => (
        <button
          key={v.key}
          className={`variant-pill ${active === v.key ? 'active' : ''}`}
          onClick={() => onChange(v.key)}
          aria-label={`Varian ${v.label}`}
          title={`Varian ${v.label}`}
          type="button"
          style={{
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: active === v.key ? 'rgba(245,158,11,0.18)' : 'transparent',
            color: active === v.key ? '#d97706' : 'rgba(0,0,0,0.45)',
            boxShadow: active === v.key ? '0 1px 4px rgba(245,158,11,0.15)' : 'none',
          }}
        >
          {v.key}
        </button>
      ))}
    </div>
  );
}

// ── Variant B: Kartu — standalone card with larger text & single column ──
function KuisVariantKartu({
  q,
  current,
  block,
  answers,
  interactive,
  isCompact,
  tokens,
  questionEditor,
  explanationEditor,
  onAnswer,
}: {
  q: NonNullable<KuisBlock['questions']>[number];
  current: number;
  block: KuisBlock;
  answers: Record<number, number>;
  interactive: boolean;
  isCompact: boolean;
  tokens: TokenResolver;
  questionEditor: ReturnType<typeof useInlineEditor>;
  explanationEditor: ReturnType<typeof useInlineEditor>;
  onAnswer: (current: number, i: number) => void;
}) {
  const isAnswered = answers[current] !== undefined;

  return (
    <div
      className="p-6 rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${tokens.colorAlpha('y', 0.1)}, ${tokens.colorAlpha('c', 0.06)})`,
        border: `1.5px solid ${tokens.colorAlpha('y', 0.3)}`,
        boxShadow: tokens.raw.shadow.card + `, 0 0 28px ${tokens.colorAlpha('y', 0.1)}`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Decorative sparkle */}
      <div className="absolute top-3 right-4" style={{ animation: 'float 3s ease-in-out infinite', opacity: 0.2 }}>
        <Sparkles size={20} style={{ color: tokens.color('y') }} />
      </div>

      {/* Question — larger text */}
      <InlineTextEditor
        {...questionEditor}
        className={`text-[15px] font-bold leading-relaxed mb-5 ${isCompact ? 'canvas-truncate-2' : ''}`}
        style={{ fontSize: 'inherit', wordBreak: 'break-word', overflowWrap: 'break-word' }}
        placeholder="Ketik pertanyaan..."
      />

      {/* Options — single column, larger buttons */}
      <div className="flex flex-col gap-3">
        {(q.opts || []).map((opt, i) => {
          const isCorrect = i === q.ans;
          const isPicked = answers[current] === i;
          const bg = !isAnswered
            ? tokens.subtleBg(0.06)
            : isCorrect
              ? `linear-gradient(135deg, ${tokens.colorAlpha('g', 0.18)}, ${tokens.colorAlpha('g', 0.08)})`
              : isPicked
                ? `linear-gradient(135deg, ${tokens.colorAlpha('r', 0.18)}, ${tokens.colorAlpha('r', 0.08)})`
                : tokens.subtleBg(0.06);
          const bdr = !isAnswered ? tokens.subtleBorder(0.12) : isCorrect ? tokens.color('g') : isPicked ? tokens.color('r') : tokens.subtleBorder(0.1);
          const bxSh = !isAnswered ? 'none' : isCorrect ? ('0 0 18px ' + tokens.colorAlpha('g', 0.3)) : isPicked ? ('0 0 18px ' + tokens.colorAlpha('r', 0.3)) : 'none';

          return (
            <MicroInteraction key={`kuis-kartu-opt-${block.id || 'kuis'}-${current}-${i}`} tokens={tokens} accent={isAnswered ? (isCorrect ? 'g' : isPicked ? 'r' : 'y') : 'y'} effect="squish">
              <button
                disabled={isAnswered}
                onClick={() => onAnswer(current, i)}
                aria-pressed={answers[current] === i}
                className={`p-4 rounded-xl font-bold text-left transition-all hover:scale-[1.02] min-w-0 ${isCompact ? 'canvas-truncate-1' : ''}`}
                style={{
                  fontSize: '15px',
                  background: bg,
                  border: `2px solid ${bdr}`,
                  boxShadow: bxSh,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  color: tokens.color('text'),
                  cursor: isAnswered ? 'default' : 'pointer',
                  position: 'relative',
                }}
              >
                {opt}
                {isAnswered && isCorrect && (
                  <div className="absolute -top-1 -right-1" style={{ animation: 'sparkle 1s ease-in-out infinite' }}>
                    <Sparkles size={12} style={{ color: tokens.color('g') }} />
                  </div>
                )}
              </button>
            </MicroInteraction>
          );
        })}
      </div>

      {/* Answer feedback */}
      {isAnswered && (
        <div className="mt-4 p-4 rounded-xl leading-relaxed"
          style={{
            fontSize: '13px',
            background: answers[current] === q.ans
              ? `linear-gradient(135deg, ${tokens.colorAlpha('g', 0.12)}, ${tokens.colorAlpha('g', 0.04)})`
              : `linear-gradient(135deg, ${tokens.colorAlpha('r', 0.12)}, ${tokens.colorAlpha('r', 0.04)})`,
            border: `1px solid ${answers[current] === q.ans ? tokens.colorAlpha('g', 0.4) : tokens.colorAlpha('r', 0.4)}`,
            boxShadow: answers[current] === q.ans
              ? `0 0 14px ${tokens.colorAlpha('g', 0.12)}`
              : `0 0 14px ${tokens.colorAlpha('r', 0.12)}`,
            color: answers[current] === q.ans ? tokens.color('g') : tokens.color('r'),
            overflow: 'hidden',
            wordBreak: 'break-word',
            animation: 'popIn 0.3s ease-out',
          }}>
          {answers[current] === q.ans ? <CheckCircle2 size={14} className="inline mr-1" /> : <XCircle size={14} className="inline mr-1" />}
          <InlineTextEditor
            {...explanationEditor}
            className={`text-[11px] ${isCompact ? 'canvas-truncate-2' : ''}`}
            style={{ color: 'inherit', fontSize: 'inherit', overflowWrap: 'break-word' }}
            placeholder="Ketik penjelasan..."
          />
        </div>
      )}
    </div>
  );
}

// ── Variant C: Ringkas — compact pills, minimal spacing ──────────
function KuisVariantRingkas({
  q,
  current,
  block,
  answers,
  interactive,
  isCompact,
  tokens,
  totalAnswered,
  questionsLength,
  questionEditor,
  explanationEditor,
  onAnswer,
}: {
  q: NonNullable<KuisBlock['questions']>[number];
  current: number;
  block: KuisBlock;
  answers: Record<number, number>;
  interactive: boolean;
  isCompact: boolean;
  tokens: TokenResolver;
  totalAnswered: number;
  questionsLength: number;
  questionEditor: ReturnType<typeof useInlineEditor>;
  explanationEditor: ReturnType<typeof useInlineEditor>;
  onAnswer: (current: number, i: number) => void;
}) {
  const isAnswered = answers[current] !== undefined;

  return (
    <div
      className="p-3 rounded-xl"
      style={{
        background: `linear-gradient(135deg, ${tokens.colorAlpha('y', 0.06)}, ${tokens.colorAlpha('c', 0.03)})`,
        border: `1px solid ${tokens.colorAlpha('y', 0.2)}`,
        boxShadow: tokens.raw.shadow.card + `, 0 0 12px ${tokens.colorAlpha('y', 0.05)}`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Inline progress indicator */}
      <div className="flex items-center gap-1.5 mb-2">
        <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: tokens.subtleBg(0.1) }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: (totalAnswered / questionsLength) * 100 + '%',
              background: `linear-gradient(90deg, ${tokens.color('y')}, ${tokens.color('c')})`,
              boxShadow: `0 0 6px ${tokens.colorAlpha('y', 0.3)}`,
            }}
          />
        </div>
        <span className="font-bold" style={{ fontSize: '10px', color: tokens.muted(0.85) }}>
          {current + 1}/{questionsLength}
        </span>
      </div>

      {/* Question — smaller text */}
      <InlineTextEditor
        {...questionEditor}
        className={`text-[11px] font-bold leading-snug mb-2 ${isCompact ? 'canvas-truncate-1' : ''}`}
        style={{ fontSize: 'inherit', wordBreak: 'break-word', overflowWrap: 'break-word' }}
        placeholder="Ketik pertanyaan..."
      />

      {/* Options — compact pill buttons, flex-wrap */}
      <div className="flex flex-wrap gap-1.5">
        {(q.opts || []).map((opt, i) => {
          const isCorrect = i === q.ans;
          const isPicked = answers[current] === i;
          const bg = !isAnswered
            ? tokens.subtleBg(0.06)
            : isCorrect
              ? `linear-gradient(135deg, ${tokens.colorAlpha('g', 0.15)}, ${tokens.colorAlpha('g', 0.06)})`
              : isPicked
                ? `linear-gradient(135deg, ${tokens.colorAlpha('r', 0.15)}, ${tokens.colorAlpha('r', 0.06)})`
                : tokens.subtleBg(0.04);
          const bdr = !isAnswered ? tokens.subtleBorder(0.08) : isCorrect ? tokens.color('g') : isPicked ? tokens.color('r') : tokens.subtleBorder(0.06);
          const bxSh = !isAnswered ? 'none' : isCorrect ? ('0 0 10px ' + tokens.colorAlpha('g', 0.2)) : isPicked ? ('0 0 10px ' + tokens.colorAlpha('r', 0.2)) : 'none';

          return (
            <MicroInteraction key={`kuis-ringkas-opt-${block.id || 'kuis'}-${current}-${i}`} tokens={tokens} accent={isAnswered ? (isCorrect ? 'g' : isPicked ? 'r' : 'y') : 'y'} effect="squish">
              <button
                disabled={isAnswered}
                onClick={() => onAnswer(current, i)}
                aria-pressed={answers[current] === i}
                className={`px-3 py-1.5 rounded-full font-bold transition-all hover:scale-[1.04] ${isCompact ? 'canvas-truncate-1' : ''}`}
                style={{
                  fontSize: '11px',
                  background: bg,
                  border: `1.5px solid ${bdr}`,
                  boxShadow: bxSh,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  color: tokens.color('text'),
                  cursor: isAnswered ? 'default' : 'pointer',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                }}
              >
                {opt}
                {isAnswered && isCorrect && (
                  <span className="absolute -top-0.5 -right-0.5" style={{ animation: 'sparkle 1s ease-in-out infinite' }}>
                    <Sparkles size={8} style={{ color: tokens.color('g') }} />
                  </span>
                )}
              </button>
            </MicroInteraction>
          );
        })}
      </div>

      {/* Answer feedback — minimal */}
      {isAnswered && (
        <div className="mt-2 px-3 py-1.5 rounded-lg leading-snug"
          style={{
            fontSize: '10px',
            background: answers[current] === q.ans
              ? `${tokens.colorAlpha('g', 0.08)}`
              : `${tokens.colorAlpha('r', 0.08)}`,
            border: `1px solid ${answers[current] === q.ans ? tokens.colorAlpha('g', 0.3) : tokens.colorAlpha('r', 0.3)}`,
            color: answers[current] === q.ans ? tokens.color('g') : tokens.color('r'),
            overflow: 'hidden',
            wordBreak: 'break-word',
            animation: 'popIn 0.3s ease-out',
          }}>
          {answers[current] === q.ans ? <CheckCircle2 size={10} className="inline mr-0.5" /> : <XCircle size={10} className="inline mr-0.5" />}
          <InlineTextEditor
            {...explanationEditor}
            className="text-[10px]"
            style={{ color: 'inherit', fontSize: 'inherit', overflowWrap: 'break-word' }}
            placeholder="Ketik penjelasan..."
          />
        </div>
      )}
    </div>
  );
}

export const KuisRenderer = React.memo(function KuisRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex, compression }: {
  block: KuisBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number; compression?: import('../../layout/CompressionEngine').CompressionDecision;
}) {
  const [current, setCurrent] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = React.useState(false);

  // ── Variant state ───────────────────────────────────────────
  const [currentVariant, setCurrentVariant] = useState<'A' | 'B' | 'C'>(
    (block.variant as 'A' | 'B' | 'C') || 'A'
  );
  const variant = currentVariant;

  // ── Compression-aware rendering (step-reveal strategy) ──────
  // Kuis naturally shows one question at a time (step-reveal).
  // When compressed, we switch to the most compact variant (C "Ringkas")
  // and hide decorative elements (streak badge, progress aurora).
  const questions = block.questions || [];
  const { isCompressed } = useBlockCompression({
    compression,
    totalItems: questions.length,
  });
  const effectiveVariant = isCompressed ? 'C' as const : variant;

  // ── Replay watcher: reset all state when replayGeneration bumps ──
  const replayGeneration = useInteractiveStore(s => s.replayGeneration);
  React.useEffect(() => {
    setCurrent(0);
    setAnswers({});
    setShowExplanation(false);
  }, [replayGeneration]);

  const q = questions[current];
  const totalAnswered = React.useMemo(
    () => Object.keys(answers).length,
    [answers],
  );
  const totalCorrect = React.useMemo(
    () => Object.entries(answers).filter(([idx, ans]) => questions[Number(idx)]?.ans === ans).length,
    [answers, questions],
  );
  const isCompleted = totalAnswered >= questions.length && questions.length > 0;

  // ── Streak calculation ──────────────────────────────────────
  const currentStreak = React.useMemo(() => {
    let s = 0;
    for (let i = current - 1; i >= 0; i--) {
      if (answers[i] !== undefined && questions[i]?.ans === answers[i]) s++;
      else break;
    }
    return s;
  }, [answers, current, questions]);

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
      // Play tier-appropriate sound & confetti
      const pct = Math.round((totalCorrect / questions.length) * 100);
      if (pct >= 80) { playSound('complete'); fireConfettiCelebration(); }
      else if (pct >= 50) { playSound('complete'); fireConfetti({ count: 30 }); }
      else playSound('ding');
    }
    if (!isCompleted) hasReportedRef.current = false;
  }, [isCompleted, interactive, block.id, totalCorrect, questions.length, reportScore, pageIndex]);

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
  const explanationEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: `questions.${current}.ex`,
    value: q?.ex ?? '',
    tag: 'span',
  });

  // ── Progress calculation ──────────────────────────────────────
  const progress = questions.length > 0 ? totalAnswered / questions.length : 0;

  // ── Answer handler (shared across variants) ───────────────────
  const handleAnswer = React.useCallback(
    (qCurrent: number, optIndex: number) => {
      if (interactive && answers[qCurrent] === undefined) {
        setAnswers(prev => ({ ...prev, [qCurrent]: optIndex }));
        if (optIndex === questions[qCurrent]?.ans) { playSound('correct'); fireConfettiMini(); }
        else playSound('incorrect');
      }
    },
    [interactive, answers, questions],
  );

  // ══ COMPLETION SCREEN — Premium with Holographic Aurora ═════════
  if (isCompleted) {
    const pct = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;
    const tierColor = pct >= 80 ? 'y' : pct >= 50 ? 'g' : 'o';
    const tierEmoji = pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '💪';

    return (
      <PremiumBlockWrapper tokens={tokens} accent={tierColor} staggerIndex={0} gradientBorder>
        <ReadingProgressIndicator progress={1} tokens={tokens} accent={tierColor} height={3} position="top" />
        <div className="relative text-center p-5 overflow-hidden">
          {/* Step Completion Overlay — sparkle particles + trophy */}
          <StepCompletionOverlay
            show={true}
            tokens={tokens}
            accent={tierColor}
            completionText={pct >= 80 ? 'LUAR BIASA!' : pct >= 50 ? 'BAGUS!' : 'TERUS BERLATIH!'}
            isCompact={isCompact}
          />

          {/* Holographic Aurora Circle — score ring */}
          <div className={`relative mx-auto ${isCompact ? 'w-24 h-24' : 'w-36 h-36'} mb-4`}>
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-full"
              style={{
                boxShadow: `0 0 40px ${tokens.colorAlpha(tierColor, 0.25)}, 0 0 80px ${tokens.colorAlpha(tierColor, 0.1)}`,
                animation: 'glowPulse 2s ease-in-out infinite',
                '--glow-color': tokens.colorAlpha(tierColor, 0.3),
                '--glow-color-strong': tokens.colorAlpha(tierColor, 0.6),
              } as React.CSSProperties} />
            {/* Conic gradient ring */}
            <div className={`${isCompact ? 'w-24 h-24' : 'w-36 h-36'} rounded-full flex items-center justify-center`}
              style={{
                background: `conic-gradient(${tokens.color(tierColor)} 0%, ${tokens.color(tierColor)} ${pct}%, ${tokens.colorAlpha(tierColor, 0.1)} ${pct}%, ${tokens.colorAlpha(tierColor, 0.1)} 100%)`,
              }}>
              <div className={`${isCompact ? 'w-20 h-20' : 'w-32 h-32'} rounded-full flex items-center justify-center`}
                style={{ background: tokens.color('bg2') }}>
                <div className="text-center">
                  <div className="text-3xl mb-1" style={{ animation: 'trophyBounce 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}>
                    {tierEmoji}
                  </div>
                  <div className="text-2xl font-black premium-text-gradient"
                    style={{ color: tokens.color(tierColor) }}>
                    {pct}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="font-black text-lg mb-1" style={{ fontFamily: tokens.fontFamily('display'), color: tokens.color(tierColor) }}>
            {pct >= 80 ? 'Luar Biasa!' : pct >= 50 ? 'Bagus!' : 'Terus Berlatih!'}
          </div>
          <div className="mb-4" style={{ fontSize: '13px', color: tokens.muted(0.8) }}>
            Skor kamu: {totalCorrect}/{questions.length} ({pct}%)
          </div>

          {/* Score breakdown with premium badges */}
          <div className="flex justify-center gap-3 mb-4 flex-wrap">
            <PremiumBadge tokens={tokens} accent="g" variant="solid" isCompact={isCompact}>
              <CheckCircle2 size={12} /> Benar: {totalCorrect}
            </PremiumBadge>
            <PremiumBadge tokens={tokens} accent="r" variant="solid" isCompact={isCompact}>
              <XCircle size={12} /> Salah: {questions.length - totalCorrect}
            </PremiumBadge>
          </div>

          {/* Best streak badge */}
          {currentStreak >= 2 && (
            <div className="mb-4">
              <PremiumBadge tokens={tokens} accent="o" variant="gradient" isCompact={isCompact}>
                <Flame size={12} /> Streak Terbaik: {currentStreak}x
              </PremiumBadge>
            </div>
          )}

          {/* Replay button — premium spring */}
          {interactive && (
            <MicroInteraction tokens={tokens} accent={tierColor} effect="squish">
              <button className="px-5 py-2.5 rounded-xl font-extrabold transition-all hover:scale-105"
                onClick={() => { setAnswers({}); setCurrent(0); hasReportedRef.current = false; playSound('click'); }}
                style={{
                  fontSize: '13px',
                  background: 'linear-gradient(135deg, ' + tokens.color('y') + ', ' + tokens.color('o') + ')',
                  color: tokens.color('bg'),
                  boxShadow: '0 4px 16px ' + tokens.colorAlpha('y', 0.35),
                  animation: 'springBounce 0.4s ease',
                }}>
                <RotateCcw size={14} className="inline" /> Ulangi
              </button>
            </MicroInteraction>
          )}
        </div>
      </PremiumBlockWrapper>
    );
  }

  if (!q) return null;

  // ══ IN-PROGRESS SCREEN ═══════════════════════════════════════════
  return (
    <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0} gradientBorder>
      <ReadingProgressIndicator progress={progress} tokens={tokens} accent="y" height={3} position="top" />
    <div className="space-y-3 game-block" {...(interactive ? { role: 'application' } : {})} aria-label={`Kuis: Soal ${current + 1} dari ${questions.length}, Skor: ${totalCorrect}`} aria-describedby={`kuis-instructions-${block.id || 'kuis'}`} data-interactive>
      {/* Hidden instruction for screen readers */}
      <span id={`kuis-instructions-${block.id || 'kuis'}`} className="sr-only">Pilih jawaban yang benar untuk setiap soal kuis</span>
      {/* Screen reader live region for score updates */}
      <div className="sr-only" aria-live="polite" role="status">
        {answers[current] !== undefined && (answers[current] === q.ans ? 'Jawaban benar!' : 'Jawaban salah.')}
      </div>

      {/* ── Variant selector (only in editing mode) ──────────────── */}
      {isEditing && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 45 }}>
          <VariantSelector active={variant} onChange={setCurrentVariant} />
        </div>
      )}

      {/* ── Header with premium holographic bar ──────────────────── */}
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${tokens.colorAlpha('y', 0.2)}, ${tokens.colorAlpha('o', 0.1)})`,
              border: `1px solid ${tokens.colorAlpha('y', 0.3)}`,
              boxShadow: `0 2px 8px ${tokens.colorAlpha('y', 0.2)}`,
            }}>
            <Gamepad2 size={14} style={{ color: tokens.color('y') }} />
          </div>
          <div className="font-extrabold min-w-0" style={{ fontSize: '13px', color: tokens.color('y') }}>
            <InlineTextEditor
              {...titleEditor}
              className="text-[11px] font-extrabold"
              style={{ color: tokens.color('y'), fontSize: 'inherit' }}
              placeholder="Ketik judul kuis..."
            />
          </div>
          {/* Streak indicator — premium glow pulse (hidden when compressed) */}
          {!isCompressed && currentStreak >= 2 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${tokens.colorAlpha('o', 0.2)}, ${tokens.colorAlpha('y', 0.1)})`,
                border: `1px solid ${tokens.colorAlpha('o', 0.5)}`,
                boxShadow: `0 0 12px ${tokens.colorAlpha('o', 0.25)}`,
                animation: 'glowPulse 2s ease-in-out infinite',
                '--glow-color': tokens.colorAlpha('o', 0.3),
                '--glow-color-strong': tokens.colorAlpha('o', 0.6),
              } as React.CSSProperties}>
              <Flame size={12} style={{ color: tokens.color('o') }} />
              <span className="font-black" style={{ fontSize: '10px', color: tokens.color('o') }}>
                {currentStreak}x Streak!
              </span>
            </div>
          )}
        </div>
        <PremiumBadge className="flex-shrink-0" tokens={tokens} accent="y" variant="glass" isCompact={isCompact}>
          {current + 1}/{questions.length}
        </PremiumBadge>
      </div>

      {/* ── Holographic Aurora Progress Bar (simplified when compressed) ──── */}
      {!isCompressed && (
      <div className="h-2 rounded-full overflow-hidden"
        style={{ background: tokens.subtleBg(0.08) }}
        role="progressbar" aria-label={`Progres kuis ${totalAnswered} dari ${questions.length}`} aria-valuenow={totalAnswered} aria-valuemin={0} aria-valuemax={questions.length}>
        <div className="h-full rounded-full transition-all"
          style={{
            width: (totalAnswered / questions.length) * 100 + '%',
            background: `linear-gradient(90deg, ${tokens.color('y')}, ${tokens.color('c')}, ${tokens.color('y')})`,
            backgroundSize: '200% 100%',
            boxShadow: `0 0 10px ${tokens.colorAlpha('y', 0.4)}`,
            animation: 'shimmer 2s linear infinite',
          }} />
        {/* Aurora shimmer overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(90deg, transparent, ${tokens.colorAlpha('y', 0.2)}, transparent)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
      </div>
      )}

      {/* ══ VARIANT-CONDITIONAL QUESTION AREA ═══════════════════════ */}

      {/* ── Variant A: Klasik — the original 2-column grid layout ── */}
      {effectiveVariant === 'A' && (
        <div className="p-4 rounded-xl premium-card-glow"
          style={{
            background: `linear-gradient(135deg, ${tokens.colorAlpha('y', 0.08)}, ${tokens.colorAlpha('c', 0.04)})`,
            border: `1px solid ${tokens.colorAlpha('y', 0.25)}`,
            boxShadow: tokens.raw.shadow.card + `, 0 0 20px ${tokens.colorAlpha('y', 0.08)}`,
            overflow: 'hidden',
            position: 'relative',
          }}>
          {/* Decorative sparkle */}
          <div className="absolute top-2 right-3" style={{ animation: 'float 3s ease-in-out infinite', opacity: 0.25 }}>
            <Sparkles size={16} style={{ color: tokens.color('y') }} />
          </div>

          <InlineTextEditor
            {...questionEditor}
            className={`text-[12px] font-bold leading-relaxed mb-3 ${isCompact ? 'canvas-truncate-2' : ''}`}
            style={{ fontSize: 'inherit', wordBreak: 'break-word', overflowWrap: 'break-word' }}
            placeholder="Ketik pertanyaan..."
          />

          {/* ── Options — 2-column grid (Klasik) ──────────────────── */}
          <div className="grid grid-cols-2 gap-2.5" style={{ overflow: 'hidden' }}>
            {(q.opts || []).map((opt, i) => {
              const isAnswered = answers[current] !== undefined;
              const isCorrect = i === q.ans;
              const isPicked = answers[current] === i;
              const bg = !isAnswered
                ? tokens.subtleBg(0.06)
                : isCorrect
                  ? `linear-gradient(135deg, ${tokens.colorAlpha('g', 0.15)}, ${tokens.colorAlpha('g', 0.08)})`
                  : isPicked
                    ? `linear-gradient(135deg, ${tokens.colorAlpha('r', 0.15)}, ${tokens.colorAlpha('r', 0.08)})`
                    : tokens.subtleBg(0.06);
              const bdr = !isAnswered ? tokens.subtleBorder(0.1) : isCorrect ? tokens.color('g') : isPicked ? tokens.color('r') : tokens.subtleBorder(0.1);
              const bxSh = !isAnswered ? 'none' : isCorrect ? ('0 0 16px ' + tokens.colorAlpha('g', 0.25)) : isPicked ? ('0 0 16px ' + tokens.colorAlpha('r', 0.25)) : 'none';

              return (
                <MicroInteraction key={`kuis-opt-${block.id || 'kuis'}-${current}-${i}`} tokens={tokens} accent={isAnswered ? (isCorrect ? 'g' : isPicked ? 'r' : 'y') : 'y'} effect="squish">
                  <button
                    disabled={isAnswered}
                    onClick={() => handleAnswer(current, i)}
                    aria-pressed={answers[current] === i}
                    className={`p-2.5 rounded-xl font-bold text-center transition-all hover:scale-[1.03] min-w-0 ${isCompact ? 'canvas-truncate-1' : ''}`}
                    style={{
                      fontSize: '13px',
                      background: bg,
                      border: `2px solid ${bdr}`,
                      boxShadow: bxSh,
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      color: tokens.color('text'),
                      cursor: isAnswered ? 'default' : 'pointer',
                    }}>
                    {opt}
                    {/* Correct answer sparkle */}
                    {isAnswered && isCorrect && (
                      <div className="absolute -top-1 -right-1" style={{ animation: 'sparkle 1s ease-in-out infinite' }}>
                        <Sparkles size={10} style={{ color: tokens.color('g') }} />
                      </div>
                    )}
                  </button>
                </MicroInteraction>
              );
            })}
          </div>

          {/* ── Answer feedback — premium glassmorphism ──────────────── */}
          {answers[current] !== undefined && (
            <div className="mt-3 p-3 rounded-xl leading-relaxed"
              style={{
                fontSize: '12px',
                background: answers[current] === q.ans
                  ? `linear-gradient(135deg, ${tokens.colorAlpha('g', 0.1)}, ${tokens.colorAlpha('g', 0.04)})`
                  : `linear-gradient(135deg, ${tokens.colorAlpha('r', 0.1)}, ${tokens.colorAlpha('r', 0.04)})`,
                border: `1px solid ${answers[current] === q.ans ? tokens.colorAlpha('g', 0.35) : tokens.colorAlpha('r', 0.35)}`,
                boxShadow: answers[current] === q.ans
                  ? `0 0 12px ${tokens.colorAlpha('g', 0.1)}`
                  : `0 0 12px ${tokens.colorAlpha('r', 0.1)}`,
                color: answers[current] === q.ans ? tokens.color('g') : tokens.color('r'),
                overflow: 'hidden',
                wordBreak: 'break-word',
                animation: 'popIn 0.3s ease-out',
              }}>
              {answers[current] === q.ans ? <CheckCircle2 size={14} className="inline mr-1" /> : <XCircle size={14} className="inline mr-1" />}
              <InlineTextEditor
                {...explanationEditor}
                className={`text-[10px] ${isCompact ? 'canvas-truncate-2' : ''}`}
                style={{ color: 'inherit', fontSize: 'inherit', overflowWrap: 'break-word' }}
                placeholder="Ketik penjelasan..."
              />
            </div>
          )}
        </div>
      )}

      {/* ── Variant B: Kartu — single column larger card ─────────── */}
      {effectiveVariant === 'B' && (
        <KuisVariantKartu
          q={q}
          current={current}
          block={block}
          answers={answers}
          interactive={interactive}
          isCompact={isCompact}
          tokens={tokens}
          questionEditor={questionEditor}
          explanationEditor={explanationEditor}
          onAnswer={handleAnswer}
        />
      )}

      {/* ── Variant C: Ringkas — compact pill buttons ────────────── */}
      {effectiveVariant === 'C' && (
        <KuisVariantRingkas
          q={q}
          current={current}
          block={block}
          answers={answers}
          interactive={interactive}
          isCompact={isCompact}
          tokens={tokens}
          totalAnswered={totalAnswered}
          questionsLength={questions.length}
          questionEditor={questionEditor}
          explanationEditor={explanationEditor}
          onAnswer={handleAnswer}
        />
      )}

      {/* ── Next button — premium spring ─────────────────────────── */}
      {answers[current] !== undefined && current < questions.length - 1 && (
        <MicroInteraction tokens={tokens} accent="y" effect="bounce">
          <button className="px-5 py-2.5 rounded-xl font-extrabold transition-all hover:scale-105"
            aria-label="Lanjut ke soal berikutnya"
            onClick={() => { setCurrent(current + 1); playSound('click'); }}
            style={{
              fontSize: '13px',
              background: 'linear-gradient(135deg, ' + tokens.color('y') + ', ' + tokens.color('o') + ')',
              color: tokens.color('bg'),
              boxShadow: '0 4px 16px ' + tokens.colorAlpha('y', 0.35),
              animation: 'springBounce 0.4s ease',
            }}>
            <Zap size={14} className="inline mr-1" /> Lanjut →
          </button>
        </MicroInteraction>
      )}
    </div>
    </PremiumBlockWrapper>
  );
});
