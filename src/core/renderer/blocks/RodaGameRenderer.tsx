'use client';

import React from 'react';
import type { RodaGameBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

export function RodaGameRenderer({ block, tokens, interactive, isCompact, isEditing }: {
  block: RodaGameBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean;
}) {
  const [current, setCurrent] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});

  const questions = block.questions || [];
  const q = questions[current];
  const totalCorrect = Object.entries(answers).filter(([idx, ans]) => questions[Number(idx)]?.opts?.[ans]?.correct).length;
  const totalAnswered = Object.keys(answers).length;
  const isCompleted = totalAnswered >= questions.length && questions.length > 0;

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
        <div className="text-[11px] text-white/55 mb-4">
          Skor: {totalCorrect}/{questions.length} ({pct}%)
        </div>
        {interactive && (
          <button className="px-5 py-2 rounded-xl text-[11px] font-extrabold transition-all hover:scale-105"
            onClick={() => { setAnswers({}); setCurrent(0); }}
            style={{
              background: 'linear-gradient(135deg, ' + tokens.color('c') + ', ' + tokens.color('y') + ')',
              color: tokens.color('bg'),
              boxShadow: '0 4px 16px ' + tokens.colorAlpha('c', 0.35),
            }}>
            🔄 Ulangi Roda
          </button>
        )}
      </div>
    );
  }

  if (!q) return null;

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
          <span className="text-[10px] font-extrabold" style={{ color: tokens.color('c'), fontFamily: tokens.fontFamily('display') }}>
            🎡 <InlineTextEditor
              {...titleEditor}
              className="text-[10px] font-extrabold"
              style={{ color: tokens.color('c'), fontFamily: tokens.fontFamily('display'), fontSize: 'inherit' }}
              placeholder="Ketik judul..."
            />
          </span>
          <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold"
            style={{
              background: tokens.colorAlpha('c', 0.15),
              color: tokens.color('c'),
              border: '1px solid ' + tokens.colorAlpha('c', 0.3),
            }}>
            {current + 1}/{questions.length}
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Discussion hint */}
        {q.diskusiHint && (
          <div className="mb-3 p-3 rounded-xl"
            style={{
              background: tokens.colorAlpha('c', 0.08),
              border: '1px solid ' + tokens.colorAlpha('c', 0.25),
              borderLeft: '3px solid ' + tokens.color('c'),
            }}>
            <div className="text-[10px] leading-relaxed"><strong style={{ color: tokens.color('c') }}>💬 Diskusi:</strong> <InlineTextEditor
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
            let bg = 'rgba(255,255,255,.05)';
            let border = 'rgba(255,255,255,.1)';
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
              <button key={i} disabled={isAnswered}
                onClick={() => interactive && setAnswers(prev => ({ ...prev, [current]: i }))}
                className="w-full p-3 rounded-xl text-[11px] font-bold text-left transition-all hover:scale-[1.01]"
                style={{ background: bg, border: '2px solid ' + border, boxShadow: boxShd }}>
                {opt.text}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {answers[current] !== undefined && q.opts[answers[current]] && (
          <div className="mt-3 p-3 rounded-xl text-[10px] leading-relaxed font-bold"
            style={{
              background: q.opts[answers[current]].correct ? tokens.colorAlpha('g', 0.1) : tokens.colorAlpha('r', 0.1),
              border: '1px solid ' + (q.opts[answers[current]].correct ? tokens.colorAlpha('g', 0.3) : tokens.colorAlpha('r', 0.3)),
              color: q.opts[answers[current]].correct ? tokens.color('g') : tokens.color('r'),
            }}>
            {q.opts[answers[current]].correct ? '✅ ' : '❌ '}
            {q.opts[answers[current]].correct ? (q.feedbackCorrect || 'Benar!') : (q.feedbackWrong || 'Kurang tepat.')}
          </div>
        )}

        {/* Next button */}
        {answers[current] !== undefined && current < questions.length - 1 && (
          <button className="mt-3 px-5 py-2 rounded-xl text-[11px] font-extrabold transition-all hover:scale-105"
            onClick={() => setCurrent(current + 1)}
            style={{
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
