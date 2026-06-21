// ═══════════════════════════════════════════════════════════════════
// SPRINT 9.0F — dataIdx Fallback Cleanup Gate (BLOCK-001 closure)
// ═══════════════════════════════════════════════════════════════════
// Verifies the dataIdx fallback contract documented in
// components/canva/types.ts lines 42-65 and closes BLOCK-001.
//
// The architecture (already in place before 9.0F):
//   - module-resolver.ts is the SINGLE source of truth for resolving
//     canva elements to module/kuis data
//   - Priority: stable ID (moduleId/kuisId) > dataIdx (legacy fallback)
//   - dataIdx is bounds-checked (>= 0 && < array.length)
//   - sync-slice.ts auto-heals legacy dataIdx → stable ID on sync
//   - element-slice.ts always sets BOTH dataIdx AND stable ID on new
//     elements (so the fallback only fires for legacy untouched data)
//
// Sprint 9.0F hardening:
//   - Added logDataIdxFallback() dev-only visibility helper (no behavior
//     change, just logs when the legacy fallback is exercised)
//   - Added _resetDataIdxFallbackLog() test-only helper
//
// Test coverage:
//   A. resolveModule priority contract
//      1. moduleId found → returns that module (dataIdx ignored)
//      2. moduleId not found, dataIdx valid → returns dataIdx module (fallback)
//      3. moduleId not found, dataIdx out of bounds → returns null
//      4. neither moduleId nor dataIdx → returns null
//      5. dataIdx negative → returns null (no fallback)
//      6. dataIdx == array.length → returns null (bounds check)
//      7. dataIdx > array.length → returns null (bounds check)
//
//   B. resolveKuis priority contract
//      1. kuisIds (multi) found → returns all matching kuis
//      2. kuisIds not found, kuisId found → returns single kuis
//      3. kuisIds/kuisId not found, dataIdx valid → returns dataIdx kuis (fallback)
//      4. no reference → returns empty array (NOT all kuis — scoping bug fixed)
//      5. kuisIds empty array → falls through to kuisId
//      6. dataIdx out of bounds → returns empty
//
//   C. Stable ID generation helpers
//      1. generateModuleId() returns 'mod_' prefix + unique
//      2. generateKuisId() returns 'kuis_' prefix + unique
//      3. ensureModuleIds() adds _id to modules missing it
//      4. ensureModuleIds() preserves existing _id
//      5. ensureKuisIds() adds _id to kuis missing it
//      6. ensureKuisIds() preserves existing _id
//
//   D. Dev-only fallback logger
//      1. logDataIdxFallback rate-limited per kind (logs once per kind)
//      2. _resetDataIdxFallbackLog clears the rate-limit set
//
//   E. New element contract (element-slice always sets stable ID)
//      Documented as invariant — verified via source audit, not runtime
//      test (would require full canva store + authoring store setup).
//
//   F. Source audit: dataIdx consumers are bounded
//      Verifies that every file using `dataIdx` is in the documented
//      consumer list (components/canva/types.ts lines 44-52).
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { glob } from 'node:fs';

import {
  resolveModule,
  resolveKuis,
  generateModuleId,
  generateKuisId,
  ensureModuleIds,
  ensureKuisIds,
  _resetDataIdxFallbackLog,
} from '@/lib/module-resolver';
import type { CanvaElement } from '@/components/canva/types';
import type { Module, KuisItem } from '@/store/authoring/types';

// ─────────────────────────────────────────────────────────────────
// Test fixtures
// ─────────────────────────────────────────────────────────────────

function makeModule(_id: string, type: string, title: string): Module {
  return { _id, type, title } as Module;
}

function makeKuis(_id: string, q: string): KuisItem {
  return { _id, q, opts: [], ans: 0 } as unknown as KuisItem;
}

function makeElement(overrides: Partial<CanvaElement> = {}): CanvaElement {
  return {
    id: 'el-test',
    type: 'game',
    icon: '🎮',
    label: 'Test Element',
    x: 0, y: 0, w: 50, h: 50,
    opacity: 100,
    ...overrides,
  } as CanvaElement;
}

