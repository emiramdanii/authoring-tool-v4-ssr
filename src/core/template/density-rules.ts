// ═══════════════════════════════════════════════════════════════════
// PAGE_DENSITY_RULES — Single Source of Truth (Phase 4 dedup)
// ═══════════════════════════════════════════════════════════════════
// Previously duplicated in:
//   - src/core/template/contract/TemplateValidator.ts
//   - src/core/template/compiler/LearningUnit.ts
//
// Both now re-export from this file.
// ═══════════════════════════════════════════════════════════════════

/** STANDAR UTAMA SILSE — Page density rules for content quality */
export const PAGE_DENSITY_RULES = {
  /** Maximum visible words per page before it feels overwhelming */
  maxWords: 90,
  /** Maximum bullet points per block before it becomes a wall of text */
  maxBulletPoints: 5,
  /** Maximum cards per nc-grid block */
  maxCards: 4,
  /** Maximum active colors per page (1 main + 1 accent + 1 feedback) */
  maxActiveColors: 3,
  /** Maximum main blocks per page — STANDAR: 1 block = 1 focus */
  maxMainBlocks: 2,
  /** Minimum body font size — anything below is unreadable on projection */
  minBodyFontSize: 20,
  /** Minimum cover title font size */
  minCoverTitleFontSize: 48,
  /** Minimum whitespace ratio (30% of page must be breathing room) */
  minWhitespaceRatio: 0.30,
  /** Quiz: maximum questions per page — STANDAR: 1 question = 1 page */
  maxQuizQuestionsPerPage: 1,
  /** Quiz: default questions per page for auto-generate (teacher-friendly, can be overridden) */
  defaultQuizQuestionsPerPage: 3,
  /** TP: maximum items per page — split if more */
  maxTPItemsPerPage: 4,
} as const;
