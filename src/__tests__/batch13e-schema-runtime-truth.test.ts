// ═══════════════════════════════════════════════════════════════
// BATCH-13E — SCHEMA-RUNTIME-TRUTH-PATCH-01
// ═══════════════════════════════════════════════════════════════
// Proves that V5 schema runtime path is correct:
//   PageRenderer → SchemaScreenRenderer → SchemaBlockRenderer
//   → SCENE_REGISTRY[block.type] → KuisRenderer / SortirGameRenderer
//
// NOT QuizWidget / GameWidget (those are legacy element-based path).
//
// Also fixes P1 bug: game-sortir-kuis template was producing kuis
// block instead of sortir-game block for "Aktivitas Sortir" scene.
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const readSrc = (rel: string) =>
  readFileSync(resolve(__dirname, '..', rel), 'utf-8');

// ───────────────────────────────────────────────────────────────
// A. Schema runtime path — SCENE_REGISTRY routes to correct renderers
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13E: SCENE_REGISTRY routes to correct schema renderers', () => {
  const src = readSrc('core/renderer/RendererLazy.tsx');

  it('registers kuis → LazyKuisRenderer (not QuizWidget)', () => {
    expect(src).toContain("'kuis': LazyKuisRenderer");
    expect(src).not.toContain("'kuis': QuizWidget");
  });

  it('registers sortir-game → LazySortirGameRenderer (not GameWidget)', () => {
    expect(src).toContain("'sortir-game': LazySortirGameRenderer");
    expect(src).not.toContain("'sortir-game': GameWidget");
  });

  it('LazyKuisRenderer imports from KuisRenderer (schema path)', () => {
    expect(src).toContain("import('./blocks/KuisRenderer')");
    expect(src).toContain('KuisRenderer');
  });

  it('LazySortirGameRenderer imports from SortirGameRenderer (schema path)', () => {
    expect(src).toContain("import('./blocks/SortirGameRenderer')");
    expect(src).toContain('SortirGameRenderer');
  });
});

// ───────────────────────────────────────────────────────────────
// B. SchemaBlockRenderer uses SCENE_REGISTRY (not direct widget imports)
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13E: SchemaBlockRenderer uses SCENE_REGISTRY', () => {
  const src = readSrc('core/renderer/SchemaRenderer.tsx');

  it('imports SCENE_REGISTRY from SceneRegistry', () => {
    expect(src).toContain('SCENE_REGISTRY');
    expect(src).toContain("from '../registry/SceneRegistry'");
  });

  it('looks up renderer via SCENE_REGISTRY[block.type]', () => {
    expect(src).toContain('SCENE_REGISTRY[block.type]');
  });

  it('does NOT import QuizWidget directly', () => {
    expect(src).not.toContain('QuizWidget');
  });

  it('does NOT import GameWidget directly', () => {
    expect(src).not.toContain('GameWidget');
  });
});

// ───────────────────────────────────────────────────────────────
// C. PageRenderer uses SchemaScreenRenderer (not BlockRenderer)
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13E: PageRenderer uses SchemaScreenRenderer', () => {
  const src = readSrc('components/canva/page-renderer/PageRenderer.tsx');

  it('imports SchemaScreenRenderer', () => {
    expect(src).toContain('SchemaScreenRenderer');
  });

  it('uses SchemaScreenRenderer for schema pages (useSchemaRenderer)', () => {
    expect(src).toContain('useSchemaRenderer');
  });

  it('does NOT import QuizWidget directly', () => {
    expect(src).not.toContain('QuizWidget');
  });

  it('does NOT import GameWidget directly', () => {
    expect(src).not.toContain('GameWidget');
  });
});

// ───────────────────────────────────────────────────────────────
// D. KuisRenderer — schema path supports multi-question
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13E: KuisRenderer (schema path) — multi-question support', () => {
  const src = readSrc('core/renderer/blocks/KuisRenderer.tsx');

  it('reads questions from block.questions array', () => {
    expect(src).toContain('block.questions');
  });

  it('has current question index for step-reveal', () => {
    expect(src).toContain('current');
  });

  it('shows progress as current+1/total', () => {
    expect(src).toMatch(/current.*\+.*1.*questionsLength|current.*\+.*1.*total/);
  });

  it('tracks answers per question', () => {
    expect(src).toContain('answers');
  });

  it('detects completion when all questions answered', () => {
    expect(src).toContain('totalAnswered');
    expect(src).toContain('isCompleted');
  });

  it('calculates score from correct answers', () => {
    expect(src).toMatch(/score|correct/i);
  });

  it('does NOT import QuizWidget', () => {
    expect(src).not.toContain('QuizWidget');
  });
});

// ───────────────────────────────────────────────────────────────
// E. SortirGameRenderer — schema path supports multi-item + multi-kolom
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13E: SortirGameRenderer (schema path) — multi-item support', () => {
  const src = readSrc('core/renderer/blocks/SortirGameRenderer.tsx');

  it('reads pool from block (items to sort)', () => {
    expect(src).toMatch(/pool|block\.pool/);
  });

  it('reads kolom from block (categories/drop zones)', () => {
    expect(src).toMatch(/kolom|block\.kolom/);
  });

  it('renders kolom as drop zones (map)', () => {
    expect(src).toMatch(/kolom.*map|kolomDef/);
  });

  it('does NOT import GameWidget or SortingGame (legacy)', () => {
    expect(src).not.toContain('GameWidget');
    expect(src).not.toContain('SortingGame');
  });
});

