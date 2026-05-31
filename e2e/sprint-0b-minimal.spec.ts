/**
 * Sprint 0B — Minimal browser test
 */
import { test } from '@playwright/test';

test.setTimeout(60000);

test('Sprint 0B: Dashboard hydrate + Canvas load', async ({ page }) => {
  // 1. Open dashboard
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  // 2. Screenshot dashboard
  await page.screenshot({ path: '/home/z/my-project/download/s0b-dashboard.png' });
  
  // 3. Check hydration
  const text = await page.textContent('body');
  console.log('Dashboard text length:', text?.length);

  // 4. Click canva nav
  const canvaBtn = page.locator('[data-testid="nav-canva"]').first();
  await canvaBtn.click();
  console.log('Clicked canva nav');

  // 5. Wait for CanvaBuilder to load
  await page.waitForTimeout(12000);
  await page.screenshot({ path: '/home/z/my-project/download/s0b-canvas.png' });

  // 6. Measure all key elements
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
  
  // 7. Save results
  await page.evaluate((data) => {
    // Can't write files from browser, but we've logged it
  }, result);
  
  // 8. Check for errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  // Final screenshot
  await page.screenshot({ path: '/home/z/my-project/download/s0b-final.png', fullPage: true });
});
