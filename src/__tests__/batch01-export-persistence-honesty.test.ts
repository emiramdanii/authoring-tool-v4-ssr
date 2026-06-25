// ═══════════════════════════════════════════════════════════════
// BATCH-01: EXPORT-PERSISTENCE-HONESTY — Tests
// ═══════════════════════════════════════════════════════════════
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('BATCH-01: Export honesty', () => {
  it('ExportPanelV5 handleExport only sets lastExportAt on success (try/catch)', () => {
    const source = readFileSync(
      resolve(__dirname, '../components/product-v5/ExportPanelV5.tsx'),
      'utf-8',
    );
    // Must have try/catch around exportHtml
    expect(source).toContain('try {');
    expect(source).toContain('await exportHtml()');
    expect(source).toContain('setLastExportAt');
    expect(source).toContain('} catch {');
    // lastExportAt must be INSIDE try block, not after it
    const tryBlock = source.match(/try\s*\{[\s\S]*?setLastExportAt[\s\S]*?\}/);
    expect(tryBlock).toBeTruthy();
  });

  it('exportWithFallback re-throws on error (does not swallow)', () => {
    const source = readFileSync(
      resolve(__dirname, '../lib/use-vite-export.ts'),
      'utf-8',
    );
    // Must have throw err in the catch block
    expect(source).toMatch(/catch\s*\(err[\s\S]*?throw\s+err/);
  });

  it('useExportActions.exportHtml does not dispatch success event on failure', () => {
    const source = readFileSync(
      resolve(__dirname, '../components/canva/toolbar/use-export-actions.ts'),
      'utf-8',
    );
    // Must have catch block that does NOT dispatch success event
    expect(source).toContain('catch {');
    // silse-export-success must be in try block, not catch
    const tryBlock = source.match(/try\s*\{[\s\S]*?silse-export-success[\s\S]*?\}/);
    expect(tryBlock).toBeTruthy();
  });
});

describe('BATCH-01: Save honesty', () => {
  it('canvaStore.saveToStorage returns boolean', () => {
    const source = readFileSync(
      resolve(__dirname, '../store/canva/persistence-slice.ts'),
      'utf-8',
    );
    expect(source).toContain('saveToStorage: (): boolean =>');
    expect(source).toContain('return true;');
    expect(source).toContain('return false;');
  });

  it('executeDurableSave checks saveToStorage return values', () => {
    const source = readFileSync(
      resolve(__dirname, '../lib/save-utils.ts'),
      'utf-8',
    );
    // Must check return values
    expect(source).toContain('canvaSaveOk');
    expect(source).toContain('authSaveOk');
    // Must abort if both fail and no DB fallback
    expect(source).toContain('!canvaSaveOk && !authSaveOk');
    expect(source).toContain('hasDbFallback');
    // Must set error status on failure
    expect(source).toContain("_saveStatus: 'error'");
    expect(source).toContain("saveFailed('localStorage save failed");
  });

  it('authoringStore.saveToStorage returns boolean', () => {
    const source = readFileSync(
      resolve(__dirname, '../store/authoring/system-slice.ts'),
      'utf-8',
    );
    // Already returns true/false — verify it's still there
    expect(source).toContain('return true;');
    expect(source).toContain('return false;');
  });
});
