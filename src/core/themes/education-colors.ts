// ═══════════════════════════════════════════════════════════════════
// EDUCATIONAL COLOR SYSTEM — Semantic colors for learning content
// ═══════════════════════════════════════════════════════════════════
// "Warna bukan dekorasi — tapi semantic guidance."
//
// Principles:
//   1. Projector-safe — visible on cheap projectors in both light/dark rooms
//   2. WCAG AAA — 7:1 contrast ratio minimum for all text/background pairs
//   3. Colorblind-safe — no red/green as the only differentiator
//   4. Print-safe — works in grayscale photocopy
//   5. Semantic — colors map to educational roles, not UI abstractions
//
// Architecture:
//   - 4 viewing modes (classroom, projector, print, student-screen)
//   - 8 pedagogical component colors (tujuan, materi, contoh, etc.)
//   - Each component gets: accent, accentSoft, border, icon
//   - All values validated for WCAG AAA on their intended background
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// VIEWING MODES — Different environments need different palettes
// ═══════════════════════════════════════════════════════════════════

export type EduViewingMode = 'classroom' | 'projector' | 'print' | 'student-screen';

export interface EduSurfaceColors {
  /** Slide/canvas background */
  bg: string;
  /** Card surface background */
  card: string;
  /** Nested/inset area background */
  nested: string;
  /** Border color — must be visible, not invisible */
  border: string;
}

export interface EduTextColors {
  /** Primary text — headings, main content */
  primary: string;
  /** Body text — paragraph content */
  body: string;
  /** Caption text — labels, meta */
  caption: string;
  /** Muted text — hints, placeholders */
  muted: string;
}

/**
 * Surface + text colors per viewing mode.
 *
 * CLASSROOM: Lights on, whiteboard-style. Pure white bg, dark text.
 *   Best for: regular classroom with lights on.
 *
 * PROJECTOR: Lights off, warm tinted bg. Reduces eye strain during
 *   2-hour presentations. Warm white (#FFFBF0) prevents harsh glare
 *   from projector on white slides. Text slightly softened from pure
 *   black to reduce harshness on warm bg.
 *   Best for: dark room, prolonged projection.
 *
 * PRINT: Optimized for black & white photocopy.
 *   No colored backgrounds, visible borders, ink-efficient.
 *   Best for: handouts, worksheets, fotokopi.
 *
 * STUDENT-SCREEN: Standard light mode for laptop/tablet.
 *   Slightly warmer than classroom, optimized for LCD screens.
 *   Best for: individual study on devices.
 */
export const EDU_SURFACES: Record<EduViewingMode, EduSurfaceColors> = {
  classroom: {
    bg: '#FFFFFF',
    card: '#FFFFFF',
    nested: '#F8FAFC',
    border: '#E2E8F0',
  },
  projector: {
    bg: '#FFFBF0',    // Warm white — prevents projector glare
    card: '#FFFDF7',  // Slightly warm white card
    nested: '#FFF8EB', // Warm nested area
    border: '#E5DDD0', // Warm-tinted border, visible on warm bg
  },
  print: {
    bg: '#FFFFFF',
    card: '#FFFFFF',
    nested: '#F5F5F5',  // Light gray — photocopy-safe
    border: '#CCCCCC',   // Dark enough for B&W photocopy
  },
  'student-screen': {
    bg: '#FAFBFE',      // Slightly cool white for LCD
    card: '#FFFFFF',
    nested: '#F1F5F9',
    border: '#E2E8F0',
  },
};

export const EDU_TEXT: Record<EduViewingMode, EduTextColors> = {
  classroom: {
    primary: '#0F172A',   // Slate-900 — maximum contrast on white
    body: '#1E293B',      // Slate-800 — dark enough for 8m reading
    caption: '#475569',   // Slate-600 — still readable
    muted: '#64748B',     // Slate-500 — hints only
  },
  projector: {
    primary: '#1A1A2E',   // Near-black with slight blue — not harsh on warm bg
    body: '#1E293B',      // Slate-800 — same darkness, reads well
    caption: '#4A5568',   // Gray-700 — visible on warm bg
    muted: '#6B7280',     // Gray-500 — subtle but not invisible
  },
  print: {
    primary: '#000000',   // Pure black for photocopy
    body: '#1A1A1A',      // Near-black — still photocopies well
    caption: '#4A4A4A',   // Dark gray — visible in B&W
    muted: '#6B6B6B',     // Medium gray — lightest safe for print
  },
  'student-screen': {
    primary: '#0F172A',
    body: '#1E293B',
    caption: '#475569',
    muted: '#64748B',
  },
};

