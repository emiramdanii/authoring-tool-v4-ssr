/**
 * FASE 11A.1 — Section Preset Registry
 *
 * Defines the complete visual contract for each SectionType.
 * These are PURE DATA — no renderer changes.
 *
 * Usage: resolveSectionPreset(screen) → ResolvedSectionPreset
 */

import type {
  SectionType,
  SectionPreset,
  RhythmLevel,
  DensityLevel,
  LayoutGrammarKey,
  TypographyScale,
} from './types';

// ═══════════════════════════════════════════════════════════════
// RHYTHM PRESETS
// ═══════════════════════════════════════════════════════════════

const RHYTHM_PRESETS: Record<RhythmLevel, SectionPreset['rhythm']> = {
  tight: {
    baseGap: 8,
    headingGapMultiplier: 1.5,
    visualGapMultiplier: 1.2,
    activityGapMultiplier: 1.3,
    repetitionGapMultiplier: 0.6,
    sectionEndGapMultiplier: 1.8,
  },
  normal: {
    baseGap: 12,
    headingGapMultiplier: 2.0,
    visualGapMultiplier: 1.5,
    activityGapMultiplier: 1.8,
    repetitionGapMultiplier: 0.7,
    sectionEndGapMultiplier: 2.5,
  },
  relaxed: {
    baseGap: 16,
    headingGapMultiplier: 2.5,
    visualGapMultiplier: 2.0,
    activityGapMultiplier: 2.2,
    repetitionGapMultiplier: 0.8,
    sectionEndGapMultiplier: 3.0,
  },
  spacious: {
    baseGap: 20,
    headingGapMultiplier: 3.0,
    visualGapMultiplier: 2.5,
    activityGapMultiplier: 2.8,
    repetitionGapMultiplier: 0.9,
    sectionEndGapMultiplier: 3.5,
  },
};

// ═══════════════════════════════════════════════════════════════
// DENSITY PRESETS
// ═══════════════════════════════════════════════════════════════

const DENSITY_PRESETS: Record<DensityLevel, SectionPreset['density']> = {
  sparse: {
    maxTextChars: 800,
    maxBlocks: 3,
    maxConsecutiveText: 1,
    maxConsecutiveVisual: 2,
    maxNestingDepth: 1,
  },
  comfortable: {
    maxTextChars: 1500,
    maxBlocks: 5,
    maxConsecutiveText: 2,
    maxConsecutiveVisual: 2,
    maxNestingDepth: 2,
  },
  dense: {
    maxTextChars: 2500,
    maxBlocks: 8,
    maxConsecutiveText: 3,
    maxConsecutiveVisual: 3,
    maxNestingDepth: 3,
  },
  compact: {
    maxTextChars: 4000,
    maxBlocks: 12,
    maxConsecutiveText: 4,
    maxConsecutiveVisual: 4,
    maxNestingDepth: 4,
  },
};

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY SCALES
// ═══════════════════════════════════════════════════════════════

const TYPOGRAPHY_SCALES: Record<string, TypographyScale> = {
  default: {
    h1: 2.0,
    h2: 1.5,
    h3: 1.25,
    body: 1.0,
    caption: 0.85,
    lineHeight: 1.6,
  },
  display: {
    h1: 2.5,
    h2: 1.8,
    h3: 1.35,
    body: 1.0,
    caption: 0.85,
    lineHeight: 1.5,
  },
  compact: {
    h1: 1.6,
    h2: 1.3,
    h3: 1.15,
    body: 0.9,
    caption: 0.8,
    lineHeight: 1.5,
  },
  reading: {
    h1: 1.8,
    h2: 1.4,
    h3: 1.2,
    body: 1.0,
    caption: 0.85,
    lineHeight: 1.7,
  },
};

// ═══════════════════════════════════════════════════════════════
// SECTION PRESETS — The main registry
// ═══════════════════════════════════════════════════════════════

