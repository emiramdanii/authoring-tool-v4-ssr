/**
 * EDUCATIONAL MOTION — Structured, purposeful, emotionally aware
 *
 * Three categories of motion:
 *
 *   1. ENTRANCE — Konten muncul di layar (structural)
 *      - fadeIn, slideUp — simple, predictable
 *      - Duration: 150-250ms
 *
 *   2. EMOTIONAL — Merespons tindakan pembelajaran (pedagogical)
 *      - check-draw, scale-pop, pulse-once, fill-bar
 *      - Duration: 200-500ms (slightly slower, biar terasa)
 *      - MVP: Progress, Discovery, Reward only
 *
 *   3. FORBIDDEN — Dekoratif tanpa tujuan pedagogis (DILARANG)
 *      - bounce, elastic, overshoot, continuous pulse
 *      - These distract from learning
 *
 * KEY DISTINCTION:
 *   pulse-once (check mark berdenyut sekali)  → EMOTIONAL (boleh)
 *   pulse (berdenyut terus-menerus)            → FORBIDDEN (mengganggu)
 *   confetti                                   → GAMIFICATION LAYER (FASE 3)
 *   holographic shimmer                        → FORBIDDEN (decorative)
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
    /** Maximum — never exceed this for structural motion */
    max: 300,
    /** Emotional — slightly slower, biar terasa (reward, progress) */
    emotional: 350,
    /** Emotional max — for major completion moments */
    emotionalMax: 500,
  },

  easing: {
    /** Default — ease-in-out, predictable */
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    /** Deceleration — entering elements */
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    /** Acceleration — exiting elements */
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    /** Emotional — slightly more dramatic ease (for rewards) */
    emotional: 'cubic-bezier(0, 0, 0.2, 1)',
  },

  // ── Category 1: ENTRANCE (structural) ───────────────────────
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

  // ── Category 2: EMOTIONAL (pedagogical) ─────────────────────
  // Motion yang MENDUKUNG pembelajaran.
  // MVP: Progress, Discovery, Reward (3 core emotions only)
  emotional: {
    /** Progress — step completion, section done */
    progress: {
      /** Progress bar fill — smooth, biar terasa bergerak */
      fillBar: {
        transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      /** Step increment — one step forward */
      stepNext: {
        transition: 'all 300ms cubic-bezier(0, 0, 0.2, 1)',
      },
      /** Section done — completed state */
      sectionDone: {
        transition: 'all 350ms cubic-bezier(0, 0, 0.2, 1)',
      },
    },
    /** Discovery — reveal, unfold, peek */
    discovery: {
      /** Progressive reveal */
      reveal: {
        animation: 'eduSlideUp 250ms cubic-bezier(0, 0, 0.2, 1) both',
      },
      /** Click to show — after student interaction */
      clickToShow: {
        transition: 'all 200ms cubic-bezier(0, 0, 0.2, 1)',
      },
      /** Accordion expand */
      accordionExpand: {
        transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
    /** Reward — small celebration for achievements */
    reward: {
      /** Check mark draw — SVG stroke animation */
      checkDraw: {
        animation: 'eduCheckDraw 350ms cubic-bezier(0.4, 0, 0.2, 1) both',
      },
      /** Scale pop — subtle 1→1.05→1 (NOT bounce) */
      scalePop: {
        animation: 'eduScalePop 250ms cubic-bezier(0.4, 0, 0.2, 1) both',
      },
      /** Pulse once — subtle opacity/scale pulse sekali saja */
      pulseOnce: {
        animation: 'eduPulseOnce 300ms cubic-bezier(0.4, 0, 0.2, 1) both',
      },
      /** Success state — element transitions to "done" */
      successState: {
        transition: 'all 300ms cubic-bezier(0, 0, 0.2, 1)',
      },
      /** Completed badge — small badge appears */
      completedBadge: {
        animation: 'eduFadeIn 250ms cubic-bezier(0, 0, 0.2, 1) both',
      },
    },
  },

  // ── Category 3: FORBIDDEN (decorative, DILARANG) ────────────
  /** FORBIDDEN patterns — never use in educational content */
  forbidden: [
    'bounce',       // Bouncing berulang — distraktif
    'elastic',      // Spring overshoot — tidak prediktabel
    'overshoot',    // Going past target then back — confusing
    'spring',       // iOS spring animation — consumer delight, not edu
    'rubberBand',   // Stretching animation — meaningless
    'jello',        // Wobble animation — meaningless
    'pulse',        // Continuous pulse — mengganggu fokus (pulse-ONCE is OK)
    'shake',        // Error shake — too aggressive for edu
    'swing',        // Pendulum — meaningless
    'tada',         // Celebration — gamification layer (FASE 3)
    'wobble',       // Unsteady — meaningless
    'heartBeat',    // Heartbeat — too gamified
    'confetti',     // Confetti burst — gamification layer (FASE 3)
    'shimmer',      // Holographic shimmer — decorative
    'holographic',  // Rainbow gradient animation — decorative
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

// ═══════════════════════════════════════════════════════════════
// HELPER: Get emotional motion style
// ═══════════════════════════════════════════════════════════════
// These are for Layer 5 (Emotional Interaction) — Progress, Discovery, Reward.

export type EmotionalMotionType =
  | 'fillBar' | 'stepNext' | 'sectionDone'               // Progress
  | 'reveal' | 'clickToShow' | 'accordionExpand'          // Discovery
  | 'checkDraw' | 'scalePop' | 'pulseOnce'                // Reward
  | 'successState' | 'completedBadge';                     // Reward

export function eduEmotionalStyle(
  type: EmotionalMotionType,
  index?: number,
): Record<string, string> {
  // Progress motions
  if (type === 'fillBar') return { ...EDU_MOTION.emotional.progress.fillBar };
  if (type === 'stepNext') return { ...EDU_MOTION.emotional.progress.stepNext };
  if (type === 'sectionDone') return { ...EDU_MOTION.emotional.progress.sectionDone };

  // Discovery motions
  if (type === 'reveal') {
    const delay = index ? index * 80 : 0;
    return {
      animation: `eduSlideUp 250ms cubic-bezier(0, 0, 0.2, 1) ${delay}ms both`,
    };
  }
  if (type === 'clickToShow') return { ...EDU_MOTION.emotional.discovery.clickToShow };
  if (type === 'accordionExpand') return { ...EDU_MOTION.emotional.discovery.accordionExpand };

  // Reward motions
  if (type === 'checkDraw') return { ...EDU_MOTION.emotional.reward.checkDraw };
  if (type === 'scalePop') return { ...EDU_MOTION.emotional.reward.scalePop };
  if (type === 'pulseOnce') return { ...EDU_MOTION.emotional.reward.pulseOnce };
  if (type === 'successState') return { ...EDU_MOTION.emotional.reward.successState };
  if (type === 'completedBadge') return { ...EDU_MOTION.emotional.reward.completedBadge };

  return {};
}