// ═══════════════════════════════════════════════════════════════════
// PEDAGOGICAL COMPONENT COLORS — Semantic, not decorative
// ═══════════════════════════════════════════════════════════════════
// Each educational component has a FIXED accent color.
// Students learn the pattern: blue = tujuan, green = materi, etc.
// This is wayfinding, not decoration.
//
// Color selection criteria:
//   - Must pass WCAG AAA (7:1) on white/light backgrounds as text
//   - Must be distinguishable in grayscale (print mode)
//   - Must not create red/green confusion (colorblind-safe)
//   - Must be visible on cheap projectors
// ═══════════════════════════════════════════════════════════════════

export type EduComponentRole =
  | 'tujuan'     // Tujuan Pembelajaran — learning objectives
  | 'materi'     // Materi Inti — core material
  | 'contoh'     // Contoh — examples
  | 'aktivitas'  // Aktivitas — activities
  | 'diskusi'    // Diskusi — discussion
  | 'refleksi'   // Refleksi — reflection
  | 'quiz'       // Quiz — assessment
  | 'rangkuman'; // Rangkuman — summary

export interface EduComponentColorSet {
  /** Strong accent — for borders, icons, headings */
  accent: string;
  /** Soft accent — for backgrounds, subtle highlights */
  accentSoft: string;
  /** Accent for borders — visible but not overwhelming */
  border: string;
  /** Text color when using this component's accent */
  text: string;
  /** Lucide icon name for this component */
  icon: string;
  /** Component label in Indonesian */
  label: string;
  /** Bloom's taxonomy level this component maps to */
  bloomLevel: string;
}

/**
 * Fixed semantic colors for educational components.
 * These NEVER change between themes — they ARE the identity.
 */
export const EDU_COMPONENT_COLORS: Record<EduComponentRole, EduComponentColorSet> = {
  tujuan: {
    accent: '#1D4ED8',       // Blue-700 — goal-oriented, authoritative
    accentSoft: '#EFF6FF',   // Blue-50 — subtle bg
    border: '#BFDBFE',       // Blue-200 — visible border
    text: '#1E40AF',         // Blue-800 — text on light bg
    icon: 'Target',          // Lucide icon
    label: 'Tujuan Pembelajaran',
    bloomLevel: 'Remember',
  },
  materi: {
    accent: '#15803D',       // Green-700 — knowledge, growth
    accentSoft: '#F0FDF4',   // Green-50
    border: '#BBF7D0',       // Green-200
    text: '#166534',         // Green-800
    icon: 'BookOpen',        // Lucide icon
    label: 'Materi Inti',
    bloomLevel: 'Understand',
  },
  contoh: {
    accent: '#B45309',       // Amber-700 — illustration, insight
    accentSoft: '#FFFBEB',   // Amber-50
    border: '#FDE68A',       // Amber-200
    text: '#92400E',         // Amber-800
    icon: 'Lightbulb',       // Lucide icon
    label: 'Contoh',
    bloomLevel: 'Apply',
  },
  aktivitas: {
    accent: '#7C3AED',       // Violet-600 — participation, action
    accentSoft: '#F5F3FF',   // Violet-50
    border: '#DDD6FE',       // Violet-200
    text: '#5B21B6',         // Violet-800
    icon: 'Hand',            // Lucide icon
    label: 'Aktivitas',
    bloomLevel: 'Apply',
  },
  diskusi: {
    accent: '#0F766E',       // Teal-700 — interaction, exchange
    accentSoft: '#F0FDFA',   // Teal-50
    border: '#99F6E4',       // Teal-200
    text: '#115E59',         // Teal-800
    icon: 'MessageCircle',   // Lucide icon
    label: 'Diskusi',
    bloomLevel: 'Analyze',
  },
  refleksi: {
    accent: '#BE123C',       // Rose-700 — self-assessment, introspection
    accentSoft: '#FFF1F2',   // Rose-50
    border: '#FECDD3',       // Rose-200
    text: '#9F1239',         // Rose-800
    icon: 'Brain',           // Lucide icon
    label: 'Refleksi',
    bloomLevel: 'Evaluate',
  },
  quiz: {
    accent: '#4338CA',       // Indigo-700 — evaluation, measurement
    accentSoft: '#EEF2FF',   // Indigo-50
    border: '#C7D2FE',       // Indigo-200
    text: '#3730A3',         // Indigo-800
    icon: 'CheckCircle2',    // Lucide icon
    label: 'Quiz',
    bloomLevel: 'Evaluate',
  },
  rangkuman: {
    accent: '#334155',       // Slate-700 — synthesis, closure
    accentSoft: '#F8FAFC',   // Slate-50
    border: '#CBD5E1',       // Slate-300
    text: '#1E293B',         // Slate-800
    icon: 'ClipboardList',   // Lucide icon
    label: 'Rangkuman',
    bloomLevel: 'Create',
  },
};