// ───────────────────────────────────────────────────────────────
// F. game-sortir-kuis template — produces sortir-game block (P1 FIX)
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13E: game-sortir-kuis template — P1 fix: produces sortir-game', () => {
  const src = readSrc('core/template/CourseTemplateRegistry.ts');

  it('"Aktivitas Sortir" scene uses templateType: game (NOT kuis)', () => {
    // Find the game-sortir-kuis template's scenes
    const templateStart = src.indexOf("id: 'game-sortir-kuis'");
    expect(templateStart).toBeGreaterThan(-1);
    const templateSection = src.substring(templateStart, templateStart + 800);
    expect(templateSection, 'must have templateType: game for Aktivitas Sortir').toContain("templateType: 'game'");
  });

  it('"Aktivitas Sortir" scene uses suggestedBlocks: sortir-game (NOT kuis)', () => {
    const templateStart = src.indexOf("id: 'game-sortir-kuis'");
    const templateSection = src.substring(templateStart, templateStart + 800);
    expect(templateSection, 'must have suggestedBlocks: sortir-game').toContain("['sortir-game']");
  });

  it('does NOT have templateType: kuis for Aktivitas Sortir scene', () => {
    const templateStart = src.indexOf("id: 'game-sortir-kuis'");
    const templateSection = src.substring(templateStart, templateStart + 800);
    const aktivitasLine = templateSection.match(/label: 'Aktivitas Sortir'.*/);
    if (aktivitasLine) {
      expect(aktivitasLine[0]).not.toContain("templateType: 'kuis'");
    }
  });
});

// ───────────────────────────────────────────────────────────────
// G. Default sortir-game block — multi-item + multi-kolom
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13E: Default sortir-game block — multi-item + multi-kolom', () => {
  const src = readSrc('core/registry/BlockDefinitionRegistry.ts');

  it('default pool has more than 1 item', () => {
    // Find the sortir-game createDefault section
    const sortirStart = src.indexOf("'sortir-game':");
    expect(sortirStart).toBeGreaterThan(-1);
    const section = src.substring(sortirStart, sortirStart + 1200);
    // Count pool entries (id: 's1', id: 's2', etc.)
    const poolMatches = section.match(/id: 's\d+'/g) || [];
    expect(poolMatches.length, 'should have at least 2 pool items').toBeGreaterThanOrEqual(2);
  });

  it('default kolom has more than 1 category', () => {
    const sortirStart = src.indexOf("'sortir-game':");
    const section = src.substring(sortirStart, sortirStart + 1200);
    const kolomMatches = section.match(/id: 'kolom-\d+'/g) || [];
    expect(kolomMatches.length, 'should have at least 2 kolom categories').toBeGreaterThanOrEqual(2);
  });

  it('default pool items reference valid kolom categories', () => {
    const sortirStart = src.indexOf("'sortir-game':");
    const section = src.substring(sortirStart, sortirStart + 1200);
    // Each pool item should have category: 'kolom-N' that matches a kolom id
    expect(section).toContain("category: 'kolom-1'");
    expect(section).toContain("category: 'kolom-2'");
  });

  it('default kolom items have label and color', () => {
    const sortirStart = src.indexOf("'sortir-game':");
    const section = src.substring(sortirStart, sortirStart + 1200);
    expect(section).toContain('label:');
    expect(section).toContain('color:');
  });
});

// ───────────────────────────────────────────────────────────────
// H. Schema factory — game templateType produces sortir-game block
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13E: Schema factory — game → sortir-game', () => {
  const src = readSrc('core/schema/schema-factory.ts');

  it('maps game templateType to sortir-game block', () => {
    expect(src).toContain("game: ['sortir-game']");
  });

  it('createBlockFromRegistry uses BLOCK_DEFINITIONS', () => {
    expect(src).toContain('BLOCK_DEFINITIONS');
    expect(src).toContain('createBlockFromRegistry');
  });
});

// ───────────────────────────────────────────────────────────────
// I. No legacy imports in schema runtime path
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13E: No legacy imports in schema runtime path', () => {
  const schemaPathFiles = [
    'src/core/renderer/SchemaRenderer.tsx',
    'src/core/renderer/RendererLazy.tsx',
    'src/core/renderer/blocks/KuisRenderer.tsx',
    'src/core/renderer/blocks/SortirGameRenderer.tsx',
    'src/components/canva/page-renderer/PageRenderer.tsx',
  ];

  for (const rel of schemaPathFiles) {
    it(`${rel} does NOT import from legacy-disabled`, () => {
      const path = rel.replace('src/', '');
      const src = readSrc(path);
      expect(src).not.toContain('legacy-disabled');
    });
  }

  for (const rel of schemaPathFiles) {
    it(`${rel} does NOT import html-templates`, () => {
      const path = rel.replace('src/', '');
      const src = readSrc(path);
      expect(src).not.toContain('html-templates');
    });
  }
});
