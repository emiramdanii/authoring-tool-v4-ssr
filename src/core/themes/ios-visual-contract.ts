// ═══════════════════════════════════════════════════════════════════
// iOS VISUAL CONTRACT — Formal design language for SILSE renderers
// ═══════════════════════════════════════════════════════════════════
// This contract defines the visual language that all block renderers
// MUST follow to achieve a cohesive iOS-quality aesthetic:
//
//   "Ringan, bersih, nyaman dibaca, konsisten, modern,
//    seperti aplikasi edukasi premium"
//
// Principles:
//   1. Breathing surfaces — generous whitespace, not crowded
//   2. Subtle depth — soft shadows, thin borders, no neon glow
//   3. Typographic hierarchy — clear visual weight progression
//   4. Consistent cards — 4 variants cover all use cases
//   5. Content width discipline — readable line lengths
//
// Architecture:
//   - Constants provide BOTH style objects AND Tailwind class strings
//   - TokenResolver methods consume these constants
//   - Renderers call tokens methods, never raw constants directly
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// IOS_CARD — 4 consistent card variants + pill + separator
// ═══════════════════════════════════════════════════════════════════

export const IOS_CARD = {
  /** Standard card — default for most content blocks */
  standard: {
    style: {
      borderRadius: 24,
      border: '1px solid rgba(15,23,42,0.06)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    },
    tw: 'rounded-3xl border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
    accentStripeWidth: 3,
  },

  /** Elevated card — hover states, celebration, prominent elements */
  elevated: {
    style: {
      borderRadius: 24,
      border: '1px solid rgba(15,23,42,0.08)',
      boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
    },
    tw: 'rounded-3xl border border-black/[0.08] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]',
  },

  /** Nested card — inset areas, takeaways, self-check, badges */
  nested: {
    style: {
      borderRadius: 16,
      border: '1px solid rgba(15,23,42,0.06)',
      boxShadow: 'none',
    },
    tw: 'rounded-2xl border border-black/5 bg-slate-50',
  },

  /** Interactive card — buttons, options, tabs, accordions */
  interactive: {
    style: {
      borderRadius: 12,
      boxShadow: 'none',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    },
    tw: 'rounded-xl transition-all duration-200 cursor-pointer',
  },

  /** Pill — badges, compact labels, NcGrid variant C */
  pill: {
    style: {
      borderRadius: 99,
      boxShadow: 'none',
    },
    tw: 'rounded-full',
  },

  /** Separator — thin divider between sections */
  separator: {
    style: {
      height: 1,
      background: 'rgba(15,23,42,0.06)',
    },
    tw: 'h-px bg-black/5',
  },

  /** Accent stripe — left border on cards, takeaways, self-check */
  accentStripe: {
    thin: 2,   // for compact/pill variants
    standard: 3, // for standard cards
    wide: 4,    // for elevated/hero cards
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// IOS_TYPOGRAPHY — Semantic type scale matching iOS HIG
// ═══════════════════════════════════════════════════════════════════
// Maps to specific pixel sizes that work within the 1280px canvas.
// The `canvas` size is for the schema renderer coordinate space.

export const IOS_TYPOGRAPHY = {
  /** Cover page title — the biggest text on screen */
  hero: {
    size: 36,
    weight: 900,
    lineHeight: 1.15,
    letterSpacing: -0.02,
  },

  /** Large section titles */
  title1: {
    size: 30,
    weight: 900,
    lineHeight: 1.2,
    letterSpacing: -0.01,
  },

  /** Section headers, Hero title */
  title2: {
    size: 24,
    weight: 800,
    lineHeight: 1.25,
    letterSpacing: 0,
  },

  /** Sub-section titles, Refleksi/Penutup title */
  title3: {
    size: 18,
    weight: 700,
    lineHeight: 1.35,
    letterSpacing: 0,
  },

  /** Card titles, question labels, NcGrid title */
  headline: {
    size: 15,
    weight: 700,
    lineHeight: 1.4,
    letterSpacing: 0,
  },

  /** Body text, DefBox content, Kuis B question */
  body: {
    size: 15,
    weight: 400,
    lineHeight: 1.7,
    letterSpacing: 0,
  },

  /** Subtitles, option text, preview items */
  subheadline: {
    size: 13,
    weight: 400,
    lineHeight: 1.6,
    letterSpacing: 0,
  },

  /** Small body text, step labels, accordion headers */
  footnote: {
    size: 12,
    weight: 400,
    lineHeight: 1.6,
    letterSpacing: 0,
  },

  /** Meta text, small options, completion details */
  caption1: {
    size: 11,
    weight: 600,
    lineHeight: 1.45,
    letterSpacing: 0.01,
  },

  /** Labels, badges, uppercase meta, expand buttons */
  caption2: {
    size: 10,
    weight: 800,
    lineHeight: 1.4,
    letterSpacing: 0.04,
  },

  /** CTA buttons */
  callToAction: {
    size: 13,
    weight: 800,
    lineHeight: 1,
    letterSpacing: 0.02,
  },
} as const;

export type IOS_TypographyLevel = keyof typeof IOS_TYPOGRAPHY;

// ═══════════════════════════════════════════════════════════════════
// IOS_SPACING — Semantic spacing tokens for consistent rhythm
// ═══════════════════════════════════════════════════════════════════

export const IOS_SPACING = {
  /** Button padding — standard CTA */
  buttonMd: { py: 8, px: 20 },
  /** Button padding — primary/large CTA (Cover) */
  buttonLg: { py: 12, px: 28 },
  /** Icon circle sizes */
  iconXs: 20,
  iconSm: 28,
  iconMd: 36,
  iconLg: 48,
  iconXl: 80,
  /** Section header padding */
  sectionHeader: { compact: '10px 12px', standard: '18px 20px' },
  /** Content area padding */
  contentArea: { compact: '10px 12px', standard: '18px 20px' },
  /** Tab bar button padding */
  tabPadding: { py: 6, px: 14 },
  /** Card inner padding */
  cardPadding: { compact: 10, standard: 15 },
  /** Pill badge padding */
  pillPadding: { compact: '3px 8px', standard: '5px 12px' },
  /** Grid gap between cards */
  gridGap: 12,
  /** Progress bar height */
  progressBarHeight: 4,
  /** Content max-widths */
  contentWidth: 720,
  narrowWidth: 560,
  heroWidth: 900,
  /** Rhythm spacing */
  titleToSubtitle: 8,
  subtitleToContent: 16,
  contentBlock: 24,
  majorSection: 40,
} as const;

// ═══════════════════════════════════════════════════════════════════
// IOS_SHADOW — Shadow discipline (no shadow-2xl, no neon)
// ═══════════════════════════════════════════════════════════════════

export const IOS_SHADOW = {
  /** Barely visible — resting card state */
  whisper: '0 1px 2px rgba(0,0,0,0.04)',
  /** Soft lift — standard card */
  soft: '0 2px 8px rgba(15,23,42,0.04)',
  /** Ambient — elevated card, hover state */
  ambient: '0 8px 24px rgba(15,23,42,0.06)',
  /** Prominent — floating elements, modals */
  prominent: '0 16px 48px rgba(15,23,42,0.08)',
} as const;

// ═══════════════════════════════════════════════════════════════════
// IOS_SURFACE — 4-level surface hierarchy
// ═══════════════════════════════════════════════════════════════════
// Light: bg → section → nested → interactive tint
// Dark: darkBg → darkSurface → darkNested → darkInteractive

export const IOS_SURFACE = {
  /** Level 0 — App background */
  appBg: { light: '#F5F7FB', dark: '#0e1c2f' },
  /** Level 1 — Section/card surface */
  section: { light: '#FFFFFF', dark: '#182d45' },
  /** Level 2 — Nested card, takeaway bg */
  nested: { light: '#F8FAFC', dark: 'rgba(255,255,255,0.04)' },
  /** Level 3 — Interactive tint (accent) */
  interactiveTint: { light: 'rgba(59,130,246,0.06)', dark: 'rgba(59,130,246,0.08)' },
} as const;

// ═══════════════════════════════════════════════════════════════════
// HELPER — Build a typography style object from a level
// ═══════════════════════════════════════════════════════════════════

export function iosTypographyStyle(
  level: IOS_TypographyLevel,
  overrides?: Partial<Record<'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing', string | number>>,
): Record<string, string | number> {
  const spec = IOS_TYPOGRAPHY[level];
  return {
    fontSize: spec.size,
    fontWeight: spec.weight,
    lineHeight: spec.lineHeight,
    letterSpacing: `${spec.letterSpacing}em`,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════
// EXPORT — Single contract object for convenience
// ═══════════════════════════════════════════════════════════════════

export const iosVisualContract = {
  card: IOS_CARD,
  typography: IOS_TYPOGRAPHY,
  spacing: IOS_SPACING,
  shadow: IOS_SHADOW,
  surface: IOS_SURFACE,
} as const;
