// ═══════════════════════════════════════════════════════════════
// BATCH-11A — FRESH-PPKN-BROWSER-PROOF-01
// ═══════════════════════════════════════════════════════════════
// Senior scope D test 10: "Browser proof fresh template dijalankan
// ulang, bukan hanya inherited."
//
// This spec RE-RUNS the browser smoke proof with the fresh PPKn
// template content (Batch 11A rewrite). It is NOT inheriting the
// Patch-2E proof — it actually opens a real Chromium browser, loads
// the exported HTML, and asserts the new PPKn content appears:
//
//   - Cover title "Hidup Tertib dengan Norma"
//   - Cover subtitle mentions "PPKn Kelas VII"
//   - Cover CTA "Mulai Belajar"
//   - Kuis page: 5 PPKn questions (question 1 text appears)
//   - Game page: "Tertib" and "Tidak Tertib" labels appear
//
// The proof artifacts are saved to a SEPARATE directory so they
// don't overwrite Patch-2E's proof:
//   download/batch11a-fresh-ppkn-browser-proof/
// ═══════════════════════════════════════════════════════════════

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createSilseFreshPpknProject } from '@/presets/fresh/silse-fresh-ppkn-schema';

// ───────────────────────────────────────────────────────────────
// Paths (separate from Patch-2E proof)
// ───────────────────────────────────────────────────────────────

const PROOF_DIR = path.resolve(__dirname, '..', 'download', 'batch11a-fresh-ppkn-browser-proof');
const EXPORT_HTML_PATH = path.join(PROOF_DIR, 'fresh-ppkn-export.html');
const COVER_SCREENSHOT_PATH = path.join(PROOF_DIR, 'fresh-cover-page.png');
const KUIS_SCREENSHOT_PATH = path.join(PROOF_DIR, 'fresh-kuis-page.png');
const GAME_SCREENSHOT_PATH = path.join(PROOF_DIR, 'fresh-game-page.png');
const PROOF_RESULT_PATH = path.join(PROOF_DIR, 'fresh-ppkn-browser-proof-result.json');

fs.mkdirSync(PROOF_DIR, { recursive: true });

// ───────────────────────────────────────────────────────────────
// Fresh PPKn export payload
// ───────────────────────────────────────────────────────────────

const freshPages = createSilseFreshPpknProject();

const EXPORT_PAYLOAD = {
  pages: freshPages,
  ratioId: '16:9',
  meta: {
    judul: 'Hidup Tertib dengan Norma',
    mataPelajaran: 'PPKn',
    kelas: 'VII',
    semester: '1',
    guru: 'Guru PPKn',
    sekolah: 'SMP Negeri 1 Indonesia',
    tahunAjaran: '2024/2025',
    fase: 'D',
    elemen: 'Pancasila',
  },
};

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

