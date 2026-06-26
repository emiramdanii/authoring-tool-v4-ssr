// ═══════════════════════════════════════════════════════════════
// BATCH-06: TEACHER-WORKFLOW-UX-01 — Tests
// ═══════════════════════════════════════════════════════════════
// Source-audit tests (read file + assert specific patterns present).
// This pattern is robust against test environment differences
// (no need for jsdom render, store mocks, or React rendering).
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const readSrc = (rel: string) =>
  readFileSync(resolve(__dirname, '../components/product-v5/' + rel), 'utf-8');

// ───────────────────────────────────────────────────────────────
// DashboardV5 — Resume Card
// ───────────────────────────────────────────────────────────────

describe('BATCH-06: DashboardV5 — Project Resume Card', () => {
  const src = () => readSrc('DashboardV5.tsx');

  it('reads metadata from useAuthoringStore (not just props)', () => {
    const s = src();
    expect(s).toContain("useAuthoringStore");
    expect(s).toMatch(/useAuthoringStore\(\(s\)\s*=>\s*s\.meta\)/);
  });

  it('accepts optional pageCount prop', () => {
    expect(src()).toContain('pageCount?: number');
    expect(src()).toContain('pageCount = 0');
  });

  it('renders resume section with data-testid="dashboard-resume-section" when hasProject=true', () => {
    const s = src();
    expect(s).toContain('data-testid="dashboard-resume-section"');
    expect(s).toContain("hasProject ? (");
    expect(s).toContain('Proyek Tersimpan');
  });

  it('shows page count badge on resume card', () => {
    const s = src();
    expect(s).toContain('data-testid="resume-page-count"');
    expect(s).toContain('{pageCount} halaman');
  });

  it('shows project title with fallback "Tanpa Judul"', () => {
    const s = src();
    expect(s).toContain("judulPertemuan?.trim() || 'Tanpa Judul'");
    expect(s).toContain('data-testid="resume-judul"');
  });

  it('shows mapel + kelas from meta', () => {
    const s = src();
    expect(s).toContain('meta?.mapel?.trim()');
    expect(s).toContain('meta?.kelas?.trim()');
    expect(s).toContain("mapel = meta?.mapel?.trim() || '—'");
  });

  it('shows namaGuru only if non-empty (conditional render)', () => {
    const s = src();
    expect(s).toContain('namaGuru && (');
    expect(s).toContain('meta?.namaGuru?.trim()');
  });

  it('has primary "Lanjutkan Edit" button with data-testid', () => {
    const s = src();
    expect(s).toContain('data-testid="resume-continue-btn"');
    expect(s).toContain('Lanjutkan Edit');
    expect(s).toContain('onResumeEdit');
  });

  it('has secondary "Mulai dari Template Lain" button', () => {
    const s = src();
    expect(s).toContain('data-testid="resume-new-btn"');
    expect(s).toContain('Mulai dari Template Lain');
    expect(s).toContain('onPickTemplate');
  });

  it('empty state (hasProject=false) has single "Mulai dari Template" button', () => {
    const s = src();
    expect(s).toContain('data-testid="dashboard-start-template-btn"');
    expect(s).toContain('Mulai dari Template');
  });

  it('uses safe fallbacks for empty metadata (no crash on missing fields)', () => {
    const s = src();
    // Each meta field has || fallback
    expect(s).toMatch(/judulPertemuan\?\.trim\(\)\s*\|\|\s*'Tanpa Judul'/);
    expect(s).toMatch(/mapel\?\.trim\(\)\s*\|\|\s*'—'/);
    expect(s).toMatch(/kelas\?\.trim\(\)\s*\|\|\s*'—'/);
  });
});

// ───────────────────────────────────────────────────────────────
// TemplatePickerV5 — Page Count Badge + Template Icon
// ───────────────────────────────────────────────────────────────

describe('BATCH-06: TemplatePickerV5 — Page Count + Template Icon', () => {
  const src = () => readSrc('TemplatePickerV5.tsx');

  it('computes pageCount from t.scenes.length', () => {
    expect(src()).toContain('t.scenes?.length ?? 0');
  });

  it('uses template-specific icon from t.metadata.icon with fallback', () => {
    expect(src()).toContain("t.metadata?.icon || 'auto_stories'");
  });

  it('renders page count badge with data-testid', () => {
    const s = src();
    expect(s).toContain('data-testid={`template-page-count-${t.id}`}');
    expect(s).toContain('{pageCount} hal');
  });

  it('renders template card with data-testid', () => {
    expect(src()).toContain('data-testid={`template-card-${t.id}`}');
  });

  it('aria-label includes page count for screen readers', () => {
    expect(src()).toContain('aria-label={`Pilih template ${t.name}, ${pageCount} halaman`}');
  });

  it('shows loading state only when applying === t.id (replaces badge)', () => {
    const s = src();
    // applying check is exclusive — either loading OR badge, not both
    expect(s).toContain('applying === t.id ? (');
    expect(s).toMatch(/applying === t\.id \?\s*\([\s\S]*?Memuat\.\.\.<\/span>\s*\)\s*:\s*\(/);
  });
});

// ───────────────────────────────────────────────────────────────
// ProductShell — pageCount wiring
// ───────────────────────────────────────────────────────────────

describe('BATCH-06: ProductShell — pageCount prop wiring', () => {
  it('passes pageCount to DashboardV5', () => {
    const src = readFileSync(
      resolve(__dirname, '../components/product-v5/ProductShell.tsx'),
      'utf-8',
    );
    expect(src).toContain('pageCount={pages.length}');
  });
});
