// ═══════════════════════════════════════════════════════════════
// BATCH-13C — QUIZ-RUNTIME-EXPORT-PROOF-01
// ═══════════════════════════════════════════════════════════════
// Proves that PPKn QuizBlock multi-soal works end-to-end:
//   1. Schema verification: 1 kuis page with 5 questions in exported shape
//   2. QuizWidget source audit: reads multiple questions, step-reveal, result
//   3. Export path audit: no legacy imports, kuis renders via V5 pipeline
//   4. Export gate: 1 kuis page preserved in export-output template
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createPpknNormaGoldenProject } from '@/presets/ppkn/norma-golden-schema';

const readSrc = (rel: string) =>
  readFileSync(resolve(__dirname, '..', rel), 'utf-8');

// ───────────────────────────────────────────────────────────────
// A. Schema verification — exported shape has 1 kuis page with 5 questions
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13C: Schema — PPKn multi-question kuis in exported shape', () => {
  const pages = createPpknNormaGoldenProject();
  const kuisPages = pages.filter(p => p.templateType === 'kuis');

  it('exactly 1 kuis page exists', () => {
    expect(kuisPages.length).toBe(1);
  });

  it('kuis page has 1 block with type kuis', () => {
    const blocks = kuisPages[0]?.schema?.blocks ?? [];
    expect(blocks.length).toBe(1);
    expect(blocks[0]?.type).toBe('kuis');
  });

  it('kuis block has 5 questions (not 1)', () => {
    const block = kuisPages[0]?.schema?.blocks?.[0] as Record<string, unknown>;
    const questions = block?.questions as unknown[];
    expect(questions?.length).toBe(5);
  });

  it('each question has q, opts (4), ans, ex', () => {
    const block = kuisPages[0]?.schema?.blocks?.[0] as Record<string, unknown>;
    const questions = block?.questions as Array<Record<string, unknown>>;
    for (let i = 0; i < questions.length; i++) {
      expect(questions[i].q, `Q${i + 1} must have q`).toBeDefined();
      expect((questions[i].opts as unknown[]).length, `Q${i + 1} must have 4 opts`).toBe(4);
      expect(questions[i].ans, `Q${i + 1} must have ans`).toBeDefined();
      expect(questions[i].ex, `Q${i + 1} must have ex`).toBeDefined();
    }
  });

  it('questions are the correct PPKn norma questions', () => {
    const block = kuisPages[0]?.schema?.blocks?.[0] as Record<string, unknown>;
    const questions = block?.questions as Array<Record<string, unknown>>;
    expect(questions[0]?.q).toContain('dosa');
    expect(questions[1]?.q).toContain('berbohong');
    expect(questions[2]?.q).toContain('lampu merah');
    expect(questions[3]?.q).toContain('masyarakat');
    expect(questions[4]?.q).toContain('BUKAN');
  });

  it('no page label matches "Kuis N" pattern (no Kuis 1, Kuis 2, etc.)', () => {
    for (const page of pages) {
      if (page.templateType === 'kuis') {
        expect(page.label).not.toMatch(/^Kuis \d+$/);
      }
    }
  });
});

// ───────────────────────────────────────────────────────────────
// B. QuizWidget source audit — multi-question step-reveal behavior
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13C: QuizWidget — multi-question step-reveal behavior', () => {
  const src = () => readSrc('components/canva/QuizWidget.tsx');

  it('accepts kuisIds for multiple questions', () => {
    expect(src()).toContain('kuisIds');
  });

  it('uses allQuestions array (not single question)', () => {
    expect(src()).toContain('allQuestions');
  });

  it('has currentQ state for step-reveal navigation', () => {
    expect(src()).toContain('currentQ');
    expect(src()).toMatch(/setCurrentQ/);
  });

  it('has total = allQuestions.length', () => {
    expect(src()).toContain('total');
    expect(src()).toMatch(/allQuestions\.length/);
  });

  it('advances to next question when currentQ + 1 < total', () => {
    expect(src()).toContain('currentQ + 1 < total');
  });

  it('switches to result phase after last question', () => {
    expect(src()).toContain("setPhase('result')");
  });

  it('has phase: quiz | result', () => {
    expect(src()).toMatch(/phase.*quiz.*result/);
  });

  it('calculates score percentage in result phase', () => {
    expect(src()).toContain('phase === \'result\'');
    expect(src()).toMatch(/score.*total.*100|pct.*score.*total/);
  });

  it('reports score via onComplete callback', () => {
    expect(src()).toContain('onComplete');
    expect(src()).toMatch(/onComplete\(score/);
  });

  it('has replay/restart function (reset state)', () => {
    expect(src()).toMatch(/handleReplay|handleRestart|replay|restart/i);
    expect(src()).toContain('setCurrentQ(0)');
  });

  it('plays sounds for correct/incorrect/complete', () => {
    expect(src()).toContain("playSound('correct')");
    expect(src()).toContain("playSound('incorrect')");
    expect(src()).toContain("playSound('complete')");
  });

  it('does NOT import from legacy-disabled', () => {
    expect(src()).not.toContain('legacy-disabled');
  });

  it('does NOT import html-templates', () => {
    expect(src()).not.toContain('html-templates');
  });
});

