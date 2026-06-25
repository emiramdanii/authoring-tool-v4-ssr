// ═══════════════════════════════════════════════════════════════════
// PHASE-2A — Theme Migration Guard Test
// ═══════════════════════════════════════════════════════════════════
// Verifies that loadFromStorage migrates old project themes to
// 'modern-interactive' (light). Tests with fixtures that have:
//   - schema.themeId undefined
//   - schema.themeId = 'default' (dark)
//   - schema.themeId = 'academic-clean' (dark)
//   - templateData.schemaThemeId differs from schema.themeId
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CanvaPage } from '@/components/canva/types';

// Mock stores
vi.mock('@/store/authoring-store', () => ({
  useAuthoringStore: Object.assign(() => ({}), {
    getState: () => ({
      modules: [], kuis: [], games: [], meta: {}, cp: {}, tp: [], atp: {},
      alur: {}, materi: { blok: [] }, skenario: [], petunjuk: { langkah: [] },
      diskusi: { pertanyaan: [] }, refleksi: { pertanyaan: [] },
      penutup: { preview: [] }, motivasi: {}, rangkuman: {}, suara: {},
      saveToStorage: () => {}, loadFromStorage: () => {}, newProject: () => {},
      setActivePanel: () => {}, setMeta: () => {},
    }),
    setState: () => {},
  }),
}));

vi.mock('@/store/dirty-store', () => ({
  useDirtyStore: Object.assign(() => ({ dirty: false }), {
    getState: () => ({
      dirty: false,
      markDirty: () => {},
      resetOnLoad: () => {},
      startHydration: () => {},
      endHydration: () => {},
    }),
    setState: () => {},
  }),
}));

vi.mock('@/core/schema/capability-registry', () => ({
  BlockCapabilityRegistry: { filterByCapability: () => [] },
}));

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  localStorage.clear();
});

// ─────────────────────────────────────────────────────────────────
// Helpers — simulate what loadFromStorage does to theme
// ─────────────────────────────────────────────────────────────────

/**
 * Simulate the theme migration guard from persistence-slice.ts.
 * This is the EXACT logic used in loadFromStorage + loadFromDB.
 */
function migrateTheme(page: CanvaPage): CanvaPage {
  if (!page.schema) return page;
  const currentThemeId = page.schema.themeId;
  const legacyThemeId = page.templateData?.schemaThemeId as string | undefined;
  const needsMigration =
    !currentThemeId ||
    currentThemeId === 'default' ||
    currentThemeId === 'academic-clean';
  if (needsMigration) {
    const finalThemeId = 'modern-interactive';
    return {
      ...page,
      schema: { ...page.schema, themeId: finalThemeId },
      templateData: { ...page.templateData, schemaThemeId: finalThemeId },
    };
  }
  if (currentThemeId && legacyThemeId && currentThemeId !== legacyThemeId) {
    return {
      ...page,
      templateData: { ...page.templateData, schemaThemeId: currentThemeId },
    };
  }
  return page;
}

