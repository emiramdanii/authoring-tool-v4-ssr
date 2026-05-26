// ═══════════════════════════════════════════════════════════════════
// EDUCATIONAL SPACING SYSTEM — Reading rhythm + density budgets
// ═══════════════════════════════════════════════════════════════════
// "Spacing is not empty space — it's breathing room for cognition."
//
// iOS spacing is optimized for compact phone screens.
// Educational spacing must serve a different master:
//   - Reading rhythm (not UI compactness)
//   - Cognitive breathing room (not pixel efficiency)
//   - Projector clarity (not retina density)
//
// Two subsystems:
//   1. RHYTHM — spacing between elements (title→content, section→section)
//   2. DENSITY BUDGET — hard limits on content per slide
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// RHYTHM SPACING — Generous gaps for educational reading
// ═══════════════════════════════════════════════════════════════════

export const EDU_RHYTHM = {
  /** Title to content — big breathing room after headings */
  titleToContent: 32,
  /** Content to content — paragraph spacing */
  contentToContent: 18,
  /** Section to section — major visual break */
  sectionToSection: 56,
  /** Subsection break — medium visual break */
  subsectionBreak: 36,
  /** Card internal padding — generous for readability */
  cardPadding: 24,
  /** Card compact padding — for dense cards like quiz options */
  cardPaddingCompact: 16,
  /** Nested card padding — slightly less than parent */
  nestedPadding: 20,
  /** List item spacing — between bullet points */
  listItem: 12,
  /** Icon to text — tight coupling */
  iconToText: 10,
  /** Badge/tag gap — between chip elements */
  badgeGap: 8,
  /** Quiz option gap — between answer choices */
  quizOptionGap: 14,
} as const;

// ═══════════════════════════════════════════════════════════════════
// SAFE MARGINS — Canvas safe areas for projection
// ═══════════════════════════════════════════════════════════════════
// Projectors often crop edges. Educational content must respect
// safe margins so nothing important is cut off.
// ═══════════════════════════════════════════════════════════════════

export const EDU_SAFE_MARGINS = {
  /** Top safe margin (percentage of canvas height) */
  top: 0.06,
  /** Bottom safe margin — larger for projector keystone */
  bottom: 0.08,
  /** Left safe margin */
  left: 0.05,
  /** Right safe margin */
  right: 0.05,
} as const;

// ═══════════════════════════════════════════════════════════════════
// CONTENT WIDTH — How wide content should flow
// ═══════════════════════════════════════════════════════════════════

export const EDU_CONTENT_WIDTH = {
  /** Standard reading column — optimal for 60-75 chars/line */
  standard: 680,
  /** Narrow column — for focused content, quiz, refleksi */
  narrow: 560,
  /** Wide column — for cover, hero, diagrams */
  wide: 800,
  /** Maximum — NEVER exceed this for text content */
  max: 760,
} as const;

// ═══════════════════════════════════════════════════════════════════
// DENSITY BUDGET — Hard limits on content per slide
// ═══════════════════════════════════════════════════════════════════
// The biggest mistake in educational slides: too much content.
// These are HARD NUMBERS that can be validated programmatically.
//
// "Rapi" should not be subjective — it should be measurable.
// ═══════════════════════════════════════════════════════════════════

export interface EduDensityBudget {
  /** Maximum bullet points per slide */
  maxBullets: number;
  /** Maximum paragraphs (body text blocks) per slide */
  maxParagraphs: number;
  /** Maximum total words per slide */
  maxWords: number;
  /** Maximum active colors (bg + text + accents) */
  maxColors: number;
  /** Maximum media elements (images/diagrams) per slide */
  maxMedia: number;
  /** Maximum section headers per slide */
  maxSections: number;
  /** Minimum whitespace ratio (0.35 = 35% of slide must be whitespace) */
  minWhitespaceRatio: number;
}

/**
 * Density budgets per slide type.
 * Different educational contexts need different limits.
 */
export const EDU_DENSITY_BUDGETS: Record<string, EduDensityBudget> = {
  /** Cover slides — minimal, impactful */
  cover: {
    maxBullets: 0,
    maxParagraphs: 0,
    maxWords: 12,
    maxColors: 3,
    maxMedia: 1,
    maxSections: 1,
    minWhitespaceRatio: 0.55,
  },
  /** Materi slides — can be denser but still readable */
  materi: {
    maxBullets: 5,
    maxParagraphs: 3,
    maxWords: 120,
    maxColors: 3,
    maxMedia: 2,
    maxSections: 2,
    minWhitespaceRatio: 0.35,
  },
  /** Aktivitas slides — focused, action-oriented */
  aktivitas: {
    maxBullets: 3,
    maxParagraphs: 1,
    maxWords: 60,
    maxColors: 3,
    maxMedia: 1,
    maxSections: 1,
    minWhitespaceRatio: 0.45,
  },
  /** Diskusi slides — conversational, spacious */
  diskusi: {
    maxBullets: 3,
    maxParagraphs: 2,
    maxWords: 80,
    maxColors: 3,
    maxMedia: 1,
    maxSections: 1,
    minWhitespaceRatio: 0.40,
  },
  /** Refleksi slides — calm, spacious, introspective */
  refleksi: {
    maxBullets: 2,
    maxParagraphs: 1,
    maxWords: 40,
    maxColors: 2,
    maxMedia: 0,
    maxSections: 1,
    minWhitespaceRatio: 0.50,
  },
  /** Quiz slides — focused, single question */
  quiz: {
    maxBullets: 4,     // 4 options
    maxParagraphs: 1,  // 1 question
    maxWords: 30,
    maxColors: 2,
    maxMedia: 0,
    maxSections: 1,
    minWhitespaceRatio: 0.45,
  },
  /** Rangkuman slides — synthesis, moderate density */
  rangkuman: {
    maxBullets: 5,
    maxParagraphs: 2,
    maxWords: 80,
    maxColors: 3,
    maxMedia: 1,
    maxSections: 1,
    minWhitespaceRatio: 0.40,
  },
  /** Default — safe limits for unknown types */
  default: {
    maxBullets: 5,
    maxParagraphs: 3,
    maxWords: 120,
    maxColors: 3,
    maxMedia: 2,
    maxSections: 2,
    minWhitespaceRatio: 0.35,
  },
};

