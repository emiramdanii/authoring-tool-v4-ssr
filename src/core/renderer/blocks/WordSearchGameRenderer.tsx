'use client';

import React from 'react';
import { Trophy, Star, Dumbbell, RotateCcw, Search } from 'lucide-react';
import type { WordSearchGameBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti, fireConfettiCelebration } from '@/lib/confetti';
import { announceToScreenReader, handleRovingFocus } from '@/lib/a11y';

// ═══════════════════════════════════════════════════════════════════
// WORD SEARCH GAME RENDERER — Teka-Teki Kata for PPKn education
// ═══════════════════════════════════════════════════════════════════
// Takes `block.words` and a `block.gridSize`, generates a letter
// grid with words placed in random directions (horizontal, vertical,
// diagonal — forward and reversed). Player clicks two cells to form
// a straight line; if it spells a word from the list (forward or
// reversed), the word is marked as found.
//
// Scoring: efficiency-based with 50% floor
//   score = max(ceil(words * 0.5), words - wrongAttempts)
//
// Architecture mirrors KuisRenderer / MemoryGameRenderer exactly:
//   - replayGeneration watcher resets all state
//   - hasReportedRef guard prevents duplicate score reports
//   - Token-aware styling (no hardcoded colors)
//   - Inline editing via useInlineEditor
//   - Stable React keys (never index as key)
// ═══════════════════════════════════════════════════════════════════

// ── Placement info for a successfully placed word ─────────────────
interface WordPlacement {
  /** The word string that was placed */
  word: string;
  /** Ordered list of [row, col] cell coordinates */
  cells: Array<[number, number]>;
}

// ── 8 possible placement directions (dr, dc) ─────────────────────
const DIRECTIONS: Array<[number, number]> = [
  [0, 1],   // → horizontal right
  [0, -1],  // ← horizontal left
  [1, 0],   // ↓ vertical down
  [-1, 0],  // ↑ vertical up
  [1, 1],   // ↘ diagonal down-right
  [-1, -1], // ↖ diagonal up-left
  [1, -1],  // ↙ diagonal down-left
  [-1, 1],  // ↗ diagonal up-right
];

// ── Game phases ──────────────────────────────────────────────────
type GamePhase = 'play' | 'done';

// ═══════════════════════════════════════════════════════════════════
// GRID GENERATION — Place words in random directions, fill blanks
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate a letter grid with words placed at random positions/directions.
 * Empty cells are filled with random uppercase letters.
 * Returns the grid and a list of successful placements.
 *
 * Strategy: Sort words longest-first for better placement success,
 * then attempt each word up to 100 random positions. If a word
 * cannot be placed after all attempts, it is skipped gracefully.
 */
function generateGridWithPlacements(
  words: string[],
  size: number,
): { grid: string[][]; placements: WordPlacement[] } {
  // Initialize empty grid
  const grid: string[][] = Array.from({ length: size }, () =>
    Array(size).fill(''),
  );

  const placements: WordPlacement[] = [];

  // Sort longest-first for better placement density
  const sorted = [...words].sort((a, b) => b.length - a.length);

  for (const word of sorted) {
    const upper = word.toUpperCase();
    let placed = false;

    // Try up to 100 random placements
    for (let attempt = 0; attempt < 100; attempt++) {
      // Pick a random direction
      const [dr, dc] =
        DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

      // Compute valid start range so the word fits within the grid
      const lastR = dr === 0 ? size - 1 : dr > 0 ? size - upper.length : upper.length - 1;
      const lastC = dc === 0 ? size - 1 : dc > 0 ? size - upper.length : upper.length - 1;
      const firstR = dr < 0 ? upper.length - 1 : 0;
      const firstC = dc < 0 ? upper.length - 1 : 0;

      if (lastR < firstR || lastC < firstC) continue; // Word too long for grid in this direction

      const startR = firstR + Math.floor(Math.random() * (lastR - firstR + 1));
      const startC = firstC + Math.floor(Math.random() * (lastC - firstC + 1));

      // Check if all cells along the path are available (empty or same letter)
      let fits = true;
      const cells: Array<[number, number]> = [];
      for (let i = 0; i < upper.length; i++) {
        const r = startR + dr * i;
        const c = startC + dc * i;
        // Bounds check (should always pass given start range, but be safe)
        if (r < 0 || r >= size || c < 0 || c >= size) { fits = false; break; }
        if (grid[r][c] !== '' && grid[r][c] !== upper[i]) { fits = false; break; }
        cells.push([r, c]);
      }

      if (fits) {
        // Place the word
        for (let i = 0; i < upper.length; i++) {
          grid[cells[i][0]][cells[i][1]] = upper[i];
        }
        placements.push({ word: upper, cells });
        placed = true;
        break;
      }
    }
    // If not placed after 100 attempts, skip silently — the word
    // simply won't appear in the grid for this round.
  }

  // Fill empty cells with random uppercase letters (A–Z)
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      }
    }
  }

  return { grid, placements };
}

