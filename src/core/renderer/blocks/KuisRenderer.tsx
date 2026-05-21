'use client';

import React, { useState } from 'react';
import { RotateCcw, Gamepad2, CheckCircle2, XCircle, Flame } from 'lucide-react';
import type { KuisBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge } from './PremiumBlockEffects';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
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
  tokens,
}: {
  active: 'A' | 'B' | 'C';
  onChange: (v: 'A' | 'B' | 'C') => void;
  tokens: TokenResolver;
}) {
  const variants: Array<{ key: 'A' | 'B' | 'C'; label: string }> = [
    { key: 'A', label: 'Klasik' },
    { key: 'B', label: 'Kartu' },
    { key: 'C', label: 'Ringkas' },
  ];

  return (
    <div className="variant-selector" style={{ display: 'flex', gap: '4px', background: tokens.subtleBg(0.06), borderRadius: '9999px', padding: '3px' }}>
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
            background: active === v.key ? tokens.accentBg('y', 0.12) : 'transparent',
            color: active === v.key ? tokens.color('y') : tokens.muted(0.65),
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
        ...tokens.cardStyle(),
        overflow: 'hidden',
        position: 'relative',
      }}
    >
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
            ? tokens.subtleBg(0.04)
            : isCorrect
              ? tokens.accentBg('g', 0.08)
              : isPicked
                ? tokens.accentBg('r', 0.08)
                : tokens.subtleBg(0.04);
          const bdr = !isAnswered ? tokens.subtleBorder(0.1) : isCorrect ? tokens.color('g') : isPicked ? tokens.color('r') : tokens.subtleBorder(0.08);

          return (
              <button
                key={`kuis-kartu-opt-${block.id || 'kuis'}-${current}-${i}`}
                disabled={isAnswered}
                onClick={() => onAnswer(current, i)}
                aria-pressed={answers[current] === i}
                className={`p-4 rounded-xl font-bold text-left transition-all min-w-0 ${isCompact ? 'canvas-truncate-1' : ''}`}
                style={{
                  fontSize: '15px',
                  background: bg,
                  border: `1px solid ${bdr}`,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  color: tokens.color('text'),
                  cursor: isAnswered ? 'default' : 'pointer',
                }}
              >
                {opt}
              </button>
          );
        })}
      </div>

      {/* Answer feedback */}
      {isAnswered && (
        <div className="mt-4 p-4 rounded-xl leading-relaxed"
          style={{
            fontSize: '13px',
            background: answers[current] === q.ans
              ? tokens.accentBg('g', 0.06)
              : tokens.accentBg('r', 0.06),
            borderLeft: `3px solid ${answers[current] === q.ans ? tokens.color('g') : tokens.color('r')}`,
            color: answers[current] === q.ans ? tokens.color('g') : tokens.color('r'),
            overflow: 'hidden',
            wordBreak: 'break-word',
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
        ...tokens.cardStyle(),
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Inline progress indicator */}
      <div className="flex items-center gap-1.5 mb-2">
        <div className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: tokens.subtleBg(0.08) }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: (totalAnswered / questionsLength) * 100 + '%',
              background: tokens.color('y'),
            }}
          />
        </div>
        <span className="font-bold" style={{ fontSize: '10px', color: tokens.muted(0.65) }}>
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
            ? tokens.subtleBg(0.04)
            : isCorrect
              ? tokens.accentBg('g', 0.08)
              : isPicked
                ? tokens.accentBg('r', 0.08)
                : tokens.subtleBg(0.03);
          const bdr = !isAnswered ? tokens.subtleBorder(0.08) : isCorrect ? tokens.color('g') : isPicked ? tokens.color('r') : tokens.subtleBorder(0.06);

          return (
              <button
                key={`kuis-ringkas-opt-${block.id || 'kuis'}-${current}-${i}`}
                disabled={isAnswered}
                onClick={() => onAnswer(current, i)}
                aria-pressed={answers[current] === i}
                className={`px-3 py-1.5 rounded-full font-bold transition-all ${isCompact ? 'canvas-truncate-1' : ''}`}
                style={{
                  fontSize: '11px',
                  background: bg,
                  border: `1px solid ${bdr}`,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  color: tokens.color('text'),
                  cursor: isAnswered ? 'default' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {opt}
              </button>
          );
        })}
      </div>

      {/* Answer feedback — minimal */}
      {isAnswered && (
        <div className="mt-2 px-3 py-1.5 rounded-lg leading-snug"
          style={{
            fontSize: '10px',
            background: answers[current] === q.ans
              ? tokens.accentBg('g', 0.06)
              : tokens.accentBg('r', 0.06),
            borderLeft: `2px solid ${answers[current] === q.ans ? tokens.color('g') : tokens.color('r')}`,
            color: answers[current] === q.ans ? tokens.color('g') : tokens.color('r'),
            overflow: 'hidden',
            wordBreak: 'break-word',
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
      if (pct >= 50) { playSound('complete'); }
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
        if (optIndex === questions[qCurrent]?.ans) { playSound('correct'); }
        else playSound('incorrect');
      }
    },
    [interactive, answers, questions],
  );

  // ══ COMPLETION SCREEN — Clean & Calm ═══════════════════════
  if (isCompleted) {
    const pct = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;
    const tierColor = pct >= 80 ? 'y' : pct >= 50 ? 'g' : 'o';

    return (
      <PremiumBlockWrapper tokens={tokens} accent={tierColor} staggerIndex={0}>
        <ReadingProgressIndicator progress={1} tokens={tokens} accent={tierColor} height={2} position="top" />
        <div className="text-center p-5" style={{ maxWidth: tokens.narrowWidth(), margin: '0 auto' }}>

          {/* Score pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{
              background: tokens.accentBg(tierColor, 0.08),
              border: `1px solid ${tokens.colorAlpha(tierColor, 0.2)}`,
            }}>
            <span className="font-black text-xl" style={{ color: tokens.color(tierColor) }}>{pct}%</span>
            <span style={{ fontSize: '12px', color: tokens.muted(0.65) }}>{totalCorrect}/{questions.length}</span>
          </div>

          {/* Title */}
          <div className="font-bold text-lg mb-1" style={{ color: tokens.color('text') }}>
            {pct >= 80 ? 'Luar Biasa!' : pct >= 50 ? 'Bagus!' : 'Terus Berlatih!'}
          </div>
          <div className="mb-4" style={{ fontSize: '13px', color: tokens.muted(0.65) }}>
            Skor kamu: {totalCorrect}/{questions.length} benar
          </div>

          {/* Score breakdown */}
          <div className="flex justify-center gap-4 mb-4">
            <div className="flex items-center gap-1.5" style={{ fontSize: '12px', color: tokens.color('g') }}>
              <CheckCircle2 size={14} /> {totalCorrect} benar
            </div>
            <div className="flex items-center gap-1.5" style={{ fontSize: '12px', color: tokens.color('r') }}>
              <XCircle size={14} /> {questions.length - totalCorrect} salah
            </div>
          </div>

          {/* Best streak */}
          {currentStreak >= 2 && (
            <div className="mb-4 flex items-center justify-center gap-1.5" style={{ fontSize: '12px', color: tokens.color('o') }}>
              <Flame size={14} /> Streak: {currentStreak}x
            </div>
          )}

          {/* Replay button */}
          {interactive && (
              <button className="px-5 py-2.5 rounded-xl font-bold transition-all"
                onClick={() => { setAnswers({}); setCurrent(0); hasReportedRef.current = false; playSound('click'); }}
                style={{
                  fontSize: '13px',
                  background: tokens.accentBg(tierColor, 0.1),
                  color: tokens.color(tierColor),
                  border: `1px solid ${tokens.colorAlpha(tierColor, 0.2)}`,
                }}>
                <RotateCcw size={14} className="inline" /> Ulangi
              </button>
          )}
        </div>
      </PremiumBlockWrapper>
    );
  }

  if (!q) return null;

  // ══ IN-PROGRESS SCREEN ═══════════════════════════════════════════
  return (
    <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0}>
      <ReadingProgressIndicator progress={progress} tokens={tokens} accent="y" height={2} position="top" />
    <div className="space-y-3 game-block" style={{ maxWidth: tokens.narrowWidth(), margin: '0 auto' }} {...(interactive ? { role: 'application' } : {})} aria-label={`Kuis: Soal ${current + 1} dari ${questions.length}, Skor: ${totalCorrect}`} aria-describedby={`kuis-instructions-${block.id || 'kuis'}`} data-interactive>
      {/* Hidden instruction for screen readers */}
      <span id={`kuis-instructions-${block.id || 'kuis'}`} className="sr-only">Pilih jawaban yang benar untuk setiap soal kuis</span>
      {/* Screen reader live region for score updates */}
      <div className="sr-only" aria-live="polite" role="status">
        {answers[current] !== undefined && (answers[current] === q.ans ? 'Jawaban benar!' : 'Jawaban salah.')}
      </div>

      {/* ── Variant selector (only in editing mode) ──────────────── */}
      {isEditing && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 45 }}>
          <VariantSelector active={variant} onChange={setCurrentVariant} tokens={tokens} />
        </div>
      )}

      {/* ── Header with premium holographic bar ──────────────────── */}
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: tokens.accentBg('y', 0.08),
              border: `1px solid ${tokens.colorAlpha('y', 0.15)}`,
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
                background: tokens.accentBg('o', 0.08),
                border: `1px solid ${tokens.colorAlpha('o', 0.2)}`,
              }}>
              <Flame size={12} style={{ color: tokens.color('o') }} />
              <span className="font-bold" style={{ fontSize: '10px', color: tokens.color('o') }}>
                {currentStreak}x Streak
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
      <div className="h-1 rounded-full overflow-hidden"
        style={{ background: tokens.subtleBg(0.08) }}
        role="progressbar" aria-label={`Progres kuis ${totalAnswered} dari ${questions.length}`} aria-valuenow={totalAnswered} aria-valuemin={0} aria-valuemax={questions.length}>
        <div className="h-full rounded-full transition-all"
          style={{
            width: (totalAnswered / questions.length) * 100 + '%',
            background: tokens.color('y'),
          }} />
      </div>
      )}

      {/* ══ VARIANT-CONDITIONAL QUESTION AREA ═══════════════════════ */}

      {/* ── Variant A: Klasik — the original 2-column grid layout ── */}
      {effectiveVariant === 'A' && (
        <div className="p-4 rounded-xl"
          style={{
            ...tokens.cardStyle(),
            overflow: 'hidden',
            position: 'relative',
          }}>

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
                ? tokens.subtleBg(0.04)
                : isCorrect
                  ? tokens.accentBg('g', 0.08)
                  : isPicked
                    ? tokens.accentBg('r', 0.08)
                    : tokens.subtleBg(0.04);
              const bdr = !isAnswered ? tokens.subtleBorder(0.1) : isCorrect ? tokens.color('g') : isPicked ? tokens.color('r') : tokens.subtleBorder(0.08);

              return (
                  <button
                    key={`kuis-opt-${block.id || 'kuis'}-${current}-${i}`}
                    disabled={isAnswered}
                    onClick={() => handleAnswer(current, i)}
                    aria-pressed={answers[current] === i}
                    className={`p-2.5 rounded-xl font-bold text-center transition-all min-w-0 ${isCompact ? 'canvas-truncate-1' : ''}`}
                    style={{
                      fontSize: '13px',
                      background: bg,
                      border: `1px solid ${bdr}`,
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      color: tokens.color('text'),
                      cursor: isAnswered ? 'default' : 'pointer',
                    }}>
                    {opt}
                  </button>
              );
            })}
          </div>

          {/* ── Answer feedback ──────────────── */}
          {answers[current] !== undefined && (
            <div className="mt-3 p-3 rounded-xl leading-relaxed"
              style={{
                fontSize: '12px',
                background: answers[current] === q.ans
                  ? tokens.accentBg('g', 0.06)
                  : tokens.accentBg('r', 0.06),
                borderLeft: `3px solid ${answers[current] === q.ans ? tokens.color('g') : tokens.color('r')}`,
                color: answers[current] === q.ans ? tokens.color('g') : tokens.color('r'),
                overflow: 'hidden',
                wordBreak: 'break-word',
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
          <button className="px-5 py-2.5 rounded-xl font-bold transition-all"
            aria-label="Lanjut ke soal berikutnya"
            onClick={() => { setCurrent(current + 1); playSound('click'); }}
            style={{
              fontSize: '13px',
              background: tokens.accentBg('y', 0.1),
              color: tokens.color('y'),
              border: `1px solid ${tokens.colorAlpha('y', 0.2)}`,
            }}>
            Lanjut →
          </button>
      )}
    </div>
    </PremiumBlockWrapper>
  );
});
