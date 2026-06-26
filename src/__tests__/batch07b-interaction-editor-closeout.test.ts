// ═══════════════════════════════════════════════════════════════
// BATCH-07B: INTERACTION-EDITOR-CLOSEOUT — Tests
// ═══════════════════════════════════════════════════════════════
// Source-audit tests for:
//   1. inspector-field-registry: 3 new field types + 3 registrations
//   2. SortItemsFieldEditor: component contract
//   3. ReflectionQuestionsFieldEditor: component contract (both modes)
//   4. WorkspaceInspector: 3 new field rendering branches
//   5. E2E spec: hard assert (no soft fallback)
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const readSrc = (rel: string) => readFileSync(resolve(__dirname, '..', rel), 'utf-8');

// ───────────────────────────────────────────────────────────────
// inspector-field-registry.ts — 3 new field types + registrations
// ───────────────────────────────────────────────────────────────

describe('BATCH-07B: inspector-field-registry — 3 new field types', () => {
  const src = () =>
    readSrc('components/canva/mpi-workspace-v2/inspector-field-registry.ts');

  it('FieldType union includes "sortItems"', () => {
    expect(src()).toMatch(/export type FieldType =[\s\S]*?'sortItems'/);
  });

  it('FieldType union includes "discussionQuestions"', () => {
    expect(src()).toMatch(/export type FieldType =[\s\S]*?'discussionQuestions'/);
  });

  it('FieldType union includes "reflectionQuestions"', () => {
    expect(src()).toMatch(/export type FieldType =[\s\S]*?'reflectionQuestions'/);
  });

  it('defines SORT_ITEMS_FIELD constant with key "sortItems" and type "sortItems"', () => {
    const s = src();
    expect(s).toContain('SORT_ITEMS_FIELD: FieldDefinition');
    expect(s).toMatch(/key:\s*'sortItems'/);
    expect(s).toMatch(/type:\s*'sortItems'/);
  });

  it('defines DISCUSSION_QUESTIONS_FIELD constant', () => {
    const s = src();
    expect(s).toContain('DISCUSSION_QUESTIONS_FIELD: FieldDefinition');
    expect(s).toMatch(/key:\s*'questions'[\s\S]*?type:\s*'discussionQuestions'/);
  });

  it('defines REFLECTION_QUESTIONS_FIELD constant', () => {
    const s = src();
    expect(s).toContain('REFLECTION_QUESTIONS_FIELD: FieldDefinition');
    expect(s).toMatch(/key:\s*'questions'[\s\S]*?type:\s*'reflectionQuestions'/);
  });

  it('registers sortir-game with TITLE_FIELD + SORT_ITEMS_FIELD', () => {
    const s = src();
    expect(s).toMatch(/blockType:\s*'sortir-game'[\s\S]*?fields:\s*\[TITLE_FIELD,\s*SORT_ITEMS_FIELD\]/);
  });

  it('registers diskusi with TITLE + INTRO + DISCUSSION_QUESTIONS', () => {
    const s = src();
    expect(s).toMatch(/blockType:\s*'diskusi'[\s\S]*?fields:\s*\[TITLE_FIELD,\s*INTRO_FIELD,\s*DISCUSSION_QUESTIONS_FIELD\]/);
  });

  it('registers refleksi with TITLE + INTRO + REFLECTION_QUESTIONS', () => {
    const s = src();
    expect(s).toMatch(/blockType:\s*'refleksi'[\s\S]*?fields:\s*\[TITLE_FIELD,\s*INTRO_FIELD,\s*REFLECTION_QUESTIONS_FIELD\]/);
  });

  it('kuis registration unchanged from 07A (TITLE + QUESTIONS)', () => {
    const s = src();
    expect(s).toMatch(/blockType:\s*'kuis'[\s\S]*?fields:\s*\[TITLE_FIELD,\s*QUESTIONS_FIELD\]/);
  });
});

// ───────────────────────────────────────────────────────────────
// SortItemsFieldEditor.tsx — component contract
// ───────────────────────────────────────────────────────────────