// ═══════════════════════════════════════════════════════════════════
// LINE VALIDATION — Check if two cells form a valid straight line
// ═══════════════════════════════════════════════════════════════════

/**
 * Given a start cell [r1,c1] and end cell [r2,c2], validate that
 * they form a straight line (horizontal, vertical, or diagonal) and
 * return the ordered list of cells along that line.
 * Returns null if the selection is not a valid straight line.
 */
function getLineCells(
  start: [number, number],
  end: [number, number],
): Array<[number, number]> | null {
  const [r1, c1] = start;
  const [r2, c2] = end;

  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);

  // Same cell is not a valid line
  if (dr === 0 && dc === 0) return null;

  // Validate straight line: delta must be uniform along the path
  const deltaR = Math.abs(r2 - r1);
  const deltaC = Math.abs(c2 - c1);

  // Must be horizontal (dr=0), vertical (dc=0), or 45° diagonal (deltaR === deltaC)
  const isHorizontal = dr === 0 && dc !== 0;
  const isVertical = dc === 0 && dr !== 0;
  const isDiagonal = deltaR === deltaC && dr !== 0 && dc !== 0;

  if (!isHorizontal && !isVertical && !isDiagonal) return null;

  const steps = Math.max(deltaR, deltaC);
  const cells: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    cells.push([r1 + dr * i, c1 + dc * i]);
  }

  return cells;
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export const WordSearchGameRenderer = React.memo(function WordSearchGameRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex }: {
  block: WordSearchGameBlock;
  tokens: TokenResolver;
  interactive: boolean;
  isCompact: boolean;
  isEditing?: boolean;
  pageIndex?: number;
}) {
  // ── Derived data ────────────────────────────────────────────────
  const words = block.words || [];
  const gridSize = block.gridSize || Math.max(8, Math.ceil(Math.sqrt(words.join('').length * 3)));
  // Stable key that changes when word content changes (for useMemo deps)
  const wordsKey = words.join(',');

  // ── Grid generation (regenerates when gridKey changes) ──────────
  const [gridKey, setGridKey] = React.useState(0);
  const { grid, placements } = React.useMemo(
    () => generateGridWithPlacements(words, gridSize),
    [gridKey, gridSize, wordsKey],
  );

  // ── Game state ──────────────────────────────────────────────────
  const [found, setFound] = React.useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = React.useState<Set<string>>(new Set());
  const [startCell, setStartCell] = React.useState<[number, number] | null>(null);
  const [wrongAttempts, setWrongAttempts] = React.useState(0);
  const [phase, setPhase] = React.useState<GamePhase>('play');

  // ── Replay watcher: reset all state when replayGeneration bumps ──
  const replayGeneration = useInteractiveStore(s => s.replayGeneration);
  React.useEffect(() => {
    setFound(new Set());
    setFoundCells(new Set());
    setStartCell(null);
    setWrongAttempts(0);
    setPhase('play');
    setGridKey(k => k + 1);
  }, [replayGeneration]);

  // ── Interactive store: score reporting ───────────────────────────
  const reportScore = useInteractiveStore(s => s.reportScore);

  // ── Score guard: report once per completion cycle ───────────────
  const hasReportedRef = React.useRef(false);
  React.useEffect(() => {
    if (phase === 'done' && interactive && block.id && !hasReportedRef.current) {
      hasReportedRef.current = true;
      const score = Math.max(
        Math.ceil(placements.length * 0.5),
        placements.length - wrongAttempts,
      );
      reportScore({
        elementId: block.id,
        pageIndex: pageIndex ?? 0,
        score,
        maxScore: placements.length,
        completed: true,
      });
      // Tiered sound & confetti based on percentage
      const pct = placements.length > 0 ? Math.round((score / placements.length) * 100) : 0;
      if (pct >= 80) {
        playSound('complete');
        fireConfettiCelebration();
      } else if (pct >= 50) {
        playSound('complete');
        fireConfetti({ count: 30 });
      } else {
        playSound('ding');
      }
      announceToScreenReader(`Game selesai! Skor kamu: ${score} dari ${placements.length} (${pct}%)`, 'assertive');
    }
    // Reset guard when game is no longer done (e.g., after replay)
    if (phase !== 'done') {
      hasReportedRef.current = false;
    }
  }, [phase, interactive, block.id, wrongAttempts, placements.length, reportScore, pageIndex]);

  // ── Inline editing hooks ────────────────────────────────────────
  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });

  // ── Cell click handler ──────────────────────────────────────────
  const handleCellClick = React.useCallback(
    (r: number, c: number) => {
      if (!interactive || phase !== 'play') return;

      // If no start cell selected, set this as start
      if (!startCell) {
        setStartCell([r, c]);
        return;
      }

      // If clicking the same cell, deselect
      if (startCell[0] === r && startCell[1] === c) {
        setStartCell(null);
        return;
      }

      // Validate the line formed by start → end
      const lineCells = getLineCells(startCell, [r, c]);
      if (!lineCells) {
        // Not a valid straight line — treat as wrong attempt
        playSound('incorrect');
        setWrongAttempts(prev => prev + 1);
        setStartCell(null);
        return;
      }

      // Read the letters along the selected line
      const selectedWord = lineCells.map(([lr, lc]) => grid[lr][lc]).join('');
      const reversedWord = selectedWord.split('').reverse().join('');

      // Check if the selected word matches any unfound placement
      const matchedPlacement = placements.find(
        p => !found.has(p.word) && (p.word === selectedWord || p.word === reversedWord),
      );

      if (matchedPlacement) {
        // ── Word found! ──
        playSound('correct');
        const newFound = new Set(found);
        newFound.add(matchedPlacement.word);
        setFound(newFound);
        announceToScreenReader(`Kata ditemukan: ${matchedPlacement.word}. ${newFound.size} dari ${placements.length}`, 'assertive');

        // Mark all cells of the found placement
        const newFoundCells = new Set(foundCells);
        matchedPlacement.cells.forEach(([fr, fc]) => {
          newFoundCells.add(`${fr},${fc}`);
        });
        setFoundCells(newFoundCells);

        // Check if all words are found
        if (newFound.size >= placements.length) {
          setPhase('done');
        }
      } else {
        // ── Wrong selection ──
        playSound('incorrect');
        setWrongAttempts(prev => prev + 1);
        announceToScreenReader('Kata tidak cocok', 'assertive');
      }

      // Reset start cell for next selection
      setStartCell(null);
    },
    [interactive, phase, startCell, grid, placements, found, foundCells],
  );

  // ── Restart handler ─────────────────────────────────────────────
  const handleRestart = React.useCallback(() => {
    setFound(new Set());
    setFoundCells(new Set());
    setStartCell(null);
    setWrongAttempts(0);
    setPhase('play');
    setGridKey(k => k + 1);
    hasReportedRef.current = false;
    playSound('click');
  }, []);

  // ── Empty state: no words configured ────────────────────────────
  if (words.length === 0) {
    return (
      <div
        className="text-center p-5 rounded-xl"
        style={{
          background: tokens.colorAlpha('y', 0.06),
          border: '2px dashed ' + tokens.colorAlpha('y', 0.25),
        }}
      >
        <div className="text-2xl mb-2">
          <Search size={24} className="inline" style={{ color: tokens.color('y') }} />
        </div>
        <div className="font-extrabold mb-1" style={{ fontSize: '13px', color: tokens.color('y') }}>
          <InlineTextEditor
            {...titleEditor}
            className="text-[11px] font-extrabold"
            style={{ color: tokens.color('y'), fontSize: 'inherit' }}
            placeholder="Ketik judul game..."
          />
        </div>
        <div style={{ fontSize: '12px', color: tokens.muted(0.7) }}>
          Tambahkan kata untuk memulai game Teka-Teki Kata!
        </div>
      </div>
    );
  }

  // ── Completion screen ───────────────────────────────────────────
  if (phase === 'done') {
    const score = Math.max(
      Math.ceil(placements.length * 0.5),
      placements.length - wrongAttempts,
    );
    const pct =
      placements.length > 0 ? Math.round((score / placements.length) * 100) : 0;

    return (
      <div className="text-center p-5">
        {/* Tiered icon */}
        <div
          className="text-3xl mb-3"
          style={{ animation: 'float 3s ease-in-out infinite' }}
        >
          {pct >= 80 ? (
            <Trophy size={28} className="inline text-app-accent" />
          ) : pct >= 50 ? (
            <Star size={28} className="inline text-app-accent" />
          ) : (
            <Dumbbell size={28} className="inline text-app-accent" />
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
          Skor kamu: {score}/{placements.length} ({pct}%)
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-3">
          <div
            className="px-4 py-2 rounded-xl"
            style={{
              background: tokens.colorAlpha('g', 0.12),
              border: '1px solid ' + tokens.colorAlpha('g', 0.3),
            }}
          >
            <div className="font-extrabold" style={{ fontSize: '12px', color: tokens.color('g') }}>
              Ditemukan
            </div>
            <div className="font-black" style={{ color: tokens.color('g') }}>
              {placements.length}
            </div>
          </div>
          <div
            className="px-4 py-2 rounded-xl"
            style={{
              background: tokens.colorAlpha('r', 0.12),
              border: '1px solid ' + tokens.colorAlpha('r', 0.3),
            }}
          >
            <div className="font-extrabold" style={{ fontSize: '12px', color: tokens.color('r') }}>
              Salah
            </div>
            <div className="font-black" style={{ color: tokens.color('r') }}>
              {wrongAttempts}
            </div>
          </div>
        </div>

        {/* Replay button */}
        {interactive && (
          <button
            className="mt-4 px-5 py-2 rounded-xl font-extrabold transition-all hover:scale-105"
            onClick={handleRestart}
            style={{
              fontSize: '13px',
              background:
                'linear-gradient(135deg, ' +
                tokens.color('y') +
                ', ' +
                tokens.color('o') +
                ')',
              color: tokens.color('bg'),
              boxShadow: '0 4px 16px ' + tokens.colorAlpha('y', 0.35),
            }}
          >
            <RotateCcw size={14} className="inline" /> Ulangi
          </button>
        )}
      </div>
    );
  }

  // ── Active game screen ──────────────────────────────────────────
  // Compute dynamic cell size based on grid size for good fit
  const cellSize = gridSize <= 8 ? 36 : gridSize <= 10 ? 32 : gridSize <= 12 ? 28 : 24;

  return (
    <div className="space-y-3 game-block" {...(interactive ? { role: 'application' } : {})} aria-label={`Teka-Teki Kata: ${found.size} dari ${placements.length} kata ditemukan`} aria-describedby={`wordsearch-instructions-${block.id || 'ws'}`} data-interactive>
      {/* Hidden instruction for screen readers */}
      <span id={`wordsearch-instructions-${block.id || 'ws'}`} className="sr-only">Temukan kata tersembunyi di grid huruf dengan memilih huruf awal dan akhir</span>
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="font-extrabold" style={{ fontSize: '13px', color: tokens.color('y') }}>
            <Search size={14} className="inline" />{' '}
            <InlineTextEditor
              {...titleEditor}
              className="text-[11px] font-extrabold"
              style={{ color: tokens.color('y'), fontSize: 'inherit' }}
              placeholder="Ketik judul game..."
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Found progress badge */}
          <span
            className="px-2.5 py-1 rounded-full font-extrabold"
            style={{
              fontSize: '11px',
              background: tokens.colorAlpha('g', 0.15),
              color: tokens.color('g'),
              border: '1px solid ' + tokens.colorAlpha('g', 0.3),
            }}
          >
            {found.size}/{placements.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={found.size}
        aria-valuemin={0}
        aria-valuemax={placements.length}
        style={{ background: tokens.subtleBg(0.08) }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width:
              placements.length > 0
                ? (found.size / placements.length) * 100 + '%'
                : '0%',
            background:
              'linear-gradient(90deg, ' +
              tokens.color('y') +
              ', ' +
              tokens.color('g') +
              ')',
            boxShadow: '0 0 8px ' + tokens.colorAlpha('y', 0.3),
          }}
        />
      </div>

      {/* Main layout: Grid on the left, word list on the right */}
      <div className="flex gap-4">
        {/* ── Letter Grid ── */}
        <div className="flex-shrink-0">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
            }}
          >
            {grid.map((row, r) =>
              row.map((letter, c) => {
                const cellKey = `${r},${c}`;
                const isStart =
                  startCell !== null &&
                  startCell[0] === r &&
                  startCell[1] === c;
                const isFound = foundCells.has(cellKey);

                // Determine cell styling based on state
                let bg: string;
                let bdr: string;
                let bxSh: string;
                let textColor: string;

                if (isFound) {
                  // Found word cell — green highlight
                  bg = tokens.colorAlpha('g', 0.18);
                  bdr = tokens.colorAlpha('g', 0.5);
                  bxSh = '0 0 8px ' + tokens.colorAlpha('g', 0.2);
                  textColor = tokens.color('g');
                } else if (isStart) {
                  // Selected start cell — amber ring
                  bg = tokens.colorAlpha('y', 0.15);
                  bdr = tokens.color('y');
                  bxSh = '0 0 12px ' + tokens.colorAlpha('y', 0.4);
                  textColor = tokens.color('text');
                } else {
                  // Default cell
                  bg = tokens.colorAlpha('card', 0.6);
                  bdr = tokens.subtleBorder(0.12);
                  bxSh = tokens.raw.shadow.card;
                  textColor = tokens.color('text');
                }

                return (
                  <button
                    key={`ws-cell-${block.id || 'ws'}-${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    onKeyDown={(e) => {
                      if (!interactive || phase !== 'play') return;
                      const totalCells = gridSize * gridSize;
                      const flatIndex = r * gridSize + c;
                      const next = handleRovingFocus(totalCells, flatIndex, e.key, 'both', gridSize);
                      if (next !== flatIndex) {
                        e.preventDefault();
                        const nextR = Math.floor(next / gridSize);
                        const nextC = next % gridSize;
                        const btn = document.querySelector(`[data-ws-cell="${block.id || 'ws'}-${nextR}-${nextC}"]`) as HTMLElement;
                        btn?.focus();
                      }
                    }}
                    data-ws-cell={`${block.id || 'ws'}-${r}-${c}`}
                    disabled={!interactive || phase !== 'play'}
                    aria-label={`Baris ${r + 1} Kolom ${c + 1}, huruf ${letter}${isFound ? ', ditemukan' : ''}`}
                    className="flex items-center justify-center rounded-lg font-extrabold transition-all hover:scale-105 select-none"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      fontSize: cellSize <= 28 ? '11px' : '13px',
                      background: bg,
                      border: '2px solid ' + bdr,
                      boxShadow: bxSh,
                      color: textColor,
                      cursor: interactive && phase === 'play' ? 'pointer' : 'default',
                    }}
                  >
                    {letter}
                  </button>
                );
              }),
            )}
          </div>
        </div>

        {/* ── Word List ── */}
        <div className="flex-1 min-w-0">
          <div
            className="rounded-xl p-3"
            style={{
              background: tokens.colorAlpha('card', 0.4),
              border: '1px solid ' + tokens.subtleBorder(0.1),
              boxShadow: tokens.raw.shadow.card,
            }}
          >
            <div
              className="font-extrabold uppercase tracking-wider mb-2"
              style={{ fontSize: '10px', color: tokens.color('y') }}
            >
              Kata yang dicari
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {placements.map((p, i) => {
                const isWordFound = found.has(p.word);
                return (
                  <div
                    key={`ws-word-${block.id || 'ws'}-${p.word}-${i}`}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all"
                    style={{
                      background: isWordFound
                        ? tokens.colorAlpha('g', 0.12)
                        : tokens.subtleBg(0.04),
                      border: '1px solid ' + (isWordFound
                        ? tokens.colorAlpha('g', 0.3)
                        : tokens.subtleBorder(0.06)),
                    }}
                  >
                    {/* Status indicator dot */}
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        background: isWordFound
                          ? tokens.color('g')
                          : tokens.subtleBg(0.15),
                        boxShadow: isWordFound
                          ? '0 0 6px ' + tokens.colorAlpha('g', 0.4)
                          : 'none',
                      }}
                    />
                    {/* Word text */}
                    <span
                      className="font-bold tracking-wider"
                      style={{
                        fontSize: '12px',
                        color: isWordFound
                          ? tokens.color('g')
                          : tokens.color('text'),
                        textDecoration: isWordFound ? 'line-through' : 'none',
                        opacity: isWordFound ? 0.7 : 1,
                      }}
                    >
                      {p.word}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hint: how to play (shown when no start cell selected) */}
          {interactive && !startCell && (
            <div
              className="mt-2 px-3 py-2 rounded-lg"
              style={{
                fontSize: '10px',
                color: tokens.muted(0.6),
                background: tokens.subtleBg(0.03),
                border: '1px solid ' + tokens.subtleBorder(0.05),
              }}
            >
              Klik huruf pertama, lalu klik huruf terakhir kata yang kamu temukan.
            </div>
          )}

          {/* Selection hint (shown when start cell is selected) */}
          {interactive && startCell && (
            <div
              className="mt-2 px-3 py-2 rounded-lg flex items-center gap-1.5"
              style={{
                fontSize: '10px',
                color: tokens.color('y'),
                background: tokens.colorAlpha('y', 0.08),
                border: '1px solid ' + tokens.colorAlpha('y', 0.2),
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              <Search size={12} className="inline flex-shrink-0" />
              Pilih huruf terakhir...
            </div>
          )}
        </div>
      </div>

      {/* ── Print Answer Key (teacher only) ── */}
      <div className="print-only print-answer-key">
        <h3>Kunci Jawaban: Teka-Teki Kata</h3>
        <ul>
          {placements.map((p, i) => (
            <li key={`ws-ans-${block.id || 'ws'}-${i}`}><strong>{p.word}</strong> — baris {p.cells[0][0] + 1}, kolom {p.cells[0][1] + 1}</li>
          ))}
        </ul>
      </div>
    </div>
  );
});