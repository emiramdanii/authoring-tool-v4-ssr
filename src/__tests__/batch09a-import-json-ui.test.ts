// ═══════════════════════════════════════════════════════════════
// BATCH-09A: IMPORT-JSON-UI-LIGHT — Tests
// ═══════════════════════════════════════════════════════════════
// Source-audit tests for the Import JSON panel + Dashboard trigger +
// ProductShell wiring.
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const readSrc = (rel: string) =>
  readFileSync(resolve(__dirname, '..', rel), 'utf-8');

// ───────────────────────────────────────────────────────────────
// ImportJsonPanelV5.tsx — component contract
// ───────────────────────────────────────────────────────────────

describe('BATCH-09A: ImportJsonPanelV5 — component contract', () => {
  const src = () =>
    readSrc('components/product-v5/ImportJsonPanelV5.tsx');

  it('exports ImportJsonPanelV5 component + props interface', () => {
    const s = src();
    expect(s).toContain('export interface ImportJsonPanelV5Props');
    expect(s).toContain('export function ImportJsonPanelV5');
  });

  it('accepts open + onClose props', () => {
    const s = src();
    expect(s).toContain('open: boolean');
    expect(s).toContain('onClose: () => void');
  });

  it('returns null when open=false (no render)', () => {
    expect(src()).toMatch(/if \(!open\) return null/);
  });

  it('imports validateSilseImportJsonString from silse-import-validator', () => {
    const s = src();
    expect(s).toContain("from '@/lib/silse-import-validator'");
    expect(s).toContain('validateSilseImportJsonString');
  });

  it('does NOT import any store (no mutation)', () => {
    const s = src()
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(s).not.toContain('useCanvaStore');
    expect(s).not.toContain('useAuthoringStore');
    expect(s).not.toContain('updateSchemaBlock');
    expect(s).not.toContain('applyGuidedSchemaPatch');
    expect(s).not.toContain('setPages');
    expect(s).not.toContain('setState');
  });

  it('has data-testid="import-json-panel-v5" on root dialog', () => {
    expect(src()).toContain('data-testid="import-json-panel-v5"');
  });

  it('has role="dialog" + aria-modal="true" + aria-labelledby', () => {
    const s = src();
    expect(s).toContain('role="dialog"');
    expect(s).toContain('aria-modal="true"');
    expect(s).toContain('aria-labelledby="import-json-panel-title"');
  });

  it('has JSON textarea with data-testid', () => {
    expect(src()).toContain('data-testid="import-json-textarea"');
  });

  it('has Validasi button with data-testid', () => {
    expect(src()).toContain('data-testid="import-json-validate-btn"');
  });

  it('has Bersihkan (clear) button with data-testid', () => {
    expect(src()).toContain('data-testid="import-json-clear-btn"');
  });

  it('has "Salin JSON Valid" copy button with data-testid', () => {
    expect(src()).toContain('data-testid="import-json-copy-valid-btn"');
  });

  it('has "Salin JSON Invalid" copy button with data-testid', () => {
    expect(src()).toContain('data-testid="import-json-copy-invalid-btn"');
  });

  it('has result display with data-testid + data-valid attribute', () => {
    const s = src();
    expect(s).toContain('data-testid="import-json-result"');
    expect(s).toMatch(/data-valid=\{isValid \? 'true' : 'false'\}/);
  });

  it('has result title with data-testid', () => {
    expect(src()).toContain('data-testid="import-json-result-title"');
  });

  it('has result message with data-testid', () => {
    expect(src()).toContain('data-testid="import-json-result-message"');
  });

  it('has result reason with data-testid (for invalid)', () => {
    expect(src()).toContain('data-testid="import-json-result-reason"');
  });

  it('has result path with data-testid (for invalid)', () => {
    expect(src()).toContain('data-testid="import-json-result-path"');
  });

  it('has all-errors expandable details with data-testid', () => {
    expect(src()).toContain('data-testid="import-json-result-all-errors"');
  });

  it('has page count summary for valid result', () => {
    expect(src()).toContain('data-testid="import-json-result-summary-pages"');
  });

  it('has judul summary for valid result', () => {
    expect(src()).toContain('data-testid="import-json-result-summary-judul"');
  });

  it('has character count display with data-testid', () => {
    expect(src()).toContain('data-testid="import-json-char-count"');
  });

  it('has Escape key handler to close modal', () => {
    expect(src()).toMatch(/e\.key === 'Escape'/);
  });

  it('has SAMPLE_VALID_JSON constant', () => {
    expect(src()).toContain('SAMPLE_VALID_JSON');
  });

  it('has SAMPLE_INVALID_JSON constant', () => {
    expect(src()).toContain('SAMPLE_INVALID_JSON');
  });

  it('sample valid JSON contains schemaVersion=1 + meta + canva.pages', () => {
    const s = src();
    expect(s).toContain('"schemaVersion": 1');
    expect(s).toContain('"judulPertemuan"');
    expect(s).toContain('"canva"');
    expect(s).toContain('"pages"');
  });

  it('sample invalid JSON contains schemaVersion=99 (future version)', () => {
    const s = src();
    expect(s).toContain('"schemaVersion": 99');
  });

  it('validates via validateSilseImportJsonString (not direct store mutation)', () => {
    expect(src()).toMatch(/validateSilseImportJsonString\(jsonInput\)/);
  });

  it('does NOT have an "Import" or "Apply to Store" button', () => {
    // Senior constraint: "Belum apply ke store"
    const s = src();
    expect(s).not.toContain('Import ke Proyek');
    expect(s).not.toContain('Apply to Store');
    expect(s).not.toContain('applyToStore');
    expect(s).not.toContain('loadFromJson');
  });

  it('handles empty input gracefully (shows message, not crash)', () => {
    expect(src()).toMatch(/if \(!jsonInput\.trim\(\)\)/);
  });

  it('uses clipboard API for copy (with fallback)', () => {
    const s = src();
    expect(s).toContain('navigator.clipboard.writeText');
  });

  it('has loading state "Memvalidasi..." during validation', () => {
    expect(src()).toContain('Memvalidasi...');
  });

  it('does NOT reference any legacy editor names', () => {
    const s = src()
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(s).not.toContain('MpiEditorShell');
    expect(s).not.toContain('CanvaBuilder');
    expect(s).not.toContain('AdvancedEditor');
    expect(s).not.toContain('AuthoringTool');
    expect(s).not.toContain('KuisTab');
  });
});