describe('BATCH-07B: SortItemsFieldEditor — component contract', () => {
  const src = () =>
    readSrc('components/canva/mpi-workspace-v2/SortItemsFieldEditor.tsx');

  it('exports SortItemsFieldEditor + SortItemsValue + SortirKolom + SortirPoolItem', () => {
    const s = src();
    expect(s).toContain('export interface SortirKolom');
    expect(s).toContain('export interface SortirPoolItem');
    expect(s).toContain('export interface SortItemsValue');
    expect(s).toContain('export function SortItemsFieldEditor');
  });

  it('SortirKolom has id/label/color fields', () => {
    const s = src();
    expect(s).toMatch(/interface SortirKolom[\s\S]*?id:\s*string/);
    expect(s).toMatch(/interface SortirKolom[\s\S]*?label:\s*string/);
    expect(s).toMatch(/interface SortirKolom[\s\S]*?color:\s*string/);
  });

  it('SortirPoolItem has id/text/category fields', () => {
    const s = src();
    expect(s).toMatch(/interface SortirPoolItem[\s\S]*?id:\s*string/);
    expect(s).toMatch(/interface SortirPoolItem[\s\S]*?text:\s*string/);
    expect(s).toMatch(/interface SortirPoolItem[\s\S]*?category:\s*string/);
  });

  it('has data-testid="sortitems-field-editor" on root', () => {
    expect(src()).toContain('data-testid="sortitems-field-editor"');
  });

  it('has "Tambah Kategori" button with data-testid', () => {
    expect(src()).toContain('data-testid="sortitems-add-kolom-btn"');
  });

  it('has "Tambah Item" button with data-testid', () => {
    expect(src()).toContain('data-testid="sortitems-add-item-btn"');
  });

  it('renders kolom cards with per-card data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`sortitems-kolom-card-\$\{idx\}`\}/);
  });

  it('renders item cards with per-card data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`sortitems-item-card-\$\{idx\}`\}/);
  });

  it('has kolom label input with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`sortitems-kolom-label-\$\{idx\}`\}/);
  });

  it('has kolom color select with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`sortitems-kolom-color-\$\{idx\}`\}/);
  });

  it('has item text input with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`sortitems-item-text-\$\{idx\}`\}/);
  });

  it('has item category select with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`sortitems-item-category-\$\{idx\}`\}/);
  });

  it('has per-item delete button with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`sortitems-item-delete-\$\{idx\}`\}/);
  });

  it('has per-kolom delete button with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`sortitems-kolom-delete-\$\{idx\}`\}/);
  });

  it('has summary text with data-testid', () => {
    expect(src()).toContain('data-testid="sortitems-summary"');
  });

  it('normalizeValue safely handles missing/invalid input', () => {
    const s = src();
    expect(s).toContain('function normalizeValue');
    expect(s).toMatch(/Array\.isArray\(obj\.pool\) \? obj\.pool : \[\]/);
    expect(s).toMatch(/Array\.isArray\(obj\.kolom\) \? obj\.kolom : \[\]/);
  });

  it('handleDeleteKolom keeps at least 1 kolom (disabled when only 1)', () => {
    const s = src();
    expect(s).toContain('normalized.kolom.length <= 1');
    expect(s).toContain('disabled={normalized.kolom.length <= 1}');
  });

  it('handleDeleteKolom clears category on items referencing deleted kolom', () => {
    const s = src();
    expect(s).toContain('p.category === id');
    expect(s).toContain("category: ''");
  });

  it('COLOR_OPTIONS has 6 color tokens (y/c/g/p/o/r)', () => {
    const s = src();
    expect(s).toContain("value: 'y'");
    expect(s).toContain("value: 'c'");
    expect(s).toContain("value: 'g'");
    expect(s).toContain("value: 'p'");
    expect(s).toContain("value: 'o'");
    expect(s).toContain("value: 'r'");
  });

  it('all writes go through onChange prop (no direct store mutation)', () => {
    const s = src()
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(s).not.toContain('useCanvaStore');
    expect(s).not.toContain('useAuthoringStore');
    expect(s).not.toContain('updateSchemaBlock');
    expect(s).toContain('onChange({');
  });

  it('does NOT reference legacy editor/store names', () => {
    const s = src()
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(s).not.toContain('applyGuidedSchemaPatch');
    expect(s).not.toContain('useSchemaKuis');
  });
});

// ───────────────────────────────────────────────────────────────
// ReflectionQuestionsFieldEditor.tsx — component contract
// ───────────────────────────────────────────────────────────────

