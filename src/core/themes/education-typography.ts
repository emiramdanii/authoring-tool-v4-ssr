// ═══════════════════════════════════════════════════════════════════
// EDUCATIONAL TYPOGRAPHY SYSTEM — Classroom-optimized type scale
// ═══════════════════════════════════════════════════════════════════
// "Tipografi untuk proyektor, bukan untuk iPhone."
//
// The iOS visual contract uses max 36px hero text — fine for a phone,
// but INVISIBLE from the back row of a classroom on a projector.
//
// Key differences from iOS scale:
//   - All sizes are significantly larger (40-48px hero vs 36px)
//   - Minimum body text is 18px (vs 15px iOS) for 8m readability
//   - Line heights are more generous for sustained reading
//   - Letter spacing is optimized for projection clarity
//   - Only regular/medium/semibold/bold weights — no thin/light
//
// Reference: "Back of classroom test"
//   At 8 meters from a 1080p projector projecting a 1280px canvas,
//   18px body text is the minimum readable size.
//   40px+ is needed for headings to be identifiable.
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// TYPOGRAPHY LEVELS — Semantic naming for educational content
// ═══════════════════════════════════════════════════════════════════

export type EduTypographyLevel =
  | 'slideTitle'      // Cover/main slide title — 48px
  | 'sectionTitle'    // Section heading — 32px
  | 'subsectionTitle' // Sub-section heading — 26px
  | 'bodyLarge'       // Important body text, definitions — 22px
  | 'body'            // Standard body text — 20px
  | 'bodySmall'       // Secondary body text — 18px
  | 'caption'         // Labels, badges, meta — 16px
  | 'micro'           // Smallest text — 14px (use sparingly)
  | 'cta';            // Call-to-action buttons — 18px

export interface EduTypographySpec {
  /** Font size in px */
  size: number;
  /** Font weight (400=regular, 500=medium, 600=semibold, 700=bold) */
  weight: number;
  /** Line height as multiplier (1.5 = 1.5x font-size) */
  lineHeight: number;
  /** Letter spacing in em (0 = default, positive = more spacing) */
  letterSpacing: number;
  /** Usage context description */
  usage: string;
}

/**
 * Educational typography scale — optimized for classroom projection.
 *
 * Key rules:
 *   - Minimum 18px for ANY body text (projector readability)
 *   - Minimum 40px for ANY heading (back-row identification)
 *   - No thin/light weights — they disappear on projectors
 *   - Generous line-heights for sustained reading comfort
 *   - Slight positive letter-spacing on large text for projection clarity
 */
export const EDU_TYPOGRAPHY: Record<EduTypographyLevel, EduTypographySpec> = {
  slideTitle: {
    size: 48,
    weight: 700,
    lineHeight: 1.1,
    letterSpacing: -0.01,
    usage: 'Cover page title — the biggest text on any slide. Must be readable from 10m.',
  },
  sectionTitle: {
    size: 32,
    weight: 700,
    lineHeight: 1.2,
    letterSpacing: -0.005,
    usage: 'Section headings (Tujuan, Materi, Diskusi). The primary navigation cue for students.',
  },
  subsectionTitle: {
    size: 26,
    weight: 600,
    lineHeight: 1.3,
    letterSpacing: 0,
    usage: 'Sub-section headings, card titles, definition headers. Secondary navigation.',
  },
  bodyLarge: {
    size: 22,
    weight: 400,
    lineHeight: 1.5,
    letterSpacing: 0,
    usage: 'Important body text — definitions, key concepts, first paragraph. Emphasized but not bold.',
  },
  body: {
    size: 20,
    weight: 400,
    lineHeight: 1.6,
    letterSpacing: 0,
    usage: 'Standard body text — explanations, descriptions. The workhorse of educational content.',
  },
  bodySmall: {
    size: 18,
    weight: 400,
    lineHeight: 1.6,
    letterSpacing: 0,
    usage: 'Secondary body text — examples, side notes. Still above projector minimum.',
  },
  caption: {
    size: 16,
    weight: 500,
    lineHeight: 1.4,
    letterSpacing: 0.01,
    usage: 'Labels, badges, meta information. Use sparingly — near minimum for projection.',
  },
  micro: {
    size: 14,
    weight: 400,
    lineHeight: 1.4,
    letterSpacing: 0.01,
    usage: 'SMALLEST text. Only for non-essential info (timestamps, attribution). NEVER for content students must read.',
  },
  cta: {
    size: 18,
    weight: 700,
    lineHeight: 1,
    letterSpacing: 0.02,
    usage: 'Call-to-action buttons — "Mulai", "Kirim", "Lanjut". Must stand out clearly.',
  },
};

