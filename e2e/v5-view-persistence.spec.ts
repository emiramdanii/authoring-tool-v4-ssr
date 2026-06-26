import { test, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// BATCH-06B — TEACHER-WORKFLOW-UX-CLOSEOUT
// ═══════════════════════════════════════════════════════════════
// E2E smoke tests for view persistence + safety fallback.
//
// Senior audit scope (mandatory smoke):
//   1. Dashboard → Template → Editor → Dashboard → Resume card →
//      Lanjutkan → Editor
//   2. Refresh pada editor → tetap aman (restored to editor)
//   3. Refresh tanpa pages → tidak blank (fallback to dashboard)
//
// Plus view persistence contract tests:
//   4. Valid last view dipulihkan (editor restores after refresh)
//   5. Invalid last view fallback aman (corrupt localStorage → dashboard)
//   6. editor/preview/export tidak dipulihkan jika pages kosong
//   7. Workflow guidance text ada
//
// Skipped in CI (same pattern as Batch 04/05/06 V5 e2e tests).
// ═══════════════════════════════════════════════════════════════

const VIEW_STORAGE_KEY = 'silse_v5_last_view';

test.describe('BATCH-06B — View persistence + workflow closeout', () => {
  test.skip(process.env.CI === 'true', 'local-only release gate');

  test('Smoke 1: Dashboard → Template → Editor → Dashboard → Resume → Lanjutkan → Editor', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Dashboard (empty state)
    await expect(page.locator('[data-testid="dashboard-start-template-btn"]')).toBeVisible();

    // → Template
    await page.locator('[data-testid="dashboard-start-template-btn"]').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="template-picker-v5"]')).toBeVisible();

    // → Editor (apply first template)
    await page.locator('[data-testid^="template-card-"]').first().click();
    await page.waitForTimeout(5000);
    await expect(page.locator('[data-testid="clean-editor-v5"]')).toBeVisible();

    // Verify view was persisted as 'editor'
    const storedView = await page.evaluate((k) => window.localStorage.getItem(k), VIEW_STORAGE_KEY);
    expect(storedView, 'view must be persisted as editor').toBe('editor');

    // → Dashboard (back button)
    await page.locator('button[aria-label="Kembali ke dashboard"]').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="dashboard-resume-section"]')).toBeVisible();

    // Verify view was persisted as 'dashboard'
    const storedView2 = await page.evaluate((k) => window.localStorage.getItem(k), VIEW_STORAGE_KEY);
    expect(storedView2, 'view must be persisted as dashboard').toBe('dashboard');

    // → Resume card → Lanjutkan
    await page.locator('[data-testid="resume-continue-btn"]').click();
    await page.waitForTimeout(3000);
    await expect(page.locator('[data-testid="clean-editor-v5"]')).toBeVisible();

    // Verify view was persisted as 'editor' again
    const storedView3 = await page.evaluate((k) => window.localStorage.getItem(k), VIEW_STORAGE_KEY);
    expect(storedView3, 'view must be persisted as editor after resume').toBe('editor');
  });

  test('Smoke 2: Refresh pada editor → tetap aman (restored to editor)', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Apply template → editor
    await page.locator('[data-testid="dashboard-start-template-btn"]').click();
    await page.waitForTimeout(2000);
    await page.locator('[data-testid^="template-card-"]').first().click();
    await page.waitForTimeout(5000);
    await expect(page.locator('[data-testid="clean-editor-v5"]')).toBeVisible();

    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000);

    // Should restore to editor (pages exist in localStorage from auto-save)
    await expect(page.locator('[data-testid="clean-editor-v5"]')).toBeVisible({ timeout: 15000 });

    // Verify no blank screen — editor should have rendered content.
    // We check the canvas region is present and has children (not empty).
    const canvasRegion = page.locator('[aria-label="Area kanvas — halaman aktif"]').first();
    await expect(canvasRegion).toBeVisible({ timeout: 8000 });
    const childCount = await canvasRegion.evaluate((el) => el.children.length);
    expect(childCount, 'canvas must have rendered content (not blank)').toBeGreaterThan(0);
  });

  test('Smoke 3: Refresh tanpa pages → tidak blank (fallback to dashboard)', async ({ page, context }) => {
    await context.clearCookies();
    // Pre-seed localStorage with 'editor' but NO canva_state (no pages)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.evaluate((k) => {
      window.localStorage.setItem(k, 'editor');
      // Also clear any canva state so pages.length === 0
      window.localStorage.removeItem('canva_state_v2');
      window.localStorage.removeItem('canva_state_v3');
      window.localStorage.removeItem('silse_canva_state');
    }, VIEW_STORAGE_KEY);

    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000);

    // Should fall back to dashboard (not stuck on blank editor)
    await expect(page.locator('[data-testid="dashboard-v5"]')).toBeVisible({ timeout: 10000 });

    // Empty state should show (no project)
    await expect(page.locator('[data-testid="dashboard-start-template-btn"]')).toBeVisible();

    // Resume card should NOT be visible (no pages)
    await expect(page.locator('[data-testid="dashboard-resume-section"]')).toHaveCount(0);

    // Bad 'editor' value should still be there (we don't clear on pages=0 fallback,
    // only on invalid-view fallback). But the rendered view must be dashboard.
    const renderedView = await page.locator('[data-testid="product-shell-v5"]').getAttribute('data-view');
    expect(renderedView, 'rendered view must be dashboard fallback').toBe('dashboard');
  });

  test('Contract 4: Valid last view (preview) dipulihkan setelah refresh', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Apply template → editor → preview
    await page.locator('[data-testid="dashboard-start-template-btn"]').click();
    await page.waitForTimeout(2000);
    await page.locator('[data-testid^="template-card-"]').first().click();
    await page.waitForTimeout(5000);
    await page.locator('button[aria-label="Pratinjau media"]').click();
    await page.waitForTimeout(3000);
    await expect(page.locator('[data-testid="preview-v5"]')).toBeVisible();

    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000);

    // Should restore to preview (pages exist)
    await expect(page.locator('[data-testid="preview-v5"]')).toBeVisible({ timeout: 15000 });
  });

  test('Contract 5: Invalid last view fallback aman (corrupt localStorage → dashboard)', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Inject corrupt value into localStorage
    await page.evaluate((k) => {
      window.localStorage.setItem(k, 'lengkap'); // legacy/invalid view name
    }, VIEW_STORAGE_KEY);

    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000);

    // Should fall back to dashboard
    await expect(page.locator('[data-testid="dashboard-v5"]')).toBeVisible({ timeout: 10000 });

    // After restore, the stored value should be either:
    //   - null (restoreLastView cleared the bad value)
    //   - 'dashboard' (persistLastView ran after restore and normalized it)
    // Either is safe — the corrupt value 'lengkap' must NOT be there.
    const storedAfter = await page.evaluate((k) => window.localStorage.getItem(k), VIEW_STORAGE_KEY);
    expect(
      storedAfter === null || storedAfter === 'dashboard',
      `corrupt value must be cleared or normalized to dashboard, got: "${storedAfter}"`
    ).toBe(true);
    expect(storedAfter, 'corrupt value "lengkap" must NOT persist').not.toBe('lengkap');
  });

  test('Contract 6: editor tidak dipulihkan jika pages kosong (fresh user with stale localStorage)', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Set 'editor' as last view, but no canva state (fresh user)
    await page.evaluate((k) => {
      window.localStorage.setItem(k, 'editor');
      window.localStorage.removeItem('canva_state_v2');
      window.localStorage.removeItem('canva_state_v3');
      window.localStorage.removeItem('silse_canva_state');
    }, VIEW_STORAGE_KEY);

    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000);

    // Should fall back to dashboard (editor not safe without pages)
    const renderedView = await page.locator('[data-testid="product-shell-v5"]').getAttribute('data-view');
    expect(renderedView, 'must fall back to dashboard when pages empty').toBe('dashboard');

    // Dashboard empty state visible
    await expect(page.locator('[data-testid="dashboard-start-template-btn"]')).toBeVisible();
  });

  test('Contract 7: Workflow guidance text ada di dashboard', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Workflow guidance nav must be visible
    const guidance = page.locator('[data-testid="dashboard-workflow-guidance"]');
    await expect(guidance).toBeVisible({ timeout: 10000 });

    // All 5 step labels must be present
    const guidanceText = await guidance.textContent();
    expect(guidanceText).toContain('Info');
    expect(guidanceText).toContain('Edit Isi');
    expect(guidanceText).toContain('Style');
    expect(guidanceText).toContain('Preview');
    expect(guidanceText).toContain('Export');

    // Must have aria-label for accessibility
    const ariaLabel = await guidance.getAttribute('aria-label');
    expect(ariaLabel).toBe('Alur kerja');

    // Must use ordered list
    const olCount = await guidance.locator('ol').count();
    expect(olCount, 'must use <ol> for ordered workflow').toBe(1);

    // Must have 5 list items
    const liCount = await guidance.locator('li').count();
    expect(liCount, 'must have exactly 5 steps').toBe(5);
  });

  test('No legacy: data-view attribute only ever shows safe V5 views', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Initial view must be one of the 5 safe views
    const initialView = await page.locator('[data-testid="product-shell-v5"]').getAttribute('data-view');
    const safeViews = ['dashboard', 'template', 'editor', 'preview', 'export'];
    expect(safeViews, `initial view "${initialView}" must be safe`).toContain(initialView);

    // Navigate through all views and verify each is safe
    if (initialView !== 'dashboard') {
      // Need to start fresh — go to dashboard first
      await page.evaluate(() => {
        window.localStorage.setItem('silse_v5_last_view', 'dashboard');
      });
      await page.reload();
      await page.waitForTimeout(2000);
    }

    // Apply template to populate pages
    await page.locator('[data-testid="dashboard-start-template-btn"]').click();
    await page.waitForTimeout(2000);
    await page.locator('[data-testid^="template-card-"]').first().click();
    await page.waitForTimeout(5000);

    // Editor view
    let currentView = await page.locator('[data-testid="product-shell-v5"]').getAttribute('data-view');
    expect(safeViews).toContain(currentView);

    // Preview
    await page.locator('button[aria-label="Pratinjau media"]').click();
    await page.waitForTimeout(2000);
    currentView = await page.locator('[data-testid="product-shell-v5"]').getAttribute('data-view');
    expect(safeViews).toContain(currentView);

    // Export (in preview, the export button has different aria-label)
    await page.locator('button[aria-label="Export ke HTML"]').click();
    await page.waitForTimeout(2000);
    currentView = await page.locator('[data-testid="product-shell-v5"]').getAttribute('data-view');
    expect(safeViews).toContain(currentView);

    // Back to editor
    await page.locator('button[aria-label="Kembali ke editor"]').click();
    await page.waitForTimeout(2000);
    currentView = await page.locator('[data-testid="product-shell-v5"]').getAttribute('data-view');
    expect(safeViews).toContain(currentView);

    // Back to dashboard
    await page.locator('button[aria-label="Kembali ke dashboard"]').click();
    await page.waitForTimeout(2000);
    currentView = await page.locator('[data-testid="product-shell-v5"]').getAttribute('data-view');
    expect(safeViews).toContain(currentView);
  });
});
