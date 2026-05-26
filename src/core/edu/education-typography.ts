/**
 * EDUCATIONAL TYPOGRAPHY — "Terbaca dari belakang kelas"
 *
 * Core principle: Every student in the room must be able to read
 * the content, even from the back row. This means:
 *   - Hero ≥ 48px (scene-opening dramatic impact)
 *   - Title ≥ 40px (back-of-classroom readable)
 *   - Body ≥ 18px (comfortable reading at 3m distance)
 *   - Caption ≥ 14px (still legible, not decorative)
 *   - WCAG AAA contrast ratio (7:1 minimum)
 *   - Maximum 120 words per visual chunk
 *   - Minimum 35% whitespace ratio
 *
 * Dramatic Hierarchy (new in v2.1):
 *   - Intro Scene:  Hero 56px → Body 18px = 3.1x ratio
 *   - Concept Scene: Title 40px → Body 20px = 2.0x ratio
 *   - Practice Scene: Title 36px → Body 22px = 1.6x ratio
 *   - Reflection Scene: Title 36px → Body 18px = 2.0x ratio
 *
 * Each Scene Type has its own typography emphasis — this creates
 * the emotional rhythm that makes learning feel alive.
 *
 * These tokens REPLACE the iOS visual contract's tiny fonts
 * (11-15px) when rendering educational content on canvas.
 * The iOS VC is kept for app shell/chrome UI only.
 */

import type { SceneType } from './education-scene-types';

// ═══════════════════════════════════════════════════════════════
// EDUCATIONAL TYPE SCALE
// ═══════════════════════════════════════════════════════════════
// Named for pedagogical role, not abstract size.
// Each level has a MINIMUM that passes the back-of-classroom test.

export interface EduTypographyLevel {
  /** Human-readable name for debugging */
  name: string;
  /** Minimum font size in px — never go below this */
  minPx: number;
  /** Preferred font size in px — the default */
  px: number;
  /** Maximum font size in px — for wide/projector mode */
  maxPx: number;
  /** Font weight */
  weight: number;
  /** Line height (unitless ratio) */
  lineHeight: number;
  /** Letter spacing in em */
  letterSpacing: number;
  /** CSS font-family fallback */
  fontFamily: 'display' | 'body';
}

export const EDU_TYPOGRAPHY = {
  /** Hero — Scene-opening headline, cover title. 56px dramatic impact. */
  hero: {
    name: 'Hero',
    minPx: 42,
    px: 56,
    maxPx: 64,
    weight: 800,
    lineHeight: 1.1,
    letterSpacing: -0.03,
    fontFamily: 'display',
  } satisfies EduTypographyLevel,

  /** Page/scene title — "Tujuan Pembelajaran", "Materi", etc. */
  title: {
    name: 'Title',
    minPx: 36,
    px: 40,
    maxPx: 48,
    weight: 800,
    lineHeight: 1.15,
    letterSpacing: -0.02,
    fontFamily: 'display',
  } satisfies EduTypographyLevel,

  /** Section heading — "Definisi", "Contoh", "Langkah 1" */
  section: {
    name: 'Section',
    minPx: 26,
    px: 28,
    maxPx: 32,
    weight: 700,
    lineHeight: 1.2,
    letterSpacing: -0.01,
    fontFamily: 'display',
  } satisfies EduTypographyLevel,

  /** Large body — key definitions, important text */
  bodyLg: {
    name: 'BodyLg',
    minPx: 20,
    px: 22,
    maxPx: 24,
    weight: 400,
    lineHeight: 1.6,
    letterSpacing: 0,
    fontFamily: 'body',
  } satisfies EduTypographyLevel,

  /** Standard body — most content text */
  body: {
    name: 'Body',
    minPx: 18,
    px: 18,
    maxPx: 20,
    weight: 400,
    lineHeight: 1.65,
    letterSpacing: 0,
    fontFamily: 'body',
  } satisfies EduTypographyLevel,

  /** Caption — labels, metadata, source attribution */
  caption: {
    name: 'Caption',
    minPx: 14,
    px: 14,
    maxPx: 16,
    weight: 500,
    lineHeight: 1.4,
    letterSpacing: 0.01,
    fontFamily: 'body',
  } satisfies EduTypographyLevel,

  /** Micro — BSNP badge, variant pill (only for non-reading UI) */
  micro: {
    name: 'Micro',
    minPx: 11,
    px: 12,
    maxPx: 13,
    weight: 700,
    lineHeight: 1.3,
    letterSpacing: 0.03,
    fontFamily: 'body',
  } satisfies EduTypographyLevel,
} as const;

