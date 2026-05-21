/**
 * FASE 11A.1 — Block Style Contracts
 *
 * Defines the visual role each block type plays in composition.
 * Pure data definitions — NO renderer changes.
 *
 * BlockStyleContract answers:
 *   - What is this block's visual weight?
 *   - Is it a visual break or text separator?
 *   - How does visualIntent affect its appearance?
 */

import type {
  BlockStyleContract,
  VisualIntent,
  IntentStyleOverride,
} from './types';

// ═══════════════════════════════════════════════════════════════
// INTENT STYLE OVERRIDES
// ═══════════════════════════════════════════════════════════════

const INTENT_DEFAULTS: Record<VisualIntent, IntentStyleOverride> = {
  primary: {
    borderEmphasis: 'normal',
    backgroundEmphasis: 'subtle',
    spacingMultiplier: 1.0,
    typographyEmphasis: 'normal',
    accentUsage: 'moderate',
  },
  secondary: {
    borderEmphasis: 'subtle',
    backgroundEmphasis: 'subtle',
    spacingMultiplier: 0.9,
    typographyEmphasis: 'normal',
    accentUsage: 'subtle',
  },
  supporting: {
    borderEmphasis: 'none',
    backgroundEmphasis: 'none',
    spacingMultiplier: 0.8,
    typographyEmphasis: 'normal',
    accentUsage: 'none',
  },
  quiet: {
    borderEmphasis: 'none',
    backgroundEmphasis: 'none',
    spacingMultiplier: 0.7,
    typographyEmphasis: 'normal',
    accentUsage: 'none',
  },
  highlight: {
    borderEmphasis: 'strong',
    backgroundEmphasis: 'strong',
    spacingMultiplier: 1.3,
    typographyEmphasis: 'prominent',
    accentUsage: 'strong',
  },
  warning: {
    borderEmphasis: 'strong',
    backgroundEmphasis: 'normal',
    spacingMultiplier: 1.2,
    typographyEmphasis: 'elevated',
    accentUsage: 'strong',
  },
};

// ═══════════════════════════════════════════════════════════════
// BLOCK STYLE CONTRACT REGISTRY
// ═══════════════════════════════════════════════════════════════

