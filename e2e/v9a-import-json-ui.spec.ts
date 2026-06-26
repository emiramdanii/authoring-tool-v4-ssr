import { test, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// BATCH-09A — IMPORT-JSON-UI-LIGHT
// ═══════════════════════════════════════════════════════════════
// E2E tests for the Import JSON validation panel.
//
// Flow:
//   1. Open dashboard → click "Validasi JSON Import" button
//   2. Modal opens with textarea + sample buttons + validate button
//   3. Paste valid JSON → click Validasi → green result
//   4. Paste invalid JSON → click Validasi → red result + reason + path
//   5. Click "Salin JSON Valid" → clipboard has valid JSON
//   6. Close modal → back to dashboard
//
// HARD ASSERT throughout (no soft fallback — learned from Batch 07A).
// ═══════════════════════════════════════════════════════════════

test.describe('BATCH-09A — Import JSON UI Light', () => {
  test.skip(process.env.CI === 'true', 'local-only release gate');

  const VALID_JSON = `{"schemaVersion":1,"meta":{"judulPertemuan":"Test","mapel":"PPKn","kelas":"7"},"canva":{"pages":[{"id":"p1","templateType":"cover","schema":{"blocks":[{"id":"b1","type":"cover","title":"Test"}]}}]}}`;
  const INVALID_JSON = `{"schemaVersion":99,"meta":{},"canva":{"pages":[]}}`;

  test('modal opens from dashboard and has all required elements', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // HARD ASSERT: dashboard visible
    await expect(page.locator('[data-testid="dashboard-v5"]')).toBeVisible({ timeout: 10000 });

    // HARD ASSERT: Import JSON button visible on dashboard
    const importBtn = page.locator('[data-testid="dashboard-import-json-btn"]');
    await expect(importBtn).toBeVisible({ timeout: 5000 });

    // Click to open modal
    await importBtn.click();
    await page.waitForTimeout(500);

    // HARD ASSERT: modal visible
    const modal = page.locator('[data-testid="import-json-panel-v5"]');
    await expect(modal, 'Import JSON modal must open').toBeVisible({ timeout: 5000 });

    // HARD ASSERT: modal has role=dialog + aria-modal
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');

    // HARD ASSERT: textarea visible
    await expect(page.locator('[data-testid="import-json-textarea"]')).toBeVisible();

    // HARD ASSERT: Validasi button visible
    await expect(page.locator('[data-testid="import-json-validate-btn"]')).toBeVisible();

    // HARD ASSERT: copy sample buttons visible
    await expect(page.locator('[data-testid="import-json-copy-valid-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-json-copy-invalid-btn"]')).toBeVisible();

    // HARD ASSERT: clear button visible
    await expect(page.locator('[data-testid="import-json-clear-btn"]')).toBeVisible();
  });

  test('valid JSON shows green result with summary', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.locator('[data-testid="dashboard-import-json-btn"]').click();
    await page.waitForTimeout(500);

    const modal = page.locator('[data-testid="import-json-panel-v5"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Paste valid JSON into textarea
    const textarea = page.locator('[data-testid="import-json-textarea"]');
    await textarea.fill(VALID_JSON);
    await page.waitForTimeout(300);

    // HARD ASSERT: character count visible
    await expect(page.locator('[data-testid="import-json-char-count"]')).toBeVisible();

    // Click Validasi
    await page.locator('[data-testid="import-json-validate-btn"]').click();
    await page.waitForTimeout(500);

    // HARD ASSERT: result visible + valid
    const result = page.locator('[data-testid="import-json-result"]');
    await expect(result, 'result must appear after validation').toBeVisible({ timeout: 5000 });
    await expect(result).toHaveAttribute('data-valid', 'true');

    // HARD ASSERT: result title says "JSON Valid"
    await expect(page.locator('[data-testid="import-json-result-title"]')).toContainText('JSON Valid');

    // HARD ASSERT: summary shows page count
    await expect(page.locator('[data-testid="import-json-result-summary-pages"]')).toContainText('1 halaman');

    // HARD ASSERT: summary shows judul
    await expect(page.locator('[data-testid="import-json-result-summary-judul"]')).toContainText('Test');
  });

  test('invalid JSON shows red result with reason + path', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.locator('[data-testid="dashboard-import-json-btn"]').click();
    await page.waitForTimeout(500);

    // Paste invalid JSON (future version + missing meta fields + empty pages)
    await page.locator('[data-testid="import-json-textarea"]').fill(INVALID_JSON);
    await page.waitForTimeout(300);

    await page.locator('[data-testid="import-json-validate-btn"]').click();
    await page.waitForTimeout(500);

    // HARD ASSERT: result visible + invalid
    const result = page.locator('[data-testid="import-json-result"]');
    await expect(result).toBeVisible({ timeout: 5000 });
    await expect(result).toHaveAttribute('data-valid', 'false');

    // HARD ASSERT: result title says "JSON Tidak Valid"
    await expect(page.locator('[data-testid="import-json-result-title"]')).toContainText('JSON Tidak Valid');

    // HARD ASSERT: reason code visible
    const reasonEl = page.locator('[data-testid="import-json-result-reason"]');
    await expect(reasonEl).toBeVisible();
    const reasonText = await reasonEl.textContent();
    expect(reasonText?.trim().length, 'reason must be non-empty').toBeGreaterThan(0);

    // HARD ASSERT: all-errors details visible (multiple errors expected)
    await expect(page.locator('[data-testid="import-json-result-all-errors"]')).toBeVisible();
  });

  test('dangerous JSON (script tag) shows dangerous-html-script reason', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.locator('[data-testid="dashboard-import-json-btn"]').click();
    await page.waitForTimeout(500);

    const dangerousJson = `{"schemaVersion":1,"meta":{"judulPertemuan":"T","mapel":"P","kelas":"7"},"canva":{"pages":[{"id":"p1","templateType":"materi","schema":{"blocks":[{"id":"b1","type":"def-box","content":"<script>alert(1)</script>"}]}}]}}`;
    await page.locator('[data-testid="import-json-textarea"]').fill(dangerousJson);
    await page.waitForTimeout(300);

    await page.locator('[data-testid="import-json-validate-btn"]').click();
    await page.waitForTimeout(500);

    // HARD ASSERT: result invalid
    const result = page.locator('[data-testid="import-json-result"]');
    await expect(result).toBeVisible({ timeout: 5000 });
    await expect(result).toHaveAttribute('data-valid', 'false');

    // HARD ASSERT: reason is dangerous-html-script
    const reasonEl = page.locator('[data-testid="import-json-result-reason"]');
    await expect(reasonEl).toBeVisible();
    await expect(reasonEl).toContainText('dangerous-html-script');
  });

  test('copy sample valid JSON button works', async ({ page, context }) => {
    await context.clearCookies();
    // Grant clipboard permission
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.locator('[data-testid="dashboard-import-json-btn"]').click();
    await page.waitForTimeout(500);

    // Click "Salin JSON Valid"
    await page.locator('[data-testid="import-json-copy-valid-btn"]').click();
    await page.waitForTimeout(500);

    // HARD ASSERT: button text changed to "Disalin!"
    await expect(page.locator('[data-testid="import-json-copy-valid-btn"]')).toContainText('Disalin!');

    // HARD ASSERT: clipboard contains valid JSON
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText, 'clipboard must contain valid JSON').toContain('"schemaVersion": 1');
    expect(clipboardText).toContain('"judulPertemuan"');
  });

  test('clear button clears textarea + result', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.locator('[data-testid="dashboard-import-json-btn"]').click();
    await page.waitForTimeout(500);

    const textarea = page.locator('[data-testid="import-json-textarea"]');
    await textarea.fill(VALID_JSON);
    await page.locator('[data-testid="import-json-validate-btn"]').click();
    await page.waitForTimeout(500);

    // Result should be visible
    await expect(page.locator('[data-testid="import-json-result"]')).toBeVisible({ timeout: 5000 });

    // Click clear
    await page.locator('[data-testid="import-json-clear-btn"]').click();
    await page.waitForTimeout(300);

    // HARD ASSERT: textarea empty
    await expect(textarea).toHaveValue('');

    // HARD ASSERT: result gone
    await expect(page.locator('[data-testid="import-json-result"]')).toHaveCount(0);
  });

  test('Escape key closes modal', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.locator('[data-testid="dashboard-import-json-btn"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="import-json-panel-v5"]')).toBeVisible({ timeout: 5000 });

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // HARD ASSERT: modal closed
    await expect(page.locator('[data-testid="import-json-panel-v5"]')).toHaveCount(0);

    // HARD ASSERT: back on dashboard
    await expect(page.locator('[data-testid="dashboard-v5"]')).toBeVisible();
  });

  test('Tutup button closes modal', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.locator('[data-testid="dashboard-import-json-btn"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="import-json-panel-v5"]')).toBeVisible({ timeout: 5000 });

    // Click close (X) button in header
    await page.locator('[data-testid="import-json-panel-v5"] button[aria-label="Tutup panel import JSON"]').click();
    await page.waitForTimeout(500);

    // HARD ASSERT: modal closed
    await expect(page.locator('[data-testid="import-json-panel-v5"]')).toHaveCount(0);
  });

  test('empty input shows helpful message (not crash)', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.locator('[data-testid="dashboard-import-json-btn"]').click();
    await page.waitForTimeout(500);

    // Click Validasi without entering anything (button is enabled —
    // handler gracefully shows "tempel JSON" message for empty input)
    await page.locator('[data-testid="import-json-validate-btn"]').click();
    await page.waitForTimeout(500);

    // HARD ASSERT: result appears with invalid state
    const result = page.locator('[data-testid="import-json-result"]');
    await expect(result).toBeVisible({ timeout: 5000 });
    await expect(result).toHaveAttribute('data-valid', 'false');

    // HARD ASSERT: message mentions pasting JSON
    await expect(page.locator('[data-testid="import-json-result-message"]')).toContainText('Tempel JSON');
  });
});
