'use client';

import React from 'react';
import { Trophy, Star, Dumbbell, RotateCcw, Gamepad2, CheckCircle2, XCircle, Flame } from 'lucide-react';
import type { KuisBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti } from '@/lib/confetti';

export function KuisRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex }: {
  block: KuisBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number;
}) {
  const [current, setCurrent] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = React.useState(false);
  const [streak, setStreak] = React.useState(0);
  const [showStreak, setShowStreak] = React.useState(false);

  const questions = block.questions || [];
  const q = questions[current];
  const totalAnswered = Object.keys(answers).length;
  const totalCorrect = Object.entries(answers).filter(([idx, ans]) => questions[Number(idx)]?.ans === ans).length;
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

  // Report score on completion
  React.useEffect(() => {
    if (isCompleted && interactive && block.id) {
      reportScore({
        elementId: block.id,
        pageIndex: pageIndex ?? 0,
        score: totalCorrect * 20,
        maxScore: questions.length * 20,
        completed: true,
      });
      // Play tier-appropriate sound
      const pct = Math.round((totalCorrect / questions.length) * 100);
      if (pct >= 80) { playSound('complete'); fireConfetti({ count: 60 }); }
      else if (pct >= 50) { playSound('complete'); fireConfetti({ count: 30 }); }
      else playSound('ding');
    }
  }, [isCompleted]);

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

  // ══ COMPLETION SCREEN ═══════════════════════════════════════
  if (isCompleted) {
    const pct = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;
    return (
      <div className="text-center p-5">
        <div className="text-3xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>
          {pct >= 80 ? <Trophy size={28} className="inline text-app-accent" /> : pct >= 50 ? <Star size={28} className="inline text-app-accent" /> : <Dumbbell size={28} className="inline text-app-accent" />}
        </div>
        <div className="font-black text-lg mb-1" style={{ fontFamily: tokens.fontFamily('display'), color: tokens.color('y') }}>
          {pct >= 80 ? 'Luar Biasa!' : pct >= 50 ? 'Bagus!' : 'Terus Berlatih!'}
        </div>
        <div className="mb-4" style={{ fontSize: '13px', color: tokens.muted(0.8) }}>
          Skor kamu: {totalCorrect}/{questions.length} ({pct}%)
        </div>
        <div className="flex justify-center gap-3">
          <div className="px-4 py-2 rounded-xl"
            style={{ background: tokens.colorAlpha('g', 0.12), border: '1px solid ' + tokens.colorAlpha('g', 0.3) }}>
            <div className="font-extrabold" style={{ fontSize: '12px', color: tokens.color('g') }}>Benar</div>
            <div className="font-black" style={{ color: tokens.color('g') }}>{totalCorrect}</div>
          </div>
          <div className="px-4 py-2 rounded-xl"
            style={{ background: tokens.colorAlpha('r', 0.12), border: '1px solid ' + tokens.colorAlpha('r', 0.3) }}>
            <div className="font-extrabold" style={{ fontSize: '12px', color: tokens.color('r') }}>Salah</div>
            <div className="font-black" style={{ color: tokens.color('r') }}>{questions.length - totalCorrect}</div>
          </div>
        </div>
        {interactive && (
          <button className="mt-4 px-5 py-2 rounded-xl font-extrabold transition-all hover:scale-105"
            onClick={() => { setAnswers({}); setCurrent(0); playSound('click'); }}
            style={{
              fontSize: '13px',
              background: 'linear-gradient(135deg, ' + tokens.color('y') + ', ' + tokens.color('o') + ')',
              color: tokens.color('bg'),
              boxShadow: '0 4px 16px ' + tokens.colorAlpha('y', 0.35),
            }}>
            <RotateCcw size={14} className="inline" /> Ulangi
          </button>
        )}
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="space-y-3">
      {/* Header with progress */}
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="font-extrabold" style={{ fontSize: '13px', color: tokens.color('y') }}>
            <Gamepad2 size={14} className="inline" /> <InlineTextEditor
              {...titleEditor}
              className="text-[11px] font-extrabold"
              style={{ color: tokens.color('y'), fontSize: 'inherit' }}
              placeholder="Ketik judul kuis..."
            />
          </div>
          {/* Streak indicator */}
          {currentStreak >= 2 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{
                background: tokens.colorAlpha('o', 0.15),
                border: '1px solid ' + tokens.colorAlpha('o', 0.4),
                animation: 'popIn 0.3s ease-out',
              }}>
              <Flame size={12} style={{ color: tokens.color('o') }} />
              <span className="font-black" style={{ fontSize: '10px', color: tokens.color('o') }}>
                {currentStreak}x Streak!
              </span>
            </div>
          )}
        </div>
        <span className="px-2.5 py-1 rounded-full font-extrabold"
          style={{
            fontSize: '11px',
            background: tokens.colorAlpha('y', 0.15),
            color: tokens.color('y'),
            border: '1px solid ' + tokens.colorAlpha('y', 0.3),
          }}>
          {current + 1}/{questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden"
        style={{ background: tokens.subtleBg(0.08) }}>
        <div className="h-full rounded-full transition-all"
          style={{
            width: (totalAnswered / questions.length) * 100 + '%',
            background: 'linear-gradient(90deg, ' + tokens.color('y') + ', ' + tokens.color('g') + ')',
            boxShadow: '0 0 8px ' + tokens.colorAlpha('y', 0.3),
          }} />
      </div>

      {/* Question card */}
      <div className="p-4 rounded-xl"
        style={{
          background: tokens.colorAlpha('y', 0.06),
          border: '1px solid ' + tokens.colorAlpha('y', 0.2),
          boxShadow: tokens.raw.shadow.card,
          overflow: 'hidden',
        }}>
        <InlineTextEditor
          {...questionEditor}
          className="text-[12px] font-bold leading-relaxed mb-3"
          style={{ fontSize: 'inherit', wordBreak: 'break-word', overflowWrap: 'break-word' }}
          placeholder="Ketik pertanyaan..."
        />
        <div className="grid grid-cols-2 gap-2.5" style={{ overflow: 'hidden' }}>
          {(q.opts || []).map((opt, i) => {
            const isAnswered = answers[current] !== undefined;
            const isCorrect = i === q.ans;
            const isPicked = answers[current] === i;
            const bg = !isAnswered ? tokens.subtleBg(0.06) : isCorrect ? tokens.colorAlpha('g', 0.15) : isPicked ? tokens.colorAlpha('r', 0.15) : tokens.subtleBg(0.06);
            const bdr = !isAnswered ? tokens.subtleBorder(0.1) : isCorrect ? tokens.color('g') : isPicked ? tokens.color('r') : tokens.subtleBorder(0.1);
            const bxSh = !isAnswered ? 'none' : isCorrect ? ('0 0 12px ' + tokens.colorAlpha('g', 0.2)) : isPicked ? ('0 0 12px ' + tokens.colorAlpha('r', 0.2)) : 'none';
            return (
              <button key={`kuis-opt-${i}-${String(opt).slice(0,10)}`} disabled={isAnswered}
                onClick={() => {
                  if (interactive && !isAnswered) {
                    setAnswers(prev => ({ ...prev, [current]: i }));
                    // Play sound based on answer
                    if (i === q.ans) playSound('correct');
                    else playSound('incorrect');
                  }
                }}
                className="p-2.5 rounded-xl font-bold text-center transition-all hover:scale-[1.02] min-w-0"
                style={{ fontSize: '13px', background: bg, border: '2px solid ' + bdr, boxShadow: bxSh, wordBreak: 'break-word', overflowWrap: 'break-word', color: tokens.color('text') }}>
                {opt}
              </button>
            );
          })}
        </div>
        {/* Answer feedback */}
        {answers[current] !== undefined && (
          <div className="mt-3 p-3 rounded-xl leading-relaxed"
            style={{
              fontSize: '12px',
              background: answers[current] === q.ans ? tokens.colorAlpha('g', 0.1) : tokens.colorAlpha('r', 0.1),
              border: '1px solid ' + (answers[current] === q.ans ? tokens.colorAlpha('g', 0.3) : tokens.colorAlpha('r', 0.3)),
              color: answers[current] === q.ans ? tokens.color('g') : tokens.color('r'),
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}>
            {answers[current] === q.ans ? <CheckCircle2 size={14} className="inline mr-1" /> : <XCircle size={14} className="inline mr-1" />}<InlineTextEditor
              {...explanationEditor}
              className="text-[10px]"
              style={{ color: 'inherit', fontSize: 'inherit', overflowWrap: 'break-word' }}
              placeholder="Ketik penjelasan..."
            />
          </div>
        )}
      </div>

      {/* Next button */}
      {answers[current] !== undefined && current < questions.length - 1 && (
        <button className="px-5 py-2 rounded-xl font-extrabold transition-all hover:scale-105"
          onClick={() => { setCurrent(current + 1); playSound('click'); }}
          style={{
            fontSize: '13px',
            background: 'linear-gradient(135deg, ' + tokens.color('y') + ', ' + tokens.color('o') + ')',
            color: tokens.color('bg'),
            boxShadow: '0 4px 16px ' + tokens.colorAlpha('y', 0.35),
          }}>
          Lanjut →
        </button>
      )}
    </div>
  );
}
