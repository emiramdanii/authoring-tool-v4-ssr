// ═══════════════════════════════════════════════════════════════════
// EDITOR-RESET-V3-PHASE-1B — Force Official Workspace Route
// ═══════════════════════════════════════════════════════════════════
// Regression: even when localStorage contains a stale advanced-mode
// preference (`silse_teacher_mode = 'lengkap'`), opening the editor
// must land in MpiWorkspaceV2 — NOT the quarantined legacy 3-panel
// editor.
//
// Before Phase-1B: `teacherMode && appMode === 'edit'` gated V2.
//   teacherMode=false (from stale 'lengkap') → fell through to the
//   old 3-panel editor.
//
// After Phase-1B: `appMode === 'edit'` always returns V2.
//   teacherMode is no longer a routing condition. The stale value
//   is migrated to 'sederhana' on first read.
//
// Acceptance:
//   1. With stale `silse_teacher_mode = 'lengkap'` in localStorage
//   2. Open the app, create an MPI project, enter edit mode
//   3. Assert [data-testid="mpi-workspace-v2"] is visible
//   4. Assert [data-testid="canva-builder"] (legacy 3-panel) is NOT visible
//   5. Assert teacherMode in store is true (migrated)
//   6. Assert localStorage was rewritten to 'sederhana'
// ═══════════════════════════════════════════════════════════════════

import { test, expect, type Page } from '@playwright/test';

async function setupWithStaleTeacherMode(page: Page) {
  // Inject stale advanced-mode preference BEFORE the app boots so
  // the canva store reads the old value on initialization. This
  // simulates a returning user who previously toggled to "Mode
  // Lanjutan" under the pre-Phase-1B routing.
  await page.addInitScript(() => {
    localStorage.setItem('silse_teacher_mode', 'lengkap');
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1, h2, nav', { timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

  // Dismiss the first-visit guided tour if it appears.
  for (let attempt = 0; attempt < 3; attempt++) {
    const skipBtn = page.locator('button:has-text("Lewati")');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click({ force: true });
      await page.waitForTimeout(500);
    } else break;
  }

  // Create an MPI project from the "Materi + Kuis" template.
  const templateBtn = page.locator('button:has-text("Materi + Kuis")').first();
  await templateBtn.waitFor({ state: 'visible', timeout: 15000 });
  await templateBtn.click();
  await page.waitForTimeout(3000);

  const useTemplateBtn = page.locator('button:has-text("Gunakan Template")');
  await useTemplateBtn.waitFor({ state: 'visible', timeout: 10000 });
  await useTemplateBtn.click();
  await page.waitForTimeout(4000);
}

test.describe('V3-PHASE-1B — Force Official Workspace Route', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('Stale teacherMode=false (lengkap) still opens Workspace V2', async ({ page }) => {
    await setupWithStaleTeacherMode(page);

    // Wait for the workspace V2 to appear. If the route still
    // depended on teacherMode, this selector would time out and
    // the test would fail — proving the route lock is real.
    await page.waitForSelector('[data-testid="mpi-workspace-v2"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="mpi-workspace-v2"]')).toBeVisible();

    // The legacy 3-panel editor must NOT be rendered.
    const legacyVisible = await page
      .locator('[data-testid="canva-builder"]')
      .isVisible()
      .catch(() => false);
    expect(legacyVisible).toBe(false);

    // The store's teacherMode must have been migrated to true.
    const teacherMode = await page.evaluate(() => {
      const s = (window as unknown as { __useCanvaStore: { getState: () => { teacherMode: boolean } } })
        .__useCanvaStore.getState();
      return s.teacherMode;
    });
    expect(teacherMode).toBe(true);

    // localStorage must have been rewritten from 'lengkap' to 'sederhana'.
    const stored = await page.evaluate(() => localStorage.getItem('silse_teacher_mode'));
    expect(stored).toBe('sederhana');

    await page.screenshot({ path: 'test-results/phase-1b-route-lock.png' });
  });

  test('Workspace V2 visible without any teacherMode in localStorage', async ({ page }) => {
    // Fresh user — no teacherMode key at all. Route must still land in V2.
    await page.addInitScript(() => {
      localStorage.removeItem('silse_teacher_mode');
    });

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

    await page.waitForSelector('[data-testid="mpi-workspace-v2"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="mpi-workspace-v2"]')).toBeVisible();

    const legacyVisible = await page
      .locator('[data-testid="canva-builder"]')
      .isVisible()
      .catch(() => false);
    expect(legacyVisible).toBe(false);
  });
});
