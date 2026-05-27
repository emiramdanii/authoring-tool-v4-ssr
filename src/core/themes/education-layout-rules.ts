// ═══════════════════════════════════════════════════════════════════
// EDUCATIONAL LAYOUT GRAMMAR — Layout rules that support learning
// ═══════════════════════════════════════════════════════════════════
// "Layout bukan bebas — layout harus mendukung proses belajar."
//
// This is NOT arbitrary layout. Each layout pattern maps to a
// specific learning activity and has fixed rules about:
//   - Content arrangement
//   - Visual hierarchy
//   - Spacing and proportions
//   - What elements are required/forbidden
// ═══════════════════════════════════════════════════════════════════

import type { EduComponentRole } from './education-colors';

// ═══════════════════════════════════════════════════════════════════
// LAYOUT PATTERNS — Fixed visual structures for educational content
// ═══════════════════════════════════════════════════════════════════

export type EduLayoutPattern =
  | 'cover'              // Title + subtitle + 1 visual — clean, impactful
  | 'concept-left'       // Heading left, narrow content, visual right
  | 'concept-center'     // Centered heading, narrow content below
  | 'definition'         // Definition box + supporting grid
  | 'exploration-tabs'   // Tabbed content for multi-concept exploration
  | 'activity-steps'     // Numbered steps + clear instructions
  | 'discussion'         // Question + response area
  | 'reflection'         // Centered, spacious, minimal, calm
  | 'quiz-focus'         // Single question + options, high contrast
  | 'summary'            // Key points grid, synthesis
  | 'timeline';          // Sequential step flow

export interface EduLayoutRule {
  /** Layout pattern identifier */
  pattern: EduLayoutPattern;
  /** Human-readable description */
  description: string;
  /** Which educational components can use this layout */
  compatibleRoles: EduComponentRole[];
  /** Required elements that MUST be present */
  requiredElements: string[];
  /** Maximum number of content blocks */
  maxBlocks: number;
  /** Content width constraint */
  contentWidth: 'narrow' | 'standard' | 'wide' | 'full';
  /** Whether content should be centered */
  centered: boolean;
  /** Visual emphasis level */
  emphasis: 'high' | 'medium' | 'low';
}

/**
 * Fixed layout rules per educational pattern.
 * These are not suggestions — they are the grammar.
 */