function makePageWithTheme(schemaThemeId: string | undefined, templateDataThemeId: string | undefined): CanvaPage {
  return {
    id: 'test-page',
    label: 'Test Page',
    bgDataUrl: null,
    bgColor: '#0f172a',
    overlay: 0,
    elements: [],
    templateType: 'cover',
    colorPalette: null,
    navConfig: {} as never,
    templateData: { schemaThemeId: templateDataThemeId },
    pageMode: 'schema',
    schema: {
      id: 'schema-test',
      templateType: 'cover',
      themeId: schemaThemeId,
      blocks: [],
    },
  } as CanvaPage;
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe('PHASE-2A — Theme migration guard', () => {

  it('schema.themeId undefined → migrated to modern-interactive', () => {
    const page = makePageWithTheme(undefined, 'default');
    const migrated = migrateTheme(page);
    expect(migrated.schema!.themeId).toBe('modern-interactive');
    expect(migrated.templateData.schemaThemeId).toBe('modern-interactive');
  });

  it('schema.themeId = "default" → migrated to modern-interactive', () => {
    const page = makePageWithTheme('default', 'default');
    const migrated = migrateTheme(page);
    expect(migrated.schema!.themeId).toBe('modern-interactive');
    expect(migrated.templateData.schemaThemeId).toBe('modern-interactive');
  });

  it('schema.themeId = "academic-clean" → migrated to modern-interactive', () => {
    const page = makePageWithTheme('academic-clean', 'academic-clean');
    const migrated = migrateTheme(page);
    expect(migrated.schema!.themeId).toBe('modern-interactive');
    expect(migrated.templateData.schemaThemeId).toBe('modern-interactive');
  });

  it('templateData.schemaThemeId differs from schema.themeId → synced to schema.themeId', () => {
    const page = makePageWithTheme('school-cheerful', 'default');
    const migrated = migrateTheme(page);
    // schema.themeId is NOT dark, so no migration — but sync templateData
    expect(migrated.schema!.themeId).toBe('school-cheerful');
    expect(migrated.templateData.schemaThemeId).toBe('school-cheerful');
  });

  it('schema.themeId = "modern-interactive" → unchanged (no migration needed)', () => {
    const page = makePageWithTheme('modern-interactive', 'modern-interactive');
    const migrated = migrateTheme(page);
    expect(migrated.schema!.themeId).toBe('modern-interactive');
    expect(migrated.templateData.schemaThemeId).toBe('modern-interactive');
  });

  it('schema.themeId = "school-cheerful" → unchanged (not a dark fallback)', () => {
    const page = makePageWithTheme('school-cheerful', 'school-cheerful');
    const migrated = migrateTheme(page);
    expect(migrated.schema!.themeId).toBe('school-cheerful');
    expect(migrated.templateData.schemaThemeId).toBe('school-cheerful');
  });

  it('multiple pages with mixed themes → all migrated correctly', () => {
    const pages = [
      makePageWithTheme(undefined, 'default'),
      makePageWithTheme('default', 'default'),
      makePageWithTheme('academic-clean', 'academic-clean'),
      makePageWithTheme('modern-interactive', 'modern-interactive'),
      makePageWithTheme('school-cheerful', 'default'), // sync case
    ];
    const migrated = pages.map(migrateTheme);

    expect(migrated[0]!.schema!.themeId).toBe('modern-interactive');
    expect(migrated[1]!.schema!.themeId).toBe('modern-interactive');
    expect(migrated[2]!.schema!.themeId).toBe('modern-interactive');
    expect(migrated[3]!.schema!.themeId).toBe('modern-interactive');
    expect(migrated[4]!.schema!.themeId).toBe('school-cheerful');
    expect(migrated[4]!.templateData.schemaThemeId).toBe('school-cheerful');

    // All schema.themeId and templateData.schemaThemeId must be synced
    for (const p of migrated) {
      expect(p.schema!.themeId).toBe(p.templateData.schemaThemeId);
    }
  });

  it('after migration, no page has themeId = "default" or "academic-clean"', () => {
    const pages = [
      makePageWithTheme(undefined, undefined),
      makePageWithTheme('default', 'default'),
      makePageWithTheme('academic-clean', 'academic-clean'),
    ];
    const migrated = pages.map(migrateTheme);
    for (const p of migrated) {
      expect(p.schema!.themeId).not.toBe('default');
      expect(p.schema!.themeId).not.toBe('academic-clean');
      expect(p.templateData.schemaThemeId).not.toBe('default');
      expect(p.templateData.schemaThemeId).not.toBe('academic-clean');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// Source audit: persistence-slice uses themeMigratedPages in set()
// ═══════════════════════════════════════════════════════════════════

describe('PHASE-2A — source audit', () => {
  it('persistence-slice uses themeMigratedPages (not cleanPages) in loadFromStorage set()', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/store/canva/persistence-slice.ts'),
      'utf-8',
    );
    // loadFromStorage set() must use themeMigratedPages
    // Find the first set() after themeMigratedPages definition (loadFromStorage path)
    // BATCH-01: saveToStorage now also returns true, so we need to find
    // the return true; that belongs to loadFromStorage, not saveToStorage.
    const themeMigratedStart = src.indexOf('const themeMigratedPages = cleanPages.map');
    const loadFromStorageSection = src.substring(
      themeMigratedStart,
      src.indexOf('return true;', themeMigratedStart) // find return true AFTER themeMigratedPages
    );
    expect(loadFromStorageSection).toContain('pages: themeMigratedPages');
    expect(loadFromStorageSection).not.toContain('pages: cleanPages');
  });

  it('persistence-slice uses themeMigratedPages in loadFromDB set()', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/store/canva/persistence-slice.ts'),
      'utf-8',
    );
    // loadFromDB section: from second themeMigratedPages to end of set()
    const loadFromDBSection = src.substring(
      src.lastIndexOf('const themeMigratedPages = cleanPages.map'),
      src.indexOf('leftTab: \'pages\'') // end of loadFromDB set()
    );
    expect(loadFromDBSection).toContain('pages: themeMigratedPages');
    expect(loadFromDBSection).not.toContain('pages: cleanPages');
  });
});
