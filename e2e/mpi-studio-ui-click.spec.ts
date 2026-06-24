// ═══════════════════════════════════════════════════════════════════
// EDITOR-RADICAL-RESET-01-PATCH-2C — MPI Studio UI-Click E2E Test
// ═══════════════════════════════════════════════════════════════════
// Real UI-click E2E test — clicks ACTUAL BUTTONS, not store hacks.
//
// Senior audit (PATCH-2B feedback): "test masih bypass klik UI untuk
// Tambah Cover/Game. Tombol UI guru belum terbukti."
//
// This test clicks the real buttons:
//   1. Klik tombol "Tambah Halaman" → menu muncul
//   2. Klik menu "Cover" → cover page bertambah
//   3. Klik tombol "Tambah Halaman" → menu muncul
//   4. Klik menu "Materi" → materi page bertambah
//   5. Klik tombol "Tambah Halaman" → menu muncul
//   6. Klik menu "Kuis" → kuis page bertambah
//   7. Klik tombol "Tambah Game" → game page bertambah
//   8. Klik tombol "Preview" → preview mode
//   9. Shell editor hilang, preview muncul
//  10. No fatal console/page error
// ═══════════════════════════════════════════════════════════════════

import { test, expect, type Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────
// Helper: setup MPI Studio (shared with layout smoke test)
// ─────────────────────────────────────────────────────────────────

async function setupMpiStudio(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Wait for app to load
  await page.waitForSelector('h1, h2, nav', { timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

  // Skip guided tour if present
  for (let attempt = 0; attempt < 3; attempt++) {
    const skipBtn = page.locator('button:has-text("Lewati")');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click({ force: true });
      await page.waitForTimeout(500);
    } else {
      break;
    }
  }

  // Click "Materi + Kuis" template
  const templateBtn = page.locator('button:has-text("Materi + Kuis")').first();
  await templateBtn.waitFor({ state: 'visible', timeout: 15000 });
  await templateBtn.click();
  await page.waitForTimeout(3000);

  // Click "Gunakan Template"
  const useTemplateBtn = page.locator('button:has-text("Gunakan Template")');
  await useTemplateBtn.waitFor({ state: 'visible', timeout: 10000 });
  await useTemplateBtn.click();
  await page.waitForTimeout(4000);

  // Enable teacher mode via store (only for initial setup — NOT for add page/game)
  await page.evaluate(() => {
    (window as unknown as { __useCanvaStore: { getState: () => { setTeacherMode: (v: boolean) => void } } }).__useCanvaStore.getState().setTeacherMode(true);
  });
  await page.waitForTimeout(3000);

  // Wait for MPI Studio shell
  await page.waitForSelector('[data-testid="mpi-editor-shell"]', { timeout: 15000 });
}

/**
 * Get current page count from store (read-only, not a mutation).
 * Used to verify that UI clicks actually increased the page count.
 */
async function getPageCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    return (window as unknown as { __useCanvaStore: { getState: () => { pages: unknown[] } } }).__useCanvaStore.getState().pages.length;
  });
}

/**
 * Get the last page's schema info (read-only verification).
 */
