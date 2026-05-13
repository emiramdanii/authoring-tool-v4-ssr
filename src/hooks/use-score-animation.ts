// ═══════════════════════════════════════════════════════════════
// USE SCORE ANIMATION — Tracks score changes and provides
// animated increment display (+N floating number)
//
// When score increases:
//   1. Calculates delta (newScore - prevScore)
//   2. Shows floating "+N" text that rises and fades
//   3. Animates the displayed number counting up to new total
//   4. Optional pulse/glow effect on the score pill
//
// Used by: ScoreDisplay component (PageFrame, PlayOverlay)
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from 'react';
import { useInteractiveStore } from '@/store/interactive-store';

export interface ScoreAnimationState {
  /** Current displayed score (animates from old to new) */
  displayScore: number;
  /** Current displayed max score */
  displayMax: number;
  /** Current displayed percentage */
  displayPct: number;
  /** Delta of last score change (e.g., +5) — null when no animation */
  delta: number | null;
  /** Key for the floating "+N" element — changes to trigger re-animation */
  deltaKey: number;
  /** Whether the score is currently animating */
  isAnimating: boolean;
  /** Pulse effect active (brief glow after score change) */
  isPulsing: boolean;
}

/**
 * Hook that tracks score changes and provides animation state.
 *
 * @param duration - Duration of count-up animation in ms (default 600)
 * @param pulseDuration - Duration of pulse glow in ms (default 800)
 * @returns ScoreAnimationState with display values and animation flags
 */
export function useScoreAnimation(
  duration: number = 600,
  pulseDuration: number = 800,
): ScoreAnimationState {
  const totalScore = useInteractiveStore((s) => s.totalScore());
  const totalMax = useInteractiveStore((s) => s.totalMax());
  const totalPct = useInteractiveStore((s) => s.totalPct());

  const [displayScore, setDisplayScore] = useState(totalScore);
  const [displayMax, setDisplayMax] = useState(totalMax);
  const [displayPct, setDisplayPct] = useState(totalPct);
  const [delta, setDelta] = useState<number | null>(null);
  const [deltaKey, setDeltaKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  const prevScoreRef = useRef(totalScore);
  const animFrameRef = useRef<number>(0);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track score changes
  useEffect(() => {
    const prev = prevScoreRef.current;
    const diff = totalScore - prev;

    if (diff > 0) {
      // Score increased! Show delta and animate count-up
      setDelta(diff);
      setDeltaKey(k => k + 1);
      setIsAnimating(true);
      setIsPulsing(true);

      // Animate count-up from previous to new score
      const startTime = performance.now();
      const startScore = displayScore;
      const startPct = displayPct;
      const targetScore = totalScore;
      const targetPct = totalPct;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic for satisfying deceleration
        const eased = 1 - Math.pow(1 - progress, 3);

        setDisplayScore(Math.round(startScore + (targetScore - startScore) * eased));
        setDisplayPct(Math.round(startPct + (targetPct - startPct) * eased));

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayScore(targetScore);
          setDisplayPct(targetPct);
          setIsAnimating(false);
        }
      };

      // Cancel any existing animation
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(animate);

      // Clear delta after floating animation time
      const deltaTimer = setTimeout(() => setDelta(null), 1200);

      // Clear pulse after pulse duration
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => setIsPulsing(false), pulseDuration);

      prevScoreRef.current = totalScore;

      // Cleanup for this effect branch
      const cleanupDeltaTimer = deltaTimer;
      return () => {
        clearTimeout(cleanupDeltaTimer);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    } else if (diff < 0) {
      // Score reset or decreased — instant update, no animation
      setDisplayScore(totalScore);
      setDisplayPct(totalPct);
      setDelta(null);
      setIsAnimating(false);
      setIsPulsing(false);
      prevScoreRef.current = totalScore;
    }
    // When diff === 0, nothing to animate
    return undefined;
  }, [totalScore, totalPct, duration, pulseDuration, displayScore, displayPct]);

  // Always sync max score immediately (no animation needed)
  useEffect(() => {
    setDisplayMax(totalMax);
  }, [totalMax]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  return {
    displayScore,
    displayMax,
    displayPct,
    delta,
    deltaKey,
    isAnimating,
    isPulsing,
  };
}
