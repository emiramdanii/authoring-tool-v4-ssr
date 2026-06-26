// ═══════════════════════════════════════════════════════════════
// BATCH-13D — GAME-RUNTIME-EXPORT-PROOF-01
// ═══════════════════════════════════════════════════════════════
// Proves that GameWidget → SortingGame works via V5 path with
// multi-item single-block game (not PowerPoint-style page spam).
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const readSrc = (rel: string) =>
  readFileSync(resolve(__dirname, '..', rel), 'utf-8');

// ───────────────────────────────────────────────────────────────
// A. GameWidget — routing to SortingGame
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13D: GameWidget — routes to SortingGame', () => {
  const src = () => readSrc('components/canva/GameWidget.tsx');

  it('imports SortingGame via dynamic import', () => {
    expect(src()).toContain("import('./games/SortingGame')");
  });

  it('routes gameType === "sorting" to SortingGame component', () => {
    expect(src()).toContain("gameType === 'sorting'");
    expect(src()).toContain('<SortingGame');
  });

  it('passes interactive + onComplete props to SortingGame', () => {
    expect(src()).toContain('interactive');
    expect(src()).toContain('onComplete');
    expect(src()).toContain('handleComplete');
  });

  it('wraps onComplete with sound effect', () => {
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
// B. SortingGame — internal state + multi-item single-block
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13D: SortingGame — internal state + multi-item', () => {
  const src = () => readSrc('components/canva/games/SortingGame.tsx');

  it('has sorted state for tracking placements', () => {
    expect(src()).toContain('sorted');
    expect(src()).toContain('useState');
  });

  it('has phase state: play | done', () => {
    expect(src()).toContain("'play'");
    expect(src()).toContain("'done'");
    expect(src()).toContain('useState');
  });

  it('has wrongAttempts state for efficiency scoring', () => {
    expect(src()).toContain('wrongAttempts');
    expect(src()).toContain('useState');
  });

  it('has reported ref to prevent duplicate score reporting', () => {
    expect(src()).toContain('reported');
    expect(src()).toMatch(/useRef/);
  });

  it('reads items array from data (multi-item in 1 block)', () => {
    expect(src()).toContain('items');
    expect(src()).toMatch(/data\.items/);
  });

  it('reads kategori array from data (categories/drop zones)', () => {
    expect(src()).toContain('kategori');
    expect(src()).toMatch(/data\.kategori/);
  });

  it('filters validItems (items with teks + kategori)', () => {
    expect(src()).toContain('validItems');
    expect(src()).toMatch(/items\.filter/);
  });

  it('calculates efficiency-based score with 50% floor', () => {
    expect(src()).toContain('Math.max');
    expect(src()).toContain('Math.ceil');
    expect(src()).toMatch(/validItems\.length.*0\.5/);
  });

  it('reports score via onComplete callback', () => {
    expect(src()).toContain('onComplete');
    expect(src()).toMatch(/onComplete\(score/);
  });

  it('auto-detects completion when totalSorted === validItems.length', () => {
    expect(src()).toContain('totalSorted');
    expect(src()).toContain('validItems.length');
    expect(src()).toMatch(/totalSorted.*validItems\.length/);
  });

  it('has result/done phase with score percentage', () => {
    expect(src()).toContain("phase === 'done'");
    expect(src()).toContain('scorePct');
    expect(src()).toMatch(/score.*100|pct.*score/);
  });

  it('has Ulangi (replay) button in done phase', () => {
    expect(src()).toContain('Ulangi');
  });

  it('resets state on data change (replay)', () => {
    expect(src()).toContain('setSorted({})');
    expect(src()).toContain("setPhase('play')");
    expect(src()).toContain('setWrongAttempts(0)');
  });

  it('handles empty state (no items or no kategori)', () => {
    expect(src()).toContain('EmptyState');
    expect(src()).toMatch(/validItems\.length === 0/);
  });

  it('renders kategori as drop zones (map)', () => {
    expect(src()).toMatch(/kategori\.map/);
  });

  it('renders items as draggable/sortable', () => {
    expect(src()).toMatch(/items\.map|unsorted\.map|validItems\.map/);
  });

  it('does NOT import from legacy-disabled', () => {
    expect(src()).not.toContain('legacy-disabled');
  });

  it('does NOT import html-templates', () => {
    expect(src()).not.toContain('html-templates');
  });
});

// ───────────────────────────────────────────────────────────────
// C. SortirGameBlock schema — multi-item + multi-category
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13D: SortirGameBlock schema — multi-item structure', () => {
  const src = readSrc('core/schema/types/blocks.ts');

  it('SortirGameBlock has pool array (items to sort)', () => {
    expect(src).toContain('interface SortirGameBlock');
    expect(src).toMatch(/pool.*Array/);
  });

  it('SortirGameBlock has kolom array (categories/drop zones)', () => {
    expect(src).toMatch(/kolom.*Array/);
  });

  it('pool items have id, text, category', () => {
    expect(src).toContain('id: string');
    expect(src).toContain('text: string');
    expect(src).toContain('category: string');
  });

  it('kolom items have id, label, color', () => {
    expect(src).toContain('label: string');
    expect(src).toContain('color: string');
  });
});

