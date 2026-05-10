'use client';

import React from 'react';
import type { KuisBlock } from '../../schema/types';
import type { TokenResolver } from '../types';

export function KuisRenderer({ block, tokens, interactive, isCompact }: {
  block: KuisBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean;
}) {
  const [current, setCurrent] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});

  const q = block.questions[current];
  if (!q) return null;

  const totalAnswered = Object.keys(answers).length;
  const totalCorrect = Object.entries(answers).filter(([idx, ans]) => ans === block.questions[Number(idx)]?.ans).length;

  return (
    <div className="space-y-3">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-extrabold" style={{ color: tokens.color('y') }}>
          🎮 {block.title}
        </div>
        <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold"
          style={{
            background: tokens.colorAlpha('y', 0.15),
            color: tokens.color('y'),
            border: '1px solid ' + tokens.colorAlpha('y', 0.3),
          }}>
          {current + 1}/{block.questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,.08)' }}>
        <div className="h-full rounded-full transition-all"
          style={{
            width: (totalAnswered / block.questions.length) * 100 + '%',
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
        }}>
        <div className="text-[12px] font-bold leading-relaxed mb-3">{q.q}</div>
        <div className="grid grid-cols-2 gap-2.5">
          {q.opts.map((opt, i) => {
            const isAnswered = answers[current] !== undefined;
            const isCorrect = i === q.ans;
            const isPicked = answers[current] === i;
            const bg = !isAnswered ? 'rgba(255,255,255,.06)' : isCorrect ? tokens.colorAlpha('g', 0.15) : isPicked ? tokens.colorAlpha('r', 0.15) : 'rgba(255,255,255,.06)';
            const bdr = !isAnswered ? 'rgba(255,255,255,.1)' : isCorrect ? tokens.color('g') : isPicked ? tokens.color('r') : 'rgba(255,255,255,.1)';
            const bxSh = !isAnswered ? 'none' : isCorrect ? ('0 0 12px ' + tokens.colorAlpha('g', 0.2)) : isPicked ? ('0 0 12px ' + tokens.colorAlpha('r', 0.2)) : 'none';
            return (
              <button key={i} disabled={isAnswered}
                onClick={() => interactive && setAnswers(prev => ({ ...prev, [current]: i }))}
                className="p-2.5 rounded-xl text-[11px] font-bold text-center transition-all hover:scale-[1.02]"
                style={{ background: bg, border: '2px solid ' + bdr, boxShadow: bxSh }}>
                {opt}
              </button>
            );
          })}
        </div>
        {/* Answer feedback */}
        {answers[current] !== undefined && (
          <div className="mt-3 p-3 rounded-xl text-[10px] leading-relaxed"
            style={{
              background: answers[current] === q.ans ? tokens.colorAlpha('g', 0.1) : tokens.colorAlpha('r', 0.1),
              border: '1px solid ' + (answers[current] === q.ans ? tokens.colorAlpha('g', 0.3) : tokens.colorAlpha('r', 0.3)),
              color: answers[current] === q.ans ? tokens.color('g') : tokens.color('r'),
            }}>
            {answers[current] === q.ans ? '✅ ' : '❌ '}{q.ex}
          </div>
        )}
      </div>

      {/* Next button */}
      {answers[current] !== undefined && current < block.questions.length - 1 && (
        <button className="px-5 py-2 rounded-xl text-[11px] font-extrabold transition-all hover:scale-105"
          onClick={() => setCurrent(current + 1)}
          style={{
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