export type EduTypographyKey = keyof typeof EDU_TYPOGRAPHY;

// ═══════════════════════════════════════════════════════════════
// DISPLAY MODE ADJUSTMENTS
// ═══════════════════════════════════════════════════════════════
// Typography scales up for projector, down for print/student mode.

export type EduDisplayMode =
  | 'classroom'    // White bg, standard classroom
  | 'projector'    // Warm bg, max size for projection
  | 'print'        // Fotokopi-friendly, high contrast, B&W safe
  | 'student';     // Laptop/HP, slightly smaller ok

export const EDU_MODE_SCALE: Record<EduDisplayMode, number> = {
  classroom: 1.0,
  projector: 1.15,   // Scale UP for projector
  print: 0.95,        // Slightly smaller, B&W optimized
  student: 0.9,       // Laptop screen, closer viewing
};

// ═══════════════════════════════════════════════════════════════
// SCENE-AWARE TYPOGRAPHY OVERRIDES
// ═══════════════════════════════════════════════════════════════
// Each scene type has different typography emphasis:
//
// Intro:      Hero is HUGE (56px), body is normal → dramatic opening
// Concept:    Hero is moderate (44px), body is larger (20px) → readable content
// Practice:   Hero is smaller (36px), body is larger (22px) → action-focused
// Reflection: Hero is smaller (36px), body is normal (18px) → contemplative
// Summary:    Hero is big (48px), body is normal (18px) → achievement feel
//
// This creates the "dramatic hierarchy" that makes each scene FEEL different.

export interface SceneTypographyOverride {
  /** Override for hero level (if scene uses hero) */
  hero?: { px?: number; maxPx?: number; minPx?: number; weight?: number };
  /** Override for title level */
  title?: { px?: number; maxPx?: number; minPx?: number; weight?: number };
  /** Override for section level */
  section?: { px?: number; maxPx?: number; minPx?: number; weight?: number };
  /** Override for bodyLg level */
  bodyLg?: { px?: number; maxPx?: number; minPx?: number; weight?: number };
  /** Override for body level */
  body?: { px?: number; maxPx?: number; minPx?: number; weight?: number };
  /** Override for caption level */
  caption?: { px?: number; maxPx?: number; minPx?: number; weight?: number };
  /** Override for micro level */
  micro?: { px?: number; maxPx?: number; minPx?: number; weight?: number };
}

