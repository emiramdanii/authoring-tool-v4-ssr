import { test, expect } from '@playwright/test';

// BATCH-04: Minimal route smoke test for V5.
// Tests: dashboard → template → editor → preview → export panel.
// Does NOT test export HTML render (that's Batch 05).

test('V5 route smoke: dashboard → template → editor → preview → export', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 1. Dashboard
  const dashboard = page.locator('[data-testid="dashboard-v5"]');
  await expect(dashboard).toBeVisible();

  // 2. Click "Mulai dari Template"
  await page.getByRole('button', { name: /Mulai dari Template/i }).click();
  await page.waitForTimeout(2000);

  const templatePicker = page.locator('[data-testid="template-picker-v5"]');
  await expect(templatePicker).toBeVisible();

  // 3. Click first template (PPKn)
  await page.getByRole('button', { name: /Hakikat Norma/i }).click();
  await page.waitForTimeout(5000);

  const editor = page.locator('[data-testid="clean-editor-v5"]');
  await expect(editor).toBeVisible();

  // 4. Click Preview
  await page.getByRole('button', { name: /Pratinjau media/i }).click();
  await page.waitForTimeout(3000);

  const preview = page.locator('[data-testid="preview-v5"]');
  await expect(preview).toBeVisible();

  // 5. Click Export
  await page.getByRole('button', { name: /Export ke HTML/i }).click();
  await page.waitForTimeout(2000);

  const exportPanel = page.locator('[data-testid="export-panel-v5"]');
  await expect(exportPanel).toBeVisible();
});