// ═══════════════════════════════════════════════════════════════════
// FONT RULES — What fonts to use and how
// ═══════════════════════════════════════════════════════════════════

/**
 * Allowed font weights for educational content.
 * Thin/light/extralight are FORBIDDEN — they disappear on projectors.
 */
export const EDU_FONT_WEIGHTS = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export type EduFontWeight = keyof typeof EDU_FONT_WEIGHTS;

/**
 * Font families — matching the existing SILSE setup.
 * Fredoka for display/headings, Nunito for body text.
 */
export const EDU_FONT_FAMILIES = {
  /** Display font — for titles, headings. Uses Fredoka (already loaded). */
  display: "var(--font-fredoka), 'Fredoka', cursive",
  /** Body font — for all content text. Uses Nunito (already loaded). */
  body: "var(--font-nunito), 'Nunito', sans-serif",
} as const;

/**
 * Which font family to use per typography level.
 */
export const EDU_FONT_MAP: Record<EduTypographyLevel, 'display' | 'body'> = {
  slideTitle: 'display',
  sectionTitle: 'display',
  subsectionTitle: 'display',
  bodyLarge: 'body',
  body: 'body',
  bodySmall: 'body',
  caption: 'body',
  micro: 'body',
  cta: 'body',
};

// ═══════════════════════════════════════════════════════════════════
// MAX TEXT WIDTH — Readable line lengths for learning
// ═══════════════════════════════════════════════════════════════════
// Full-width text on a projected slide is UNREADABLE.
// Optimal reading width: 60-75 characters per line.
// On a 1280px canvas, this translates to roughly 600-760px.
// ═══════════════════════════════════════════════════════════════════

export const EDU_TEXT_WIDTH = {
  /** Standard reading width — for most body text */
  standard: 680,
  /** Narrow reading width — for focused content (refleksi, quiz) */
  narrow: 560,
  /** Wide reading width — for cover subtitles, hero text */
  wide: 800,
  /** Maximum text width — NEVER exceed this */
  max: 760,
} as const;

// ═══════════════════════════════════════════════════════════════════
// PROJECTOR MINIMUM — Hard floor sizes
// ═══════════════════════════════════════════════════════════════════
// These are the ABSOLUTE MINIMUM font sizes for projected content.
// Anything below these sizes is considered INACCESSIBLE for
// students sitting 8+ meters from a 1080p projector.
// ═══════════════════════════════════════════════════════════════════

export const EDU_PROJECTOR_MINIMUMS = {
  /** Minimum heading size on projected slide */
  heading: 40,
  /** Minimum body text size on projected slide */
  body: 18,
  /** Minimum caption size on projected slide */
  caption: 14,
} as const;

// ═══════════════════════════════════════════════════════════════════
// HELPER — Build a typography style object from a level
// ═══════════════════════════════════════════════════════════════════

export function eduTypographyStyle(
  level: EduTypographyLevel,
  overrides?: Partial<Record<'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing' | 'fontFamily', string | number>>,
): Record<string, string | number> {
  const spec = EDU_TYPOGRAPHY[level];
  const family = EDU_FONT_MAP[level];
  return {
    fontSize: spec.size,
    fontWeight: spec.weight,
    lineHeight: spec.lineHeight,
    letterSpacing: `${spec.letterSpacing}em`,
    fontFamily: EDU_FONT_FAMILIES[family],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════
// HELPER — Validate that a font size meets projector minimums
// ═══════════════════════════════════════════════════════════════════

export function meetsProjectorMinimum(
  sizePx: number,
  context: 'heading' | 'body' | 'caption',
): boolean {
  return sizePx >= EDU_PROJECTOR_MINIMUMS[context];
}
