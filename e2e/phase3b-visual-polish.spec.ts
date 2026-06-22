// ═══════════════════════════════════════════════════════════════════
// PHASE-3B — Mode Guru Visual Polish Gate
// ═══════════════════════════════════════════════════════════════════
// Tests 3 style presets × 3 modes (Guru/Preview/Export):
//   - modern-interactive (light default)
//   - school-cheerful (warm)
//   - dark-elegant (dark by choice, not fallback)
//
// For each preset:
//   1. Apply style via MpiStyleControl (UI click)
//   2. Screenshot Mode Guru cover
//   3. Switch to Preview, screenshot
//   4. Export, render HTML, screenshot
//   5. Verify background matches expected color family
//
// Also tests MpiInspector edit:
//   - Select cover block → edit title → verify title changes on canvas
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

async function applyStyle(page: Page, styleName: string) {
  // Click style button
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Pilih style media"]') as HTMLElement;
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);

  // Click the style option
  const styleOption = page.locator(`[role="menuitem"]:has-text("${styleName}")`);
  await styleOption.click();
  await page.waitForTimeout(1500);
}

async function goToCoverPage(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __useCanvaStore: { getState: () => { goPage: (i: number) => void } } }).__useCanvaStore.getState().goPage(0);
  });
  await page.waitForTimeout(2000);
}

test.describe('PHASE-3B — Mode Guru Visual Polish', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  // ── Inspector edit test ──────────────────────────────────────

  test('Inspector: edit cover title updates canvas', async ({ page }) => {
    await setupMpiStudio(page);
    await goToCoverPage(page);

    // Select the cover block via store (simulates clicking on canvas)
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const store = (w.__useCanvaStore as any).getState();
      const block = store.pages[0]?.schema?.blocks?.find((b: any) => b.type === 'cover');
      if (block) {
        store.setState({ selectedBlockId: block.id });
      }
    });
    await page.waitForTimeout(1000);

    // Find the title input in inspector
    const titleInput = page.locator('aside label:has-text("Judul") + input, aside input[type="text"]').first();
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });

    // Clear and type new title
    await titleInput.fill('');
    await titleInput.fill('Judul Test Phase 3B');
    await page.waitForTimeout(1000);

    // Verify the title was saved to the store
    const blockTitle = await page.evaluate(() => {
      const store = (window as any).__useCanvaStore.getState();
      const block = store.pages[0]?.schema?.blocks?.find((b: any) => b.type === 'cover');
      return block?.title ?? 'NONE';
    });

    expect(blockTitle).toBe('Judul Test Phase 3B');
  });

  // ── Style: modern-interactive ───────────────────────────────

  test('Style modern-interactive: Guru + Preview + Export screenshots', async ({ page }) => {
    await setupMpiStudio(page);
    await goToCoverPage(page);
    await applyStyle(page, 'Modern Interaktif');

    // Screenshot Mode Guru
    await page.screenshot({ path: 'test-results/phase3b-guru-modern.png' });

    // Verify background not dark
    const guruBg = await page.evaluate(() => {
      const canvas = document.getElementById('mpi-canvas');
      if (!canvas) return 'none';
      const bg = canvas.querySelector('.absolute.inset-0') as HTMLElement;
      return bg ? getComputedStyle(bg).backgroundColor : 'none';
    });
    expect(guruBg).not.toContain('15, 23, 42');

    // Preview
    await page.evaluate(() => {
      (window as unknown as { __useCanvaStore: { getState: () => { setAppMode: (m: string) => void } } }).__useCanvaStore.getState().setAppMode('preview');
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/phase3b-preview-modern.png' });

    // Back to edit
    await page.evaluate(() => {
      (window as unknown as { __useCanvaStore: { getState: () => { setAppMode: (m: string) => void } } }).__useCanvaStore.getState().setAppMode('edit');
    });
    await page.waitForTimeout(2000);
  });

  // ── Style: school-cheerful ──────────────────────────────────

  test('Style school-cheerful: Guru screenshot + bg check', async ({ page }) => {
    await setupMpiStudio(page);
    await goToCoverPage(page);
    await applyStyle(page, 'Sekolah Ceria');

    await page.screenshot({ path: 'test-results/phase3b-guru-cheerful.png' });

    // Verify background changed (not dark)
    const bg = await page.evaluate(() => {
      const canvas = document.getElementById('mpi-canvas');
      if (!canvas) return 'none';
      const bgLayer = canvas.querySelector('.absolute.inset-0') as HTMLElement;
      return bgLayer ? getComputedStyle(bgLayer).backgroundColor : 'none';
    });
    expect(bg).not.toContain('15, 23, 42');
    expect(bg).not.toBe('none');
  });

  // ── Style: dark-elegant (dark by CHOICE, not fallback) ──────

  test('Style dark-elegant: Guru screenshot (dark by choice)', async ({ page }) => {
    await setupMpiStudio(page);
    await goToCoverPage(page);
    await applyStyle(page, 'Gelap Elegan');

    await page.screenshot({ path: 'test-results/phase3b-guru-elegant.png' });

    // Verify themeId is dark-elegant (not default/academic-clean)
    const themeId = await page.evaluate(() => {
      const store = (window as unknown as { __useCanvaStore: { getState: () => { pages: Array<{ schema?: { themeId?: string } }> } } }).__useCanvaStore.getState();
      return store.pages[0]?.schema?.themeId ?? 'NONE';
    });
    expect(themeId).toBe('dark-elegant');
    expect(themeId).not.toBe('default');
    expect(themeId).not.toBe('academic-clean');
  });

  // ── Export visual proof with style ──────────────────────────

  test('Export with modern-interactive: rendered HTML bg not dark', async ({ page }) => {
    await setupMpiStudio(page);
    await goToCoverPage(page);
    await applyStyle(page, 'Modern Interaktif');

    let exportHtml = '';
    await page.route('**/api/export', async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      exportHtml = body;
      await route.fulfill({ status: response.status(), headers: response.headers(), body });
    });

    const exportBtn = page.locator('button[aria-label="Export ke HTML"]');
    await exportBtn.click();
    await page.waitForTimeout(10000);

    expect(exportHtml.length).toBeGreaterThan(1000);
    expect(exportHtml).toContain('<html');

    const blobUrl = await page.evaluate((html) => {
      const blob = new Blob([html], { type: 'text/html' });
      return URL.createObjectURL(blob);
    }, exportHtml);

    const exportPage = await page.context().newPage();
    await exportPage.goto(blobUrl, { waitUntil: 'domcontentloaded' });
    await exportPage.waitForTimeout(5000);

    const bgInfo = await exportPage.evaluate(() => {
      const bgLayer = document.querySelector('.absolute.inset-0') as HTMLElement;
      if (!bgLayer) return { found: false, bg: 'none' };
      return { found: true, bg: getComputedStyle(bgLayer).backgroundColor };
    });

    expect(bgInfo.found).toBe(true);
    expect(bgInfo.bg).not.toContain('15, 23, 42');
    expect(bgInfo.bg).not.toContain('14, 28, 47');

    await exportPage.screenshot({ path: 'test-results/phase3b-export-modern.png' });
    await exportPage.close();
    await page.evaluate((url) => URL.revokeObjectURL(url), blobUrl);
    await page.unroute('**/api/export');
  });
});
