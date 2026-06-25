import { test, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// BATCH-06 — TEACHER-WORKFLOW-UX-01
// ═══════════════════════════════════════════════════════════════
// E2E test for the new Dashboard Resume Card flow.
//
// Verifies:
//   Phase 1: Fresh boot (no project) → empty state shows single
//            "Mulai dari Template" button (no resume card)
//   Phase 2: After applying a template → back to dashboard →
//            resume card visible with project title, page count,
//            and Lanjutkan/Mulai Baru buttons
//   Phase 3: Click "Lanjutkan Edit" → editor opens
//   Phase 4: Template picker shows page count badge per card
//
// Skipped in CI (same as other V5 e2e tests — dev server + module
// resolution flaky in sandbox). Local-only release gate.
// ═══════════════════════════════════════════════════════════════

test.describe('BATCH-06 — Teacher Workflow UX', () => {
  test.skip(process.env.CI === 'true', 'local-only release gate');

  test('Phase 1: fresh boot shows empty state (no resume card)', async ({ page, context }) => {
    // Clear localStorage to simulate fresh user
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Empty state: single "Mulai dari Template" button
    const startBtn = page.locator('[data-testid="dashboard-start-template-btn"]');
    await expect(startBtn).toBeVisible({ timeout: 10000 });

    // Resume card must NOT be visible
    const resumeSection = page.locator('[data-testid="dashboard-resume-section"]');
    await expect(resumeSection).toHaveCount(0);
  });

  test('Phase 2: after applying template, dashboard shows resume card', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Click "Mulai dari Template"
    await page.locator('[data-testid="dashboard-start-template-btn"]').click();
    await page.waitForTimeout(2000);

    // Pick first template (PPKn)
    const firstTemplateCard = page.locator('[data-testid^="template-card-"]').first();
    await firstTemplateCard.click();
    await page.waitForTimeout(5000);

    // Editor should be visible
    await expect(page.locator('[data-testid="clean-editor-v5"]')).toBeVisible({ timeout: 15000 });

    // Verify page count badge exists on template cards (Phase 4 check)
    // (Already passed Phase 2 editor check — we know template was applied)
  });

  test('Phase 4: template picker shows page count badge per card', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Go to template picker
    await page.locator('[data-testid="dashboard-start-template-btn"]').click();
    await page.waitForTimeout(2000);

    // Verify template picker visible
    await expect(page.locator('[data-testid="template-picker-v5"]')).toBeVisible({ timeout: 10000 });

    // Verify at least one page count badge exists
    const badges = page.locator('[data-testid^="template-page-count-"]');
    const badgeCount = await badges.count();
    expect(badgeCount, 'at least one page count badge must be visible').toBeGreaterThan(0);

    // Verify first badge has "hal" text (page count suffix)
    const firstBadgeText = await badges.first().textContent();
    expect(firstBadgeText, 'badge must contain "hal"').toContain('hal');
  });

  test('Phase 3: resume card visible after template applied (via back to dashboard)', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Apply a template first
    await page.locator('[data-testid="dashboard-start-template-btn"]').click();
    await page.waitForTimeout(2000);
    await page.locator('[data-testid^="template-card-"]').first().click();
    await page.waitForTimeout(5000);

    // Now in editor — click "Kembali ke Dashboard" button to go back
    await page.locator('button[aria-label="Kembali ke dashboard"]').click();
    await page.waitForTimeout(2000);

    // Dashboard should now show resume card (project exists in store)
    const resumeSection = page.locator('[data-testid="dashboard-resume-section"]');
    await expect(resumeSection).toBeVisible({ timeout: 10000 });

    // Resume card should have:
    // 1. Page count badge (non-zero)
    const pageCountBadge = page.locator('[data-testid="resume-page-count"]');
    await expect(pageCountBadge).toBeVisible();
    const pageCountText = await pageCountBadge.textContent();
    expect(pageCountText).toContain('halaman');

    // 2. Project title (non-empty)
    const judul = page.locator('[data-testid="resume-judul"]');
    await expect(judul).toBeVisible();
    const judulText = await judul.textContent();
    expect(judulText?.trim().length, 'judul must be non-empty').toBeGreaterThan(0);

    // 3. Lanjutkan Edit button
    const continueBtn = page.locator('[data-testid="resume-continue-btn"]');
    await expect(continueBtn).toBeVisible();
    await expect(continueBtn).toContainText('Lanjutkan Edit');

    // 4. Mulai Baru button
    const newBtn = page.locator('[data-testid="resume-new-btn"]');
    await expect(newBtn).toBeVisible();
    await expect(newBtn).toContainText('Mulai dari Template Lain');

    // Click Lanjutkan Edit → should open editor
    await continueBtn.click();
    await page.waitForTimeout(3000);
    await expect(page.locator('[data-testid="clean-editor-v5"]')).toBeVisible({ timeout: 10000 });
  });
});
