import { test, expect, type Page } from '@playwright/test';

async function setupAndEnterCanva(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1, h2, nav', { timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

  for (let i = 0; i < 3; i++) {
    const skip = page.locator('button:has-text("Lewati")');
    if (await skip.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skip.click({ force: true });
      await page.waitForTimeout(500);
    } else break;
  }

  const tmpl = page.locator('button:has-text("Materi + Kuis")').first();
  await tmpl.waitFor({ state: 'visible', timeout: 15000 });
  await tmpl.click();
  await page.waitForTimeout(3000);

  const use = page.locator('button:has-text("Gunakan Template")');
  await use.waitFor({ state: 'visible', timeout: 10000 });
  await use.click();
  await page.waitForTimeout(4000);
}

test.describe('V3-PHASE-1B — Route Lock', () => {
  test('teacherMode=false still enters Workspace V2 (not old editor)', async ({ page }) => {
    await setupAndEnterCanva(page);

    await page.evaluate(() => {
      (window as any).__useCanvaStore.getState().setTeacherMode(false);
      (window as any).__useCanvaStore.getState().setAppMode('edit');
    });
    await page.waitForTimeout(3000);

    await expect(page.locator('[data-testid="mpi-workspace-v2"]')).toBeVisible({ timeout: 10000 });

    const oldEditorVisible = await page.locator('[data-testid="canva-builder"]').isVisible().catch(() => false);
    expect(oldEditorVisible).toBe(false);
  });

  test('teacherMode=true enters Workspace V2', async ({ page }) => {
    await setupAndEnterCanva(page);

    await page.evaluate(() => {
      (window as any).__useCanvaStore.getState().setTeacherMode(true);
      (window as any).__useCanvaStore.getState().setAppMode('edit');
    });
    await page.waitForTimeout(3000);

    await expect(page.locator('[data-testid="mpi-workspace-v2"]')).toBeVisible({ timeout: 10000 });
  });
});