export const BLOCK_STYLE_CONTRACTS: Record<string, BlockStyleContract> = {
  // ── Full-page blocks ──────────────────────────────────────

  cover: {
    blockType: 'cover',
    defaultIntent: 'primary',
    roleDescription: 'Full-page identity card. Dominant visual, fills entire scene.',
    visualWeight: 'heavy',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },

  hero: {
    blockType: 'hero',
    defaultIntent: 'primary',
    roleDescription: 'Full-page hero banner. Same as cover but for content sections.',
    visualWeight: 'heavy',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },

  // ── Structure blocks ──────────────────────────────────────

  petunjuk: {
    blockType: 'petunjuk',
    defaultIntent: 'secondary',
    roleDescription: 'Instructions grid. Structured, informational. Medium visual weight.',
    visualWeight: 'medium',
    isVisualBreak: false,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {
      highlight: { ...INTENT_DEFAULTS.highlight, backgroundEmphasis: 'subtle' },
    },
  },

  tp: {
    blockType: 'tp',
    defaultIntent: 'primary',
    roleDescription: 'Learning objectives. Important but concise. Structured list.',
    visualWeight: 'medium',
    isVisualBreak: false,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },

  alur: {
    blockType: 'alur',
    defaultIntent: 'secondary',
    roleDescription: 'Activity timeline. Visual sequence. Light weight.',
    visualWeight: 'light',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },

  // ── Content blocks ────────────────────────────────────────

  'def-box': {
    blockType: 'def-box',
    defaultIntent: 'secondary',
    roleDescription: 'Definition box with accent border. Can be highlight, quiet note, or standard reference.',
    visualWeight: 'medium',
    isVisualBreak: false,
    isTextSeparator: true,
    preferredWidthRatio: 1.0,
    isFullWidth: false,
    intentStyles: {
      highlight: INTENT_DEFAULTS.highlight,
      quiet: INTENT_DEFAULTS.quiet,
      warning: INTENT_DEFAULTS.warning,
      primary: INTENT_DEFAULTS.primary,
    },
  },

  'nc-grid': {
    blockType: 'nc-grid',
    defaultIntent: 'secondary',
    roleDescription: 'Card grid. Strong visual break. Multiple items with icons.',
    visualWeight: 'medium',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {
      primary: { ...INTENT_DEFAULTS.primary, spacingMultiplier: 1.1 },
      highlight: INTENT_DEFAULTS.highlight,
    },
  },

  'flashcard-set': {
    blockType: 'flashcard-set',
    defaultIntent: 'secondary',
    roleDescription: 'Flip-card review set. Interactive visual break. Good for recall practice.',
    visualWeight: 'medium',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {
      primary: { ...INTENT_DEFAULTS.primary, spacingMultiplier: 1.1 },
    },
  },

  'nk-card': {
    blockType: 'nk-card',
    defaultIntent: 'primary',
    roleDescription: 'Detailed norma card with sections. Heavy content, structured.',
    visualWeight: 'heavy',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {
      highlight: INTENT_DEFAULTS.highlight,
    },
  },

  'materi-section': {
    blockType: 'materi-section',
    defaultIntent: 'primary',
    roleDescription: 'Composite material section with BSNP badge. Contains nested blocks. Dominant content container.',
    visualWeight: 'heavy',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {
      primary: INTENT_DEFAULTS.primary,
      highlight: INTENT_DEFAULTS.highlight,
    },
  },

  'materi-blok': {
    blockType: 'materi-blok',
    defaultIntent: 'secondary',
    roleDescription: 'Internal content block (text, definition, points, etc.). Lightweight wrapper.',
    visualWeight: 'light',
    isVisualBreak: false,
    isTextSeparator: true,
    preferredWidthRatio: 1.0,
    isFullWidth: false,
    intentStyles: {
      highlight: INTENT_DEFAULTS.highlight,
      quiet: INTENT_DEFAULTS.quiet,
    },
  },

  // ── Navigation blocks ─────────────────────────────────────

  ftab: {
    blockType: 'ftab',
    defaultIntent: 'primary',
    roleDescription: 'Tabbed content navigation. Composite block. Only active tab rendered.',
    visualWeight: 'heavy',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },

  // ── Interactive blocks ────────────────────────────────────

  skenario: {
    blockType: 'skenario',
    defaultIntent: 'primary',
    roleDescription: 'Interactive story with choices. Dominant, fills scene.',
    visualWeight: 'heavy',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },

  diskusi: {
    blockType: 'diskusi',
    defaultIntent: 'secondary',
    roleDescription: 'Discussion questions with answer areas. Conversational. Medium weight.',
    visualWeight: 'medium',
    isVisualBreak: false,
    isTextSeparator: true,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {
      highlight: INTENT_DEFAULTS.highlight,
    },
  },

  kuis: {
    blockType: 'kuis',
    defaultIntent: 'primary',
    roleDescription: 'Multiple-choice quiz. Interactive, structured. Game-like feel.',
    visualWeight: 'medium',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },

  // ── Game blocks (all share similar contract) ───────────────

  'sortir-game': {
    blockType: 'sortir-game',
    defaultIntent: 'primary',
    roleDescription: 'Card sorting game. Interactive, fills scene.',
    visualWeight: 'heavy',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },

  'roda-game': {
    blockType: 'roda-game',
    defaultIntent: 'primary',
    roleDescription: 'Wheel-spin quiz game. Highly interactive, fills scene.',
    visualWeight: 'heavy',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },

  'memory-game': {
    blockType: 'memory-game',
    defaultIntent: 'primary',
    roleDescription: 'Memory matching game. Grid-based, fills scene.',
    visualWeight: 'heavy',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },

  // ── Feedback blocks ───────────────────────────────────────

  hasil: {
    blockType: 'hasil',
    defaultIntent: 'primary',
    roleDescription: 'Score/appraisal display. Celebratory, dominant.',
    visualWeight: 'heavy',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },

  refleksi: {
    blockType: 'refleksi',
    defaultIntent: 'secondary',
    roleDescription: 'Self-reflection questions + assignment. Personal, conversational.',
    visualWeight: 'medium',
    isVisualBreak: false,
    isTextSeparator: true,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {
      highlight: INTENT_DEFAULTS.highlight,
    },
  },

  penutup: {
    blockType: 'penutup',
    defaultIntent: 'secondary',
    roleDescription: 'Closing with next meeting preview. Clean ending.',
    visualWeight: 'light',
    isVisualBreak: false,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },

  // ── Visual blocks ─────────────────────────────────────────

  gambar: {
    blockType: 'gambar',
    defaultIntent: 'primary',
    roleDescription: 'Image block. Strong visual break. Caption optional.',
    visualWeight: 'heavy',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 0.85,
    isFullWidth: false,
    intentStyles: {
      highlight: INTENT_DEFAULTS.highlight,
      quiet: { ...INTENT_DEFAULTS.quiet, preferredWidthRatio: 0.6 },
    },
  },

  timeline: {
    blockType: 'timeline',
    defaultIntent: 'secondary',
    roleDescription: 'Vertical step timeline. Visual sequence with connected steps.',
    visualWeight: 'medium',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {
      highlight: INTENT_DEFAULTS.highlight,
    },
  },

  compare: {
    blockType: 'compare',
    defaultIntent: 'secondary',
    roleDescription: 'Two-column comparison. Visual break with structured content.',
    visualWeight: 'medium',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },

  reveal: {
    blockType: 'reveal',
    defaultIntent: 'highlight',
    roleDescription: 'Hidden content revealed on tap. Interactive surprise element.',
    visualWeight: 'light',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: false,
    intentStyles: {
      highlight: INTENT_DEFAULTS.highlight,
      quiet: INTENT_DEFAULTS.quiet,
    },
  },

  motivasi: {
    blockType: 'motivasi',
    defaultIntent: 'primary',
    roleDescription: 'Hook question + prior knowledge. Opening engagement.',
    visualWeight: 'heavy',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {
      highlight: INTENT_DEFAULTS.highlight,
    },
  },

  rangkuman: {
    blockType: 'rangkuman',
    defaultIntent: 'secondary',
    roleDescription: 'Key concept summary cards. Structured review.',
    visualWeight: 'medium',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },

  statistik: {
    blockType: 'statistik',
    defaultIntent: 'highlight',
    roleDescription: 'Big number cards with labels. Visual impact, data emphasis.',
    visualWeight: 'heavy',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {
      primary: INTENT_DEFAULTS.primary,
      highlight: INTENT_DEFAULTS.highlight,
    },
  },

  studi: {
    blockType: 'studi',
    defaultIntent: 'primary',
    roleDescription: 'Case study with situation + questions. Deep analysis block.',
    visualWeight: 'heavy',
    isVisualBreak: true,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {
      highlight: INTENT_DEFAULTS.highlight,
    },
  },

  // ── Data blocks ───────────────────────────────────────────

  tabel: {
    blockType: 'tabel',
    defaultIntent: 'secondary',
    roleDescription: 'Data table with headers/rows. Structured data display.',
    visualWeight: 'medium',
    isVisualBreak: false,
    isTextSeparator: true,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },

  'tabel-accord': {
    blockType: 'tabel-accord',
    defaultIntent: 'secondary',
    roleDescription: 'Accordion table rows. Expandable data.',
    visualWeight: 'medium',
    isVisualBreak: false,
    isTextSeparator: true,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },

  checklist: {
    blockType: 'checklist',
    defaultIntent: 'secondary',
    roleDescription: 'Interactive checklist. Task-oriented, light weight.',
    visualWeight: 'light',
    isVisualBreak: false,
    isTextSeparator: true,
    preferredWidthRatio: 1.0,
    isFullWidth: false,
    intentStyles: {
      highlight: INTENT_DEFAULTS.highlight,
    },
  },

  'tujuan-display': {
    blockType: 'tujuan-display',
    defaultIntent: 'primary',
    roleDescription: 'Student-facing learning objectives. BSNP-compliant.',
    visualWeight: 'medium',
    isVisualBreak: false,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: true,
    intentStyles: {},
  },
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Get contract for block type
// ═══════════════════════════════════════════════════════════════

/**
 * Returns the BlockStyleContract for a given block type.
 * Falls back to a generic contract for unknown block types.
 */
export function getBlockStyleContract(blockType: string): BlockStyleContract {
  return BLOCK_STYLE_CONTRACTS[blockType] ?? {
    blockType,
    defaultIntent: 'secondary',
    roleDescription: 'Unknown block type. Default visual treatment.',
    visualWeight: 'medium',
    isVisualBreak: false,
    isTextSeparator: false,
    preferredWidthRatio: 1.0,
    isFullWidth: false,
    intentStyles: {},
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Get intent override for a block
// ═══════════════════════════════════════════════════════════════

/**
 * Returns the IntentStyleOverride for a block type + visual intent.
 * Falls back to the default intent style for that intent level.
 */
export function getIntentStyle(
  blockType: string,
  intent: VisualIntent,
): IntentStyleOverride {
  const contract = getBlockStyleContract(blockType);
  return contract.intentStyles[intent] ?? INTENT_DEFAULTS[intent];
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Is block a visual break?
// ═══════════════════════════════════════════════════════════════

export function isVisualBreak(blockType: string): boolean {
  return getBlockStyleContract(blockType).isVisualBreak;
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Is block a text separator?
// ═══════════════════════════════════════════════════════════════

export function isTextSeparator(blockType: string): boolean {
  return getBlockStyleContract(blockType).isTextSeparator;
}
