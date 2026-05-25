/**
 * EDUCATIONAL LAYOUT RULES — Density budgets & component grammar
 *
 * These rules ensure educational content follows pedagogical principles:
 *   - Cover: Low density, high impact (12 words)
 *   - Materi: High density, structured (80-120 words)
 *   - Aktivitas: Medium density, actionable (40-60 words)
 *   - Refleksi: Low density, contemplative (20-40 words)
 *   - Quiz: Low density, focused (10-30 words)
 *   - Minimum 35% whitespace ratio
 *
 * Component Grammar: 3 layers
 *   1. Structural — Container, header, body, footer
 *   2. Pedagogical — Objective, content, example, activity, assessment
 *   3. Cognitive Load — Chunking, signalling, whitespace
 */

import type { EduComponentRole } from './education-components';

// ═══════════════════════════════════════════════════════════════
// DENSITY BUDGETS
// ═══════════════════════════════════════════════════════════════

export interface DensityBudget {
  /** Minimum words per component */
  minWords: number;
  /** Maximum words per component before splitting */
  maxWords: number;
  /** Optimal word count range */
  optimalRange: [number, number];
  /** Minimum whitespace ratio (0-1) */
  minWhitespaceRatio: number;
  /** Recommended content columns */
  columns: 1 | 2 | 3;
  /** Maximum number of items (objectives, points, etc.) */
  maxItems: number;
}

export const EDU_DENSITY: Record<EduComponentRole, DensityBudget> = {
  tujuan: {
    minWords: 10,
    maxWords: 80,
    optimalRange: [20, 50],
    minWhitespaceRatio: 0.35,
    columns: 1,
    maxItems: 6,
  },
  materi: {
    minWords: 20,
    maxWords: 120,
    optimalRange: [40, 80],
    minWhitespaceRatio: 0.3,
    columns: 1,
    maxItems: 10,
  },
  contoh: {
    minWords: 15,
    maxWords: 100,
    optimalRange: [25, 60],
    minWhitespaceRatio: 0.3,
    columns: 1,
    maxItems: 8,
  },
  aktivitas: {
    minWords: 10,
    maxWords: 60,
    optimalRange: [20, 40],
    minWhitespaceRatio: 0.35,
    columns: 1,
    maxItems: 5,
  },
  diskusi: {
    minWords: 5,
    maxWords: 60,
    optimalRange: [10, 30],
    minWhitespaceRatio: 0.35,
    columns: 1,
    maxItems: 4,
  },
  refleksi: {
    minWords: 5,
    maxWords: 40,
    optimalRange: [10, 25],
    minWhitespaceRatio: 0.4,
    columns: 1,
    maxItems: 3,
  },
  quiz: {
    minWords: 5,
    maxWords: 30,
    optimalRange: [8, 20],
    minWhitespaceRatio: 0.4,
    columns: 1,
    maxItems: 5,
  },
  rangkuman: {
    minWords: 10,
    maxWords: 80,
    optimalRange: [20, 50],
    minWhitespaceRatio: 0.35,
    columns: 1,
    maxItems: 6,
  },
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT GRAMMAR — Structural layers
// ═══════════════════════════════════════════════════════════════

export interface ComponentGrammarLayer {
  /** Structural elements required */
  elements: string[];
  /** Layout rules */
  rules: string[];
}

export const EDU_GRAMMAR = {
  /** Layer 1: Structural — every educational component has these */
  structural: {
    elements: ['container', 'header', 'body', 'footer'],
    rules: [
      'Container must have border-radius ≥ 14px',
      'Header must show component identity (icon + label)',
      'Body must use edu body typography (≥18px)',
      'Footer optional — only for actions/metadata',
    ],
  },

  /** Layer 2: Pedagogical — role-specific structure */
  pedagogical: {
    tujuan: {
      elements: ['header', 'objective-list', 'profil-section'],
      rules: [
        'Each objective must be numbered',
        'Profil Pelajar Pancasila section when bsnpRequired',
        'Maximum 6 objectives per component',
      ],
    },
    materi: {
      elements: ['header', 'content-area', 'definition-box', 'example-box'],
      rules: [
        'Content must use bodyLg for definitions',
        'Examples must have distinct visual treatment',
        'Code blocks use monospace font',
      ],
    },
    contoh: {
      elements: ['header', 'example-content', 'explanation'],
      rules: [
        'Example must be visually distinct from theory',
        'Explanation follows after example',
      ],
    },
    aktivitas: {
      elements: ['header', 'instructions', 'steps', 'time-indicator'],
      rules: [
        'Instructions must be step-by-step',
        'Time indicator shows duration',
        'Maximum 5 steps per activity',
      ],
    },
    diskusi: {
      elements: ['header', 'question-area', 'response-area'],
      rules: [
        'Questions must be numbered',
        'Response area must be visually distinct',
      ],
    },
    refleksi: {
      elements: ['header', 'reflection-question', 'self-check'],
      rules: [
        'Questions must encourage self-assessment',
        'Maximum 3 reflection questions',
      ],
    },
    quiz: {
      elements: ['header', 'question', 'options', 'feedback'],
      rules: [
        'One question per quiz component',
        '4 options maximum',
        'Feedback area for correct/incorrect',
      ],
    },
    rangkuman: {
      elements: ['header', 'key-points', 'takeaway'],
      rules: [
        'Key points must be concise',
        'Takeaway summarizes the section',
      ],
    },
  },

  /** Layer 3: Cognitive Load — chunking & signalling */
  cognitiveLoad: {
    elements: ['chunk-marker', 'signal', 'whitespace'],
    rules: [
      'Content chunks must be ≤ 120 words',
      'Signals (icons, colors) must be consistent per role',
      'Whitespace ratio must be ≥ 35%',
      'No more than 3 levels of nesting',
      'Each chunk must have a clear visual boundary',
    ],
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// PRINT-SAFE TOKENS — B&W fotokopi-friendly overrides
// ═══════════════════════════════════════════════════════════════

export const EDU_PRINT_SAFE = {
  /** Colors that survive B&W printing */
  textColor: '#000000',
  borderColor: '#333333',
  bgColor: '#FFFFFF',
  stripeColor: '#000000',
  /** Use thick borders instead of background fills */
  stripeWidth: 4,
  borderWidth: 2,
  /** No shadows in print */
  shadow: 'none',
  /** High contrast text sizes */
  titlePx: 40,
  sectionPx: 28,
  bodyPx: 18,
  captionPx: 14,
} as const;
