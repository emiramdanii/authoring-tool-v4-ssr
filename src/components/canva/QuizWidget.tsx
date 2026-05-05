'use client';

import { useState, useCallback } from 'react';
import { useAuthoringStore, type KuisItem } from '@/store/authoring-store';

interface QuizWidgetProps {
  dataIdx?: number;
  compact?: boolean;  // small preview in canvas editor
}

const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizWidget({ dataIdx, compact = false }: QuizWidgetProps) {
  const kuis = useAuthoringStore((s) => s.kuis);

  // Get all quiz items - if dataIdx is set, use only that item; otherwise use all
  const allQuestions: KuisItem[] = dataIdx !== undefined && dataIdx >= 0 && dataIdx < kuis.length
    ? [kuis[dataIdx]]
    : kuis.filter(k => k.q.trim() !== '');

  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [phase, setPhase] = useState<'quiz' | 'result'>('quiz');

  const total = allQuestions.length;

  const handleAnswer = useCallback((optIdx: number) => {
    if (answered || !allQuestions[currentQ]) return;
    setSelectedOpt(optIdx);
    setAnswered(true);

    const isCorrect = optIdx === allQuestions[currentQ].ans;
    if (isCorrect) setScore(s => s + 1);

    // Auto-advance after 1.5s
    setTimeout(() => {
      if (currentQ + 1 < total) {
        setCurrentQ(q => q + 1);
        setSelectedOpt(null);
        setAnswered(false);
      } else {
        setPhase('result');
      }
    }, 1500);
  }, [answered, currentQ, allQuestions, total]);

  const handleRestart = useCallback(() => {
    setCurrentQ(0);
    setScore(0);
    setSelectedOpt(null);
    setAnswered(false);
    setPhase('quiz');
  }, []);

  // No questions state
  if (total === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-amber-500/10 rounded border border-amber-500/20 p-3">
        <span className="text-lg">❓</span>
        <span className="text-[10px] text-amber-300/70 mt-1">
          {compact ? 'Belum ada soal' : 'Tambahkan soal di panel Konten → Evaluasi'}
        </span>
      </div>
    );
  }

  // Result screen
  if (phase === 'result') {
    const pct = Math.round((score / total) * 100);
    const level = pct >= 85 ? 'Sangat Baik' : pct >= 70 ? 'Baik' : 'Perlu Latihan';
    const levelColor = pct >= 85 ? 'text-emerald-400' : pct >= 70 ? 'text-amber-400' : 'text-red-400';

    return (
      <div className="h-full flex flex-col items-center justify-center bg-amber-500/10 rounded border border-amber-500/20 p-3 text-center">
        <div className={`text-2xl font-black ${levelColor}`}>{pct}%</div>
        <div className="text-[10px] text-amber-200/80 mt-0.5">{level}</div>
        <div className="text-[9px] text-amber-300/60 mt-1">
          Skor: {score} dari {total} soal benar
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleRestart(); }}
          className="mt-2 px-3 py-1 bg-amber-500/30 hover:bg-amber-500/50 rounded text-[10px] font-bold text-amber-200 transition-colors border border-amber-500/30"
        >
          Ulangi Kuis
        </button>
      </div>
    );
  }

  // Quiz phase
  const q = allQuestions[currentQ];
  const progress = ((currentQ + 1) / total) * 100;

  return (
    <div
      className="h-full flex flex-col bg-amber-500/10 rounded border border-amber-500/20 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Progress bar */}
      {!compact && (
        <div className="h-1 bg-amber-500/20">
          <div
            className="h-full bg-amber-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Question number + score */}
      <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5">
        <span className="text-[9px] font-bold text-amber-300">
          Soal {currentQ + 1}/{total}
        </span>
        <span className="text-[9px] text-amber-400/60">
          Skor: {score}
        </span>
      </div>

      {/* Question text */}
      <div className="px-2 py-1.5 flex-1 min-h-0 overflow-y-auto">
        <p className={`font-bold text-amber-100 leading-snug ${compact ? 'text-[9px]' : 'text-[11px]'}`}>
          {q.q}
        </p>
      </div>

      {/* Options */}
      <div className="px-1.5 pb-1.5 space-y-1">
        {q.opts.map((opt, idx) => {
          if (!opt.trim()) return null;
          let bg = 'bg-white/5 hover:bg-white/10 border-white/10';
          let textCol = 'text-amber-100/90';
          let icon = '';

          if (answered) {
            if (idx === q.ans) {
              bg = 'bg-emerald-500/20 border-emerald-400/40';
              textCol = 'text-emerald-300';
              icon = ' ✅';
            } else if (idx === selectedOpt && idx !== q.ans) {
              bg = 'bg-red-500/20 border-red-400/40';
              textCol = 'text-red-300';
              icon = ' ❌';
            } else {
              bg = 'bg-white/[.02] border-white/5';
              textCol = 'text-white/30';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={answered}
              className={`w-full text-left px-2 py-1.5 rounded-md border transition-all duration-300 ${compact ? 'text-[8px] py-1 px-1.5' : 'text-[10px]'} ${bg} ${textCol} ${!answered ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span className="font-bold text-amber-400/80 mr-1">{LETTERS[idx]}.</span>
              {opt}{icon}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {answered && q.ex && (
        <div className={`px-2 pb-1.5 ${compact ? '' : ''}`}>
          <div className="bg-blue-500/10 border border-blue-400/20 rounded px-2 py-1">
            <span className={`font-bold text-blue-300 ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
              💡 {q.ex}
            </span>
          </div>
        </div>
      )}

      {/* Compact: auto-advance indicator */}
      {compact && answered && (
        <div className="px-2 pb-1 text-center">
          <span className="text-[8px] text-amber-400/50 animate-pulse">
            → Soal berikutnya...
          </span>
        </div>
      )}
    </div>
  );
}
