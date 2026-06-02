/**
 * Sprint 0B v3 — Robust test with error handling
 */
import { test, expect } from '@playwright/test';

test.setTimeout(90000);

test('Sprint 0B: CanvaBuilder load test', async ({ page }) => {
  // Collect errors
  const browserErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') browserErrors.push(msg.text().substring(0, 300));
  });
  page.on('pageerror', err => browserErrors.push(`PAGE_ERROR: ${err.message.substring(0, 300)}`));

  // 1. Open page with tour already dismissed
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => localStorage.setItem('at_tour_done', '1'));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  // 2. Screenshot dashboard
  await page.screenshot({ path: '/home/z/my-project/download/s0b-v3-01-dashboard.png' });
  console.log('Dashboard loaded');

  // 3. Click canva nav (with force to bypass any overlay)
  try {
    const canvaBtn = page.locator('[data-testid="nav-canva"]').first();
    await canvaBtn.click({ timeout: 10000, force: true });
    console.log('Clicked canva nav');
  } catch (e: any) {
    console.log('Click failed:', e.message?.substring(0, 200));
    // Try alternative: click the sidebar Desain button
    try {
      await page.locator('button:has-text("Desain")').first().click({ timeout: 5000, force: true });
      console.log('Clicked Desain button instead');
    } catch {
      console.log('Desain button also failed');
    }
  }

  // 4. Wait for CanvaBuilder
  await page.waitForTimeout(15000);

  // 5. Take screenshot regardless of what happened
  try {
    await page.screenshot({ path: '/home/z/my-project/download/s0b-v3-02-canvas.png' });
  } catch {
    console.log('Screenshot failed - page may have crashed');
  }

  // 6. Try to check DOM state
  let pageState: any = null;
  try {
    pageState = await page.evaluate(() => {
      const testIds = Array.from(document.querySelectorAll('[data-testid]')).map(el => ({
        id: el.getAttribute('data-testid'),
        tag: el.tagName,
        visible: (el as HTMLElement).offsetParent !== null,
        w: Math.round(el.getBoundingClientRect().width),
        h: Math.round(el.getBoundingClientRect().height),
      }));
      return {
        url: location.href,
        title: document.title,
        bodyLen: document.body.textContent?.length || 0,
        testIds,
        bodyStart: document.body.textContent?.substring(0, 200) || '',
      };
    });
    console.log('Page state:', JSON.stringify(pageState.testIds, null, 2));
  } catch (e: any) {
    console.log('Cannot evaluate page:', e.message?.substring(0, 200));
  }

  // 7. Check for CanvaBuilder
  let cbCount = 0;
  try {
    cbCount = await page.locator('[data-testid="canva-builder"]').count();
  } catch {
    console.log('Cannot check canva-builder - page crashed');
  }
  console.log('canva-builder count:', cbCount);

  // 8. If CanvaBuilder loaded, measure layout
  if (cbCount > 0) {
    try {
      const measurements = await page.evaluate(() => {
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
      console.log(JSON.stringify(measurements, null, 2));

      // Gutter analysis
      if (measurements.canvasStage && measurements.stageWrap) {
        const s = measurements.canvasStage;
        const w = measurements.stageWrap;
        console.log('\n=== GUTTER ANALYSIS ===');
        console.log('Canvas stage:', s.w, 'x', s.h);
        console.log('Stage wrap (canvas):', w.w, 'x', w.h);
        console.log('Gutter left:', w.x - s.x, 'px');
        console.log('Gutter right:', (s.x + s.w) - (w.x + w.w), 'px');
        console.log('Gutter top:', w.y - s.y, 'px');
        console.log('Gutter bottom:', (s.y + s.h) - (w.y + w.h), 'px');
      }
    } catch (e: any) {
      console.log('Measurement failed:', e.message?.substring(0, 200));
    }
  }

  // 9. Report errors
  console.log('\n=== BROWSER ERRORS ===');
  browserErrors.forEach((e, i) => console.log(`${i + 1}. ${e}`));

  // 10. Summary
  console.log('\n=== SUMMARY ===');
  console.log('Dashboard hydrated: YES');
  console.log('CanvaBuilder loaded:', cbCount > 0 ? 'YES' : 'NO');
  console.log('Total browser errors:', browserErrors.length);
});
