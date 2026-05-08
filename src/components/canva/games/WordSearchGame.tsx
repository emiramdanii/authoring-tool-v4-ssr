'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { EmptyState } from './shared';
import type { GameComponentProps } from './shared';

/* ═══════════════════════════════════════════════════════════════
   WORD SEARCH GAME — Efficiency-based scoring with 50% floor
   Score = max(ceil(words * 0.5), words - wrongAttempts)
   ═══════════════════════════════════════════════════════════════ */

// Store word positions during grid generation so we can highlight cells
interface WordPlacement {
  word: string;
  cells: Array<[number, number]>;
}

function generateGridWithPlacements(words: string[], size: number): { grid: string[][]; placements: WordPlacement[] } {
  const g: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
  const directions = [[0,1],[1,0],[1,1],[0,-1],[-1,0],[-1,-1],[1,-1],[-1,1]];
  const placements: WordPlacement[] = [];

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
        const cells: Array<[number, number]> = [];
        for (let i = 0; i < word.length; i++) {
          const r = startR + dir[0] * i;
          const c = startC + dir[1] * i;
          g[r][c] = word[i];
          cells.push([r, c]);
        }
        placements.push({ word, cells });
        break;
      }
    }
  }
  // Fill empty cells with random letters
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (g[r][c] === '') g[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }
  }
  return { grid: g, placements };
}

// Check if two cells form a valid straight line (horizontal, vertical, or diagonal)
// and return the cells along that line
function getLineCells(start: [number, number], end: [number, number]): Array<[number, number]> | null {
  const [r1, c1] = start;
  const [r2, c2] = end;
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  const rowDist = Math.abs(r2 - r1);
  const colDist = Math.abs(c2 - c1);

  // Must be a straight line: same row, same col, or diagonal (equal distances)
  if (rowDist !== colDist && rowDist !== 0 && colDist !== 0) return null;

  const steps = Math.max(rowDist, colDist);
  if (steps === 0) return [[r1, c1]];

  const cells: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    cells.push([r1 + dr * i, c1 + dc * i]);
  }
  return cells;
}

export function WordSearchGame({ data, compact, interactive, onComplete }: GameComponentProps) {
  const kataList = (data.kata as string[]) || [];
  const ukuran = (data.ukuran as number) || 10;
  const validKata = kataList.filter(k => k.trim());

  const [gridKey, setGridKey] = useState(0);
  const { grid, placements } = useMemo(
    () => generateGridWithPlacements(validKata, ukuran),
    [validKata, ukuran, gridKey]
  );

  // Track found words AND which cells belong to found words
  const [found, setFound] = useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set()); // "r,c" keys
  const [startCell, setStartCell] = useState<[number, number] | null>(null);
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
    setFoundCells(new Set());
    setStartCell(null);
    setPhase('play');
    reported.current = false;
    setWrongAttempts(0);
    setGridKey(k => k + 1);
  };

  if (validKata.length === 0) return <EmptyState icon="🔍" label="Teka-Teki Kata" compact={compact} interactive={interactive} />;

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
    if (!startCell) {
      // First click: set start cell
      setStartCell([r, c]);
    } else {
      // Second click: validate line and check for word match
      const lineCells = getLineCells(startCell, [r, c]);

      if (!lineCells || lineCells.length < 2) {
        // Invalid line — reset selection
        setWrongAttempts(w => w + 1);
        setStartCell(null);
        return;
      }

      const word = lineCells.map(([cr, cc]) => grid[cr]?.[cc] || '').join('');
      const reversedWord = word.split('').reverse().join('');
      const foundWord = validKata.find(k => (k === word || k === reversedWord) && !found.has(k));

      if (foundWord) {
        setFound(prev => new Set([...prev, foundWord]));
        setFoundCells(prev => {
          const next = new Set(prev);
          lineCells.forEach(([cr, cc]) => next.add(`${cr},${cc}`));
          return next;
        });
        if (found.size + 1 === validKata.length) setPhase('done');
      } else {
        setWrongAttempts(w => w + 1);
      }
      setStartCell(null);
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
          {grid.map((row, r) => row.map((letter, c) => {
            const cellKey = `${r},${c}`;
            const isStart = startCell && startCell[0] === r && startCell[1] === c;
            const isFound = foundCells.has(cellKey);
            return (
              <button key={`${r}-${c}`} onClick={() => handleCellClick(r, c)}
                className={`${fontSize} w-full aspect-square rounded flex items-center justify-center font-bold transition-colors ${
                  isStart ? 'bg-amber-500/40 text-amber-200 ring-2 ring-amber-400/50' :
                  isFound ? 'bg-emerald-500/30 text-emerald-300' :
                  'bg-white/5 text-white/60 hover:bg-white/15 cursor-pointer'
                }`}>
                {letter}
              </button>
            );
          }))}
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
