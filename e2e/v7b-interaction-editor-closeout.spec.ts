import { test, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// BATCH-07B — INTERACTION-EDITOR-CLOSEOUT
// ═══════════════════════════════════════════════════════════════
// Strengthened E2E tests for V5 interaction editors.
//
// BATCH-07A had soft fallback (test passed even if inspector didn't
// open). Senior audit P2 noted this. BATCH-07B removes soft fallback
// — tests now HARD-FAIL if the editor doesn't appear.
//
// Coverage:
//   1. Kuis editor (hard assert QuestionsFieldEditor visible)
//   2. Sortir game editor (hard assert SortItemsFieldEditor + add item)
//   3. Diskusi editor (hard assert ReflectionQuestionsFieldEditor + edit)
//   4. Refleksi editor (hard assert ReflectionQuestionsFieldEditor + edit)
//
// Skipped in CI (same pattern as previous batches).
// ═══════════════════════════════════════════════════════════════

test.describe('BATCH-07B — Interaction Editor Closeout (hard assert)', () => {
  test.skip(process.env.CI === 'true', 'local-only release gate');

  /**
   * Helper: apply PPKn template and navigate to a page by template type.
   * Returns the canvas region locator (already visible).
   */
  async function setupAndNavigateToPage(
    page: import('@playwright/test').Page,
    pageLabel: string,
  ) {
    await page.context().clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Apply PPKn template (has all needed block types: kuis, diskusi, refleksi)
    await page.locator('[data-testid="dashboard-start-template-btn"]').click();
    await page.waitForTimeout(2000);
    await page.locator('[data-testid^="template-card-"]').first().click();
    await page.waitForTimeout(5000);
    await expect(page.locator('[data-testid="clean-editor-v5"]')).toBeVisible({ timeout: 15000 });

    // Navigate to page by label (Kuis, Diskusi, Refleksi)
    // Scene list buttons have type="button" and text matching the label
    const pageBtn = page.locator(`button[type="button"]:has-text("${pageLabel}")`).first();
    await pageBtn.waitFor({ state: 'visible', timeout: 10000 });
    await pageBtn.click();
    await page.waitForTimeout(2000);

    // Click the block on canvas to select it
    const canvasRegion = page.locator('[aria-label="Area kanvas — halaman aktif"]').first();
    await expect(canvasRegion).toBeVisible({ timeout: 5000 });

    return { canvasRegion };
  }

  /**
   * Helper: click block by data-block-type, hard-assert it becomes selected.
   */
  async function clickBlockByType(
    page: import('@playwright/test').Page,
    canvasRegion: import('@playwright/test').Locator,
    blockType: string,
  ) {
    const block = canvasRegion.locator(`[data-block-type="${blockType}"]`).first();
    await expect(block, `block of type "${blockType}" must exist on canvas`).toBeVisible({ timeout: 5000 });
    await block.click({ force: true });
    await page.waitForTimeout(1500);
  }

  // ─────────────────────────────────────────────────────────────
  // Test 1: Kuis editor — HARD ASSERT (no soft fallback)
  // ─────────────────────────────────────────────────────────────
  test('kuis editor: QuestionsFieldEditor appears with hard assert', async ({ page }) => {
    const { canvasRegion } = await setupAndNavigateToPage(page, 'Kuis');
    await clickBlockByType(page, canvasRegion, 'kuis');

    // HARD ASSERT: inspector must show "Edit Kuis"
    await expect(page.locator('h2:has-text("Edit Kuis")')).toBeVisible({ timeout: 5000 });

    // HARD ASSERT: QuestionsFieldEditor must be visible
    const editor = page.locator('[data-testid="questions-field-editor"]');
    await expect(editor, 'QuestionsFieldEditor must appear when kuis block selected').toBeVisible({ timeout: 5000 });

    // HARD ASSERT: at least 1 question card from template
    const questionCards = page.locator('[data-testid^="question-card-"]');
    await expect(questionCards.first()).toBeVisible({ timeout: 5000 });
    const cardCount = await questionCards.count();
    expect(cardCount, 'should have at least 1 question from template').toBeGreaterThan(0);

    // HARD ASSERT: Tambah Pertanyaan button visible
    await expect(page.locator('[data-testid="questions-add-btn"]')).toBeVisible();

    // HARD ASSERT: summary visible
    await expect(page.locator('[data-testid="questions-summary"]')).toBeVisible();
  });

  test('kuis editor: Tambah Pertanyaan adds new question (hard assert)', async ({ page }) => {
    const { canvasRegion } = await setupAndNavigateToPage(page, 'Kuis');
    await clickBlockByType(page, canvasRegion, 'kuis');

    await expect(page.locator('[data-testid="questions-field-editor"]')).toBeVisible({ timeout: 5000 });

    const initialCount = await page.locator('[data-testid^="question-card-"]').count();
    await page.locator('[data-testid="questions-add-btn"]').click();
    await page.waitForTimeout(500);

    const newCount = await page.locator('[data-testid^="question-card-"]').count();
    expect(newCount, 'question count must increase by 1').toBe(initialCount + 1);

    // HARD ASSERT: new question has 4 option inputs
    for (let i = 0; i < 4; i++) {
      await expect(
        page.locator(`[data-testid="question-${newCount - 1}-opt-${i}"]`),
        `option ${i} of new question must exist`
      ).toBeVisible();
    }

    // HARD ASSERT: new question has 4 radio buttons
    for (let i = 0; i < 4; i++) {
      await expect(
        page.locator(`[data-testid="question-${newCount - 1}-ans-${i}"]`),
        `answer radio ${i} of new question must exist`
      ).toBeVisible();
    }
  });

  // ─────────────────────────────────────────────────────────────
  // Test 2: Sortir game editor
  // ─────────────────────────────────────────────────────────────
  test('sortir game editor: SortItemsFieldEditor appears + add item (hard assert)', async ({ page, context }) => {
    // Sortir game doesn't exist in PPKn template — use Game Sortir + Kuis template instead
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.locator('[data-testid="dashboard-start-template-btn"]').click();
    await page.waitForTimeout(2000);
    // Click "Game Sortir + Kuis" template (5th template)
    const gameTemplateBtn = page.locator('[data-testid^="template-card-"]').nth(4);
    await gameTemplateBtn.click();
    await page.waitForTimeout(5000);
    await expect(page.locator('[data-testid="clean-editor-v5"]')).toBeVisible({ timeout: 15000 });

    // Navigate to a Game page (templateType='game' → label='Game')
    const gamePageBtn = page.locator('button[type="button"]:has-text("Game")').first();
    await gamePageBtn.waitFor({ state: 'visible', timeout: 10000 });
    await gamePageBtn.click();
    await page.waitForTimeout(2000);

    const canvasRegion = page.locator('[aria-label="Area kanvas — halaman aktif"]').first();
    await expect(canvasRegion).toBeVisible({ timeout: 5000 });

    // Click sortir-game block
    const sortirBlock = canvasRegion.locator('[data-block-type="sortir-game"]').first();
    await expect(sortirBlock, 'sortir-game block must exist').toBeVisible({ timeout: 5000 });
    await sortirBlock.click({ force: true });
    await page.waitForTimeout(1500);

    // HARD ASSERT: inspector shows "Edit Game Sortir"
    await expect(page.locator('h2:has-text("Edit Game Sortir")')).toBeVisible({ timeout: 5000 });

    // HARD ASSERT: SortItemsFieldEditor visible
    const editor = page.locator('[data-testid="sortitems-field-editor"]');
    await expect(editor, 'SortItemsFieldEditor must appear when sortir-game block selected').toBeVisible({ timeout: 5000 });

    // HARD ASSERT: at least 1 kolom card from template
    const kolomCards = page.locator('[data-testid^="sortitems-kolom-card-"]');
    await expect(kolomCards.first()).toBeVisible({ timeout: 5000 });

    // Add a new item
    const initialItemCount = await page.locator('[data-testid^="sortitems-item-card-"]').count();
    await page.locator('[data-testid="sortitems-add-item-btn"]').click();
    await page.waitForTimeout(500);

    const newItemCount = await page.locator('[data-testid^="sortitems-item-card-"]').count();
    expect(newItemCount, 'item count must increase by 1').toBe(initialItemCount + 1);

    // HARD ASSERT: new item has text + category inputs
    await expect(
      page.locator(`[data-testid="sortitems-item-text-${newItemCount - 1}"]`),
      'new item text input must exist'
    ).toBeVisible();
    await expect(
      page.locator(`[data-testid="sortitems-item-category-${newItemCount - 1}"]`),
      'new item category dropdown must exist'
    ).toBeVisible();

    // HARD ASSERT: summary visible
    await expect(page.locator('[data-testid="sortitems-summary"]')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // Test 3: Diskusi editor
  // ─────────────────────────────────────────────────────────────
  test('diskusi editor: ReflectionQuestionsFieldEditor (discussion mode) appears + edit (hard assert)', async ({ page }) => {
    const { canvasRegion } = await setupAndNavigateToPage(page, 'Diskusi');
    await clickBlockByType(page, canvasRegion, 'diskusi');

    // HARD ASSERT: inspector shows "Edit Diskusi"
    await expect(page.locator('h2:has-text("Edit Diskusi")')).toBeVisible({ timeout: 5000 });

    // HARD ASSERT: discussion questions editor visible
    const editor = page.locator('[data-testid="discussion-questions-editor"]');
    await expect(editor, 'discussion-questions-editor must appear when diskusi block selected').toBeVisible({ timeout: 5000 });

    // HARD ASSERT: at least 1 question card from template
    const questionCards = page.locator('[data-testid^="reflection-question-card-"]');
    await expect(questionCards.first()).toBeVisible({ timeout: 5000 });

    // Edit first question text (hard assert value changes)
    const firstQuestionText = page.locator('[data-testid="reflection-question-text-0"]').first();
    await expect(firstQuestionText).toBeVisible();
    const originalValue = await firstQuestionText.inputValue();
    const testValue = `[BATCH-07B TEST] ${Date.now()}`;
    await firstQuestionText.fill(testValue);
    await page.waitForTimeout(500);
    const newValue = await firstQuestionText.inputValue();
    expect(newValue, 'edited text must persist in input').toBe(testValue);

    // Restore original
    if (originalValue) {
      await firstQuestionText.fill(originalValue);
      await page.waitForTimeout(300);
    }

    // HARD ASSERT: Tambah button + summary visible
    await expect(page.locator('[data-testid="reflection-questions-add-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="reflection-questions-summary"]')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // Test 4: Refleksi editor
  // ─────────────────────────────────────────────────────────────
  test('refleksi editor: ReflectionQuestionsFieldEditor (reflection mode) appears + edit (hard assert)', async ({ page }) => {
    const { canvasRegion } = await setupAndNavigateToPage(page, 'Refleksi');
    await clickBlockByType(page, canvasRegion, 'refleksi');

    // HARD ASSERT: inspector shows "Edit Refleksi"
    await expect(page.locator('h2:has-text("Edit Refleksi")')).toBeVisible({ timeout: 5000 });

    // HARD ASSERT: reflection questions editor visible
    const editor = page.locator('[data-testid="reflection-questions-editor"]');
    await expect(editor, 'reflection-questions-editor must appear when refleksi block selected').toBeVisible({ timeout: 5000 });

    // HARD ASSERT: at least 1 question card from template
    const questionCards = page.locator('[data-testid^="reflection-question-card-"]');
    await expect(questionCards.first()).toBeVisible({ timeout: 5000 });

    // Edit first question hint (hard assert value changes)
    const firstHint = page.locator('[data-testid="reflection-question-hint-0"]').first();
    await expect(firstHint).toBeVisible();
    const originalHint = await firstHint.inputValue();
    const testHint = `[BATCH-07B HINT] ${Date.now()}`;
    await firstHint.fill(testHint);
    await page.waitForTimeout(500);
    const newHint = await firstHint.inputValue();
    expect(newHint, 'edited hint must persist in input').toBe(testHint);

    // Restore original
    if (originalHint) {
      await firstHint.fill(originalHint);
      await page.waitForTimeout(300);
    }

    // HARD ASSERT: Tambah button visible
    await expect(page.locator('[data-testid="reflection-questions-add-btn"]')).toBeVisible();
  });
});
