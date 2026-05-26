// ═══════════════════════════════════════════════════════════════════
// EDUCATIONAL MOTION SYSTEM — Subtle, fast, non-distracting
// ═══════════════════════════════════════════════════════════════════
// "Motion di kelas harus lembut, cepat, dan tidak mengganggu fokus."
//
// Educational motion is fundamentally different from app UI motion:
//   - Students are trying to LEARN, not be entertained
//   - Teacher is presenting — animations must not steal attention
//   - Projector lag can make animations look choppy
//   - Fast is better than dramatic
//
// Rules:
//   - Hover: 120-180ms (fast feedback)
//   - Transition: 150-250ms (smooth but quick)
//   - Scene transition: 250ms max (no slow fades)
//   - Quiz feedback: 200ms (immediate acknowledgment)
//   - NEVER: bounce, elastic, dramatic scale, spring overshoot
// ═══════════════════════════════════════════════════════════════════

export const EDU_MOTION = {
  /** Hover feedback — fast, subtle */
  hover: {
    duration: 150,
    easing: 'ease-out',
    scale: 1.01,        // Very subtle — barely perceptible
    shadowChange: false, // No shadow change on hover — distracting on projector
  },
  /** Active/press feedback — instant acknowledgment */
  active: {
    duration: 100,
    easing: 'ease-in',
    scale: 0.99,        // Subtle press, not dramatic
  },
  /** Focus ring — accessible, not flashy */
  focus: {
    duration: 120,
    outlineWidth: 2,
    outlineOffset: 2,
  },
  /** Scene transition — between slides */
  scene: {
    duration: 250,       // Fast — no slow fades
    easing: 'ease',
    maxDuration: 250,    // HARD MAX — never exceed
  },
  /** Quiz feedback — correct/incorrect indication */
  quizFeedback: {
    duration: 200,
    easing: 'ease-out',
  },
  /** Content entrance — staggered items appearing */
  entrance: {
    duration: 200,
    staggerDelay: 50,   // 50ms between items
    maxStaggerItems: 6,  // Don't stagger more than 6 items
    easing: 'ease-out',
  },
  /** Accordion/toggle expand */
  expand: {
    duration: 200,
    easing: 'ease-out',
  },
  /** Tab transition */
  tab: {
    duration: 150,
    easing: 'ease-out',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// FORBIDDEN MOTION — What educational content must NEVER do
// ═══════════════════════════════════════════════════════════════════

export const EDU_MOTION_FORBIDDEN = {
  /** No bounce/elastic — looks broken on projectors */
  bounce: true,
  /** No spring overshoot — distracting */
  spring: true,
  /** No dramatic scale (1.05+) — disorienting */
  dramaticScale: true,
  /** No rotation animations — makes text unreadable */
  rotation: true,
  /** No parallax effects — janky on projectors */
  parallax: true,
  /** No slow fades (>400ms) — wastes class time */
  slowFade: true,
  /** No continuous/pulsing animations — distracts learning */
  continuous: true,
  /** No simultaneous multi-element animations — chaos */
  multiElement: true,
} as const;

// ═══════════════════════════════════════════════════════════════════
// TAILWIND CLASS COMPOSITIONS — Educational interaction patterns
// ═══════════════════════════════════════════════════════════════════
// Replaces IOS_INTERACTION.tw with education-appropriate patterns.
// Key differences: smaller hover scale, no shadow changes, faster timing.
// ═══════════════════════════════════════════════════════════════════

export const EDU_INTERACTION_TW = {
  /** CTA button — subtle hover, fast transition, focus ring */
  button: 'transition-[transform,background-color] duration-150 ease-out hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent cursor-pointer',
  /** Interactive card — very subtle hover, no shadow change */
  card: 'transition-[background-color,border-color] duration-150 ease-out hover:bg-black/[0.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent cursor-pointer',
  /** Quiz option — subtle hover highlight */
  quizOption: 'transition-[background-color,border-color,transform] duration-150 ease-out hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent cursor-pointer',
  /** Game button — slightly more responsive */
  gameButton: 'transition-[transform,background-color,border-color] duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent cursor-pointer',
  /** Tab/pill toggle — bg transition only */
  tab: 'transition-[background-color,color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent cursor-pointer',
  /** Accordion — bg transition only */
  accordion: 'transition-[background-color,opacity] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent cursor-pointer',
  /** Non-interactive element */
  static: 'cursor-default',
} as const;
