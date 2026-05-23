'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { EmptyState } from './shared';
import type { GameComponentProps } from './shared';

/* ═══════════════════════════════════════════════════════════════
   TRUE/FALSE GAME
   ═══════════════════════════════════════════════════════════════ */
export function TrueFalseGame({ data, compact, interactive, onComplete }: GameComponentProps) {
  const soal = (data.soal as Array<Record<string, unknown>>) || [];
  const validSoal = soal.filter(s => s.teks && s.benar !== undefined);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<'play' | 'result'>('play');
  const reported = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup all timeouts on unmount
  useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);

  // Phase 9 fix: Reset game state when question data changes
  const soalKey = JSON.stringify(validSoal.map(s => ({ t: String(s.teks || ''), b: String(s.benar) })));
  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setCurrentQ(0);
    setScore(0);
    setAnswered(false);
    setSelected(null);
    setPhase('play');
    reported.current = false;
  }, [soalKey]);

  useEffect(() => { if (phase === 'result' && !reported.current && onComplete) { reported.current = true; onComplete(score, validSoal.length); } }, [phase, score, validSoal.length, onComplete]);

  const handleAnswer = useCallback((benar: boolean) => {
    if (answered || !validSoal[currentQ]) return;
    setSelected(benar);
    setAnswered(true);
    // Normalize benar to boolean — may be stored as string "true"/"false" from JSON form data
    const rawBenar = validSoal[currentQ].benar;
    const correct = typeof rawBenar === 'boolean' ? rawBenar : String(rawBenar).toLowerCase() === 'true';
    if (benar === correct) setScore(s => s + 1);
    const tid = setTimeout(() => {
      if (currentQ + 1 < validSoal.length) {
        setCurrentQ(q => q + 1);
        setSelected(null);
        setAnswered(false);
      } else {
        setPhase('result');
      }
    }, 1200);
    timersRef.current.push(tid);
  }, [answered, currentQ, validSoal]);

  if (validSoal.length === 0) return <EmptyState icon="✅" label="Benar / Salah" compact={compact} interactive={interactive} />;

  if (phase === 'result') {
    const pct = Math.round((score / validSoal.length) * 100);
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <div className="text-xl font-black text-cyan-400">{pct}%</div>
        <div className="text-[9px] text-cyan-300/60 mt-1">{score}/{validSoal.length} benar</div>
        <button onClick={() => { timersRef.current.forEach(clearTimeout); timersRef.current = []; setCurrentQ(0); setScore(0); setSelected(null); setAnswered(false); setPhase('play'); reported.current = false; }}
          className="mt-2 px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30">
          Ulangi
        </button>
      </div>
    );
  }

  const q = validSoal[currentQ];
  const rawBenar = q?.benar;
  const correct = typeof rawBenar === 'boolean' ? rawBenar : String(rawBenar).toLowerCase() === 'true';

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2">
      <div className="flex justify-between text-[9px] text-cyan-400 mb-1">
        <span className="font-bold">Soal {currentQ + 1}/{validSoal.length}</span>
        <span>Skor: {score}</span>
      </div>
      <p className={`text-cyan-100 font-bold flex-1 min-h-0 overflow-y-auto ${compact ? 'text-[9px]' : 'text-[11px]'}`}>
        {q!.teks as string}
      </p>
      <div className="flex gap-2 mt-2">
        <button onClick={() => handleAnswer(true)} disabled={answered}
          className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-[transform,box-shadow,background-color,border-color] ${
            answered
              ? (correct === true ? 'bg-emerald-500/30 border-emerald-400/40 text-emerald-300' : 'bg-app-elevated/5 text-white/30')
              : 'bg-emerald-500/20 hover:bg-emerald-500/40 border-emerald-400/30 text-emerald-300 cursor-pointer'
          } border`}>
          ✅ Benar
        </button>
        <button onClick={() => handleAnswer(false)} disabled={answered}
          className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-[transform,box-shadow,background-color,border-color] ${
            answered
              ? (correct === false ? 'bg-red-500/30 border-red-400/40 text-red-300' : 'bg-app-elevated/5 text-white/30')
              : 'bg-red-500/20 hover:bg-red-500/40 border-red-400/30 text-red-300 cursor-pointer'
          } border`}>
          ❌ Salah
        </button>
      </div>
    </div>
  );
}
