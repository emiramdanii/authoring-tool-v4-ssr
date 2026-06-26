// ═══════════════════════════════════════════════════════════════
// BATCH-07: INTERACTION-EDITOR-01 — Tests
// ═══════════════════════════════════════════════════════════════
// Source-audit tests (read file + assert specific patterns present)
// + behavior tests for QuestionsFieldEditor normalize logic.
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ───────────────────────────────────────────────────────────────
// inspector-field-registry.ts — questions field type
// ───────────────────────────────────────────────────────────────

describe('BATCH-07: inspector-field-registry — questions field type', () => {
  const src = () =>
    readFileSync(
      resolve(__dirname, '../components/canva/mpi-workspace-v2/inspector-field-registry.ts'),
      'utf-8',
    );

  it('FieldType union includes "questions"', () => {
    // BATCH-07B: FieldType is now multi-line union; use [\s\S] to match across lines
    expect(src()).toMatch(/export type FieldType =[\s\S]*?'questions'/);
  });

  it('defines QUESTIONS_FIELD constant with key "questions" and type "questions"', () => {
    const s = src();
    expect(s).toContain('QUESTIONS_FIELD: FieldDefinition');
    expect(s).toMatch(/key:\s*'questions'/);
    expect(s).toMatch(/type:\s*'questions'/);
  });

  it('registers kuis block with TITLE_FIELD + QUESTIONS_FIELD', () => {
    const s = src();
    expect(s).toMatch(/blockType:\s*'kuis'[\s\S]*?fields:\s*\[TITLE_FIELD,\s*QUESTIONS_FIELD\]/);
  });

  it('QUESTIONS_FIELD has helpText explaining the editor', () => {
    expect(src()).toMatch(/helpText:\s*'Klik "Tambah Pertanyaan"/);
  });
});

// ───────────────────────────────────────────────────────────────
// WorkspaceInspector.tsx — questions field rendering
// ───────────────────────────────────────────────────────────────

describe('BATCH-07: WorkspaceInspector — questions field rendering', () => {
  const src = () =>
    readFileSync(
      resolve(__dirname, '../components/canva/mpi-workspace-v2/WorkspaceInspector.tsx'),
      'utf-8',
    );

  it('imports QuestionsFieldEditor + KuisQuestion type', () => {
    const s = src();
    expect(s).toContain("from './QuestionsFieldEditor'");
    expect(s).toContain('QuestionsFieldEditor');
    expect(s).toContain('KuisQuestion');
  });

  it('has handleQuestionsChange callback', () => {
    expect(src()).toContain('handleQuestionsChange');
  });

  it('handleQuestionsChange routes through updateSchemaBlock', () => {
    const s = src();
    expect(s).toMatch(/handleQuestionsChange[\s\S]*?updateSchemaBlock[\s\S]*?questions/);
  });

  it('renders QuestionsFieldEditor when field.type === "questions"', () => {
    const s = src();
    expect(s).toContain("field.type === 'questions'");
    expect(s).toContain('<QuestionsFieldEditor');
  });

  it('passes blockFields[field.key] as value to QuestionsFieldEditor', () => {
    expect(src()).toContain('value={blockFields[field.key]}');
  });

  it('passes handleQuestionsChange as onChange to QuestionsFieldEditor', () => {
    expect(src()).toContain('onChange={handleQuestionsChange}');
  });

  it('does NOT break existing text/textarea field rendering', () => {
    const s = src();
    // Both text and textarea paths must still exist
    expect(s).toMatch(/field\.type === 'textarea'/);
    expect(s).toContain('type="text"');
  });
});

// ───────────────────────────────────────────────────────────────
// QuestionsFieldEditor.tsx — component contract
// ───────────────────────────────────────────────────────────────

describe('BATCH-07: QuestionsFieldEditor — component contract', () => {
  const src = () =>
    readFileSync(
      resolve(__dirname, '../components/canva/mpi-workspace-v2/QuestionsFieldEditor.tsx'),
      'utf-8',
    );

  it('exports QuestionsFieldEditor + KuisQuestion', () => {
    const s = src();
    expect(s).toContain('export interface KuisQuestion');
    expect(s).toContain('export function QuestionsFieldEditor');
  });

  it('KuisQuestion interface has q/opts/ans/ex fields', () => {
    const s = src();
    expect(s).toMatch(/interface KuisQuestion[\s\S]*?q:\s*string/);
    expect(s).toMatch(/interface KuisQuestion[\s\S]*?opts:\s*string\[\]/);
    expect(s).toMatch(/interface KuisQuestion[\s\S]*?ans:\s*number/);
    expect(s).toMatch(/interface KuisQuestion[\s\S]*?ex:\s*string/);
  });

  it('has data-testid="questions-field-editor" on root', () => {
    expect(src()).toContain('data-testid="questions-field-editor"');
  });

  it('has "Tambah Pertanyaan" button with data-testid="questions-add-btn"', () => {
    const s = src();
    expect(s).toContain('data-testid="questions-add-btn"');
    expect(s).toContain('Tambah Pertanyaan');
  });

  it('renders 4 options A/B/C/D per question', () => {
    const s = src();
    expect(s).toContain("LETTERS = ['A', 'B', 'C', 'D']");
    expect(s).toContain('OPTION_COUNT = 4');
  });

  it('uses radio inputs for answer selection (one correct option)', () => {
    const s = src();
    expect(s).toContain('type="radio"');
    expect(s).toMatch(/name=\{`q-\$\{qIdx\}-ans`\}/);
  });

  it('has per-question delete button with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`question-delete-\$\{qIdx\}`\}/);
  });

  it('has per-question text textarea with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`question-text-\$\{qIdx\}`\}/);
  });

  it('has per-question explanation textarea with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`question-explanation-\$\{qIdx\}`\}/);
  });

  it('has per-option input with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`question-\$\{qIdx\}-opt-\$\{optIdx\}`\}/);
  });

  it('has answer radio with data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`question-\$\{qIdx\}-ans-\$\{optIdx\}`\}/);
  });

  it('has summary text showing total + filled count', () => {
    expect(src()).toContain('data-testid="questions-summary"');
    expect(src()).toContain('terisi');
  });

  it('normalizeQuestions handles missing/invalid input safely', () => {
    const s = src();
    expect(s).toContain('function normalizeQuestions');
    // Must check Array.isArray
    expect(s).toMatch(/if \(!Array\.isArray\(value\)\) return \[\]/);
    // Must default opts to 4 empty strings
    expect(s).toContain("Array.from({ length: OPTION_COUNT }");
  });

  it('makeBlankQuestion creates question with 4 empty opts and ans=0', () => {
    const s = src();
    expect(s).toContain('function makeBlankQuestion');
    expect(s).toMatch(/opts:\s*\['', '', '', ''\]/);
    expect(s).toMatch(/ans:\s*0/);
  });

  it('handleDelete keeps at least 1 question (replaces with blank if only 1)', () => {
    const s = src();
    expect(s).toContain('questions.length <= 1');
    expect(s).toContain('onChange([makeBlankQuestion()])');
  });

  it('does NOT reference any legacy editor/store names', () => {
    const s = src();
    // Strip comments
    const stripped = s
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    expect(stripped).not.toContain('useAuthoringStore');
    expect(stripped).not.toContain('KuisTab');
    expect(stripped).not.toContain('useSchemaKuis');
    expect(stripped).not.toContain('applyGuidedSchemaPatch');
  });

  it('all writes go through onChange prop (no direct store mutation)', () => {
    const s = src();
    // Must not import any store
    expect(s).not.toContain('useCanvaStore');
    expect(s).not.toContain('useAuthoringStore');
    // Must call onChange for add/delete/edit
    expect(s).toContain('onChange([');
    expect(s).toContain('onChange(next)');
  });
});

// ───────────────────────────────────────────────────────────────
// SILSE_INTERACTION_REGISTRY.md — kuis pattern documented
// ───────────────────────────────────────────────────────────────

describe('BATCH-07: SILSE_INTERACTION_REGISTRY — kuis pattern documented', () => {
  const src = () =>
    readFileSync(
      resolve(__dirname, '../../SILSE_INTERACTION_REGISTRY.md'),
      'utf-8',
    );

  it('documents kuis block type with completionType=answer', () => {
    const s = src();
    expect(s).toMatch(/\| `kuis` \| answer \|/);
  });

  it('documents Answer Pattern (3.1) with question schema', () => {
    const s = src();
    expect(s).toContain('### 3.1 Answer Pattern (Kuis)');
    expect(s).toContain('"type": "kuis"');
    expect(s).toContain('"questions":');
    expect(s).toContain('"opts":');
    expect(s).toContain('"ans":');
    expect(s).toContain('"ex":');
  });

  it('documents reportScore flow for kuis', () => {
    const s = src();
    expect(s).toContain('reportScore');
    expect(s).toMatch(/score:\s*correct \? 1 : 0/);
  });
});