// ───────────────────────────────────────────────────────────────
// DashboardV5.tsx — Import JSON trigger button
// ───────────────────────────────────────────────────────────────

describe('BATCH-09A: DashboardV5 — Import JSON trigger', () => {
  const src = () =>
    readSrc('components/product-v5/DashboardV5.tsx');

  it('accepts optional onOpenImport prop', () => {
    expect(src()).toContain('onOpenImport?: () => void');
  });

  it('renders Import JSON button only when onOpenImport is provided', () => {
    const s = src();
    expect(s).toContain('onOpenImport && (');
  });

  it('has data-testid="dashboard-import-json-btn"', () => {
    expect(src()).toContain('data-testid="dashboard-import-json-btn"');
  });

  it('button has aria-label="Validasi JSON import"', () => {
    expect(src()).toContain('aria-label="Validasi JSON import"');
  });

  it('does NOT render the button unconditionally (respects optional prop)', () => {
    // The {onOpenImport && (...)} pattern means no button when prop is undefined
    expect(src()).toMatch(/\{onOpenImport && \([\s\S]*?dashboard-import-json-btn/);
  });
});

// ───────────────────────────────────────────────────────────────
// ProductShell.tsx — Import modal wiring
// ───────────────────────────────────────────────────────────────

describe('BATCH-09A: ProductShell — Import modal wiring', () => {
  const src = () =>
    readSrc('components/product-v5/ProductShell.tsx');

  it('imports ImportJsonPanelV5', () => {
    expect(src()).toContain("import { ImportJsonPanelV5 } from './ImportJsonPanelV5'");
  });

  it('has importPanelOpen state', () => {
    expect(src()).toContain('importPanelOpen');
  });

  it('has openImportPanel + closeImportPanel callbacks', () => {
    const s = src();
    expect(s).toContain('const openImportPanel = useCallback');
    expect(s).toContain('const closeImportPanel = useCallback');
  });

  it('passes onOpenImport={openImportPanel} to DashboardV5', () => {
    expect(src()).toContain('onOpenImport={openImportPanel}');
  });

  it('renders ImportJsonPanelV5 with open + onClose props', () => {
    const s = src();
    expect(s).toContain('<ImportJsonPanelV5');
    expect(s).toContain('open={importPanelOpen}');
    expect(s).toContain('onClose={closeImportPanel}');
  });

  it('renders ImportJsonPanelV5 OUTSIDE the view switch (modal overlay)', () => {
    // The modal should be after all {view === '...'} blocks, before </div>
    const s = src();
    // Find position of ImportJsonPanelV5 vs last view block
    const lastViewIdx = s.lastIndexOf("view === 'export'");
    const importIdx = s.indexOf('<ImportJsonPanelV5');
    expect(importIdx, 'ImportJsonPanelV5 must come after last view block').toBeGreaterThan(lastViewIdx);
  });

  it('does NOT add "import" to ProductView union (modal, not view)', () => {
    // Senior constraint: import is a modal, not a persisted view
    const viewLine = src().match(/export type ProductView =[^;]+/)?.[0] ?? '';
    expect(viewLine).not.toContain("'import'");
  });
});

// ───────────────────────────────────────────────────────────────
// silse-import-validator.ts — P3 doc fix (Batch 08 carryover)
// ───────────────────────────────────────────────────────────────

describe('BATCH-09A: P3 fix — schemaVersion comment consistency', () => {
  const src = () =>
    readSrc('lib/silse-import-validator.ts');

  it('header comment says "optional for legacy imports"', () => {
    expect(src()).toMatch(/schemaVersion optional for legacy imports/);
  });

  it('does NOT say "must be present" for schemaVersion', () => {
    // The old inconsistent comment is gone
    const s = src();
    expect(s).not.toMatch(/schemaVersion must be present/);
    expect(s).not.toMatch(/Must be present, numeric, finite, positive/);
  });

  it('layer 1 comment says "Optional for legacy imports"', () => {
    expect(src()).toMatch(/Layer 1: schemaVersion[\s\S]*?Optional for legacy imports/);
  });
});
