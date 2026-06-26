// ═══════════════════════════════════════════════════════════════
// BATCH-13B — PPKN-QUIZ-PAGE-COLLAPSE — Tests
// ═══════════════════════════════════════════════════════════════
// Verifies that PPKn template now creates 1 kuis page (not 5) with
// all quiz questions in 1 block.
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createPpknNormaGoldenProject } from '@/presets/ppkn/norma-golden-schema';

const readSrc = () =>
  readFileSync(resolve(__dirname, '../presets/ppkn/norma-golden-schema.ts'), 'utf-8');

describe('BATCH-13B: PPKn Quiz Page Collapse', () => {
  const pages = createPpknNormaGoldenProject();
  const kuisPages = pages.filter(p => p.templateType === 'kuis');

  it('creates exactly 1 kuis page (was 5)', () => {
    expect(kuisPages.length, 'should have exactly 1 kuis page').toBe(1);
  });

  it('total pages is 13 (was 17)', () => {
    expect(pages.length, 'should have 13 pages total').toBe(13);
  });

  it('kuis page has exactly 1 block of type kuis', () => {
    const kuisPage = kuisPages[0];
    const blocks = kuisPage?.schema?.blocks ?? [];
    expect(blocks.length, 'kuis page should have 1 block').toBe(1);
    expect(blocks[0]?.type, 'block type should be kuis').toBe('kuis');
  });

  it('kuis block contains ALL 5 QUIZ_QUESTIONS', () => {
    const kuisBlock = kuisPages[0]?.schema?.blocks?.[0] as Record<string, unknown> | undefined;
    const questions = kuisBlock?.questions as unknown[];
    expect(questions, 'questions array must exist').toBeDefined();
    expect(questions?.length, 'should have 5 questions in 1 block').toBe(5);
  });

  it('kuis page label is "Kuis" (not "Kuis 1", "Kuis 2", etc.)', () => {
    const kuisPage = kuisPages[0];
    expect(kuisPage?.label, 'page label should be "Kuis"').toBe('Kuis');
  });

  it('no page label matches "Kuis 1" or "Kuis 2" pattern', () => {
    const kuisLabels = pages
      .filter(p => p.templateType === 'kuis')
      .map(p => p.label);
    for (const label of kuisLabels) {
      expect(label, `label "${label}" should not match "Kuis N" pattern`).not.toMatch(/^Kuis \d+$/);
    }
  });

  it('kuis block title is "Kuis: Macam-Macam Norma" (not "Kuis: ... (1/5)")', () => {
    const kuisBlock = kuisPages[0]?.schema?.blocks?.[0] as Record<string, unknown> | undefined;
    expect(kuisBlock?.title, 'title should not have page counter').toBe('Kuis: Macam-Macam Norma');
  });

  it('first question is about norma agama (dosa)', () => {
    const kuisBlock = kuisPages[0]?.schema?.blocks?.[0] as Record<string, unknown> | undefined;
    const questions = kuisBlock?.questions as Array<Record<string, unknown>>;
    expect(questions?.[0]?.q).toContain('dosa');
    expect(questions?.[0]?.ans).toBe(0);
  });

  it('last question is about norma hukum ciri', () => {
    const kuisBlock = kuisPages[0]?.schema?.blocks?.[0] as Record<string, unknown> | undefined;
    const questions = kuisBlock?.questions as Array<Record<string, unknown>>;
    expect(questions?.[4]?.q).toContain('BUKAN');
    expect(questions?.[4]?.ans).toBe(3);
  });
});

describe('BATCH-13B: PPKn template source audit', () => {
  it('does not contain "1 question per page" comment', () => {
    expect(readSrc()).not.toContain('1 question per page');
  });

  it('does not contain createKuisPages (plural) function', () => {
    const src = readSrc()
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(src).not.toContain('createKuisPages');
  });

  it('contains createKuisPage (singular) function', () => {
    expect(readSrc()).toContain('function createKuisPage()');
  });

  it('contains QUIZ_QUESTIONS (not split into per-page arrays)', () => {
    expect(readSrc()).toContain('QUIZ_QUESTIONS');
  });

  it('questions: QUIZ_QUESTIONS (all questions in 1 block, not [q])', () => {
    expect(readSrc()).toContain('questions: QUIZ_QUESTIONS');
  });

  it('page count comment says 13 (not 17)', () => {
    expect(readSrc()).toContain('13 pages');
    expect(readSrc()).not.toContain('17 pages');
  });

  it('assembly uses createKuisPage() (not ...createKuisPages())', () => {
    const src = readSrc()
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(src).toContain('createKuisPage()');
    expect(src).not.toContain('...createKuisPages()');
  });
});
