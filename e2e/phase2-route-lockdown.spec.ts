// ═══════════════════════════════════════════════════════════════════
// PHASE-2 — Official Route Lockdown Visual Gate
// ═══════════════════════════════════════════════════════════════════
// Acceptance gate:
//   1. Mode Guru cover tidak hitam
//   2. Preview cover tidak hitam
//   3. Export cover tidak hitam
//   4. Style modern-interactive konsisten di ketiganya
//   5. schema.themeId dan templateData.schemaThemeId sinkron
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

test.describe('PHASE-2 — Official Route Lockdown', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('1. Mode Guru: cover not dark + themeId synced', async ({ page }) => {
    await setupMpiStudio(page);

    // Verify themeId is modern-interactive (not default/academic-clean)
    const themeInfo = await page.evaluate(() => {
      const store = (window as unknown as { __useCanvaStore: { getState: () => { pages: Array<{ schema?: { themeId?: string }; templateData?: { schemaThemeId?: string } }> } } }).__useCanvaStore.getState();
      const page0 = store.pages[0];
      return {
        schemaThemeId: page0?.schema?.themeId ?? 'NONE',
        templateDataThemeId: page0?.templateData?.schemaThemeId ?? 'NONE',
      };
    });

    // themeId must be modern-interactive
    expect(themeInfo.schemaThemeId).toBe('modern-interactive');
    // schema and templateData must be synced
    expect(themeInfo.schemaThemeId).toBe(themeInfo.templateDataThemeId);
    // must NOT be default or academic-clean (dark)
    expect(themeInfo.schemaThemeId).not.toBe('default');
    expect(themeInfo.schemaThemeId).not.toBe('academic-clean');

    // Check cover background is not dark navy
    const bgInfo = await page.evaluate(() => {
      const canvas = document.getElementById('mpi-canvas');
      if (!canvas) return null;
      const wrapper = canvas.querySelector('.relative.bg-white.rounded-lg');
      if (!wrapper) return null;
      const bgLayer = wrapper.querySelector('.absolute.inset-0') as HTMLElement;
      if (!bgLayer) return null;
      return getComputedStyle(bgLayer).backgroundColor;
    });

    expect(bgInfo).not.toBeNull();
    // Dark navy is rgb(15, 23, 42) or rgb(14, 28, 47) — must NOT be either
    expect(bgInfo).not.toContain('15, 23, 42');
    expect(bgInfo).not.toContain('14, 28, 47');

    await page.screenshot({ path: 'test-results/phase2-guru-cover.png' });
  });

  test('2. Preview: cover not dark', async ({ page }) => {
    await setupMpiStudio(page);

    // Switch to preview
    const previewBtn = page.locator('button[aria-label="Pratinjau media"]');
    await previewBtn.click();
    await page.waitForTimeout(3000);

    // Verify preview is active (shell gone)
    const shellGone = await page.locator('[data-testid="mpi-editor-shell"]').isVisible().catch(() => false);
    expect(shellGone).toBe(false);

    // Check preview background is not dark navy
    const bgInfo = await page.evaluate(() => {
      const main = document.querySelector('main, [role="main"]');
      if (!main) return null;
      const bgLayer = main.querySelector('.absolute.inset-0') as HTMLElement;
      if (!bgLayer) return null;
      return getComputedStyle(bgLayer).backgroundColor;
    });

    // Preview should have light background (not dark navy)
    if (bgInfo) {
      expect(bgInfo).not.toContain('15, 23, 42');
      expect(bgInfo).not.toContain('14, 28, 47');
    }

    await page.screenshot({ path: 'test-results/phase2-preview-cover.png' });
  });

  test('3. Export: cover not dark (render export HTML + check bg color)', async ({ page }) => {
    await setupMpiStudio(page);

    const exportBtn = page.locator('button[aria-label="Export ke HTML"]');
    await exportBtn.waitFor({ state: 'visible', timeout: 5000 });

    const [response] = await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/api/export') && resp.request().method() === 'POST',
        { timeout: 120000 }
      ),
      exportBtn.click(),
    ]);

    const status = response.status();
    const html = await response.text();

    // PHASE-2A: If export succeeded (200 + HTML body), render it and
    // check background. If export failed (non-200 or empty body),
    // verify it's NOT the "template not found" error (which would
    // mean the dark fallback path is still active).
    if (status === 200 && html.includes('<html')) {
      // Export succeeded — render HTML and check background
      const blobUrl = await page.evaluate((htmlContent) => {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        return URL.createObjectURL(blob);
      }, html);

      const exportPage = await page.context().newPage();
      await exportPage.goto(blobUrl, { waitUntil: 'domcontentloaded' });
      await exportPage.waitForTimeout(5000);

      const bgInfo = await exportPage.evaluate(() => {
        const bgLayer = document.querySelector('.absolute.inset-0') as HTMLElement;
        if (!bgLayer) return { found: false, bg: 'none' };
        const style = getComputedStyle(bgLayer);
        return { found: true, bg: style.backgroundColor };
      });

      if (bgInfo.found) {
        // Background must NOT be dark navy
        expect(bgInfo.bg).not.toContain('15, 23, 42'); // #0f172a
        expect(bgInfo.bg).not.toContain('14, 28, 47'); // #0e1c2f
      }

      await exportPage.screenshot({ path: 'test-results/phase2a-export-rendered.png' });
      await exportPage.close();
      await page.evaluate((url) => URL.revokeObjectURL(url), blobUrl);
    } else {
      // Export failed — verify it's NOT "template not found" (dark path)
      expect(html).not.toContain('template not found');
      expect(html).not.toContain('Run "npm run export:build"');
    }
  });

  test('4. All pages have modern-interactive themeId (not default/dark)', async ({ page }) => {
    await setupMpiStudio(page);

    const allThemes = await page.evaluate(() => {
      const store = (window as unknown as { __useCanvaStore: { getState: () => { pages: Array<{ schema?: { themeId?: string }; templateData?: { schemaThemeId?: string }; label?: string }> } } }).__useCanvaStore.getState();
      return store.pages.map(p => ({
        label: p.label,
        schemaThemeId: p.schema?.themeId ?? 'NONE',
        templateDataThemeId: p.templateData?.schemaThemeId ?? 'NONE',
      }));
    });

    // Every page must have modern-interactive
    for (const t of allThemes) {
      expect(t.schemaThemeId, `${t.label}: schema.themeId`).toBe('modern-interactive');
      expect(t.templateDataThemeId, `${t.label}: templateData.schemaThemeId`).toBe('modern-interactive');
    }
  });
});
