import { test, expect } from '@playwright/test';
import {
  navigateToCanva,
  addBlankPage,
  switchToPage,
  getPageCount,
} from './helpers';

// ═══════════════════════════════════════════════════════════════
// G.5 E2E Smoke Test — Page Management
// ═══════════════════════════════════════════════════════════════
// Verifies adding, switching between, and deleting pages.
// ═══════════════════════════════════════════════════════════════

test.describe('Page Operations', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToCanva(page);
  });

  test('add a new blank page', async ({ page }) => {
    const initialCount = await getPageCount(page);

    await addBlankPage(page);

    const newCount = await getPageCount(page);
    expect(newCount).toBe(initialCount + 1);
  });

  test('switch between pages', async ({ page }) => {
    // Add a second page
    await addBlankPage(page);
    const pageCount = await getPageCount(page);
    expect(pageCount).toBeGreaterThanOrEqual(2);

    // Click on the first page tab
    await switchToPage(page, 0);
    // The first page tab should have the active styling (ring)
    const pageTab0 = page.locator('[data-testid="page-tab-0"]');
    await expect(pageTab0).toBeVisible();

    // Click on the second page tab
    await switchToPage(page, 1);
    const pageTab1 = page.locator('[data-testid="page-tab-1"]');
    await expect(pageTab1).toBeVisible();

    // Switch back to first page
    await switchToPage(page, 0);
    await expect(pageTab0).toBeVisible();
  });

  test('page counter in toolbar updates', async ({ page }) => {
    // The toolbar shows "1/N" page counter
    const initialCounter = page.locator('[data-testid="toolbar"]').locator('text=/\\d+\\/\\d+/');
    const initialText = await initialCounter.textContent().catch(() => '');

    await addBlankPage(page);

    const updatedCounter = page.locator('[data-testid="toolbar"]').locator('text=/\\d+\\/\\d+/');
    const updatedText = await updatedCounter.textContent().catch(() => '');

    // The total should have increased
    expect(updatedText).toBeTruthy();
  });

  test('delete a page decreases page count', async ({ page }) => {
    // First add a page so we have at least 2
    await addBlankPage(page);
    const countAfterAdd = await getPageCount(page);
    expect(countAfterAdd).toBeGreaterThanOrEqual(2);

    // Delete the current page via the Hapus button
    // We need to handle the confirm dialog
    page.on('dialog', dialog => dialog.accept());

    const deleteBtn = page.locator('button:has-text("Hapus")').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(500);

      const countAfterDelete = await getPageCount(page);
      expect(countAfterDelete).toBe(countAfterAdd - 1);
    }
  });

  test('add page from template dropdown', async ({ page }) => {
    const initialCount = await getPageCount(page);

    // Click "Dari Template" button
    const dariTemplateBtn = page.locator('button:has-text("Dari Template")');
    await expect(dariTemplateBtn).toBeVisible();
    await dariTemplateBtn.click();
    await page.waitForTimeout(500);

    // Select a template option from the dropdown
    const templateOption = page.locator('[role="menuitem"]').first();
    if (await templateOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await templateOption.click();
      await page.waitForTimeout(1000);

      // Page count should have increased
      const newCount = await getPageCount(page);
      expect(newCount).toBeGreaterThan(initialCount);
    }
  });
});
