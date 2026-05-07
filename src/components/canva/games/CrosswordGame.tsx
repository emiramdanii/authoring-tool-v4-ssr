'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { EmptyState } from './shared';
import type { GameComponentProps } from './shared';

/* ═══════════════════════════════════════════════════════════════
   CROSSWORD GAME (Teka Silang) — Efficiency-based scoring with 50% floor
   Score = max(ceil(words * 0.5), words - revealsUsed)
   No more prompt() — uses inline keyboard input
   ═══════════════════════════════════════════════════════════════ */
export function CrosswordGame({ data, compact, onComplete }: GameComponentProps) {
  const kata = (data.kata as Array<Record<string, unknown>>) || [];
  const ukuran = (data.ukuran as number) || 12;
  const validKata = kata.filter(k => k.teks && String(k.teks).trim());
  const [userGrid, setUserGrid] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [phase, setPhase] = useState<'play' | 'done'>('play');
  const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>(null);
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

  // Efficiency-based scoring with 50% floor: score = max(ceil(words*0.5), words - reveals)
  useEffect(() => {
    if (phase === 'done' && !reported.current && onComplete) {
      reported.current = true;
      const score = Math.max(Math.ceil(validKata.length * 0.5), validKata.length - revealed.size);
      onComplete(score, validKata.length);
    }
  }, [phase]);

  // Handle keyboard input for active cell
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeCell) return;
    const { r, c } = activeCell;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      const newGrid = { ...userGrid };
      delete newGrid[`${r},${c}`];
      setUserGrid(newGrid);
      setChecked(false);
      // Move to previous cell
      if (c > 0 && grid[r][c - 1].letter) {
        setActiveCell({ r, c: c - 1 });
      } else if (r > 0 && grid[r - 1][c].letter) {
        setActiveCell({ r: r - 1, c });
      }
      return;
    }

    if (e.key === 'ArrowLeft' && c > 0 && grid[r][c - 1].letter) {
      setActiveCell({ r, c: c - 1 }); return;
    }
    if (e.key === 'ArrowRight' && c < gridSize - 1 && grid[r][c + 1].letter) {
      setActiveCell({ r, c: c + 1 }); return;
    }
    if (e.key === 'ArrowUp' && r > 0 && grid[r - 1][c].letter) {
      setActiveCell({ r: r - 1, c }); return;
    }
    if (e.key === 'ArrowDown' && r < gridSize - 1 && grid[r + 1][c].letter) {
      setActiveCell({ r: r + 1, c }); return;
    }
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      // Move to next empty cell
      for (let nr = r, nc = c + 1; nr < gridSize; nr++, nc = 0) {
        for (; nc < gridSize; nc++) {
          if (grid[nr][nc].letter && (!userGrid[`${nr},${nc}`] || userGrid[`${nr},${nc}`] === '') && (nr !== r || nc !== c)) {
            setActiveCell({ r: nr, c: nc }); return;
          }
        }
      }
      return;
    }

    // Letter input
    const letter = e.key.toUpperCase();
    if (/^[A-Z\u00C0-\u024F]$/.test(letter)) {
      e.preventDefault();
      const newGrid = { ...userGrid, [`${r},${c}`]: letter };
      setUserGrid(newGrid);
      setChecked(false);

      // Auto-advance to next cell
      if (c < gridSize - 1 && grid[r][c + 1].letter) {
        setActiveCell({ r, c: c + 1 });
      } else if (r < gridSize - 1 && grid[r + 1][0].letter) {
        setActiveCell({ r: r + 1, c: 0 });
      }

      // Check if all complete
      const allDone = checkComplete(newGrid);
      if (allDone) setPhase('done');
    }
  };

  // Check if all crossword cells are correctly filled
  const checkComplete = (ug: Record<string, string> = userGrid) => {
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r][c].letter && ug[`${r},${c}`] !== grid[r][c].letter) return false;
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
      const newGrid = { ...userGrid, [`${r},${c}`]: grid[r][c].letter };
      setUserGrid(newGrid);
      if (checkComplete(newGrid)) setPhase('done');
    }
  };

  if (validKata.length === 0) return <EmptyState icon="🔤" label="Teka Silang" compact={compact} />;

  const finalScore = Math.max(Math.ceil(validKata.length * 0.5), validKata.length - revealed.size);
  const scorePct = validKata.length > 0 ? Math.round((finalScore / validKata.length) * 100) : 0;

  if (phase === 'done') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <span className="text-2xl">🎉</span>
        <div className="text-[11px] font-bold text-cyan-300 mt-1">Teka Silang Selesai!</div>
        <div className="text-[14px] font-black mt-0.5" style={{ color: scorePct >= 85 ? '#34d399' : scorePct >= 70 ? '#f9c12e' : '#f87171' }}>{scorePct}%</div>
        <div className="text-[9px] text-cyan-400/60 mt-0.5">{validKata.length} kata{revealed.size > 0 ? ` · ${revealed.size} dibantu` : ' · Sempurna!'}</div>
        <button onClick={() => { setUserGrid({}); setRevealed(new Set()); setChecked(false); setPhase('play'); setActiveCell(null); reported.current = false; }}
          className="mt-2 px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30">Ulangi</button>
      </div>
    );
  }

  const cellSize = compact ? 16 : gridSize <= 10 ? 22 : 16;

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="flex justify-between text-[9px] text-cyan-400 mb-1">
        <span className="font-bold">🔤 Teka Silang</span>
        <span>{validKata.length} kata{revealed.size > 0 ? ` · ${revealed.size} dibantu` : ''}</span>
      </div>
      <div className="flex-1 min-h-0 flex gap-2 overflow-hidden">
        {/* Grid */}
        <div className="flex-shrink-0 overflow-auto" style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`, gap: 1 }}>
          {grid.map((row, r) => row.map((cell, c) => {
            if (!cell.letter) return <div key={`${r}-${c}`} className="rounded bg-black/30" style={{ width: cellSize, height: cellSize }} />;
            const val = userGrid[`${r},${c}`] || '';
            const isRevealed = revealed.has(`${r},${c}`);
            const isActive = activeCell?.r === r && activeCell?.c === c;
            let cls = 'bg-white/10 border text-white/70 cursor-pointer';
            if (isActive) cls = 'bg-cyan-500/30 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/50';
            if (checked) {
              if (val === cell.letter) cls = 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300';
              else if (val) cls = 'bg-red-500/20 border-red-400/40 text-red-300';
            }
            if (isRevealed) cls = 'bg-amber-500/20 border-amber-400/40 text-amber-300';
            return (
              <button key={`${r}-${c}`}
                onClick={() => setActiveCell({ r, c })}
                className={`rounded flex items-center justify-center font-bold transition-colors border-white/10 border ${compact ? 'text-[7px]' : 'text-[9px]'} ${cls}`}
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
                <div key={`a${i}`}
                  onClick={() => setActiveCell({ r: cl.startR, c: cl.startC })}
                  className="text-[7px] px-1 py-0.5 rounded text-white/50 hover:bg-white/5 cursor-pointer">{cl.num}. {cl.hint}</div>
              ))}
            </>
          )}
          {downClues.length > 0 && (
            <>
              <div className="text-[7px] font-bold text-cyan-400/60 uppercase tracking-wider mt-1">Menurun ↓</div>
              {downClues.map((cl, i) => (
                <div key={`d${i}`}
                  onClick={() => setActiveCell({ r: cl.startR, c: cl.startC })}
                  className="text-[7px] px-1 py-0.5 rounded text-white/50 hover:bg-white/5 cursor-pointer">{cl.num}. {cl.hint}</div>
              ))}
            </>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-1">
        <button onClick={handleCheck} className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/40 rounded text-[8px] font-bold text-cyan-200 border border-cyan-500/30 transition-colors">Cek</button>
        <button onClick={handleReveal} className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/40 rounded text-[8px] font-bold text-amber-200 border border-amber-500/30 transition-colors">Buka 1</button>
      </div>
      {/* Hidden input for mobile keyboard support */}
      <input
        type="text"
        className="opacity-0 absolute w-0 h-0"
        autoFocus={activeCell !== null}
        onKeyDown={handleKeyDown}
        onChange={() => {}}
        value=""
      />
    </div>
  );
}
