/**
 * FASE 11A.1 — Layout Grammar Definitions
 *
 * Defines the spatial arrangement rules for each LayoutGrammarKey.
 * These are PURE DATA — no renderer changes.
 *
 * Layout Grammar = spatial contract
 * Section Type = semantic contract
 * Together they form the complete visual contract.
 */

import type {
  LayoutGrammarKey,
  LayoutGrammarDefinition,
  SectionType,
} from './types';

// ═══════════════════════════════════════════════════════════════
// LAYOUT GRAMMAR REGISTRY
// ═══════════════════════════════════════════════════════════════

export const LAYOUT_GRAMMARS: Record<LayoutGrammarKey, LayoutGrammarDefinition> = {
  // ── Full-page layouts ─────────────────────────────────────

  'hero-center': {
    key: 'hero-center',
    label: 'Hero Center',
    description: 'Full-bleed background with centered content. Dominant single focal point. Used for cover, hasil.',
    contentShape: 'full',
    flowDirection: 'vertical',
    safeArea: { top: 0.08, right: 0.12, bottom: 0.08, left: 0.12 },
    maxContentWidth: 0.76,
    supportsScroll: false,
    overflowStrategy: 'truncate',
    compatibleSections: ['cover', 'hasil'],
  },

  'hero-split': {
    key: 'hero-split',
    label: 'Hero Split',
    description: '60/40 split layout. Visual on one side, content on the other. Used for cover variants.',
    contentShape: 'split',
    flowDirection: 'horizontal',
    safeArea: { top: 0.06, right: 0.06, bottom: 0.06, left: 0.06 },
    maxContentWidth: 0.45,
    supportsScroll: false,
    overflowStrategy: 'compress',
    compatibleSections: ['cover', 'materi'],
  },

  // ── Reading layouts ───────────────────────────────────────

  'article-flow': {
    key: 'article-flow',
    label: 'Article Flow',
    description: 'Vertical reading flow with narrow readable column. Optimal line length for text-heavy content.',
    contentShape: 'narrow',
    flowDirection: 'vertical',
    safeArea: { top: 0.06, right: 0.15, bottom: 0.06, left: 0.15 },
    maxContentWidth: 0.70,
    supportsScroll: true,
    overflowStrategy: 'split',
    compatibleSections: ['tujuan', 'motivasi', 'materi', 'definisi', 'refleksi', 'dokumen'],
  },

  'card-flow': {
    key: 'card-flow',
    label: 'Card Flow',
    description: 'Vertical flow with card containers. Each block is wrapped in a card. Good for structured content.',
    contentShape: 'narrow',
    flowDirection: 'vertical',
    safeArea: { top: 0.06, right: 0.10, bottom: 0.06, left: 0.10 },
    maxContentWidth: 0.80,
    supportsScroll: true,
    overflowStrategy: 'split',
    compatibleSections: ['petunjuk', 'diskusi', 'kuis', 'penutup', 'definisi', 'skenario'],
  },

  'tab-flow': {
    key: 'tab-flow',
    label: 'Tab Flow',
    description: 'Content organized in tabs. Only one tab visible at a time. Solves overflow by distributing content across tabs.',
    contentShape: 'narrow',
    flowDirection: 'vertical',
    safeArea: { top: 0.06, right: 0.08, bottom: 0.06, left: 0.08 },
    maxContentWidth: 0.84,
    supportsScroll: true,
    overflowStrategy: 'tabify',
    compatibleSections: ['materi', 'eksplorasi'],
  },

  // ── Grid layouts ──────────────────────────────────────────

  'grid-2': {
    key: 'grid-2',
    label: 'Grid 2-Column',
    description: 'Two-column grid. Good for comparisons, paired items.',
    contentShape: 'grid',
    flowDirection: 'grid',
    safeArea: { top: 0.06, right: 0.08, bottom: 0.06, left: 0.08 },
    maxContentWidth: 0.84,
    supportsScroll: true,
    overflowStrategy: 'split',
    compatibleSections: ['materi', 'definisi'],
  },

  'grid-3': {
    key: 'grid-3',
    label: 'Grid 3-Column',
    description: 'Three-column grid. Good for instruction items, card sets.',
    contentShape: 'grid',
    flowDirection: 'grid',
    safeArea: { top: 0.06, right: 0.06, bottom: 0.06, left: 0.06 },
    maxContentWidth: 0.88,
    supportsScroll: true,
    overflowStrategy: 'split',
    compatibleSections: ['petunjuk', 'materi'],
  },

  'grid-auto': {
    key: 'grid-auto',
    label: 'Grid Auto-Fit',
    description: 'Responsive auto-fit grid. Columns adjust based on content count.',
    contentShape: 'grid',
    flowDirection: 'grid',
    safeArea: { top: 0.06, right: 0.06, bottom: 0.06, left: 0.06 },
    maxContentWidth: 0.88,
    supportsScroll: true,
    overflowStrategy: 'split',
    compatibleSections: ['materi', 'eksplorasi', 'custom'],
  },

  // ── Interactive layouts ───────────────────────────────────

  'game-landscape': {
    key: 'game-landscape',
    label: 'Game Landscape',
    description: 'Fixed game area with HUD overlay. Game blocks control their own internal layout.',
    contentShape: 'full',
    flowDirection: 'vertical',
    safeArea: { top: 0.04, right: 0.04, bottom: 0.04, left: 0.04 },
    maxContentWidth: 0.92,
    supportsScroll: false,
    overflowStrategy: 'ignore',
    compatibleSections: ['game'],
  },

  'split-contrast': {
    key: 'split-contrast',
    label: 'Split Contrast',
    description: 'Two-column comparison/VS layout. Left vs right with visual separator.',
    contentShape: 'split',
    flowDirection: 'horizontal',
    safeArea: { top: 0.06, right: 0.06, bottom: 0.06, left: 0.06 },
    maxContentWidth: 0.88,
    supportsScroll: true,
    overflowStrategy: 'compress',
    compatibleSections: ['materi', 'game'],
  },

  // ── Special layouts ───────────────────────────────────────

  'timeline-flow': {
    key: 'timeline-flow',
    label: 'Timeline Flow',
    description: 'Horizontal or vertical step sequence. Connected dots/steps.',
    contentShape: 'narrow',
    flowDirection: 'vertical',
    safeArea: { top: 0.06, right: 0.10, bottom: 0.06, left: 0.10 },
    maxContentWidth: 0.80,
    supportsScroll: true,
    overflowStrategy: 'split',
    compatibleSections: ['tujuan', 'materi'],
  },

  'overlay-modal': {
    key: 'overlay-modal',
    label: 'Overlay Modal',
    description: 'Overlay on top of background. For materi overlay, confirmation dialogs.',
    contentShape: 'full',
    flowDirection: 'vertical',
    safeArea: { top: 0.10, right: 0.10, bottom: 0.10, left: 0.10 },
    maxContentWidth: 0.80,
    supportsScroll: true,
    overflowStrategy: 'compress',
    compatibleSections: ['materi', 'eksplorasi'],
  },

  'free': {
    key: 'free',
    label: 'Free Layout',
    description: 'No constraints. Legacy compatibility mode. Blocks can be anywhere.',
    contentShape: 'free',
    flowDirection: 'vertical',
    safeArea: { top: 0.04, right: 0.04, bottom: 0.04, left: 0.04 },
    maxContentWidth: 0.92,
    supportsScroll: true,
    overflowStrategy: 'ignore',
    compatibleSections: ['custom', 'materi', 'eksplorasi'],
  },
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Get grammar definition
// ═══════════════════════════════════════════════════════════════

export function getLayoutGrammar(key: LayoutGrammarKey): LayoutGrammarDefinition {
  return LAYOUT_GRAMMARS[key] ?? LAYOUT_GRAMMARS.free;
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Check if grammar is compatible with section
// ═══════════════════════════════════════════════════════════════

export function isGrammarCompatibleWithSection(
  grammar: LayoutGrammarKey,
  sectionType: SectionType,
): boolean {
  const def = LAYOUT_GRAMMARS[grammar];
  if (!def) return false;
  return def.compatibleSections.includes(sectionType);
}
