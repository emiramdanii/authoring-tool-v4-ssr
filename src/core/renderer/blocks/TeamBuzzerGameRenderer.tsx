'use client';

import React from 'react';
import { Trophy, Star, Dumbbell, RotateCcw, Zap, CheckCircle2, XCircle } from 'lucide-react';
import type { TeamBuzzerGameBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti, fireConfettiCelebration } from '@/lib/confetti';
import { useGameA11y } from '@/lib/use-game-a11y';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';

/* ═══════════════════════════════════════════════════════════════════════
   TEAM BUZZER GAME RENDERER (Kuis Tim)
   ──────────────────────────────────────────────────────────────────────
   Ported from canva/games/TeamBuzzerGame.tsx to the SSR renderer system.
   Follows the exact same patterns as TrueFalseGameRenderer and
   WordSearchGameRenderer (replay watcher, score guard, token-aware
   styling, inline editing, stable React keys, timer cleanup on unmount).

   Game flow:
     1. Show questions one at a time with point value
     2. Two teams (A & B) press their buzzer button to claim the question
     3. Judge clicks "Benar" or "Salah" for the buzzing team
     4. Correct: team gets the points, auto-advance after 1500ms
     5. Wrong: next question after 800ms
     6. On completion, show tiered result screen with total scores
   ═══════════════════════════════════════════════════════════════════════ */

// ── Game phases ────────────────────────────────────────────────────
type GamePhase = 'play' | 'done';

