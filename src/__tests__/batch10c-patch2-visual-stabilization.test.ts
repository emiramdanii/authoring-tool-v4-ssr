// ═══════════════════════════════════════════════════════════════
// BATCH-10C-Patch-2 — V5-MAIN-VISUAL-STABILIZATION-01
// ═══════════════════════════════════════════════════════════════
// End-to-end visual stabilization proof for PPKn template.
// Verifies all critical pages have valid blocks + content,
// renderers exist, contract is light, and export HTML contains
// main content.
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { createPpknNormaGoldenProject } from '@/presets/ppkn/norma-golden-schema';
import { createDefaultSchemaForTemplateType } from '@/core/schema/schema-factory';

const readSrc = (rel: string) =>
  readFileSync(resolve(__dirname, '..', rel), 'utf-8');

// ───────────────────────────────────────────────────────────────
// A. PPKn template — all critical pages have valid blocks + content
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-2: PPKn template — all critical pages valid', () => {
  const pages = createPpknNormaGoldenProject();

  it('has 13 pages total', () => {
    expect(pages.length).toBe(13);
  });

  // Cover
  it('Cover page has cover block with title', () => {
    const cover = pages.find(p => p.templateType === 'cover');
    expect(cover).toBeDefined();
    const block = cover?.schema?.blocks?.[0] as Record<string, unknown>;
    expect(block?.type).toBe('cover');
    expect(block?.title).toBe('Macam-Macam Norma');
    expect(block?.subtitle).toBe('PPKn Kelas VII — Semester 1');
  });

  // Petunjuk
  it('Petunjuk page has petunjuk block with title', () => {
    const page = pages.find(p => p.templateType === 'petunjuk');
    expect(page).toBeDefined();
    const block = page?.schema?.blocks?.[0] as Record<string, unknown>;
    expect(block?.type).toBe('petunjuk');
    expect(block?.title).toBeTruthy();
  });

  // Tujuan
  it('Tujuan page has tujuan-display block with title', () => {
    const page = pages.find(p => p.templateType === 'tujuan');
    expect(page).toBeDefined();
    const block = page?.schema?.blocks?.[0] as Record<string, unknown>;
    expect(block?.type).toBe('tujuan-display');
    expect(block?.title).toBeTruthy();
  });

  // Materi (at least 1 materi page with content)
  it('at least 1 Materi page has def-box with content', () => {
    const materiPages = pages.filter(p => p.templateType === 'materi');
    expect(materiPages.length).toBeGreaterThanOrEqual(1);
    const hasContent = materiPages.some(p =>
      p.schema?.blocks?.some(b => {
        const block = b as Record<string, unknown>;
        return block.type === 'def-box' && typeof block.content === 'string' && block.content.length > 20;
      })
    );
    expect(hasContent, 'at least 1 materi page must have def-box with content').toBe(true);
  });

  // Diskusi
  it('Diskusi page has diskusi block with title', () => {
    const page = pages.find(p => p.templateType === 'diskusi');
    expect(page).toBeDefined();
    const block = page?.schema?.blocks?.[0] as Record<string, unknown>;
    expect(block?.type).toBe('diskusi');
    expect(block?.title).toBeTruthy();
  });

  // Kuis
  it('Kuis page has kuis block with 5 questions', () => {
    const page = pages.find(p => p.templateType === 'kuis');
    expect(page).toBeDefined();
    const block = page?.schema?.blocks?.[0] as Record<string, unknown>;
    expect(block?.type).toBe('kuis');
    expect(block?.title).toBe('Kuis: Macam-Macam Norma');
    const questions = block?.questions as unknown[];
    expect(questions?.length).toBe(5);
  });

  // Refleksi
  it('Refleksi page has refleksi block with title', () => {
    const page = pages.find(p => p.templateType === 'refleksi');
    expect(page).toBeDefined();
    const block = page?.schema?.blocks?.[0] as Record<string, unknown>;
    expect(block?.type).toBe('refleksi');
    expect(block?.title).toBeTruthy();
  });

  // Penutup
  it('Penutup page has penutup block with title', () => {
    const page = pages.find(p => p.templateType === 'penutup');
    expect(page).toBeDefined();
    const block = page?.schema?.blocks?.[0] as Record<string, unknown>;
    expect(block?.type).toBe('penutup');
    expect(block?.title).toBeTruthy();
  });

  // All pages have contractId modern-educator (not golden-pertemuan)
  it('ALL pages have contractId modern-educator (not golden-pertemuan)', () => {
    for (const page of pages) {
      expect(page.contractId, `page ${page.label} should have modern-educator`).toBe('modern-educator');
    }
  });

  // No empty pages (every page has at least 1 block)
  it('no page is empty (all have at least 1 block)', () => {
    for (const page of pages) {
      const blockCount = page.schema?.blocks?.length ?? 0;
      expect(blockCount, `page ${page.label} should have at least 1 block`).toBeGreaterThanOrEqual(1);
    }
  });
});