export const EDU_LAYOUT_RULES: Record<EduLayoutPattern, EduLayoutRule> = {
  cover: {
    pattern: 'cover',
    description: 'Cover page — title besar, subtitle pendek, 1 visual utama, tidak ramai',
    compatibleRoles: ['tujuan'],
    requiredElements: ['title', 'subtitle'],
    maxBlocks: 3,
    contentWidth: 'wide',
    centered: true,
    emphasis: 'high',
  },
  'concept-left': {
    pattern: 'concept-left',
    description: 'Heading kiri, isi narrow width, contoh visual di samping. Maksimal 1 fokus utama.',
    compatibleRoles: ['materi', 'contoh'],
    requiredElements: ['heading', 'content'],
    maxBlocks: 4,
    contentWidth: 'narrow',
    centered: false,
    emphasis: 'medium',
  },
  'concept-center': {
    pattern: 'concept-center',
    description: 'Centered heading, narrow content below. Clean, focused reading.',
    compatibleRoles: ['materi', 'rangkuman'],
    requiredElements: ['heading', 'content'],
    maxBlocks: 3,
    contentWidth: 'narrow',
    centered: true,
    emphasis: 'medium',
  },
  definition: {
    pattern: 'definition',
    description: 'Definition box (accent border) + supporting grid cards below.',
    compatibleRoles: ['materi', 'contoh'],
    requiredElements: ['definition-box'],
    maxBlocks: 4,
    contentWidth: 'standard',
    centered: false,
    emphasis: 'high',
  },
  'exploration-tabs': {
    pattern: 'exploration-tabs',
    description: 'Tabbed content for multi-concept exploration. One tab visible at a time.',
    compatibleRoles: ['materi', 'aktivitas'],
    requiredElements: ['tab-container'],
    maxBlocks: 6,
    contentWidth: 'standard',
    centered: false,
    emphasis: 'medium',
  },
  'activity-steps': {
    pattern: 'activity-steps',
    description: 'Numbered steps with clear instructions. Whitespace besar. Max 3 steps per slide.',
    compatibleRoles: ['aktivitas'],
    requiredElements: ['instructions', 'steps'],
    maxBlocks: 3,
    contentWidth: 'narrow',
    centered: false,
    emphasis: 'high',
  },
  discussion: {
    pattern: 'discussion',
    description: 'Question prompt + response area. Clear question, spacious answer area.',
    compatibleRoles: ['diskusi'],
    requiredElements: ['question', 'response-area'],
    maxBlocks: 2,
    contentWidth: 'narrow',
    centered: false,
    emphasis: 'medium',
  },
  reflection: {
    pattern: 'reflection',
    description: 'Centered, spacing lega, sedikit elemen, tenang. For self-assessment and metakognisi.',
    compatibleRoles: ['refleksi'],
    requiredElements: ['prompt'],
    maxBlocks: 2,
    contentWidth: 'narrow',
    centered: true,
    emphasis: 'low',
  },
  'quiz-focus': {
    pattern: 'quiz-focus',
    description: 'Single question, high contrast, whitespace besar, CTA jelas, tidak decorative.',
    compatibleRoles: ['quiz'],
    requiredElements: ['question', 'options'],
    maxBlocks: 2,
    contentWidth: 'narrow',
    centered: true,
    emphasis: 'high',
  },
  summary: {
    pattern: 'summary',
    description: 'Key points grid — synthesis of learning. Clean, organized.',
    compatibleRoles: ['rangkuman'],
    requiredElements: ['key-points'],
    maxBlocks: 4,
    contentWidth: 'standard',
    centered: false,
    emphasis: 'medium',
  },
  timeline: {
    pattern: 'timeline',
    description: 'Sequential step flow — alur kegiatan, proses, or timeline.',
    compatibleRoles: ['tujuan', 'aktivitas'],
    requiredElements: ['steps'],
    maxBlocks: 3,
    contentWidth: 'standard',
    centered: false,
    emphasis: 'medium',
  },
};

// ═══════════════════════════════════════════════════════════════════
// SECTION TYPE → LAYOUT MAPPING
// ═══════════════════════════════════════════════════════════════════
// Maps VCS SectionType to recommended EduLayoutPattern.
// This bridges the existing VCS system with the new educational grammar.
// ═══════════════════════════════════════════════════════════════════

export const SECTION_TO_LAYOUT: Record<string, EduLayoutPattern> = {
  cover: 'cover',
  petunjuk: 'activity-steps',
  tujuan: 'timeline',
  motivasi: 'concept-center',
  materi: 'exploration-tabs',
  eksplorasi: 'exploration-tabs',
  definisi: 'definition',
  diskusi: 'discussion',
  skenario: 'activity-steps',
  game: 'quiz-focus',
  kuis: 'quiz-focus',
  hasil: 'cover',
  refleksi: 'reflection',
  penutup: 'summary',
  custom: 'concept-center',
};

// ═══════════════════════════════════════════════════════════════════
// FORBIDDEN PATTERNS — What educational layouts must NEVER do
// ═══════════════════════════════════════════════════════════════════

export const EDU_LAYOUT_FORBIDDEN = {
  /** No glassmorphism — unreadable on projectors */
  glassmorphism: true,
  /** No neon/glow effects — distracting in classrooms */
  neonGlow: true,
  /** No excessive gradients — muddies on projectors */
  heavyGradients: true,
  /** No large shadows — waste ink when printed, blur on projectors */
  heavyShadows: true,
  /** No decorative blobs — distract from content */
  decorativeBlobs: true,
  /** No stacked cards (3+ deep) — visual noise */
  deepStackedCards: true,
  /** No multi-color borders — confusing semantic meaning */
  multiColorBorders: true,
  /** No bouncing/elastic animations — distracting */
  bounceAnimations: true,
  /** No startup SaaS aesthetic — wrong context */
  startupAesthetic: true,
} as const;
