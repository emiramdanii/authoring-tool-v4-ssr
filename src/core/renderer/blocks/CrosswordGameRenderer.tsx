'use client';

import React from 'react';
import { Trophy, Star, Dumbbell, RotateCcw, Crosshair } from 'lucide-react';
import type { CrosswordGameBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti, fireConfettiCelebration } from '@/lib/confetti';
import { useGameA11y } from '@/lib/use-game-a11y';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';

/* ═══════════════════════════════════════════════════════════════════════
   CROSSWORD GAME RENDERER (Teka Silang) — SSR renderer system
   ──────────────────────────────────────────────────────────────────────
   Ported from canva/games/CrosswordGame.tsx to the schema-based renderer
   system. Follows the exact same patterns as WordSearchGameRenderer and
   TrueFalseGameRenderer (replay watcher, score guard, token-aware
   styling, inline editing, stable React keys, timer cleanup on unmount).

   Game flow:
     1. Build a crossword grid from block.words (with auto-placement)
     2. Player types letters into grid cells
     3. "Cek" button validates current answers with visual feedback
     4. "Buka 1" reveals a random unsolved cell (counts as a "reveal")
     5. When all cells are correctly filled → done phase
     6. Efficiency-based scoring with 50% floor:
        score = max(ceil(words * 0.5), words - wordsWithReveals)
   ═══════════════════════════════════════════════════════════════════════ */

// ── Grid cell data structure ───────────────────────────────────────
interface GridCell {
  letter: string;
  num: number;
  wordIds: number[];
}

// ── Clue data structure ────────────────────────────────────────────
interface ClueEntry {
  num: number;
  hint: string;
  text: string;
  startR: number;
  startC: number;
}

// ── Grid generation result ─────────────────────────────────────────
interface CrosswordGridData {
  grid: GridCell[][];
  SIZE: number;
  acrossClues: ClueEntry[];
  downClues: ClueEntry[];
  validCount: number;
}

// ── Game phases ────────────────────────────────────────────────────
type GamePhase = 'play' | 'done';

// ═══════════════════════════════════════════════════════════════════
// GRID GENERATION — Build crossword from word list with auto-placement
// ═══════════════════════════════════════════════════════════════════

