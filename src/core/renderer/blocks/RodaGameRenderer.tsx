'use client';

import React from 'react';
import { RotateCcw, MessageCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { RodaGameBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';

export function RodaGameRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex }: {
  block: RodaGameBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number;
}) {
  const [current, setCurrent] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
  const [spinning, setSpinning] = React.useState(false);
  const [spinTarget, setSpinTarget] = React.useState<number | null>(null);

  const questions = block.questions || [];
  const q = questions[current];
  const totalCorrect = Object.entries(answers).filter(([idx, ans]) => questions[Number(idx)]?.opts?.[ans]?.correct).length;
  const totalAnswered = Object.keys(answers).length;
  const isCompleted = totalAnswered >= questions.length && questions.length > 0;

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
      const pct = Math.round((totalCorrect / questions.length) * 100);
      if (pct >= 80) playSound('complete');
      else playSound('ding');
    }
  }, [isCompleted]);

  // ── Spin animation handler ─────────────────────────────────
  const handleSpin = () => {
    if (spinning || !interactive) return;
    setSpinning(true);
    playSound('tap');

    // Spin for 2 seconds then land on next question
    const nextQ = current < questions.length - 1 ? current + 1 : current;
    setSpinTarget(nextQ);

    setTimeout(() => {
      setSpinning(false);
      setSpinTarget(null);
      // Don't advance - just reveal the question. User answers to proceed.
      playSound('ding');
    }, 1500);
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

  // ══ COMPLETION SCREEN ═══════════════════════════════════════
  if (isCompleted) {
    const pct = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;
    return (
      <div className="rounded-2xl overflow-hidden p-6 text-center"
        style={{
          background: tokens.color('bg'),
          border: '2px solid ' + tokens.colorAlpha('c', 0.3),
          boxShadow: tokens.raw.shadow.elevated,
        }}>
        <div className="text-3xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>🎡</div>
        <div className="font-black text-lg mb-1" style={{ fontFamily: tokens.fontFamily('display'), color: tokens.color('c') }}>
          Roda Selesai!
        </div>
        <div className="mb-4" style={{ fontSize: '13px', color: tokens.muted(0.8) }}>
          Skor: {totalCorrect}/{questions.length} ({pct}%)
        </div>
        {interactive && (
          <button className="px-5 py-2 rounded-xl font-extrabold transition-all hover:scale-105"
            onClick={() => { setAnswers({}); setCurrent(0); playSound('click'); }}
            style={{
              fontSize: '13px',
              background: 'linear-gradient(135deg, ' + tokens.color('c') + ', ' + tokens.color('y') + ')',
              color: tokens.color('bg'),
              boxShadow: '0 4px 16px ' + tokens.colorAlpha('c', 0.35),
            }}>
            <RotateCcw size={14} className="inline" /> Ulangi Roda
          </button>
        )}
      </div>
    );
  }

  if (!q) return null;

  // ── Wheel segment colors ──────────────────────────────────────
  const wheelColors = ['#f9c12e', '#3ecfcf', '#34d399', '#a78bfa', '#ff6b6b', '#fb923c'];

  // ══ SPINNING WHEEL VIEW (before answering) ══════════════════
  const showWheel = answers[current] === undefined && interactive && !spinning;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: tokens.color('bg'),
        border: '2px solid ' + tokens.colorAlpha('c', 0.3),
        boxShadow: tokens.raw.shadow.elevated,
      }}>
      {/* Header */}
      <div className="p-3 border-b"
        style={{
          background: 'linear-gradient(90deg, ' + tokens.color('bg') + ', ' + tokens.color('bg2') + ')',
          borderColor: tokens.colorAlpha('c', 0.15),
        }}>
        <div className="flex items-center justify-between">
          <span className="font-extrabold" style={{ fontSize: '12px', color: tokens.color('c'), fontFamily: tokens.fontFamily('display') }}>
            🎡 <InlineTextEditor
              {...titleEditor}
              className="text-[10px] font-extrabold"
              style={{ color: tokens.color('c'), fontFamily: tokens.fontFamily('display'), fontSize: 'inherit' }}
              placeholder="Ketik judul..."
            />
          </span>
          <span className="px-2.5 py-1 rounded-full font-extrabold"
            style={{
              fontSize: '11px',
              background: tokens.colorAlpha('c', 0.15),
              color: tokens.color('c'),
              border: '1px solid ' + tokens.colorAlpha('c', 0.3),
            }}>
            {current + 1}/{questions.length}
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Mini spinning wheel indicator */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            {/* Outer ring */}
            <div className="w-16 h-16 rounded-full relative overflow-hidden"
              style={{
                border: '3px solid ' + tokens.color('c'),
                boxShadow: '0 0 20px ' + tokens.colorAlpha('c', 0.2),
                animation: spinning ? 'wheelSpin 1.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
              }}>
              {/* Wheel segments */}
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {questions.map((_, i) => {
                  const angle = (360 / questions.length) * i;
                  const nextAngle = (360 / questions.length) * (i + 1);
                  const startRad = (angle - 90) * Math.PI / 180;
                  const endRad = (nextAngle - 90) * Math.PI / 180;
                  const x1 = 50 + 48 * Math.cos(startRad);
                  const y1 = 50 + 48 * Math.sin(startRad);
                  const x2 = 50 + 48 * Math.cos(endRad);
                  const y2 = 50 + 48 * Math.sin(endRad);
                  const largeArc = (nextAngle - angle) > 180 ? 1 : 0;
                  const color = wheelColors[i % wheelColors.length];
                  const isCurrentSegment = i === current;

                  return (
                    <g key={i}>
                      <path
                        d={`M50,50 L${x1},${y1} A48,48 0 ${largeArc},1 ${x2},${y2} Z`}
                        fill={color}
                        opacity={isCurrentSegment ? 0.9 : 0.4}
                        stroke={tokens.isDark() ? '#1a1a2e' : '#ffffff'}
                        strokeWidth="1"
                      />
                      {/* Question number */}
                      <text
                        x={50 + 30 * Math.cos((startRad + endRad) / 2)}
                        y={50 + 30 * Math.sin((startRad + endRad) / 2)}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={tokens.isDark() ? '#1a1a2e' : '#ffffff'}
                        fontSize="8"
                        fontWeight="bold"
                      >
                        {i + 1}
                      </text>
                    </g>
                  );
                })}
                {/* Center circle */}
                <circle cx="50" cy="50" r="12" fill={tokens.isDark() ? '#1a1a2e' : '#ffffff'} />
                <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill={tokens.color('c')} fontSize="10" fontWeight="bold">
                  🎡
                </text>
              </svg>
            </div>
            {/* Pointer arrow */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2"
              style={{ color: tokens.color('y'), filter: 'drop-shadow(0 0 4px ' + tokens.colorAlpha('y', 0.5) + ')' }}>
              ▼
            </div>
            {/* Answered indicators around wheel */}
            {questions.map((_, i) => {
              const answered = answers[i] !== undefined;
              const angle = (360 / questions.length) * i - 90;
              const rad = angle * Math.PI / 180;
              const x = 50 + 40 * Math.cos(rad) / 100 * 16;
              const y = 50 + 40 * Math.sin(rad) / 100 * 16;
              return answered ? (
                <div key={i} className="absolute w-3 h-3 rounded-full"
                  style={{
                    left: `calc(50% + ${Math.cos(rad) * 36}px - 6px)`,
                    top: `calc(50% + ${Math.sin(rad) * 36}px - 6px)`,
                    background: questions[i]?.opts?.[answers[i]]?.correct ? tokens.color('g') : tokens.color('r'),
                    boxShadow: '0 0 6px ' + (questions[i]?.opts?.[answers[i]]?.correct ? tokens.colorAlpha('g', 0.5) : tokens.colorAlpha('r', 0.5)),
                    zIndex: 5,
                  }} />
              ) : null;
            })}
          </div>
        </div>

        {/* Spin button */}
        {showWheel && (
          <div className="text-center mb-4">
            <button className="px-6 py-2.5 rounded-xl font-extrabold transition-all hover:scale-105"
              onClick={handleSpin}
              style={{
                fontSize: '14px',
                background: 'linear-gradient(135deg, ' + tokens.color('c') + ', ' + tokens.color('y') + ')',
                color: tokens.color('bg'),
                boxShadow: '0 4px 16px ' + tokens.colorAlpha('c', 0.35),
                animation: 'pulseGlow 2s ease-in-out infinite',
              }}>
              🎡 Putar Roda!
            </button>
          </div>
        )}

        {/* Discussion hint */}
        {q.diskusiHint && (
          <div className="mb-3 p-3 rounded-xl"
            style={{
              background: tokens.colorAlpha('c', 0.08),
              border: '1px solid ' + tokens.colorAlpha('c', 0.25),
              borderLeft: '3px solid ' + tokens.color('c'),
            }}>
            <div className="leading-relaxed" style={{ fontSize: '12px' }}><strong style={{ color: tokens.color('c') }}><MessageCircle size={14} className="inline" /> Diskusi:</strong> <InlineTextEditor
              {...diskusiHintEditor}
              className="text-[10px]"
              style={{ fontSize: 'inherit' }}
              placeholder="Ketik hint diskusi..."
            /></div>
          </div>
        )}

        {/* Question */}
        <div className="p-3 rounded-xl mb-3"
          style={{
            background: tokens.colorAlpha('y', 0.08),
            border: '1px solid ' + tokens.colorAlpha('y', 0.2),
            animation: spinning ? 'none' : 'fadeIn 0.4s ease',
          }}>
          <InlineTextEditor
            {...questionEditor}
            className="text-[12px] font-bold leading-relaxed"
            style={{ fontSize: 'inherit' }}
            placeholder="Ketik pertanyaan..."
          />
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {(q.opts || []).map((opt, i) => {
            const isAnswered = answers[current] !== undefined;
            let bg = tokens.subtleBg(0.05);
            let border = tokens.subtleBorder(0.1);
            let boxShd = 'none';
            if (isAnswered) {
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
              <button key={i} disabled={isAnswered || spinning}
                onClick={() => {
                  if (interactive && !isAnswered && !spinning) {
                    setAnswers(prev => ({ ...prev, [current]: i }));
                    if (opt.correct) playSound('correct');
                    else playSound('incorrect');
                  }
                }}
                className="w-full p-3 rounded-xl font-bold text-left transition-all hover:scale-[1.01] min-w-0"
                style={{ fontSize: '13px', background: bg, border: '2px solid ' + border, boxShadow: boxShd, opacity: spinning ? 0.5 : 1 }}>
                {opt.text}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {answers[current] !== undefined && q.opts[answers[current]] && (
          <div className="mt-3 p-3 rounded-xl leading-relaxed font-bold"
            style={{
              fontSize: '12px',
              background: q.opts[answers[current]].correct ? tokens.colorAlpha('g', 0.1) : tokens.colorAlpha('r', 0.1),
              border: '1px solid ' + (q.opts[answers[current]].correct ? tokens.colorAlpha('g', 0.3) : tokens.colorAlpha('r', 0.3)),
              color: q.opts[answers[current]].correct ? tokens.color('g') : tokens.color('r'),
            }}>
            {q.opts[answers[current]].correct ? <CheckCircle2 size={14} className="inline mr-1" /> : <XCircle size={14} className="inline mr-1" />}
            {q.opts[answers[current]].correct ? (q.feedbackCorrect || 'Benar!') : (q.feedbackWrong || 'Kurang tepat.')}
          </div>
        )}

        {/* Next button */}
        {answers[current] !== undefined && current < questions.length - 1 && (
          <button className="mt-3 px-5 py-2 rounded-xl font-extrabold transition-all hover:scale-105"
            onClick={() => { setCurrent(current + 1); playSound('click'); }}
            style={{
              fontSize: '13px',
              background: 'linear-gradient(135deg, ' + tokens.color('y') + ', ' + tokens.color('o') + ')',
              color: tokens.color('bg'),
              boxShadow: '0 4px 16px ' + tokens.colorAlpha('y', 0.35),
            }}>
            Soal Berikutnya →
          </button>
        )}
      </div>
    </div>
  );
}
