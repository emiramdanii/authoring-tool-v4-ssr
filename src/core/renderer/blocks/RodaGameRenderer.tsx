'use client';

import React from 'react';
import { RotateCcw, MessageCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { RodaGameBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti } from '@/lib/confetti';

export function RodaGameRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex }: {
  block: RodaGameBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number;
}) {
  const [current, setCurrent] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
  const [spinning, setSpinning] = React.useState(false);
  const [spinRotation, setSpinRotation] = React.useState(0);
  const [showQuestion, setShowQuestion] = React.useState(false);

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
      if (pct >= 80) { playSound('complete'); fireConfetti({ count: 50 }); }
      else playSound('ding');
    }
  }, [isCompleted]);

  // ── Spin animation handler ─────────────────────────────────
  const handleSpin = () => {
    if (spinning || !interactive) return;
    setSpinning(true);
    setShowQuestion(false);
    playSound('tap');

    // Calculate target rotation: 3-5 full rotations + land on current question
    const extraRotations = 3 + Math.floor(Math.random() * 3); // 3-5 full spins
    const segmentAngle = 360 / questions.length;
    const targetSegment = current;
    const targetAngle = extraRotations * 360 + (360 - targetSegment * segmentAngle - segmentAngle / 2);
    const newRotation = spinRotation + targetAngle;
    setSpinRotation(newRotation);

    // After spin completes, show the question
    setTimeout(() => {
      setSpinning(false);
      setShowQuestion(true);
      playSound('ding');
    }, 2800);
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
            onClick={() => { setAnswers({}); setCurrent(0); setSpinRotation(0); setShowQuestion(false); playSound('click'); }}
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

  // ── Determine if current question is answered ────────────────
  const isCurrentAnswered = answers[current] !== undefined;

  // ── Wheel size (responsive) ──────────────────────────────────
  const wheelSize = isCompact ? 120 : 160;
  const wheelRadius = wheelSize / 2;

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
        {/* ═══ BIG SPINNING WHEEL ══════════════════════════════════ */}
        {!isCurrentAnswered && (
          <div className="flex justify-center mb-4">
            <div className="relative" style={{ width: wheelSize + 24, height: wheelSize + 24 }}>
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: spinning
                    ? `0 0 40px ${tokens.colorAlpha('c', 0.4)}, 0 0 80px ${tokens.colorAlpha('c', 0.15)}`
                    : `0 0 20px ${tokens.colorAlpha('c', 0.15)}`,
                  transition: 'box-shadow 0.3s ease',
                }} />

              {/* Pointer arrow at top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
                style={{
                  fontSize: '18px',
                  color: tokens.color('y'),
                  filter: `drop-shadow(0 2px 6px ${tokens.colorAlpha('y', 0.6)})`,
                  transform: 'translateX(-50%)',
                }}>
                ▼
              </div>

              {/* Wheel container with spin */}
              <div className="rounded-full overflow-hidden"
                style={{
                  width: wheelSize,
                  height: wheelSize,
                  margin: '12px auto 0',
                  border: `4px solid ${tokens.color('c')}`,
                  transform: `rotate(${spinRotation}deg)`,
                  transition: spinning
                    ? 'transform 2.8s cubic-bezier(0.17, 0.67, 0.05, 0.99)'
                    : 'none',
                  boxShadow: `inset 0 0 20px rgba(0,0,0,0.3)`,
                }}>
                <svg viewBox="0 0 200 200" width={wheelSize} height={wheelSize}>
                  {questions.map((_, i) => {
                    const angle = (360 / questions.length) * i;
                    const nextAngle = (360 / questions.length) * (i + 1);
                    const startRad = (angle - 90) * Math.PI / 180;
                    const endRad = (nextAngle - 90) * Math.PI / 180;
                    const x1 = 100 + 96 * Math.cos(startRad);
                    const y1 = 100 + 96 * Math.sin(startRad);
                    const x2 = 100 + 96 * Math.cos(endRad);
                    const y2 = 100 + 96 * Math.sin(endRad);
                    const largeArc = (nextAngle - angle) > 180 ? 1 : 0;
                    const color = wheelColors[i % wheelColors.length];
                    const isAnswered = answers[i] !== undefined;
                    const isCurrent = i === current;

                    return (
                      <g key={i}>
                        <path
                          d={`M100,100 L${x1},${y1} A96,96 0 ${largeArc},1 ${x2},${y2} Z`}
                          fill={color}
                          opacity={isCurrent ? 1 : isAnswered ? 0.5 : 0.7}
                          stroke={tokens.isDark() ? '#0e1c2f' : '#ffffff'}
                          strokeWidth="2"
                        />
                        {/* Question number */}
                        <text
                          x={100 + 60 * Math.cos((startRad + endRad) / 2)}
                          y={100 + 60 * Math.sin((startRad + endRad) / 2)}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={tokens.isDark() ? '#0e1c2f' : '#ffffff'}
                          fontSize="16"
                          fontWeight="900"
                        >
                          {i + 1}
                        </text>
                        {/* Answered indicator (checkmark or X) */}
                        {isAnswered && (
                          <text
                            x={100 + 60 * Math.cos((startRad + endRad) / 2)}
                            y={100 + 60 * Math.sin((startRad + endRad) / 2) + 14}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="10"
                          >
                            {questions[i]?.opts?.[answers[i]]?.correct ? '✓' : '✗'}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  {/* Center circle */}
                  <circle cx="100" cy="100" r="22" fill={tokens.isDark() ? '#0e1c2f' : '#ffffff'} />
                  <circle cx="100" cy="100" r="18" fill={tokens.color('c')} opacity="0.9" />
                  <text x="100" y="100" textAnchor="middle" dominantBaseline="central" fill={tokens.isDark() ? '#0e1c2f' : '#ffffff'} fontSize="14" fontWeight="900">
                    🎡
                  </text>
                </svg>
              </div>

              {/* Progress dots around the wheel */}
              {questions.map((_, i) => {
                const answered = answers[i] !== undefined;
                if (!answered) return null;
                const angle = (360 / questions.length) * i - 90;
                const rad = angle * Math.PI / 180;
                const dotRadius = (wheelSize / 2) + 14;
                return (
                  <div key={i} className="absolute w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      left: `calc(50% + ${Math.cos(rad) * dotRadius}px - 8px)`,
                      top: `calc(50% + ${Math.sin(rad) * dotRadius}px - 8px + 6px)`,
                      background: questions[i]?.opts?.[answers[i]]?.correct ? tokens.color('g') : tokens.color('r'),
                      boxShadow: `0 0 8px ${questions[i]?.opts?.[answers[i]]?.correct ? tokens.colorAlpha('g', 0.5) : tokens.colorAlpha('r', 0.5)}`,
                      zIndex: 15,
                      border: `2px solid ${tokens.isDark() ? '#0e1c2f' : '#ffffff'}`,
                      fontSize: '8px',
                      color: '#ffffff',
                      fontWeight: 900,
                    }}>
                    {questions[i]?.opts?.[answers[i]]?.correct ? '✓' : '✗'}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Spin button */}
        {!isCurrentAnswered && interactive && (
          <div className="text-center mb-4">
            <button className="px-6 py-2.5 rounded-xl font-extrabold transition-all hover:scale-105"
              onClick={handleSpin}
              disabled={spinning}
              style={{
                fontSize: '14px',
                background: spinning
                  ? tokens.subtleBg(0.1)
                  : `linear-gradient(135deg, ${tokens.color('c')}, ${tokens.color('y')})`,
                color: tokens.color('bg'),
                boxShadow: spinning ? 'none' : `0 4px 16px ${tokens.colorAlpha('c', 0.35)}`,
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

        {/* Question — show after spinning or when answered */}
        {(showQuestion || isCurrentAnswered) && !spinning && (
          <div className="p-3 rounded-xl mb-3"
            style={{
              background: tokens.colorAlpha('y', 0.08),
              border: '1px solid ' + tokens.colorAlpha('y', 0.2),
              animation: 'fadeIn 0.4s ease',
            }}>
            <InlineTextEditor
              {...questionEditor}
              className="text-[12px] font-bold leading-relaxed"
              style={{ fontSize: 'inherit' }}
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
                <button key={i} disabled={isCurrentAnswered || spinning}
                  onClick={() => {
                    if (interactive && !isCurrentAnswered && !spinning) {
                      setAnswers(prev => ({ ...prev, [current]: i }));
                      if (opt.correct) playSound('correct');
                      else playSound('incorrect');
                    }
                  }}
                  className="w-full p-3 rounded-xl font-bold text-left transition-all hover:scale-[1.01] min-w-0 overflow-hidden"
                  style={{ fontSize: '13px', background: bg, border: '2px solid ' + border, boxShadow: boxShd, wordBreak: 'break-word' }}>
                  {opt.text}
                </button>
              );
            })}
          </div>
        )}

        {/* Feedback */}
        {isCurrentAnswered && q.opts[answers[current]] && (
          <div className="mt-3 p-3 rounded-xl leading-relaxed font-bold"
            style={{
              fontSize: '12px',
              background: q.opts[answers[current]].correct ? tokens.colorAlpha('g', 0.1) : tokens.colorAlpha('r', 0.1),
              border: '1px solid ' + (q.opts[answers[current]].correct ? tokens.colorAlpha('g', 0.3) : tokens.colorAlpha('r', 0.3)),
              color: q.opts[answers[current]].correct ? tokens.color('g') : tokens.color('r'),
              animation: 'fadeIn 0.3s ease',
            }}>
            {q.opts[answers[current]].correct ? <CheckCircle2 size={14} className="inline mr-1" /> : <XCircle size={14} className="inline mr-1" />}
            {q.opts[answers[current]].correct ? (q.feedbackCorrect || 'Benar!') : (q.feedbackWrong || 'Kurang tepat.')}
          </div>
        )}

        {/* Next button */}
        {isCurrentAnswered && current < questions.length - 1 && (
          <button className="mt-3 px-5 py-2 rounded-xl font-extrabold transition-all hover:scale-105"
            onClick={() => { setCurrent(current + 1); setShowQuestion(false); playSound('click'); }}
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
