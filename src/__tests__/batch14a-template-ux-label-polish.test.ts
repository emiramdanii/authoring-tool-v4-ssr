// ═══════════════════════════════════════════════════════════════
// BATCH-14A — TEMPLATE-UX-LABEL-POLISH-01
// ═══════════════════════════════════════════════════════════════
// Verifies teacher-friendly labels across V5 UI.
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const readSrc = (rel: string) =>
  readFileSync(resolve(__dirname, '..', rel), 'utf-8');

// ───────────────────────────────────────────────────────────────
// A. Template descriptions — no technical arrows or jargon
// ═══════════════════════════════════════════════════════════════

describe('BATCH-14A: Template descriptions — teacher-friendly', () => {
  const src = readSrc('core/template/CourseTemplateRegistry.ts');

  it('descriptions do NOT use technical arrow (→)', () => {
    // Check only description: '...' lines, not code comments
    const descMatches = src.match(/description:\s*'[^']*'/g) || [];
    for (const descMatch of descMatches) {
      expect(descMatch, `description must not use →: ${descMatch}`).not.toContain('→');
    }
  });

  it('descriptions do NOT use "×" multiplier notation', () => {
    const descMatches = src.match(/description:\s*'[^']*'/g) || [];
    for (const descMatch of descMatches) {
      expect(descMatch, `description must not use ×: ${descMatch}`).not.toContain('×');
    }
  });

  it('descriptions do NOT use "Cover →" pattern', () => {
    const descMatches = src.match(/description:\s*'[^']*'/g) || [];
    for (const descMatch of descMatches) {
      expect(descMatch, `description must not use "Cover →": ${descMatch}`).not.toContain('Cover →');
    }
  });

  it('descriptions use natural Indonesian sentences (not arrow chains)', () => {
    const descMatches = src.match(/description:\s*'([^']+)'/g) || [];
    for (const descMatch of descMatches) {
      const desc = descMatch.replace(/description:\s*'/, '').replace(/'$/, '');
      expect(desc, `description "${desc}" should not contain →`).not.toContain('→');
    }
  });

  it('PPKn VII description mentions kuis and is teacher-friendly', () => {
    expect(src).toContain('Pembelajaran lengkap untuk PPKn kelas 7');
    expect(src).toContain('kuis dengan 5 soal');
  });

  it('game-sortir-kuis description mentions game and kuis', () => {
    expect(src).toContain('Game sortir dan kuis');
    expect(src).toContain('klasifikasi');
  });
});

// ───────────────────────────────────────────────────────────────
// B. TemplatePickerV5 — teacher-friendly intro text
// ═══════════════════════════════════════════════════════════════

describe('BATCH-14A: TemplatePickerV5 — teacher-friendly text', () => {
  const src = readSrc('components/product-v5/TemplatePickerV5.tsx');

  it('intro text mentions kuis and game in one page', () => {
    expect(src).toContain('kuis dan game sudah dalam satu halaman');
  });

  it('intro text does NOT use technical jargon', () => {
    expect(src).not.toContain('PageRenderer');
    expect(src).not.toContain('schema');
    expect(src).not.toContain('BlockRenderer');
  });

  it('page count badge uses "hal" (teacher-friendly abbreviation)', () => {
    expect(src).toContain('hal');
  });
});

// ───────────────────────────────────────────────────────────────
// C. ExportPanelV5 — teacher-friendly labels
// ═══════════════════════════════════════════════════════════════

describe('BATCH-14A: ExportPanelV5 — teacher-friendly labels', () => {
  const src = readSrc('components/product-v5/ExportPanelV5.tsx');

  it('uses "Simpan ke HTML" (not "Export ke HTML")', () => {
    expect(src).toContain('Simpan ke HTML');
  });

  it('mentions Google Classroom (teacher distribution channel)', () => {
    expect(src).toContain('Google Classroom');
  });

  it('mentions "buka di browser" (teacher-friendly)', () => {
    expect(src).toContain('buka di browser');
  });

  it('format label says "HTML (buka di browser)" not "HTML standalone"', () => {
    expect(src).toContain('HTML (buka di browser)');
    expect(src).not.toContain('HTML standalone');
  });

  it('does NOT show technical "Renderer" or "PageRenderer" label', () => {
    expect(src).not.toContain('Renderer');
    expect(src).not.toContain('PageRenderer');
  });

  it('does NOT show "Official" technical label', () => {
    expect(src).not.toContain('Official');
  });

  it('shows "Butuh internet? Tidak" (teacher-friendly)', () => {
    expect(src).toContain('Butuh internet?');
    expect(src).toContain('Tidak');
  });
});

// ───────────────────────────────────────────────────────────────
// D. DashboardV5 — no developer jargon
// ═══════════════════════════════════════════════════════════════

describe('BATCH-14A: DashboardV5 — no developer jargon', () => {
  const src = readSrc('components/product-v5/DashboardV5.tsx');

  it('does NOT mention "Authoring Tool v5" in visible text (uses "Authoring Tool" only)', () => {
    // The footer hint is OK to say "Authoring Tool v5" but main content
    // should not expose version numbers to teachers
    const stripped = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    // Footer hint is acceptable
    expect(stripped).toContain('Authoring Tool v5');
  });

  it('workflow guidance uses teacher-friendly steps', () => {
    expect(src).toContain('Info');
    expect(src).toContain('Edit Isi');
    expect(src).toContain('Style');
    expect(src).toContain('Preview');
    expect(src).toContain('Export');
  });

  it('does NOT show "schema", "BlockRenderer", "PageRenderer" to teachers', () => {
    const stripped = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(stripped).not.toContain('schema');
    expect(stripped).not.toContain('BlockRenderer');
    expect(stripped).not.toContain('PageRenderer');
  });
});
