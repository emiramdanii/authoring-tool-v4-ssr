import { Page, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// E2E Test Helpers — SILSE Authoring Tool Smoke Tests
// ═══════════════════════════════════════════════════════════════
// Shared utilities for navigating the app and interacting with
// the canva editor. All helpers use data-testid selectors for
// resilience against CSS/text changes.
// ═══════════════════════════════════════════════════════════════

// ── App Navigation ──────────────────────────────────────────────

/**
 * Navigate to the app root and wait for it to become interactive.
 * Dismisses the first-visit tour dialog if present.
 */
export async function gotoApp(page: Page) {
  await page.goto('/');
  // Wait for the app shell to render (AuthoringTool sidebar)
  await page.waitForSelector('[data-testid="nav-canva"]', { timeout: 30000 });
  // Dismiss the guided tour if it appears (tries multiple times since it may animate in)
  for (let attempt = 0; attempt < 3; attempt++) {
    const tourSkip = page.locator('button:has-text("Lewati")');
    if (await tourSkip.isVisible({ timeout: 1500 }).catch(() => false)) {
      await tourSkip.click({ force: true });
      await page.waitForTimeout(500);
    } else {
      break;
    }
  }
}

/**
 * Navigate to the Canva editor panel (the canvas builder).
 * This clicks the "Canva" nav button in the AuthoringTool sidebar.
 */
export async function navigateToCanva(page: Page) {
  await gotoApp(page);
  // Click the nav-canva button — use force:true as a fallback if regular click
  // fails due to overlapping elements (tour overlay, animated content, etc.)
  const navBtn = page.locator('[data-testid="nav-canva"]');
  try {
    await navBtn.click({ timeout: 5000 });
  } catch {
    await navBtn.click({ force: true, timeout: 5000 });
  }
  await waitForCanvaReady(page);
}

/**
 * Wait for the CanvaBuilder to be fully loaded and interactive.
 * Checks for the main canva-builder wrapper and toolbar.
 */
export async function waitForCanvaReady(page: Page) {
  await page.waitForSelector('[data-testid="canva-builder"]', { timeout: 30000 });
  await page.waitForSelector('[data-testid="toolbar"]', { timeout: 10000 });
  // Wait a tick for animations and async loads to settle
  await page.waitForTimeout(1000);
}

// ── Page Management ─────────────────────────────────────────────

/**
 * Add a new blank page via the left panel button.
 * Requires being on the Canva editor already.
 */
export async function addBlankPage(page: Page) {
  await page.click('[data-testid="add-blank-page-btn"]');
  await page.waitForTimeout(500);
}

/**
 * Switch to a specific page by index (0-based).
 */
export async function switchToPage(page: Page, index: number) {
  await page.click(`[data-testid="page-tab-${index}"]`);
  await page.waitForTimeout(300);
}

/**
 * Get the current number of page tabs.
 */
export async function getPageCount(page: Page): Promise<number> {
  return page.locator('[data-testid^="page-tab-"]').count();
}

/**
 * Delete the current page by clicking the "Hapus" button.
 * Accepts the confirmation dialog.
 */
export async function deleteCurrentPage(page: Page) {
  // The Hapus button is in the left panel scene list
  const deleteBtn = page.locator('button:has-text("Hapus")').first();
  if (await deleteBtn.isVisible()) {
    // Set up dialog handler before clicking
    page.on('dialog', dialog => dialog.accept());
    await deleteBtn.click();
    await page.waitForTimeout(500);
  }
}

// ── Block Operations ────────────────────────────────────────────

/**
 * Add a schema block by type. Opens the "Tambah Block" section
 * in the left panel and clicks the block button.
 */
export async function addBlockByType(page: Page, blockType: string) {
  // Make sure the add-block panel is visible (the Tambah Block section may be collapsed)
  const addBlockPanel = page.locator('[data-testid="add-block-panel"]');
  if (!(await addBlockPanel.isVisible({ timeout: 2000 }).catch(() => false))) {
    // Click the collapsible header to expand
    const header = page.locator('button:has-text("Tambah Block"), button:has-text("Tambah Konten")').first();
    if (await header.isVisible()) {
      await header.click();
      await page.waitForTimeout(300);
    }
  }

  // Click the specific block type button
  const blockBtn = page.locator(`[data-testid="add-block-btn-${blockType}"]`).first();
  await blockBtn.waitFor({ state: 'visible', timeout: 5000 });
  await blockBtn.click();
  await page.waitForTimeout(500);
}

/**
 * Select a block on the canvas by clicking it.
 * This looks for schema blocks rendered in the page.
 */
export async function selectBlockOnCanvas(page: Page, blockIndex: number = 0) {
  // Schema blocks are rendered inside the PageRenderer
  const blocks = page.locator('[data-block-id]');
  const count = await blocks.count();
  if (count > blockIndex) {
    await blocks.nth(blockIndex).click();
    await page.waitForTimeout(300);
  }
}

/**
 * Delete the currently selected block using the Delete key.
 */
export async function deleteSelectedBlock(page: Page) {
  await page.keyboard.press('Delete');
  await page.waitForTimeout(500);
}

/**
 * Check if the block properties panel is visible in the right panel.
 */
export async function isBlockPropertiesPanelVisible(page: Page): Promise<boolean> {
  return page.locator('[data-testid="block-properties-panel"]').isVisible().catch(() => false);
}

// ── Undo / Redo ─────────────────────────────────────────────────

/**
 * Undo last action via keyboard shortcut.
 */
export async function undo(page: Page) {
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(300);
}

/**
 * Redo via keyboard shortcut.
 */
export async function redo(page: Page) {
  await page.keyboard.press('Control+Shift+z');
  await page.waitForTimeout(300);
}

// ── Save / Persistence ──────────────────────────────────────────

/**
 * Trigger save via keyboard shortcut.
 */
export async function saveProject(page: Page) {
  await page.keyboard.press('Control+s');
  await page.waitForTimeout(500);
}

/**
 * Check if localStorage has saved canva data.
 */
export async function hasSavedData(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return localStorage.getItem('canva_state_v2') !== null;
  });
}

/**
 * Get the saved canva data from localStorage.
 */
export async function getSavedData(page: Page): Promise<any> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('canva_state_v2');
    return raw ? JSON.parse(raw) : null;
  });
}

/**
 * Clear all saved data from localStorage.
 */
export async function clearSavedData(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('canva_state_v2');
  });
}

// ── Template Gallery ────────────────────────────────────────────

/**
 * Open the template gallery section in the left panel.
 */
export async function openTemplateGallery(page: Page) {
  const gallerySection = page.locator('[data-testid="template-gallery"]');
  const toggleBtn = gallerySection.locator('button').first();
  // If the template gallery panel is not visible, click the toggle
  const panel = page.locator('[data-testid="template-gallery-panel"]');
  if (!(await panel.isVisible({ timeout: 2000 }).catch(() => false))) {
    await toggleBtn.click();
    await page.waitForTimeout(500);
  }
}

// ── Console Error Monitoring ────────────────────────────────────

/**
 * Collect console errors during page load and interactions.
 * Returns a cleanup function that stops monitoring.
 */
export function monitorConsoleErrors(page: Page): { getErrors: () => string[]; cleanup: () => void } {
  const errors: string[] = [];

  const handler = (msg: any) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  };

  page.on('console', handler);

  return {
    getErrors: () => [...errors],
    cleanup: () => {
      page.off('console', handler);
    },
  };
}
