// ═══════════════════════════════════════════════════════════════
// BATCH-10: STYLE-GLOBAL-ENGINE-01 — Tests
// ═══════════════════════════════════════════════════════════════
// Tests for the Style Family engine.
//
// Critical contract: style swap must NEVER change content fields.
// Tests verify this by comparing content before/after swap.
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  STYLE_FAMILIES,
  DEFAULT_STYLE_FAMILY_ID,
  getStyleFamily,
  getAllStyleFamilyIds,
  detectStyleFamily,
  applyStyleFamily,
  verifyContentPreserved,
  PROTECTED_CONTENT_FIELDS,
  __TEST__,
} from '@/lib/style-family-engine';

const readSrc = (rel: string) =>
  readFileSync(resolve(__dirname, '..', rel), 'utf-8');

// ───────────────────────────────────────────────────────────────
// A. Source audit — module exports correct API
// ───────────────────────────────────────────────────────────────

describe('BATCH-10: style-family-engine — module exports', () => {
  const src = readSrc('lib/style-family-engine.ts');

  it('exports StyleFamily interface', () => {
    expect(src).toContain('export interface StyleFamily');
  });

  it('exports NavbarStyle + ScoreDisplayStyle types', () => {
    expect(src).toContain("export type NavbarStyle = 'colorful' | 'minimal' | 'dark'");
    expect(src).toContain("export type ScoreDisplayStyle = 'stars' | 'percentage' | 'points'");
  });

  it('exports STYLE_FAMILIES array', () => {
    expect(src).toContain('export const STYLE_FAMILIES: StyleFamily[]');
  });

  it('exports DEFAULT_STYLE_FAMILY_ID', () => {
    expect(src).toContain("DEFAULT_STYLE_FAMILY_ID = 'modern-clean'");
  });

  it('exports getStyleFamily function', () => {
    expect(src).toContain('export function getStyleFamily');
  });

  it('exports getAllStyleFamilyIds function', () => {
    expect(src).toContain('export function getAllStyleFamilyIds');
  });

  it('exports detectStyleFamily function', () => {
    expect(src).toContain('export function detectStyleFamily');
  });

  it('exports applyStyleFamily function', () => {
    expect(src).toContain('export function applyStyleFamily');
  });

  it('exports verifyContentPreserved function', () => {
    expect(src).toContain('export function verifyContentPreserved');
  });

  it('exports PROTECTED_CONTENT_FIELDS constant', () => {
    expect(src).toContain('export const PROTECTED_CONTENT_FIELDS');
  });

  it('imports StylePresetId from core/style/types', () => {
    expect(src).toContain("from '@/core/style/types'");
    expect(src).toContain('StylePresetId');
  });
});

// ───────────────────────────────────────────────────────────────
// B. 3 Style Families defined
// ───────────────────────────────────────────────────────────────