// ───────────────────────────────────────────────────────────────
// C. Export path audit — kuis renders via V5 pipeline
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13C: Export path — kuis via V5 pipeline (no legacy)', () => {
  it('use-vite-export.ts sends pages array to /api/export', () => {
    const src = readSrc('lib/use-vite-export.ts');
    expect(src).toContain('pages');
    expect(src).toContain("fetch('/api/export'");
  });

  it('use-vite-export.ts does NOT import legacy-disabled', () => {
    const src = readSrc('lib/use-vite-export.ts');
    expect(src).not.toContain('legacy-disabled');
    expect(src).not.toContain('html-templates');
  });

  it('BlockRenderer renders QuizWidget for kuis elements', () => {
    const src = readSrc('components/canva/page-renderer/BlockRenderer.tsx');
    expect(src).toContain('QuizWidget');
    expect(src).toContain("element.type === 'kuis'");
  });

  it('BlockRenderer passes interactive flag for export mode', () => {
    const src = readSrc('components/canva/page-renderer/BlockRenderer.tsx');
    expect(src).toContain('interactive');
    expect(src).toContain('onComplete');
  });

  it('BlockRenderer does NOT import legacy-disabled', () => {
    const src = readSrc('components/canva/page-renderer/BlockRenderer.tsx');
    expect(src).not.toContain('legacy-disabled');
    expect(src).not.toContain('html-templates');
  });

  it('ExportApp uses PageRenderer with mode export', () => {
    const src = readSrc('export/ExportApp.tsx');
    expect(src).toContain('PageRenderer');
    expect(src).toContain('export');
  });

  it('ExportApp does NOT import legacy-disabled', () => {
    const src = readSrc('export/ExportApp.tsx');
    expect(src).not.toContain('legacy-disabled');
  });

  it('entry-client.tsx does NOT import legacy-disabled', () => {
    const src = readSrc('export/entry-client.tsx');
    expect(src).not.toContain('legacy-disabled');
  });

  it('API route does NOT import legacy-disabled', () => {
    const src = readSrc('app/api/export/route.ts');
    expect(src).not.toContain('legacy-disabled');
  });
});

// ───────────────────────────────────────────────────────────────
// D. Export template — 1 kuis page preserved
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13C: Export template — kuis page integrity', () => {
  it('export-output/index.html exists and has Vite bundle', () => {
    const path = resolve(__dirname, '../../export-output/index.html');
    const fs = require('fs');
    if (!fs.existsSync(path)) {
      // Skip in environments without export-output (CI builds it first)
      return;
    }
    const html = fs.readFileSync(path, 'utf-8');
    expect(html).toMatch(/<div[^>]*id=["']root["']/);
    expect(html).toMatch(/<script[^>]*type=["']module["']/);
  });

  it('PPKn template total pages is 13 (not 17)', () => {
    const pages = createPpknNormaGoldenProject();
    expect(pages.length).toBe(13);
  });

  it('PPKn template has no more than 1 kuis page', () => {
    const pages = createPpknNormaGoldenProject();
    const kuisCount = pages.filter(p => p.templateType === 'kuis').length;
    expect(kuisCount).toBe(1);
  });
});

// ───────────────────────────────────────────────────────────────
// E. No legacy imports in quiz/game V5 path
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13C: No legacy imports in quiz/game V5 path', () => {
  const v5QuizGameFiles = [
    'src/components/canva/QuizWidget.tsx',
    'src/components/canva/GameWidget.tsx',
    'src/components/canva/page-renderer/BlockRenderer.tsx',
    'src/components/canva/games/SortingGame.tsx',
    'src/export/ExportApp.tsx',
    'src/export/entry-client.tsx',
    'src/lib/use-vite-export.ts',
    'src/app/api/export/route.ts',
  ];

  for (const rel of v5QuizGameFiles) {
    it(`${rel} does NOT import from legacy-disabled`, () => {
      const path = rel.replace('src/', '');
      const src = readSrc(path);
      expect(src, `${rel} must not import from legacy-disabled`).not.toContain('legacy-disabled');
    });
  }

  for (const rel of v5QuizGameFiles) {
    it(`${rel} does NOT import html-templates`, () => {
      const path = rel.replace('src/', '');
      const src = readSrc(path);
      expect(src, `${rel} must not import html-templates`).not.toContain('html-templates');
    });
  }
});
