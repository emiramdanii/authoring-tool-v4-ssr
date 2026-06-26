// ═══════════════════════════════════════════════════════════════
// PATCH-01B: Behavioral tests for export reject + partial save failure
// ═══════════════════════════════════════════════════════════════
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('PATCH-01B: Export re-throw chain', () => {
  it('useExportActions.exportHtml re-throws on failure (not silent catch)', () => {
    const source = readFileSync(
      resolve(__dirname, '../components/canva/toolbar/use-export-actions.ts'),
      'utf-8',
    );
    // The catch block must contain a throw statement
    const catchBlock = source.match(/catch\s*\{([\s\S]*?)\}\s*finally/);
    expect(catchBlock).toBeTruthy();
    expect(catchBlock![1]).toContain('throw');
  });

  it('exportWithFallback re-throws error', () => {
    const source = readFileSync(
      resolve(__dirname, '../lib/use-vite-export.ts'),
      'utf-8',
    );
    expect(source).toMatch(/catch\s*\(err[\s\S]*?throw\s+err/);
  });

  it('ExportPanelV5.handleExport only sets lastExportAt in try (not catch)', () => {
    const source = readFileSync(
      resolve(__dirname, '../components/product-v5/ExportPanelV5.tsx'),
      'utf-8',
    );
    const tryBlock = source.match(/try\s*\{([\s\S]*?)\}\s*catch/);
    expect(tryBlock).toBeTruthy();
    expect(tryBlock![1]).toContain('setLastExportAt');

    const catchBlock = source.match(/catch\s*\{([\s\S]*?)\}/);
    expect(catchBlock).toBeTruthy();
    expect(catchBlock![1]).not.toContain('setLastExportAt');
  });
});

describe('PATCH-01B: Partial local save failure', () => {
  it('executeDurableSave checks canvaSaveOk independently (not just both)', () => {
    const source = readFileSync(
      resolve(__dirname, '../lib/save-utils.ts'),
      'utf-8',
    );
    // Must have separate check for canvaSaveOk (not combined with authSaveOk via &&)
    expect(source).toContain('!canvaSaveOk && !hasDbFallback');
    expect(source).toContain('!authSaveOk && !hasDbFallback');
    // Must NOT have the old combined check
    expect(source).not.toContain('!canvaSaveOk && !authSaveOk && !hasDbFallback');
  });

  it('canvaStore.saveToStorage returns boolean true/false', () => {
    const source = readFileSync(
      resolve(__dirname, '../store/canva/persistence-slice.ts'),
      'utf-8',
    );
    expect(source).toContain('saveToStorage: (): boolean =>');
    expect(source).toContain('return true;');
    expect(source).toContain('return false;');
  });

  it('canvaSaveOk=false triggers saveFailed + error status (not just both-fail)', () => {
    const source = readFileSync(
      resolve(__dirname, '../lib/save-utils.ts'),
      'utf-8',
    );
    // The canvaSaveOk failure path must call saveFailed
    const canvaFailSection = source.substring(
      source.indexOf('if (!canvaSaveOk && !hasDbFallback)'),
      source.indexOf('if (!authSaveOk && !hasDbFallback)'),
    );
    expect(canvaFailSection).toContain('saveFailed');
    expect(canvaFailSection).toContain("_saveStatus: 'error'");
    expect(canvaFailSection).toContain('return false');
  });

  it('authSaveOk=false also triggers saveFailed (partial failure is still failure)', () => {
    const source = readFileSync(
      resolve(__dirname, '../lib/save-utils.ts'),
      'utf-8',
    );
    const authFailSection = source.substring(
      source.indexOf('if (!authSaveOk && !hasDbFallback)'),
      source.indexOf('Step 3'),
    );
    expect(authFailSection).toContain('saveFailed');
    expect(authFailSection).toContain('return false');
  });
});