// ═══════════════════════════════════════════════════════════════════
// COGNITIVE LOAD GRAMMAR — Prevent overload sequences
// ═══════════════════════════════════════════════════════════════════
// Not just per-slide limits — also cross-slide rules.
// 3 dense slides in a row = cognitive overload.
// 2 quiz slides back-to-back = assessment fatigue.
// ═══════════════════════════════════════════════════════════════════

export interface CognitiveLoadRule {
  /** Rule ID for programmatic reference */
  id: string;
  /** Human-readable description */
  description: string;
  /** Check function — returns true if the rule is VIOLATED */
  isViolated: (slideTypes: string[]) => boolean;
  /** Suggestion when violated */
  suggestion: string;
}

export const EDU_COGNITIVE_LOAD_RULES: CognitiveLoadRule[] = [
  {
    id: 'no-three-dense-slides',
    description: 'No 3 dense slides (materi/definisi) in a row',
    isViolated: (types) => {
      let streak = 0;
      for (const t of types) {
        if (t === 'materi' || t === 'definisi' || t === 'eksplorasi') {
          streak++;
          if (streak >= 3) return true;
        } else {
          streak = 0;
        }
      }
      return false;
    },
    suggestion: 'Sisipkan slide aktivitas, diskusi, atau refleksi di antara materi padat untuk memberi jeda kognitif.',
  },
  {
    id: 'no-two-quiz-slides-back-to-back',
    description: 'No 2 quiz/assessment slides back-to-back',
    isViolated: (types) => {
      for (let i = 1; i < types.length; i++) {
        const prev = types[i - 1];
        const curr = types[i];
        if ((prev === 'kuis' || prev === 'game') && (curr === 'kuis' || curr === 'game')) {
          return true;
        }
      }
      return false;
    },
    suggestion: 'Berikan jeda antar assessment — sisipkan refleksi atau rangkuman singkat.',
  },
  {
    id: 'materi-must-have-break',
    description: 'After 2 materi slides, must have a non-materi slide',
    isViolated: (types) => {
      let materiStreak = 0;
      for (const t of types) {
        if (t === 'materi') {
          materiStreak++;
          if (materiStreak > 2) return true;
        } else {
          materiStreak = 0;
        }
      }
      return false;
    },
    suggestion: 'Setelah 2 slide materi, tambahkan contoh, aktivitas, atau diskusi untuk memperkuat pemahaman.',
  },
  {
    id: 'refleksi-after-aktivitas',
    description: 'Refleksi should follow aktivitas or diskusi',
    isViolated: (types) => {
      for (let i = 0; i < types.length; i++) {
        if (types[i] === 'refleksi' && i > 0) {
          const prev = types[i - 1];
          if (prev !== 'aktivitas' && prev !== 'diskusi' && prev !== 'game' && prev !== 'kuis') {
            return true; // Refleksi should come after interactive content
          }
        }
      }
      return false;
    },
    suggestion: 'Refleksi paling bermakna setelah siswa beraktivitas — pindahkan setelah diskusi atau game.',
  },
];

// ═══════════════════════════════════════════════════════════════════
// HELPER — Validate density of a slide
// ═══════════════════════════════════════════════════════════════════

export interface DensityValidationResult {
  /** Whether the slide passes density checks */
  passes: boolean;
  /** Warnings for over-density */
  warnings: { metric: string; current: number; max: number }[];
}

export function validateDensity(
  slideType: string,
  counts: {
    bullets?: number;
    paragraphs?: number;
    words?: number;
    colors?: number;
    mediaElements?: number;
    sections?: number;
  },
): DensityValidationResult {
  const budget = EDU_DENSITY_BUDGETS[slideType] ?? EDU_DENSITY_BUDGETS.default;
  const warnings: { metric: string; current: number; max: number }[] = [];

  if (counts.bullets !== undefined && counts.bullets > budget.maxBullets) {
    warnings.push({ metric: 'bullets', current: counts.bullets, max: budget.maxBullets });
  }
  if (counts.paragraphs !== undefined && counts.paragraphs > budget.maxParagraphs) {
    warnings.push({ metric: 'paragraphs', current: counts.paragraphs, max: budget.maxParagraphs });
  }
  if (counts.words !== undefined && counts.words > budget.maxWords) {
    warnings.push({ metric: 'words', current: counts.words, max: budget.maxWords });
  }
  if (counts.colors !== undefined && counts.colors > budget.maxColors) {
    warnings.push({ metric: 'colors', current: counts.colors, max: budget.maxColors });
  }
  if (counts.mediaElements !== undefined && counts.mediaElements > budget.maxMedia) {
    warnings.push({ metric: 'mediaElements', current: counts.mediaElements, max: budget.maxMedia });
  }
  if (counts.sections !== undefined && counts.sections > budget.maxSections) {
    warnings.push({ metric: 'sections', current: counts.sections, max: budget.maxSections });
  }

  return { passes: warnings.length === 0, warnings };
}
