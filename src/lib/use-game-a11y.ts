'use client';

// ═══════════════════════════════════════════════════════════════════
// USE GAME A11Y HOOK — Unified game accessibility for MPI Authoring
// ═══════════════════════════════════════════════════════════════════
// Consolidates the common accessibility patterns used across all game
// renderers: ARIA labels, progress bar attributes, live region
// announcements, and keyboard navigation helpers.
//
// This hook wraps the utility functions from @/lib/a11y into a
// React-friendly API that integrates with component lifecycle.
// ═══════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef } from 'react';
import {
  gameAriaLabel,
  progressBarAria,
  liveRegion,
  announceToScreenReader,
  handleRovingFocus,
  isActivationKey,
} from './a11y';

// ── Types ────────────────────────────────────────────────────────

export interface GameA11yConfig {
  /** Game type name, e.g. 'Teka-Teki Kata', 'Benar/Salah' */
  gameType: string;
  /** Block ID for generating unique ARIA IDs */
  blockId?: string;
  /** Current score value */
  score: number;
  /** Maximum possible score */
  maxScore: number;
  /** Whether the game is interactive (playing) */
  interactive: boolean;
}

export interface GameA11yReturn {
  /** ARIA label string for the game root element */
  ariaLabel: string;
  /** ARIA attributes for the root game element */
  rootAria: Record<string, string>;
  /** ARIA attributes for a progress bar */
  progressAria: (label: string, value: number, max: number) => Record<string, string>;
  /** ARIA attributes for a live region */
  liveAria: (mode?: 'polite' | 'assertive') => Record<string, string>;
  /** Unique ID for aria-describedby instruction element */
  instructionId: string;
  /** Announce a message to screen readers */
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  /** Announce a correct answer */
  announceCorrect: () => void;
  /** Announce an incorrect answer */
  announceIncorrect: (correctAnswer?: string) => void;
  /** Announce game completion with score */
  announceComplete: (finalScore: number, finalMax: number) => void;
  /** Announce score change */
  announceScore: (newScore: number) => void;
  /** Handle roving focus navigation for grid-like games */
  rovingFocus: (total: number, currentIndex: number, key: string, orientation?: 'vertical' | 'horizontal' | 'both', cols?: number) => number;
  /** Check if key is activation (Enter/Space) */
  isActivation: (e: KeyboardEvent) => boolean;
}

// ── Hook ─────────────────────────────────────────────────────────

export function useGameA11y(config: GameA11yConfig): GameA11yReturn {
  const { gameType, blockId, score, maxScore, interactive } = config;

  // ── Stable refs for announcements ──────────────────────────────
  const prevScoreRef = useRef(score);

  // ── Announce score changes (debounced by React renders) ────────
  useEffect(() => {
    if (!interactive) return;
    if (score !== prevScoreRef.current && score > prevScoreRef.current) {
      announceToScreenReader(`Skor: ${score}`, 'polite');
    }
    prevScoreRef.current = score;
  }, [score, interactive]);

  // ── Computed values ────────────────────────────────────────────
  const ariaLabel = gameAriaLabel(gameType, score, maxScore);
  const instructionId = `game-instructions-${blockId || 'game'}`;

  // ── Root ARIA attributes ───────────────────────────────────────
  const rootAria: Record<string, string> = interactive
    ? {
        role: 'application',
        'aria-label': ariaLabel,
        'aria-describedby': instructionId,
      }
    : {
        'aria-label': ariaLabel,
      };

  // ── Helper functions ───────────────────────────────────────────
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  }, []);

  const announceCorrect = useCallback(() => {
    announceToScreenReader('Benar!', 'assertive');
  }, []);

  const announceIncorrect = useCallback((correctAnswer?: string) => {
    const msg = correctAnswer
      ? `Salah. Jawaban yang benar: ${correctAnswer}`
      : 'Salah!';
    announceToScreenReader(msg, 'assertive');
  }, []);

  const announceComplete = useCallback((finalScore: number, finalMax: number) => {
    const pct = finalMax > 0 ? Math.round((finalScore / finalMax) * 100) : 0;
    const tier = pct >= 80 ? 'Luar Biasa' : pct >= 50 ? 'Bagus' : 'Terus Berlatih';
    announceToScreenReader(
      `Game selesai! ${tier}. Skor kamu: ${finalScore} dari ${finalMax} (${pct}%)`,
      'assertive',
    );
  }, []);

  const announceScore = useCallback((newScore: number) => {
    announceToScreenReader(`Skor: ${newScore}`, 'polite');
  }, []);

  const progressAria = useCallback((label: string, value: number, max: number) => {
    return progressBarAria(label, value, max);
  }, []);

  const liveAria = useCallback((mode: 'polite' | 'assertive' = 'polite') => {
    return liveRegion(mode);
  }, []);

  const rovingFocus = useCallback((
    total: number,
    currentIndex: number,
    key: string,
    orientation: 'vertical' | 'horizontal' | 'both' = 'both',
    cols?: number,
  ) => {
    return handleRovingFocus(total, currentIndex, key, orientation, cols);
  }, []);

  const isActivation = useCallback((e: KeyboardEvent) => {
    return isActivationKey(e);
  }, []);

  return {
    ariaLabel,
    rootAria,
    progressAria,
    liveAria,
    instructionId,
    announce,
    announceCorrect,
    announceIncorrect,
    announceComplete,
    announceScore,
    rovingFocus,
    isActivation,
  };
}
