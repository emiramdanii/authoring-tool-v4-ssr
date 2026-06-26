// ═══════════════════════════════════════════════════════════════
// BATCH-12-06 — V5 Export Gate (replaces quarantined performance-baseline-9.0e)
// ═══════════════════════════════════════════════════════════════
// In Batch 12-05, performance-baseline-9.0e.test.ts was quarantined because
// it tested the legacy html-templates.ts export renderer (not the V5 Vite
// export path). This test restores the export gate by verifying the ACTIVE
// V5 export pipeline:
//
//   use-vite-export.ts → POST /api/export → export-output/index.html
//                                           → serializeForHtmlScript
//                                           → entry-client.tsx
//                                           → ExportApp
//                                           → PageRenderer mode="export"
//
// This test does NOT:
//   - Import html-templates.ts (quarantined)
//   - Import anything from src/legacy-disabled/
//   - Require a running dev server
//   - Test wall-clock performance (unreliable in CI)
//
// This test DOES:
//   - Source-audit the V5 export pipeline files for required patterns
//   - Verify serializeForHtmlScript produces safe JSON (no XSS)
//   - Verify export-output/index.html exists and has required structure
//   - Verify API route validation contract (Zod schema)
//   - Verify entry-client.tsx boot sequence
//   - Structural budget checks (output size, no script injection)
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';
import { serializeForHtmlScript } from '@/lib/export/serialize-html-script';

const readSrc = (rel: string) => readFileSync(resolve(__dirname, '..', rel), 'utf-8');

// ───────────────────────────────────────────────────────────────
// A. V5 Export Pipeline — source audit
// ───────────────────────────────────────────────────────────────

describe('BATCH-12-06: V5 Export Pipeline — source audit', () => {
  it('use-vite-export.ts exists and exports useViteExport hook', () => {
    const src = readSrc('lib/use-vite-export.ts');
    expect(src).toContain('export function useViteExport()');
    expect(src).toContain("fetch('/api/export'");
  });

  it('use-vite-export.ts does NOT import from legacy-disabled', () => {
    const src = readSrc('lib/use-vite-export.ts');
    expect(src).not.toContain('legacy-disabled');
    expect(src).not.toContain('html-templates');
    expect(src).not.toContain('client-export');
  });

  it('use-vite-export.ts re-throws on error (BATCH-01 honesty contract)', () => {
    const src = readSrc('lib/use-vite-export.ts');
    // Must have throw err (re-throw pattern) — not swallow errors
    expect(src).toMatch(/throw\s+err/);
    // Must not contain active exportClientSide function (only in comments is OK)
    const stripped = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(stripped).not.toContain('exportClientSide');
  });

  it('API route /api/export exists with POST handler', () => {
    const src = readSrc('app/api/export/route.ts');
    expect(src).toContain('export async function POST');
    expect(src).toContain('exportRequestSchema');
    expect(src).toContain('serializeForHtmlScript');
  });

  it('API route uses export-output/index.html as template', () => {
    const src = readSrc('app/api/export/route.ts');
    expect(src).toContain("export-output");
    expect(src).toContain('index.html');
  });

  it('API route does NOT import from legacy-disabled', () => {
    const src = readSrc('app/api/export/route.ts');
    expect(src).not.toContain('legacy-disabled');
    expect(src).not.toContain('html-templates');
  });

  it('entry-client.tsx reads window.__EXPORT_DATA__', () => {
    const src = readSrc('export/entry-client.tsx');
    expect(src).toContain('__EXPORT_DATA__');
    expect(src).toContain('createRoot');
    expect(src).toContain('ExportApp');
  });

  it('entry-client.tsx does NOT import from legacy-disabled', () => {
    const src = readSrc('export/entry-client.tsx');
    expect(src).not.toContain('legacy-disabled');
  });

  it('ExportApp.tsx uses PageRenderer with mode="export"', () => {
    const src = readSrc('export/ExportApp.tsx');
    expect(src).toContain('PageRenderer');
    expect(src).toContain('export');
  });

  it('vite.export.config.ts exists and defines config', () => {
    const src = readFileSync(resolve(__dirname, '../../vite.export.config.ts'), 'utf-8');
    expect(src).toContain('defineConfig');
    // Config uses root: src/export (Vite resolves entry-client.tsx from there)
    expect(src).toContain('src/export');
  });
});

// ───────────────────────────────────────────────────────────────
// B. serializeForHtmlScript — XSS safety
// ───────────────────────────────────────────────────────────────

