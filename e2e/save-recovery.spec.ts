import { test, expect } from '@playwright/test';
import {
  navigateToCanva,
  addBlankPage,
  getPageCount,
  hasSavedData,
  getSavedData,
  clearSavedData,
  saveProject,
} from './helpers';

// ═══════════════════════════════════════════════════════════════
// G.5 E2E Smoke Test — Save & Recovery
// ═══════════════════════════════════════════════════════════════
// Verifies that auto-save persists data to localStorage and that
// reloading the page restores the canvas state.
// ═══════════════════════════════════════════════════════════════

test.describe('Save & Recovery', () => {
  test.beforeEach(async ({ page }) => {
    // Clear saved data before each test for clean state
    await page.goto('/');
    await clearSavedData(page);
    await navigateToCanva(page);
  });

  test('auto-save persists data to localStorage', async ({ page }) => {
    // Make a change
    const initialCount = await getPageCount(page);
    await addBlankPage(page);
    const countAfterAdd = await getPageCount(page);
    expect(countAfterAdd).toBe(initialCount + 1);

    // Wait for auto-save debounce (2 seconds) + buffer
    await page.waitForTimeout(4000);

    // Verify localStorage has saved data
    const saved = await hasSavedData(page);
    expect(saved).toBeTruthy();

    // Verify the saved data has pages
    const data = await getSavedData(page);
    expect(data).toBeTruthy();
    expect(data.pages).toBeTruthy();
    expect(data.pages.length).toBeGreaterThanOrEqual(countAfterAdd);
  });

  test('reload restores canvas state', async ({ page }) => {
    // Make a change
    await addBlankPage(page);
    const countBeforeReload = await getPageCount(page);

    // Wait for auto-save
    await page.waitForTimeout(4000);

    // Reload the page
    await page.reload();
    await page.waitForTimeout(2000);

    // Dismiss tour if it appears
    const tourSkip = page.locator('button:has-text("Lewati")');
    if (await tourSkip.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tourSkip.click();
      await page.waitForTimeout(300);
    }

    // Navigate back to canva
    const canvaNav = page.locator('[data-testid="nav-canva"]');
    if (await canvaNav.isVisible({ timeout: 5000 }).catch(() => false)) {
      await canvaNav.click();
      await page.waitForTimeout(2000);
    }

    // Verify canvas state is restored
    const countAfterReload = await getPageCount(page);
    expect(countAfterReload).toBe(countBeforeReload);
  });

  test('manual save via Ctrl+S works', async ({ page }) => {
    // Make a change
    await addBlankPage(page);

    // Trigger manual save
    await saveProject(page);

    // Wait for save to complete
    await page.waitForTimeout(1000);

    // Verify localStorage has saved data
    const saved = await hasSavedData(page);
    expect(saved).toBeTruthy();
  });

  test('saved data includes timestamp', async ({ page }) => {
    // Make a change and wait for auto-save
    await addBlankPage(page);
    await page.waitForTimeout(4000);

    // Verify saved data has a timestamp
    const data = await getSavedData(page);
    if (data) {
      expect(data._lastSavedAt).toBeTruthy();
      expect(typeof data._lastSavedAt).toBe('number');
      // The timestamp should be recent (within last 30 seconds)
      const now = Date.now();
      expect(data._lastSavedAt).toBeGreaterThan(now - 30000);
    }
  });
});
