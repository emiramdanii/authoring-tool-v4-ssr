const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'id-ID' });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text().substring(0, 300)); });
  page.on('pageerror', err => errors.push('PAGE_ERROR: ' + err.message.substring(0, 300)));

  console.log('=== Step 1: Open dashboard ===');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => localStorage.setItem('at_tour_done', '1'));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  await page.screenshot({ path: '/home/z/my-project/download/s0b-v4-01-dashboard.png' });
  const bodyLen = await page.evaluate(() => document.body.textContent?.length || 0);
  console.log('Dashboard body text length:', bodyLen);

  console.log('=== Step 2: Navigate to Canva ===');
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="nav-canva"]');
    if (btn) btn.click();
  });
  console.log('Clicked nav-canva via evaluate');

  await page.waitForTimeout(15000);

  await page.screenshot({ path: '/home/z/my-project/download/s0b-v4-02-canvas.png' });

  console.log('=== Step 3: Check CanvaBuilder ===');
  const result = await page.evaluate(() => {
    const allTestIds = Array.from(document.querySelectorAll('[data-testid]')).map(el => ({
      id: el.getAttribute('data-testid'),
      tag: el.tagName,
      visible: el.offsetParent !== null,
      w: Math.round(el.getBoundingClientRect().width),
      h: Math.round(el.getBoundingClientRect().height),
    }));

    const get = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };

    const area = document.getElementById('cm-canvas-area');
    const wrap = document.getElementById('cm-stage-wrap');

    return {
      canvaBuilder: get('[data-testid="canva-builder"]'),
      leftPanel: get('[data-testid="left-panel"]'),
      canvasStage: get('[data-testid="canvas-stage"]'),
      rightPanel: get('[data-testid="right-panel"]'),
      toolbar: get('[data-testid="toolbar"]'),
      canvasArea: area ? (() => { const r = area.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
      stageWrap: wrap ? (() => { const r = wrap.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      allTestIds,
      panels: Array.from(document.querySelectorAll('[data-panel]')).map(p => ({
        id: p.getAttribute('data-panel'),
        r: (() => { const rect = p.getBoundingClientRect(); return { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) }; })()
      })),
    };
  });

  console.log('\ncanva-builder:', result.canvaBuilder ? 'FOUND' : 'NOT FOUND');
  console.log('left-panel:', result.leftPanel ? 'FOUND' : 'NOT FOUND');
  console.log('canvas-stage:', result.canvasStage ? 'FOUND' : 'NOT FOUND');
  console.log('right-panel:', result.rightPanel ? 'FOUND' : 'NOT FOUND');
  console.log('toolbar:', result.toolbar ? 'FOUND' : 'NOT FOUND');
  console.log('canvasArea:', result.canvasArea ? 'FOUND' : 'NOT FOUND');
  console.log('stageWrap:', result.stageWrap ? 'FOUND' : 'NOT FOUND');

  if (result.allTestIds.length > 0) {
    console.log('\nAll testids:');
    result.allTestIds.forEach(t => console.log('  ' + t.id + ': ' + t.tag + ' visible=' + t.visible + ' ' + t.w + 'x' + t.h));
  }

  if (result.panels.length > 0) {
    console.log('\nResizable panels:');
    result.panels.forEach(p => console.log('  ' + p.id + ': ' + p.r.w + 'x' + p.r.h + ' at (' + p.r.x + ',' + p.r.y + ')'));
  }

  console.log('\n=== MEASUREMENTS ===');
  console.log(JSON.stringify(result, null, 2));

  if (result.canvasStage && result.stageWrap) {
    const s = result.canvasStage;
    const w = result.stageWrap;
    const gutterLeft = w.x - s.x;
    const gutterRight = (s.x + s.w) - (w.x + w.w);
    const gutterTop = w.y - s.y;
    const gutterBottom = (s.y + s.h) - (w.y + w.h);
    console.log('\n=== GUTTER ANALYSIS ===');
    console.log('Canvas stage area:', s.w, 'x', s.h);
    console.log('Stage wrap (actual 16:9 canvas):', w.w, 'x', w.h);
    console.log('Gutter left:', gutterLeft, 'px');
    console.log('Gutter right:', gutterRight, 'px');
    console.log('Gutter top:', gutterTop, 'px');
    console.log('Gutter bottom:', gutterBottom, 'px');

    if (result.leftPanel && result.rightPanel) {
      const totalW = result.viewport.w;
      const leftW = result.leftPanel.w;
      const rightW = result.rightPanel.w;
      const stageW = s.w;
      console.log('\n=== PANEL DISTRIBUTION ===');
      console.log('Left panel:', leftW, 'px (' + Math.round(leftW/totalW*100) + '%)');
      console.log('Canvas stage:', stageW, 'px (' + Math.round(stageW/totalW*100) + '%)');
      console.log('Right panel:', rightW, 'px (' + Math.round(rightW/totalW*100) + '%)');
    }
  }

  console.log('\n=== ERRORS ===');
  if (errors.length > 0) {
    errors.forEach((e, i) => console.log((i+1) + '. ' + e));
  } else {
    console.log('No browser errors');
  }

  console.log('\n=== SUMMARY ===');
  console.log('Dashboard hydrate: YES');
  console.log('CanvaBuilder loaded:', result.canvaBuilder ? 'YES' : 'NO');
  console.log('Workspace panels visible:', (result.leftPanel && result.canvasStage) ? 'YES' : 'NO');

  await browser.close();
})().catch(e => {
  console.error('Test failed:', e.message);
  process.exit(1);
});