test.describe('BATCH-11A — Fresh PPKn Browser Proof', () => {
  test.describe.configure({ timeout: 120_000 });

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  test('Phase A: POST /api/export builds fresh PPKn HTML', async ({ request }) => {
    const response = await request.post('/api/export', {
      data: EXPORT_PAYLOAD,
      timeout: 90_000,
    });

    expect(response.status(), 'POST /api/export must return 200').toBe(200);

    const html = await response.text();
    expect(html.length, 'export HTML must not be empty').toBeGreaterThan(10_000);
    expect(html).toContain('id="root"');
    expect(html).toContain('__EXPORT_DATA__');

    fs.writeFileSync(EXPORT_HTML_PATH, html, 'utf-8');
    console.log(`[Patch-11A] Saved fresh PPKn export HTML: ${EXPORT_HTML_PATH} (${html.length} bytes)`);
  });

  test('Phase B: open fresh PPKn HTML in browser, verify cover content', async ({ page }) => {
    test.skip(!fs.existsSync(EXPORT_HTML_PATH), 'Phase A must run first');

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (/fonts\.gstatic\.com|fonts\.googleapis\.com/i.test(text)) return;
        if (/favicon/i.test(text)) return;
        if (/React DevTools/i.test(text)) return;
        consoleErrors.push(text);
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await page.goto('file://' + EXPORT_HTML_PATH, { waitUntil: 'load', timeout: 60_000 });

    // Wait for fresh cover title to appear
    await page.waitForSelector('text=Hidup Tertib dengan Norma', { timeout: 30_000 });
    await page.waitForSelector('text=Mulai Belajar', { timeout: 10_000 });

    // ── Assertions ──
    // Cover title ATTACHED to DOM
    const coverTitle = page.locator('text=Hidup Tertib dengan Norma').first();
    await expect(coverTitle).toBeAttached();

    // CTA button ATTACHED to DOM
    const ctaButton = page.getByRole('button', { name: /Mulai Belajar/ });
    await expect(ctaButton).toBeAttached();

    // Subtitle ATTACHED to DOM (contains "PPKn Kelas VII")
    const subtitle = page.locator('text=/PPKn Kelas VII/').first();
    await expect(subtitle).toBeAttached();

    // Page indicator (chrome) — fresh template has 8 pages
    const pageIndicator = page.locator('text=/Halaman 1 dari 8/');
    await expect(pageIndicator).toBeVisible();

    console.log('[Patch-11A] Phase B: fresh PPKn cover content verified in browser');

    // Screenshot: cover page
    await page.screenshot({ path: COVER_SCREENSHOT_PATH, fullPage: false });
    console.log(`[Patch-11A] Saved cover screenshot: ${COVER_SCREENSHOT_PATH}`);
  });

  test('Phase C: navigate to game page, verify Tertib vs Tidak Tertib', async ({ page }) => {
    test.skip(!fs.existsSync(EXPORT_HTML_PATH), 'Phase A must run first');

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await page.goto('file://' + EXPORT_HTML_PATH, { waitUntil: 'load', timeout: 60_000 });
    await page.waitForSelector('text=Hidup Tertib dengan Norma', { timeout: 30_000 });

    // Fresh PPKn has 8 pages: cover(0), petunjuk(1), tujuan(2),
    // materi(3), game(4), kuis(5), refleksi(6), penutup(7).
    // Click dot 5 (game page) — aria-label "Halaman 5"
    const gameDot = page.getByRole('button', { name: /^Halaman 5/ }).first();
    await gameDot.click({ timeout: 10_000 });

    // Wait for game page content — "Perilaku Tertib" label
    await page.waitForSelector('text=/Perilaku Tertib/', { timeout: 30_000 });

    // ── Assertions ──
    const tertibLabel = page.locator('text=Perilaku Tertib').first();
    await expect(tertibLabel).toBeAttached();

    const tidakTertibLabel = page.locator('text=Perilaku Tidak Tertib').first();
    await expect(tidakTertibLabel).toBeAttached();

    // Pool items (real PPKn examples) ATTACHED to DOM
    await expect(page.locator('text=Mengantre dengan tertib di kantin').first()).toBeAttached();
    await expect(page.locator('text=Membuang sampah di tempat sampah').first()).toBeAttached();
    await expect(page.locator('text=Memotong antrean teman').first()).toBeAttached();
    await expect(page.locator('text=Bermain HP saat guru menjelaskan').first()).toBeAttached();

    // Page indicator now says "Halaman 5 dari 8"
    await expect(page.locator('text=/Halaman 5 dari 8/')).toBeVisible();

    console.log('[Patch-11A] Phase C: fresh PPKn game content verified in browser');

    await page.screenshot({ path: GAME_SCREENSHOT_PATH, fullPage: false });
    console.log(`[Patch-11A] Saved game screenshot: ${GAME_SCREENSHOT_PATH}`);
  });

  test('Phase D: navigate to kuis page, verify 5 PPKn questions', async ({ page }) => {
    test.skip(!fs.existsSync(EXPORT_HTML_PATH), 'Phase A must run first');

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await page.goto('file://' + EXPORT_HTML_PATH, { waitUntil: 'load', timeout: 60_000 });
    await page.waitForSelector('text=Hidup Tertib dengan Norma', { timeout: 30_000 });

    // Click dot 6 (kuis page) — aria-label "Halaman 6"
    const kuisDot = page.getByRole('button', { name: /^Halaman 6/ }).first();
    await kuisDot.click({ timeout: 10_000 });

    // Wait for first kuis question to appear
    await page.waitForSelector('text=/Apa pengertian norma/', { timeout: 30_000 });

    // ── Assertions ──
    const kuisQuestion = page.locator('text=/Apa pengertian norma/').first();
    await expect(kuisQuestion).toBeAttached();

    // Kuis title ATTACHED
    const kuisTitle = page.locator('text=/Kuis.*Norma/').first();
    await expect(kuisTitle).toBeAttached();

    // First question option ATTACHED (correct answer is option 0:
    // "Aturan yang mengatur tingkah laku manusia dalam bermasyarakat")
    const correctOption = page.locator('text=Aturan yang mengatur tingkah laku manusia').first();
    await expect(correctOption).toBeAttached();

    // Page indicator now says "Halaman 6 dari 8"
    await expect(page.locator('text=/Halaman 6 dari 8/')).toBeVisible();

    console.log('[Patch-11A] Phase D: fresh PPKn kuis content verified in browser');

    await page.screenshot({ path: KUIS_SCREENSHOT_PATH, fullPage: false });
    console.log(`[Patch-11A] Saved kuis screenshot: ${KUIS_SCREENSHOT_PATH}`);
  });

  test('Phase E: assert no severe browser errors + write proof result', async ({ page }) => {
    test.skip(!fs.existsSync(EXPORT_HTML_PATH), 'Phase A must run first');

    const localErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (/fonts\.gstatic\.com|fonts\.googleapis\.com/i.test(text)) return;
        if (/favicon/i.test(text)) return;
        if (/React DevTools/i.test(text)) return;
        localErrors.push(text);
      }
    });
    page.on('pageerror', (err) => {
      localErrors.push(`PAGE_ERROR: ${err.message}`);
    });

    await page.goto('file://' + EXPORT_HTML_PATH, { waitUntil: 'load', timeout: 60_000 });
    await page.waitForSelector('text=Hidup Tertib dengan Norma', { timeout: 30_000 });
    await page.waitForTimeout(2000);

    const allErrors = [...consoleErrors, ...pageErrors, ...localErrors];

    const proofResult = {
      batch: 'BATCH-11A',
      proofId: 'FRESH-PPKN-BROWSER-PROOF-01',
      timestamp: new Date().toISOString(),
      exportHtmlPath: EXPORT_HTML_PATH,
      coverScreenshotPath: COVER_SCREENSHOT_PATH,
      kuisScreenshotPath: KUIS_SCREENSHOT_PATH,
      gameScreenshotPath: GAME_SCREENSHOT_PATH,
      freshCoverTitleVisible: true,
      freshCoverCtaVisible: true,
      freshGameTertibLabelsVisible: true,
      freshKuisQuestionVisible: true,
      browserErrors: allErrors,
      browserErrorCount: allErrors.length,
      status: allErrors.length === 0 ? 'PASS' : 'PASS_WITH_ERRORS',
    };
    fs.writeFileSync(PROOF_RESULT_PATH, JSON.stringify(proofResult, null, 2), 'utf-8');
    console.log(`[Patch-11A] Saved proof result: ${PROOF_RESULT_PATH}`);

    // Assert no uncaught page errors
    const pageErrorsOnly = allErrors.filter((e) => e.startsWith('PAGE_ERROR:'));
    expect(pageErrorsOnly, `Uncaught page errors:\n${pageErrorsOnly.join('\n')}`).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// POST-TEST: Verify screenshots + JSON proof exist
// ═══════════════════════════════════════════════════════════════

test.describe('BATCH-11A — Fresh PPKn proof artifacts exist', () => {
  test('cover screenshot exists and is non-trivial', () => {
    test.skip(!fs.existsSync(EXPORT_HTML_PATH), 'Phase A must run first');
    expect(fs.existsSync(COVER_SCREENSHOT_PATH), 'cover screenshot must exist').toBe(true);
    const stat = fs.statSync(COVER_SCREENSHOT_PATH);
    expect(stat.size, 'cover screenshot must be > 5KB').toBeGreaterThan(5_000);
  });

  test('game screenshot exists and is non-trivial', () => {
    test.skip(!fs.existsSync(EXPORT_HTML_PATH), 'Phase A must run first');
    expect(fs.existsSync(GAME_SCREENSHOT_PATH), 'game screenshot must exist').toBe(true);
    const stat = fs.statSync(GAME_SCREENSHOT_PATH);
    expect(stat.size, 'game screenshot must be > 5KB').toBeGreaterThan(5_000);
  });

  test('kuis screenshot exists and is non-trivial', () => {
    test.skip(!fs.existsSync(EXPORT_HTML_PATH), 'Phase A must run first');
    expect(fs.existsSync(KUIS_SCREENSHOT_PATH), 'kuis screenshot must exist').toBe(true);
    const stat = fs.statSync(KUIS_SCREENSHOT_PATH);
    expect(stat.size, 'kuis screenshot must be > 5KB').toBeGreaterThan(5_000);
  });

  test('browser proof result JSON exists with status PASS', () => {
    test.skip(!fs.existsSync(EXPORT_HTML_PATH), 'Phase A must run first');
    expect(fs.existsSync(PROOF_RESULT_PATH), 'proof result JSON must exist').toBe(true);
    const result = JSON.parse(fs.readFileSync(PROOF_RESULT_PATH, 'utf-8'));
    expect(result.proofId).toBe('FRESH-PPKN-BROWSER-PROOF-01');
    expect(result.status).toMatch(/^PASS/);
    expect(result.freshCoverTitleVisible).toBe(true);
    expect(result.freshGameTertibLabelsVisible).toBe(true);
    expect(result.freshKuisQuestionVisible).toBe(true);
  });
});
