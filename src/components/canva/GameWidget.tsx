'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';

interface GameWidgetProps {
  dataIdx?: number;
  compact?: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN GAME WIDGET — routes to specific game renderers
   ═══════════════════════════════════════════════════════════════ */
export default function GameWidget({ dataIdx, compact = false }: GameWidgetProps) {
  const modules = useAuthoringStore((s) => s.modules);

  // Get the specific module data
  const mod = dataIdx !== undefined && dataIdx >= 0 && dataIdx < modules.length
    ? modules[dataIdx]
    : null;

  const gameType = (mod?.type as string) || '';

  if (!mod) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 rounded border border-cyan-500/20 p-3">
        <span className="text-2xl">🎮</span>
        <span className="text-[10px] text-cyan-300/70 mt-1">
          {compact ? 'Belum ada game' : 'Tambahkan game di panel Konten → Modul & Game'}
        </span>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-hidden rounded border border-cyan-500/20"
      onClick={(e) => e.stopPropagation()}
    >
      {gameType === 'truefalse' && <TrueFalseGame data={mod} compact={compact} />}
      {gameType === 'memory' && <MemoryGame data={mod} compact={compact} />}
      {gameType === 'matching' && <MatchingGame data={mod} compact={compact} />}
      {gameType === 'roda' && <RodaGame data={mod} compact={compact} />}
      {gameType === 'sorting' && <SortingGame data={mod} compact={compact} />}
      {gameType === 'spinwheel' && <SpinWheelGame data={mod} compact={compact} />}
      {gameType === 'teambuzzer' && <TeamBuzzerGame data={mod} compact={compact} />}
      {gameType === 'wordsearch' && <WordSearchGame data={mod} compact={compact} />}
      {gameType === 'flashcard' && <FlashcardGame data={mod} compact={compact} />}
      {!['truefalse','memory','matching','roda','sorting','spinwheel','teambuzzer','wordsearch','flashcard'].includes(gameType) && (
        <GenericGameWidget data={mod} compact={compact} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TRUE/FALSE GAME
   ═══════════════════════════════════════════════════════════════ */
function TrueFalseGame({ data, compact }: { data: Record<string, unknown>; compact: boolean }) {
  const soal = (data.soal as Array<Record<string, unknown>>) || [];
  const validSoal = soal.filter(s => s.teks);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<'play' | 'result'>('play');

  const handleAnswer = useCallback((benar: boolean) => {
    if (answered || !validSoal[currentQ]) return;
    setSelected(benar);
    setAnswered(true);
    const correct = validSoal[currentQ].benar as boolean;
    if (benar === correct) setScore(s => s + 1);
    setTimeout(() => {
      if (currentQ + 1 < validSoal.length) {
        setCurrentQ(q => q + 1);
        setSelected(null);
        setAnswered(false);
      } else {
        setPhase('result');
      }
    }, 1200);
  }, [answered, currentQ, validSoal]);

  if (validSoal.length === 0) return <EmptyState icon="✅" label="Benar / Salah" compact={compact} />;

  if (phase === 'result') {
    const pct = Math.round((score / validSoal.length) * 100);
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <div className="text-xl font-black text-cyan-400">{pct}%</div>
        <div className="text-[9px] text-cyan-300/60 mt-1">{score}/{validSoal.length} benar</div>
        <button onClick={() => { setCurrentQ(0); setScore(0); setSelected(null); setAnswered(false); setPhase('play'); }}
          className="mt-2 px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30">
          Ulangi
        </button>
      </div>
    );
  }

  const q = validSoal[currentQ];
  const correct = q.benar as boolean;

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2">
      <div className="flex justify-between text-[9px] text-cyan-400 mb-1">
        <span className="font-bold">Soal {currentQ + 1}/{validSoal.length}</span>
        <span>Skor: {score}</span>
      </div>
      <p className={`text-cyan-100 font-bold flex-1 min-h-0 overflow-y-auto ${compact ? 'text-[9px]' : 'text-[11px]'}`}>
        {q.teks as string}
      </p>
      <div className="flex gap-2 mt-2">
        <button onClick={() => handleAnswer(true)} disabled={answered}
          className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-all ${
            answered
              ? (correct === true ? 'bg-emerald-500/30 border-emerald-400/40 text-emerald-300' : 'bg-white/5 text-white/30')
              : 'bg-emerald-500/20 hover:bg-emerald-500/40 border-emerald-400/30 text-emerald-300 cursor-pointer'
          } border`}>
          ✅ Benar
        </button>
        <button onClick={() => handleAnswer(false)} disabled={answered}
          className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-all ${
            answered
              ? (correct === false ? 'bg-red-500/30 border-red-400/40 text-red-300' : 'bg-white/5 text-white/30')
              : 'bg-red-500/20 hover:bg-red-500/40 border-red-400/30 text-red-300 cursor-pointer'
          } border`}>
          ❌ Salah
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MEMORY MATCH GAME
   ═══════════════════════════════════════════════════════════════ */
function MemoryGame({ data, compact }: { data: Record<string, unknown>; compact: boolean }) {
  const pasangan = (data.pasangan as Array<Record<string, unknown>>) || [];
  const validPairs = pasangan.filter(p => p.kiri || p.kanan);

  const cards = useMemo(() => {
    const c: Array<{ id: number; text: string; pairId: number; type: 'left' | 'right' }> = [];
    validPairs.forEach((p, i) => {
      c.push({ id: i * 2, text: (p.kiri as string) || `?${i + 1}`, pairId: i, type: 'left' });
      c.push({ id: i * 2 + 1, text: (p.kanan as string) || `?${i + 1}`, pairId: i, type: 'right' });
    });
    return c.sort(() => Math.random() - 0.5);
  }, [validPairs]);

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [phase, setPhase] = useState<'play' | 'done'>('play');

  const handleFlip = useCallback((cardId: number) => {
    if (flipped.length === 2 || flipped.includes(cardId) || matched.has(cardId)) return;
    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      const c1 = cards.find(c => c.id === first);
      const c2 = cards.find(c => c.id === second);
      if (c1 && c2 && c1.pairId === c2.pairId && c1.type !== c2.type) {
        setMatched(prev => new Set([...prev, first, second]));
        setFlipped([]);
        if (matched.size + 2 === cards.length) {
          setPhase('done');
        }
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  }, [flipped, matched, cards]);

  const handleRestart = () => {
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setPhase('play');
  };

  if (validPairs.length === 0) return <EmptyState icon="🧠" label="Memory Match" compact={compact} />;

  if (phase === 'done') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <span className="text-2xl">🎉</span>
        <div className="text-[11px] font-bold text-cyan-300 mt-1">Selesai!</div>
        <div className="text-[9px] text-cyan-400/60 mt-0.5">{moves} langkah</div>
        <button onClick={handleRestart}
          className="mt-2 px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30">
          Ulangi
        </button>
      </div>
    );
  }

  const cols = cards.length <= 4 ? 2 : cards.length <= 8 ? 3 : 4;

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2">
      <div className="flex justify-between text-[9px] text-cyan-400 mb-1">
        <span className="font-bold">🧠 Memory</span>
        <span>Langkah: {moves} | Pasangan: {matched.size / 2}/{validPairs.length}</span>
      </div>
      <div className="flex-1 min-h-0 grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map(card => {
          const isFlipped = flipped.includes(card.id);
          const isMatched = matched.has(card.id);
          return (
            <button
              key={card.id}
              onClick={() => handleFlip(card.id)}
              className={`rounded-lg border text-center flex items-center justify-center p-1 transition-all duration-300 ${
                isMatched ? 'bg-emerald-500/20 border-emerald-400/40 scale-95' :
                isFlipped ? 'bg-cyan-500/30 border-cyan-400/40' :
                'bg-white/10 hover:bg-white/15 border-white/10 cursor-pointer'
              }`}
            >
              {(isFlipped || isMatched) ? (
                <span className={`${compact ? 'text-[7px]' : 'text-[9px]'} text-cyan-200 font-medium leading-tight`}>
                  {card.text}
                </span>
              ) : (
                <span className="text-lg">❓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MATCHING GAME (Pasangkan)
   ═══════════════════════════════════════════════════════════════ */
function MatchingGame({ data, compact }: { data: Record<string, unknown>; compact: boolean }) {
  const pasangan = (data.pasangan as Array<Record<string, unknown>>) || [];
  const validPairs = pasangan.filter(p => p.kiri || p.kanan);

  const [shuffledRight] = useState(() => {
    const r = validPairs.map((p, i) => ({ idx: i, text: (p.kanan as string) || '' }));
    return r.sort(() => Math.random() - 0.5);
  });
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matchedLeft, setMatchedLeft] = useState<Set<number>>(new Set());
  const [matchedRight, setMatchedRight] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [phase, setPhase] = useState<'play' | 'done'>('play');

  const handleLeftClick = (idx: number) => {
    if (matchedLeft.has(idx)) return;
    setSelectedLeft(idx);
  };

  const handleRightClick = (originalIdx: number) => {
    if (selectedLeft === null || matchedRight.has(originalIdx)) return;
    if (selectedLeft === originalIdx) {
      setMatchedLeft(prev => new Set([...prev, selectedLeft]));
      setMatchedRight(prev => new Set([...prev, originalIdx]));
      if (matchedLeft.size + 1 === validPairs.length) setPhase('done');
    } else {
      setWrong(`${selectedLeft}-${originalIdx}`);
      setTimeout(() => setWrong(null), 600);
    }
    setSelectedLeft(null);
  };

  if (validPairs.length === 0) return <EmptyState icon="🔀" label="Game Pasangkan" compact={compact} />;

  if (phase === 'done') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <span className="text-2xl">🎉</span>
        <div className="text-[11px] font-bold text-cyan-300 mt-1">Semua Cocok!</div>
        <button onClick={() => { setSelectedLeft(null); setMatchedLeft(new Set()); setMatchedRight(new Set()); setPhase('play'); }}
          className="mt-2 px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30">
          Ulangi
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2">
      <div className="text-[9px] font-bold text-cyan-400 mb-1">🔀 Pasangkan</div>
      <div className="flex-1 min-h-0 flex gap-1 overflow-hidden">
        {/* Left column */}
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {validPairs.map((p, i) => (
            <button key={i} onClick={() => handleLeftClick(i)}
              className={`px-1.5 py-1.5 rounded border text-[9px] text-left transition-all ${
                matchedLeft.has(i) ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 line-through opacity-60' :
                selectedLeft === i ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-200' :
                'bg-white/5 hover:bg-white/10 border-white/10 text-cyan-200 cursor-pointer'
              }`}>
              {p.kiri as string}
            </button>
          ))}
        </div>
        {/* Right column (shuffled) */}
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {shuffledRight.map(r => (
            <button key={r.idx} onClick={() => handleRightClick(r.idx)}
              className={`px-1.5 py-1.5 rounded border text-[9px] text-left transition-all ${
                matchedRight.has(r.idx) ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 line-through opacity-60' :
                wrong === `${selectedLeft}-${r.idx}` ? 'bg-red-500/30 border-red-400/40 text-red-300' :
                'bg-white/5 hover:bg-white/10 border-white/10 text-cyan-200 cursor-pointer'
              }`}>
              {r.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RODA PUTAR (Spinning Wheel)
   ═══════════════════════════════════════════════════════════════ */
function RodaGame({ data, compact }: { data: Record<string, unknown>; compact: boolean }) {
  const opsi = (data.opsi as string[]) || [];
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const colors = ['#f9c82e', '#3ecfcf', '#a78bfa', '#34d399', '#ff6b6b', '#fb923c', '#60a5fa', '#f472b6'];

  const spin = () => {
    if (spinning || opsi.length < 2) return;
    setSpinning(true);
    setResult(null);
    const extra = Math.floor(Math.random() * 360) + 360 * 3;
    const newRot = rotation + extra;
    setRotation(newRot);
    setTimeout(() => {
      setSpinning(false);
      const normalized = newRot % 360;
      const sliceAngle = 360 / opsi.length;
      const idx = Math.floor(((360 - normalized + sliceAngle / 2) % 360) / sliceAngle);
      setResult(opsi[Math.min(idx, opsi.length - 1)]);
    }, 2500);
  };

  if (opsi.length < 2) return <EmptyState icon="🎡" label="Roda Putar" compact={compact} />;

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2 items-center justify-center">
      <div className="text-[9px] font-bold text-cyan-400 mb-1">🎡 Roda Putar</div>
      <div className="relative flex-shrink-0">
        <svg width={compact ? 100 : 140} height={compact ? 100 : 140} viewBox="0 0 140 140"
          style={{ transition: spinning ? 'transform 2.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none', transform: `rotate(${rotation}deg)` }}>
          {opsi.map((o, i) => {
            const startAngle = (i * 360) / opsi.length;
            const endAngle = ((i + 1) * 360) / opsi.length;
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            const x1 = 70 + 65 * Math.cos(startRad);
            const y1 = 70 + 65 * Math.sin(startRad);
            const x2 = 70 + 65 * Math.cos(endRad);
            const y2 = 70 + 65 * Math.sin(endRad);
            const largeArc = endAngle - startAngle > 180 ? 1 : 0;
            return (
              <path key={i} d={`M70,70 L${x1},${y1} A65,65 0 ${largeArc},1 ${x2},${y2} Z`}
                fill={colors[i % colors.length]} opacity={0.8} />
            );
          })}
          <circle cx="70" cy="70" r="10" fill="#1a1a2e" />
        </svg>
        {/* Arrow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-lg">▼</div>
      </div>
      {result && (
        <div className="mt-2 text-center">
          <div className={`${compact ? 'text-[10px]' : 'text-[12px]'} font-bold text-amber-300`}>{result}</div>
        </div>
      )}
      <button onClick={spin} disabled={spinning}
        className="mt-2 px-4 py-1.5 bg-cyan-500/30 hover:bg-cyan-500/50 disabled:opacity-50 rounded-lg text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30 cursor-pointer">
        {spinning ? 'Berputar...' : 'Putar!'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SORTING GAME (Urutkan / Klasifikasi)
   ═══════════════════════════════════════════════════════════════ */
function SortingGame({ data, compact }: { data: Record<string, unknown>; compact: boolean }) {
  const kategori = (data.kategori as Array<Record<string, unknown>>) || [];
  const items = (data.items as Array<Record<string, unknown>>) || [];
  const validItems = items.filter(i => i.teks);

  const [sorted, setSorted] = useState<Record<string, string[]>>({});
  const [phase, setPhase] = useState<'play' | 'done'>('play');
  const [wrong, setWrong] = useState<string | null>(null);

  const handleDrop = useCallback((itemText: string, catId: string) => {
    const correctCat = validItems.find(i => i.teks === itemText)?.kategori as string;
    if (correctCat === catId) {
      setSorted(prev => ({
        ...prev,
        [catId]: [...(prev[catId] || []), itemText],
      }));
      const newSorted = { ...sorted, [catId]: [...(sorted[catId] || []), itemText] };
      const totalSorted = Object.values(newSorted).flat().length;
      if (totalSorted + 1 === validItems.length) setPhase('done');
    } else {
      setWrong(catId);
      setTimeout(() => setWrong(null), 500);
    }
  }, [validItems, sorted]);

  if (validItems.length === 0) return <EmptyState icon="🔢" label="Urutkan" compact={compact} />;

  const unsorted = validItems.filter(i => {
    return !Object.values(sorted).flat().includes(i.teks as string);
  });

  if (phase === 'done') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <span className="text-2xl">🎉</span>
        <div className="text-[11px] font-bold text-cyan-300 mt-1">Semua Tersortir!</div>
        <button onClick={() => { setSorted({}); setPhase('play'); }}
          className="mt-2 px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30">
          Ulangi
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2">
      <div className="text-[9px] font-bold text-cyan-400 mb-1">🔢 Klasifikasi</div>
      {/* Unsorted items */}
      <div className="flex flex-wrap gap-1 mb-2">
        {unsorted.map((item, i) => (
          <span key={i} className={`${compact ? 'text-[8px]' : 'text-[9px]'} px-2 py-0.5 bg-white/10 border border-white/15 rounded text-cyan-200`}>
            {item.teks as string}
          </span>
        ))}
      </div>
      {/* Category drop zones */}
      <div className="flex-1 min-h-0 space-y-1 overflow-y-auto">
        {kategori.map((cat) => {
          const catId = cat.id as string;
          const catColor = cat.color as string || '#3ecfcf';
          const sortedItems = sorted[catId] || [];
          return (
            <div key={catId} className={`rounded border p-1.5 min-h-[32px] transition-colors ${wrong === catId ? 'bg-red-500/20 border-red-400/40' : 'bg-white/5 border-white/10'}`}
              style={{ borderLeftColor: catColor, borderLeftWidth: 3 }}>
              <div className="text-[9px] font-bold mb-0.5" style={{ color: catColor }}>{cat.label as string}</div>
              <div className="flex flex-wrap gap-0.5">
                {sortedItems.map((t, j) => (
                  <span key={j} className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">{t}</span>
                ))}
              </div>
              {/* Buttons for unsorted items */}
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {unsorted.map((item, j) => (
                  <button key={j} onClick={() => handleDrop(item.teks as string, catId)}
                    className="text-[7px] px-1 py-0.5 rounded bg-white/5 border border-dashed border-white/15 text-white/40 hover:bg-white/10 hover:text-white/60 cursor-pointer transition-colors">
                    + {item.teks as string}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SPIN WHEEL (Roda Pertanyaan)
   ═══════════════════════════════════════════════════════════════ */
function SpinWheelGame({ data, compact }: { data: Record<string, unknown>; compact: boolean }) {
  const soal = (data.soal as Array<Record<string, unknown>>) || [];
  const validSoal = soal.filter(s => s.teks);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const colors = ['#f9c82e', '#3ecfcf', '#a78bfa', '#34d399', '#ff6b6b', '#fb923c', '#60a5fa', '#f472b6'];

  const spin = () => {
    if (spinning || validSoal.length < 2) return;
    setSpinning(true);
    setResult(null);
    const extra = Math.floor(Math.random() * 360) + 360 * 3;
    const newRot = rotation + extra;
    setRotation(newRot);
    setTimeout(() => {
      setSpinning(false);
      const normalized = newRot % 360;
      const sliceAngle = 360 / validSoal.length;
      const idx = Math.floor(((360 - normalized + sliceAngle / 2) % 360) / sliceAngle);
      setResult(validSoal[Math.min(idx, validSoal.length - 1)]);
    }, 2500);
  };

  if (validSoal.length < 2) return <EmptyState icon="🎡" label="Roda Pertanyaan" compact={compact} />;

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2 items-center justify-center">
      <div className="text-[9px] font-bold text-cyan-400 mb-1">🎡 Roda Pertanyaan</div>
      <div className="relative flex-shrink-0">
        <svg width={compact ? 100 : 140} height={compact ? 100 : 140} viewBox="0 0 140 140"
          style={{ transition: spinning ? 'transform 2.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none', transform: `rotate(${rotation}deg)` }}>
          {validSoal.map((s, i) => {
            const startAngle = (i * 360) / validSoal.length;
            const endAngle = ((i + 1) * 360) / validSoal.length;
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            const x1 = 70 + 65 * Math.cos(startRad);
            const y1 = 70 + 65 * Math.sin(startRad);
            const x2 = 70 + 65 * Math.cos(endRad);
            const y2 = 70 + 65 * Math.sin(endRad);
            const midRad = ((startAngle + endAngle) / 2 - 90) * Math.PI / 180;
            const tx = 70 + 38 * Math.cos(midRad);
            const ty = 70 + 38 * Math.sin(midRad);
            const largeArc = endAngle - startAngle > 180 ? 1 : 0;
            return (
              <g key={i}>
                <path d={`M70,70 L${x1},${y1} A65,65 0 ${largeArc},1 ${x2},${y2} Z`}
                  fill={colors[i % colors.length]} opacity={0.8} />
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontSize="8" fontWeight="bold" transform={`rotate(${startAngle + 360/validSoal.length/2}, ${tx}, ${ty})`}>
                  {String(i + 1)}
                </text>
              </g>
            );
          })}
          <circle cx="70" cy="70" r="10" fill="#1a1a2e" />
        </svg>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-lg">▼</div>
      </div>
      {result && (
        <div className="mt-2 text-center px-2 max-w-full">
          <div className="text-[9px] text-cyan-400/60 mb-0.5">{result.kategori as string || 'Soal'}</div>
          <div className={`${compact ? 'text-[9px]' : 'text-[11px]'} font-bold text-amber-300`}>{result.teks as string}</div>
        </div>
      )}
      <button onClick={spin} disabled={spinning}
        className="mt-2 px-4 py-1.5 bg-cyan-500/30 hover:bg-cyan-500/50 disabled:opacity-50 rounded-lg text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30 cursor-pointer">
        {spinning ? 'Berputar...' : 'Putar!'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEAM BUZZER GAME
   ═══════════════════════════════════════════════════════════════ */
function TeamBuzzerGame({ data, compact }: { data: Record<string, unknown>; compact: boolean }) {
  const soal = (data.soal as Array<Record<string, unknown>>) || [];
  const validSoal = soal.filter(s => s.teks);
  const timA = (data.timA as string) || 'Tim A';
  const timB = (data.timB as string) || 'Tim B';

  const [currentQ, setCurrentQ] = useState(0);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [buzzed, setBuzzed] = useState<'A' | 'B' | null>(null);
  const [correct, setCorrect] = useState<'A' | 'B' | null>(null);
  const [phase, setPhase] = useState<'play' | 'result'>('play');

  const handleBuzz = (team: 'A' | 'B') => {
    if (buzzed) return;
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

  if (validSoal.length === 0) return <EmptyState icon="🏆" label="Kuis Tim" compact={compact} />;

  if (phase === 'result') {
    const winner = scoreA > scoreB ? timA : scoreB > scoreA ? timB : 'Seri';
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <span className="text-2xl">🏆</span>
        <div className="text-[11px] font-bold text-cyan-300 mt-1">{winner} Menang!</div>
        <div className="text-[9px] text-cyan-400/60 mt-0.5">{timA}: {scoreA} | {timB}: {scoreB}</div>
        <button onClick={() => { setCurrentQ(0); setScoreA(0); setScoreB(0); setBuzzed(null); setCorrect(null); setPhase('play'); }}
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
        <span>+{q.poin || 10} poin</span>
      </div>
      <p className={`text-cyan-100 font-bold flex-1 min-h-0 overflow-y-auto mb-1 ${compact ? 'text-[9px]' : 'text-[11px]'}`}>
        {q.teks as string}
      </p>
      <div className="flex gap-2 mb-1">
        <button onClick={() => handleBuzz('A')} disabled={!!buzzed}
          className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-all border ${
            correct === 'A' ? 'bg-emerald-500/30 border-emerald-400/40 text-emerald-300' :
            buzzed === 'A' ? 'bg-blue-500/30 border-blue-400/40 text-blue-300' :
            'bg-blue-500/15 hover:bg-blue-500/30 border-blue-400/20 text-blue-300 cursor-pointer'
          }`}>
          {timA} ({scoreA})
        </button>
        <button onClick={() => handleBuzz('B')} disabled={!!buzzed}
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
          <button onClick={() => { const other = buzzed === 'A' ? 'B' : 'A'; setBuzzed(null); setTimeout(() => handleCorrect(other), 100); }}
            className="flex-1 py-1 bg-red-500/20 hover:bg-red-500/40 rounded text-[9px] font-bold text-red-300 border border-red-400/30 cursor-pointer">
            Salah ({buzzed})
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WORD SEARCH GAME
   ═══════════════════════════════════════════════════════════════ */
function WordSearchGame({ data, compact }: { data: Record<string, unknown>; compact: boolean }) {
  const kataList = (data.kata as string[]) || [];
  const ukuran = (data.ukuran as number) || 10;
  const validKata = kataList.filter(k => k.trim());

  const [grid, setGrid] = useState<string[][]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [selectedCells, setSelectedCells] = useState<Array<[number, number]>>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [phase, setPhase] = useState<'play' | 'done'>('play');

  // Generate grid on mount
  useEffect(() => {
    if (validKata.length === 0) return;
    const g: string[][] = Array.from({ length: ukuran }, () => Array(ukuran).fill(''));
    const placed = new Set<string>();

    // Place words
    const directions = [[0,1],[1,0],[1,1],[0,-1],[-1,0],[-1,-1]];
    for (const word of validKata) {
      let placedOk = false;
      for (let attempt = 0; attempt < 50; attempt++) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const startR = Math.floor(Math.random() * ukuran);
        const startC = Math.floor(Math.random() * ukuran);
        let fits = true;
        for (let i = 0; i < word.length; i++) {
          const r = startR + dir[0] * i;
          const c = startC + dir[1] * i;
          if (r < 0 || r >= ukuran || c < 0 || c >= ukuran) { fits = false; break; }
          if (g[r][c] !== '' && g[r][c] !== word[i]) { fits = false; break; }
        }
        if (fits) {
          for (let i = 0; i < word.length; i++) {
            g[startR + dir[0] * i][startC + dir[1] * i] = word[i];
          }
          placed.add(word);
          placedOk = true;
          break;
        }
      }
    }

    // Fill empty cells
    for (let r = 0; r < ukuran; r++) {
      for (let c = 0; c < ukuran; c++) {
        if (g[r][c] === '') g[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
    setGrid(g);
  }, [validKata, ukuran]);

  const handleRestart = () => {
    setFound(new Set());
    setSelectedCells([]);
    setIsSelecting(false);
    setPhase('play');
    // Re-generate grid
    const g: string[][] = Array.from({ length: ukuran }, () => Array(ukuran).fill(''));
    const directions = [[0,1],[1,0],[1,1],[0,-1],[-1,0],[-1,-1]];
    for (const word of validKata) {
      for (let attempt = 0; attempt < 50; attempt++) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const startR = Math.floor(Math.random() * ukuran);
        const startC = Math.floor(Math.random() * ukuran);
        let fits = true;
        for (let i = 0; i < word.length; i++) {
          const r = startR + dir[0] * i;
          const c = startC + dir[1] * i;
          if (r < 0 || r >= ukuran || c < 0 || c >= ukuran) { fits = false; break; }
          if (g[r][c] !== '' && g[r][c] !== word[i]) { fits = false; break; }
        }
        if (fits) {
          for (let i = 0; i < word.length; i++) {
            g[startR + dir[0] * i][startC + dir[1] * i] = word[i];
          }
          break;
        }
      }
    }
    for (let r = 0; r < ukuran; r++) {
      for (let c = 0; c < ukuran; c++) {
        if (g[r][c] === '') g[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
    setGrid(g);
  };

  if (validKata.length === 0) return <EmptyState icon="🔍" label="Teka-Teki Kata" compact={compact} />;

  if (phase === 'done') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <span className="text-2xl">🎉</span>
        <div className="text-[11px] font-bold text-cyan-300 mt-1">Semua Ditemukan!</div>
        <button onClick={handleRestart}
          className="mt-2 px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30">
          Ulangi
        </button>
      </div>
    );
  }

  const handleCellClick = (r: number, c: number) => {
    if (!isSelecting) {
      setSelectedCells([[r, c]]);
      setIsSelecting(true);
    } else {
      const newCells = [...selectedCells, [r, c] as [number, number]];
      const word = newCells.map(([cr, cc]) => grid[cr]?.[cc] || '').join('');
      const reversedWord = word.split('').reverse().join('');
      const foundWord = validKata.find(k => (k === word || k === reversedWord) && !found.has(k));
      if (foundWord) {
        setFound(prev => new Set([...prev, foundWord]));
        if (found.size + 1 === validKata.length) setPhase('done');
      }
      setSelectedCells([]);
      setIsSelecting(false);
    }
  };

  const fontSize = compact ? 'text-[7px]' : 'text-[9px]';
  const cellSize = compact ? 18 : 24;

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2">
      <div className="text-[9px] font-bold text-cyan-400 mb-1">🔍 Teka-Teki Kata</div>
      <div className="flex gap-1 flex-1 min-h-0 overflow-hidden">
        {/* Grid */}
        <div className="flex-shrink-0" style={{ display: 'grid', gridTemplateColumns: `repeat(${ukuran}, ${cellSize}px)`, gap: 1 }}>
          {grid.map((row, r) => row.map((letter, c) => (
            <button key={`${r}-${c}`} onClick={() => handleCellClick(r, c)}
              className={`${fontSize} w-full aspect-square rounded flex items-center justify-center font-bold transition-colors ${
                selectedCells.some(([sr, sc]) => sr === r && sc === c) ? 'bg-amber-500/40 text-amber-200' :
                found.has(letter) ? 'bg-emerald-500/30 text-emerald-300' :
                'bg-white/5 text-white/60 hover:bg-white/15 cursor-pointer'
              }`}>
              {letter}
            </button>
          )))}
        </div>
        {/* Word list */}
        <div className="flex-1 flex flex-col gap-0.5 min-w-[60px]">
          {validKata.map((k, i) => (
            <span key={i} className={`text-[8px] px-1.5 py-0.5 rounded ${
              found.has(k) ? 'bg-emerald-500/20 text-emerald-300 line-through' : 'bg-white/5 text-white/40'
            }`}>{k}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FLASHCARD GAME
   ═══════════════════════════════════════════════════════════════ */
function FlashcardGame({ data, compact }: { data: Record<string, unknown>; compact: boolean }) {
  const kartu = (data.kartu as Array<Record<string, unknown>>) || [];
  const validCards = kartu.filter(k => k.depan || k.belakang);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (validCards.length === 0) return <EmptyState icon="🃏" label="Flashcard" compact={compact} />;

  const card = validCards[currentIdx];

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2 items-center justify-center">
      <div className="text-[9px] font-bold text-cyan-400 mb-1">🃏 Flashcard {currentIdx + 1}/{validCards.length}</div>
      <button
        onClick={() => setFlipped(!flipped)}
        className="w-full flex-1 min-h-0 rounded-xl border border-white/10 flex items-center justify-center p-3 transition-all cursor-pointer hover:border-cyan-400/30"
        style={{
          background: flipped ? 'rgba(56,217,217,0.15)' : 'rgba(255,255,255,0.05)',
          transform: flipped ? 'rotateY(0deg)' : 'rotateY(0deg)',
        }}
      >
        <span className={`${compact ? 'text-[10px]' : 'text-[12px]'} font-bold text-cyan-200 text-center`}>
          {flipped ? (card.belakang as string) : (card.depan as string)}
        </span>
      </button>
      <div className="flex gap-1 mt-1 w-full">
        {currentIdx > 0 && (
          <button onClick={() => { setCurrentIdx(i => i - 1); setFlipped(false); }}
            className="flex-1 py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] text-cyan-300 border border-white/10 cursor-pointer">
            ← Sebelumnya
          </button>
        )}
        {currentIdx < validCards.length - 1 && (
          <button onClick={() => { setCurrentIdx(i => i + 1); setFlipped(false); }}
            className="flex-1 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 rounded text-[9px] text-cyan-300 border border-cyan-400/20 cursor-pointer">
            Selanjutnya →
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GENERIC FALLBACK for other module types
   ═══════════════════════════════════════════════════════════════ */
function GenericGameWidget({ data, compact }: { data: Record<string, unknown>; compact: boolean }) {
  const type = (data.type as string) || 'modul';
  const title = (data.title as string) || type;

  const typeLabels: Record<string, { icon: string; label: string }> = {
    'hero': { icon: '🖼️', label: 'Hero Banner' },
    'kutipan': { icon: '💬', label: 'Kutipan' },
    'langkah': { icon: '👣', label: 'Langkah' },
    'accordion': { icon: '🗂️', label: 'Accordion' },
    'statistik': { icon: '📊', label: 'Statistik' },
    'polling': { icon: '🗳️', label: 'Polling' },
    'embed': { icon: '🔗', label: 'Embed' },
    'tab-icons': { icon: '📑', label: 'Tab Interaktif' },
    'icon-explore': { icon: '🔍', label: 'Eksplorasi Ikon' },
    'comparison': { icon: '⚖️', label: 'Perbandingan' },
    'card-showcase': { icon: '🃏', label: 'Card Showcase' },
    'hotspot-image': { icon: '🗺️', label: 'Hotspot Image' },
    'infografis': { icon: '📊', label: 'Infografis' },
    'studi-kasus': { icon: '📰', label: 'Studi Kasus' },
    'debat': { icon: '🗣️', label: 'Debat' },
    'timeline': { icon: '📅', label: 'Timeline' },
    'video': { icon: '🎥', label: 'Video' },
    'skenario': { icon: '🎭', label: 'Skenario' },
    'materi': { icon: '📖', label: 'Materi Teks' },
  };

  const info = typeLabels[type] || { icon: '🧩', label: type };
  const displayTitle = title || info.label;

  return (
    <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-2 text-center">
      <span className={compact ? 'text-xl' : 'text-2xl'}>{info.icon}</span>
      <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-bold text-cyan-300 mt-1`}>{displayTitle}</span>
      {!compact && (
        <span className="text-[8px] text-cyan-400/50 mt-0.5">
          Modul ini ditampilkan di Preview
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE helper
   ═══════════════════════════════════════════════════════════════ */
function EmptyState({ icon, label, compact }: { icon: string; label: string; compact: boolean }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3">
      <span className={compact ? 'text-xl' : 'text-2xl'}>{icon}</span>
      <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-cyan-300/70 mt-1`}>
        {label}
      </span>
      <span className="text-[8px] text-cyan-400/50 mt-0.5">
        Tambahkan data di panel Konten
      </span>
    </div>
  );
}
