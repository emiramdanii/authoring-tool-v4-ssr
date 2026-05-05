'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { EmptyState } from './shared';
import type { GameComponentProps } from './shared';

/* ═══════════════════════════════════════════════════════════════
   CROSSWORD GAME (Teka Silang)
   ═══════════════════════════════════════════════════════════════ */
export function CrosswordGame({ data, compact, onComplete }: GameComponentProps) {
  const kata = (data.kata as Array<Record<string, unknown>>) || [];
  const ukuran = (data.ukuran as number) || 12;
  const validKata = kata.filter(k => k.teks && String(k.teks).trim());
  const [userGrid, setUserGrid] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [phase, setPhase] = useState<'play' | 'done'>('play');
  const reported = useRef(false);

  // Build crossword grid
  const gridData = useMemo(() => {
    const SIZE = ukuran;
    const grid: Array<Array<{ letter: string; num: number; wordIds: number[] }>> = [];
    for (let r = 0; r < SIZE; r++) {
      grid[r] = [];
      for (let c = 0; c < SIZE; c++) grid[r][c] = { letter: '', num: 0, wordIds: [] };
    }
    let wordId = 0, clueNum = 1;
    const acrossClues: Array<{ num: number; hint: string; text: string; startR: number; startC: number }> = [];
    const downClues: Array<{ num: number; hint: string; text: string; startR: number; startC: number }> = [];

    validKata.forEach(w => {
      const text = String(w.teks || '').toUpperCase().replace(/[^A-Z\u00C0-\u024F]/g, '');
      if (!text) return;
      const hint = String(w.petunjuk || w.hint || '');
      let dir = String(w.arah || 'across') as 'across' | 'down';
      let startR = w.baris != null ? Number(w.baris) - 1 : null;
      let startC = w.kolom != null ? Number(w.kolom) - 1 : null;

      // Auto-place
      if (startR === null || startC === null) {
        for (let att = 0; att < 200; att++) {
          const tr = Math.floor(Math.random() * SIZE);
          const tc = Math.floor(Math.random() * SIZE);
          const td: 'across' | 'down' = Math.random() > 0.5 ? 'across' : 'down';
          let fits = true;
          for (let i = 0; i < text.length; i++) {
            const nr = td === 'down' ? tr + i : tr;
            const nc = td === 'across' ? tc + i : tc;
            if (nr >= SIZE || nc >= SIZE) { fits = false; break; }
            if (grid[nr][nc].letter !== '' && grid[nr][nc].letter !== text[i]) { fits = false; break; }
          }
          if (fits) { startR = tr; startC = tc; dir = td; break; }
        }
        if (startR === null) return;
      }

      const wid = wordId++;
      for (let i = 0; i < text.length; i++) {
        const nr = dir === 'down' ? startR! + i : startR!;
        const nc = dir === 'across' ? startC! + i : startC!;
        if (nr >= SIZE || nc >= SIZE) break;
        grid[nr][nc].letter = text[i];
        grid[nr][nc].wordIds.push(wid);
        if (i === 0 && grid[nr][nc].num === 0) grid[nr][nc].num = clueNum;
      }
      const clue = { num: clueNum, hint: hint || text.charAt(0) + '...', text, startR: startR!, startC: startC! };
      if (dir === 'across') acrossClues.push(clue); else downClues.push(clue);
      clueNum++;
    });

    return { grid, SIZE, acrossClues, downClues };
  }, [validKata, ukuran]);

  const { grid, SIZE: gridSize, acrossClues, downClues } = gridData;

  // Check if all complete
  useEffect(() => {
    if (phase === 'done' && !reported.current && onComplete) {
      reported.current = true;
      onComplete(validKata.length, validKata.length);
    }
  }, [phase]);

  const handleCellInput = (r: number, c: number) => {
    const letter = prompt('Masukkan huruf:');
    if (letter && letter.trim()) {
      const newGrid = { ...userGrid, [`${r},${c}`]: letter.trim().toUpperCase().charAt(0) };
      setUserGrid(newGrid);
      setChecked(false);
    }
  };

  // Check if all crossword cells are correctly filled
  const checkComplete = () => {
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r][c].letter && userGrid[`${r},${c}`] !== grid[r][c].letter) return false;
      }
    }
    return true;
  };

  const handleCheck = () => {
    setChecked(true);
    setTimeout(() => setChecked(false), 1500);
    if (checkComplete()) setPhase('done');
  };

  const handleReveal = () => {
    const empties: string[] = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r][c].letter && userGrid[`${r},${c}`] !== grid[r][c].letter && !revealed.has(`${r},${c}`)) {
          empties.push(`${r},${c}`);
        }
      }
    }
    if (empties.length > 0) {
      const pick = empties[Math.floor(Math.random() * empties.length)];
      const newRevealed = new Set(revealed);
      newRevealed.add(pick);
      setRevealed(newRevealed);
      const [r, c] = pick.split(',').map(Number);
      setUserGrid(prev => ({ ...prev, [`${r},${c}`]: grid[r][c].letter }));
    }
  };

  if (validKata.length === 0) return <EmptyState icon="🔤" label="Teka Silang" compact={compact} />;

  if (phase === 'done') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <span className="text-2xl">🎉</span>
        <div className="text-[11px] font-bold text-cyan-300 mt-1">Teka Silang Selesai!</div>
        <div className="text-[9px] text-cyan-400/60 mt-0.5">{validKata.length} kata terisi</div>
        <button onClick={() => { setUserGrid({}); setRevealed(new Set()); setChecked(false); setPhase('play'); reported.current = false; }}
          className="mt-2 px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30">Ulangi</button>
      </div>
    );
  }

  const cellSize = compact ? 16 : gridSize <= 10 ? 22 : 16;

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2">
      <div className="flex justify-between text-[9px] text-cyan-400 mb-1">
        <span className="font-bold">🔤 Teka Silang</span>
        <span>{validKata.length} kata</span>
      </div>
      <div className="flex-1 min-h-0 flex gap-2 overflow-hidden">
        {/* Grid */}
        <div className="flex-shrink-0 overflow-auto" style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`, gap: 1 }}>
          {grid.map((row, r) => row.map((cell, c) => {
            if (!cell.letter) return <div key={`${r}-${c}`} className="rounded bg-black/30" style={{ width: cellSize, height: cellSize }} />;
            const val = userGrid[`${r},${c}`] || '';
            const isRevealed = revealed.has(`${r},${c}`);
            let cls = 'bg-white/10 border border-white/10 cursor-pointer';
            if (checked) {
              if (val === cell.letter) cls = 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300';
              else if (val) cls = 'bg-red-500/20 border-red-400/40 text-red-300';
            }
            if (isRevealed) cls = 'bg-amber-500/20 border-amber-400/40 text-amber-300';
            return (
              <button key={`${r}-${c}`} onClick={() => handleCellInput(r, c)}
                className={`rounded flex items-center justify-center font-bold transition-colors ${compact ? 'text-[7px]' : 'text-[9px]'} ${cls}`}
                style={{ width: cellSize, height: cellSize, position: 'relative' }}>
                {cell.num > 0 && <span className="absolute top-0 left-0.5 text-[5px] text-white/40 font-bold">{cell.num}</span>}
                {val}
              </button>
            );
          }))}
        </div>
        {/* Clues */}
        <div className="flex-1 min-w-[60px] overflow-y-auto space-y-0.5">
          {acrossClues.length > 0 && (
            <>
              <div className="text-[7px] font-bold text-cyan-400/60 uppercase tracking-wider mt-1">Mendatar →</div>
              {acrossClues.map((cl, i) => (
                <div key={`a${i}`} className="text-[7px] px-1 py-0.5 rounded text-white/50 hover:bg-white/5 cursor-pointer">{cl.num}. {cl.hint}</div>
              ))}
            </>
          )}
          {downClues.length > 0 && (
            <>
              <div className="text-[7px] font-bold text-cyan-400/60 uppercase tracking-wider mt-1">Menurun ↓</div>
              {downClues.map((cl, i) => (
                <div key={`d${i}`} className="text-[7px] px-1 py-0.5 rounded text-white/50 hover:bg-white/5 cursor-pointer">{cl.num}. {cl.hint}</div>
              ))}
            </>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-1">
        <button onClick={handleCheck} className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/40 rounded text-[8px] font-bold text-cyan-200 border border-cyan-500/30 transition-colors">Cek</button>
        <button onClick={handleReveal} className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/40 rounded text-[8px] font-bold text-amber-200 border border-amber-500/30 transition-colors">Buka 1</button>
      </div>
    </div>
  );
}
