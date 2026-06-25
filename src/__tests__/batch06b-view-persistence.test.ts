// ═══════════════════════════════════════════════════════════════
// BATCH-06B: TEACHER-WORKFLOW-UX-CLOSEOUT — Tests
// ═══════════════════════════════════════════════════════════════
// Covers:
//   1. v5-view-persistence.ts — restore/persist contract
//   2. ProductShell — view restore + safety net
//   3. DashboardV5 — workflow guidance text
//   4. No legacy route references anywhere in V5 product route
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  persistLastView,
  restoreLastView,
  clearLastView,
  __TEST__,
} from '@/lib/v5-view-persistence';

// ───────────────────────────────────────────────────────────────
// Section 1: v5-view-persistence.ts — contract tests
// ───────────────────────────────────────────────────────────────

describe('BATCH-06B: v5-view-persistence — restore/persist contract', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
  });

  describe('persistLastView', () => {
    it('persists a valid view to localStorage', () => {
      persistLastView('editor');
      expect(window.localStorage.getItem(__TEST__.STORAGE_KEY)).toBe('editor');
    });

    it('persists all 5 safe views', () => {
      for (const v of __TEST__.SAFE_VIEWS) {
        persistLastView(v);
        expect(window.localStorage.getItem(__TEST__.STORAGE_KEY)).toBe(v);
      }
    });

    it('refuses to persist an invalid view (no-op, no throw)', () => {
      persistLastView('lengkap' as any);
      expect(window.localStorage.getItem(__TEST__.STORAGE_KEY)).toBeNull();
    });

    it('refuses to persist legacy editor names', () => {
      // These are legacy editor/route names that must NEVER be persisted
      const legacyNames = ['mpi-editor', 'canva-builder', 'advanced', 'teacherMode', 'lengkap'];
      for (const name of legacyNames) {
        persistLastView(name as any);
        expect(window.localStorage.getItem(__TEST__.STORAGE_KEY)).toBeNull();
      }
    });

    it('does not throw on unknown input type', () => {
      expect(() => persistLastView(undefined as any)).not.toThrow();
      expect(() => persistLastView(null as any)).not.toThrow();
      expect(() => persistLastView(123 as any)).not.toThrow();
      expect(() => persistLastView({ view: 'editor' } as any)).not.toThrow();
    });
  });

  describe('restoreLastView — happy path', () => {
    it('returns dashboard when no stored value', () => {
      expect(restoreLastView(0)).toBe('dashboard');
      expect(restoreLastView(5)).toBe('dashboard');
    });

    it('restores dashboard view regardless of page count', () => {
      persistLastView('dashboard');
      expect(restoreLastView(0)).toBe('dashboard');
      expect(restoreLastView(5)).toBe('dashboard');
    });

    it('restores template view regardless of page count', () => {
      persistLastView('template');
      expect(restoreLastView(0)).toBe('template');
      expect(restoreLastView(5)).toBe('template');
    });

    it('restores editor view when pages > 0', () => {
      persistLastView('editor');
      expect(restoreLastView(5)).toBe('editor');
    });

    it('restores preview view when pages > 0', () => {
      persistLastView('preview');
      expect(restoreLastView(5)).toBe('preview');
    });

    it('restores export view when pages > 0', () => {
      persistLastView('export');
      expect(restoreLastView(5)).toBe('export');
    });
  });

  describe('restoreLastView — safe fallback (pages = 0)', () => {
    it('falls back to dashboard when stored view is editor but pages = 0', () => {
      persistLastView('editor');
      expect(restoreLastView(0)).toBe('dashboard');
    });

    it('falls back to dashboard when stored view is preview but pages = 0', () => {
      persistLastView('preview');
      expect(restoreLastView(0)).toBe('dashboard');
    });

    it('falls back to dashboard when stored view is export but pages = 0', () => {
      persistLastView('export');
      expect(restoreLastView(0)).toBe('dashboard');
    });

    it('does NOT clear the stored value on fallback (so it can restore later if pages load)', () => {
      // Note: current impl does NOT clear on pages=0 fallback, only on
      // invalid-view fallback. This is intentional — the stored view
      // is still valid, just not currently restorable. If the teacher
      // refreshes again after StoreInit loads pages, restoreLastView
      // will be called again with pagesCount > 0 and will succeed.
      persistLastView('editor');
      restoreLastView(0);
      // Value should still be there (not cleared)
      expect(window.localStorage.getItem(__TEST__.STORAGE_KEY)).toBe('editor');
    });
  });

  describe('restoreLastView — invalid view fallback', () => {
    it('falls back to dashboard when stored value is invalid string', () => {
      window.localStorage.setItem(__TEST__.STORAGE_KEY, 'lengkap');
      expect(restoreLastView(5)).toBe('dashboard');
    });

    it('clears the bad value after detecting it (so subsequent restores are clean)', () => {
      window.localStorage.setItem(__TEST__.STORAGE_KEY, 'mpi-editor');
      restoreLastView(5);
      expect(window.localStorage.getItem(__TEST__.STORAGE_KEY)).toBeNull();
    });

    it('falls back to dashboard for legacy editor names', () => {
      const legacyNames = ['mpi-editor', 'canva-builder', 'advanced', 'teacherMode', 'lengkap'];
      for (const name of legacyNames) {
        window.localStorage.setItem(__TEST__.STORAGE_KEY, name);
        expect(restoreLastView(5)).toBe('dashboard');
        // Bad value should have been cleared
        expect(window.localStorage.getItem(__TEST__.STORAGE_KEY)).toBeNull();
      }
    });

    it('falls back to dashboard for arbitrary garbage', () => {
      const garbage = ['', 'null', 'undefined', 'true', 'false', '123', '{}', '[]', 'random'];
      for (const g of garbage) {
        window.localStorage.setItem(__TEST__.STORAGE_KEY, g);
        expect(restoreLastView(5)).toBe('dashboard');
      }
    });
  });

  describe('restoreLastView — boundary cases', () => {
    it('restores editor when pages = 1 (boundary, just enough)', () => {
      persistLastView('editor');
      expect(restoreLastView(1)).toBe('editor');
    });

    it('restores editor when pages = 1000 (large project)', () => {
      persistLastView('editor');
      expect(restoreLastView(1000)).toBe('editor');
    });
  });

  describe('clearLastView', () => {
    it('removes the stored view', () => {
      persistLastView('editor');
      expect(window.localStorage.getItem(__TEST__.STORAGE_KEY)).toBe('editor');
      clearLastView();
      expect(window.localStorage.getItem(__TEST__.STORAGE_KEY)).toBeNull();
    });

    it('does not throw when nothing is stored', () => {
      expect(() => clearLastView()).not.toThrow();
    });
  });

  describe('isProductView guard', () => {
    it('returns true for all 5 safe views', () => {
      for (const v of __TEST__.SAFE_VIEWS) {
        expect(__TEST__.isProductView(v)).toBe(true);
      }
    });

    it('returns false for legacy editor names', () => {
      expect(__TEST__.isProductView('mpi-editor')).toBe(false);
      expect(__TEST__.isProductView('canva-builder')).toBe(false);
      expect(__TEST__.isProductView('lengkap')).toBe(false);
    });

    it('returns false for non-string types', () => {
      expect(__TEST__.isProductView(undefined)).toBe(false);
      expect(__TEST__.isProductView(null)).toBe(false);
      expect(__TEST__.isProductView(123)).toBe(false);
      expect(__TEST__.isProductView({})).toBe(false);
    });
  });

  describe('VIEWS_REQUIRING_PAGES contract', () => {
    it('contains exactly editor/preview/export', () => {
      expect(__TEST__.VIEWS_REQUIRING_PAGES).toEqual(['editor', 'preview', 'export']);
    });

    it('does NOT include dashboard or template', () => {
      expect(__TEST__.VIEWS_REQUIRING_PAGES).not.toContain('dashboard');
      expect(__TEST__.VIEWS_REQUIRING_PAGES).not.toContain('template');
    });
  });
});

