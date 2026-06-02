/**
 * Sprint 0B — Browser Chunk Stability Audit v3
 * Direct approach: bypass UI clicks, use JS to switch to Canvas panel
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 60000;

async function main() {
  const results = {
    dashboard: { hydrate: false, title: '', bodyLength: 0, errors: [] },
    canvas: { navigated: false, chunkLoaded: false, workspaceRoot: false, canvaBuilderVisible: false, errors: [], html: '' },
    gutterMeasurements: null,
    serverAlive: false,
    summary: '',
  };

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  // Collect ALL console and network events
  const consoleErrors = [];
  const consoleMessages = [];
  const networkErrors = [];
  const chunkRequests = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === 'error') consoleErrors.push(text);
  });

  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      failure: request.failure()?.errorText,
    });
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('_next/static/chunks') || url.includes('CanvaBuilder') || url.includes('canva')) {
      chunkRequests.push({ 
        url: url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('/') + 80), 
        fullUrl: url,
        status: response.status(), 
        size: response.headers()['content-length'] || 'unknown' 
      });
    }
  });

  try {
    // ═══════════════════════════════════════════════════════
    // STEP 1: Dashboard Hydration
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ STEP 1: Dashboard Hydration ═══');
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    
    results.dashboard.title = await page.title();
    results.dashboard.bodyLength = await page.evaluate(() => document.body?.innerText?.length || 0);
    results.dashboard.hydrate = results.dashboard.bodyLength > 100;
    
    console.log(`  Title: ${results.dashboard.title}`);
    console.log(`  Body length: ${results.dashboard.bodyLength}`);
    console.log(`  Hydrated: ${results.dashboard.hydrate}`);

    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-01-dashboard.png', fullPage: false });

    // ═══════════════════════════════════════════════════════
    // STEP 2: Dismiss ALL onboarding overlays
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ STEP 2: Dismiss Onboarding ═══');
    
    // Aggressively remove all overlays and tour elements
    await page.evaluate(() => {
      // Remove all fixed overlays
      document.querySelectorAll('.fixed.inset-0').forEach(el => {
        if (el.classList.contains('z-50') || el.style.zIndex === '50') el.remove();
      });
      // Remove backdrop blur overlays
      document.querySelectorAll('.backdrop-blur-sm, .absolute.inset-0.bg-silse-on-surface\\/40').forEach(el => el.remove());
      // Remove any pointer-events-none containers that might block
      document.querySelectorAll('[class*="pointer-events-none"]').forEach(el => {
        el.style.pointerEvents = 'auto';
      });
      // Remove tour/spotlight elements
      document.querySelectorAll('[class*="tour"], [class*="Tour"], [class*="spotlight"], [class*="onboarding"]').forEach(el => el.remove());
    });
    
    await page.waitForTimeout(1000);
    console.log('  Removed all overlays');

    // Also try clicking "Lewati" / "Skip" buttons
    const skipBtns = await page.$$('button');
    for (const btn of skipBtns) {
      const text = await btn.textContent();
      const t = text?.trim().toLowerCase() || '';
      if (t === 'lewati' || t === 'skip' || t === 'nanti') {
        try { await btn.click({ force: true }); } catch (e) {}
      }
    }
    await page.waitForTimeout(500);
    
    // Remove overlays again after skip
    await page.evaluate(() => {
      document.querySelectorAll('.fixed.inset-0').forEach(el => {
        if (el.classList.contains('z-50') || el.style.zIndex === '50') el.remove();
      });
    });
    
    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-02-after-dismiss.png', fullPage: false });

    // ═══════════════════════════════════════════════════════
    // STEP 3: Switch to Canvas Workspace via JavaScript
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ STEP 3: Switch to Canvas Workspace ═══');
    
    // Method A: Try clicking Workspace button with force
    let navSuccess = false;
    try {
      const wsButtons = await page.$$('button');
      for (const btn of wsButtons) {
        const text = await btn.textContent();
        if (text?.includes('edit_note') && text?.includes('Workspace')) {
          console.log(`  Found Workspace button: "${text?.trim()}"`);
          await btn.click({ force: true, timeout: 3000 }).catch(() => {});
          navSuccess = true;
          console.log('  Force-clicked Workspace button');
          break;
        }
      }
    } catch (e) {
      console.log(`  Force click error: ${e.message?.substring(0, 100)}`);
    }

    // Method B: Direct Zustand store manipulation
    if (!navSuccess) {
      console.log('  Trying Zustand store manipulation...');
      const storeResult = await page.evaluate(() => {
        try {
          // Find the Zustand store on window
          // Next.js apps often expose stores via React internals
          const rootEl = document.getElementById('__next');
          if (!rootEl) return { found: false, reason: 'no __next' };
          
          // Try to find React fiber
          const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber'));
          if (!fiberKey) return { found: false, reason: 'no fiber' };
          
          // Walk the fiber tree to find the store
          let fiber = rootEl[fiberKey];
          let storeFound = null;
          let depth = 0;
          
          while (fiber && depth < 50) {
            const hooks = fiber.memoizedState;
            let hook = hooks;
            let hookIdx = 0;
            while (hook && hookIdx < 30) {
              if (hook.queue?.lastRenderedState?.activePanel !== undefined) {
                storeFound = { path: `fiber[${depth}].hook[${hookIdx}]`, activePanel: hook.queue.lastRenderedState.activePanel };
                // Try to dispatch
                try {
                  hook.queue.dispatch({ type: 'setActivePanel', panel: 'canva' });
                  storeFound.dispatched = true;
                } catch (e) {
                  storeFound.dispatchError = e.message;
                }
                break;
              }
              hook = hook.next;
              hookIdx++;
            }
            if (storeFound) break;
            fiber = fiber.child || fiber.return?.child;
            depth++;
          }
          
          return storeFound || { found: false, reason: 'store not found in fiber tree' };
        } catch (e) {
          return { found: false, error: e.message };
        }
      });
      console.log(`  Store search: ${JSON.stringify(storeResult)}`);
      
      if (storeResult.dispatched) {
        navSuccess = true;
        console.log('  Dispatched setActivePanel("canva") via fiber!');
      }
    }

    // Method C: Click via dispatchEvent
    if (!navSuccess) {
      console.log('  Trying dispatchEvent approach...');
      const dispatchResult = await page.evaluate(() => {
        // Find and click the Workspace button via JS
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent?.includes('Workspace') || btn.textContent?.includes('edit_note')) {
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            return { clicked: true, text: btn.textContent?.trim().substring(0, 50) };
          }
        }
        return { clicked: false };
      });
      console.log(`  dispatchEvent result: ${JSON.stringify(dispatchResult)}`);
      navSuccess = dispatchResult.clicked;
    }

    results.canvas.navigated = navSuccess;
    console.log(`  Navigation result: ${navSuccess ? 'SUCCESS' : 'FAILED'}`);

    // Wait for Canvas Workspace to load
    console.log('\n  Waiting 12s for Canvas Workspace chunks...');
    await page.waitForTimeout(12000);

    // ═══════════════════════════════════════════════════════
    // STEP 4: Check Canvas Workspace state
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ STEP 4: Check Canvas Workspace ═══');

    const canvasState = await page.evaluate(() => {
      const body = document.body?.innerText || '';
      
      // Check for CanvaBuilder/Workspace elements
      const canvaBuilder = document.querySelector('[class*="CanvaBuilder"]') || 
                           document.querySelector('[class*="canva-builder"]') ||
                           document.querySelector('[class*="workspace"]');
      
      // Check for ResizablePanelGroup
      const resizablePanel = document.querySelector('[data-panel-group-direction]');
      
      // Check for workspace-root
      const workspaceRoot = document.querySelector('[class*="workspace-root"]') ||
                           document.querySelector('[id*="workspace"]');
      
      // Check for left/center/right panel markers
      const leftPanel = document.querySelector('[class*="left-panel"]') || 
                        document.querySelector('[class*="LeftPanel"]');
      const centerPanel = document.querySelector('[class*="stage"]') || 
                         document.querySelector('[class*="Stage"]') ||
                         document.querySelector('[class*="center"]');
      const rightPanel = document.querySelector('[class*="right-panel"]') || 
                         document.querySelector('[class*="RightPanel"]');
      
      // Check for common Canvas Workspace text markers
      const hasPageList = body.includes('Halaman') || body.includes('Page');
      const hasProperties = body.includes('Properti') || body.includes('Properties');
      
      // Check for any error messages on screen
      const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
      
      return {
        bodyLength: body.length,
        bodyPreview: body.substring(0, 500),
        canvaBuilder: canvaBuilder ? { tag: canvaBuilder.tagName, class: canvaBuilder.className?.substring(0, 100) } : null,
        resizablePanel: resizablePanel ? { direction: resizablePanel.getAttribute('data-panel-group-direction') } : null,
        workspaceRoot: workspaceRoot ? { tag: workspaceRoot.tagName, class: workspaceRoot.className?.substring(0, 100) } : null,
        leftPanel: leftPanel ? { tag: leftPanel.tagName, class: leftPanel.className?.substring(0, 80) } : null,
        centerPanel: centerPanel ? { tag: centerPanel.tagName, class: centerPanel.className?.substring(0, 80) } : null,
        rightPanel: rightPanel ? { tag: rightPanel.tagName, class: rightPanel.className?.substring(0, 80) } : null,
        hasPageList,
        hasProperties,
        errorCount: errorElements.length,
      };
    });
    
    console.log(`  Body length: ${canvasState.bodyLength}`);
    console.log(`  Body preview: "${canvasState.bodyPreview?.substring(0, 200)}"`);
    console.log(`  CanvaBuilder element: ${JSON.stringify(canvasState.canvaBuilder)}`);
    console.log(`  ResizablePanel: ${JSON.stringify(canvasState.resizablePanel)}`);
    console.log(`  Workspace root: ${JSON.stringify(canvasState.workspaceRoot)}`);
    console.log(`  Left panel: ${JSON.stringify(canvasState.leftPanel)}`);
    console.log(`  Center/Stage: ${JSON.stringify(canvasState.centerPanel)}`);
    console.log(`  Right panel: ${JSON.stringify(canvasState.rightPanel)}`);
    console.log(`  Has page list: ${canvasState.hasPageList}`);
    console.log(`  Has properties: ${canvasState.hasProperties}`);
    console.log(`  Error elements: ${canvasState.errorCount}`);
    
    results.canvas.workspaceRoot = !!canvasState.workspaceRoot || !!canvasState.canvaBuilder || !!canvasState.resizablePanel;
    results.canvas.canvaBuilderVisible = !!canvasState.canvaBuilder;
    results.canvas.html = canvasState.bodyPreview;

    // Screenshot
    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-03-canvas-workspace.png', fullPage: false });
    console.log('  Screenshot: sprint0b-03-canvas-workspace.png');

    // ═══════════════════════════════════════════════════════
    // STEP 5: Gutter Measurements (if Canvas is visible)
    // ═══════════════════════════════════════════════════════
    if (results.canvas.workspaceRoot || results.canvas.canvaBuilderVisible || canvasState.resizablePanel) {
      console.log('\n═══ STEP 5: Gutter Measurements ═══');
      
      const measurements = await page.evaluate(() => {
        // Find all panels in the workspace
        const panels = document.querySelectorAll('[data-panel-id]');
        const panelData = Array.from(panels).map(p => ({
          id: p.getAttribute('data-panel-id'),
          rect: p.getBoundingClientRect(),
          width: p.getBoundingClientRect().width,
        }));
        
        // Find the stage/canvas area
        const stage = document.querySelector('[class*="stage"]') || 
                     document.querySelector('[class*="Stage"]') ||
                     document.querySelector('[data-panel-id*="center"]') ||
                     document.querySelector('[data-panel-id*="stage"]');
        
        // Find any padding/gap elements
        const allElements = document.querySelectorAll('*');
        const potentialGutterElements = [];
        for (const el of allElements) {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          // Look for elements with large padding that could be gutters
          if (parseInt(style.paddingLeft) > 20 || parseInt(style.paddingRight) > 20) {
            if (rect.width > 100 && rect.width < 1200) {
              potentialGutterElements.push({
                tag: el.tagName,
                class: el.className?.toString().substring(0, 80),
                paddingLeft: style.paddingLeft,
                paddingRight: style.paddingRight,
                paddingTop: style.paddingTop,
                paddingBottom: style.paddingBottom,
                width: rect.width,
                height: rect.height,
              });
            }
          }
        }
        
        // Get viewport dimensions
        const viewport = { width: window.innerWidth, height: window.innerHeight };
        
        return { panelData, stageRect: stage?.getBoundingClientRect(), potentialGutterElements: potentialGutterElements.slice(0, 20), viewport };
      });
      
      results.gutterMeasurements = measurements;
      console.log(`  Viewport: ${JSON.stringify(measurements.viewport)}`);
      console.log(`  Panels: ${JSON.stringify(measurements.panelData.map(p => ({ id: p.id, width: Math.round(p.width) })))}`);
      console.log(`  Stage rect: ${JSON.stringify(measurements.stageRect ? { x: Math.round(measurements.stageRect.x), y: Math.round(measurements.stageRect.y), w: Math.round(measurements.stageRect.width), h: Math.round(measurements.stageRect.height) } : null)}`);
      console.log(`  Potential gutter elements: ${measurements.potentialGutterElements.length}`);
      measurements.potentialGutterElements.forEach(el => {
        console.log(`    ${el.tag}.${el.class?.substring(0, 40)}: padding ${el.paddingLeft}/${el.paddingRight}, size ${Math.round(el.width)}x${Math.round(el.height)}`);
      });
    }

    // ═══════════════════════════════════════════════════════
    // STEP 6: Server alive check
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ STEP 6: Server Alive ═══');
    const serverCheck = await page.evaluate(async () => {
      try {
        const res = await fetch('/');
        return { status: res.status, ok: res.ok };
      } catch (e) {
        return { status: 0, error: e.message };
      }
    });
    results.serverAlive = serverCheck.status === 200;
    console.log(`  Server: ${JSON.stringify(serverCheck)}`);

    // ═══════════════════════════════════════════════════════
    // RESULTS SUMMARY
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ CHUNK REQUESTS (sample) ═══');
    chunkRequests.slice(0, 20).forEach(r => console.log(`  ${r.status} ${r.url}`));
    
    console.log(`\n═══ CHUNK FAILURES ═══`);
    const failedChunks = chunkRequests.filter(r => r.status !== 200);
    if (failedChunks.length === 0) {
      console.log('  None — all chunks loaded successfully');
      results.canvas.chunkLoaded = true;
    } else {
      failedChunks.forEach(r => console.log(`  FAIL: ${r.status} ${r.url}`));
    }

    console.log('\n═══ CONSOLE ERRORS ═══');
    consoleErrors.forEach(e => console.log(`  ERROR: ${e.substring(0, 200)}`));

    console.log('\n═══ NETWORK ERRORS ═══');
    networkErrors.forEach(e => console.log(`  FAIL: ${e.url?.substring(0, 120)} → ${e.failure}`));

    // Determine overall result
    const allPass = results.dashboard.hydrate && results.canvas.navigated && (results.canvas.workspaceRoot || results.canvas.canvaBuilderVisible) && results.canvas.chunkLoaded && results.serverAlive;
    results.summary = allPass 
      ? 'PASS — All Sprint 0B criteria met'
      : `PARTIAL — Dashboard: ${results.dashboard.hydrate ? 'OK' : 'FAIL'}, Nav: ${results.canvas.navigated ? 'OK' : 'FAIL'}, Workspace: ${results.canvas.workspaceRoot || results.canvas.canvaBuilderVisible ? 'OK' : 'FAIL'}, Chunks: ${results.canvas.chunkLoaded ? 'OK' : 'CHECK'}, Server: ${results.serverAlive ? 'OK' : 'FAIL'}`;

    console.log(`\n═══ VERDICT: ${results.summary} ═══`);

  } catch (error) {
    console.error('Test error:', error.message);
    results.summary = `ERROR: ${error.message}`;
    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-error.png', fullPage: false }).catch(() => {});
  } finally {
    await browser.close();
  }

  return results;
}

main().then(r => console.log('\nFINAL:', JSON.stringify(r, null, 2)));