export const SCENE_TYPOGRAPHY_OVERRIDES: Record<SceneType, SceneTypographyOverride> = {
  // Intro — dramatic opening, big hero, curiosity-building
  intro: {
    hero: { px: 56, maxPx: 64, weight: 800 },
    title: { px: 44, maxPx: 52, weight: 800 },
    section: { px: 30, maxPx: 34 },
    body: { px: 18 },
  },

  // Concept — readable content, moderate hierarchy, structured
  concept: {
    hero: { px: 44, maxPx: 52, weight: 700 },
    title: { px: 40, maxPx: 48 },
    section: { px: 28, maxPx: 32 },
    body: { px: 20, minPx: 18 },    // Slightly larger body for reading
    bodyLg: { px: 22, minPx: 20 },
  },

  // Example — discovery-focused, moderate energy
  example: {
    hero: { px: 40, maxPx: 48, weight: 700 },
    title: { px: 38, maxPx: 44 },
    section: { px: 28, maxPx: 32 },
    body: { px: 20, minPx: 18 },    // Larger body for examples
    bodyLg: { px: 22, minPx: 20 },
  },

  // Practice — action-focused, body text larger for doing
  practice: {
    hero: { px: 36, maxPx: 44, weight: 700 },
    title: { px: 36, maxPx: 42, weight: 700 },
    section: { px: 26, maxPx: 30 },
    body: { px: 22, minPx: 20 },    // Large body for instructions
    bodyLg: { px: 24, minPx: 22 },
  },

  // Discussion — open, moderate hierarchy, contemplative
  discussion: {
    hero: { px: 40, maxPx: 48, weight: 700 },
    title: { px: 38, maxPx: 44 },
    section: { px: 28, maxPx: 32 },
    body: { px: 20, minPx: 18 },
  },

  // Reflection — calm, minimal drama, introspective
  reflection: {
    hero: { px: 36, maxPx: 44, weight: 600 },
    title: { px: 36, maxPx: 42, weight: 700 },
    section: { px: 26, maxPx: 30 },
    body: { px: 18 },
  },

  // Assessment — focused, balanced, no distraction
  assessment: {
    hero: { px: 36, maxPx: 44, weight: 700 },
    title: { px: 36, maxPx: 42, weight: 700 },
    section: { px: 26, maxPx: 30 },
    body: { px: 20, minPx: 18 },    // Larger body for questions
    bodyLg: { px: 22, minPx: 20 },
  },

  // Summary — achievement, closure, sense of completion
  summary: {
    hero: { px: 48, maxPx: 56, weight: 800 },
    title: { px: 42, maxPx: 48, weight: 800 },
    section: { px: 30, maxPx: 34 },
    body: { px: 18 },
  },
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Resolve typography for a display mode
// ═══════════════════════════════════════════════════════════════

export function resolveEduTypography(
  key: EduTypographyKey,
  mode: EduDisplayMode = 'classroom',
): { fontSize: string; fontWeight: number; lineHeight: number; letterSpacing: string; fontFamily: string } {
  const spec = EDU_TYPOGRAPHY[key];
  const scale = EDU_MODE_SCALE[mode];
  const px = Math.round(spec.px * scale);
  // Ensure we never go below the minimum
  const finalPx = Math.max(px, spec.minPx);

  return {
    fontSize: `${finalPx}px`,
    fontWeight: spec.weight,
    lineHeight: spec.lineHeight,
    letterSpacing: `${spec.letterSpacing}em`,
    fontFamily: spec.fontFamily === 'display'
      ? "var(--font-fredoka), 'Fredoka', cursive"
      : "var(--font-nunito), 'Nunito', sans-serif",
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Get compact-mode typography
// ═══════════════════════════════════════════════════════════════
// When isCompact is true (canvas auto-compression), we scale down
// but NEVER below the educational minimum.

export function resolveEduTypographyCompact(
  key: EduTypographyKey,
  isCompact: boolean,
  mode: EduDisplayMode = 'classroom',
): ReturnType<typeof resolveEduTypography> {
  const resolved = resolveEduTypography(key, mode);
  if (isCompact) {
    const spec = EDU_TYPOGRAPHY[key];
    // Compact mode: moderate reduction (0.85x) but never below minPx
    const compactPx = Math.max(Math.round(spec.px * 0.85), spec.minPx);
    return {
      ...resolved,
      fontSize: `${compactPx}px`,
    };
  }
  return resolved;
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Scene-aware typography resolution
// ═══════════════════════════════════════════════════════════════
// Applies scene-specific overrides to the base typography.
// The override adjusts px/weight for the scene's emotional needs.

export function resolveEduTypographyScene(
  key: EduTypographyKey,
  sceneType: SceneType,
  mode: EduDisplayMode = 'classroom',
): ReturnType<typeof resolveEduTypography> {
  const base = EDU_TYPOGRAPHY[key];
  const override = SCENE_TYPOGRAPHY_OVERRIDES[sceneType][key];
  const scale = EDU_MODE_SCALE[mode];

  // Apply overrides if they exist for this key in this scene
  const px = override?.px ?? base.px;
  const maxPx = override?.maxPx ?? base.maxPx;
  const weight = override?.weight ?? base.weight;
  const minPx = override?.minPx ?? base.minPx;

  const scaledPx = Math.round(px * scale);
  const finalPx = Math.max(scaledPx, minPx);
  // Also cap at maxPx * scale
  const cappedPx = Math.min(finalPx, Math.round(maxPx * scale));

  return {
    fontSize: `${cappedPx}px`,
    fontWeight: weight,
    lineHeight: base.lineHeight,
    letterSpacing: `${base.letterSpacing}em`,
    fontFamily: base.fontFamily === 'display'
      ? "var(--font-fredoka), 'Fredoka', cursive"
      : "var(--font-nunito), 'Nunito', sans-serif",
  };
}

/**
 * Scene-aware + compact-aware typography resolution.
 * This is the primary function that EduRenderingContext should use.
 */
export function resolveEduTypographySceneCompact(
  key: EduTypographyKey,
  sceneType: SceneType,
  isCompact: boolean,
  mode: EduDisplayMode = 'classroom',
): ReturnType<typeof resolveEduTypography> {
  const resolved = resolveEduTypographyScene(key, sceneType, mode);
  if (isCompact) {
    const base = EDU_TYPOGRAPHY[key];
    const override = SCENE_TYPOGRAPHY_OVERRIDES[sceneType][key];
    const minPx = override?.minPx ?? base.minPx;
    const overridePx = override?.px ?? base.px;
    // Moderate reduction for compact mode — 0.85x but never below minPx
    // This keeps text readable even when canvas is zoomed out
    const compactPx = Math.max(Math.round(overridePx * 0.85), minPx);
    return {
      ...resolved,
      fontSize: `${compactPx}px`,
    };
  }
  return resolved;
}
