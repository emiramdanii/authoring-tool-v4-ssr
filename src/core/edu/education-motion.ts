/**
 * EDUCATIONAL MOTION — Calm, purposeful, no bouncing
 *
 * Educational content must NOT distract from learning.
 * Motion rules:
 *   - Hover: 120-180ms (fast feedback, no lag)
 *   - Transition: 150-250ms (smooth but not slow)
 *   - Scene change: 250ms max (quick, no waiting)
 *   - NO bounce, NO elastic, NO overshoot
 *   - NO decorative animations
 *   - Entrance: Simple fade or slide only
 *
 * The iOS visual contract allows spring/bounce animations for
 * consumer app delight — that's WRONG for educational content.
 */

// ═══════════════════════════════════════════════════════════════
// MOTION TOKENS
// ═══════════════════════════════════════════════════════════════

export const EDU_MOTION = {
  duration: {
    /** Instant feedback — hover color change */
    instant: 75,
    /** Fast feedback — hover lift, active state */
    fast: 150,
    /** Standard transition — expand, collapse */
    standard: 200,
    /** Slow transition — scene entrance */
    slow: 250,
    /** Maximum — never exceed this */
    max: 300,
  },

  easing: {
    /** Default — ease-in-out, predictable */
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    /** Deceleration — entering elements */
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    /** Acceleration — exiting elements */
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  },

  /** Entrance animation — simple fade or slide, NO bounce */
  entrance: {
    /** Fade in — for content blocks */
    fadeIn: {
      animation: 'eduFadeIn 250ms cubic-bezier(0, 0, 0.2, 1) both',
    },
    /** Slide up — for sequential items */
    slideUp: {
      animation: 'eduSlideUp 250ms cubic-bezier(0, 0, 0.2, 1) both',
    },
  },

  /** FORBIDDEN patterns — never use in educational content */
  forbidden: [
    'bounce',
    'elastic',
    'overshoot',
    'spring',
    'rubberBand',
    'jello',
    'pulse',
    'shake',
    'swing',
    'tada',
    'wobble',
    'heartBeat',
  ] as const,
} as const;

// ═══════════════════════════════════════════════════════════════
// HELPER: Get edu transition style
// ═══════════════════════════════════════════════════════════════

export function eduTransitionStyle(
  properties: string = 'all',
  speed: 'instant' | 'fast' | 'standard' | 'slow' = 'standard',
): Record<string, string> {
  const duration = EDU_MOTION.duration[speed];
  return {
    transition: `${properties} ${duration}ms ${EDU_MOTION.easing.default}`,
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Get edu entrance style for stagger
// ═══════════════════════════════════════════════════════════════

export function eduEntranceStyle(
  index: number = 0,
  type: 'fadeIn' | 'slideUp' = 'slideUp',
): Record<string, string> {
  const delay = index * EDU_MOTION.duration.fast; // 150ms per item
  const anim = EDU_MOTION.entrance[type].animation;
  // Inject delay into animation shorthand
  return {
    animation: anim.replace(' both', ` ${delay}ms both`),
  };
}