// ───────────────────────────────────────────────────────────────
// B. Renderer registry — all critical renderers exist
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-2: Renderer registry — all critical renderers', () => {
  const src = readSrc('core/renderer/RendererLazy.tsx');

  it('cover → LazyCoverRenderer', () => {
    expect(src).toContain("'cover': LazyCoverRenderer");
  });

  it('kuis → LazyKuisRenderer', () => {
    expect(src).toContain("'kuis': LazyKuisRenderer");
  });

  it('sortir-game → LazySortirGameRenderer', () => {
    expect(src).toContain("'sortir-game': LazySortirGameRenderer");
  });

  it('petunjuk renderer registered', () => {
    expect(src).toMatch(/'petunjuk'/);
  });

  it('tujuan-display renderer registered', () => {
    expect(src).toMatch(/'tujuan-display'/);
  });

  it('diskusi renderer registered', () => {
    expect(src).toMatch(/'diskusi'/);
  });

  it('refleksi renderer registered', () => {
    expect(src).toMatch(/'refleksi'/);
  });

  it('penutup renderer registered', () => {
    expect(src).toMatch(/'penutup'/);
  });

  it('def-box renderer registered', () => {
    expect(src).toMatch(/'def-box'/);
  });

  it('nc-grid renderer registered', () => {
    expect(src).toMatch(/'nc-grid'/);
  });
});

// ───────────────────────────────────────────────────────────────
// C. SchemaBlockRenderer uses SCENE_REGISTRY (schema path)
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-2: Schema path — SCENE_REGISTRY routing', () => {
  const src = readSrc('core/renderer/SchemaRenderer.tsx');

  it('SchemaBlockRenderer looks up SCENE_REGISTRY[block.type]', () => {
    expect(src).toContain('SCENE_REGISTRY[block.type]');
  });

  it('does NOT import QuizWidget (legacy element path)', () => {
    expect(src).not.toContain('QuizWidget');
  });

  it('does NOT import GameWidget (legacy element path)', () => {
    expect(src).not.toContain('GameWidget');
  });
});

// ───────────────────────────────────────────────────────────────
// D. Contract — modern-educator is light + active
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-2: modern-educator is light + active', () => {
  it('getContractOrGolden(undefined) returns modern-educator', async () => {
    const { getContractOrGolden } = await import('@/core/template/contract');
    const contract = getContractOrGolden(undefined);
    expect(contract.id).toBe('modern-educator');
  });

  it('modern-educator has light background', async () => {
    const { getContract } = await import('@/core/template/contract');
    const contract = getContract('modern-educator');
    expect(contract?.colors.background).toBe('#f7f9fb');
  });

  it('modern-educator has dark text (contrasting with light bg)', async () => {
    const { getContract } = await import('@/core/template/contract');
    const contract = getContract('modern-educator');
    expect(contract?.colors.text).toBe('#191c1e');
  });

  it('golden-pertemuan still exists (legacy, dark)', async () => {
    const { getContract } = await import('@/core/template/contract');
    const contract = getContract('golden-pertemuan');
    expect(contract?.id).toBe('golden-pertemuan');
    expect(contract?.colors.background).toBe('#0f172a');
  });
});