describe('BATCH-10: 3 style families defined', () => {
  it('has exactly 3 families', () => {
    expect(STYLE_FAMILIES.length).toBe(3);
  });

  it('has modern-clean family', () => {
    const f = getStyleFamily('modern-clean');
    expect(f).not.toBeNull();
    expect(f?.label).toBe('Modern Bersih');
    expect(f?.themeId).toBe('modern-interactive');
    expect(f?.navbarStyle).toBe('minimal');
    expect(f?.scoreDisplayStyle).toBe('points');
  });

  it('has mission-game family', () => {
    const f = getStyleFamily('mission-game');
    expect(f).not.toBeNull();
    expect(f?.label).toBe('Misi Game');
    expect(f?.themeId).toBe('mission-adventure');
    expect(f?.navbarStyle).toBe('colorful');
    expect(f?.scoreDisplayStyle).toBe('stars');
  });

  it('has formal-edu family', () => {
    const f = getStyleFamily('formal-edu');
    expect(f).not.toBeNull();
    expect(f?.label).toBe('Formal Edu');
    expect(f?.themeId).toBe('academic-clean');
    expect(f?.navbarStyle).toBe('dark');
    expect(f?.scoreDisplayStyle).toBe('percentage');
  });

  it('DEFAULT_STYLE_FAMILY_ID is modern-clean', () => {
    expect(DEFAULT_STYLE_FAMILY_ID).toBe('modern-clean');
  });

  it('getAllStyleFamilyIds returns 3 IDs', () => {
    const ids = getAllStyleFamilyIds();
    expect(ids).toEqual(['modern-clean', 'mission-game', 'formal-edu']);
  });

  it('each family has icon, accentColor, description', () => {
    for (const f of STYLE_FAMILIES) {
      expect(f.icon.length).toBeGreaterThan(0);
      expect(f.accentColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(f.description.length).toBeGreaterThan(10);
    }
  });
});

// ───────────────────────────────────────────────────────────────
// C. getStyleFamily — edge cases
// ───────────────────────────────────────────────────────────────

describe('BATCH-10: getStyleFamily — edge cases', () => {
  it('returns null for unknown ID', () => {
    expect(getStyleFamily('unknown')).toBeNull();
    expect(getStyleFamily('')).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(getStyleFamily(null as unknown as string)).toBeNull();
    expect(getStyleFamily(undefined as unknown as string)).toBeNull();
    expect(getStyleFamily(123 as unknown as string)).toBeNull();
  });
});

// ───────────────────────────────────────────────────────────────
// D. detectStyleFamily — reverse mapping
// ───────────────────────────────────────────────────────────────

describe('BATCH-10: detectStyleFamily — reverse mapping', () => {
  it('detects modern-clean from themeId=modern-interactive', () => {
    const pages = [{ schema: { themeId: 'modern-interactive' } }];
    expect(detectStyleFamily(pages)).toBe('modern-clean');
  });

  it('detects mission-game from themeId=mission-adventure', () => {
    const pages = [{ schema: { themeId: 'mission-adventure' } }];
    expect(detectStyleFamily(pages)).toBe('mission-game');
  });

  it('detects formal-edu from themeId=academic-clean', () => {
    const pages = [{ schema: { themeId: 'academic-clean' } }];
    expect(detectStyleFamily(pages)).toBe('formal-edu');
  });

  it('detects from templateData.schemaThemeId when schema.themeId missing', () => {
    const pages = [{ templateData: { schemaThemeId: 'mission-adventure' } }];
    expect(detectStyleFamily(pages)).toBe('mission-game');
  });

  it('returns DEFAULT_STYLE_FAMILY_ID for unknown themeId', () => {
    const pages = [{ schema: { themeId: 'unknown-theme' } }];
    expect(detectStyleFamily(pages)).toBe(DEFAULT_STYLE_FAMILY_ID);
  });

  it('returns DEFAULT_STYLE_FAMILY_ID for empty pages', () => {
    expect(detectStyleFamily([])).toBe(DEFAULT_STYLE_FAMILY_ID);
  });

  it('returns DEFAULT_STYLE_FAMILY_ID for pages without themeId', () => {
    const pages = [{ schema: {}, templateData: {} }];
    expect(detectStyleFamily(pages)).toBe(DEFAULT_STYLE_FAMILY_ID);
  });

  it('uses first page with themeId (not later pages)', () => {
    const pages = [
      { schema: { themeId: 'modern-interactive' } },
      { schema: { themeId: 'mission-adventure' } },
    ];
    expect(detectStyleFamily(pages)).toBe('modern-clean');
  });
});

// ───────────────────────────────────────────────────────────────
// E. applyStyleFamily — style fields updated
// ───────────────────────────────────────────────────────────────

describe('BATCH-10: applyStyleFamily — style fields updated', () => {
  const samplePages = [
    {
      id: 'p1',
      templateType: 'cover',
      schema: { id: 's1', themeId: 'old-theme', blocks: [{ id: 'b1', type: 'cover', title: 'My Title' }] },
      templateData: { schemaThemeId: 'old-theme', otherField: 'keep-me' },
      navConfig: { navbarStyle: 'old-style', showNavbar: true },
    },
  ];

  it('updates schema.themeId to family themeId', () => {
    const result = applyStyleFamily(samplePages, 'mission-game');
    expect(result[0].schema.themeId).toBe('mission-adventure');
  });

  it('updates templateData.schemaThemeId', () => {
    const result = applyStyleFamily(samplePages, 'mission-game');
    expect(result[0].templateData.schemaThemeId).toBe('mission-adventure');
  });

  it('updates navConfig.navbarStyle', () => {
    const result = applyStyleFamily(samplePages, 'mission-game');
    expect(result[0].navConfig.navbarStyle).toBe('colorful');
  });

  it('updates templateData.scoreDisplayStyle', () => {
    const result = applyStyleFamily(samplePages, 'mission-game');
    expect(result[0].templateData.scoreDisplayStyle).toBe('stars');
  });

  it('updates all 3 families correctly', () => {
    for (const family of STYLE_FAMILIES) {
      const result = applyStyleFamily(samplePages, family.id);
      expect(result[0].schema.themeId).toBe(family.themeId);
      expect(result[0].templateData.schemaThemeId).toBe(family.themeId);
      expect(result[0].navConfig.navbarStyle).toBe(family.navbarStyle);
      expect(result[0].templateData.scoreDisplayStyle).toBe(family.scoreDisplayStyle);
    }
  });

  it('returns pages unchanged for unknown family ID (no-op)', () => {
    const result = applyStyleFamily(samplePages, 'unknown-family');
    expect(result).toEqual(samplePages);
  });

  it('does NOT mutate input pages (returns new array)', () => {
    const original = JSON.parse(JSON.stringify(samplePages));
    applyStyleFamily(samplePages, 'mission-game');
    expect(samplePages).toEqual(original);
  });

  it('handles multiple pages', () => {
    const multiPages = [
      { id: 'p1', schema: { themeId: 'a' }, templateData: {}, navConfig: {} },
      { id: 'p2', schema: { themeId: 'b' }, templateData: {}, navConfig: {} },
      { id: 'p3', schema: { themeId: 'c' }, templateData: {}, navConfig: {} },
    ];
    const result = applyStyleFamily(multiPages, 'formal-edu');
    expect(result.length).toBe(3);
    for (const page of result) {
      expect(page.schema.themeId).toBe('academic-clean');
      expect(page.navConfig.navbarStyle).toBe('dark');
    }
  });

  it('handles page without schema (creates it)', () => {
    const pages = [{ id: 'p1', templateData: {}, navConfig: {} }];
    const result = applyStyleFamily(pages, 'modern-clean');
    expect(result[0].schema).toBeDefined();
    expect(result[0].schema.themeId).toBe('modern-interactive');
  });

  it('handles page without templateData (creates it)', () => {
    const pages = [{ id: 'p1', schema: {}, navConfig: {} }];
    const result = applyStyleFamily(pages, 'modern-clean');
    expect(result[0].templateData).toBeDefined();
    expect(result[0].templateData.schemaThemeId).toBe('modern-interactive');
  });

  it('handles page without navConfig (creates it)', () => {
    const pages = [{ id: 'p1', schema: {}, templateData: {} }];
    const result = applyStyleFamily(pages, 'modern-clean');
    expect(result[0].navConfig).toBeDefined();
    expect(result[0].navConfig.navbarStyle).toBe('minimal');
  });

  it('handles empty pages array (returns empty)', () => {
    const result = applyStyleFamily([], 'modern-clean');
    expect(result).toEqual([]);
  });
});

// ───────────────────────────────────────────────────────────────
// F. applyStyleFamily — content preservation (CRITICAL)
// ───────────────────────────────────────────────────────────────

describe('BATCH-10: applyStyleFamily — content preservation (CRITICAL)', () => {
  const richPages = [
    {
      id: 'p1',
      label: 'Cover',
      templateType: 'cover',
      schema: {
        id: 's1',
        themeId: 'old-theme',
        blocks: [
          {
            id: 'b1',
            type: 'cover',
            title: 'My Cover Title',
            subtitle: 'My Subtitle',
            icon: '📚',
            badges: [{ id: 'bg1', label: 'Guru', icon: '👨‍🏫' }],
            cta: { label: 'Mulai', action: 'next' },
          },
        ],
      },
      templateData: { schemaThemeId: 'old-theme', customField: 'keep' },
      navConfig: { navbarStyle: 'old', showNavbar: true, showProgress: true },
    },
    {
      id: 'p2',
      label: 'Kuis',
      templateType: 'kuis',
      schema: {
        id: 's2',
        themeId: 'old-theme',
        blocks: [
          {
            id: 'b2',
            type: 'kuis',
            title: 'Kuis Title',
            questions: [
              {
                q: 'What is the answer?',
                opts: ['A', 'B', 'C', 'D'],
                ans: 2,
                ex: 'Explanation here',
              },
            ],
          },
        ],
      },
      templateData: { schemaThemeId: 'old-theme' },
      navConfig: { navbarStyle: 'old' },
    },
  ];

  it('does NOT change block.title', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[0].schema.blocks[0].title).toBe('My Cover Title');
    expect(result[1].schema.blocks[0].title).toBe('Kuis Title');
  });

  it('does NOT change block.subtitle', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[0].schema.blocks[0].subtitle).toBe('My Subtitle');
  });

  it('does NOT change block.icon', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[0].schema.blocks[0].icon).toBe('📚');
  });

  it('does NOT change block.badges', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[0].schema.blocks[0].badges).toEqual([{ id: 'bg1', label: 'Guru', icon: '👨‍🏫' }]);
  });

  it('does NOT change block.cta', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[0].schema.blocks[0].cta).toEqual({ label: 'Mulai', action: 'next' });
  });

  it('does NOT change kuis questions', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[1].schema.blocks[0].questions).toEqual([
      { q: 'What is the answer?', opts: ['A', 'B', 'C', 'D'], ans: 2, ex: 'Explanation here' },
    ]);
  });

  it('does NOT change kuis answer key (ans)', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[1].schema.blocks[0].questions[0].ans).toBe(2);
  });

  it('does NOT change kuis explanation (ex)', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[1].schema.blocks[0].questions[0].ex).toBe('Explanation here');
  });

  it('does NOT change page.id', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[0].id).toBe('p1');
    expect(result[1].id).toBe('p2');
  });

  it('does NOT change page.label', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[0].label).toBe('Cover');
    expect(result[1].label).toBe('Kuis');
  });

  it('does NOT change page.templateType', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[0].templateType).toBe('cover');
    expect(result[1].templateType).toBe('kuis');
  });

  it('does NOT change page order', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[0].id).toBe('p1');
    expect(result[1].id).toBe('p2');
  });

  it('does NOT change block.id', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[0].schema.blocks[0].id).toBe('b1');
    expect(result[1].schema.blocks[0].id).toBe('b2');
  });

  it('does NOT change block.type', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[0].schema.blocks[0].type).toBe('cover');
    expect(result[1].schema.blocks[0].type).toBe('kuis');
  });

  it('preserves custom templateData fields (not style-related)', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[0].templateData.customField).toBe('keep');
  });

  it('preserves navConfig fields other than navbarStyle', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[0].navConfig.showNavbar).toBe(true);
    expect(result[0].navConfig.showProgress).toBe(true);
  });

  it('preserves schema.blocks array length', () => {
    const result = applyStyleFamily(richPages, 'mission-game');
    expect(result[0].schema.blocks.length).toBe(1);
    expect(result[1].schema.blocks.length).toBe(1);
  });

  it('content preserved for ALL 3 families', () => {
    for (const family of STYLE_FAMILIES) {
      const result = applyStyleFamily(richPages, family.id);
      expect(result[0].schema.blocks[0].title).toBe('My Cover Title');
      expect(result[1].schema.blocks[0].questions[0].ans).toBe(2);
    }
  });
});

