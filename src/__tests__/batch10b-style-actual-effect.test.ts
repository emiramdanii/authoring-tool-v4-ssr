// ═══════════════════════════════════════════════════════════════
// BATCH-10B — STYLE-FAMILY-ACTUAL-EFFECT-PROOF-01
// ═══════════════════════════════════════════════════════════════
// Proves that style family swap ACTUALLY changes visible style,
// including when contractId is set (the P1 bug: contractId was
// silently overriding style family themeId).
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  applyStyleFamily,
  verifyContentPreserved,
  STYLE_FAMILIES,
} from '@/lib/style-family-engine';

const readSrc = (rel: string) =>
  readFileSync(resolve(__dirname, '..', rel), 'utf-8');

// ───────────────────────────────────────────────────────────────
// A. applyStyleFamily clears contractId (P1 FIX)
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10B: applyStyleFamily clears contractId (P1 fix)', () => {
  const pagesWithContract = [
    {
      id: 'p1',
      contractId: 'golden-pertemuan',
      schema: { themeId: 'golden-presentation', blocks: [{ id: 'b1', type: 'cover', title: 'Keep' }] },
      templateData: { schemaThemeId: 'golden-presentation' },
      navConfig: { navbarStyle: 'colorful' },
    },
  ];

  it('clears contractId when applying style family', () => {
    const result = applyStyleFamily(pagesWithContract, 'mission-game');
    expect(result[0].contractId).toBeUndefined();
  });

  it('clears contractId for ALL 3 style families', () => {
    for (const family of STYLE_FAMILIES) {
      const result = applyStyleFamily(pagesWithContract, family.id);
      expect(result[0].contractId, `contractId should be cleared for ${family.id}`).toBeUndefined();
    }
  });

  it('does NOT clear contractId for unknown family (no-op)', () => {
    const result = applyStyleFamily(pagesWithContract, 'unknown-family');
    // Unknown family = no-op, contractId stays
    expect(result[0].contractId).toBe('golden-pertemuan');
  });
});

// ───────────────────────────────────────────────────────────────
// B. Style family changes visible tokens (themeId, navbarStyle)
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10B: style family changes visible tokens', () => {
  const pages = [
    {
      id: 'p1',
      contractId: 'golden-pertemuan',
      schema: { themeId: 'old-theme', blocks: [{ id: 'b1', type: 'cover', title: 'Keep' }] },
      templateData: { schemaThemeId: 'old-theme' },
      navConfig: { navbarStyle: 'old' },
    },
  ];

  it('mission-game changes themeId to mission-adventure', () => {
    const result = applyStyleFamily(pages, 'mission-game');
    expect(result[0].schema.themeId).toBe('mission-adventure');
  });

  it('mission-game changes navbarStyle to colorful', () => {
    const result = applyStyleFamily(pages, 'mission-game');
    expect(result[0].navConfig.navbarStyle).toBe('colorful');
  });

  it('formal-edu changes themeId to academic-clean', () => {
    const result = applyStyleFamily(pages, 'formal-edu');
    expect(result[0].schema.themeId).toBe('academic-clean');
  });

  it('formal-edu changes navbarStyle to dark', () => {
    const result = applyStyleFamily(pages, 'formal-edu');
    expect(result[0].navConfig.navbarStyle).toBe('dark');
  });

  it('modern-clean changes themeId to modern-interactive', () => {
    const result = applyStyleFamily(pages, 'modern-clean');
    expect(result[0].schema.themeId).toBe('modern-interactive');
  });

  it('modern-clean changes navbarStyle to minimal', () => {
    const result = applyStyleFamily(pages, 'modern-clean');
    expect(result[0].navConfig.navbarStyle).toBe('minimal');
  });
});

// ───────────────────────────────────────────────────────────────
// C. Content preserved (including with contractId clearing)
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10B: content preserved with contractId clearing', () => {
  const richPages = [
    {
      id: 'p1',
      label: 'Cover',
      contractId: 'golden-pertemuan',
      templateType: 'cover',
      schema: {
        id: 's1',
        themeId: 'old-theme',
        blocks: [{
          id: 'b1',
          type: 'kuis',
          title: 'My Quiz',
          questions: [{ q: 'Q?', opts: ['A', 'B', 'C', 'D'], ans: 0, ex: 'Ex' }],
        }],
      },
      templateData: { schemaThemeId: 'old-theme', customField: 'keep' },
      navConfig: { navbarStyle: 'old', showNavbar: true },
    },
  ];

  it('content preserved when style family applied (with contractId clearing)', () => {
    const styled = applyStyleFamily(richPages, 'mission-game');
    expect(verifyContentPreserved(richPages, styled)).toBe(true);
  });

  it('title preserved', () => {
    const styled = applyStyleFamily(richPages, 'mission-game');
    expect(styled[0].schema.blocks[0].title).toBe('My Quiz');
  });

  it('questions preserved', () => {
    const styled = applyStyleFamily(richPages, 'mission-game');
    expect(styled[0].schema.blocks[0].questions[0].q).toBe('Q?');
    expect(styled[0].schema.blocks[0].questions[0].ans).toBe(0);
  });

  it('custom templateData preserved', () => {
    const styled = applyStyleFamily(richPages, 'mission-game');
    expect(styled[0].templateData.customField).toBe('keep');
  });

  it('page label + templateType preserved', () => {
    const styled = applyStyleFamily(richPages, 'mission-game');
    expect(styled[0].label).toBe('Cover');
    expect(styled[0].templateType).toBe('cover');
  });
});