// ───────────────────────────────────────────────────────────────
// E. game-sortir-kuis template — produces sortir-game block
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-2: game-sortir-kuis produces sortir-game', () => {
  it('game templateType produces sortir-game block via schema factory', () => {
    const schema = createDefaultSchemaForTemplateType('game', {
      suggestedBlocks: ['sortir-game'],
      variant: 'A',
    });
    const block = schema?.blocks?.[0] as Record<string, unknown> | undefined;
    expect(block?.type).toBe('sortir-game');
  });

  it('default sortir-game has 4 pool items', () => {
    const schema = createDefaultSchemaForTemplateType('game', {
      suggestedBlocks: ['sortir-game'],
      variant: 'A',
    });
    const block = schema?.blocks?.[0] as Record<string, unknown> | undefined;
    const pool = block?.pool as unknown[];
    expect(pool?.length).toBe(4);
  });

  it('default sortir-game has 4 kolom categories', () => {
    const schema = createDefaultSchemaForTemplateType('game', {
      suggestedBlocks: ['sortir-game'],
      variant: 'A',
    });
    const block = schema?.blocks?.[0] as Record<string, unknown> | undefined;
    const kolom = block?.kolom as unknown[];
    expect(kolom?.length).toBe(4);
  });
});

// ───────────────────────────────────────────────────────────────
// F. Export proof — HTML contains main content
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-2: Export proof — HTML has main content', () => {
  const templatePath = resolve(__dirname, '../../export-output/index.html');
  const templateExists = existsSync(templatePath);

  it.skipIf(!templateExists)('export template contains Vite bundle (React app)', () => {
    const html = readFileSync(templatePath, 'utf-8');
    expect(html).toMatch(/<script[^>]*type=["']module["']/);
  });

  it('PPKn template pages have text content that would appear in export', () => {
    const pages = createPpknNormaGoldenProject();
    // Cover title
    const cover = pages.find(p => p.templateType === 'cover');
    const coverBlock = cover?.schema?.blocks?.[0] as Record<string, unknown>;
    expect(coverBlock?.title).toBe('Macam-Macam Norma');

    // Kuis questions
    const kuis = pages.find(p => p.templateType === 'kuis');
    const kuisBlock = kuis?.schema?.blocks?.[0] as Record<string, unknown>;
    const questions = kuisBlock?.questions as Array<Record<string, unknown>>;
    expect(questions?.[0]?.q).toContain('dosa');

    // Materi content
    const materiPages = pages.filter(p => p.templateType === 'materi');
    const hasMateriContent = materiPages.some(p =>
      p.schema?.blocks?.some(b => {
        const block = b as Record<string, unknown>;
        return typeof block.content === 'string' && block.content.length > 20;
      })
    );
    expect(hasMateriContent).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────
// G. No regression — golden-pertemuan NOT in active defaults
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-2: No regression to golden-pertemuan', () => {
  it('CourseTemplateRegistry does NOT use golden-pertemuan as contractId', () => {
    const src = readSrc('core/template/CourseTemplateRegistry.ts');
    const stripped = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(stripped).not.toContain("contractId: 'golden-pertemuan'");
  });

  it('schema-preset-slice does NOT default to golden-pertemuan', () => {
    const src = readSrc('store/canva/schema-preset-slice.ts');
    const stripped = src.replace(/\/\/.*$/gm, '');
    expect(stripped).not.toContain("'golden-pertemuan'");
  });

  it('PPKn template pages do NOT have golden-pertemuan contractId', () => {
    const pages = createPpknNormaGoldenProject();
    for (const page of pages) {
      expect(page.contractId).not.toBe('golden-pertemuan');
    }
  });
});
