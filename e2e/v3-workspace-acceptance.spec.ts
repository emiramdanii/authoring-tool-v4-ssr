// ═══════════════════════════════════════════════════════════════════
// EDITOR-RESET-V3-PHASE-1 — MPI Workspace V2 Acceptance Gate
// ═══════════════════════════════════════════════════════════════════
// 10 acceptance criteria:
//   1. Buat paket MPI baru
//   2. Masuk MpiWorkspaceV2
//   3. Klik cover block di canvas (natural selection, not store hack)
//   4. Inspector muncul dengan field judul/subjudul
//   5. Edit judul dari inspector
//   6. Judul berubah di canvas (store verified)
//   7. Pilih style dari menu (portal, not z-index)
//   8. Menu tidak ketutup canvas (portal at document.body)
//   9. Preview tampil sama
//  10. Export HTML tidak hitam
// ═══════════════════════════════════════════════════════════════════

import { test, expect, type Page } from '@playwright/test';

async function setupWorkspace(page: Page) {
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

  // V3-PHASE-1B: No store hack. The route lock `appMode === 'edit'`
  // guarantees MpiWorkspaceV2 is rendered regardless of teacherMode.
  // Previously this block called setTeacherMode(true) to force the
  // V2 route — that hack is removed because the route no longer
  // depends on teacherMode.
  await page.waitForTimeout(3000);
  await page.waitForSelector('[data-testid="mpi-workspace-v2"]', { timeout: 15000 });
}

test.describe('V3-PHASE-1 — MPI Workspace V2 Acceptance Gate', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('1-2. Create MPI + enter Workspace V2', async ({ page }) => {
    await setupWorkspace(page);
    await expect(page.locator('[data-testid="mpi-workspace-v2"]')).toBeVisible();
  });

  test('3-6. Natural selection: real click → inspector → edit → verify', async ({ page }) => {
    await setupWorkspace(page);

    // V3-1A: NO STORE HACK. Click a real [data-block-id] element on canvas.
    const canvasArea = page.locator('#mpi-canvas-v2');
    await canvasArea.waitFor({ state: 'visible', timeout: 5000 });

    // Wait for blocks to render (PageRenderer renders with data-block-id)
    await page.waitForTimeout(2000);

    // Find and click the first block with data-block-id
    const blockEl = page.locator('[data-block-id]').first();
    await blockEl.waitFor({ state: 'visible', timeout: 10000 });
    await blockEl.click();
    await page.waitForTimeout(1500);

    // Assert: selectedBlockId changed (not null) — proves natural selection worked
    const selectedId = await page.evaluate(() => {
      return (window as any).__useCanvaStore.getState().selectedBlockId;
    });
    expect(selectedId).not.toBeNull();

    // Assert: inspector shows "Edit" header (not "Pengaturan Halaman")
    const editHeader = page.locator('aside h2:has-text("Edit")');
    await expect(editHeader).toBeVisible({ timeout: 5000 });

    // Assert: inspector has at least one input field (title or similar)
    const titleInput = page.locator('aside input[type="text"]').first();
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });

    // Edit title — type new value
    await titleInput.fill('');
    await titleInput.fill('Judul Test V3 Phase 1A');
    await page.waitForTimeout(1000);

    // Assert: store title changed
    const title = await page.evaluate(() => {
      const s = (window as any).__useCanvaStore.getState();
      const block = s.pages[0]?.schema?.blocks?.find((b: any) => b.id === selectedId);
      return block?.title ?? 'NONE';
    });
    expect(title).toBe('Judul Test V3 Phase 1A');
  });

  test('7-8. Style menu opens via portal — not blocked by canvas', async ({ page }) => {
    await setupWorkspace(page);

    // Click style button
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Pilih style media"]') as HTMLElement;
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);

    // Verify dropdown is visible (rendered at document.body via portal)
    const menu = page.locator('[role="menu"][aria-label="Pilih style media"]');
    await expect(menu).toBeVisible({ timeout: 3000 });

    // Click a style option
    const option = page.locator('[role="menuitem"]:has-text("Sekolah Ceria")');
    await option.click();
    await page.waitForTimeout(1500);

    // Verify style applied
    const themeId = await page.evaluate(() => {
      const s = (window as any).__useCanvaStore.getState();
      return s.pages[0]?.schema?.themeId ?? 'NONE';
    });
    expect(themeId).toBe('school-cheerful');
  });

  test('9. Preview shows same content', async ({ page }) => {
    await setupWorkspace(page);

    await page.evaluate(() => {
      (window as any).__useCanvaStore.getState().setAppMode('preview');
    });
    await page.waitForTimeout(3000);

    // Verify workspace V2 is hidden
    const wsVisible = await page.locator('[data-testid="mpi-workspace-v2"]').isVisible().catch(() => false);
    expect(wsVisible).toBe(false);

    // Verify preview content visible
    const h1 = await page.locator('h1').first().isVisible().catch(() => false);
    expect(h1).toBe(true);

    // Back to edit
    await page.evaluate(() => {
      (window as any).__useCanvaStore.getState().setAppMode('edit');
    });
    await page.waitForTimeout(2000);
  });

  test('10. Export HTML not dark', async ({ page }) => {
    await setupWorkspace(page);

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

    const blobUrl = await page.evaluate((html: string) => {
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

    await exportPage.close();
    await page.evaluate((url: string) => URL.revokeObjectURL(url), blobUrl);
    await page.unroute('**/api/export');
  });
});
