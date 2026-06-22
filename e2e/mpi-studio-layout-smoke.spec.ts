// ═══════════════════════════════════════════════════════════════════
// EDITOR-RADICAL-RESET-01-PATCH-2B — MPI Studio Browser Smoke Test
// ═══════════════════════════════════════════════════════════════════
// Real browser E2E test that verifies MPI Studio layout contract
// and core teacher flows end-to-end.
//
// Checks (per senior audit requirement):
//   1. MPI Studio muncul (shell visible)
//   2. Shell tidak overflow viewport
//   3. Canvas wrapper relative + visible
//   4. Tambah Cover menghasilkan halaman cover terlihat
//   5. Tambah Game menghasilkan halaman game terlihat
//   6. Preview bisa dibuka
//   7. Tidak ada console error fatal
// ═══════════════════════════════════════════════════════════════════

import { test, expect, type Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Navigate to app, skip tour, create project from template, enable teacher mode.
 * Returns when MPI Studio shell is visible.
 */
async function setupMpiStudio(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Wait for app to load — use broader selector + longer timeout
  // for first-compile dev mode latency
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

  // Click "Materi + Kuis" template (simple 5-page template)
  const templateBtn = page.locator('button:has-text("Materi + Kuis")').first();
  await templateBtn.waitFor({ state: 'visible', timeout: 15000 });
  await templateBtn.click();
  await page.waitForTimeout(3000);

  // Click "Gunakan Template" button
  const useTemplateBtn = page.locator('button:has-text("Gunakan Template")');
  await useTemplateBtn.waitFor({ state: 'visible', timeout: 10000 });
  await useTemplateBtn.click();
  await page.waitForTimeout(4000);

  // Enable teacher mode via store (triggers MPI Studio shell)
  await page.evaluate(() => {
    (window as unknown as { __useCanvaStore: { getState: () => { setTeacherMode: (v: boolean) => void } } }).__useCanvaStore.getState().setTeacherMode(true);
  });
  await page.waitForTimeout(3000);

  // Wait for MPI Studio shell to appear
  await page.waitForSelector('[data-testid="mpi-editor-shell"]', { timeout: 15000 });
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

test.describe('MPI Studio Layout Smoke', () => {

  // ── 1. MPI Studio muncul ──────────────────────────────────────

  test('1. MPI Studio shell appears when teacher mode is enabled', async ({ page }) => {
    await setupMpiStudio(page);

    const shell = page.locator('[data-testid="mpi-editor-shell"]');
    await expect(shell).toBeVisible();

    // Verify 3 main areas are present
    await expect(page.locator('nav[aria-label="Alur Media"]')).toBeVisible();
    await expect(page.locator('main[aria-label="Area kanvas — halaman aktif"], main[aria-label="Area kanvas"]')).toBeVisible();
    await expect(page.locator('aside[aria-label="Panel edit"]')).toBeVisible();
  });

  // ── 2. Shell tidak overflow viewport ──────────────────────────

  test('2. Shell does not overflow viewport', async ({ page }) => {
    await setupMpiStudio(page);

    const shellBox = await page.locator('[data-testid="mpi-editor-shell"]').boundingBox();
    const viewport = page.viewportSize();

    expect(shellBox).not.toBeNull();
    expect(viewport).not.toBeNull();

    // Shell width should not exceed viewport width
    expect(shellBox!.width).toBeLessThanOrEqual(viewport!.width);

    // Shell height should not exceed viewport height
    // (h-full fills parent, which is flex-1 inside viewport)
    expect(shellBox!.height).toBeLessThanOrEqual(viewport!.height + 20); // +20px tolerance for borders

    // Shell should NOT have vertical scrollbar (overflow-hidden)
    const hasVerticalScroll = await page.evaluate(() => {
      const shell = document.getElementById('mpi-editor-shell');
      if (!shell) return false;
      return shell.scrollHeight > shell.clientHeight;
    });
    expect(hasVerticalScroll).toBe(false);
  });

  // ── 3. Canvas wrapper relative + visible ──────────────────────

  test('3. Canvas wrapper is relative + visible + overflow-hidden', async ({ page }) => {
    await setupMpiStudio(page);

    // Find the canvas wrapper (div with relative class inside main#mpi-canvas)
    const canvasMain = page.locator('#mpi-canvas');
    await expect(canvasMain).toBeVisible();

    // Check the PageRenderer wrapper div
    const wrapperInfo = await page.evaluate(() => {
      const main = document.getElementById('mpi-canvas');
      if (!main) return null;
      const wrapper = main.querySelector('.relative.w-full.max-w-4xl');
      if (!wrapper) return null;
      const rect = wrapper.getBoundingClientRect();
      const style = getComputedStyle(wrapper);
      return {
        position: style.position,
        overflow: style.overflow,
        width: rect.width,
        height: rect.height,
        isVisible: rect.width > 0 && rect.height > 0,
      };
    });

    expect(wrapperInfo).not.toBeNull();
    expect(wrapperInfo!.position).toBe('relative');
    expect(wrapperInfo!.overflow).toBe('hidden');
    expect(wrapperInfo!.isVisible).toBe(true);
    expect(wrapperInfo!.width).toBeGreaterThan(100);
    expect(wrapperInfo!.height).toBeGreaterThan(50);
  });

  // ── 4. Tambah Cover menghasilkan halaman cover terlihat ──────

  test('4. Tambah Cover produces visible cover page with correct schema', async ({ page }) => {
    await setupMpiStudio(page);

    const initialPageCount = await page.evaluate(() => {
      return (window as unknown as { __useCanvaStore: { getState: () => { pages: unknown[] } } }).__useCanvaStore.getState().pages.length;
    });

    // Add cover page via addTemplatePage (simulating Tambah Halaman → Cover)
    await page.evaluate(() => {
      (window as unknown as { __useCanvaStore: { getState: () => { addTemplatePage: (t: string) => void } } }).__useCanvaStore.getState().addTemplatePage('cover');
    });
    await page.waitForTimeout(1500);

    // Verify page count increased
    const newPageCount = await page.evaluate(() => {
      return (window as unknown as { __useCanvaStore: { getState: () => { pages: unknown[] } } }).__useCanvaStore.getState().pages.length;
    });
    expect(newPageCount).toBe(initialPageCount + 1);

    // Verify the new page has correct schema
    const newPageInfo = await page.evaluate(() => {
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

    expect(newPageInfo).not.toBeNull();
    expect(newPageInfo!.templateType).toBe('cover');
    expect(newPageInfo!.blockCount).toBeGreaterThan(0);
    expect(newPageInfo!.firstBlockType).toBe('cover');

    // Verify canvas is still visible (not blank/broken)
    const canvasVisible = await page.locator('#mpi-canvas').isVisible();
    expect(canvasVisible).toBe(true);
  });

  // ── 5. Tambah Game menghasilkan halaman game terlihat ────────

  test('5. Tambah Game produces visible game page with sortir-game schema', async ({ page }) => {
    await setupMpiStudio(page);

    const initialPageCount = await page.evaluate(() => {
      return (window as unknown as { __useCanvaStore: { getState: () => { pages: unknown[] } } }).__useCanvaStore.getState().pages.length;
    });

    // Add game page via addTemplatePage('game')
    await page.evaluate(() => {
      (window as unknown as { __useCanvaStore: { getState: () => { addTemplatePage: (t: string) => void } } }).__useCanvaStore.getState().addTemplatePage('game');
    });
    await page.waitForTimeout(1500);

    // Verify page count increased
    const newPageCount = await page.evaluate(() => {
      return (window as unknown as { __useCanvaStore: { getState: () => { pages: unknown[] } } }).__useCanvaStore.getState().pages.length;
    });
    expect(newPageCount).toBe(initialPageCount + 1);

    // Verify the new page has correct schema
    const newPageInfo = await page.evaluate(() => {
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

    expect(newPageInfo).not.toBeNull();
    expect(newPageInfo!.templateType).toBe('game');
    expect(newPageInfo!.blockCount).toBeGreaterThan(0);
    expect(newPageInfo!.firstBlockType).toBe('sortir-game');

    // Verify canvas is still visible (not blank/broken)
    const canvasVisible = await page.locator('#mpi-canvas').isVisible();
    expect(canvasVisible).toBe(true);
  });

  // ── 6. Preview bisa dibuka ───────────────────────────────────

  test('6. Preview button switches to preview mode', async ({ page }) => {
    await setupMpiStudio(page);

    // Click the Preview button in MpiTopBar
    const previewBtn = page.locator('button[aria-label="Pratinjau media"]');
    await previewBtn.waitFor({ state: 'visible', timeout: 5000 });
    await previewBtn.click();
    await page.waitForTimeout(2000);

    // Verify we're in preview mode — check for preview-specific elements
    // Preview mode shows navigation buttons (Prev/Next + page dots)
    const previewNav = page.locator('button:has-text("Prev"), button:has-text("chevron_left")').first();
    await expect(previewNav).toBeVisible({ timeout: 5000 });

    // Verify MPI Studio shell is NOT visible (we left edit mode)
    const mpiShellVisible = await page.locator('[data-testid="mpi-editor-shell"]').isVisible().catch(() => false);
    expect(mpiShellVisible).toBe(false);

    // Go back to edit mode for cleanup
    await page.evaluate(() => {
      (window as unknown as { __useCanvaStore: { getState: () => { setAppMode: (m: string) => void } } }).__useCanvaStore.getState().setAppMode('edit');
    });
    await page.waitForTimeout(1000);
  });

  // ── 7. Tidak ada console error fatal ─────────────────────────

  test('7. No fatal console errors during MPI Studio usage', async ({ page }) => {
    const fatalErrors: string[] = [];

    // Monitor console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out known non-fatal errors (React DevTools, Next.js dev warnings)
        const nonFatal = [
          'React DevTools',
          'Download the React DevTools',
          'Warning: [SchemaFactory]',
          'Warning: [Perf]',
          'Warning: [MeasuredBlock]',
          'metadataBase property',
        ];
        if (!nonFatal.some(pattern => text.includes(pattern))) {
          fatalErrors.push(text);
        }
      }
    });

    // Monitor page errors (uncaught exceptions)
    page.on('pageerror', (error) => {
      fatalErrors.push(`PAGE ERROR: ${error.message}`);
    });

    await setupMpiStudio(page);

    // Interact: navigate to different page
    await page.evaluate(() => {
      (window as unknown as { __useCanvaStore: { getState: () => { goPage: (i: number) => void } } }).__useCanvaStore.getState().goPage(0);
    });
    await page.waitForTimeout(1000);

    // Add a cover page
    await page.evaluate(() => {
      (window as unknown as { __useCanvaStore: { getState: () => { addTemplatePage: (t: string) => void } } }).__useCanvaStore.getState().addTemplatePage('cover');
    });
    await page.waitForTimeout(1000);

    // Switch to preview and back
    await page.evaluate(() => {
      (window as unknown as { __useCanvaStore: { getState: () => { setAppMode: (m: string) => void } } }).__useCanvaStore.getState().setAppMode('preview');
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      (window as unknown as { __useCanvaStore: { getState: () => { setAppMode: (m: string) => void } } }).__useCanvaStore.getState().setAppMode('edit');
    });
    await page.waitForTimeout(1000);

    // Assert no fatal errors
    // Allow up to 0 fatal errors (known warnings are filtered above)
    expect(fatalErrors).toEqual([]);
  });
});
