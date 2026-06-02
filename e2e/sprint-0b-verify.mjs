/**
 * Sprint 0B — Verification Test: Does Canvas Workspace render after useMemo fix?
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  try {
    // Load Dashboard
    console.log('═══ Loading Dashboard ═══');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => {
      ['silse-onboarding-completed', 'silse-tour-completed', 'canva-tour-completed'].forEach(k => localStorage.setItem(k, 'true'));
    });
    await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
    
    // Dismiss onboarding
    for (let i = 0; i < 5; i++) {
      const lewati = await page.$('button:has-text("Lewati")');
      if (lewati) { await lewati.click({ force: true }).catch(() => {}); await page.waitForTimeout(300); }
      else break;
    }
    console.log('  Dashboard loaded');

    // Navigate to Canva via nav-canva button dispatch
    console.log('\n═══ Navigate to Canvas Workspace ═══');
    await page.evaluate(() => {
      const navBtn = document.querySelector('[data-testid="nav-canva"]');
      if (navBtn) {
        navBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      }
    });
    
    console.log('  Waiting 15s for Canvas chunks...');
    await page.waitForTimeout(15000);

    // Check Canvas Workspace
    console.log('\n═══ Canvas Workspace State ═══');
    const canvasState = await page.evaluate(() => {
      const body = document.body?.innerText || '';
      const isError = body.includes('Terjadi Kesalahan');
      
      const canvaBuilder = document.querySelector('[data-testid="canva-builder"]');
      const resizableGroup = document.querySelector('[data-panel-group-direction]');
      const leftPanel = document.querySelector('[data-testid="left-panel"]');
      const canvasStage = document.querySelector('[data-testid="canvas-stage"]');
      const rightPanel = document.querySelector('[data-testid="right-panel"]');
      const toolbar = document.querySelector('[data-testid="toolbar"]');
      const panels = Array.from(document.querySelectorAll('[data-panel-id]')).map(p => ({
        id: p.getAttribute('data-panel-id'),
        w: Math.round(p.getBoundingClientRect().width),
        h: Math.round(p.getBoundingClientRect().height),
      }));
      
      return {
        isError,
        bodyLength: body.length,
        bodyPreview: body.substring(0, 300),
        canvaBuilder: !!canvaBuilder,
        resizableGroup: !!resizableGroup,
        leftPanel: !!leftPanel,
        canvasStage: !!canvasStage,
        rightPanel: !!rightPanel,
        toolbar: !!toolbar,
        panels,
      };
    });
    
    console.log(`  Error: ${canvasState.isError}`);
    console.log(`  CanvaBuilder: ${canvasState.canvaBuilder}`);
    console.log(`  ResizableGroup: ${canvasState.resizableGroup}`);
    console.log(`  LeftPanel: ${canvasState.leftPanel}`);
    console.log(`  CanvasStage: ${canvasState.canvasStage}`);
    console.log(`  RightPanel: ${canvasState.rightPanel}`);
    console.log(`  Toolbar: ${canvasState.toolbar}`);
    console.log(`  Panels: ${JSON.stringify(canvasState.panels)}`);
    console.log(`  Body preview: "${canvasState.bodyPreview?.substring(0, 200)}"`);

    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-fix-verify.png', fullPage: false });

    // Gutter measurements if workspace loaded
    if (canvasState.canvaBuilder && canvasState.resizableGroup) {
      console.log('\n═══ GUTTER MEASUREMENTS ═══');
      
      const gutterData = await page.evaluate(() => {
        const viewport = { w: window.innerWidth, h: window.innerHeight };
        const panels = Array.from(document.querySelectorAll('[data-panel-id]')).map(p => {
          const rect = p.getBoundingClientRect();
          return { id: p.getAttribute('data-panel-id'), x: Math.round(rect.x), w: Math.round(rect.width), h: Math.round(rect.height) };
        });
        
        const stage = document.querySelector('[data-testid="canvas-stage"]');
        let stageInfo = null;
        if (stage) {
          const stageRect = stage.getBoundingClientRect();
          const stageStyle = window.getComputedStyle(stage);
          stageInfo = {
            x: Math.round(stageRect.x), y: Math.round(stageRect.y),
            w: Math.round(stageRect.width), h: Math.round(stageRect.height),
            pad: { t: stageStyle.paddingTop, r: stageStyle.paddingRight, b: stageStyle.paddingBottom, l: stageStyle.paddingLeft },
          };
          
          // Check stage children for gutter-causing padding
          const children = Array.from(stage.children);
          stageInfo.children = children.map(c => {
            const r = c.getBoundingClientRect();
            const s = window.getComputedStyle(c);
            return {
              tag: c.tagName,
              class: c.className?.toString().substring(0, 50),
              w: Math.round(r.width), h: Math.round(r.height),
              pad: { t: s.paddingTop, r: s.paddingRight, b: s.paddingBottom, l: s.paddingLeft },
              gap: s.gap,
            };
          });
        }
        
        return { viewport, panels, stage: stageInfo };
      });
      
      console.log(`  Viewport: ${JSON.stringify(gutterData.viewport)}`);
      gutterData.panels.forEach(p => console.log(`  Panel "${p.id}": x=${p.x}, w=${p.w}px, h=${p.h}px`));
      if (gutterData.stage) {
        console.log(`  Stage: ${gutterData.stage.w}x${gutterData.stage.h}, pad=${JSON.stringify(gutterData.stage.pad)}`);
        gutterData.stage.children?.forEach(c => {
          console.log(`    ${c.tag}.${c.class}: ${c.w}x${c.h}, pad=${JSON.stringify(c.pad)}, gap=${c.gap}`);
        });
      }
    }

    // Server alive check
    const serverAlive = await page.evaluate(async () => {
      try { const r = await fetch('/'); return r.ok; } catch { return false; }
    });

    console.log('\n═══ CONSOLE ERRORS ═══');
    consoleErrors.slice(0, 10).forEach(e => console.log(`  ${e.substring(0, 200)}`));

    console.log('\n═══ VERDICT ═══');
    const ws = canvasState.canvaBuilder && canvasState.resizableGroup;
    console.log(`  Dashboard: PASS`);
    console.log(`  Canvas Workspace: ${ws ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log(`  Server: ${serverAlive ? 'PASS' : 'FAIL'}`);
    console.log(`  Chunks: ${consoleErrors.some(e => e.includes('ChunkLoadError')) ? 'FAIL' : 'PASS'}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

main();
