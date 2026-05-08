'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { EmptyState } from './shared';
import type { GameComponentProps } from './shared';

/* ═══════════════════════════════════════════════════════════════
   FILL-IN-THE-BLANK GAME (Isian)
   ═══════════════════════════════════════════════════════════════ */
export function FillBlankGame({ data, compact, onComplete }: GameComponentProps) {
  const soal = (data.soal as Array<Record<string, unknown>>) || [];
  const validSoal = soal.filter(s => s.teks && s.jawaban);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<'play' | 'result'>('play');
  const reported = useRef(false);

  useEffect(() => {
    if (phase === 'result' && !reported.current && onComplete) {
      reported.current = true;
      onComplete(score, validSoal.length);
    }
  }, [phase, score, validSoal.length, onComplete]);

  const handleSubmit = useCallback(() => {
    if (answered || !userInput.trim()) return;
    const userAns = userInput.trim().toLowerCase();
    const correctAns = String(validSoal[currentQ].jawaban || '').toLowerCase();
    const acceptList = correctAns.split('/').map(a => a.trim());
    const isCorrect = acceptList.includes(userAns);
    setLastCorrect(isCorrect);
    if (isCorrect) setScore(s => s + 1);
    setAnswered(true);

    setTimeout(() => {
      if (currentQ + 1 < validSoal.length) {
        setCurrentQ(q => q + 1);
        setAnswered(false);
        setUserInput('');
        setLastCorrect(null);
      } else {
        setPhase('result');
      }
    }, 1500);
  }, [answered, userInput, currentQ, validSoal]);

  if (validSoal.length === 0) return <EmptyState icon="✏️" label="Isian" compact={compact} />;

  if (phase === 'result') {
    const pct = Math.round((score / validSoal.length) * 100);
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <div className="text-xl font-black text-cyan-400">{pct}%</div>
        <div className="text-[9px] text-cyan-300/60 mt-1">{score}/{validSoal.length} benar</div>
        <button onClick={() => { setCurrentQ(0); setScore(0); setAnswered(false); setUserInput(''); setLastCorrect(null); setPhase('play'); reported.current = false; }}
          className="mt-2 px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30">Ulangi</button>
      </div>
    );
  }

  const q = validSoal[currentQ];
  const prog = ((currentQ + 1) / validSoal.length * 100);

  // Format question with blank marker
  const qText = String(q.teks || '');
  const blankMark = '___';
  const parts = qText.split(blankMark);

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2">
      {/* Progress bar */}
      <div className="h-1 bg-cyan-500/15 rounded-full overflow-hidden mb-2">
        <div className="h-full bg-cyan-400 transition-all duration-400" style={{ width: `${prog}%` }} />
      </div>
      <div className="flex justify-between text-[9px] text-cyan-400 mb-1">
        <span className="font-bold">Soal {currentQ + 1}/{validSoal.length}</span>
        <span>Skor: {score}</span>
      </div>
      <p className={`text-cyan-100 font-bold flex-1 min-h-0 overflow-y-auto mb-2 ${compact ? 'text-[9px]' : 'text-[11px]'}`}>
        {parts.length > 1 ? (
          <>{String(parts[0])}<span className="inline-block min-w-[50px] border-b-2 border-dashed border-cyan-400/40 mx-1">{answered ? '(jawaban)' : ''}</span>{String(parts.slice(1).join(''))}</>
        ) : String(qText)}
      </p>
      <input
        type="text" value={userInput} onChange={e => setUserInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
        disabled={answered}
        placeholder="Ketik jawaban..."
        className={`w-full px-3 py-2 rounded-lg border text-[11px] font-semibold outline-none transition-all ${
          answered
            ? lastCorrect ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300' : 'border-red-400/40 bg-red-500/10 text-red-300'
            : 'border-white/15 bg-white/5 text-white focus:border-cyan-400/50 focus:bg-white/10'
        }`}
      />
      {String(q.petunjuk || '') && !answered && (
        <div className="text-[8px] text-amber-400/70 mt-1 italic">💡 Petunjuk: {String(q.petunjuk)}</div>
      )}
      {answered && (
        <div className={`text-[9px] mt-1 font-bold ${lastCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
          {lastCorrect ? '✅ Benar!' : `❌ Salah. Jawaban: ${String(q.jawaban)}`}
        </div>
      )}
      {!answered && (
        <button onClick={handleSubmit} disabled={!userInput.trim()}
          className="mt-2 px-4 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/40 disabled:opacity-40 rounded-lg text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30 cursor-pointer">
          Jawab
        </button>
      )}
    </div>
  );
}
