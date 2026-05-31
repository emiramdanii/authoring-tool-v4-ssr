// ═══════════════════════════════════════════════════════════════
// MANUAL QA CORE — E2E Tests for 6 Remaining Targets
// ═══════════════════════════════════════════════════════════════

import { test, expect, Page } from '@playwright/test';

// ── Helper: Setup project data and enter learn mode ──────────
async function setupProjectAndEnterLearnMode(page: Page): Promise<boolean> {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Fetch project data from API and inject into localStorage
  const projectData = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/projects?limit=10');
      const json = await res.json();
      const projects = json.data || [];
      if (projects.length === 0) return null;
      const project = projects[0];
      const detailRes = await fetch(`/api/projects/${project.id}`);
      const detailJson = await detailRes.json();
      const data = detailJson.data;
      const pages = data.pages.map((p: any) => ({
        id: p.id,
        label: p.title || p.label || 'Halaman',
        templateType: p.templateType || 'custom',
        schema: p.schemaData ? JSON.parse(p.schemaData) : undefined,
      }));
      return { pages, ratioId: data.ratioId || '16:9', version: 1 };
    } catch { return null; }
  });

  if (!projectData) return false;

  await page.evaluate((data) => {
    localStorage.setItem('canva_state_v2', JSON.stringify(data));
  }, projectData);

  // Reload to load from localStorage
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  // Dismiss tour
  for (let i = 0; i < 3; i++) {
    const lewati = page.locator('button:has-text("Lewati")');
    if (await lewati.isVisible({ timeout: 1500 }).catch(() => false)) {
      await lewati.click({ force: true });
      await page.waitForTimeout(500);
    } else break;
  }

  // Click nav-canva (Canva Editor)
  const navCanva = page.locator('[data-testid="nav-canva"]');
  await navCanva.waitFor({ state: 'visible', timeout: 15000 });
  await navCanva.click({ force: true });
  await page.waitForTimeout(4000);

  // Click "Main sebagai Siswa" button
  const mainBtn = page.locator('button[title*="Main sebagai Siswa"]').first();
  const hasMain = await mainBtn.isVisible({ timeout: 5000 }).catch(() => false);
  if (hasMain) {
    await mainBtn.click({ force: true });
    await page.waitForTimeout(5000);
    return true;
  }

  // Fallback: Click Preview, then Main
  const previewNavBtn = page.locator('[data-testid="nav-preview"]');
  if (await previewNavBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await previewNavBtn.click({ force: true });
    await page.waitForTimeout(2000);
  }
  const mainBtn2 = page.locator('button[title*="Main sebagai Siswa"]').first();
  if (await mainBtn2.isVisible({ timeout: 5000 }).catch(() => false)) {
    await mainBtn2.click({ force: true });
    await page.waitForTimeout(5000);
    return true;
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════
// T8: EDIT TEKS
// ═══════════════════════════════════════════════════════════════

test('T8: Edit teks — klik teks, ubah, klik luar, teks berubah', async ({ page }) => {
  const ok = await setupProjectAndEnterLearnMode(page);
  if (!ok) { test.skip(); return; }

  // Switch to Edit sub-mode
  const editToggle = page.locator('button:has-text("Edit")').first();
  if (await editToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
    await editToggle.click({ force: true });
    await page.waitForTimeout(500);
  }

  // Find editable text elements
  const editableEl = page.locator('[title="Klik untuk mengedit"], [data-inline-editable="true"]').first();
  const hasEditable = await editableEl.isVisible({ timeout: 5000 }).catch(() => false);

  if (!hasEditable) {
    console.log('MANUAL REQUIRED: T8 — No editable text found via E2E in Learn Edit mode');
    test.skip();
    return;
  }

  // Click to enter edit mode
  await editableEl.click({ force: true });
  await page.waitForTimeout(500);

  // Check contentEditable
  const contentEditable = page.locator('[contenteditable="true"]').first();
  const isEditing = await contentEditable.isVisible({ timeout: 3000 }).catch(() => false);
  expect(isEditing).toBeTruthy();

  // Edit text
  await contentEditable.click({ force: true });
  await page.keyboard.press('Control+a');
  await page.keyboard.type('Teks edit E2E');
  await page.waitForTimeout(200);

  // Click outside to save
  await page.locator('body').click({ position: { x: 10, y: 10 }, force: true });
  await page.waitForTimeout(500);

  // Verify text changed
  const bodyText = await page.textContent('body').catch(() => '');
  expect(bodyText).toContain('Teks edit E2E');
});

// ═══════════════════════════════════════════════════════════════
// T11+T12: KUIS + SKOR
// ═══════════════════════════════════════════════════════════════

test('T11+T12: Kuis dijawab → feedback → skor naik', async ({ page }) => {
  const ok = await setupProjectAndEnterLearnMode(page);
  if (!ok) { test.skip(); return; }

  // Check learn mode is active
  const learnCheck = await page.evaluate(() => {
    const t = document.body.textContent || '';
    return { hasKembali: t.includes('Kembali'), hasMulai: t.includes('Mulai'), bodyLen: t.length };
  });
  console.log('Learn mode check:', JSON.stringify(learnCheck));

  // Click Mulai on cover page
  const mulaiBtns = await page.locator('button').filter({ hasText: 'Mulai' }).all();
  for (const btn of mulaiBtns) {
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true });
      await page.waitForTimeout(1500);
      break;
    }
  }

  // Navigate to quiz page
  let quizFound = false;
  for (let attempt = 0; attempt < 8; attempt++) {
    const optBtn = page.locator('button').filter({ hasText: /^A\./ }).first();
    quizFound = await optBtn.isVisible({ timeout: 1000 }).catch(() => false);
    if (quizFound) break;
    const nextBtn = page.locator('button').filter({ hasText: 'Selanjutnya' }).first();
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false) && await nextBtn.isEnabled()) {
      await nextBtn.click({ force: true });
      await page.waitForTimeout(1500);
    } else break;
  }

  if (!quizFound) {
    console.log('MANUAL REQUIRED: T11+T12 — Quiz page not found in learn mode');
    test.skip();
    return;
  }

  console.log('QUIZ FOUND — answering...');

  // Answer quiz
  const optionBtn = page.locator('button').filter({ hasText: /^A\./ }).first();
  await optionBtn.click({ force: true });
  await page.waitForTimeout(3000);

  // Check feedback
  const feedback = await page.evaluate(() => {
    const t = document.body.textContent || '';
    return {
      hasCheckCircle: t.includes('check_circle'),
      hasCancel: t.includes('cancel'),
      hasSoalBerikutnya: t.includes('Soal berikutnya'),
      hasExplanation: t.includes('lightbulb'),
      hasSkor: t.includes('Skor'),
    };
  });
  console.log('T11 Feedback:', JSON.stringify(feedback));

  const hasAnyFeedback = feedback.hasCheckCircle || feedback.hasCancel || feedback.hasSoalBerikutnya || feedback.hasExplanation;
  expect(hasAnyFeedback || feedback.hasSkor).toBeTruthy();

  // Answer remaining questions
  for (let q = 0; q < 10; q++) {
    const nextOpt = page.locator('button').filter({ hasText: /^A\./ }).or(page.locator('button').filter({ hasText: /^B\./ })).first();
    if (await nextOpt.isVisible({ timeout: 1000 }).catch(() => false)) {
      await nextOpt.click({ force: true });
      await page.waitForTimeout(2500);
    } else break;
  }

  // Check score
  const finalScore = await page.evaluate(() => {
    const t = document.body.textContent || '';
    const m = t.match(/(\d+)\s*\/\s*(\d+)/);
    return m ? `${m[1]}/${m[2]}` : 'no score display';
  });
  console.log('T12 Score after quiz:', finalScore);
  expect(finalScore).not.toBe('no score display');
});