function buildCrosswordGrid(
  words: CrosswordGameBlock['words'],
  size: number,
): CrosswordGridData {
  const validWords = words.filter(w => w.teks && w.teks.trim());

  const grid: GridCell[][] = [];
  for (let r = 0; r < size; r++) {
    grid[r] = [];
    for (let c = 0; c < size; c++) {
      grid[r]![c] = { letter: '', num: 0, wordIds: [] };
    }
  }

  let wordId = 0;
  let clueNum = 1;
  const acrossClues: ClueEntry[] = [];
  const downClues: ClueEntry[] = [];

  validWords.forEach(w => {
    const text = (w.teks || '').toUpperCase().replace(/[^A-Z\u00C0-\u024F]/g, '');
    if (!text) return;
    const hint = w.hint || '';
    let dir: 'across' | 'down' = w.arah || 'across';
    let startR = w.baris != null ? Number(w.baris) - 1 : null;
    let startC = w.kolom != null ? Number(w.kolom) - 1 : null;

    // Auto-place if no position specified
    if (startR === null || startC === null) {
      for (let att = 0; att < 200; att++) {
        const tr = Math.floor(Math.random() * size);
        const tc = Math.floor(Math.random() * size);
        const td: 'across' | 'down' = Math.random() > 0.5 ? 'across' : 'down';
        let fits = true;
        for (let i = 0; i < text.length; i++) {
          const nr = td === 'down' ? tr + i : tr;
          const nc = td === 'across' ? tc + i : tc;
          if (nr >= size || nc >= size) { fits = false; break; }
          if (grid[nr]![nc]!.letter !== '' && grid[nr]![nc]!.letter !== text[i]!) { fits = false; break; }
        }
        if (fits) { startR = tr; startC = tc; dir = td; break; }
      }
      if (startR === null || startC === null) return;
    }

    const wid = wordId++;
    for (let i = 0; i < text.length; i++) {
      const nr = dir === 'down' ? startR! + i : startR!;
      const nc = dir === 'across' ? startC! + i : startC!;
      if (nr >= size || nc >= size) break;
      grid[nr]![nc]!.letter = text[i]!;
      grid[nr]![nc]!.wordIds.push(wid);
      if (i === 0 && grid[nr]![nc]!.num === 0) grid[nr]![nc]!.num = clueNum;
    }
    const clue: ClueEntry = { num: clueNum, hint: hint || text.charAt(0) + '...', text, startR: startR!, startC: startC! };
    if (dir === 'across') acrossClues.push(clue); else downClues.push(clue);
    clueNum++;
  });

  return { grid, SIZE: size, acrossClues, downClues, validCount: acrossClues.length + downClues.length };
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export const CrosswordGameRenderer = React.memo(function CrosswordGameRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex }: {
  block: CrosswordGameBlock;
  tokens: TokenResolver;
  interactive: boolean;
  isCompact: boolean;
  isEditing?: boolean;
  pageIndex?: number;
}) {
  // ── Derived data ────────────────────────────────────────────────
  const rawWords = block.words || [];
  const gridSize = block.gridSize || 12;

  // Stable serialization key for useMemo
  const wordsKey = React.useMemo(
    () => JSON.stringify(rawWords.filter(w => w.teks && w.teks.trim()).map(w => ({
      t: String(w.teks), h: String(w.hint || ''), r: w.baris, c: w.kolom, d: w.arah,
    }))),
    [rawWords]
  );

  // ── Grid generation ─────────────────────────────────────────────
  const [gridKey, setGridKey] = React.useState(0);
  const gridData = React.useMemo(
    () => buildCrosswordGrid(rawWords, gridSize),
    [gridKey, gridSize, wordsKey],
  );

  const { grid, SIZE, acrossClues, downClues, validCount } = gridData;

  // ── Game state ──────────────────────────────────────────────────
  const [userGrid, setUserGrid] = React.useState<Record<string, string>>({});
  const [revealed, setRevealed] = React.useState<Set<string>>(new Set());
  const [checked, setChecked] = React.useState(false);
  const [phase, setPhase] = React.useState<GamePhase>('play');
  const [activeCell, setActiveCell] = React.useState<{ r: number; c: number } | null>(null);

  // ── Timer cleanup on unmount ────────────────────────────────────
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => {
    return () => { timersRef.current.forEach(clearTimeout); };
  }, []);

  // ── Hidden input ref for mobile keyboard ────────────────────────
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Managed focus via useEffect instead of autoFocus
  React.useEffect(() => {
    if (activeCell) inputRef.current?.focus();
  }, [activeCell]);

  // ── Data-change state reset ─────────────────────────────────────
  React.useEffect(() => {
    setUserGrid({});
    setRevealed(new Set());
    setChecked(false);
    setPhase('play');
    setActiveCell(null);
  }, [wordsKey]);

  // ── Replay watcher (MANDATORY) ──────────────────────────────────
  const replayGeneration = useInteractiveStore(s => s.replayGeneration);
  React.useEffect(() => {
    setUserGrid({});
    setRevealed(new Set());
    setChecked(false);
    setPhase('play');
    setActiveCell(null);
    setGridKey(k => k + 1);
  }, [replayGeneration]);

  // ── Interactive store: score reporting ───────────────────────────
  const reportScore = useInteractiveStore(s => s.reportScore);

  // ── Efficiency-based scoring with 50% floor ─────────────────────
  // Count words that have at least one revealed cell
  const wordsWithReveals = React.useMemo(() => {
    const wordIds = new Set<number>();
    for (const key of revealed) {
      const parts = key.split(',');
      const r = Number(parts[0]);
      const c = Number(parts[1]);
      const cellData = grid[r]?.[c];
      if (cellData) {
        for (const wid of cellData.wordIds) wordIds.add(wid);
      }
    }
    return wordIds.size;
  }, [revealed, grid]);

  // ── Crossword progress (0-1) for ReadingProgressIndicator ────
  const crosswordProgress = React.useMemo(() => {
    let filled = 0, total = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r]![c]!.letter) {
          total++;
          if (userGrid[`${r},${c}`]) filled++;
        }
      }
    }
    return total > 0 ? filled / total : 0;
  }, [grid, SIZE, userGrid]);

  // ── Score guard (MANDATORY) ─────────────────────────────────────
  const hasReportedRef = React.useRef(false);
  React.useEffect(() => {
    if (phase === 'done' && interactive && block.id && !hasReportedRef.current) {
      hasReportedRef.current = true;
      const score = Math.max(Math.ceil(validCount * 0.5), validCount - wordsWithReveals);
      reportScore({
        elementId: block.id,
        pageIndex: pageIndex ?? 0,
        score,
        maxScore: validCount,
        completed: true,
      });
      // Tiered sound & confetti
      const pct = validCount > 0 ? Math.round((score / validCount) * 100) : 0;
      if (pct >= 80) {
        playSound('complete');
        fireConfettiCelebration();
      } else if (pct >= 50) {
        playSound('complete');
        fireConfetti({ count: 30 });
      } else {
        playSound('ding');
      }
      a11y.announceComplete(score, validCount);
    }
    if (phase !== 'done') {
      hasReportedRef.current = false;
    }
  }, [phase, interactive, block.id, validCount, wordsWithReveals, reportScore, pageIndex]);

  // ── Accessibility hook ────────────────────────────────────────
  const a11y = useGameA11y({
    gameType: 'Teka Silang',
    blockId: block.id,
    score: 0,
    maxScore: validCount,
    interactive: interactive ?? false,
  });

  // ── Inline editing hooks ────────────────────────────────────────
  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });

  // ── Get active word direction ───────────────────────────────────
  const getActiveWordDir = React.useCallback(
    (cell: { r: number; c: number } | null): 'across' | 'down' | null => {
      if (!cell) return null;
      const cellData = grid[cell.r]?.[cell.c];
      if (!cellData || cellData.wordIds.length === 0) return null;
      // Check across clues first, then down
      for (let i = 0; i < acrossClues.length; i++) {
        if (cellData.wordIds.includes(i)) return 'across';
      }
      for (let i = 0; i < downClues.length; i++) {
        if (cellData.wordIds.includes(i + acrossClues.length)) return 'down';
      }
      return null;
    },
    [grid, acrossClues, downClues],
  );

  // ── Check if all crossword cells are correctly filled ───────────
  const checkComplete = React.useCallback(
    (ug: Record<string, string>): boolean => {
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (grid[r]![c]!.letter && ug[`${r},${c}`] !== grid[r]![c]!.letter) return false;
        }
      }
      return true;
    },
    [grid, SIZE],
  );

  // ── Keyboard handler ────────────────────────────────────────────
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!activeCell || !interactive || phase !== 'play') return;
      const { r, c } = activeCell;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        const newGrid = { ...userGrid };
        delete newGrid[`${r},${c}`];
        setUserGrid(newGrid);
        setChecked(false);
        // Move to previous cell
        if (c > 0 && grid[r]![c - 1]!.letter) {
          setActiveCell({ r, c: c - 1 });
        } else if (r > 0 && grid[r - 1]![c]!.letter) {
          setActiveCell({ r: r - 1, c });
        }
        return;
      }

      if (e.key === 'ArrowLeft' && c > 0 && grid[r]![c - 1]!.letter) {
        setActiveCell({ r, c: c - 1 }); return;
      }
      if (e.key === 'ArrowRight' && c < SIZE - 1 && grid[r]![c + 1]!.letter) {
        setActiveCell({ r, c: c + 1 }); return;
      }
      if (e.key === 'ArrowUp' && r > 0 && grid[r - 1]![c]!.letter) {
        setActiveCell({ r: r - 1, c }); return;
      }
      if (e.key === 'ArrowDown' && r < SIZE - 1 && grid[r + 1]![c]!.letter) {
        setActiveCell({ r: r + 1, c }); return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        // Move to next empty cell
        for (let nr = r, nc = c + 1; nr < SIZE; nr++, nc = 0) {
          for (; nc < SIZE; nc++) {
            if (grid[nr]![nc]!.letter && (!userGrid[`${nr},${nc}`] || userGrid[`${nr},${nc}`] === '') && (nr !== r || nc !== c)) {
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

        // Auto-advance — direction-aware
        const dir = getActiveWordDir(activeCell) || 'across';
        if (dir === 'down' && r < SIZE - 1 && grid[r + 1]![c]!.letter) {
          setActiveCell({ r: r + 1, c });
        } else if (dir === 'across' && c < SIZE - 1 && grid[r]![c + 1]!.letter) {
          setActiveCell({ r, c: c + 1 });
        } else if (r < SIZE - 1 && grid[r + 1]![0]!.letter) {
          setActiveCell({ r: r + 1, c: 0 });
        }

        if (checkComplete(newGrid)) setPhase('done');
      }
    },
    [activeCell, interactive, phase, userGrid, grid, SIZE, getActiveWordDir, checkComplete],
  );

  // ── Mobile keyboard onChange handler ────────────────────────────
  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const ch = e.target.value.slice(-1).toUpperCase();
      if (ch && /^[A-Z\u00C0-\u024F]$/.test(ch) && activeCell) {
        const { r, c } = activeCell;
        const newGrid = { ...userGrid, [`${r},${c}`]: ch };
        setUserGrid(newGrid);
        setChecked(false);
        const dir = getActiveWordDir(activeCell) || 'across';
        if (dir === 'down' && r < SIZE - 1 && grid[r + 1]![c]!.letter) setActiveCell({ r: r + 1, c });
        else if (dir === 'across' && c < SIZE - 1 && grid[r]![c + 1]!.letter) setActiveCell({ r, c: c + 1 });
        else if (r < SIZE - 1 && grid[r + 1]![0]!.letter) setActiveCell({ r: r + 1, c: 0 });
        if (checkComplete(newGrid)) setPhase('done');
      }
      e.target.value = '';
    },
    [activeCell, userGrid, grid, SIZE, getActiveWordDir, checkComplete],
  );

  // ── Check answers ───────────────────────────────────────────────
  const handleCheck = React.useCallback(() => {
    if (!interactive || phase !== 'play') return;
    playSound('click');
    setChecked(true);
    const tid = setTimeout(() => setChecked(false), 1500);
    timersRef.current.push(tid);
    if (checkComplete(userGrid)) setPhase('done');
  }, [interactive, phase, userGrid, checkComplete]);

  // ── Reveal one cell ─────────────────────────────────────────────
  const handleReveal = React.useCallback(() => {
    if (!interactive || phase !== 'play') return;
    playSound('click');
    const empties: string[] = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r]![c]!.letter && userGrid[`${r},${c}`] !== grid[r]![c]!.letter && !revealed.has(`${r},${c}`)) {
          empties.push(`${r},${c}`);
        }
      }
    }
    if (empties.length > 0) {
      const pick = empties[Math.floor(Math.random() * empties.length)]!;
      const newRevealed = new Set(revealed);
      newRevealed.add(pick);
      setRevealed(newRevealed);
      const parts = pick.split(',');
      const r = Number(parts[0]);
      const c = Number(parts[1]);
      const newGrid = { ...userGrid, [`${r},${c}`]: grid[r]![c]!.letter };
      setUserGrid(newGrid);
      if (checkComplete(newGrid)) setPhase('done');
    }
  }, [interactive, phase, SIZE, grid, userGrid, revealed, checkComplete]);

  // ── Restart handler ─────────────────────────────────────────────
  const handleRestart = React.useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setUserGrid({});
    setRevealed(new Set());
    setChecked(false);
    setPhase('play');
    setActiveCell(null);
    hasReportedRef.current = false;
    setGridKey(k => k + 1);
    playSound('click');
  }, []);

  // ══ EMPTY STATE ═════════════════════════════════════════════════
  if (validCount === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center p-6 text-center rounded-xl"
        style={{
          background: tokens.subtleBg(0.04),
          border: '2px dashed ' + tokens.subtleBorder(0.15),
        }}
      >
        <Crosshair size={24} style={{ color: tokens.muted(0.4) }} />
        <div className="mt-2 font-extrabold" style={{ fontSize: '13px', color: tokens.muted(0.5) }}>
          <InlineTextEditor
            {...titleEditor}
            className="text-[11px] font-extrabold"
            style={{ color: tokens.muted(0.5), fontSize: 'inherit' }}
            placeholder="Ketik judul Teka Silang..."
          />
        </div>
        <div style={{ fontSize: '11px', color: tokens.muted(0.35) }}>
          Belum ada kata ditambahkan untuk Teka Silang
        </div>
      </div>
    );
  }

  // ══ COMPLETION SCREEN ═══════════════════════════════════════════
  if (phase === 'done') {
    const finalScore = Math.max(Math.ceil(validCount * 0.5), validCount - wordsWithReveals);
    const pct = validCount > 0 ? Math.round((finalScore / validCount) * 100) : 0;

    return (
      <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0} gradientBorder>
      <div
        className="text-center p-5 rounded-2xl"
        style={{
          background: tokens.color('bg'),
          border: '2px solid ' + tokens.colorAlpha('c', 0.3),
          boxShadow: tokens.raw.shadow.elevated,
          animation: 'popSuccess 0.5s ease-out',
        }}
      >
        <ReadingProgressIndicator progress={1} tokens={tokens} accent="y" height={3} position="top" />
        {/* Tiered icon */}
        <div className="text-3xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>
          {pct >= 80 ? (
            <Trophy size={28} className="inline" style={{ color: tokens.color('y') }} />
          ) : pct >= 50 ? (
            <Star size={28} className="inline" style={{ color: tokens.color('y') }} />
          ) : (
            <Dumbbell size={28} className="inline" style={{ color: tokens.color('y') }} />
          )}
        </div>

        {/* Tiered message */}
        <div
          className="font-black text-lg mb-1"
          style={{
            fontFamily: tokens.fontFamily('display'),
            color: tokens.color('y'),
          }}
        >
          {pct >= 80 ? 'Luar Biasa!' : pct >= 50 ? 'Bagus!' : 'Terus Berlatih!'}
        </div>

        {/* Score display */}
        <div className="mb-4" style={{ fontSize: '13px', color: tokens.muted(0.8) }}>
          Skor kamu: {finalScore}/{validCount} ({pct}%)
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-3">
          <PremiumBadge tokens={tokens} accent="g" variant="glass">Kata: {validCount}</PremiumBadge>
          <PremiumBadge tokens={tokens} accent="o" variant="glass">Dibantu: {wordsWithReveals}</PremiumBadge>
        </div>

        {/* Replay button */}
        {interactive && (
          <MicroInteraction tokens={tokens} accent="y" effect="squish">
          <button
            className={"mt-4 px-5 py-2 rounded-xl font-extrabold " + tokens.iosButtonTw(interactive)}
            onClick={handleRestart}
            style={{
              fontSize: '13px',
              background: 'linear-gradient(135deg, ' + tokens.color('c') + ', ' + tokens.color('y') + ')',
              color: tokens.color('bg'),
              boxShadow: '0 4px 16px ' + tokens.colorAlpha('c', 0.35),
            }}
          >
            <RotateCcw size={14} className="inline" /> Ulangi
          </button>
          </MicroInteraction>
        )}
      </div>
      </PremiumBlockWrapper>
    );
  }

  // ══ PLAY PHASE ══════════════════════════════════════════════════
  const cellSize = isCompact ? 16 : SIZE <= 10 ? 22 : 16;

  return (
    <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0}>
    <div
      className="space-y-3 game-block"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      {...a11y.rootAria}
      data-interactive
    >
      <ReadingProgressIndicator progress={crosswordProgress} tokens={tokens} accent="y" height={3} position="top" />
      {/* Hidden instruction for screen readers */}
      <div id={a11y.instructionId} className="sr-only">Isi huruf pada sel kosong untuk menyelesaikan teka silang</div>
      {/* ── Header with title and progress ────────────────────────── */}
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="font-extrabold" style={{ fontSize: '13px', color: tokens.color('c') }}>
            <Crosshair size={14} className="inline" />{' '}
            <InlineTextEditor
              {...titleEditor}
              className="text-[11px] font-extrabold"
              style={{ color: tokens.color('c'), fontSize: 'inherit' }}
              placeholder="Ketik judul Teka Silang..."
            />
          </div>
        </div>
        <PremiumBadge tokens={tokens} accent="c" variant="glass">
          {validCount} kata{revealed.size > 0 ? ` · ${revealed.size} dibantu` : ''}
        </PremiumBadge>
      </div>

      {/* ── Main layout: Grid + Clues ─────────────────────────────── */}
      <div className="flex gap-3">
        {/* ── Crossword Grid — constraint saat compact ── */}
        <div className="flex-shrink-0" style={{ ...(isCompact ? { maxHeight: '240px', maxWidth: '240px', overflow: 'hidden' } : {}) }}>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${SIZE}, ${cellSize}px)`,
              gap: 1,
            }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                if (!cell.letter) {
                  return (
                    <div
                      key={`cw-cell-${block.id || 'cw'}-${r}-${c}`}
                      className="rounded"
                      style={{
                        width: cellSize,
                        height: cellSize,
                        background: tokens.subtleBg(0.03),
                      }}
                    />
                  );
                }

                const val = userGrid[`${r},${c}`] || '';
                const isRevealed = revealed.has(`${r},${c}`);
                const isActive = activeCell?.r === r && activeCell?.c === c;

                // Determine cell styling
                let bg: string;
                let bdr: string;
                let textColor: string;

                if (isActive) {
                  bg = tokens.colorAlpha('c', 0.2);
                  bdr = tokens.color('c');
                  textColor = tokens.color('c');
                } else if (isRevealed) {
                  bg = tokens.colorAlpha('o', 0.15);
                  bdr = tokens.colorAlpha('o', 0.4);
                  textColor = tokens.color('o');
                } else if (checked) {
                  if (val === cell.letter) {
                    bg = tokens.colorAlpha('g', 0.15);
                    bdr = tokens.colorAlpha('g', 0.4);
                    textColor = tokens.color('g');
                  } else if (val) {
                    bg = tokens.colorAlpha('r', 0.15);
                    bdr = tokens.colorAlpha('r', 0.4);
                    textColor = tokens.color('r');
                  } else {
                    bg = tokens.colorAlpha('card', 0.6);
                    bdr = tokens.subtleBorder(0.12);
                    textColor = tokens.color('text');
                  }
                } else {
                  bg = tokens.colorAlpha('card', 0.6);
                  bdr = tokens.subtleBorder(0.12);
                  textColor = tokens.color('text');
                }

                return (
                  <button
                    key={`cw-cell-${block.id || 'cw'}-${r}-${c}`}
                    role="gridcell"
                    onClick={() => { if (interactive && phase === 'play') setActiveCell({ r, c }); }}
                    disabled={!interactive || phase !== 'play'}
                    className="flex items-center justify-center font-bold transition-[background-color,border-color,color,box-shadow] rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      fontSize: isCompact ? '7px' : '9px',
                      background: bg,
                      border: `1px solid ${bdr}`,
                      color: textColor,
                      position: 'relative',
                      cursor: interactive && phase === 'play' ? 'pointer' : 'default',
                      boxShadow: isActive ? '0 0 8px ' + tokens.colorAlpha('c', 0.3) : 'none',
                    }}
                    aria-label={`Baris ${r + 1} kolom ${c + 1}${cell.num > 0 ? `, petunjuk ${cell.num}` : ''}${val ? `, terisi ${val}` : ', kosong'}`}
                  >
                    {cell.num > 0 && (
                      <span
                        className="absolute top-0 left-0.5 font-bold"
                        style={{ fontSize: '5px', color: tokens.muted(0.4), lineHeight: 1 }}
                      >
                        {cell.num}
                      </span>
                    )}
                    {val}
                  </button>
                );
              }),
            )}
          </div>
        </div>

        {/* ── Clues panel — overflow protection ── */}
        <div className="flex-1 min-w-0">
          <div
            className={`rounded-xl p-3 premium-card-glow ${isCompact ? 'max-h-48 overflow-y-auto' : 'max-h-64 overflow-y-auto'}`}
            style={{
              background: tokens.colorAlpha('card', 0.4),
              border: '1px solid ' + tokens.subtleBorder(0.1),
              boxShadow: tokens.raw.shadow.card,
            }}
          >
            {acrossClues.length > 0 && (
              <>
                <div
                  className="font-extrabold uppercase tracking-wider mb-1.5"
                  style={{ fontSize: '9px', color: tokens.color('c') }}
                >
                  Mendatar →
                </div>
                <div className="space-y-1">
                  {acrossClues.map((cl, i) => (
                    <button
                      key={`cw-across-${block.id || 'cw'}-${cl.num}-${i}`}
                      onClick={() => { if (interactive && phase === 'play') setActiveCell({ r: cl.startR, c: cl.startC }); }}
                      className="block text-left w-full px-1.5 py-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                      style={{
                        fontSize: '9px',
                        color: tokens.muted(0.6),
                        cursor: interactive && phase === 'play' ? 'pointer' : 'default',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    >
                      {cl.num}. {cl.hint}
                    </button>
                  ))}
                </div>
              </>
            )}
            {downClues.length > 0 && (
              <>
                <div
                  className="font-extrabold uppercase tracking-wider mt-2 mb-1.5"
                  style={{ fontSize: '9px', color: tokens.color('c') }}
                >
                  Menurun ↓
                </div>
                <div className="space-y-1">
                  {downClues.map((cl, i) => (
                    <button
                      key={`cw-down-${block.id || 'cw'}-${cl.num}-${i}`}
                      onClick={() => { if (interactive && phase === 'play') setActiveCell({ r: cl.startR, c: cl.startC }); }}
                      className="block text-left w-full px-1.5 py-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                      style={{
                        fontSize: '9px',
                        color: tokens.muted(0.6),
                        cursor: interactive && phase === 'play' ? 'pointer' : 'default',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    >
                      {cl.num}. {cl.hint}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex gap-2">
        <button
          onClick={handleCheck}
          disabled={!interactive || phase !== 'play'}
          aria-label="Cek jawaban"
          className={"px-3 py-1.5 rounded-lg font-extrabold " + tokens.iosGameButtonTw(interactive && phase === 'play')}
          style={{
            fontSize: '10px',
            background: tokens.colorAlpha('c', 0.15),
            color: tokens.color('c'),
            border: '1px solid ' + tokens.colorAlpha('c', 0.3),
            cursor: interactive && phase === 'play' ? 'pointer' : 'default',
            opacity: interactive && phase === 'play' ? 1 : 0.5,
          }}
        >
          Cek
        </button>
        <button
          onClick={handleReveal}
          disabled={!interactive || phase !== 'play'}
          aria-label="Buka satu huruf"
          className={"px-3 py-1.5 rounded-lg font-extrabold " + tokens.iosGameButtonTw(interactive && phase === 'play')}
          style={{
            fontSize: '10px',
            background: tokens.colorAlpha('o', 0.15),
            color: tokens.color('o'),
            border: '1px solid ' + tokens.colorAlpha('o', 0.3),
            cursor: interactive && phase === 'play' ? 'pointer' : 'default',
            opacity: interactive && phase === 'play' ? 1 : 0.5,
          }}
        >
          Buka 1
        </button>
      </div>

      {/* ── Print Answer Key (teacher only) ── */}
      <div className="print-only print-answer-key">
        <h3>Kunci Jawaban: Teka Silang</h3>
        <ul>
          {acrossClues.map((cl, i) => (
            <li key={`cw-ans-across-${block.id || 'cw'}-${i}`}>Mendatar {cl.num}. {cl.hint} — <strong>{cl.text}</strong></li>
          ))}
          {downClues.map((cl, i) => (
            <li key={`cw-ans-down-${block.id || 'cw'}-${i}`}>Menurun {cl.num}. {cl.hint} — <strong>{cl.text}</strong></li>
          ))}
        </ul>
      </div>

      {/* Hidden input for mobile keyboard support */}
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 fixed top-0 left-0 w-px h-px"
        style={{ fontSize: '16px' }}
        onKeyDown={handleKeyDown}
        onChange={handleInputChange}
        value=""
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
    </PremiumBlockWrapper>
  );
});