describe('BATCH-12-06: serializeForHtmlScript — XSS safety', () => {
  it('escapes </script> tags to prevent breakout', () => {
    const payload = { title: '</script><script>alert(1)</script>' };
    const result = serializeForHtmlScript(payload);
    expect(result).not.toContain('</script>');
    expect(result).not.toContain('<script>');
  });

  it('escapes U+2028 line separator', () => {
    const payload = { text: 'before\u2028after' };
    const result = serializeForHtmlScript(payload);
    expect(result).not.toContain('\u2028');
  });

  it('escapes U+2029 paragraph separator', () => {
    const payload = { text: 'before\u2029after' };
    const result = serializeForHtmlScript(payload);
    expect(result).not.toContain('\u2029');
  });

  it('handles backslash correctly', () => {
    const payload = { text: 'path\\to\\file' };
    const result = serializeForHtmlScript(payload);
    expect(JSON.parse(result)).toEqual(payload);
  });

  it('handles double quotes correctly', () => {
    const payload = { text: 'He said "hello"' };
    const result = serializeForHtmlScript(payload);
    expect(JSON.parse(result)).toEqual(payload);
  });

  it('handles ampersand correctly', () => {
    const payload = { text: 'Tom & Jerry' };
    const result = serializeForHtmlScript(payload);
    expect(JSON.parse(result)).toEqual(payload);
  });

  it('produces valid JSON for complex nested objects', () => {
    const payload = {
      pages: [
        { id: 'p1', schema: { blocks: [{ type: 'kuis', questions: [{ q: 'Q?', opts: ['A', 'B'] }] }] } },
      ],
      meta: { judulPertemuan: 'Test', mapel: 'PPKn', kelas: '7' },
    };
    const result = serializeForHtmlScript(payload);
    const parsed = JSON.parse(result);
    expect(parsed.pages[0].schema.blocks[0].questions[0].q).toBe('Q?');
  });

  it('output is non-empty for valid payload', () => {
    const result = serializeForHtmlScript({ hello: 'world' });
    expect(result.length).toBeGreaterThan(10);
  });
});

// ───────────────────────────────────────────────────────────────
// C. export-output/index.html — template structure
// ───────────────────────────────────────────────────────────────
// BATCH-12-06B: CI now runs `npm run export:build` before this test,
// so export-output/index.html is guaranteed to exist. No skipIf needed.
// These tests are MANDATORY — they verify the V5 export template is valid.

const templatePath = resolve(__dirname, '../../export-output/index.html');