// ───────────────────────────────────────────────────────────────
// G. verifyContentPreserved — helper function
// ───────────────────────────────────────────────────────────────

describe('BATCH-10: verifyContentPreserved — helper', () => {
  it('returns true when applyStyleFamily is used (real scenario)', () => {
    const original = [
      {
        id: 'p1',
        schema: { themeId: 'old', blocks: [{ id: 'b1', type: 'cover', title: 'Keep' }] },
        templateData: { schemaThemeId: 'old' },
        navConfig: { navbarStyle: 'old' },
      },
    ];
    const styled = applyStyleFamily(original, 'mission-game');
    expect(verifyContentPreserved(original, styled)).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────
// G2. verifyContentPreserved — DEEP RECURSIVE (RC-FIXPACK-01)
// ───────────────────────────────────────────────────────────────

describe('BATCH-10 RC-FIXPACK-01: verifyContentPreserved — deep recursive', () => {
  it('detects content change in deeply nested array element (questions[0].q)', () => {
    const original = [{
      id: 'p1',
      schema: {
        themeId: 'old',
        blocks: [{
          id: 'b1',
          type: 'kuis',
          questions: [{ q: 'original question', opts: ['A', 'B', 'C', 'D'], ans: 0, ex: 'expl' }],
        }],
      },
      templateData: {},
      navConfig: {},
    }];
    const styled = [{
      id: 'p1',
      schema: {
        themeId: 'new', // style field — OK to change
        blocks: [{
          id: 'b1',
          type: 'kuis',
          questions: [{ q: 'CHANGED question', opts: ['A', 'B', 'C', 'D'], ans: 0, ex: 'expl' }],
        }],
      },
      templateData: {},
      navConfig: {},
    }];
    expect(verifyContentPreserved(original, styled)).toBe(false);
  });

  it('detects content change in nested array element (opts[2])', () => {
    const original = [{
      id: 'p1',
      schema: {
        themeId: 'old',
        blocks: [{
          id: 'b1',
          type: 'kuis',
          questions: [{ q: 'q', opts: ['A', 'B', 'C', 'D'], ans: 0, ex: 'expl' }],
        }],
      },
      templateData: {},
      navConfig: {},
    }];
    const styled = [{
      id: 'p1',
      schema: {
        themeId: 'new',
        blocks: [{
          id: 'b1',
          type: 'kuis',
          questions: [{ q: 'q', opts: ['A', 'B', 'CHANGED', 'D'], ans: 0, ex: 'expl' }],
        }],
      },
      templateData: {},
      navConfig: {},
    }];
    expect(verifyContentPreserved(original, styled)).toBe(false);
  });

  it('detects content change in nested answer key (ans)', () => {
    const original = [{
      schema: {
        themeId: 'old',
        blocks: [{
          type: 'kuis',
          questions: [{ q: 'q', opts: ['A', 'B', 'C', 'D'], ans: 0, ex: 'expl' }],
        }],
      },
    }];
    const styled = [{
      schema: {
        themeId: 'new',
        blocks: [{
          type: 'kuis',
          questions: [{ q: 'q', opts: ['A', 'B', 'C', 'D'], ans: 3, ex: 'expl' }], // ans changed 0→3
        }],
      },
    }];
    expect(verifyContentPreserved(original, styled)).toBe(false);
  });

  it('detects content change in block.title (nested in schema.blocks[0])', () => {
    const original = [{
      schema: {
        themeId: 'old',
        blocks: [{ id: 'b1', type: 'cover', title: 'Original Title' }],
      },
    }];
    const styled = [{
      schema: {
        themeId: 'new',
        blocks: [{ id: 'b1', type: 'cover', title: 'Changed Title' }],
      },
    }];
    expect(verifyContentPreserved(original, styled)).toBe(false);
  });

  it('detects content change in sortir-game pool item text', () => {
    const original = [{
      schema: {
        themeId: 'old',
        blocks: [{
          type: 'sortir-game',
          pool: [
            { id: 'i1', text: 'Original', category: 'c1' },
            { id: 'i2', text: 'Keep', category: 'c2' },
          ],
        }],
      },
    }];
    const styled = [{
      schema: {
        themeId: 'new',
        blocks: [{
          type: 'sortir-game',
          pool: [
            { id: 'i1', text: 'CHANGED', category: 'c1' },
            { id: 'i2', text: 'Keep', category: 'c2' },
          ],
        }],
      },
    }];
    expect(verifyContentPreserved(original, styled)).toBe(false);
  });

  it('detects array length change (block added)', () => {
    const original = [{
      schema: {
        themeId: 'old',
        blocks: [{ id: 'b1', type: 'cover' }],
      },
    }];
    const styled = [{
      schema: {
        themeId: 'new',
        blocks: [{ id: 'b1', type: 'cover' }, { id: 'b2', type: 'kuis' }], // added block
      },
    }];
    expect(verifyContentPreserved(original, styled)).toBe(false);
  });

  it('detects array length change (question removed)', () => {
    const original = [{
      schema: {
        themeId: 'old',
        blocks: [{
          type: 'kuis',
          questions: [
            { q: 'q1', opts: [], ans: 0, ex: '' },
            { q: 'q2', opts: [], ans: 0, ex: '' },
          ],
        }],
      },
    }];
    const styled = [{
      schema: {
        themeId: 'new',
        blocks: [{
          type: 'kuis',
          questions: [
            { q: 'q1', opts: [], ans: 0, ex: '' },
            // q2 removed
          ],
        }],
      },
    }];
    expect(verifyContentPreserved(original, styled)).toBe(false);
  });

  it('returns TRUE when only style fields change at any depth', () => {
    const original = [{
      id: 'p1',
      label: 'Cover',
      schema: {
        id: 's1',
        themeId: 'old-theme',
        blocks: [{
          id: 'b1',
          type: 'cover',
          title: 'My Title',
          badges: [{ id: 'bg1', label: 'Guru', icon: '👨‍🏫' }],
        }],
      },
      templateData: { schemaThemeId: 'old-theme', customField: 'keep' },
      navConfig: { navbarStyle: 'old', showNavbar: true },
    }];
    const styled = [{
      id: 'p1',
      label: 'Cover',
      schema: {
        id: 's1',
        themeId: 'new-theme', // style field changed
        blocks: [{
          id: 'b1',
          type: 'cover',
          title: 'My Title',
          badges: [{ id: 'bg1', label: 'Guru', icon: '👨‍🏫' }],
        }],
      },
      templateData: { schemaThemeId: 'new-theme', customField: 'keep', scoreDisplayStyle: 'stars' }, // style fields changed
      navConfig: { navbarStyle: 'new', showNavbar: true }, // navbarStyle changed
    }];
    expect(verifyContentPreserved(original, styled)).toBe(true);
  });

  it('detects key added to nested object (not in original)', () => {
    const original = [{
      schema: {
        themeId: 'old',
        blocks: [{ id: 'b1', type: 'cover', title: 'T' }],
      },
    }];
    const styled = [{
      schema: {
        themeId: 'new',
        blocks: [{ id: 'b1', type: 'cover', title: 'T', newField: 'injected' }], // newField added
      },
    }];
    expect(verifyContentPreserved(original, styled)).toBe(false);
  });

  it('detects key removed from nested object', () => {
    const original = [{
      schema: {
        themeId: 'old',
        blocks: [{ id: 'b1', type: 'cover', title: 'T', subtitle: 'S' }],
      },
    }];
    const styled = [{
      schema: {
        themeId: 'new',
        blocks: [{ id: 'b1', type: 'cover', title: 'T' }], // subtitle removed
      },
    }];
    expect(verifyContentPreserved(original, styled)).toBe(false);
  });

  it('handles empty arrays correctly', () => {
    const original = [{ schema: { themeId: 'old', blocks: [] } }];
    const styled = [{ schema: { themeId: 'new', blocks: [] } }];
    expect(verifyContentPreserved(original, styled)).toBe(true);
  });

  it('handles null values correctly', () => {
    const original = [{ schema: { themeId: 'old', background: null } }];
    const styled = [{ schema: { themeId: 'new', background: null } }];
    expect(verifyContentPreserved(original, styled)).toBe(true);
  });

  it('detects null → object change', () => {
    const original = [{ schema: { themeId: 'old', background: null } }];
    const styled = [{ schema: { themeId: 'new', background: { type: 'gradient' } } }];
    expect(verifyContentPreserved(original, styled)).toBe(false);
  });

  it('handles deeply nested 4+ levels (schema.blocks[0].questions[0].opts[0])', () => {
    const original = [{
      schema: {
        themeId: 'old',
        blocks: [{
          type: 'kuis',
          questions: [{
            q: 'q',
            opts: ['A', 'B', 'C', 'D'],
            ans: 0,
            ex: 'expl',
          }],
        }],
      },
    }];
    // Same content, only themeId changed
    const styled = [{
      schema: {
        themeId: 'new',
        blocks: [{
          type: 'kuis',
          questions: [{
            q: 'q',
            opts: ['A', 'B', 'C', 'D'],
            ans: 0,
            ex: 'expl',
          }],
        }],
      },
    }];
    expect(verifyContentPreserved(original, styled)).toBe(true);
  });

  it('detects change at 4+ levels deep (opts[3] changed)', () => {
    const original = [{
      schema: {
        themeId: 'old',
        blocks: [{
          type: 'kuis',
          questions: [{
            q: 'q',
            opts: ['A', 'B', 'C', 'D'],
            ans: 0,
            ex: 'expl',
          }],
        }],
      },
    }];
    const styled = [{
      schema: {
        themeId: 'new',
        blocks: [{
          type: 'kuis',
          questions: [{
            q: 'q',
            opts: ['A', 'B', 'C', 'CHANGED'], // opts[3] changed
            ans: 0,
            ex: 'expl',
          }],
        }],
      },
    }];
    expect(verifyContentPreserved(original, styled)).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────
// H. PROTECTED_CONTENT_FIELDS — contract
// ───────────────────────────────────────────────────────────────

describe('BATCH-10: PROTECTED_CONTENT_FIELDS — contract', () => {
  it('includes title', () => {
    expect(PROTECTED_CONTENT_FIELDS).toContain('title');
  });

  it('includes questions (kuis content)', () => {
    expect(PROTECTED_CONTENT_FIELDS).toContain('questions');
  });

  it('includes ans (answer key)', () => {
    expect(PROTECTED_CONTENT_FIELDS).toContain('ans');
  });

  it('includes opts (kuis options)', () => {
    expect(PROTECTED_CONTENT_FIELDS).toContain('opts');
  });

  it('includes ex (explanation)', () => {
    expect(PROTECTED_CONTENT_FIELDS).toContain('ex');
  });

  it('includes pool (sortir game items)', () => {
    expect(PROTECTED_CONTENT_FIELDS).toContain('pool');
  });

  it('includes kolom (sortir game categories)', () => {
    expect(PROTECTED_CONTENT_FIELDS).toContain('kolom');
  });

  it('does NOT include style fields (themeId, navbarStyle, etc.)', () => {
    expect(PROTECTED_CONTENT_FIELDS).not.toContain('themeId');
    expect(PROTECTED_CONTENT_FIELDS).not.toContain('schemaThemeId');
    expect(PROTECTED_CONTENT_FIELDS).not.toContain('navbarStyle');
    expect(PROTECTED_CONTENT_FIELDS).not.toContain('scoreDisplayStyle');
  });

  it('__TEST__.STYLE_ONLY_FIELDS has exactly 5 style fields (BATCH-10B: +contractId)', () => {
    expect(__TEST__.STYLE_ONLY_FIELDS).toEqual([
      'themeId', 'schemaThemeId', 'navbarStyle', 'scoreDisplayStyle', 'contractId',
    ]);
  });
});

// ───────────────────────────────────────────────────────────────
// I. WorkspaceStyleMenu — source audit
// ───────────────────────────────────────────────────────────────

describe('BATCH-10: WorkspaceStyleMenu — source audit', () => {
  const src = () =>
    readSrc('components/canva/mpi-workspace-v2/WorkspaceStyleMenu.tsx');

  it('imports from style-family-engine', () => {
    const s = src();
    expect(s).toContain("from '@/lib/style-family-engine'");
    expect(s).toContain('STYLE_FAMILIES');
    expect(s).toContain('applyStyleFamily');
    expect(s).toContain('detectStyleFamily');
  });

  it('uses applyStyleFamily (not old applyStyleGlobal in code)', () => {
    const s = src()
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(s).toContain('applyStyleFamily(');
    expect(s).not.toContain('applyStyleGlobal');
  });

  it('uses detectStyleFamily to determine current family', () => {
    expect(src()).toContain('detectStyleFamily(pages)');
  });

  it('renders style family buttons via STYLE_FAMILIES.map', () => {
    const s = src();
    // Source uses data-testid={`style-family-btn-${family.id}`} template
    expect(s).toContain('data-testid={`style-family-btn-${family.id}`}');
    // Menu iterates all families dynamically
    expect(s).toContain('STYLE_FAMILIES.map');
  });

  it('has data-testid on trigger button', () => {
    expect(src()).toContain('data-testid="workspace-style-menu-btn"');
  });

  it('calls _pushHistory before style change (undo support)', () => {
    expect(src()).toContain('state._pushHistory()');
  });

  it('uses useCanvaStore.setState (single write path)', () => {
    // RC-FIXPACK-01: Source now has `as unknown as typeof state.pages` cast
    // for TypeScript safety. The contract is: setState is called with pages.
    expect(src()).toContain('useCanvaStore.setState({ pages:');
  });

  it('does NOT import getAllStylePresets (old system removed)', () => {
    expect(src()).not.toContain('getAllStylePresets');
  });

  it('does NOT import StylePresetDefinition (old type removed)', () => {
    expect(src()).not.toContain('StylePresetDefinition');
  });
});
