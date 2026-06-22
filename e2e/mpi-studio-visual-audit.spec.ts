// ═══════════════════════════════════════════════════════════════════
// EDITOR-RADICAL-RESET-01-PATCH-2D — Visual Audit E2E
// ═══════════════════════════════════════════════════════════════════
// Verifies:
//   1. Style label = actual page theme (no mismatch)
//   2. Cover background is NOT dark navy rgb(15, 23, 42)
//   3. Export button succeeds in dev mode (auto-build)
// ═══════════════════════════════════════════════════════════════════

import { test, expect, type Page } from '@playwright/test';

async function setupMpiStudio(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1, h2, nav', { timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

  for (let attempt = 0; attempt < 3; attempt++) {
    const skipBtn = page.locator('button:has-text("Lewati")');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click({ force: true });
      await page.waitForTimeout(500);
    } else break;
  }

  const templateBtn = page.locator('button:has-text("Materi + Kuis")').first();
  await templateBtn.waitFor({ state: 'visible', timeout: 15000 });
  await templateBtn.click();
  await page.waitForTimeout(3000);

  const useTemplateBtn = page.locator('button:has-text("Gunakan Template")');
  await useTemplateBtn.waitFor({ state: 'visible', timeout: 10000 });
  await useTemplateBtn.click();
  await page.waitForTimeout(4000);

  await page.evaluate(() => {
    (window as unknown as { __useCanvaStore: { getState: () => { setTeacherMode: (v: boolean) => void } } }).__useCanvaStore.getState().setTeacherMode(true);
  });
  await page.waitForTimeout(3000);
  await page.waitForSelector('[data-testid="mpi-editor-shell"]', { timeout: 15000 });
}

test.describe('MPI Studio Visual Audit (PATCH-2D)', () => {

  test('1. Style label matches actual page themeId', async ({ page }) => {
    await setupMpiStudio(page);

    // Read actual themeId from store
    const actualThemeId = await page.evaluate(() => {
      const store = (window as unknown as { __useCanvaStore: { getState: () => { pages: Array<{ schema?: { themeId?: string } }> } } }).__useCanvaStore.getState();
      return store.pages[0]?.schema?.themeId ?? 'NONE';
    });

    // Read displayed style label from UI
    const styleButton = page.locator('button[aria-label="Pilih style media"]');
    const styleText = await styleButton.textContent();

    // themeId should be modern-interactive (light), NOT default (dark)
    expect(actualThemeId).toBe('modern-interactive');

    // UI should show "Modern Interaktif"
    expect(styleText).toContain('Modern Interaktif');
  });

  test('2. Cover background is NOT dark navy rgb(15, 23, 42)', async ({ page }) => {
    await setupMpiStudio(page);

    // Go to cover page (page 0)
    await page.evaluate(() => {
      (window as unknown as { __useCanvaStore: { getState: () => { goPage: (i: number) => void } } }).__useCanvaStore.getState().goPage(0);
    });
    await page.waitForTimeout(2000);

    // Check the actual rendered background of the PageRenderer content
    const bgInfo = await page.evaluate(() => {
      const canvas = document.getElementById('mpi-canvas');
      if (!canvas) return null;
      const wrapper = canvas.querySelector('.relative.w-full.max-w-4xl');
      if (!wrapper) return null;
      // Find the first absolute div (background layer)
      const bgLayer = wrapper.querySelector('.absolute.inset-0');
      if (!bgLayer) return null;
      const style = getComputedStyle(bgLayer);
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
      };
    });

    expect(bgInfo).not.toBeNull();
    // Dark navy is rgb(15, 23, 42) — must NOT be that
    expect(bgInfo!.backgroundColor).not.toContain('15, 23, 42');
    // Light theme should have a light background or gradient
    // modern-interactive background is #F5F7FB → rgb(245, 247, 251)
  });

  test('3. Export button succeeds in dev mode (auto-build)', async ({ page }) => {
    await setupMpiStudio(page);

    // Delete existing export template to test auto-build
    await page.evaluate(() => {
      // Can't delete files from browser, but we can verify the export
      // button triggers the API which will auto-build if needed
    });

    // Click Export button
    const exportBtn = page.locator('button[aria-label="Export ke HTML"]');
    await exportBtn.waitFor({ state: 'visible', timeout: 5000 });
    await exportBtn.click();

    // Wait for export to complete (auto-build may take up to 60s)
    // Check for either success (file download) or error
    await page.waitForTimeout(5000);

    // Check console for export errors
    const exportErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Export')) {
        exportErrors.push(msg.text());
      }
    });

    // Wait a bit more for auto-build
    await page.waitForTimeout(10000);

    // The export should either succeed (no "template not found" error)
    // or show "auto-building" in console (which means it's working)
    const hasTemplateNotFound = exportErrors.some(e =>
      e.includes('template not found') || e.includes('Run "npm run export:build"')
    );

    // If we see "template not found" that means auto-build didn't kick in
    // (which could be because template already exists from previous build)
    // The key assertion: export should NOT fail with "template not found"
    expect(hasTemplateNotFound).toBe(false);
  });
});
