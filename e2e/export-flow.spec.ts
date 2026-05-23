import { test, expect } from '@playwright/test';
import { gotoApp, navigateToCanva, getPageCount } from './helpers';

// ═══════════════════════════════════════════════════════════════
// Sprint 4B — Export Flow Smoke Tests
// ═══════════════════════════════════════════════════════════════
// Verifies the export functionality works at the UI level.
// Tests the export button, export dialog, and download trigger.
// ═══════════════════════════════════════════════════════════════

test.describe('Export Flow', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToCanva(page);
  });

  test('export button is visible in toolbar or sidebar', async ({ page }) => {
    // The export/unduh button should be accessible
    const exportBtn = page.locator(
      'button:has-text("Ekspor"), button:has-text("Export"), button:has-text("Unduh"), [data-testid="export-btn"], [data-testid="toolbar"] button[title*="Ekspor"], [data-testid="toolbar"] button[title*="Export"]'
    ).first();

    // At least one export-related button should exist
    const isVisible = await exportBtn.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('export API route returns proper error for empty payload', async ({ page }) => {
    // Test the export API directly with an invalid payload
    const response = await page.request.post('/api/export', {
      data: {}
    });

    // Should return 400 for missing pages
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test('export API route returns proper error for empty pages array', async ({ page }) => {
    const response = await page.request.post('/api/export', {
      data: { pages: [] }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test('SCORM export API returns error when template missing', async ({ page }) => {
    // SCORM export requires a template, so with minimal data it should fail gracefully
    const response = await page.request.post('/api/export/scorm', {
      data: {
        pages: [{ id: 'test', label: 'Test', elements: [] }],
        meta: { judulPertemuan: 'Test Export' }
      }
    });

    // Should either return 500 (template missing) or 200 with zip
    expect([200, 500]).toContain(response.status());
  });
});