// ───────────────────────────────────────────────────────────────
// Section 2: ProductShell — view restore + safety net (source audit)
// ───────────────────────────────────────────────────────────────

describe('BATCH-06B: ProductShell — view persistence wiring (source audit)', () => {
  const src = () =>
    readFileSync(
      resolve(__dirname, '../components/product-v5/ProductShell.tsx'),
      'utf-8',
    );

  it('imports restoreLastView and persistLastView from v5-view-persistence', () => {
    const s = src();
    expect(s).toContain("from '@/lib/v5-view-persistence'");
    expect(s).toContain('restoreLastView');
    expect(s).toContain('persistLastView');
  });

  it('uses lazy useState initializer that calls restoreLastView with current pages count', () => {
    const s = src();
    // Must use lazy init (function form), not direct call
    expect(s).toMatch(/useState<ProductView>\(\(\)\s*=>\s*\{/);
    expect(s).toContain('restoreLastView(');
    expect(s).toContain('pagesRef.current');
  });

  it('initialView prop override takes precedence (for test injection)', () => {
    const s = src();
    expect(s).toContain('if (initialView) return initialView');
  });

  it('persists view on change via useEffect', () => {
    const s = src();
    expect(s).toMatch(/useEffect\(\(\)\s*=>\s*\{[\s\S]*?persistLastView\(view\)/);
  });

  it('has safety net: falls back to dashboard if pages.length === 0 while in editor/preview/export', () => {
    const s = src();
    expect(s).toContain("pages.length === 0");
    expect(s).toMatch(/view === 'editor' \|\| view === 'preview' \|\| view === 'export'/);
    expect(s).toContain("setView('dashboard')");
  });

  it('does NOT reference any legacy editor/route names in code (comments OK)', () => {
    const s = src();
    // Strip comments before checking — we want to catch ACTUAL code references,
    // not documentation comments explaining what was removed.
    const stripped = s
      .replace(/\/\/.*$/gm, '') // single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // multi-line comments

    expect(stripped, 'must not reference MpiEditorShell in code').not.toContain('MpiEditorShell');
    expect(stripped, 'must not reference CanvaBuilder in code').not.toContain('CanvaBuilder');
    expect(stripped, 'must not reference AdvancedEditor in code').not.toContain('AdvancedEditor');
    expect(stripped, 'must not reference AuthoringTool in code').not.toContain('AuthoringTool');
    // teacherMode is allowed in comments (we document its absence) but
    // must not appear in actual code paths
    expect(stripped, 'must not reference teacherMode in code').not.toContain('teacherMode');
    expect(stripped, "must not have 'lengkap' string literal in code").not.toContain("'lengkap'");
    expect(stripped, 'must not reference legacy in code').not.toContain('legacy');
  });

  it('default initialView is undefined (not hardcoded)', () => {
    // We removed the default 'dashboard' — restoreLastView handles it.
    // This ensures the override-and-restore contract is explicit.
    const s = src();
    expect(s).not.toMatch(/initialView\s*=\s*['"]dashboard['"]/);
  });
});

// ───────────────────────────────────────────────────────────────
// Section 3: DashboardV5 — workflow guidance text
// ───────────────────────────────────────────────────────────────

describe('BATCH-06B: DashboardV5 — workflow guidance 5 langkah', () => {
  const src = () =>
    readFileSync(
      resolve(__dirname, '../components/product-v5/DashboardV5.tsx'),
      'utf-8',
    );

  it('has workflow guidance nav with data-testid', () => {
    expect(src()).toContain('data-testid="dashboard-workflow-guidance"');
  });

  it('includes aria-label="Alur kerja" for accessibility', () => {
    expect(src()).toContain('aria-label="Alur kerja"');
  });

  it('lists all 5 workflow steps in order', () => {
    const s = src();
    // The 5 steps must appear in this order
    const infoIdx = s.indexOf('>Info<');
    const editIdx = s.indexOf('>Edit Isi<');
    const styleIdx = s.indexOf('>Style<');
    const previewIdx = s.indexOf('>Preview<');
    const exportIdx = s.indexOf('>Export<');

    expect(infoIdx, 'Info step must be present').toBeGreaterThan(-1);
    expect(editIdx, 'Edit Isi step must be present').toBeGreaterThan(-1);
    expect(styleIdx, 'Style step must be present').toBeGreaterThan(-1);
    expect(previewIdx, 'Preview step must be present').toBeGreaterThan(-1);
    expect(exportIdx, 'Export step must be present').toBeGreaterThan(-1);

    // Verify order
    expect(infoIdx).toBeLessThan(editIdx);
    expect(editIdx).toBeLessThan(styleIdx);
    expect(styleIdx).toBeLessThan(previewIdx);
    expect(previewIdx).toBeLessThan(exportIdx);
  });

  it('renders steps as an ordered list (ol)', () => {
    expect(src()).toMatch(/<ol[\s\S]*?<\/ol>/);
  });

  it('uses numbered step indicators (1-5)', () => {
    const s = src();
    for (let i = 1; i <= 5; i++) {
      expect(s, `step ${i} must be numbered`).toContain(`>${i}</span>`);
    }
  });
});

// ───────────────────────────────────────────────────────────────
// Section 4: No legacy route references in V5 product route files
// ───────────────────────────────────────────────────────────────

describe('BATCH-06B: No legacy route references in V5 product route', () => {
  const v5Files = [
    'src/components/product-v5/ProductShell.tsx',
    'src/components/product-v5/DashboardV5.tsx',
    'src/components/product-v5/TemplatePickerV5.tsx',
    'src/components/product-v5/CleanEditorV5.tsx',
    'src/components/product-v5/PreviewV5.tsx',
    'src/components/product-v5/ExportPanelV5.tsx',
    'src/lib/v5-view-persistence.ts',
  ];

  for (const rel of v5Files) {
    it(`${rel} does not reference legacy editor names in code (comments OK)`, () => {
      const s = readFileSync(resolve(__dirname, '..', rel.replace('src/', '')), 'utf-8');
      // Strip comments before checking
      const stripped = s
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

      expect(stripped, `${rel} must not reference MpiEditorShell in code`).not.toContain('MpiEditorShell');
      expect(stripped, `${rel} must not reference CanvaBuilder in code`).not.toContain('CanvaBuilder');
      expect(stripped, `${rel} must not reference AdvancedEditor in code`).not.toContain('AdvancedEditor');
      expect(stripped, `${rel} must not reference AuthoringTool in code`).not.toContain('AuthoringTool');
      expect(stripped, `${rel} must not reference teacherMode in code`).not.toContain('teacherMode');
    });
  }

  it('v5-view-persistence.ts has STORAGE_KEY = "silse_v5_last_view"', () => {
    const s = readFileSync(
      resolve(__dirname, '../lib/v5-view-persistence.ts'),
      'utf-8',
    );
    expect(s).toContain("STORAGE_KEY = 'silse_v5_last_view'");
  });

  it('v5-view-persistence.ts exports persistLastView, restoreLastView, clearLastView', () => {
    const s = readFileSync(
      resolve(__dirname, '../lib/v5-view-persistence.ts'),
      'utf-8',
    );
    expect(s).toContain('export function persistLastView');
    expect(s).toContain('export function restoreLastView');
    expect(s).toContain('export function clearLastView');
  });
});