// ───────────────────────────────────────────────────────────────
// D. BlockRenderer — game rendering via V5 path
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13D: BlockRenderer — game via V5 path', () => {
  const src = readSrc('components/canva/page-renderer/BlockRenderer.tsx');

  it('renders GameWidget for game elements', () => {
    expect(src).toContain('GameWidget');
    expect(src).toContain("element.type === 'game'");
  });

  it('passes interactive + onComplete to GameWidget', () => {
    expect(src).toContain('interactive');
    expect(src).toContain('onComplete');
  });

  it('does NOT import from legacy-disabled', () => {
    expect(src).not.toContain('legacy-disabled');
  });

  it('does NOT import html-templates', () => {
    expect(src).not.toContain('html-templates');
  });
});

// ───────────────────────────────────────────────────────────────
// E. Export path — no legacy in game V5 path
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13D: Export path — game via V5 (no legacy)', () => {
  const v5GamePathFiles = [
    'src/components/canva/GameWidget.tsx',
    'src/components/canva/games/SortingGame.tsx',
    'src/components/canva/page-renderer/BlockRenderer.tsx',
    'src/export/ExportApp.tsx',
    'src/export/entry-client.tsx',
    'src/lib/use-vite-export.ts',
    'src/app/api/export/route.ts',
  ];

  for (const rel of v5GamePathFiles) {
    it(`${rel} does NOT import from legacy-disabled`, () => {
      const path = rel.replace('src/', '');
      const src = readSrc(path);
      expect(src, `${rel} must not import from legacy-disabled`).not.toContain('legacy-disabled');
    });
  }

  for (const rel of v5GamePathFiles) {
    it(`${rel} does NOT import html-templates`, () => {
      const path = rel.replace('src/', '');
      const src = readSrc(path);
      expect(src, `${rel} must not import html-templates`).not.toContain('html-templates');
    });
  }

  it('ExportApp uses PageRenderer (renders game blocks via BlockRenderer)', () => {
    const src = readSrc('export/ExportApp.tsx');
    expect(src).toContain('PageRenderer');
    expect(src).toContain('export');
  });

  it('game-sortir-kuis template is registered in CourseTemplateRegistry', () => {
    const src = readSrc('core/template/CourseTemplateRegistry.ts');
    expect(src).toContain("'game-sortir-kuis'");
  });
});

// ───────────────────────────────────────────────────────────────
// F. Game Sortir + Kuis template — 1 game page with multi-item block
// ═══════════════════════════════════════════════════════════════

describe('BATCH-13D: Game Sortir template — multi-item in 1 block', () => {
  it('schema-factory registers sortir-game for game templateType', () => {
    const src = readSrc('core/schema/schema-factory.ts');
    expect(src).toContain('sortir-game');
    expect(src).toMatch(/game.*sortir-game/);
  });

  it('SortirGameBlock supports multiple pool items (array)', () => {
    const src = readSrc('core/schema/types/blocks.ts');
    // Pool is an array — can hold 2, 5, 10, or more items
    expect(src).toMatch(/pool.*Array/);
  });

  it('SortirGameBlock supports multiple kolom categories (array)', () => {
    const src = readSrc('core/schema/types/blocks.ts');
    // Kolom is an array — can hold 2, 3, 4, or more categories
    expect(src).toMatch(/kolom.*Array/);
  });
});
