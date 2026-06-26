// ═══════════════════════════════════════════════════════════════
// BATCH-10 — STYLE-GLOBAL-ENGINE-01
// ═══════════════════════════════════════════════════════════════
// Style Family engine — 3 families that bundle multiple style fields
// into a single coherent swap.
//
// Design principle (senior audit):
//   "Style hanya mengubah tampilan. Jangan mengubah content."
//
// What a Style Family changes (STYLE fields only):
//   - schema.themeId (existing preset system)
//   - templateData.schemaThemeId (mirror of themeId)
//   - navConfig.navbarStyle (colorful/minimal/dark)
//   - templateData.scoreDisplayStyle (stars/percentage/points)
//
// What a Style Family does NOT change (CONTENT fields — never touched):
//   - title, subtitle, content, body, teks, petunjuk
//   - questions[], opts[], ans, ex (kuis content)
//   - pool[], kolom[] (sortir game content)
//   - badges[], cta, icon (cover content)
//   - page order, page labels
//   - scoring logic, answer keys
//
// The applyStyleFamily() function is PURE — it takes pages and returns
// new pages. It does NOT call useCanvaStore.setState() directly. The
// caller (WorkspaceStyleMenu) owns the store mutation. This makes the
// function unit-testable without mocking the store.
// ═══════════════════════════════════════════════════════════════

import type { StylePresetId } from '@/core/style/types';

// ───────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────

export type NavbarStyle = 'colorful' | 'minimal' | 'dark';
export type ScoreDisplayStyle = 'stars' | 'percentage' | 'points';

export interface StyleFamily {
  /** Unique family ID */
  id: string;
  /** Display label (Indonesian) */
  label: string;
  /** Short description */
  description: string;
  /** Material Symbols icon name */
  icon: string;
  /** Accent color for UI display (hex) */
  accentColor: string;
  /** Style preset to use (maps to existing preset registry) */
  themeId: StylePresetId;
  /** Navbar visual style */
  navbarStyle: NavbarStyle;
  /** Score display style */
  scoreDisplayStyle: ScoreDisplayStyle;
}

// ───────────────────────────────────────────────────────────────
// 3 Style Families (BATCH-10 MVP)
// ───────────────────────────────────────────────────────────────

export const STYLE_FAMILIES: StyleFamily[] = [
  {
    id: 'modern-clean',
    label: 'Modern Bersih',
    description: 'Tampilan ringan, modern, cocok untuk materi umum.',
    icon: 'auto_awesome',
    accentColor: '#10b981',
    themeId: 'modern-interactive',
    navbarStyle: 'minimal',
    scoreDisplayStyle: 'points',
  },
  {
    id: 'mission-game',
    label: 'Misi Game',
    description: 'Tampilan petualangan, cocok untuk game dan kuis interaktif.',
    icon: 'sports_esports',
    accentColor: '#f59e0b',
    themeId: 'mission-adventure',
    navbarStyle: 'colorful',
    scoreDisplayStyle: 'stars',
  },
  {
    id: 'formal-edu',
    label: 'Formal Edu',
    description: 'Tampilan formal, cocok untuk presentasi akademik.',
    icon: 'school',
    accentColor: '#3b82f6',
    themeId: 'academic-clean',
    navbarStyle: 'dark',
    scoreDisplayStyle: 'percentage',
  },
];

/** Default family ID */
export const DEFAULT_STYLE_FAMILY_ID = 'modern-clean';

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────

/**
 * Get a style family by ID. Returns null if not found.
 */
export function getStyleFamily(id: string): StyleFamily | null {
  return STYLE_FAMILIES.find((f) => f.id === id) ?? null;
}

/**
 * Get all style family IDs.
 */
export function getAllStyleFamilyIds(): string[] {
  return STYLE_FAMILIES.map((f) => f.id);
}

/**
 * Detect the current style family from a pages array.
 * Reads the themeId from the first page and reverse-maps to a family.
 * If no match found, returns DEFAULT_STYLE_FAMILY_ID.
 */
export function detectStyleFamily(pages: Array<{
  schema?: { themeId?: string } | null;
  templateData?: { schemaThemeId?: string } | null;
}>): string {
  for (const page of pages) {
    const themeId = page?.schema?.themeId || page?.templateData?.schemaThemeId;
    if (themeId) {
      const family = STYLE_FAMILIES.find((f) => f.themeId === themeId);
      if (family) return family.id;
    }
  }
  return DEFAULT_STYLE_FAMILY_ID;
}

// ───────────────────────────────────────────────────────────────
// Content fields that must NEVER be touched by style swap
// ───────────────────────────────────────────────────────────────

/**
 * List of content field names that style swap must NOT modify.
 * Used by tests to verify content preservation.
 *
 * This is the CONTRACT: if applyStyleFamily touches any of these
 * fields on any block, the test will catch it.
 */