describe('BATCH-07B: ReflectionQuestionsFieldEditor — component contract', () => {
  const src = () =>
    readSrc('components/canva/mpi-workspace-v2/ReflectionQuestionsFieldEditor.tsx');

  it('exports ReflectionQuestionsFieldEditor + DiscussionQuestion + ReflectionQuestion + ReflectionMode', () => {
    const s = src();
    expect(s).toContain('export type ReflectionMode');
    expect(s).toContain('export interface DiscussionQuestion');
    expect(s).toContain('export interface ReflectionQuestion');
    expect(s).toContain('export function ReflectionQuestionsFieldEditor');
  });

  it('DiscussionQuestion has label/icon/teks/petunjuk fields', () => {
    const s = src();
    expect(s).toMatch(/interface DiscussionQuestion[\s\S]*?label:\s*string/);
    expect(s).toMatch(/interface DiscussionQuestion[\s\S]*?icon:\s*string/);
    expect(s).toMatch(/interface DiscussionQuestion[\s\S]*?teks:\s*string/);
    expect(s).toMatch(/interface DiscussionQuestion[\s\S]*?petunjuk:\s*string/);
  });

  it('ReflectionQuestion has teks/petunjuk fields (warna/icon optional)', () => {
    const s = src();
    expect(s).toMatch(/interface ReflectionQuestion[\s\S]*?teks:\s*string/);
    expect(s).toMatch(/interface ReflectionQuestion[\s\S]*?petunjuk:\s*string/);
    expect(s).toMatch(/interface ReflectionQuestion[\s\S]*?warna\?:\s*string/);
    expect(s).toMatch(/interface ReflectionQuestion[\s\S]*?icon\?:\s*string/);
  });

  it('ReflectionMode is "discussion" | "reflection"', () => {
    expect(src()).toMatch(/export type ReflectionMode = 'discussion' \| 'reflection'/);
  });

  it('accepts mode prop', () => {
    expect(src()).toContain('mode: ReflectionMode');
  });

  it('has data-testid for discussion mode (discussion-questions-editor)', () => {
    expect(src()).toContain("'discussion-questions-editor'");
  });

  it('has data-testid for reflection mode (reflection-questions-editor)', () => {
    expect(src()).toContain("'reflection-questions-editor'");
  });

  it('has "Tambah" add button with data-testid', () => {
    expect(src()).toContain('data-testid="reflection-questions-add-btn"');
  });

  it('renders per-question card with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`reflection-question-card-\$\{qIdx\}`\}/);
  });

  it('has per-question text textarea with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`reflection-question-text-\$\{qIdx\}`\}/);
  });

  it('has per-question hint textarea with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`reflection-question-hint-\$\{qIdx\}`\}/);
  });

  it('has per-question icon input with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`reflection-question-icon-\$\{qIdx\}`\}/);
  });

  it('has per-question color select with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`reflection-question-color-\$\{qIdx\}`\}/);
  });

  it('has per-question label input (discussion mode only) with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`reflection-question-label-\$\{qIdx\}`\}/);
  });

  it('has per-question delete button with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`reflection-question-delete-\$\{qIdx\}`\}/);
  });

  it('has summary text with data-testid', () => {
    expect(src()).toContain('data-testid="reflection-questions-summary"');
  });

  it('normalizeDiscussionQuestions safely handles invalid input', () => {
    const s = src();
    expect(s).toContain('function normalizeDiscussionQuestions');
    expect(s).toMatch(/if \(!Array\.isArray\(value\)\) return \[\]/);
  });

  it('normalizeReflectionQuestions safely handles invalid input', () => {
    const s = src();
    expect(s).toContain('function normalizeReflectionQuestions');
    expect(s).toMatch(/if \(!Array\.isArray\(value\)\) return \[\]/);
  });

  it('makeBlankQuestion returns different shape per mode', () => {
    const s = src();
    expect(s).toContain('function makeBlankQuestion');
    // Discussion mode: has label + color
    expect(s).toMatch(/mode === 'discussion'[\s\S]*?label:[\s\S]*?color:/);
    // Reflection mode: has warna (no label)
    expect(s).toMatch(/warna:\s*'c'/);
  });

  it('handleDelete keeps at least 1 question (replaces with blank if only 1)', () => {
    const s = src();
    expect(s).toContain('questions.length <= 1');
    expect(s).toContain('onChange([makeBlankQuestion(mode)])');
  });

  it('discussion mode uses "color" field name', () => {
    const s = src();
    expect(s).toContain("{ color: e.target.value }");
  });

  it('reflection mode uses "warna" field name', () => {
    const s = src();
    expect(s).toContain("{ warna: e.target.value }");
  });

  it('all writes go through onChange prop (no direct store mutation)', () => {
    const s = src();
    expect(s).not.toContain('useCanvaStore');
    expect(s).not.toContain('useAuthoringStore');
    expect(s).not.toContain('updateSchemaBlock');
    expect(s).toContain('onChange(');
  });

  it('does NOT reference legacy editor/store names', () => {
    const s = src()
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(s).not.toContain('applyGuidedSchemaPatch');
    expect(s).not.toContain('KuisTab');
  });
});

// ───────────────────────────────────────────────────────────────
// WorkspaceInspector.tsx — 3 new field rendering branches
// ───────────────────────────────────────────────────────────────