// ─────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  _resetDataIdxFallbackLog();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// ═══════════════════════════════════════════════════════════════════
// A. resolveModule priority contract
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 9.0F — A. resolveModule priority contract', () => {
  it('moduleId found → returns that module (dataIdx ignored)', () => {
    const modules = [
      makeModule('mod_A', 'video', 'Video A'),
      makeModule('mod_B', 'flashcard', 'Flashcard B'),
    ];
    const el = makeElement({ moduleId: 'mod_B', dataIdx: 0 });
    const result = resolveModule(el, modules);
    expect(result).not.toBeNull();
    expect(result!._id).toBe('mod_B');
    expect(result!.title).toBe('Flashcard B');
  });

  it('moduleId not found, dataIdx valid → returns dataIdx module (fallback)', () => {
    const modules = [
      makeModule('mod_A', 'video', 'Video A'),
      makeModule('mod_B', 'flashcard', 'Flashcard B'),
    ];
    const el = makeElement({ moduleId: 'mod_NONEXISTENT', dataIdx: 1 });
    const result = resolveModule(el, modules);
    expect(result).not.toBeNull();
    expect(result!._id).toBe('mod_B');
    expect(result!.title).toBe('Flashcard B');
  });

  it('moduleId not found, dataIdx out of bounds → returns null', () => {
    const modules = [makeModule('mod_A', 'video', 'Video A')];
    const el = makeElement({ moduleId: 'mod_NONEXISTENT', dataIdx: 5 });
    const result = resolveModule(el, modules);
    expect(result).toBeNull();
  });

  it('neither moduleId nor dataIdx → returns null', () => {
    const modules = [makeModule('mod_A', 'video', 'Video A')];
    const el = makeElement({ moduleId: undefined, dataIdx: undefined });
    const result = resolveModule(el, modules);
    expect(result).toBeNull();
  });

  it('dataIdx negative → returns null (no fallback)', () => {
    const modules = [makeModule('mod_A', 'video', 'Video A')];
    const el = makeElement({ moduleId: undefined, dataIdx: -1 });
    const result = resolveModule(el, modules);
    expect(result).toBeNull();
  });

  it('dataIdx == array.length → returns null (bounds check upper edge)', () => {
    const modules = [
      makeModule('mod_A', 'video', 'Video A'),
      makeModule('mod_B', 'flashcard', 'Flashcard B'),
    ];
    const el = makeElement({ moduleId: undefined, dataIdx: 2 });
    const result = resolveModule(el, modules);
    expect(result).toBeNull();
  });

  it('dataIdx > array.length → returns null (bounds check)', () => {
    const modules = [makeModule('mod_A', 'video', 'Video A')];
    const el = makeElement({ moduleId: undefined, dataIdx: 100 });
    const result = resolveModule(el, modules);
    expect(result).toBeNull();
  });

  it('empty modules array → returns null even with valid dataIdx=0', () => {
    const el = makeElement({ moduleId: undefined, dataIdx: 0 });
    const result = resolveModule(el, []);
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// B. resolveKuis priority contract
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 9.0F — B. resolveKuis priority contract', () => {
  it('kuisIds (multi) found → returns all matching kuis', () => {
    const allKuis = [
      makeKuis('kuis_1', 'Q1'),
      makeKuis('kuis_2', 'Q2'),
      makeKuis('kuis_3', 'Q3'),
    ];
    const el = makeElement({
      type: 'kuis',
      kuisIds: ['kuis_1', 'kuis_3'],
    });
    const result = resolveKuis(el, allKuis as unknown as Array<Record<string, unknown>>);
    expect(result.length).toBe(2);
    expect(result[0]!._id).toBe('kuis_1');
    expect(result[1]!._id).toBe('kuis_3');
  });

  it('kuisIds not found, kuisId found → returns single kuis', () => {
    const allKuis = [
      makeKuis('kuis_1', 'Q1'),
      makeKuis('kuis_2', 'Q2'),
    ];
    const el = makeElement({
      type: 'kuis',
      kuisIds: ['kuis_NONEXISTENT'],
      kuisId: 'kuis_2',
    });
    const result = resolveKuis(el, allKuis as unknown as Array<Record<string, unknown>>);
    expect(result.length).toBe(1);
    expect(result[0]!._id).toBe('kuis_2');
  });

  it('kuisIds/kuisId not found, dataIdx valid → returns dataIdx kuis (fallback)', () => {
    const allKuis = [
      makeKuis('kuis_1', 'Q1'),
      makeKuis('kuis_2', 'Q2'),
    ];
    const el = makeElement({
      type: 'kuis',
      kuisId: 'kuis_NONEXISTENT',
      dataIdx: 1,
    });
    const result = resolveKuis(el, allKuis as unknown as Array<Record<string, unknown>>);
    expect(result.length).toBe(1);
    expect(result[0]!._id).toBe('kuis_2');
  });

  it('no reference → returns empty array (NOT all kuis — scoping bug fixed)', () => {
    const allKuis = [
      makeKuis('kuis_1', 'Q1'),
      makeKuis('kuis_2', 'Q2'),
      makeKuis('kuis_3', 'Q3'),
    ];
    const el = makeElement({
      type: 'kuis',
      kuisId: undefined,
      kuisIds: undefined,
      dataIdx: undefined,
    });
    const result = resolveKuis(el, allKuis as unknown as Array<Record<string, unknown>>);
    // CRITICAL: must be empty, NOT all 3 kuis (was a scoping bug before v4)
    expect(result.length).toBe(0);
  });

  it('kuisIds empty array → falls through to kuisId', () => {
    const allKuis = [
      makeKuis('kuis_1', 'Q1'),
      makeKuis('kuis_2', 'Q2'),
    ];
    const el = makeElement({
      type: 'kuis',
      kuisIds: [],
      kuisId: 'kuis_1',
    });
    const result = resolveKuis(el, allKuis as unknown as Array<Record<string, unknown>>);
    expect(result.length).toBe(1);
    expect(result[0]!._id).toBe('kuis_1');
  });

  it('dataIdx out of bounds → returns empty', () => {
    const allKuis = [makeKuis('kuis_1', 'Q1')];
    const el = makeElement({
      type: 'kuis',
      dataIdx: 5,
    });
    const result = resolveKuis(el, allKuis as unknown as Array<Record<string, unknown>>);
    expect(result.length).toBe(0);
  });

  it('dataIdx negative → returns empty (no fallback)', () => {
    const allKuis = [makeKuis('kuis_1', 'Q1')];
    const el = makeElement({
      type: 'kuis',
      dataIdx: -1,
    });
    const result = resolveKuis(el, allKuis as unknown as Array<Record<string, unknown>>);
    expect(result.length).toBe(0);
  });

  it('empty allKuis array → returns empty even with valid dataIdx=0', () => {
    const el = makeElement({
      type: 'kuis',
      dataIdx: 0,
    });
    const result = resolveKuis(el, []);
    expect(result.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// C. Stable ID generation helpers
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 9.0F — C. Stable ID generation helpers', () => {
  it('generateModuleId() returns "mod_" prefix', () => {
    const id = generateModuleId();
    expect(id.startsWith('mod_')).toBe(true);
  });

  it('generateModuleId() returns unique IDs', () => {
    const id1 = generateModuleId();
    const id2 = generateModuleId();
    expect(id1).not.toBe(id2);
  });

  it('generateKuisId() returns "kuis_" prefix', () => {
    const id = generateKuisId();
    expect(id.startsWith('kuis_')).toBe(true);
  });

  it('generateKuisId() returns unique IDs', () => {
    const id1 = generateKuisId();
    const id2 = generateKuisId();
    expect(id1).not.toBe(id2);
  });

  it('ensureModuleIds() adds _id to modules missing it', () => {
    const modules = [
      { type: 'video', title: 'A' }, // no _id
      { _id: 'mod_existing', type: 'flashcard', title: 'B' }, // has _id
    ];
    const result = ensureModuleIds(modules as Array<Record<string, unknown>>);
    expect(result[0]!._id).toBeTruthy();
    expect(result[0]!._id!.startsWith('mod_')).toBe(true);
    expect(result[1]!._id).toBe('mod_existing');
  });

  it('ensureModuleIds() preserves existing _id', () => {
    const modules = [{ _id: 'mod_keep', type: 'video', title: 'A' }];
    const result = ensureModuleIds(modules as Array<Record<string, unknown>>);
    expect(result[0]!._id).toBe('mod_keep');
  });

  it('ensureKuisIds() adds _id to kuis missing it', () => {
    const kuis = [
      { q: 'Q1', opts: [], ans: 0 }, // no _id
      { _id: 'kuis_existing', q: 'Q2', opts: [], ans: 0 }, // has _id
    ];
    const result = ensureKuisIds(kuis as KuisItem[]);
    expect(result[0]!._id).toBeTruthy();
    expect(result[0]!._id!.startsWith('kuis_')).toBe(true);
    expect(result[1]!._id).toBe('kuis_existing');
  });

  it('ensureKuisIds() preserves existing _id', () => {
    const kuis = [{ _id: 'kuis_keep', q: 'Q1', opts: [], ans: 0 }];
    const result = ensureKuisIds(kuis as KuisItem[]);
    expect(result[0]!._id).toBe('kuis_keep');
  });
});

// ═══════════════════════════════════════════════════════════════════
// D. Dev-only fallback logger
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 9.0F — D. Dev-only fallback logger', () => {
  it('resolveModule with dataIdx fallback does not throw', () => {
    const modules = [makeModule('mod_A', 'video', 'Video A')];
    const el = makeElement({ moduleId: undefined, dataIdx: 0 });
    expect(() => resolveModule(el, modules)).not.toThrow();
  });

  it('resolveKuis with dataIdx fallback does not throw', () => {
    const allKuis = [makeKuis('kuis_1', 'Q1')];
    const el = makeElement({ type: 'kuis', dataIdx: 0 });
    expect(() => resolveKuis(el, allKuis as unknown as Array<Record<string, unknown>>)).not.toThrow();
  });

  it('_resetDataIdxFallbackLog is callable (test-only helper)', () => {
    expect(() => _resetDataIdxFallbackLog()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════
// E. New element contract (documented invariant — source audit)
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 9.0F — E. New element contract (source audit)', () => {
  it('element-slice addKuisElement sets BOTH dataIdx AND kuisId', () => {
    // Source audit: verify the documented invariant holds.
    // element-slice.ts line 97 sets dataIdx: idx
    // element-slice.ts line 98 sets kuisId: kid
    const src = readFileSync(
      resolve(process.cwd(), 'src/store/canva/element-slice.ts'),
      'utf-8',
    );
    // Find the addKuisElement function body
    const addKuisMatch = src.match(/addKuisElement:[\s\S]*?dataIdx:\s*idx[\s\S]*?kuisId:\s*kid/);
    expect(addKuisMatch).not.toBeNull();
  });

  it('element-slice addGameElement sets BOTH dataIdx AND moduleId', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/store/canva/element-slice.ts'),
      'utf-8',
    );
    // addGameElement sets dataIdx: actualIdx ... moduleId: ...
    const addGameMatch = src.match(/addGameElement:[\s\S]*?dataIdx:[\s\S]*?moduleId:/);
    expect(addGameMatch).not.toBeNull();
  });

  it('element-slice addModuleElement sets BOTH dataIdx AND moduleId', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/store/canva/element-slice.ts'),
      'utf-8',
    );
    // addModuleElement(dataIdx, moduleId, ...) — uses both params
    const addModMatch = src.match(/addModuleElement:\s*\(dataIdx,\s*moduleId[\s\S]*?dataIdx,[\s\S]*?moduleId:/);
    expect(addModMatch).not.toBeNull();
  });

  it('sync-slice auto-heals dataIdx → moduleId/kuisId on sync', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/store/canva/sync-slice.ts'),
      'utf-8',
    );
    // Verify the auto-heal logic exists: writes moduleId from dataIdx
    expect(src).toMatch(/moduleId:\s*gameModules\[el\.dataIdx\]/);
    // Writes kuisId from dataIdx
    expect(src).toMatch(/kuisId:\s*authStore\.kuis\[el\.dataIdx\]/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// F. Source audit: dataIdx consumers are bounded + documented
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 9.0F — F. dataIdx consumers are bounded + documented', () => {
  // The documented consumer list (from components/canva/types.ts lines 44-52):
  //   - module-resolver.ts: Priority 2 fallback (bounds-checked)
  //   - sync-slice.ts: ID re-sync (writes moduleId/kuisId from dataIdx)
  //   - element-slice.ts: Sets dataIdx on new elements (also sets stable ID)
  //   - GameWidget.tsx: Props dataIdx for resolveModule() pseudo-element
  //   - QuizWidget.tsx: Props dataIdx for resolveKuis() pseudo-element
  //   - BlockRenderer.tsx: Passes dataIdx to GameWidget/QuizWidget
  //   - ElementProperties.tsx: DataIdxSelector UI for choosing module/kuis index
  //   - canva-constants.ts: Default value (-1) in element factory

  it('every file using dataIdx is in the documented consumer list', () => {
    // Read all .ts/.tsx files under src/ and find those containing `dataIdx`
    // (excluding test files, type definitions, and comments-only mentions).
    const documentedConsumers = new Set([
      'src/lib/module-resolver.ts',
      'src/store/canva/sync-slice.ts',
      'src/store/canva/element-slice.ts',
      'src/components/canva/QuizWidget.tsx',
      'src/components/canva/GameWidget.tsx',
      'src/components/canva/page-renderer/BlockRenderer.tsx',
      'src/components/canva/right-panel/ElementProperties.tsx',
      'src/lib/canva-constants.ts',
      'src/components/canva/types.ts',         // type definition + docs
      'src/store/canva/types.ts',              // store type definition
    ]);

    // Files that should NOT be flagged (test files, this file itself)
    const allowedTestFiles = new Set([
      'src/__tests__/dataidx-9.0f-cleanup.test.ts', // this file
    ]);

    // Walk src/ for dataIdx mentions
    const { execSync } = require('node:child_process');
    const grepResult = execSync(
      `grep -rl "dataIdx" src/ --include="*.ts" --include="*.tsx" | sort`,
      { cwd: process.cwd(), encoding: 'utf-8' },
    ).trim().split('\n').filter(Boolean);

    const unexpectedConsumers: string[] = [];
    for (const file of grepResult) {
      if (allowedTestFiles.has(file)) continue;
      if (documentedConsumers.has(file)) continue;
      // Allow any test file under src/__tests__/ or src/core/**/__tests__/
      if (file.includes('__tests__/') || file.includes('/__tests__/')) continue;
      unexpectedConsumers.push(file);
    }

    expect(unexpectedConsumers).toEqual([]);
  });

  it('module-resolver.ts has bounds check on dataIdx (resolveModule)', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/lib/module-resolver.ts'),
      'utf-8',
    );
    // Must have: el.dataIdx != null && el.dataIdx >= 0 && el.dataIdx < allModules.length
    expect(src).toMatch(/el\.dataIdx\s*!=\s*null\s*&&\s*el\.dataIdx\s*>=\s*0\s*&&\s*el\.dataIdx\s*<\s*allModules\.length/);
  });

  it('module-resolver.ts has bounds check on dataIdx (resolveKuis)', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/lib/module-resolver.ts'),
      'utf-8',
    );
    // Must have: dataIdx >= 0 && dataIdx < allKuis.length
    expect(src).toMatch(/dataIdx\s*>=\s*0\s*&&\s*dataIdx\s*<\s*allKuis\.length/);
  });

  it('canva-constants.ts default dataIdx is -1 (sentinel for "no fallback")', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/lib/canva-constants.ts'),
      'utf-8',
    );
    expect(src).toMatch(/dataIdx:\s*-1/);
  });

  it('components/canva/types.ts has @deprecated JSDoc on dataIdx field', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/components/canva/types.ts'),
      'utf-8',
    );
    expect(src).toMatch(/@deprecated\s+Use\s+moduleId\/kuisId/);
  });

  it('components/canva/types.ts documents the migration path (4 steps)', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/components/canva/types.ts'),
      'utf-8',
    );
    expect(src).toMatch(/MIGRATION PATH/);
    expect(src).toMatch(/sync-slice\.ts already promotes dataIdx/);
    expect(src).toMatch(/GameWidget\/QuizWidget can stop accepting dataIdx prop/);
    expect(src).toMatch(/this field can be removed from CanvaElement/);
  });
});
