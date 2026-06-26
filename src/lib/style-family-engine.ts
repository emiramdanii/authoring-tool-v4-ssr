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
>(pages: readonly T[], familyId: string): T[] {
  const family = getStyleFamily(familyId);
  if (!family) {
    // Unknown family — return pages unchanged (no-op, no crash)
    return [...pages];
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
 * Compares the original and styled pages using DEEP RECURSIVE comparison,
 * excluding known style fields (themeId, schemaThemeId, navbarStyle,
 * scoreDisplayStyle) at every level of the tree.
 *
 * RC-FIXPACK-01: Rewritten to be properly recursive. Previous version
 * only went 1 level deep and used reference equality for nested objects
 * (which always fails for arrays). Now handles:
 *   - Nested objects (schema, templateData, navConfig, blocks[i], etc.)
 *   - Arrays (blocks[], questions[], opts[], badges[], etc.)
 *   - Primitive values (string, number, boolean, null, undefined)
 *   - Style fields at any depth (skipped during comparison)
 *
 * @returns true if content is preserved, false if any content field changed
 */
export function verifyContentPreserved<
  T extends Record<string, unknown>,
>(originalPages: T[], styledPages: T[]): boolean {
  if (originalPages.length !== styledPages.length) return false;

  for (let i = 0; i < originalPages.length; i++) {
    if (!deepCompareExcludingStyleFields(originalPages[i], styledPages[i])) {
      return false;
    }
  }
  return true;
}

// ── Deep recursive comparison helper ────────────────────────────

const STYLE_ONLY_FIELDS_SET = new Set([
  'themeId',
  'schemaThemeId',
  'navbarStyle',
  'scoreDisplayStyle',
]);

/**
 * Deep-compare two values, excluding style-only fields at every level.
 *
 * - For objects: compare all keys (union), skip style-only fields,
 *   recurse into each value.
 * - For arrays: compare length, recurse into each element.
 * - For primitives: strict equality (===).
 *
 * Returns true if content is identical (excluding style fields),
 * false if any content differs.
 */
function deepCompareExcludingStyleFields(a: unknown, b: unknown): boolean {
  // Fast path: identical reference or primitive equality
  if (a === b) return true;

  // If one is null/undefined and the other isn't, they differ
  if (a == null || b == null) return a === b;

  // Both must be the same type from here
  const aType = typeof a;
  const bType = typeof b;
  if (aType !== bType) return false;

  // Handle arrays
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepCompareExcludingStyleFields(a[i], b[i])) return false;
    }
    return true;
  }

  // Handle objects (plain objects, not arrays)
  if (aType === 'object') {
    if (typeof b !== 'object' || Array.isArray(b)) return false;

    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;

    // Get all keys from both objects (union)
    const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);

    for (const key of allKeys) {
      // Skip style-only fields at EVERY level of the tree
      if (STYLE_ONLY_FIELDS_SET.has(key)) continue;

      // Both must have the key (unless it's a style field, already skipped)
      if (!(key in aObj) || !(key in bObj)) return false;

      if (!deepCompareExcludingStyleFields(aObj[key], bObj[key])) {
        return false;
      }
    }
    return true;
  }

  // Primitives (string, number, boolean, bigint, symbol) — already
  // handled by `a === b` fast path above
  return false;
}

// ───────────────────────────────────────────────────────────────
// Test-only exports
// ───────────────────────────────────────────────────────────────

export const __TEST__ = {
  PROTECTED_CONTENT_FIELDS,
  STYLE_ONLY_FIELDS: ['themeId', 'schemaThemeId', 'navbarStyle', 'scoreDisplayStyle'],
};
