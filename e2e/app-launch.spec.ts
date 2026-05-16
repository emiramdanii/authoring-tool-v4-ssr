import { test, expect } from '@playwright/test';
import {
  navigateToCanva,
  monitorConsoleErrors,
} from './helpers';

// ═══════════════════════════════════════════════════════════════
// G.5 E2E Smoke Test — App Launch
// ═══════════════════════════════════════════════════════════════
// Verifies the app loads without errors and all major UI sections
// are visible in the canva editor view.
// ═══════════════════════════════════════════════════════════════

test.describe('App Launch', () => {
  test('app loads without errors', async ({ page }) => {
    const monitor = monitorConsoleErrors(page);

    await navigateToCanva(page);

    // The canva builder should be visible
    await expect(page.locator('[data-testid="canva-builder"]')).toBeVisible();

    // Check for console errors — allow some React/Hydration warnings but fail on real errors
    const errors = monitor.getErrors();
    // Filter out known non-critical warnings (React hydration, etc.)
    const criticalErrors = errors.filter(e =>
      !e.includes('hydration') &&
      !e.includes('Warning:') &&
      !e.includes('downloadable font') &&
      !e.includes('net::ERR')
    );
    expect(criticalErrors.length, `Critical console errors: ${criticalErrors.join('\n')}`).toBe(0);

    monitor.cleanup();
  });

  test('main canvas area is visible', async ({ page }) => {
    await navigateToCanva(page);

    await expect(page.locator('[data-testid="canvas-stage"]')).toBeVisible();
  });

  test('left panel is visible in edit mode', async ({ page }) => {
    await navigateToCanva(page);

    await expect(page.locator('[data-testid="left-panel"]')).toBeVisible();
  });

  test('right panel is visible in edit mode', async ({ page }) => {
    await navigateToCanva(page);

    await expect(page.locator('[data-testid="right-panel"]')).toBeVisible();
  });

  test('toolbar is visible', async ({ page }) => {
    await navigateToCanva(page);

    await expect(page.locator('[data-testid="toolbar"]')).toBeVisible();
  });

  test('sidebar navigation is functional', async ({ page }) => {
    await navigateToCanva(page);

    // The AuthoringTool sidebar should have nav buttons
    const canvaNav = page.locator('[data-testid="nav-canva"]');
    await expect(canvaNav).toBeVisible();

    // Clicking Dashboard should switch away from Canva
    const dashboardNav = page.locator('[data-testid="nav-dashboard"]');
    await expect(dashboardNav).toBeVisible();
    await dashboardNav.click();

    // Canva builder should no longer be visible
    await expect(page.locator('[data-testid="canva-builder"]')).not.toBeVisible({ timeout: 5000 });

    // Click back to Canva
    await canvaNav.click();
    await expect(page.locator('[data-testid="canva-builder"]')).toBeVisible({ timeout: 10000 });
  });
});