export const SECTION_PRESETS: Record<SectionType, SectionPreset> = {
  // ── Opening sections ──────────────────────────────────────

  cover: {
    sectionType: 'cover',
    label: 'Cover',
    description: 'Full-page identity card with title, badges, and CTA. Dominant center layout, minimal blocks.',
    defaultGrammar: 'hero-center',
    allowedGrammars: ['hero-center', 'hero-split'],
    rhythm: RHYTHM_PRESETS.spacious,
    density: DENSITY_PRESETS.sparse,
    allowedBlocks: ['cover', 'hero'],
    recommendedSequence: [
      { blockType: 'cover', position: 'start', required: true, maxInstances: 1 },
    ],
    visualPriority: 'dominant',
  },

  petunjuk: {
    sectionType: 'petunjuk',
    label: 'Petunjuk',
    description: 'Instructions & orientation. Grid of instruction items with tips. Medium density, structured.',
    defaultGrammar: 'card-flow',
    allowedGrammars: ['card-flow', 'grid-3'],
    rhythm: RHYTHM_PRESETS.normal,
    density: DENSITY_PRESETS.comfortable,
    allowedBlocks: ['petunjuk'],
    recommendedSequence: [
      { blockType: 'petunjuk', position: 'start', required: true, maxInstances: 1 },
    ],
    visualPriority: 'standard',
  },

  tujuan: {
    sectionType: 'tujuan',
    label: 'Tujuan Pembelajaran',
    description: 'Learning objectives (TP/CP/ATP). Structured display with timeline. Information-dense but organized.',
    defaultGrammar: 'article-flow',
    allowedGrammars: ['article-flow', 'timeline-flow'],
    rhythm: RHYTHM_PRESETS.normal,
    density: DENSITY_PRESETS.dense,
    allowedBlocks: ['tp', 'tujuan-display', 'alur'],
    recommendedSequence: [
      { blockType: 'tp', position: 'start', required: true, maxInstances: 1 },
      { blockType: 'alur', position: 'end', required: false, maxInstances: 1 },
    ],
    typographyScale: TYPOGRAPHY_SCALES.default,
    visualPriority: 'standard',
  },

  motivasi: {
    sectionType: 'motivasi',
    label: 'Motivasi / Apersepsi',
    description: 'Hook question + prior knowledge activation. Mix of narrative and visual blocks.',
    defaultGrammar: 'article-flow',
    allowedGrammars: ['article-flow', 'card-flow'],
    rhythm: RHYTHM_PRESETS.relaxed,
    density: DENSITY_PRESETS.comfortable,
    allowedBlocks: ['motivasi', 'def-box', 'nc-grid', 'timeline', 'compare', 'gambar'],
    recommendedSequence: [
      { blockType: 'motivasi', position: 'start', required: true, maxInstances: 1 },
      { blockType: 'def-box', position: 'middle', required: false },
      { blockType: 'nc-grid', position: 'middle', required: false },
    ],
    typographyScale: TYPOGRAPHY_SCALES.reading,
    visualPriority: 'standard',
  },

  // ── Content sections ──────────────────────────────────────

  materi: {
    sectionType: 'materi',
    label: 'Materi Pelajaran',
    description: 'Core learning material. The most complex section — supports tabs, definitions, grids, flashcards, and discussion. Reading-focused rhythm.',
    defaultGrammar: 'tab-flow',
    allowedGrammars: ['tab-flow', 'article-flow', 'card-flow'],
    rhythm: RHYTHM_PRESETS.relaxed,
    density: DENSITY_PRESETS.compact,
    allowedBlocks: [
      'materi-section', 'materi-blok', 'ftab', 'def-box', 'nc-grid',
      'flashcard-set', 'nk-card', 'tabel-accord', 'tabel', 'gambar',
      'timeline', 'compare', 'statistik', 'reveal', 'checklist',
      'diskusi', 'studi',
    ],
    recommendedSequence: [
      { blockType: 'materi-section', position: 'start', required: true, maxInstances: 1 },
      { blockType: 'def-box', position: 'middle', required: false },
      { blockType: 'nc-grid', position: 'middle', required: false },
      { blockType: 'flashcard-set', position: 'middle', required: false },
      { blockType: 'diskusi', position: 'end', required: false },
    ],
    typographyScale: TYPOGRAPHY_SCALES.reading,
    visualPriority: 'dominant',
  },

  eksplorasi: {
    sectionType: 'eksplorasi',
    label: 'Eksplorasi',
    description: 'Guided exploration with internal navigation (missions, islands). Tab-based with per-tab content.',
    defaultGrammar: 'tab-flow',
    allowedGrammars: ['tab-flow', 'grid-auto'],
    rhythm: RHYTHM_PRESETS.normal,
    density: DENSITY_PRESETS.dense,
    allowedBlocks: [
      'materi-section', 'ftab', 'def-box', 'nc-grid', 'gambar',
      'timeline', 'compare', 'diskusi', 'studi',
    ],
    visualPriority: 'dominant',
  },

  definisi: {
    sectionType: 'definisi',
    label: 'Definisi / Istilah',
    description: 'Key terms & definitions. Structured list of term-explanation pairs.',
    defaultGrammar: 'card-flow',
    allowedGrammars: ['card-flow', 'article-flow'],
    rhythm: RHYTHM_PRESETS.normal,
    density: DENSITY_PRESETS.comfortable,
    allowedBlocks: ['def-box', 'nc-grid', 'nk-card', 'tabel-accord', 'flashcard-set'],
    visualPriority: 'subordinate',
  },

  // ── Interactive sections ──────────────────────────────────

  diskusi: {
    sectionType: 'diskusi',
    label: 'Diskusi',
    description: 'Discussion & group work. Open-ended questions with text areas. Conversational rhythm.',
    defaultGrammar: 'card-flow',
    allowedGrammars: ['card-flow', 'article-flow'],
    rhythm: RHYTHM_PRESETS.relaxed,
    density: DENSITY_PRESETS.comfortable,
    allowedBlocks: ['diskusi'],
    recommendedSequence: [
      { blockType: 'diskusi', position: 'start', required: true, maxInstances: 1 },
    ],
    typographyScale: TYPOGRAPHY_SCALES.reading,
    visualPriority: 'standard',
  },

  skenario: {
    sectionType: 'skenario',
    label: 'Skenario Interaktif',
    description: 'Interactive story with branching choices. Narrative-driven, one block per screen.',
    defaultGrammar: 'card-flow',
    allowedGrammars: ['card-flow'],
    rhythm: RHYTHM_PRESETS.normal,
    density: DENSITY_PRESETS.comfortable,
    allowedBlocks: ['skenario'],
    recommendedSequence: [
      { blockType: 'skenario', position: 'start', required: true, maxInstances: 1 },
    ],
    visualPriority: 'dominant',
  },

  game: {
    sectionType: 'game',
    label: 'Game / Asesmen Interaktif',
    description: 'Gamified assessment. Fixed game area with HUD. Game blocks have internal layouts.',
    defaultGrammar: 'game-landscape',
    allowedGrammars: ['game-landscape'],
    rhythm: RHYTHM_PRESETS.tight,
    density: DENSITY_PRESETS.dense,
    allowedBlocks: [
      'kuis', 'sortir-game', 'roda-game', 'memory-game', 'matching-game',
      'fill-blank-game', 'word-search-game', 'true-false-game',
      'drag-drop-game', 'crossword-game', 'team-buzzer-game', 'diskusi',
    ],
    recommendedSequence: [
      { blockType: 'kuis', position: 'middle', required: false },
    ],
    typographyScale: TYPOGRAPHY_SCALES.compact,
    visualPriority: 'dominant',
  },

  kuis: {
    sectionType: 'kuis',
    label: 'Kuis / Evaluasi',
    description: 'Quiz/evaluation section. Multiple-choice questions with feedback. Structured and focused.',
    defaultGrammar: 'card-flow',
    allowedGrammars: ['card-flow', 'game-landscape'],
    rhythm: RHYTHM_PRESETS.normal,
    density: DENSITY_PRESETS.dense,
    allowedBlocks: ['kuis', 'diskusi'],
    recommendedSequence: [
      { blockType: 'kuis', position: 'start', required: true, maxInstances: 1 },
    ],
    typographyScale: TYPOGRAPHY_SCALES.compact,
    visualPriority: 'standard',
  },

  // ── Closing sections ──────────────────────────────────────

  hasil: {
    sectionType: 'hasil',
    label: 'Hasil / Penilaian',
    description: 'Score/appraisal display. Celebratory, minimal content.',
    defaultGrammar: 'hero-center',
    allowedGrammars: ['hero-center'],
    rhythm: RHYTHM_PRESETS.spacious,
    density: DENSITY_PRESETS.sparse,
    allowedBlocks: ['hasil'],
    recommendedSequence: [
      { blockType: 'hasil', position: 'start', required: true, maxInstances: 1 },
    ],
    visualPriority: 'dominant',
  },

  refleksi: {
    sectionType: 'refleksi',
    label: 'Refleksi',
    description: 'Self-reflection + portfolio. Mix of discussion, flashcards, and reflection questions. Conversational rhythm.',
    defaultGrammar: 'article-flow',
    allowedGrammars: ['article-flow', 'card-flow'],
    rhythm: RHYTHM_PRESETS.relaxed,
    density: DENSITY_PRESETS.compact,
    allowedBlocks: [
      'refleksi', 'diskusi', 'flashcard-set', 'rangkuman', 'penutup',
      'checklist', 'def-box', 'nc-grid',
    ],
    recommendedSequence: [
      { blockType: 'diskusi', position: 'start', required: false },
      { blockType: 'flashcard-set', position: 'middle', required: false },
      { blockType: 'refleksi', position: 'middle', required: true, maxInstances: 1 },
      { blockType: 'penutup', position: 'end', required: false, maxInstances: 1 },
    ],
    typographyScale: TYPOGRAPHY_SCALES.reading,
    visualPriority: 'standard',
  },

  penutup: {
    sectionType: 'penutup',
    label: 'Penutup',
    description: 'Closing section with next meeting preview. Clean ending.',
    defaultGrammar: 'card-flow',
    allowedGrammars: ['card-flow', 'hero-center'],
    rhythm: RHYTHM_PRESETS.relaxed,
    density: DENSITY_PRESETS.comfortable,
    allowedBlocks: ['penutup', 'rangkuman'],
    recommendedSequence: [
      { blockType: 'penutup', position: 'start', required: true, maxInstances: 1 },
    ],
    typographyScale: TYPOGRAPHY_SCALES.default,
    visualPriority: 'subordinate',
  },

  // ── Special sections ──────────────────────────────────────

  dokumen: {
    sectionType: 'dokumen',
    label: 'Dokumen',
    description: 'Document viewer section. Full-width content display.',
    defaultGrammar: 'article-flow',
    allowedGrammars: ['article-flow'],
    rhythm: RHYTHM_PRESETS.normal,
    density: DENSITY_PRESETS.dense,
    visualPriority: 'standard',
  },

  custom: {
    sectionType: 'custom',
    label: 'Custom',
    description: 'Free-form section with no constraints. Legacy compatibility.',
    defaultGrammar: 'free',
    allowedGrammars: ['free', 'article-flow', 'card-flow', 'grid-auto'],
    rhythm: RHYTHM_PRESETS.normal,
    density: DENSITY_PRESETS.compact,
    visualPriority: 'standard',
  },
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Get SectionType from templateType (legacy compat)
// ═══════════════════════════════════════════════════════════════

/**
 * Maps legacy `templateType` to semantic `SectionType`.
 * Used when `sectionType` is not explicitly set on a screen.
 *
 * This mapping decouples semantic intent from legacy naming,
 * allowing gradual migration.
 */
const TEMPLATE_TYPE_TO_SECTION_TYPE: Record<string, SectionType> = {
  cover: 'cover',
  petunjuk: 'petunjuk',
  tp: 'tujuan',
  dokumen: 'dokumen',
  tujuan: 'tujuan',
  motivasi: 'motivasi',
  materi: 'materi',
  skenario: 'skenario',
  diskusi: 'diskusi',
  kuis: 'kuis',
  game: 'game',
  hasil: 'hasil',
  refleksi: 'refleksi',
  rangkuman: 'refleksi',
  penutup: 'penutup',
  split: 'materi',
  minimal: 'materi',
  custom: 'custom',
};

export function inferSectionType(templateType: string): SectionType {
  return TEMPLATE_TYPE_TO_SECTION_TYPE[templateType] ?? 'custom';
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Get preset for section type
// ═══════════════════════════════════════════════════════════════

export function getSectionPreset(sectionType: SectionType): SectionPreset {
  return SECTION_PRESETS[sectionType] ?? SECTION_PRESETS.custom;
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Infer LayoutGrammar from templateType (legacy compat)
// ═══════════════════════════════════════════════════════════════

const TEMPLATE_TYPE_TO_GRAMMAR: Record<string, LayoutGrammarKey> = {
  cover: 'hero-center',
  petunjuk: 'card-flow',
  tp: 'article-flow',
  dokumen: 'article-flow',
  motivasi: 'article-flow',
  materi: 'tab-flow',
  skenario: 'card-flow',
  diskusi: 'card-flow',
  kuis: 'card-flow',
  game: 'game-landscape',
  hasil: 'hero-center',
  refleksi: 'article-flow',
  rangkuman: 'card-flow',
  penutup: 'card-flow',
  split: 'hero-split',
  minimal: 'article-flow',
  custom: 'free',
};

export function inferLayoutGrammar(templateType: string): LayoutGrammarKey {
  return TEMPLATE_TYPE_TO_GRAMMAR[templateType] ?? 'free';
}