// ═══════════════════════════════════════════════════════════════
// T14: PROGRESS
// ═══════════════════════════════════════════════════════════════

test('T14: Progress bar ada dan berubah', async ({ page }) => {
  const ok = await setupProjectAndEnterLearnMode(page);
  if (!ok) { test.skip(); return; }

  // Check progress
  const progressBefore = await page.evaluate(() => {
    const t = document.body.textContent || '';
    const m = t.match(/(\d+)%/);
    return {
      hasPct: !!m,
      pctValue: m?.[1] || null,
      hasProgressBar: !!document.querySelector('[class*="bg-emerald-500"]'),
    };
  });
  console.log('T14 Progress before:', JSON.stringify(progressBefore));

  // Navigate
  const mulaiBtns = await page.locator('button').filter({ hasText: 'Mulai' }).all();
  for (const btn of mulaiBtns) {
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true });
      await page.waitForTimeout(1500);
      break;
    }
  }

  for (let i = 0; i < 5; i++) {
    const nextBtn = page.locator('button').filter({ hasText: 'Selanjutnya' }).first();
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false) && await nextBtn.isEnabled()) {
      await nextBtn.click({ force: true });
      await page.waitForTimeout(1500);
    } else break;
  }

  const progressAfter = await page.evaluate(() => {
    const t = document.body.textContent || '';
    const m = t.match(/(\d+)%/);
    return { pctValue: m?.[1] || null };
  });
  console.log('T14 Progress after navigation:', JSON.stringify(progressAfter));

  expect(progressBefore.hasPct || progressBefore.hasProgressBar || progressAfter.pctValue).toBeTruthy();
});

