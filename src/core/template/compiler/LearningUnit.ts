// LearningUnit types — semantic content units that compile to CanvaPage[]
// A LearningUnit represents ONE learning focus (STANDAR: 1 page = 1 learning focus)
// The PageSplitCompiler converts LearningUnit[] → CanvaPage[] with density enforcement

import type { SchemaBlock } from '@/core/schema/types';
import type { SceneType } from '@/core/edu/education-scene-types';

/** LearningUnit type — maps to page template types */
export type LearningUnitType =
  | 'cover' | 'tujuan' | 'apersepsi' | 'materi' | 'contoh'
  | 'aktivitas' | 'diskusi' | 'kuis' | 'refleksi' | 'rangkuman' | 'penutup';

/** A single learning unit — the atomic unit of content authoring */
export interface LearningUnit {
  /** Unique ID */
  id: string;
  /** Semantic type of this learning unit */
  type: LearningUnitType;
  /** Display label */
  label: string;
  /** Scene type for rendering context */
  sceneType: SceneType;
  /** Section label chip (e.g., "📖 Materi 1") */
  sectionLabel?: string;
  /** Section color token (e.g., "y") */
  sectionColor?: string;
  /** Content blocks for this learning unit */
  blocks: SchemaBlock[];
  /** Contract ID for theme enforcement */
  contractId?: string;
  /** Template variant */
  variant?: 'A' | 'B' | 'C';
}

/** Density check result for a compiled page */
export interface DensityCheckResult {
  /** Whether this page passes all density rules */
  passes: boolean;
  /** Word count */
  wordCount: number;
  /** Number of main blocks */
  blockCount: number;
  /** Number of active accent colors */
  accentColorCount: number;
  /** Number of quiz questions (0 for non-quiz pages) */
  quizQuestionCount: number;
  /** Number of TP items (0 for non-TP pages) */
  tpItemCount: number;
  /** Warnings */
  warnings: string[];
}

/** PAGE_DENSITY_RULES — STANDAR UTAMA SILSE */
export const PAGE_DENSITY_RULES = {
  maxWords: 90,
  maxBulletPoints: 5,
  maxCards: 4,
  maxActiveColors: 3,
  maxMainBlocks: 2,
  minBodyFontSize: 20,
  minCoverTitleFontSize: 48,
  minWhitespaceRatio: 0.30,
  maxQuizQuestionsPerPage: 1,
  maxTPItemsPerPage: 4,
} as const;