// ───────────────────────────────────────────────────────────────
// D. Custom page without schema — doesn't break
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10B: custom page without schema — safe', () => {
  it('handles page without schema field', () => {
    const pages = [{ id: 'p1', templateData: {}, navConfig: {} }];
    const result = applyStyleFamily(pages, 'modern-clean');
    expect(result[0].schema).toBeDefined();
    expect(result[0].schema.themeId).toBe('modern-interactive');
  });

  it('handles page without templateData field', () => {
    const pages = [{ id: 'p1', schema: {}, navConfig: {} }];
    const result = applyStyleFamily(pages, 'modern-clean');
    expect(result[0].templateData).toBeDefined();
    expect(result[0].templateData.schemaThemeId).toBe('modern-interactive');
  });

  it('handles page without navConfig field', () => {
    const pages = [{ id: 'p1', schema: {}, templateData: {} }];
    const result = applyStyleFamily(pages, 'modern-clean');
    expect(result[0].navConfig).toBeDefined();
    expect(result[0].navConfig.navbarStyle).toBe('minimal');
  });

  it('handles page with contractId but no schema', () => {
    const pages = [{ id: 'p1', contractId: 'golden-pertemuan', templateData: {}, navConfig: {} }];
    const result = applyStyleFamily(pages, 'modern-clean');
    expect(result[0].contractId).toBeUndefined();
    expect(result[0].schema.themeId).toBe('modern-interactive');
  });

  it('handles empty pages array', () => {
    const result = applyStyleFamily([], 'modern-clean');
    expect(result).toEqual([]);
  });
});

// ───────────────────────────────────────────────────────────────
// E. PageRenderer contractId priority — source audit
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10B: PageRenderer contractId priority (source audit)', () => {
  const src = readSrc('components/canva/page-renderer/PageRenderer.tsx');

  it('uses contractId as priority 1 when set', () => {
    expect(src).toContain('page.contractId');
    expect(src).toMatch(/cid.*contractId|contractId.*cid/);
  });

  it('resolves contract style via resolveContractStyle', () => {
    expect(src).toContain('resolveContractStyle');
  });

  it('falls back to themeId when contractId is empty/undefined', () => {
    // The code checks `if (cid)` — when cid is undefined, it skips
    // contract resolution and uses the themeId from style family.
    expect(src).toContain('if (cid)');
  });
});

// ───────────────────────────────────────────────────────────────
// F. PPKn template — contractId set but cleared by style family
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10B: PPKn template contractId cleared by style family', () => {
  const src = readSrc('presets/ppkn/norma-golden-schema.ts');

  it('PPKn template sets contractId = modern-educator (Patch-3: was golden-pertemuan)', () => {
    // Patch-3 moved default contract from golden-pertemuan (dark) to
    // modern-educator (light) to fix the "cover hitam" bug.
    expect(src).toContain("contractId = 'modern-educator'");
  });

  it('style family engine source clears contractId', () => {
    const engineSrc = readSrc('lib/style-family-engine.ts');
    expect(engineSrc).toContain('newPage.contractId = undefined');
  });

  it('STYLE_ONLY_FIELDS includes contractId', () => {
    const engineSrc = readSrc('lib/style-family-engine.ts');
    expect(engineSrc).toContain("'contractId'");
  });
});

// ───────────────────────────────────────────────────────────────
// G. Style family engine source — contractId clearing
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10B: style engine source — contractId clearing', () => {
  const src = readSrc('lib/style-family-engine.ts');

  it('has BATCH-10B comment explaining contractId clearing', () => {
    expect(src).toContain('BATCH-10B');
    expect(src).toContain('contractId');
  });

  it('sets contractId to undefined (not null, not empty string)', () => {
    expect(src).toContain('newPage.contractId = undefined');
  });

  it('contractId is in STYLE_ONLY_FIELDS_SET', () => {
    expect(src).toContain("'contractId'");
  });
});