// ── Correct state: which team got it right, or 'wrong' if incorrect ─
type CorrectState = 'A' | 'B' | 'wrong' | null;

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export const TeamBuzzerGameRenderer = React.memo(function TeamBuzzerGameRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex }: {
  block: TeamBuzzerGameBlock;
  tokens: TokenResolver;
  interactive: boolean;
  isCompact: boolean;
  isEditing?: boolean;
  pageIndex?: number;
}) {
  // ── Derived data ────────────────────────────────────────────────
  const rawQuestions = block.questions || [];
  const validQuestions = React.useMemo(
    () => rawQuestions.filter(q => q.teks && q.teks.trim()),
    [rawQuestions],
  );
  const teamA = block.teamA || 'Tim Merah';
  const teamB = block.teamB || 'Tim Biru';

  // ── Game state ──────────────────────────────────────────────────
  const [currentQ, setCurrentQ] = React.useState(0);
  const [scoreA, setScoreA] = React.useState(0);
  const [scoreB, setScoreB] = React.useState(0);
  const [buzzed, setBuzzed] = React.useState<'A' | 'B' | null>(null);
  const [correct, setCorrect] = React.useState<CorrectState>(null);
  const [phase, setPhase] = React.useState<GamePhase>('play');

  // ── Timer cleanup on unmount ────────────────────────────────────
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => {
    return () => { timersRef.current.forEach(clearTimeout); };
  }, []);

  // ── Data-change state reset ─────────────────────────────────────
  const soalKey = React.useMemo(
    () => JSON.stringify(validQuestions.map(q => ({ t: q.teks, p: q.poin }))),
    [validQuestions],
  );
  React.useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setCurrentQ(0);
    setScoreA(0);
    setScoreB(0);
    setBuzzed(null);
    setCorrect(null);
    setPhase('play');
  }, [soalKey]);

  // ── Replay watcher (MANDATORY) ──────────────────────────────────
  const replayGeneration = useInteractiveStore(s => s.replayGeneration);
  React.useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setCurrentQ(0);
    setScoreA(0);
    setScoreB(0);
    setBuzzed(null);
    setCorrect(null);
    setPhase('play');
  }, [replayGeneration]);

  // ── Interactive store: score reporting ───────────────────────────
  const reportScore = useInteractiveStore(s => s.reportScore);

  // ── Total points (memoized for stable deps) ─────────────────────
  const totalPoints = React.useMemo(
    () => validQuestions.reduce((s, q) => s + (q.poin || 10), 0),
    [validQuestions],
  );

  // ── Accessibility hook ────────────────────────────────────────
  // MUST be declared BEFORE the score guard useEffect that uses a11y.announceComplete()
  const a11y = useGameA11y({
    gameType: 'Kuis Tim',
    blockId: block.id,
    score: scoreA + scoreB,
    maxScore: totalPoints,
    interactive: interactive ?? false,
  });

  // ── Score guard (MANDATORY) ─────────────────────────────────────
  const hasReportedRef = React.useRef(false);
  React.useEffect(() => {
    if (phase === 'done' && interactive && block.id && !hasReportedRef.current) {
      hasReportedRef.current = true;
      const combinedScore = scoreA + scoreB;
      reportScore({
        elementId: block.id,
        pageIndex: pageIndex ?? 0,
        score: combinedScore,
        maxScore: totalPoints,
        completed: true,
      });
      // Tiered sound & confetti
      const pct = totalPoints > 0 ? Math.round((combinedScore / totalPoints) * 100) : 0;
      if (pct >= 80) {
        playSound('complete');
        fireConfettiCelebration();
      } else if (pct >= 50) {
        playSound('complete');
        fireConfetti({ count: 30 });
      } else {
        playSound('ding');
      }
      a11y.announceComplete(combinedScore, totalPoints);
    }
    if (phase !== 'done') {
      hasReportedRef.current = false;
    }
  }, [phase, interactive, block.id, scoreA, scoreB, totalPoints, reportScore, pageIndex, a11y]);

  // ── Inline editing hooks ────────────────────────────────────────
  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });

  // ── Buzz handler ────────────────────────────────────────────────
  const handleBuzz = React.useCallback(
    (team: 'A' | 'B') => {
      if (!interactive || phase !== 'play') return;
      if (buzzed || correct === 'wrong') return;
      playSound('buzz');
      setBuzzed(team);
    },
    [interactive, phase, buzzed, correct],
  );

  // ── Correct answer handler ──────────────────────────────────────
  const handleCorrect = React.useCallback(
    (team: 'A' | 'B') => {
      if (correct) return; // Guard against double-click
      const pts = validQuestions[currentQ]?.poin || 10;
      if (team === 'A') setScoreA(s => s + pts);
      else setScoreB(s => s + pts);
      setCorrect(team);
      playSound('correct');
      a11y.announceCorrect();

      const tid = setTimeout(() => {
        if (currentQ + 1 < validQuestions.length) {
          setCurrentQ(q => q + 1);
          setBuzzed(null);
          setCorrect(null);
        } else {
          setPhase('done');
        }
      }, 1500);
      timersRef.current.push(tid);
    },
    [correct, currentQ, validQuestions],
  );

  // ── Wrong answer handler ────────────────────────────────────────
  const handleWrong = React.useCallback(() => {
    if (correct) return; // Guard against double-click
    setCorrect('wrong');
    playSound('incorrect');
    a11y.announceIncorrect();

    const tid = setTimeout(() => {
      if (currentQ + 1 < validQuestions.length) {
        setCurrentQ(q => q + 1);
        setBuzzed(null);
        setCorrect(null);
      } else {
        setPhase('done');
      }
    }, 800);
    timersRef.current.push(tid);
  }, [correct, currentQ, validQuestions]);

  // ── Restart handler ─────────────────────────────────────────────
  const handleRestart = React.useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setCurrentQ(0);
    setScoreA(0);
    setScoreB(0);
    setBuzzed(null);
    setCorrect(null);
    setPhase('play');
    hasReportedRef.current = false;
    playSound('click');
  }, []);

  // ══ EMPTY STATE ═════════════════════════════════════════════════
  if (validQuestions.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center p-6 text-center rounded-xl"
        style={{
          background: tokens.subtleBg(0.04),
          border: '2px dashed ' + tokens.subtleBorder(0.15),
        }}
      >
        <Zap size={24} style={{ color: tokens.muted(0.4) }} />
        <div className="mt-2 font-extrabold" style={{ fontSize: '13px', color: tokens.muted(0.5) }}>
          <InlineTextEditor
            {...titleEditor}
            className="text-[11px] font-extrabold"
            style={{ color: tokens.muted(0.5), fontSize: 'inherit' }}
            placeholder="Ketik judul Kuis Tim..."
          />
        </div>
        <div style={{ fontSize: '11px', color: tokens.muted(0.35) }}>
          Belum ada soal ditambahkan untuk Kuis Tim
        </div>
      </div>
    );
  }

  // ══ COMPLETION SCREEN ═══════════════════════════════════════════
  if (phase === 'done') {
    const combinedScore = scoreA + scoreB;
    const pct = totalPoints > 0 ? Math.round((combinedScore / totalPoints) * 100) : 0;
    const winner = scoreA > scoreB ? teamA : scoreB > scoreA ? teamB : 'Seri';

    return (
      <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0} gradientBorder>
      <div
        className="text-center p-5 rounded-2xl"
        style={{
          background: tokens.color('bg'),
          border: '2px solid ' + tokens.colorAlpha('y', 0.3),
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

        {/* Winner announcement */}
        <div
          className="font-black text-lg mb-1"
          style={{
            fontFamily: tokens.fontFamily('display'),
            color: tokens.color('y'),
          }}
        >
          {winner === 'Seri' ? 'Seri!' : `${winner} Menang!`}
        </div>

        {/* Score display */}
        <div className="mb-4" style={{ fontSize: '13px', color: tokens.muted(0.8) }}>
          Total: {combinedScore}/{totalPoints} ({pct}%)
        </div>

        {/* Team scores */}
        <div className="flex justify-center gap-3">
          <PremiumBadge tokens={tokens} accent="r" variant="glass">{teamA}: {scoreA}</PremiumBadge>
          <PremiumBadge tokens={tokens} accent="c" variant="glass">{teamB}: {scoreB}</PremiumBadge>
        </div>

        {/* Replay button */}
        {interactive && (
          <MicroInteraction tokens={tokens} accent="y" effect="squish">
          <button
            className={"mt-4 px-5 py-2 rounded-xl font-extrabold " + tokens.iosButtonTw(interactive)}
            onClick={handleRestart}
            style={{
              fontSize: '13px',
              background: 'linear-gradient(135deg, ' + tokens.color('y') + ', ' + tokens.color('o') + ')',
              color: tokens.color('bg'),
              boxShadow: '0 4px 16px ' + tokens.colorAlpha('y', 0.35),
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
  const q = validQuestions[currentQ];
  if (!q) return null;

  const progress = ((currentQ + (buzzed ? 1 : 0)) / validQuestions.length) * 100;

  return (
    <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0}>
    <div className="space-y-3 game-block" {...a11y.rootAria} data-interactive>
      {/* Hidden instruction for screen readers */}
      <div id={a11y.instructionId} className="sr-only">Tekan buzzer tim lalu tentukan jawaban benar atau salah</div>
      <ReadingProgressIndicator progress={validQuestions.length > 0 ? (currentQ + (buzzed ? 1 : 0)) / validQuestions.length : 0} tokens={tokens} accent="y" height={3} position="top" />
      {/* ── Header with title and question counter ────────────────── */}
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="font-extrabold" style={{ fontSize: '13px', color: tokens.color('y') }}>
            <Zap size={14} className="inline" />{' '}
            <InlineTextEditor
              {...titleEditor}
              className="text-[11px] font-extrabold"
              style={{ color: tokens.color('y'), fontSize: 'inherit' }}
              placeholder="Ketik judul Kuis Tim..."
            />
          </div>
        </div>
        <PremiumBadge tokens={tokens} accent="y" variant="glass">
          {currentQ + 1}/{validQuestions.length}
        </PremiumBadge>
      </div>

      {/* ── Progress bar ──────────────────────────────────────────── */}
      <div
        className="h-1.5 rounded-full overflow-hidden"
        {...a11y.progressAria('Kemajuan Kuis Tim', currentQ + (buzzed ? 1 : 0), validQuestions.length)}
        style={{ background: tokens.subtleBg(0.08) }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            ...tokens.iosTransitionStyle('width', 'slow'),
            background: 'linear-gradient(90deg, ' + tokens.color('y') + ', ' + tokens.color('o') + ')',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
            boxShadow: '0 0 8px ' + tokens.colorAlpha('y', 0.3),
          }}
        />
      </div>

      {/* ── Score display ─────────────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <span className="font-bold" style={{ fontSize: '11px', color: tokens.color('y') }}>
          Soal {currentQ + 1}/{validQuestions.length}
        </span>
        <span style={{ fontSize: '11px', color: tokens.muted(0.6) }} aria-live="polite">
          +{q.poin || 10} poin
        </span>
      </div>

      {/* ── Question card ─────────────────────────────────────────── */}
      <div
        className="p-4 rounded-xl premium-card-glow"
        style={{
          background: tokens.colorAlpha('y', 0.06),
          border: '1px solid ' + tokens.colorAlpha('y', 0.2),
          boxShadow: tokens.raw.shadow.card,
        }}
      >
        <p
          className={`font-bold leading-relaxed mb-4 ${isCompact ? 'text-[10px]' : 'text-[12px]'}`}
          style={{ color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }}
        >
          {q.teks}
        </p>

        {/* ── Buzzer buttons ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Team A buzzer */}
          <button
            key={`tb-buzz-${block.id || 'tb'}-${currentQ}-A`}
            onClick={() => handleBuzz('A')}
            disabled={!interactive || !!buzzed || correct === 'wrong'}
            aria-label={`${teamA} buzzer, skor ${scoreA}`}
            className="p-3 rounded-xl font-extrabold text-center transition-[background-color,border-color,color,transform,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent min-w-0"
            style={{
              fontSize: '13px',
              background: correct === 'A'
                ? tokens.colorAlpha('g', 0.2)
                : buzzed === 'A'
                  ? tokens.colorAlpha('r', 0.2)
                  : tokens.colorAlpha('r', 0.08),
              border: '2px solid ' + (
                correct === 'A'
                  ? tokens.color('g')
                  : buzzed === 'A'
                    ? tokens.color('r')
                    : tokens.colorAlpha('r', 0.3)
              ),
              boxShadow: correct === 'A'
                ? '0 0 12px ' + tokens.colorAlpha('g', 0.25)
                : buzzed === 'A'
                  ? '0 0 12px ' + tokens.colorAlpha('r', 0.25)
                  : 'none',
              color: correct === 'A'
                ? tokens.color('g')
                : buzzed === 'A'
                  ? tokens.color('r')
                  : tokens.color('r'),
              cursor: interactive && !buzzed && correct !== 'wrong' ? 'pointer' : 'default',
              opacity: buzzed && buzzed !== 'A' ? 0.55 : 1,
            }}
          >
            {teamA} ({scoreA})
          </button>

          {/* Team B buzzer */}
          <button
            key={`tb-buzz-${block.id || 'tb'}-${currentQ}-B`}
            onClick={() => handleBuzz('B')}
            disabled={!interactive || !!buzzed || correct === 'wrong'}
            aria-label={`${teamB} buzzer, skor ${scoreB}`}
            className="p-3 rounded-xl font-extrabold text-center transition-[background-color,border-color,color,transform,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent min-w-0"
            style={{
              fontSize: '13px',
              background: correct === 'B'
                ? tokens.colorAlpha('g', 0.2)
                : buzzed === 'B'
                  ? tokens.colorAlpha('c', 0.2)
                  : tokens.colorAlpha('c', 0.08),
              border: '2px solid ' + (
                correct === 'B'
                  ? tokens.color('g')
                  : buzzed === 'B'
                    ? tokens.color('c')
                    : tokens.colorAlpha('c', 0.3)
              ),
              boxShadow: correct === 'B'
                ? '0 0 12px ' + tokens.colorAlpha('g', 0.25)
                : buzzed === 'B'
                  ? '0 0 12px ' + tokens.colorAlpha('c', 0.25)
                  : 'none',
              color: correct === 'B'
                ? tokens.color('g')
                : buzzed === 'B'
                  ? tokens.color('c')
                  : tokens.color('c'),
              cursor: interactive && !buzzed && correct !== 'wrong' ? 'pointer' : 'default',
              opacity: buzzed && buzzed !== 'B' ? 0.55 : 1,
            }}
          >
            {teamB} ({scoreB})
          </button>
        </div>

        {/* ── Judge panel (shown when a team has buzzed) ─────────── */}
        {buzzed && !correct && (
          <div className="mt-3 p-3 rounded-xl" style={{
            background: tokens.colorAlpha('y', 0.08),
            border: '1px solid ' + tokens.colorAlpha('y', 0.2),
            animation: 'fadeIn 0.3s ease',
          }}>
            <div className="text-center mb-2 font-bold" style={{ fontSize: '11px', color: tokens.color('y') }}>
              {buzzed === 'A' ? teamA : teamB} menekan buzzer!
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                key={`tb-judge-${block.id || 'tb'}-${currentQ}-correct`}
                onClick={() => handleCorrect(buzzed)}
                aria-label="Benar"
                className="py-2 rounded-lg font-extrabold transition-[background-color,border-color,color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                style={{
                  fontSize: '11px',
                  background: tokens.colorAlpha('g', 0.15),
                  color: tokens.color('g'),
                  border: '1px solid ' + tokens.colorAlpha('g', 0.3),
                  cursor: 'pointer',
                }}
              >
                <CheckCircle2 size={12} className="inline mr-1" />
                Benar ({buzzed === 'A' ? teamA : teamB})
              </button>
              <button
                key={`tb-judge-${block.id || 'tb'}-${currentQ}-wrong`}
                onClick={handleWrong}
                aria-label="Salah"
                className="py-2 rounded-lg font-extrabold transition-[background-color,border-color,color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                style={{
                  fontSize: '11px',
                  background: tokens.colorAlpha('r', 0.15),
                  color: tokens.color('r'),
                  border: '1px solid ' + tokens.colorAlpha('r', 0.3),
                  cursor: 'pointer',
                }}
              >
                <XCircle size={12} className="inline mr-1" />
                Salah ({buzzed === 'A' ? teamA : teamB})
              </button>
            </div>
          </div>
        )}

        {/* ── Correct answer feedback ────────────────────────────── */}
        {correct && correct !== 'wrong' && (
          <div className="mt-3 p-3 rounded-xl" style={{
            background: tokens.colorAlpha('g', 0.1),
            border: '1px solid ' + tokens.colorAlpha('g', 0.3),
            animation: 'fadeIn 0.3s ease',
          }}>
            <div className="text-center font-extrabold" style={{ fontSize: '12px', color: tokens.color('g') }}>
              <CheckCircle2 size={14} className="inline mr-1" />
              {correct === 'A' ? teamA : teamB} benar! +{q.poin || 10} poin
            </div>
          </div>
        )}

        {/* ── Wrong answer feedback ──────────────────────────────── */}
        {correct === 'wrong' && (
          <div className="mt-3 p-3 rounded-xl" style={{
            background: tokens.colorAlpha('r', 0.1),
            border: '1px solid ' + tokens.colorAlpha('r', 0.3),
            animation: 'fadeIn 0.3s ease',
          }}>
            <div className="text-center font-extrabold" style={{ fontSize: '12px', color: tokens.color('r') }}>
              <XCircle size={14} className="inline mr-1" />
              Salah! Lanjut ke soal berikutnya...
            </div>
          </div>
        )}
      </div>

      {/* ── Print Answer Key (teacher only) ── */}
      <div className="print-only print-answer-key">
        <h3>Daftar Soal Kuis Tim</h3>
        <ul>
          {validQuestions.map((q, i) => (
            <li key={`tb-ans-${block.id || 'tb'}-${i}`}>{i + 1}. {q.teks} ({q.poin || 10} poin)</li>
          ))}
        </ul>
      </div>
    </div>
    </PremiumBlockWrapper>
  );
});