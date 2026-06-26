// ═══════════════════════════════════════════════════════════════
// BATCH-10C — CONTRACT-CLEANUP-DEFAULT-STYLE-01
// ═══════════════════════════════════════════════════════════════
// Proves golden-pertemuan is legacy-only and new default is light.
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createPpknNormaGoldenProject } from '@/presets/ppkn/norma-golden-schema';

const readSrc = (rel: string) =>
  readFileSync(resolve(__dirname, '..', rel), 'utf-8');

// ───────────────────────────────────────────────────────────────
// A. PPKn template — no golden-pertemuan contractId
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C: PPKn template — no golden-pertemuan', () => {
  const pages = createPpknNormaGoldenProject();

  it('no page has contractId golden-pertemuan', () => {
    for (const page of pages) {
      expect(page.contractId, `page ${page.id} should not have golden-pertemuan`).not.toBe('golden-pertemuan');
    }
  });

  it('pages have contractId modern-educator (light theme)', () => {
    for (const page of pages) {
      if (page.contractId) {
        expect(page.contractId).toBe('modern-educator');
      }
    }
  });

  it('cover page bgColor is NOT dark navy (#0f172a)', () => {
    const cover = pages.find(p => p.templateType === 'cover');
    // bgColor might be inherited from contract, but if set explicitly it should be light
    if (cover?.bgColor) {
      expect(cover.bgColor, 'cover bgColor should not be dark navy').not.toBe('#0f172a');
    }
  });
});

// ───────────────────────────────────────────────────────────────
// B. CourseTemplateRegistry — no golden-pertemuan in active templates
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C: CourseTemplateRegistry — no golden-pertemuan in active templates', () => {
  const src = readSrc('core/template/CourseTemplateRegistry.ts');

  it('does NOT have contractId: golden-pertemuan in template definitions', () => {
    // Strip comments before checking
    const stripped = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(stripped, 'active templates must not use golden-pertemuan contractId').not.toContain("contractId: 'golden-pertemuan'");
  });

  it('has contractId: modern-educator in template definitions', () => {
    expect(src).toContain("contractId: 'modern-educator'");
  });

  it('does NOT use theme: golden-presentation in template definitions', () => {
    const stripped = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(stripped).not.toContain("theme: 'golden-presentation'");
  });
});

// ───────────────────────────────────────────────────────────────
// C. Fallback defaults — not golden-pertemuan
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C: Fallback defaults — not golden-pertemuan', () => {
  it('schema-preset-slice does NOT default to golden-pertemuan', () => {
    const src = readSrc('store/canva/schema-preset-slice.ts');
    const stripped = src.replace(/\/\/.*$/gm, '');
    expect(stripped).not.toContain("'golden-pertemuan'");
  });

  it('SchemaEngine.utils does NOT default to golden-pertemuan', () => {
    const src = readSrc('core/engine/SchemaEngine.utils.ts');
    const stripped = src.replace(/\/\/.*$/gm, '');
    expect(stripped).not.toContain("'golden-pertemuan'");
  });

  it('PageSplitCompiler does NOT default to golden-pertemuan', () => {
    const src = readSrc('core/template/compiler/PageSplitCompiler.ts');
    const stripped = src.replace(/\/\/.*$/gm, '');
    expect(stripped).not.toContain("'golden-pertemuan'");
  });

  it('learning-unit does NOT default to golden-pertemuan', () => {
    const src = readSrc('core/template/learning-unit.ts');
    const stripped = src.replace(/\/\/.*$/gm, '');
    expect(stripped).not.toContain("'golden-pertemuan'");
  });
});

// ───────────────────────────────────────────────────────────────
// D. Contract default fallback — modern-educator (not golden)
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C: Contract default fallback — modern-educator', () => {
  it('getContractOrGolden falls back to MODERN_EDUCATOR_CONTRACT (not GOLDEN)', () => {
    const src = readSrc('core/template/contract/TemplateThemeContract.ts');
    expect(src).toContain('MODERN_EDUCATOR_CONTRACT');
    // Should NOT have GOLDEN_PERTEMUAN_CONTRACT as fallback
    expect(src).not.toMatch(/\|\|\s*GOLDEN_PERTEMUAN_CONTRACT/);
  });
});

// ───────────────────────────────────────────────────────────────
// E. academic-clean preset — actually light
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C: academic-clean preset — actually light', () => {
  const src = readSrc('core/style/preset-registry.ts');

  it('academic-clean has light background (not #0f172a dark navy)', () => {
    // Find the academic-clean section
    const start = src.indexOf("'academic-clean':");
    const section = src.substring(start, start + 800);
    expect(section).not.toContain("background: '#0f172a'");
  });

  it('academic-clean has light text (not #ffffff white-on-dark)', () => {
    const start = src.indexOf("'academic-clean':");
    const section = src.substring(start, start + 800);
    expect(section).not.toContain("text: '#ffffff'");
  });

  it('academic-clean background is light (#f8fafc or similar)', () => {
    const start = src.indexOf("'academic-clean':");
    const section = src.substring(start, start + 800);
    expect(section).toContain("background: '#f8fafc'");
  });

  it('academic-clean text is dark (#1e293b or similar)', () => {
    const start = src.indexOf("'academic-clean':");
    const section = src.substring(start, start + 800);
    expect(section).toContain("text: '#1e293b'");
  });
});

// ───────────────────────────────────────────────────────────────
// F. Golden-pertemuan still registered (legacy-only, not default)
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C: golden-pertemuan still registered (legacy-only)', () => {
  it('GOLDEN_PERTEMUAN_CONTRACT still exists in TemplateThemeContract', () => {
    const src = readSrc('core/template/contract/TemplateThemeContract.ts');
    expect(src).toContain('GOLDEN_PERTEMUAN_CONTRACT');
    expect(src).toContain("id: 'golden-pertemuan'");
  });

  it('golden-pertemuan is still registered via registerContract', () => {
    const src = readSrc('core/template/contract/TemplateThemeContract.ts');
    expect(src).toContain('registerContract(GOLDEN_PERTEMUAN_CONTRACT)');
  });

  it('MODERN_EDUCATOR_CONTRACT is registered (Patch-3: moved from MEC.ts to TTC.ts)', () => {
    // Patch-3 moved MODERN_EDUCATOR_CONTRACT definition + registration
    // from ModernEducatorContract.ts (MEC) into TemplateThemeContract.ts (TTC)
    // to eliminate the circular import risk. MEC.ts is now a re-export only.
    // Registration must therefore be found in TTC.ts, not MEC.ts.
    const ttcSrc = readSrc('core/template/contract/TemplateThemeContract.ts');
    expect(ttcSrc).toContain('registerContract(MODERN_EDUCATOR_CONTRACT)');
  });
});
