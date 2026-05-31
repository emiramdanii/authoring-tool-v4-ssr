const { chromium } = require('playwright');
const http = require('http');

function fetchHTML() {
  return new Promise((resolve, reject) => {
    http.get('http://21.0.22.43:3000/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  console.log('1. Fetching HTML from server...');
  let html;
  try {
    html = await fetchHTML();
    console.log('   HTML fetched, length:', html.length);
  } catch (e) {
    console.log('   Failed to fetch HTML:', e.message);
    console.log('   Server may not be running. Starting...');
    process.exit(1);
  }
  
  console.log('2. Launching browser...');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log('3. Page content set. Title:', await page.title());
  
  await page.waitForTimeout(6000);
  
  console.log('4. Navigating to Canva...');
  const navCanva = page.locator('[data-testid="nav-canva"]');
  if (await navCanva.count() > 0) {
    await navCanva.click();
    console.log('   Clicked nav-canva');
    await page.waitForTimeout(5000);
  } else {
    console.log('   nav-canva not found');
    const texts = await page.locator('button').allTextContents();
    console.log('   Buttons:', texts.slice(0, 15));
  }
  
  await page.screenshot({ path: '/home/z/my-project/test-results/workspace-direct.png', fullPage: false });
  console.log('5. Screenshot saved.');
  
  const left = await page.locator('[data-testid="left-panel"]').boundingBox();
  const canvas = await page.locator('[data-testid="canvas-stage"]').boundingBox();
  const right = await page.locator('[data-testid="right-panel"]').boundingBox();
  const cmArea = await page.locator('#cm-canvas-area').boundingBox();
  const cmWrap = await page.locator('#cm-stage-wrap').boundingBox();
  
  console.log('\n=== BOUNDING BOX RESULTS ===');
  console.log('left-panel:', JSON.stringify(left));
  console.log('canvas-stage:', JSON.stringify(canvas));
  console.log('right-panel:', JSON.stringify(right));
  console.log('cm-canvas-area:', JSON.stringify(cmArea));
  console.log('cm-stage-wrap:', JSON.stringify(cmWrap));
  
  if (left && canvas) {
    console.log('Canvas overlaps left:', canvas.x < (left.x + left.width) ? 'YES' : 'NO');
    console.log('  left ends at:', left.x + left.width, 'canvas starts at:', canvas.x);
  }
  if (right && canvas) {
    console.log('Canvas overlaps right:', (canvas.x + canvas.width) > right.x ? 'YES' : 'NO');
    console.log('  canvas ends at:', canvas.x + canvas.width, 'right starts at:', right.x);
  }
  
  // CSS analysis
  const css = await page.evaluate(() => {
    const r = {};
    for (const [id, sel] of [['main-content', '#main-content'], ['cm-canvas-area', '#cm-canvas-area'], ['cm-stage-wrap', '#cm-stage-wrap']]) {
      const el = document.querySelector(sel);
      if (el) { const s = getComputedStyle(el); r[id] = { pos: s.position, w: s.width, z: s.zIndex, ov: s.overflow }; }
    }
    for (const [id, sel] of [['left-panel', '[data-testid="left-panel"]'], ['canvas-stage', '[data-testid="canvas-stage"]'], ['right-panel', '[data-testid="right-panel"]']]) {
      const el = document.querySelector(sel);
      if (el) { const s = getComputedStyle(el); r[id] = { pos: s.position, w: s.width, z: s.zIndex, ov: s.overflow }; }
    }
    return r;
  });
  console.log('\nCSS styles:', JSON.stringify(css, null, 2));
  
  await browser.close();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