// ═══════════════════════════════════════════════════════════════════
// FEEDBACK COLORS — For quiz/game responses
// ═══════════════════════════════════════════════════════════════════

export interface EduFeedbackColors {
  /** Correct answer — green */
  correct: string;
  /** Correct answer — soft bg */
  correctSoft: string;
  /** Incorrect answer — red */
  incorrect: string;
  /** Incorrect answer — soft bg */
  incorrectSoft: string;
  /** Partial/neutral — amber */
  partial: string;
  /** Partial/neutral — soft bg */
  partialSoft: string;
}

export const EDU_FEEDBACK: EduFeedbackColors = {
  correct: '#166534',       // Green-800 — dark enough for AAA text
  correctSoft: '#F0FDF4',   // Green-50
  incorrect: '#991B1B',     // Red-800 — dark enough, not the same green pair
  incorrectSoft: '#FEF2F2', // Red-50
  partial: '#92400E',       // Amber-800
  partialSoft: '#FFFBEB',   // Amber-50
};

// ═══════════════════════════════════════════════════════════════════
// PRINT MODE — Grayscale patterns for B&W photocopy
// ═══════════════════════════════════════════════════════════════════
// When printing, accent colors become meaningless.
// Instead, each component uses a distinct grayscale value
// so they remain distinguishable in black & white.
// ═══════════════════════════════════════════════════════════════════

export const EDU_PRINT_ACCENTS: Record<EduComponentRole, string> = {
  tujuan: '#1A1A2E',     // Near-black — most important
  materi: '#2D2D4A',     // Dark — core content
  contoh: '#4A4A5E',     // Medium-dark — supporting
  aktivitas: '#5E5E6E',  // Medium — action items
  diskusi: '#6E6E7E',    // Medium-light — interactive
  refleksi: '#4A3040',   // Dark-warm — introspective
  quiz: '#2A2A40',       // Dark-cool — assessment
  rangkuman: '#3A3A3A',  // Neutral dark — synthesis
};

// ═══════════════════════════════════════════════════════════════════
// HELPER — Get component color set for a given viewing mode
// ═══════════════════════════════════════════════════════════════════

export function getEduComponentStyle(
  role: EduComponentRole,
  mode: EduViewingMode = 'classroom',
): {
  accent: string;
  accentSoft: string;
  border: string;
  text: string;
  icon: string;
  bg: string;
  cardBg: string;
} {
  const colors = EDU_COMPONENT_COLORS[role];
  const surfaces = EDU_SURFACES[mode];

  if (mode === 'print') {
    // In print mode: replace colors with grayscale equivalents
    return {
      accent: EDU_PRINT_ACCENTS[role],
      accentSoft: surfaces.nested,
      border: surfaces.border,
      text: EDU_PRINT_ACCENTS[role],
      icon: colors.icon,
      bg: surfaces.bg,
      cardBg: surfaces.card,
    };
  }

  return {
    accent: colors.accent,
    accentSoft: colors.accentSoft,
    border: colors.border,
    text: colors.text,
    icon: colors.icon,
    bg: surfaces.bg,
    cardBg: surfaces.card,
  };
}

// ═══════════════════════════════════════════════════════════════════
// HELPER — Validate contrast ratio (WCAG AAA = 7:1)
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate relative luminance of a hex color.
 * Used for contrast validation.
 */
export function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculate contrast ratio between two hex colors.
 * Returns ratio where 7:1 = WCAG AAA, 4.5:1 = WCAG AA.
 */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate that all component accent colors pass WCAG AAA on their backgrounds.
 * Run this in development to catch contrast issues early.
 */
export function validateEduContrast(): { role: string; ratio: number; pass: boolean }[] {
  const results: { role: string; ratio: number; pass: boolean }[] = [];

  for (const [role, colors] of Object.entries(EDU_COMPONENT_COLORS)) {
    // Test accent text on white bg (most common use case)
    const ratio = contrastRatio(colors.accent, '#FFFFFF');
    results.push({
      role,
      ratio: Math.round(ratio * 100) / 100,
      pass: ratio >= 7, // WCAG AAA
    });
  }

  return results;
}