async function getLastPageInfo(page: Page): Promise<{
  templateType: string;
  label: string;
  blockCount: number;
  firstBlockType: string | null;
} | null> {
  return page.evaluate(() => {
    const store = (window as unknown as { __useCanvaStore: { getState: () => { pages: Array<{ templateType: string; label: string; schema?: { blocks: Array<{ type: string }> } }> } } }).__useCanvaStore.getState();
    const lastPage = store.pages[store.pages.length - 1];
    if (!lastPage) return null;
    return {
      templateType: lastPage.templateType,
      label: lastPage.label,
      blockCount: lastPage.schema?.blocks?.length ?? 0,
      firstBlockType: lastPage.schema?.blocks?.[0]?.type ?? null,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════
// Tests — ALL clicks are on real UI buttons, NO store mutations
// ═══════════════════════════════════════════════════════════════════

test.describe('MPI Studio UI-Click Smoke', () => {

  // ── Full flow test: Cover → Materi → Kuis → Game → Preview ──

  test('UI-click: Tambah Halaman → Cover → Materi → Kuis → Tambah Game → Preview', async ({ page }) => {
    // Collect fatal errors
    const fatalErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const nonFatal = [
          'React DevTools', 'Download the React DevTools',
          'Warning: [SchemaFactory]', 'Warning: [Perf]',
          'Warning: [MeasuredBlock]', 'metadataBase property',
        ];
        if (!nonFatal.some(p => text.includes(p))) {
          fatalErrors.push(text);
        }
      }
    });
    page.on('pageerror', (error) => {
      fatalErrors.push(`PAGE ERROR: ${error.message}`);
    });

    await setupMpiStudio(page);

    const initialCount = await getPageCount(page);

    // ── 1. Klik tombol "Tambah Halaman" ──────────────────────
    const tambahHalamanBtn = page.locator('button[aria-label="Tambah halaman baru"]');
    await tambahHalamanBtn.waitFor({ state: 'visible', timeout: 5000 });
    await tambahHalamanBtn.click();
    await page.waitForTimeout(500);

    // Verify menu appeared
    const menu = page.locator('[role="menu"][aria-label="Pilih tipe halaman"]');
    await expect(menu).toBeVisible({ timeout: 3000 });

    // ── 2. Klik menu "Cover" ─────────────────────────────────
    const coverMenuItem = page.locator('[role="menuitem"]:has-text("Cover")');
    await coverMenuItem.click();
    await page.waitForTimeout(2000);

    // Verify cover page added
    const afterCoverCount = await getPageCount(page);
    expect(afterCoverCount).toBe(initialCount + 1);

    // Verify cover schema is correct (NOT blank)
    const coverInfo = await getLastPageInfo(page);
    expect(coverInfo).not.toBeNull();
    expect(coverInfo!.templateType).toBe('cover');
    expect(coverInfo!.firstBlockType).toBe('cover');
    expect(coverInfo!.blockCount).toBeGreaterThan(0);

    // Canvas should still be visible (not blank/broken)
    await expect(page.locator('#mpi-canvas')).toBeVisible();

    // ── 3. Klik tombol "Tambah Halaman" lagi ─────────────────
    await tambahHalamanBtn.click();
    await page.waitForTimeout(500);
    await expect(menu).toBeVisible({ timeout: 3000 });

    // ── 4. Klik menu "Materi" ────────────────────────────────
    const materiMenuItem = page.locator('[role="menuitem"]:has-text("Materi")');
    await materiMenuItem.click();
    await page.waitForTimeout(2000);

    // Verify materi page added
    const afterMateriCount = await getPageCount(page);
    expect(afterMateriCount).toBe(initialCount + 2);

    // Verify materi schema
    const materiInfo = await getLastPageInfo(page);
    expect(materiInfo).not.toBeNull();
    expect(materiInfo!.templateType).toBe('materi');
    expect(materiInfo!.firstBlockType).toBe('materi-section');
    expect(materiInfo!.blockCount).toBeGreaterThan(0);

    // ── 5. Klik tombol "Tambah Halaman" lagi ─────────────────
    await tambahHalamanBtn.click();
    await page.waitForTimeout(500);
    await expect(menu).toBeVisible({ timeout: 3000 });

    // ── 6. Klik menu "Kuis" ──────────────────────────────────
    const kuisMenuItem = page.locator('[role="menuitem"]:has-text("Kuis")');
    await kuisMenuItem.click();
    await page.waitForTimeout(2000);

    // Verify kuis page added
    const afterKuisCount = await getPageCount(page);
    expect(afterKuisCount).toBe(initialCount + 3);

    // Verify kuis schema
    const kuisInfo = await getLastPageInfo(page);
    expect(kuisInfo).not.toBeNull();
    expect(kuisInfo!.templateType).toBe('kuis');
    expect(kuisInfo!.firstBlockType).toBe('kuis');
    expect(kuisInfo!.blockCount).toBeGreaterThan(0);

    // ── 7. Klik tombol "Tambah Game" ─────────────────────────
    const tambahGameBtn = page.locator('button[aria-label="Tambah halaman game baru"]');
    await tambahGameBtn.waitFor({ state: 'visible', timeout: 5000 });
    await tambahGameBtn.click();
    await page.waitForTimeout(2000);

    // Verify game page added
    const afterGameCount = await getPageCount(page);
    expect(afterGameCount).toBe(initialCount + 4);

    // Verify game schema
    const gameInfo = await getLastPageInfo(page);
    expect(gameInfo).not.toBeNull();
    expect(gameInfo!.templateType).toBe('game');
    expect(gameInfo!.firstBlockType).toBe('sortir-game');
    expect(gameInfo!.blockCount).toBeGreaterThan(0);

    // ── 8. Klik tombol "Preview" ─────────────────────────────
    const previewBtn = page.locator('button[aria-label="Pratinjau media"]');
    await previewBtn.waitFor({ state: 'visible', timeout: 5000 });
    await previewBtn.click();
    await page.waitForTimeout(2000);

    // ── 9. Shell editor hilang, preview muncul ───────────────
    const mpiShellVisible = await page.locator('[data-testid="mpi-editor-shell"]').isVisible().catch(() => false);
    expect(mpiShellVisible).toBe(false);

    // Preview mode shows navigation
    const previewNav = page.locator('button:has-text("Prev"), button:has-text("chevron_left")').first();
    await expect(previewNav).toBeVisible({ timeout: 5000 });

    // ── 10. No fatal console/page error ──────────────────────
    expect(fatalErrors).toEqual([]);
  });

  // ── Isolated test: just Tambah Game via UI button ──────────────

  test('UI-click: Tambah Game button creates game page with sortir-game', async ({ page }) => {
    await setupMpiStudio(page);

    const initialCount = await getPageCount(page);

    // Click the REAL "Tambah Game" button (not store hack)
    const gameBtn = page.locator('button[aria-label="Tambah halaman game baru"]');
    await gameBtn.waitFor({ state: 'visible', timeout: 5000 });
    await gameBtn.click();
    await page.waitForTimeout(2000);

    // Verify page count increased
    const newCount = await getPageCount(page);
    expect(newCount).toBe(initialCount + 1);

    // Verify schema via read-only store check
    const gameInfo = await getLastPageInfo(page);
    expect(gameInfo).not.toBeNull();
    expect(gameInfo!.templateType).toBe('game');
    expect(gameInfo!.firstBlockType).toBe('sortir-game');
    expect(gameInfo!.blockCount).toBeGreaterThan(0);

    // Canvas still visible
    await expect(page.locator('#mpi-canvas')).toBeVisible();
  });
});