export const PROTECTED_CONTENT_FIELDS = [
  // Common content fields
  'title', 'subtitle', 'content', 'body', 'text', 'teks',
  'petunjuk', 'intro', 'pengantar',
  // Kuis content
  'questions', 'q', 'opts', 'ans', 'ex',
  // Sortir game content
  'pool', 'kolom',
  // Cover content
  'badges', 'cta',
  // Refleksi/diskusi content
  'label', 'icon', 'warna', 'color',
  // Page structure
  'id', 'templateType', 'pageMode',
  // Scoring
  'scoring', 'maxPoints',
] as const;

// ───────────────────────────────────────────────────────────────
// Main: applyStyleFamily (PURE function — no store mutation)
// ───────────────────────────────────────────────────────────────

/**
 * Apply a style family to a pages array. Returns NEW pages — does not
 * mutate input. Only style fields are changed; all content fields are
 * preserved exactly.
 *
 * @param pages The current pages array
 * @param familyId The style family ID to apply
 * @returns New pages array with style fields updated
 */
export function applyStyleFamily<
  T extends Record<string, unknown>,
>(pages: T[], familyId: string): T[] {
  const family = getStyleFamily(familyId);
  if (!family) {
    // Unknown family — return pages unchanged (no-op, no crash)
    return pages;
  }

  return pages.map((page) => {
    const newPage: Record<string, unknown> = { ...page };

    // ── Patch schema.themeId ────────────────────────────────────
    const schema = (page.schema ?? {}) as Record<string, unknown>;
    newPage.schema = { ...schema, themeId: family.themeId };

    // ── Patch templateData.schemaThemeId + scoreDisplayStyle ────
    const templateData = (page.templateData ?? {}) as Record<string, unknown>;
    newPage.templateData = {
      ...templateData,
      schemaThemeId: family.themeId,
      scoreDisplayStyle: family.scoreDisplayStyle,
    };

    // ── Patch navConfig.navbarStyle ─────────────────────────────
    const navConfig = (page.navConfig ?? {}) as Record<string, unknown>;
    newPage.navConfig = {
      ...navConfig,
      navbarStyle: family.navbarStyle,
    };

    return newPage as T;
  });
}

// ───────────────────────────────────────────────────────────────
// Verification helper (for tests + future dev assertions)
// ───────────────────────────────────────────────────────────────

/**
 * Verify that applying a style family did NOT change any content fields.
 * Compares the original and styled pages field-by-field, excluding
 * known style fields (themeId, schemaThemeId, navbarStyle, scoreDisplayStyle).
 *
 * @returns true if content is preserved, false if any content field changed
 */
export function verifyContentPreserved<
  T extends Record<string, unknown>,
>(originalPages: T[], styledPages: T[]): boolean {
  if (originalPages.length !== styledPages.length) return false;

  const STYLE_ONLY_FIELDS = new Set([
    'themeId',
    'schemaThemeId',
    'navbarStyle',
    'scoreDisplayStyle',
  ]);

  for (let i = 0; i < originalPages.length; i++) {
    const orig = originalPages[i];
    const styled = styledPages[i];

    // Check top-level page fields
    const origKeys = new Set(Object.keys(orig));
    const styledKeys = new Set(Object.keys(styled));
    if (origKeys.size !== styledKeys.size) return false;
    for (const key of origKeys) {
      if (!styledKeys.has(key)) return false;

      // Skip style-only fields — they SHOULD change
      if (STYLE_ONLY_FIELDS.has(key)) continue;

      // For nested objects (schema, templateData, navConfig), check
      // their children but skip style-only sub-fields
      const origVal = orig[key];
      const styledVal = styled[key];

      if (origVal !== styledVal) {
        // If both are objects, deep-compare excluding style fields
        if (
          typeof origVal === 'object' &&
          origVal !== null &&
          typeof styledVal === 'object' &&
          styledVal !== null
        ) {
          const origNested = origVal as Record<string, unknown>;
          const styledNested = styledVal as Record<string, unknown>;
          const nestedKeys = new Set([
            ...Object.keys(origNested),
            ...Object.keys(styledNested),
          ]);
          for (const nk of nestedKeys) {
            if (STYLE_ONLY_FIELDS.has(nk)) continue;
            if (origNested[nk] !== styledNested[nk]) return false;
          }
        } else {
          // Non-object values that differ — content changed
          return false;
        }
      }
    }
  }

  return true;
}

// ───────────────────────────────────────────────────────────────
// Test-only exports
// ───────────────────────────────────────────────────────────────

export const __TEST__ = {
  PROTECTED_CONTENT_FIELDS,
  STYLE_ONLY_FIELDS: ['themeId', 'schemaThemeId', 'navbarStyle', 'scoreDisplayStyle'],
};
