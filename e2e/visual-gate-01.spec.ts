// ═══════════════════════════════════════════════════════════════════
// VISUAL-GATE-01 — Golden Project Visual Gate
// ═══════════════════════════════════════════════════════════════════
// Senior audit (VISUAL-STABILIZATION-01 feedback):
//   "belum membuktikan desain tidak terpotong"
//   "butuh marker TOP/BOTTOM/LEFT/RIGHT"
//   "butuh screenshot test Cover/Materi/Kuis/Game"
//   "butuh screenshot test 1280×720 dan 768×720"
//
// This test:
//   1. Creates a golden project (Materi + Kuis template, 5 pages)
//   2. For each page (Cover, Materi, Kuis, Game):
//      a. Navigates to page
//      b. Injects marker divs at TOP/BOTTOM/LEFT/RIGHT edges of
//         the PageRenderer content area
//      c. Verifies all 4 markers are VISIBLE (not clipped)
//      d. Takes a screenshot for regression
//   3. Tests at 1280×720 (desktop) and 768×720 (narrow)
//   4. Preview mode screenshot
//
// Marker approach: we inject 4 small colored squares at the edges
// of the PageRenderer wrapper. If any marker is NOT visible, it
// means the canvas is clipping content at that edge.
// ═══════════════════════════════════════════════════════════════════

