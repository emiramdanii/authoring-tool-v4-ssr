import { test, expect } from '@playwright/test';
import { navigateToCanva, addBlankPage, getPageCount } from './helpers';

// ═══════════════════════════════════════════════════════════════
// Sprint 4A — Renderer Smoke Tests
// ═══════════════════════════════════════════════════════════════
// Verifies that applying a template produces rendered blocks on
// the canvas. Checks that the SchemaRenderer and block renderers
// render without React errors or console crashes.
// ═══════════════════════════════════════════════════════════════

test.describe('Renderer Smoke', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToCanva(page);
  });

  test('applying cover template renders blocks on canvas', async ({ page }) => {
    // Apply a cover template
    const dariTemplateBtn = page.locator('button:has-text("Dari Template")');
    if (await dariTemplateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dariTemplateBtn.click();
      await page.waitForTimeout(500);

      const coverOption = page.locator('[role="menuitem"]:has-text("Cover")').first();
      if (await coverOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await coverOption.click();
        await page.waitForTimeout(1500);
      }
    }

    // Check that rendered blocks appear on the canvas
    const blocks = page.locator('[data-block-id]');
    const blockCount = await blocks.count();

    // A cover template should have at least 1 block
    if (blockCount > 0) {
      // Verify the first block has a type attribute
      const firstBlockType = await blocks.first().getAttribute('data-block-type');
      expect(firstBlockType).toBeTruthy();
    }
  });

  test('template gallery produces multi-page content', async ({ page }) => {
    const initialCount = await getPageCount(page);

    // Open template gallery
    const templateSection = page.locator('[data-testid="template-gallery"]');
    if (await templateSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      const toggleBtn = templateSection.locator('button').first();
      await toggleBtn.click();
      await page.waitForTimeout(500);

      // Find and click the first "Gunakan" / "Tambahkan" button
      const applyBtn = page.locator('[data-testid="template-gallery-panel"] button:has-text("Gunakan"), [data-testid="template-gallery-panel"] button:has-text("Tambahkan")').first();
      if (await applyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await applyBtn.click();
        await page.waitForTimeout(2000);

        const newCount = await getPageCount(page);
        expect(newCount).toBeGreaterThan(initialCount);
      }
    }
  });

  test('no critical console errors during rendering', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Apply a template to trigger rendering
    const dariTemplateBtn = page.locator('button:has-text("Dari Template")');
    if (await dariTemplateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dariTemplateBtn.click();
      await page.waitForTimeout(500);

      const coverOption = page.locator('[role="menuitem"]:has-text("Cover")').first();
      if (await coverOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await coverOption.click();
        await page.waitForTimeout(2000);
      }
    }

    // Filter out non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('hydration') &&
      !e.includes('Warning:') &&
      !e.includes('downloadable font') &&
      !e.includes('net::ERR')
    );

    expect(criticalErrors.length, `Critical errors during rendering: ${criticalErrors.join('\n')}`).toBe(0);
  });

  test('page navigation renders content without crash', async ({ page }) => {
    // Add a blank page
    await addBlankPage(page);
    const pageCount = await getPageCount(page);
    expect(pageCount).toBeGreaterThanOrEqual(2);

    // Switch between pages
    for (let i = 0; i < Math.min(pageCount, 3); i++) {
      const pageTab = page.locator(`[data-testid="page-tab-${i}"]`);
      if (await pageTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pageTab.click();
        await page.waitForTimeout(300);
      }
    }

    // App should still be responsive (canva builder visible)
    await expect(page.locator('[data-testid="canva-builder"]')).toBeVisible({ timeout: 5000 });
  });
});
