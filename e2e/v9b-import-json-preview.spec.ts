import { test, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// BATCH-09B — IMPORT-JSON-ADAPTER-PREVIEW
// ═══════════════════════════════════════════════════════════════
// E2E tests for the preview section shown after valid JSON validation.
//
// Flow:
//   1. Open modal from dashboard
//   2. Paste valid multi-page JSON
//   3. Click Validasi
//   4. Verify preview section appears with:
//      - totalPages + totalBlocks stats
//      - page list with per-page detail
//      - block type summary
//      - warnings section (if any)
//
// HARD ASSERT throughout (no soft fallback).
// ═══════════════════════════════════════════════════════════════

test.describe('BATCH-09B — Import JSON Preview', () => {
  test.skip(process.env.CI === 'true', 'local-only release gate');

  const VALID_MULTI_PAGE_JSON = JSON.stringify({
    schemaVersion: 1,
    meta: {
      judulPertemuan: 'Pertemuan Lengkap: Norma',
      mapel: 'PPKn',
      kelas: '8',
      namaGuru: 'Budi Santoso',
      namaSekolah: 'SMP Negeri 1',
    },
    canva: {
      pages: [
        {
          id: 'p1',
          label: 'Cover',
          templateType: 'cover',
          schema: { blocks: [{ id: 'b1', type: 'cover', title: 'Norma' }] },
        },
        {
          id: 'p2',
          label: 'Kuis',
          templateType: 'kuis',
          schema: { blocks: [{ id: 'b2', type: 'kuis', title: 'Kuis' }] },
        },
        {
          id: 'p3',
          label: 'Refleksi',
          templateType: 'refleksi',
          schema: { blocks: [{ id: 'b3', type: 'refleksi', title: 'Refleksi' }] },
        },
      ],
    },
  });

  const VALID_JSON_WITH_NO_EDITOR_BLOCK = JSON.stringify({
    schemaVersion: 1,
    meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
    canva: {
      pages: [
        {
          id: 'p1',
          label: 'Page 1',
          templateType: 'materi',
          schema: {
            blocks: [
              { id: 'b1', type: 'cover' },     // has editor
              { id: 'b2', type: 'tp' },         // NO editor → warning
              { id: 'b3', type: 'skenario' },   // NO editor → warning
            ],
          },
        },
      ],
    },
  });

  async function openModalAndPasteJson(page: import('@playwright/test').Page, json: string) {
    await page.context().clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.locator('[data-testid="dashboard-import-json-btn"]').click();
    await page.waitForTimeout(500);

    const modal = page.locator('[data-testid="import-json-panel-v5"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    await page.locator('[data-testid="import-json-textarea"]').fill(json);
    await page.waitForTimeout(300);

    await page.locator('[data-testid="import-json-validate-btn"]').click();
    await page.waitForTimeout(800);

    // HARD ASSERT: result valid
    const result = page.locator('[data-testid="import-json-result"]');
    await expect(result).toBeVisible({ timeout: 5000 });
    await expect(result).toHaveAttribute('data-valid', 'true');
  }

  test('valid multi-page JSON shows preview with stats + page list + block summary', async ({ page }) => {
    await openModalAndPasteJson(page, VALID_MULTI_PAGE_JSON);

    // HARD ASSERT: preview section visible
    const preview = page.locator('[data-testid="import-json-preview"]');
    await expect(preview, 'preview section must appear after valid JSON').toBeVisible({ timeout: 5000 });

    // HARD ASSERT: total pages stat = 3
    const totalPagesEl = page.locator('[data-testid="preview-total-pages"]');
    await expect(totalPagesEl).toBeVisible();
    await expect(totalPagesEl).toContainText('3');

    // HARD ASSERT: total blocks stat = 3
    const totalBlocksEl = page.locator('[data-testid="preview-total-blocks"]');
    await expect(totalBlocksEl).toBeVisible();
    await expect(totalBlocksEl).toContainText('3');

    // HARD ASSERT: page list has 3 items (use evaluate to filter exact testid
    // — Playwright's prefix match would also catch preview-page-0-block-types)
    const pageList = page.locator('[data-testid="preview-page-list"]');
    await expect(pageList).toBeVisible();
    const pageCount = await pageList.evaluate((el) => {
      return Array.from(el.querySelectorAll('[data-testid]')).filter((child) => {
        const tid = child.getAttribute('data-testid') || '';
        return /^preview-page-\d+$/.test(tid);
      }).length;
    });
    expect(pageCount, 'should have 3 page items').toBe(3);

    // HARD ASSERT: page 0 has label "Cover" + templateType "cover"
    const page0 = page.locator('[data-testid="preview-page-0"]');
    await expect(page0).toBeVisible();
    await expect(page0).toContainText('Cover');
    await expect(page0).toContainText('cover');

    // HARD ASSERT: page 1 has label "Kuis"
    await expect(page.locator('[data-testid="preview-page-1"]')).toContainText('Kuis');

    // HARD ASSERT: page 2 has label "Refleksi"
    await expect(page.locator('[data-testid="preview-page-2"]')).toContainText('Refleksi');

    // HARD ASSERT: block type summary visible with 3 types
    const summary = page.locator('[data-testid="preview-block-type-summary"]');
    await expect(summary).toBeVisible();
    const summaryCount = await summary.locator('[data-testid^="preview-block-type-"]').count();
    expect(summaryCount, 'should have 3 block type chips').toBe(3);

    // HARD ASSERT: cover, kuis, refleksi all in summary
    await expect(page.locator('[data-testid="preview-block-type-cover"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-block-type-kuis"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-block-type-refleksi"]')).toBeVisible();

    // HARD ASSERT: no warnings section (all blocks have editors + no empty pages + all labeled)
    await expect(page.locator('[data-testid="preview-warnings"]')).toHaveCount(0);
  });

  test('valid JSON with no-editor blocks shows warnings', async ({ page }) => {
    await openModalAndPasteJson(page, VALID_JSON_WITH_NO_EDITOR_BLOCK);

    // HARD ASSERT: preview visible
    await expect(page.locator('[data-testid="import-json-preview"]')).toBeVisible({ timeout: 5000 });

    // HARD ASSERT: warnings section visible (tp + skenario have no editors)
    const warnings = page.locator('[data-testid="preview-warnings"]');
    await expect(warnings, 'warnings section must appear for no-editor blocks').toBeVisible({ timeout: 5000 });

    // HARD ASSERT: warnings list has at least 2 items (tp + skenario)
    const warningList = page.locator('[data-testid="preview-warnings-list"]');
    await expect(warningList).toBeVisible();
    const warningCount = await warningList.locator('[data-testid^="preview-warning-"]').count();
    expect(warningCount, 'should have at least 2 no-editor warnings').toBeGreaterThanOrEqual(2);

    // HARD ASSERT: warning messages mention the block types
    const warningText = await warningList.textContent();
    expect(warningText).toContain('tp');
    expect(warningText).toContain('skenario');
    expect(warningText).toContain('belum punya editor');
  });

  test('block type chips show warning icon for no-editor types', async ({ page }) => {
    await openModalAndPasteJson(page, VALID_JSON_WITH_NO_EDITOR_BLOCK);

    // HARD ASSERT: tp chip visible (has warning icon)
    const tpChip = page.locator('[data-testid="preview-block-type-tp"]');
    await expect(tpChip).toBeVisible();
    // The chip should contain a warning material-symbols-outlined icon
    await expect(tpChip.locator('.material-symbols-outlined')).toBeVisible();

    // HARD ASSERT: skenario chip visible (has warning icon)
    const skenarioChip = page.locator('[data-testid="preview-block-type-skenario"]');
    await expect(skenarioChip).toBeVisible();
    await expect(skenarioChip.locator('.material-symbols-outlined')).toBeVisible();

    // HARD ASSERT: cover chip visible (NO warning icon — has editor)
    const coverChip = page.locator('[data-testid="preview-block-type-cover"]');
    await expect(coverChip).toBeVisible();
    // cover has editor, so no warning icon
    await expect(coverChip.locator('.material-symbols-outlined')).toHaveCount(0);
  });

  test('clear button clears preview along with result', async ({ page }) => {
    await openModalAndPasteJson(page, VALID_MULTI_PAGE_JSON);

    // Verify preview visible
    await expect(page.locator('[data-testid="import-json-preview"]')).toBeVisible({ timeout: 5000 });

    // Click clear
    await page.locator('[data-testid="import-json-clear-btn"]').click();
    await page.waitForTimeout(500);

    // HARD ASSERT: preview gone
    await expect(page.locator('[data-testid="import-json-preview"]')).toHaveCount(0);

    // HARD ASSERT: result gone
    await expect(page.locator('[data-testid="import-json-result"]')).toHaveCount(0);

    // HARD ASSERT: textarea empty
    await expect(page.locator('[data-testid="import-json-textarea"]')).toHaveValue('');
  });

  test('invalid JSON does NOT show preview', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.locator('[data-testid="dashboard-import-json-btn"]').click();
    await page.waitForTimeout(500);

    // Paste invalid JSON (future version)
    await page.locator('[data-testid="import-json-textarea"]').fill('{"schemaVersion":99,"meta":{},"canva":{"pages":[]}}');
    await page.waitForTimeout(300);

    await page.locator('[data-testid="import-json-validate-btn"]').click();
    await page.waitForTimeout(500);

    // HARD ASSERT: result visible + invalid
    const result = page.locator('[data-testid="import-json-result"]');
    await expect(result).toBeVisible({ timeout: 5000 });
    await expect(result).toHaveAttribute('data-valid', 'false');

    // HARD ASSERT: preview NOT visible (only valid results get preview)
    await expect(page.locator('[data-testid="import-json-preview"]')).toHaveCount(0);
  });

  test('preview shows correct meta info (judul, mapel, kelas)', async ({ page }) => {
    await openModalAndPasteJson(page, VALID_MULTI_PAGE_JSON);

    // HARD ASSERT: result summary shows correct meta
    await expect(page.locator('[data-testid="import-json-result-summary-judul"]')).toContainText('Pertemuan Lengkap: Norma');
    await expect(page.locator('[data-testid="import-json-result-summary-pages"]')).toContainText('3 halaman');

    // HARD ASSERT: preview visible (the detailed view)
    await expect(page.locator('[data-testid="import-json-preview"]')).toBeVisible({ timeout: 5000 });
  });
});
