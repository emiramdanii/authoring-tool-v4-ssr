'use client';

import { useState, useEffect, useRef } from 'react';
import { EmptyState } from './shared';
import type { GameComponentProps } from './shared';

/* ═══════════════════════════════════════════════════════════════
   TEAM BUZZER GAME
   ═══════════════════════════════════════════════════════════════ */
export function TeamBuzzerGame({ data, compact, interactive, onComplete }: GameComponentProps) {
  const soal = (data.soal as Array<Record<string, unknown>>) || [];
  const validSoal = soal.filter(s => s.teks);
  const timA = (data.timA as string) || 'Tim A';
  const timB = (data.timB as string) || 'Tim B';

  const [currentQ, setCurrentQ] = useState(0);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [buzzed, setBuzzed] = useState<'A' | 'B' | null>(null);
  const [correct, setCorrect] = useState<'A' | 'B' | 'wrong' | null>(null); // 'wrong' prevents re-buzz
  const [phase, setPhase] = useState<'play' | 'result'>('play');
  const reported = useRef(false);

  useEffect(() => { if (phase === 'result' && !reported.current && onComplete) { reported.current = true; const total = validSoal.reduce((s, q) => s + ((q.poin as number) || 10), 0); onComplete(scoreA + scoreB, total); } }, [phase, onComplete, scoreA, scoreB, validSoal]);

  const handleBuzz = (team: 'A' | 'B') => {
    if (buzzed || correct === 'wrong') return; // Block buzzing while wrong answer pending
    setBuzzed(team);
  };

  const handleCorrect = (team: 'A' | 'B') => {
    const pts = (validSoal[currentQ]?.poin as number) || 10;
    if (team === 'A') setScoreA(s => s + pts);
    else setScoreB(s => s + pts);
    setCorrect(team);
    setTimeout(() => {
      if (currentQ + 1 < validSoal.length) {
        setCurrentQ(q => q + 1);
        setBuzzed(null);
        setCorrect(null);
      } else {
        setPhase('result');
      }
    }, 1500);
  };

  if (validSoal.length === 0) return <EmptyState icon="🏆" label="Kuis Tim" compact={compact} interactive={interactive} />;

  if (phase === 'result') {
    const winner = scoreA > scoreB ? timA : scoreB > scoreA ? timB : 'Seri';
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <span className="text-2xl">🏆</span>
        <div className="text-[11px] font-bold text-cyan-300 mt-1">{winner} Menang!</div>
        <div className="text-[9px] text-cyan-400/60 mt-0.5">{timA}: {scoreA} | {timB}: {scoreB}</div>
        <button onClick={() => { setCurrentQ(0); setScoreA(0); setScoreB(0); setBuzzed(null); setCorrect(null); setPhase('play'); reported.current = false; }}
          className="mt-2 px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30">
          Ulangi
        </button>
      </div>
    );
  }

  const q = validSoal[currentQ];

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2">
      <div className="flex justify-between text-[9px] text-cyan-400 mb-1">
        <span className="font-bold">Soal {currentQ + 1}/{validSoal.length}</span>
        <span>+{(q.poin as number) || 10} poin</span>
      </div>
      <p className={`text-cyan-100 font-bold flex-1 min-h-0 overflow-y-auto mb-1 ${compact ? 'text-[9px]' : 'text-[11px]'}`}>
        {q.teks as string}
      </p>
      <div className="flex gap-2 mb-1">
        <button onClick={() => handleBuzz('A')} disabled={!!buzzed || correct === 'wrong'}
          className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-all border ${
            correct === 'A' ? 'bg-emerald-500/30 border-emerald-400/40 text-emerald-300' :
            buzzed === 'A' ? 'bg-blue-500/30 border-blue-400/40 text-blue-300' :
            'bg-blue-500/15 hover:bg-blue-500/30 border-blue-400/20 text-blue-300 cursor-pointer'
          }`}>
          {timA} ({scoreA})
        </button>
        <button onClick={() => handleBuzz('B')} disabled={!!buzzed || correct === 'wrong'}
          className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-all border ${
            correct === 'B' ? 'bg-emerald-500/30 border-emerald-400/40 text-emerald-300' :
            buzzed === 'B' ? 'bg-orange-500/30 border-orange-400/40 text-orange-300' :
            'bg-orange-500/15 hover:bg-orange-500/30 border-orange-400/20 text-orange-300 cursor-pointer'
          }`}>
          {timB} ({scoreB})
        </button>
      </div>
      {buzzed && !correct && (
        <div className="flex gap-2">
          <button onClick={() => handleCorrect(buzzed)}
            className="flex-1 py-1 bg-emerald-500/20 hover:bg-emerald-500/40 rounded text-[9px] font-bold text-emerald-300 border border-emerald-400/30 cursor-pointer">
            Benar ({buzzed})
          </button>
          <button onClick={() => {
              // Mark as wrong — prevents re-buzzing until question advances
              setCorrect('wrong');
              setTimeout(() => {
                if (currentQ + 1 < validSoal.length) {
                  setCurrentQ(q => q + 1);
                  setBuzzed(null);
                  setCorrect(null);
                } else {
                  setPhase('result');
                }
              }, 800);
            }}
            className="flex-1 py-1 bg-red-500/20 hover:bg-red-500/40 rounded text-[9px] font-bold text-red-300 border border-red-400/30 cursor-pointer">
            Salah ({buzzed})
          </button>
        </div>
      )}
    </div>
  );
}
