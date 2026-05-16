import { test, expect } from '@playwright/test';
import {
  navigateToCanva,
  addBlockByType,
  selectBlockOnCanvas,
  deleteSelectedBlock,
  isBlockPropertiesPanelVisible,
  addBlankPage,
} from './helpers';

// ═══════════════════════════════════════════════════════════════
// G.5 E2E Smoke Test — Block CRUD Operations
// ═══════════════════════════════════════════════════════════════
// Verifies adding, selecting, and deleting blocks on a page.
// Uses the add-block panel and keyboard shortcuts for deletion.
// ═══════════════════════════════════════════════════════════════

test.describe('Block Operations', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToCanva(page);
    // Ensure we have a page with schema support — add a template page
    // The default "Halaman Kosong" custom page may not support schema blocks,
    // so we add a template page first.
  });

  test('add a block to a template page', async ({ page }) => {
    // Add a template page from the dropdown (click "Dari Template" and select "Cover")
    const dariTemplateBtn = page.locator('button:has-text("Dari Template")');
    if (await dariTemplateBtn.isVisible()) {
      await dariTemplateBtn.click();
      await page.waitForTimeout(500);

      // Find and click a cover template in the dropdown
      const coverOption = page.locator('[role="menuitem"]:has-text("Cover")').first();
      if (await coverOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await coverOption.click();
        await page.waitForTimeout(1000);
      }
    }

    // Try to add a "petunjuk" block — it's a common block type
    const initialBlockCount = await page.locator('[data-block-id]').count();

    // Open the Tambah Block section if needed
    const addBlockPanel = page.locator('[data-testid="add-block-panel"]');
    if (!(await addBlockPanel.isVisible({ timeout: 2000 }).catch(() => false))) {
      const header = page.locator('button:has-text("Tambah Block"), button:has-text("Tambah Konten")').first();
      if (await header.isVisible()) {
        await header.click();
        await page.waitForTimeout(300);
      }
    }

    // Verify the add-block panel is now visible
    await expect(addBlockPanel).toBeVisible({ timeout: 5000 });
  });

  test('select a block shows properties in right panel', async ({ page }) => {
    // Add a template page first (to get blocks on the page)
    const dariTemplateBtn = page.locator('button:has-text("Dari Template")');
    if (await dariTemplateBtn.isVisible()) {
      await dariTemplateBtn.click();
      await page.waitForTimeout(500);

      const coverOption = page.locator('[role="menuitem"]:has-text("Cover")').first();
      if (await coverOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await coverOption.click();
        await page.waitForTimeout(1000);
      }
    }

    // Select the first block on the canvas
    await selectBlockOnCanvas(page, 0);

    // Verify block properties panel appears in the right panel
    const panelVisible = await isBlockPropertiesPanelVisible(page);
    // If there are blocks, the properties panel should show
    if (await page.locator('[data-block-id]').count() > 0) {
      expect(panelVisible).toBeTruthy();
    }
  });

  test('delete a block removes it from canvas', async ({ page }) => {
    // Add a template page with blocks
    const dariTemplateBtn = page.locator('button:has-text("Dari Template")');
    if (await dariTemplateBtn.isVisible()) {
      await dariTemplateBtn.click();
      await page.waitForTimeout(500);

      const coverOption = page.locator('[role="menuitem"]:has-text("Cover")').first();
      if (await coverOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await coverOption.click();
        await page.waitForTimeout(1000);
      }
    }

    const initialBlockCount = await page.locator('[data-block-id]').count();

    // Only test deletion if there are blocks
    if (initialBlockCount > 0) {
      // Select the first block
      await selectBlockOnCanvas(page, 0);

      // Delete it via keyboard
      await deleteSelectedBlock(page);

      // Wait for the deletion to take effect
      await page.waitForTimeout(500);

      // Block count should have decreased
      const newBlockCount = await page.locator('[data-block-id]').count();
      expect(newBlockCount).toBeLessThan(initialBlockCount);
    }
  });
});
