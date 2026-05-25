/**
 * EDUCATIONAL TYPOGRAPHY — "Terbaca dari belakang kelas"
 *
 * Core principle: Every student in the room must be able to read
 * the content, even from the back row. This means:
 *   - Heading ≥ 40px (back-of-classroom readable)
 *   - Body ≥ 18px (comfortable reading at 3m distance)
 *   - Caption ≥ 14px (still legible, not decorative)
 *   - WCAG AAA contrast ratio (7:1 minimum)
 *   - Maximum 120 words per visual chunk
 *   - Minimum 35% whitespace ratio
 *
 * These tokens REPLACE the iOS visual contract's tiny fonts
 * (11-15px) when rendering educational content on canvas.
 * The iOS VC is kept for app shell/chrome UI only.
 */

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
    // Compact mode: use minPx but never below it
    return {
      ...resolved,
      fontSize: `${spec.minPx}px`,
    };
  }
  return resolved;
}
