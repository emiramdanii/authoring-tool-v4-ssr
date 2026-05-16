import { test, expect } from '@playwright/test';
import {
  navigateToCanva,
  addBlankPage,
  getPageCount,
  undo,
  redo,
} from './helpers';

// ═══════════════════════════════════════════════════════════════
// G.5 E2E Smoke Test — Undo/Redo Flow
// ═══════════════════════════════════════════════════════════════
// Verifies that Ctrl+Z undoes and Ctrl+Shift+Z redoes actions.
// Tests with page additions since they are the most reliable
// state changes to observe.
// ═══════════════════════════════════════════════════════════════

test.describe('Undo/Redo', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToCanva(page);
  });

  test('undo a page addition', async ({ page }) => {
    const initialCount = await getPageCount(page);

    // Add a blank page
    await addBlankPage(page);
    const countAfterAdd = await getPageCount(page);
    expect(countAfterAdd).toBe(initialCount + 1);

    // Undo the addition
    await undo(page);

    // Page count should revert
    const countAfterUndo = await getPageCount(page);
    expect(countAfterUndo).toBe(initialCount);
  });

  test('redo restores the undone action', async ({ page }) => {
    const initialCount = await getPageCount(page);

    // Add a blank page
    await addBlankPage(page);
    const countAfterAdd = await getPageCount(page);
    expect(countAfterAdd).toBe(initialCount + 1);

    // Undo
    await undo(page);
    const countAfterUndo = await getPageCount(page);
    expect(countAfterUndo).toBe(initialCount);

    // Redo
    await redo(page);

    // Page count should be restored
    const countAfterRedo = await getPageCount(page);
    expect(countAfterRedo).toBe(initialCount + 1);
  });

  test('undo button in toolbar reflects state', async ({ page }) => {
    // Initially, undo button should be disabled (no history)
    const undoBtn = page.locator('[data-testid="toolbar"] button:has(svg.lucide-undo-2)').first();

    // After making a change, undo should become enabled
    await addBlankPage(page);

    // The undo button should no longer be disabled
    // (we check it's not having the disabled attribute or opacity-30 class)
    const isDisabled = await undoBtn.getAttribute('disabled');
    const hasDisabledClass = await undoBtn.evaluate(el => el.classList.contains('opacity-30'));
    expect(isDisabled).toBeNull(); // Not disabled
    expect(hasDisabledClass).toBeFalsy();
  });

  test('multiple undo/redo cycles work', async ({ page }) => {
    const initialCount = await getPageCount(page);

    // Add two pages
    await addBlankPage(page);
    await addBlankPage(page);
    const countAfterAdds = await getPageCount(page);
    expect(countAfterAdds).toBe(initialCount + 2);

    // Undo both
    await undo(page);
    await undo(page);
    const countAfterDoubleUndo = await getPageCount(page);
    expect(countAfterDoubleUndo).toBe(initialCount);

    // Redo both
    await redo(page);
    await redo(page);
    const countAfterDoubleRedo = await getPageCount(page);
    expect(countAfterDoubleRedo).toBe(initialCount + 2);
  });
});
