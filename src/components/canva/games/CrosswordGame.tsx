'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { EmptyState } from './shared';
import type { GameComponentProps } from './shared';

/* ═══════════════════════════════════════════════════════════════
   CROSSWORD GAME (Teka Silang) — Efficiency-based scoring with 50% floor
   Score = max(ceil(words * 0.5), words - revealsUsed)
   No more prompt() — uses inline keyboard input
   ═══════════════════════════════════════════════════════════════ */
export function CrosswordGame({ data, compact, interactive, onComplete }: GameComponentProps) {
  const kata = (data.kata as Array<Record<string, unknown>>) || [];
  const ukuran = (data.ukuran as number) || 12;
  // Stable serialization key so useMemo doesn't reshuffle on every render
  const kataKey = JSON.stringify(kata.filter(k => k.teks && String(k.teks).trim()).map(k => ({ t: String(k.teks), h: String(k.petunjuk || k.hint || ''), r: k.baris, c: k.kolom, d: k.arah })));
  const [userGrid, setUserGrid] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [phase, setPhase] = useState<'play' | 'done'>('play');
  const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>(null);
  const reported = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup all timeouts on unmount
  useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);

  // Phase 9 fix: Managed focus via useEffect instead of autoFocus,
  // which caused keyboard flicker on mobile
  useEffect(() => {
    if (activeCell) inputRef.current?.focus();
  }, [activeCell]);

  // Phase 9 fix: Reset game state when crossword data changes
  useEffect(() => {
    setUserGrid({});
    setRevealed(new Set());
    setChecked(false);
    setPhase('play');
    setActiveCell(null);
    reported.current = false;
  }, [kataKey]);

  // Build crossword grid
  const gridData = useMemo(() => {
    const validKata = kata.filter(k => k.teks && String(k.teks).trim());
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
        // Fix: guard BOTH startR and startC — if either is still null, skip this word
        if (startR === null || startC === null) return;
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

    return { grid, SIZE, acrossClues, downClues, validCount: acrossClues.length + downClues.length };
  }, [kataKey, ukuran]);

  const { grid, SIZE: gridSize, acrossClues, downClues, validCount } = gridData;
  const validKataLen = validCount;

  // Efficiency-based scoring with 50% floor: score = max(ceil(words*0.5), words - revealsUsed)
  // Phase 9+ fix: Count words with at least one revealed cell (not raw cell count),
  // so the scoring formula uses consistent units (words, not cells).
  const wordsWithReveals = useMemo(() => {
    const wordIds = new Set<number>();
    for (const key of revealed) {
      const [r, c] = key.split(',').map(Number);
      for (const wid of grid[r]?.[c]?.wordIds ?? []) wordIds.add(wid);
    }
    return wordIds.size;
  }, [revealed, grid]);
  useEffect(() => {
    if (phase === 'done' && !reported.current && onComplete) {
      reported.current = true;
      const score = Math.max(Math.ceil(validKataLen * 0.5), validKataLen - wordsWithReveals);
      onComplete(score, validKataLen);
    }
  }, [phase, onComplete, validKataLen, wordsWithReveals]);

  // Determine active word direction from the active cell's wordIds
  const getActiveWordDir = useCallback((cell: { r: number; c: number } | null): 'across' | 'down' | null => {
    if (!cell) return null;
    const cellData = grid[cell.r]?.[cell.c];
    if (!cellData || cellData.wordIds.length === 0) return null;
    // Check across clues first, then down
    for (const cl of acrossClues) {
      if (cellData.wordIds.includes(acrossClues.indexOf(cl))) return 'across';
    }
    for (const cl of downClues) {
      if (cellData.wordIds.includes(downClues.indexOf(cl) + acrossClues.length)) return 'down';
    }
    return null;
  }, [grid, acrossClues, downClues]);

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

      // Auto-advance to next cell — direction-aware
      const dir = getActiveWordDir(activeCell) || 'across';
      if (dir === 'down' && r < gridSize - 1 && grid[r + 1][c].letter) {
        setActiveCell({ r: r + 1, c });
      } else if (dir === 'across' && c < gridSize - 1 && grid[r][c + 1].letter) {
        setActiveCell({ r, c: c + 1 });
      } else if (r < gridSize - 1 && grid[r + 1][0].letter) {
        // Fallback: wrap to next row
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
    const tid = setTimeout(() => setChecked(false), 1500);
    timersRef.current.push(tid);
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

  if (validKataLen === 0) return <EmptyState icon="🔤" label="Teka Silang" compact={compact} interactive={interactive} />;

  const finalScore = Math.max(Math.ceil(validKataLen * 0.5), validKataLen - wordsWithReveals);
  const scorePct = validKataLen > 0 ? Math.round((finalScore / validKataLen) * 100) : 0;

  if (phase === 'done') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <span className="text-2xl">🎉</span>
        <div className="text-[11px] font-bold text-cyan-300 mt-1">Teka Silang Selesai!</div>
        <div className={`text-[14px] font-black mt-0.5 ${scorePct >= 85 ? 'text-emerald-400' : scorePct >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{scorePct}%</div>
        <div className="text-[9px] text-cyan-400/60 mt-0.5">{validKataLen} kata{revealed.size > 0 ? ` · ${revealed.size} dibantu` : ' · Sempurna!'}</div>
        <button onClick={() => { timersRef.current.forEach(clearTimeout); timersRef.current = []; setUserGrid({}); setRevealed(new Set()); setChecked(false); setPhase('play'); setActiveCell(null); reported.current = false; }}
          className="mt-2 px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30">Ulangi</button>
      </div>
    );
  }

  const cellSize = compact ? 16 : gridSize <= 10 ? 22 : 16;

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="flex justify-between text-[9px] text-cyan-400 mb-1">
        <span className="font-bold">🔤 Teka Silang</span>
        <span>{validKataLen} kata{revealed.size > 0 ? ` · ${revealed.size} dibantu` : ''}</span>
      </div>
      <div className="flex-1 min-h-0 flex gap-2 overflow-hidden">
        {/* Grid */}
        <div className="flex-shrink-0 overflow-auto" style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`, gap: 1 }}>
          {grid.map((row, r) => row.map((cell, c) => {
            if (!cell.letter) return <div key={`${r}-${c}`} className="rounded bg-app-surface/30" style={{ width: cellSize, height: cellSize }} />;
            const val = userGrid[`${r},${c}`] || '';
            const isRevealed = revealed.has(`${r},${c}`);
            const isActive = activeCell?.r === r && activeCell?.c === c;
            let cls = 'bg-app-elevated/10 border text-app-primary/70 cursor-pointer';
            if (isActive) cls = 'bg-cyan-500/30 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/50';
            if (checked) {
              if (val === cell.letter) cls = 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300';
              else if (val) cls = 'bg-red-500/20 border-red-400/40 text-red-300';
            }
            if (isRevealed) cls = 'bg-amber-500/20 border-amber-400/40 text-amber-300';
            return (
              <button key={`${r}-${c}`}
                onClick={() => setActiveCell({ r, c })}
                className={`rounded flex items-center justify-center font-bold transition-colors border-app-border/10 border ${compact ? 'text-[7px]' : 'text-[9px]'} ${cls}`}
                style={{ width: cellSize, height: cellSize, position: 'relative' }}>
                {cell.num > 0 && <span className="absolute top-0 left-0.5 text-[5px] text-app-primary/40 font-bold">{cell.num}</span>}
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
                <button key={`a${i}`}
                  onClick={() => setActiveCell({ r: cl.startR, c: cl.startC })}
                  className="text-[7px] px-1 py-0.5 rounded text-app-primary/50 hover:bg-app-elevated/5 cursor-pointer text-left">{cl.num}. {cl.hint}</button>
              ))}
            </>
          )}
          {downClues.length > 0 && (
            <>
              <div className="text-[7px] font-bold text-cyan-400/60 uppercase tracking-wider mt-1">Menurun ↓</div>
              {downClues.map((cl, i) => (
                <button key={`d${i}`}
                  onClick={() => setActiveCell({ r: cl.startR, c: cl.startC })}
                  className="text-[7px] px-1 py-0.5 rounded text-app-primary/50 hover:bg-app-elevated/5 cursor-pointer text-left">{cl.num}. {cl.hint}</button>
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
      {/* Phase 9 fix: onChange now handles mobile virtual keyboard input
          (which fires input/change events instead of keydown for characters).
          autoFocus replaced with useEffect to prevent keyboard flicker. */}
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 fixed top-0 left-0 w-px h-px"
        style={{ fontSize: '16px' }}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          const ch = e.target.value.slice(-1).toUpperCase();
          if (ch && /^[A-Z\u00C0-\u024F]$/.test(ch) && activeCell) {
            const { r, c } = activeCell;
            const newGrid = { ...userGrid, [`${r},${c}`]: ch };
            setUserGrid(newGrid);
            setChecked(false);
            // Auto-advance — direction-aware (same as handleKeyDown)
            const dir = getActiveWordDir(activeCell) || 'across';
            if (dir === 'down' && r < gridSize - 1 && grid[r + 1][c].letter) setActiveCell({ r: r + 1, c });
            else if (dir === 'across' && c < gridSize - 1 && grid[r][c + 1].letter) setActiveCell({ r, c: c + 1 });
            else if (r < gridSize - 1 && grid[r + 1][0].letter) setActiveCell({ r: r + 1, c: 0 });
            if (checkComplete(newGrid)) setPhase('done');
          }
          e.target.value = '';
        }}
        value=""
      />
    </div>
  );
}