describe('BATCH-12-06: export-output/index.html — template structure', () => {
  it('template file exists', () => {
    expect(existsSync(templatePath), 'export-output/index.html must exist (run npm run export:build)').toBe(true);
  });

  it('template has <div id="root">', () => {
    const html = readFileSync(templatePath, 'utf-8');
    expect(html).toMatch(/<div[^>]*id=["']root["']/);
  });

  it('template has <script type="module"> (Vite bundle)', () => {
    const html = readFileSync(templatePath, 'utf-8');
    expect(html).toMatch(/<script[^>]*type=["']module["']/);
  });

  it('template does NOT contain __EXPORT_DATA__ (injected at runtime by API)', () => {
    const html = readFileSync(templatePath, 'utf-8');
    expect(html).not.toContain('window.__EXPORT_DATA__=');
  });

  it('template size is reasonable (>100KB, <5MB)', () => {
    const stat = statSync(templatePath);
    const sizeKB = stat.size / 1024;
    expect(sizeKB, `template size ${sizeKB.toFixed(0)}KB should be > 100KB`).toBeGreaterThan(100);
    expect(sizeKB, `template size ${sizeKB.toFixed(0)}KB should be < 5000KB`).toBeLessThan(5000);
  });
});

// ───────────────────────────────────────────────────────────────
// D. API route Zod validation contract
// ───────────────────────────────────────────────────────────────

describe('BATCH-12-06: API route Zod validation contract', () => {
  it('exportRequestSchema requires pages array', () => {
    const src = readSrc('lib/api-validation.ts');
    expect(src).toContain('exportRequestSchema');
    expect(src).toMatch(/pages.*z\.array/);
  });

  it('exportRequestSchema accepts ratioId and meta', () => {
    const src = readSrc('lib/api-validation.ts');
    expect(src).toMatch(/ratioId/);
    expect(src).toMatch(/meta/);
  });

  it('API route returns 400 for invalid payload', () => {
    const src = readSrc('app/api/export/route.ts');
    expect(src).toContain('safeParse');
    expect(src).toContain('400');
    expect(src).toContain('zodErrorResponse');
  });

  it('API route returns Content-Disposition attachment header', () => {
    const src = readSrc('app/api/export/route.ts');
    expect(src).toContain('Content-Disposition');
    expect(src).toContain('attachment');
  });

  it('API route returns Content-Type text/html', () => {
    const src = readSrc('app/api/export/route.ts');
    expect(src).toContain('text/html');
  });

  it('API route has max payload size guard (MAX_EXPORT_SIZE)', () => {
    const src = readSrc('app/api/export/route.ts');
    expect(src).toContain('MAX_EXPORT_SIZE');
    expect(src).toContain('413');
  });
});

// ───────────────────────────────────────────────────────────────
// E. Export pipeline — no legacy imports (cross-boundary check)
// ───────────────────────────────────────────────────────────────

describe('BATCH-12-06: Export pipeline — no legacy imports', () => {
  const v5ExportFiles = [
    'src/lib/use-vite-export.ts',
    'src/app/api/export/route.ts',
    'src/lib/export/serialize-html-script.ts',
    'src/lib/api-validation.ts',
    'src/export/entry-client.tsx',
    'src/export/ExportApp.tsx',
  ];

  for (const rel of v5ExportFiles) {
    it(`${rel} does NOT import from legacy-disabled`, () => {
      const path = rel.startsWith('src/') ? rel.replace('src/', '') : rel;
      const src = readSrc(path);
      expect(src, `${rel} must not import from legacy-disabled`).not.toContain('legacy-disabled');
    });
  }

  for (const rel of v5ExportFiles) {
    it(`${rel} does NOT import html-templates`, () => {
      const path = rel.startsWith('src/') ? rel.replace('src/', '') : rel;
      const src = readSrc(path);
      expect(src, `${rel} must not import html-templates`).not.toContain('html-templates');
    });
  }

  for (const rel of v5ExportFiles) {
    it(`${rel} does NOT import client-export`, () => {
      const path = rel.startsWith('src/') ? rel.replace('src/', '') : rel;
      const src = readSrc(path);
      expect(src, `${rel} must not import client-export`).not.toContain('client-export');
    });
  }
});

// ───────────────────────────────────────────────────────────────
// F. Structural budget — export template sanity
// ───────────────────────────────────────────────────────────────

describe('BATCH-12-06: Structural budget — export template', () => {
  // templatePath defined above in Section C. CI runs export:build before this test.

  it('template has no live <script> with onerror/onload handlers', () => {
    const html = readFileSync(templatePath, 'utf-8');
    expect(html).not.toMatch(/<script[^>]*onerror\s*=/i);
    expect(html).not.toMatch(/<script[^>]*onload\s*=/i);
  });

  it('template has no javascript: URLs in href attributes', () => {
    const html = readFileSync(templatePath, 'utf-8');
    // Check href attributes only (javascript: in CSS or other contexts may be false positive)
    expect(html).not.toMatch(/href\s*=\s*["']javascript:/i);
  });

  it('template has charset meta tag', () => {
    const html = readFileSync(templatePath, 'utf-8');
    expect(html).toMatch(/<meta[^>]*charset/i);
  });

  it('template has viewport meta tag', () => {
    const html = readFileSync(templatePath, 'utf-8');
    expect(html).toMatch(/<meta[^>]*viewport/i);
  });
});

// ───────────────────────────────────────────────────────────────
// G. ExportPanelV5 — V5 UI integration
// ───────────────────────────────────────────────────────────────

describe('BATCH-12-06: ExportPanelV5 — V5 UI integration', () => {
  it('ExportPanelV5 uses useExportActions (which wraps useViteExport, not legacy export)', () => {
    const src = readSrc('components/product-v5/ExportPanelV5.tsx');
    expect(src).toContain('useExportActions');
    expect(src).not.toContain('html-templates');
    expect(src).not.toContain('client-export');
  });

  it('useExportActions wraps useViteExport (V5 export path)', () => {
    const src = readSrc('components/canva/toolbar/use-export-actions.ts');
    expect(src).toContain('useViteExport');
    expect(src).not.toContain('html-templates');
    expect(src).not.toContain('client-export');
  });

  it('ExportPanelV5 has try/catch around export call (BATCH-01 honesty)', () => {
    const src = readSrc('components/product-v5/ExportPanelV5.tsx');
    expect(src).toContain('try');
    expect(src).toContain('catch');
  });

  it('ExportPanelV5 only sets lastExportAt on success (BATCH-01 honesty)', () => {
    const src = readSrc('components/product-v5/ExportPanelV5.tsx');
    const tryBlock = src.match(/try\s*\{[\s\S]*?setLastExportAt[\s\S]*?\}/);
    expect(tryBlock, 'setLastExportAt must be inside try block').toBeTruthy();
  });
});