describe('BATCH-07B: WorkspaceInspector — 3 new field rendering branches', () => {
  const src = () =>
    readSrc('components/canva/mpi-workspace-v2/WorkspaceInspector.tsx');

  it('imports SortItemsFieldEditor + SortItemsValue', () => {
    const s = src();
    expect(s).toContain("from './SortItemsFieldEditor'");
    expect(s).toContain('SortItemsFieldEditor');
    expect(s).toContain('SortItemsValue');
  });

  it('imports ReflectionQuestionsFieldEditor', () => {
    expect(src()).toContain("from './ReflectionQuestionsFieldEditor'");
  });

  it('has handleSortItemsChange callback', () => {
    expect(src()).toContain('handleSortItemsChange');
  });

  it('handleSortItemsChange patches both pool + kolom via updateSchemaBlock', () => {
    const s = src();
    expect(s).toMatch(/handleSortItemsChange[\s\S]*?updateSchemaBlock[\s\S]*?pool: value\.pool,\s*kolom: value\.kolom/);
  });

  it('has handleReflectionQuestionsChange callback', () => {
    expect(src()).toContain('handleReflectionQuestionsChange');
  });

  it('renders SortItemsFieldEditor when field.type === "sortItems"', () => {
    const s = src();
    expect(s).toContain("field.type === 'sortItems'");
    expect(s).toContain('<SortItemsFieldEditor');
  });

  it('passes selectedBlock (not blockFields) as value to SortItemsFieldEditor', () => {
    expect(src()).toContain('value={selectedBlock}');
  });

  it('renders ReflectionQuestionsFieldEditor for discussionQuestions', () => {
    const s = src();
    expect(s).toContain("field.type === 'discussionQuestions'");
    expect(s).toContain('mode="discussion"');
  });

  it('renders ReflectionQuestionsFieldEditor for reflectionQuestions', () => {
    const s = src();
    expect(s).toContain("field.type === 'reflectionQuestions'");
    expect(s).toContain('mode="reflection"');
  });

  it('existing questions field rendering (kuis) still present', () => {
    expect(src()).toContain("field.type === 'questions'");
  });

  it('existing text/textarea rendering still present', () => {
    const s = src();
    expect(s).toMatch(/field\.type === 'textarea'/);
    expect(s).toContain('type="text"');
  });
});

// ───────────────────────────────────────────────────────────────
// E2E spec — hard assert (no soft fallback)
// ───────────────────────────────────────────────────────────────

describe('BATCH-07B: E2E spec — hard assert (no soft fallback)', () => {
  const src = () =>
    readSrc('../e2e/v7b-interaction-editor-closeout.spec.ts');

  it('does NOT contain soft fallback "if inspectorVisible" pattern', () => {
    const s = src();
    // The old soft fallback pattern was:
    //   if (inspectorVisible) { ... } else { console.log(...) }
    // Hard assert pattern uses toBeVisible() without if-guard
    expect(s).not.toContain('Inspector did not auto-open');
    expect(s).not.toContain('Inspector not visible — skipping');
    expect(s).not.toContain('QuestionsFieldEditor not visible — skipping');
    expect(s).not.toContain('editor not visible — skipping');
  });

  it('uses toBeVisible with timeout for hard assert on editor', () => {
    const s = src();
    expect(s).toMatch(/await expect\([^)]+\)\.toBeVisible\(\{\s*timeout:\s*\d+\s*\}\)/);
  });

  it('has hard assert for "Edit Kuis" heading', () => {
    expect(src()).toContain("locator('h2:has-text(\"Edit Kuis\")')");
  });

  it('has hard assert for "Edit Game Sortir" heading', () => {
    expect(src()).toContain("locator('h2:has-text(\"Edit Game Sortir\")')");
  });

  it('has hard assert for "Edit Diskusi" heading', () => {
    expect(src()).toContain("locator('h2:has-text(\"Edit Diskusi\")')");
  });

  it('has hard assert for "Edit Refleksi" heading', () => {
    expect(src()).toContain("locator('h2:has-text(\"Edit Refleksi\")')");
  });

  it('has test for sortir game editor', () => {
    expect(src()).toContain('sortir game editor:');
  });

  it('has test for diskusi editor', () => {
    expect(src()).toContain('diskusi editor:');
  });

  it('has test for refleksi editor', () => {
    expect(src()).toContain('refleksi editor:');
  });

  it('has test for kuis editor with hard assert', () => {
    expect(src()).toContain('kuis editor: QuestionsFieldEditor appears with hard assert');
  });

  it('uses helper functions setupAndNavigateToPage + clickBlockByType', () => {
    const s = src();
    expect(s).toContain('async function setupAndNavigateToPage');
    expect(s).toContain('async function clickBlockByType');
  });

  it('clickBlockByType uses data-block-type selector (not generic canvas click)', () => {
    expect(src()).toContain('data-block-type="${blockType}"');
  });

  it('clickBlockByType hard-asserts block exists before clicking', () => {
    expect(src()).toMatch(/await expect\(block[\s\S]*?\)\.toBeVisible/);
  });
});
