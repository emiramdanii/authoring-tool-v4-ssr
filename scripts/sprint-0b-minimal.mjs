import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process']
});
const page = await browser.newPage();
console.log('Browser launched');

await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 15000 });
console.log('Page loaded');
await page.waitForTimeout(3000);

const title = await page.title();
console.log('Title:', title);

const len = await page.evaluate(() => document.body.textContent?.length || 0);
console.log('Body text length:', len);

// Set tour done and reload
await page.evaluate(() => localStorage.setItem('at_tour_done', '1'));
await page.reload({ waitUntil: 'load', timeout: 15000 });
await page.waitForTimeout(3000);
console.log('Page reloaded with tour dismissed');

// Click canva nav
await page.evaluate(() => {
  const btn = document.querySelector('[data-testid="nav-canva"]');
  if (btn) btn.click();
});
console.log('Clicked nav-canva');

// Wait for CanvaBuilder
await page.waitForTimeout(10000);

// Check result
const result = await page.evaluate(() => {
  return {
    canvaBuilder: !!document.querySelector('[data-testid="canva-builder"]'),
    leftPanel: !!document.querySelector('[data-testid="left-panel"]'),
    canvasStage: !!document.querySelector('[data-testid="canvas-stage"]'),
    rightPanel: !!document.querySelector('[data-testid="right-panel"]'),
    toolbar: !!document.querySelector('[data-testid="toolbar"]'),
    canvasArea: !!document.getElementById('cm-canvas-area'),
    stageWrap: !!document.getElementById('cm-stage-wrap'),
    bodyStart: document.body.textContent?.substring(0, 100) || '',
  };
});
console.log('Result:', JSON.stringify(result, null, 2));

// If canva builder loaded, measure
if (result.canvaBuilder) {
  const measurements = await page.evaluate(() => {
    const get = (sel) => {
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
      canvasArea: area ? (() => { const r = area.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
      stageWrap: wrap ? (() => { const r = wrap.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
      viewport: { w: window.innerWidth, h: window.innerHeight },
    };
  });
  console.log('Measurements:', JSON.stringify(measurements, null, 2));
  
  // Gutter analysis
  if (measurements.canvasStage && measurements.stageWrap) {
    const s = measurements.canvasStage;
    const w = measurements.stageWrap;
    console.log('\n=== GUTTER ===');
    console.log('Canvas stage:', s.w, 'x', s.h);
    console.log('Stage wrap:', w.w, 'x', w.h);
    console.log('Gutter L:', w.x - s.x, 'R:', (s.x+s.w)-(w.x+w.w), 'T:', w.y-s.y, 'B:', (s.y+s.h)-(w.y+w.h));
  }
}

// Screenshot
await page.screenshot({ path: '/home/z/my-project/download/s0b-v6-canvas.png' });

// Check errors
const errors = await page.evaluate(() => {
  return window.__consoleErrors || 'none';
});
console.log('Errors during test:', errors);

await browser.close();
console.log('Test complete');