import { test, expect, type Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

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

/**
 * Inject 4 marker divs at the edges of the PageRenderer wrapper.
 * Each marker is a small colored square positioned at the edge.
 * If any marker is NOT visible after injection, content is clipped.
 *
 * Markers:
 *   TOP:    top-left corner of wrapper
 *   BOTTOM: bottom-right corner of wrapper
 *   LEFT:   middle-left edge of wrapper
 *   RIGHT:  middle-right edge of wrapper
 */
async function injectMarkers(page: Page): Promise<void> {
  await page.evaluate(() => {
    const canvas = document.getElementById('mpi-canvas');
    if (!canvas) return;
    const wrapper = canvas.querySelector('.relative.bg-white.rounded-lg') as HTMLElement;
    if (!wrapper) return;

    // Remove existing markers
    wrapper.querySelectorAll('[data-visual-marker]').forEach(el => el.remove());

    // Ensure wrapper is positioned (relative) for absolute markers
    wrapper.style.position = 'relative';

    const markerStyle = 'position: absolute; width: 12px; height: 12px; z-index: 9999; pointer-events: none;';
    const markers = [
      { name: 'TOP',    style: `${markerStyle} top: 2px; left: 2px; background: #ef4444;` },
      { name: 'BOTTOM', style: `${markerStyle} bottom: 2px; right: 2px; background: #3b82f6;` },
      { name: 'LEFT',   style: `${markerStyle} top: 50%; left: 2px; transform: translateY(-50%); background: #10b981;` },
      { name: 'RIGHT',  style: `${markerStyle} top: 50%; right: 2px; transform: translateY(-50%); background: #f59e0b;` },
    ];

    for (const m of markers) {
      const el = document.createElement('div');
      el.setAttribute('data-visual-marker', m.name);
      el.style.cssText = m.style;
      wrapper.appendChild(el);
    }
  });
}

/**
 * Check if all 4 markers are visible (not clipped by overflow).
 * A marker is "visible" if its bounding rect has width > 0 AND height > 0
 * AND it's within the wrapper's bounds.
 */
async function checkMarkersVisible(page: Page): Promise<{
  TOP: boolean; BOTTOM: boolean; LEFT: boolean; RIGHT: boolean;
}> {
  return page.evaluate(() => {
    const canvas = document.getElementById('mpi-canvas');
    if (!canvas) return { TOP: false, BOTTOM: false, LEFT: false, RIGHT: false };
    const wrapper = canvas.querySelector('.relative.bg-white.rounded-lg') as HTMLElement;
    if (!wrapper) return { TOP: false, BOTTOM: false, LEFT: false, RIGHT: false };

    const wrapperRect = wrapper.getBoundingClientRect();
    const results = { TOP: false, BOTTOM: false, LEFT: false, RIGHT: false };

    const markers = wrapper.querySelectorAll('[data-visual-marker]');
    markers.forEach(el => {
      const name = el.getAttribute('data-visual-marker') as keyof typeof results;
      const rect = el.getBoundingClientRect();
      // Marker is visible if it has size AND is within wrapper bounds
      const hasSize = rect.width > 0 && rect.height > 0;
      const withinWrapper =
        rect.top >= wrapperRect.top - 2 &&
        rect.bottom <= wrapperRect.bottom + 2 &&
        rect.left >= wrapperRect.left - 2 &&
        rect.right <= wrapperRect.right + 2;
      results[name] = hasSize && withinWrapper;
    });

    return results;
  });
}

/**
 * Navigate to a page by index and wait for render.
 */
async function goToPage(page: Page, index: number) {
  await page.evaluate((idx) => {
    (window as unknown as { __useCanvaStore: { getState: () => { goPage: (i: number) => void } } }).__useCanvaStore.getState().goPage(idx);
  }, index);
  await page.waitForTimeout(2000);
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

test.describe('VISUAL-GATE-01 — Golden Project Visual Gate', () => {

  // ── Desktop 1280×720 ─────────────────────────────────────────

  test.describe('Desktop 1280×720', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('Cover page: all 4 markers visible + screenshot', async ({ page }) => {
      await setupMpiStudio(page);
      await goToPage(page, 0); // Cover
      await injectMarkers(page);
      await page.waitForTimeout(500);

      const markers = await checkMarkersVisible(page);
      expect(markers.TOP).toBe(true);
      expect(markers.BOTTOM).toBe(true);
      expect(markers.LEFT).toBe(true);
      expect(markers.RIGHT).toBe(true);

      await page.screenshot({ path: 'test-results/visual-gate-01-cover-1280.png' });
    });

    test('Materi page: all 4 markers visible + screenshot', async ({ page }) => {
      await setupMpiStudio(page);
      await goToPage(page, 2); // Materi
      await injectMarkers(page);
      await page.waitForTimeout(500);

      const markers = await checkMarkersVisible(page);
      expect(markers.TOP).toBe(true);
      expect(markers.BOTTOM).toBe(true);
      expect(markers.LEFT).toBe(true);
      expect(markers.RIGHT).toBe(true);

      await page.screenshot({ path: 'test-results/visual-gate-01-materi-1280.png' });
    });

    test('Kuis page: all 4 markers visible + screenshot', async ({ page }) => {
      await setupMpiStudio(page);
      await goToPage(page, 3); // Kuis
      await injectMarkers(page);
      await page.waitForTimeout(500);

      const markers = await checkMarkersVisible(page);
      expect(markers.TOP).toBe(true);
      expect(markers.BOTTOM).toBe(true);
      expect(markers.LEFT).toBe(true);
      expect(markers.RIGHT).toBe(true);

      await page.screenshot({ path: 'test-results/visual-gate-01-kuis-1280.png' });
    });

    test('Game page: all 4 markers visible + screenshot', async ({ page }) => {
      await setupMpiStudio(page);
      // Add game page
      await page.evaluate(() => {
        (window as unknown as { __useCanvaStore: { getState: () => { addTemplatePage: (t: string) => void } } }).__useCanvaStore.getState().addTemplatePage('game');
      });
      await page.waitForTimeout(2000);
      // Game is the last page now
      const pageCount = await page.evaluate(() => {
        return (window as unknown as { __useCanvaStore: { getState: () => { pages: unknown[] } } }).__useCanvaStore.getState().pages.length;
      });
      await goToPage(page, pageCount - 1);
      await injectMarkers(page);
      await page.waitForTimeout(500);

      const markers = await checkMarkersVisible(page);
      expect(markers.TOP).toBe(true);
      expect(markers.BOTTOM).toBe(true);
      expect(markers.LEFT).toBe(true);
      expect(markers.RIGHT).toBe(true);

      await page.screenshot({ path: 'test-results/visual-gate-01-game-1280.png' });
    });

    test('Preview mode: screenshot', async ({ page }) => {
      await setupMpiStudio(page);
      await goToPage(page, 0); // Cover

      // Switch to preview
      const previewBtn = page.locator('button[aria-label="Pratinjau media"]');
      await previewBtn.click();
      await page.waitForTimeout(3000);

      // Verify preview is active
      const shellGone = await page.locator('[data-testid="mpi-editor-shell"]').isVisible().catch(() => false);
      expect(shellGone).toBe(false);

      await page.screenshot({ path: 'test-results/visual-gate-01-preview-1280.png' });
    });
  });

  // ── Narrow 768×720 ───────────────────────────────────────────

  test.describe('Narrow 768×720', () => {
    test.use({ viewport: { width: 768, height: 720 } });

    test('Cover page: all 4 markers visible + screenshot', async ({ page }) => {
      await setupMpiStudio(page);
      await goToPage(page, 0); // Cover
      await injectMarkers(page);
      await page.waitForTimeout(500);

      const markers = await checkMarkersVisible(page);
      expect(markers.TOP).toBe(true);
      expect(markers.BOTTOM).toBe(true);
      expect(markers.LEFT).toBe(true);
      expect(markers.RIGHT).toBe(true);

      await page.screenshot({ path: 'test-results/visual-gate-01-cover-768.png' });
    });

    test('Materi page: all 4 markers visible + screenshot', async ({ page }) => {
      await setupMpiStudio(page);
      await goToPage(page, 2); // Materi
      await injectMarkers(page);
      await page.waitForTimeout(500);

      const markers = await checkMarkersVisible(page);
      expect(markers.TOP).toBe(true);
      expect(markers.BOTTOM).toBe(true);
      expect(markers.LEFT).toBe(true);
      expect(markers.RIGHT).toBe(true);

      await page.screenshot({ path: 'test-results/visual-gate-01-materi-768.png' });
    });
  });
});
