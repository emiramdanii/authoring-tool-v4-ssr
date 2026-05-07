'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { EmptyState } from './shared';
import type { GameComponentProps } from './shared';

/* ═══════════════════════════════════════════════════════════════
   WORD SEARCH GAME — Efficiency-based scoring with 50% floor
   Score = max(ceil(words * 0.5), words - wrongAttempts)
   ═══════════════════════════════════════════════════════════════ */

function generateGrid(words: string[], size: number): string[][] {
  const g: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
  const directions = [[0,1],[1,0],[1,1],[0,-1],[-1,0],[-1,-1]];
  for (const word of words) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const startR = Math.floor(Math.random() * size);
      const startC = Math.floor(Math.random() * size);
      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const r = startR + dir[0] * i;
        const c = startC + dir[1] * i;
        if (r < 0 || r >= size || c < 0 || c >= size) { fits = false; break; }
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
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (g[r][c] === '') g[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }
  }
  return g;
}

export function WordSearchGame({ data, compact, onComplete }: GameComponentProps) {
  const kataList = (data.kata as string[]) || [];
  const ukuran = (data.ukuran as number) || 10;
  const validKata = kataList.filter(k => k.trim());

  const [gridKey, setGridKey] = useState(0);
  const grid = useMemo(() => generateGrid(validKata, ukuran), [validKata, ukuran, gridKey]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [selectedCells, setSelectedCells] = useState<Array<[number, number]>>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [phase, setPhase] = useState<'play' | 'done'>('play');
  const reported = useRef(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  useEffect(() => {
    if (phase === 'done' && !reported.current && onComplete) {
      reported.current = true;
      const score = Math.max(Math.ceil(validKata.length * 0.5), validKata.length - wrongAttempts);
      onComplete(score, validKata.length);
    }
  }, [phase]);

  const handleRestart = () => {
    setFound(new Set());
    setSelectedCells([]);
    setIsSelecting(false);
    setPhase('play');
    reported.current = false;
    setWrongAttempts(0);
    setGridKey(k => k + 1);
  };

  if (validKata.length === 0) return <EmptyState icon="🔍" label="Teka-Teki Kata" compact={compact} />;

  if (phase === 'done') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <span className="text-2xl">🎉</span>
        <div className="text-[11px] font-bold text-cyan-300 mt-1">Semua Ditemukan!</div>
        <div className="text-[9px] text-cyan-400/60 mt-0.5">{validKata.length} kata{wrongAttempts ? ` · ${wrongAttempts} salah` : ' · Sempurna!'}</div>
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
      } else {
        setWrongAttempts(w => w + 1);
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
