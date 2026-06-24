// ═══════════════════════════════════════════════════════════════════
// VISUAL-STABILIZATION-01 — Visual Gate E2E Test
// ═══════════════════════════════════════════════════════════════════
// Verifies:
//   1. Style button visible at 1280×720 AND 768×720
//   2. Mode Lanjutan button visible at both viewports
//   3. Canvas not clipped (content height > 0, no scroll needed)
//   4. Preview button visible
//   5. Export button visible
//   6. No fatal console errors
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

test.describe('VISUAL-STABILIZATION-01 — Visual Gate', () => {

  // ── 1280×720 (desktop) ───────────────────────────────────────

  test.describe('Desktop 1280×720', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('all toolbar buttons visible + canvas not clipped', async ({ page }) => {
      const fatalErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const t = msg.text();
          if (!['React DevTools', 'SchemaFactory', 'Perf', 'MeasuredBlock', 'metadataBase'].some(p => t.includes(p))) {
            fatalErrors.push(t);
          }
        }
      });
      page.on('pageerror', (e) => fatalErrors.push(`PAGE: ${e.message}`));

      await setupMpiStudio(page);

      // 1. Style button visible
      const styleBtn = page.locator('button[aria-label="Pilih style media"]');
      await expect(styleBtn).toBeVisible({ timeout: 5000 });

      // 2. Mode Lanjutan button visible
      const advancedBtn = page.locator('button[aria-label="Beralih ke mode editor lanjutan"]');
      await expect(advancedBtn).toBeVisible({ timeout: 5000 });

      // 3. Preview button visible
      const previewBtn = page.locator('button[aria-label="Pratinjau media"]');
      await expect(previewBtn).toBeVisible({ timeout: 5000 });

      // 4. Export button visible
      const exportBtn = page.locator('button[aria-label="Export ke HTML"]');
      await expect(exportBtn).toBeVisible({ timeout: 5000 });

      // 5. Canvas not clipped — content area has non-zero height
      const canvasInfo = await page.evaluate(() => {
        const canvas = document.getElementById('mpi-canvas');
        if (!canvas) return null;
        const wrapper = canvas.querySelector('.relative.bg-white.rounded-lg');
        if (!wrapper) return null;
        const rect = wrapper.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });
      expect(canvasInfo).not.toBeNull();
      expect(canvasInfo!.height).toBeGreaterThan(50); // not collapsed/clipped
      expect(canvasInfo!.width).toBeGreaterThan(100);

      // 6. No fatal errors
      expect(fatalErrors).toEqual([]);
    });
  });

  // ── 768×720 (narrow / tablet) ────────────────────────────────

  test.describe('Narrow 768×720', () => {
    test.use({ viewport: { width: 768, height: 720 } });

    test('all toolbar buttons visible + canvas not clipped', async ({ page }) => {
      const fatalErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const t = msg.text();
          if (!['React DevTools', 'SchemaFactory', 'Perf', 'MeasuredBlock', 'metadataBase'].some(p => t.includes(p))) {
            fatalErrors.push(t);
          }
        }
      });
      page.on('pageerror', (e) => fatalErrors.push(`PAGE: ${e.message}`));

      await setupMpiStudio(page);

      // 1. Style button visible (was hidden with md:block before)
      const styleBtn = page.locator('button[aria-label="Pilih style media"]');
      await expect(styleBtn).toBeVisible({ timeout: 5000 });

      // 2. Mode Lanjutan button visible
      const advancedBtn = page.locator('button[aria-label="Beralih ke mode editor lanjutan"]');
      await expect(advancedBtn).toBeVisible({ timeout: 5000 });

      // 3. Preview button visible
      const previewBtn = page.locator('button[aria-label="Pratinjau media"]');
      await expect(previewBtn).toBeVisible({ timeout: 5000 });

      // 4. Export button visible
      const exportBtn = page.locator('button[aria-label="Export ke HTML"]');
      await expect(exportBtn).toBeVisible({ timeout: 5000 });

      // 5. Canvas not clipped
      const canvasInfo = await page.evaluate(() => {
        const canvas = document.getElementById('mpi-canvas');
        if (!canvas) return null;
        const wrapper = canvas.querySelector('.relative.bg-white.rounded-lg');
        if (!wrapper) return null;
        const rect = wrapper.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });
      expect(canvasInfo).not.toBeNull();
      expect(canvasInfo!.height).toBeGreaterThan(50);
      expect(canvasInfo!.width).toBeGreaterThan(100);

      // 6. No fatal errors
      expect(fatalErrors).toEqual([]);
    });
  });

  // ── Mode Lanjutan actually switches to old editor ────────────

  test('Mode Lanjutan button switches to old editor (teacherMode=false)', async ({ page }) => {
    // Note: viewport is inherited from the describe block or default
    await setupMpiStudio(page);

    // Click Mode Lanjutan
    const advancedBtn = page.locator('button[aria-label="Beralih ke mode editor lanjutan"]');
    await advancedBtn.click();
    await page.waitForTimeout(3000);

    // MPI Studio shell should be gone
    const mpiShellVisible = await page.locator('[data-testid="mpi-editor-shell"]').isVisible().catch(() => false);
    expect(mpiShellVisible).toBe(false);

    // Verify teacherMode is false in store
    const teacherMode = await page.evaluate(() => {
      return (window as unknown as { __useCanvaStore: { getState: () => { teacherMode: boolean } } }).__useCanvaStore.getState().teacherMode;
    });
    expect(teacherMode).toBe(false);

    // Old editor should be visible — check for either canva-builder OR toolbar
    // (old editor may take a moment to render after teacherMode switches)
    const oldEditorVisible = await page.locator('[data-testid="canva-builder"], [data-testid="toolbar"]').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(oldEditorVisible).toBe(true);
  });
});
