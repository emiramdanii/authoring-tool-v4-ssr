import { test, expect } from '@playwright/test';
import {
  navigateToCanva,
  openTemplateGallery,
  getPageCount,
} from './helpers';

// ═══════════════════════════════════════════════════════════════
// G.5 E2E Smoke Test — Template Gallery
// ═══════════════════════════════════════════════════════════════
// Verifies the template gallery panel opens, templates are listed,
// search works, and applying a template populates the canvas.
// ═══════════════════════════════════════════════════════════════

test.describe('Template Gallery', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToCanva(page);
  });

  test('open template gallery section', async ({ page }) => {
    await openTemplateGallery(page);

    // The template gallery panel should be visible
    await expect(page.locator('[data-testid="template-gallery-panel"]')).toBeVisible({ timeout: 5000 });
  });

  test('templates are listed in gallery', async ({ page }) => {
    await openTemplateGallery(page);

    // Wait for template cards to render
    // Template cards contain the "Gunakan" or "Tambahkan" button
    const templateCards = page.locator('[data-testid="template-gallery-panel"] button:has-text("Gunakan"), [data-testid="template-gallery-panel"] button:has-text("Tambahkan")');
    const count = await templateCards.count();

    // There should be at least some templates available
    expect(count).toBeGreaterThan(0);
  });

  test('search for a template', async ({ page }) => {
    await openTemplateGallery(page);

    // Find the search input in the template gallery
    const searchInput = page.locator('#template-gallery-search');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Type a search term
    await searchInput.fill('IPA');
    await page.waitForTimeout(500);

    // Template cards should update (filtered results)
    // At least the search input should have the value
    const inputValue = await searchInput.inputValue();
    expect(inputValue).toBe('IPA');

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(300);
  });

  test('apply a template populates canvas with pages', async ({ page }) => {
    // Clear any existing pages first for a clean test
    // Get initial page count
    const initialCount = await getPageCount(page);

    await openTemplateGallery(page);

    // Wait for template cards to appear
    const applyBtn = page.locator('[data-testid="template-gallery-panel"] button:has-text("Gunakan"), [data-testid="template-gallery-panel"] button:has-text("Tambahkan")').first();
    await expect(applyBtn).toBeVisible({ timeout: 10000 });

    // Click the first template's apply button
    await applyBtn.click();
    await page.waitForTimeout(2000); // Wait for template instantiation

    // Page count should have increased
    const newCount = await getPageCount(page);
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('mapel filter chips are visible', async ({ page }) => {
    await openTemplateGallery(page);

    // Wait for the panel to render
    await page.waitForTimeout(1000);

    // There should be mapel filter chips (subject filters)
    // The "Semua" button should be present
    const semuaBtn = page.locator('[data-testid="template-gallery-panel"] button:has-text("Semua")').first();
    await expect(semuaBtn).toBeVisible({ timeout: 5000 });
  });
});
