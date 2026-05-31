/**
 * Sprint 0B — Browser Chunk Stability + Workspace Layout Audit
 * v2: Handle guided tour overlay that blocks clicks
 */
import { test, expect } from '@playwright/test';

test.setTimeout(90000);

test('Sprint 0B: Full browser session — Dashboard → Canvas Workspace', async ({ page }) => {
  const consoleErrors: string[] = [];
  const chunkErrors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      if (msg.text().includes('ChunkLoadError') || msg.text().includes('Loading chunk') || msg.text().includes('failed')) {
        chunkErrors.push(msg.text());
      }
    }
  });

  // Step 1: Open app
  console.log('=== Step 1: Open app ===');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Step 2: Check dashboard hydration
  console.log('=== Step 2: Dashboard hydration ===');
  const bodyText = await page.textContent('body');
  const dashboardHydrated = (bodyText?.length ?? 0) > 100;
  console.log('Dashboard hydrated:', dashboardHydrated, 'text length:', bodyText?.length);

  await page.screenshot({ path: '/home/z/my-project/download/s0b-01-dashboard.png' });

  // Step 3: Dismiss guided tour overlay if present
  console.log('=== Step 3: Dismiss tour ===');
  const lewatiBtn = page.locator('button:has-text("Lewati")').first();
  const lewatiVisible = await lewatiBtn.isVisible().catch(() => false);
  if (lewatiVisible) {
    await lewatiBtn.click({ force: true });
    console.log('Dismissed guided tour');
    await page.waitForTimeout(500);
  } else {
    // Try clicking the overlay backdrop
    const backdrop = page.locator('.backdrop-blur-sm').first();
    const backdropVisible = await backdrop.isVisible().catch(() => false);
    if (backdropVisible) {
      // Try force-clicking the "Lewati" or dismiss button
      await page.locator('button').filter({ hasText: 'Lewati' }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(500);
    }
    console.log('No tour visible or already dismissed');
  }

  // Also try pressing Escape to dismiss any overlay
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  await page.screenshot({ path: '/home/z/my-project/download/s0b-02-after-tour.png' });

  // Step 4: Click Canva nav
  console.log('=== Step 4: Navigate to Canvas ===');
  const canvaBtn = page.locator('[data-testid="nav-canva"]').first();
  await canvaBtn.click({ force: true });
  console.log('Clicked canva nav');

  // Step 5: Wait for CanvaBuilder to load
  console.log('=== Step 5: Wait for CanvaBuilder ===');
  await page.waitForTimeout(10000);

  await page.screenshot({ path: '/home/z/my-project/download/s0b-03-canvas.png' });

  // Step 6: Check workspace elements
  console.log('=== Step 6: Check workspace elements ===');
  const canvaBuilder = page.locator('[data-testid="canva-builder"]');
  const leftPanel = page.locator('[data-testid="left-panel"]');
  const canvasStage = page.locator('[data-testid="canvas-stage"]');
  const rightPanel = page.locator('[data-testid="right-panel"]');
  const toolbar = page.locator('[data-testid="toolbar"]');

  const cb = await canvaBuilder.count();
  const lp = await leftPanel.count();
  const cs = await canvasStage.count();
  const rp = await rightPanel.count();
  const tb = await toolbar.count();

  console.log('canva-builder:', cb);
  console.log('left-panel:', lp);
  console.log('canvas-stage:', cs);
  console.log('right-panel:', rp);
  console.log('toolbar:', tb);

  // Step 7: Measure bounding boxes
  console.log('=== Step 7: Measure bounding boxes ===');
  const result = await page.evaluate(() => {
    const get = (sel: string) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };

    const area = document.getElementById('cm-canvas-area');
    const wrap = document.getElementById('cm-stage-wrap');

    return {
      leftPanel: get('[data-testid="left-panel"]'),
      canvasStage: get('[data-testid="canvas-stage"]'),
      rightPanel: get('[data-testid="right-panel"]'),
      toolbar: get('[data-testid="toolbar"]'),
      canvaBuilder: get('[data-testid="canva-builder"]'),
      canvasArea: area ? (() => { const r = area.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
      stageWrap: wrap ? (() => { const r = wrap.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      panels: Array.from(document.querySelectorAll('[data-panel]')).map(p => ({
        id: p.getAttribute('data-panel'),
        r: (() => { const rect = p.getBoundingClientRect(); return { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) }; })()
      })),
    };
  });

  console.log('\n=== MEASUREMENTS ===');
  console.log(JSON.stringify(result, null, 2));

  // Step 8: Determine overlap/gutter
  console.log('\n=== GUTTER ANALYSIS ===');
  if (result.canvasStage && result.stageWrap) {
    const stage = result.canvasStage;
    const wrap = result.stageWrap;
    const gutterLeft = wrap.x - stage.x;
    const gutterRight = (stage.x + stage.w) - (wrap.x + wrap.w);
    const gutterTop = wrap.y - stage.y;
    const gutterBottom = (stage.y + stage.h) - (wrap.y + wrap.h);
    console.log('Canvas stage area:', stage.w, 'x', stage.h);
    console.log('Stage wrap (1280x720 canvas):', wrap.w, 'x', wrap.h);
    console.log('Gutter left:', gutterLeft, 'px');
    console.log('Gutter right:', gutterRight, 'px');
    console.log('Gutter top:', gutterTop, 'px');
    console.log('Gutter bottom:', gutterBottom, 'px');
    console.log('Gutter left % of stage:', Math.round(gutterLeft / stage.w * 100), '%');
    console.log('Gutter right % of stage:', Math.round(gutterRight / stage.w * 100), '%');
  }

  // Step 9: Final results
  console.log('\n=== FINAL RESULT ===');
  console.log('Dashboard hydrate:', dashboardHydrated ? 'YES' : 'NO');
  console.log('CanvaBuilder loaded:', cb > 0 ? 'YES' : 'NO');
  console.log('Left panel visible:', lp > 0 ? 'YES' : 'NO');
  console.log('Canvas stage visible:', cs > 0 ? 'YES' : 'NO');
  console.log('Right panel visible:', rp > 0 ? 'YES' : 'NO');
  console.log('Chunk errors:', chunkErrors.length);
  consoleErrors.slice(0, 10).forEach(e => console.log('  Console error:', e.substring(0, 200)));

  await page.screenshot({ path: '/home/z/my-project/download/s0b-04-final.png', fullPage: true });
});