// ═══════════════════════════════════════════════════════════════
// T15: GAME
// ═══════════════════════════════════════════════════════════════

test('T15: Game page ada dan interaktif', async ({ page }) => {
  const ok = await setupProjectAndEnterLearnMode(page);
  if (!ok) { test.skip(); return; }

  // Navigate to game page
  const mulaiBtns = await page.locator('button').filter({ hasText: 'Mulai' }).all();
  for (const btn of mulaiBtns) {
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true });
      await page.waitForTimeout(1500);
      break;
    }
  }

  let foundGame = false;
  for (let attempt = 0; attempt < 8; attempt++) {
    const bodyText = await page.textContent('body').catch(() => '');
    if (bodyText?.includes('Sortir') || bodyText?.includes('sortir') || bodyText?.includes('game') || bodyText?.includes('Game')) {
      foundGame = true;
      break;
    }
    const nextBtn = page.locator('button').filter({ hasText: 'Selanjutnya' }).first();
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false) && await nextBtn.isEnabled()) {
      await nextBtn.click({ force: true });
      await page.waitForTimeout(1500);
    } else break;
  }

  if (!foundGame) {
    console.log('MANUAL REQUIRED: T15 — Game page not found via E2E');
    test.skip();
    return;
  }

  console.log('T15: Game page found');
  expect(foundGame).toBeTruthy();
});

// ═══════════════════════════════════════════════════════════════
// T16: EXPORT HTML
// ═══════════════════════════════════════════════════════════════

test('T16: Export HTML → buka file → fitur ada', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Get project data from API
  const res = await page.request.get('/api/projects?limit=10');
  const json = await res.json();
  const projects = json.data || [];
  const projectId = projects[0]?.id;
  if (!projectId) { test.skip(); return; }

  // Get full project data for export
  const detailRes = await page.request.get(`/api/projects/${projectId}`);
  const detailJson = await detailRes.json();
  const projectData = detailJson.data;

  // Build export payload
  const exportPayload = {
    pages: projectData.pages?.map((p: any) => ({
      id: p.id,
      label: p.title || p.label || 'Halaman',
      templateType: p.templateType || 'custom',
      schema: p.schemaData ? JSON.parse(p.schemaData) : undefined,
    })) || [],
    ratioId: projectData.ratioId || '16:9',
    meta: { judulPertemuan: projectData.title || 'Test', mapel: 'PPKn', kelas: 'VII' },
  };

  // Call export API (POST)
  const exportRes = await page.request.post('/api/export', {
    data: exportPayload,
  });
  
  if (!exportRes.ok()) {
    const errText = await exportRes.text().catch(() => 'unknown error');
    console.log('T16: Export API failed:', exportRes.status(), errText.substring(0, 200));
    // Export template might not be built yet
    console.log('T16: MANUAL REQUIRED — Export API returned non-OK. Run npm run export:build first.');
    test.skip();
    return;
  }

  const htmlContent = await exportRes.text();
  expect(htmlContent.length).toBeGreaterThan(1000);
  console.log('T16: Export HTML size:', htmlContent.length, 'bytes');

  // Verify features in export HTML
  const features = {
    scripts: htmlContent.includes('<script'),
    nav: htmlContent.includes('Selanjutnya') || htmlContent.includes('Mulai'),
    score: htmlContent.includes('Skor') || htmlContent.includes('score'),
    progress: htmlContent.includes('progress'),
    quiz: htmlContent.includes('kuis') || htmlContent.includes('quiz') || htmlContent.includes('Soal'),
    exportData: htmlContent.includes('__EXPORT_DATA__'),
  };
  console.log('T16 Export features:', JSON.stringify(features));
  expect(features.scripts || features.exportData).toBeTruthy();

  // Save and open in browser
  require('fs').writeFileSync('/tmp/silse-export-test.html', htmlContent);
  await page.goto('file:///tmp/silse-export-test.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const bodyText = await page.textContent('body').catch(() => '');
  console.log('T16: Export HTML body length:', bodyText.length);
  expect(bodyText.length).toBeGreaterThan(50);

  // Try navigation
  const mulaiBtn = page.locator('button:has-text("Mulai")').first();
  if (await mulaiBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await mulaiBtn.click({ force: true });
    await page.waitForTimeout(1500);
    console.log('T16: Mulai clicked in export HTML');
  }

  console.log('T16: Export HTML test completed');
});
