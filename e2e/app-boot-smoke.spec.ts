import { test, expect } from '@playwright/test';

test('app does not stuck loading — dashboard visible within 10s', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Wait up to 10s for app content to appear (not stuck on loading)
  await page.waitForSelector('nav[aria-label="Menu utama"], h1, h2, [data-testid="mpi-workspace-v2"]', {
    timeout: 10000,
  });

  // Assert we're NOT still showing the loading text
  const loadingText = await page.locator('text=Memuat Media Pembelajaran Interaktif...').isVisible({ timeout: 500 }).catch(() => false);
  expect(loadingText).toBe(false);

  // Assert some real app content is visible
  const hasNav = await page.locator('nav, [role="navigation"]').first().isVisible().catch(() => false);
  const hasHeading = await page.locator('h1, h2').first().isVisible().catch(() => false);
  const hasWorkspace = await page.locator('[data-testid="mpi-workspace-v2"]').isVisible().catch(() => false);
  expect(hasNav || hasHeading || hasWorkspace).toBe(true);
});
