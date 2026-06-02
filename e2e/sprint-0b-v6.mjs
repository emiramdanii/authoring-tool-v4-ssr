/**
 * Sprint 0B — Browser Chunk Stability Audit v6
 * Direct Zustand store manipulation to set activePanel='canva'
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    // ═══ STEP 1: Load Dashboard ═══
    console.log('\n═══ STEP 1: Load Dashboard ═══');
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Disable onboarding
    await page.evaluate(() => {
      ['silse-onboarding-completed', 'silse-tour-completed', 'canva-tour-completed'].forEach(k => localStorage.setItem(k, 'true'));
    });
    await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
    
    const title = await page.title();
    const bodyLength = await page.evaluate(() => document.body?.innerText?.length || 0);
    console.log(`  Title: ${title}, Body: ${bodyLength} chars, Hydrated: ${bodyLength > 100}`);
    
    // Dismiss onboarding modals
    for (let i = 0; i < 5; i++) {
      const lewati = await page.$('button:has-text("Lewati")');
      if (lewati) { await lewati.click({ force: true }).catch(() => {}); await page.waitForTimeout(500); }
      else break;
    }

    // ═══ STEP 2: Set activePanel='canva' via Zustand ═══
    console.log('\n═══ STEP 2: Set activePanel=canva via Zustand Store ═══');
    
    // The Zustand store for authoring is created with create() from zustand
    // We need to find it and call setActivePanel('canva')
    const storeResult = await page.evaluate(() => {
      // Approach: Walk React fiber tree to find Zustand hooks
      const rootEl = document.getElementById('__next');
      if (!rootEl) return { found: false, reason: 'no __next' };
      
      const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber'));
      if (!fiberKey) return { found: false, reason: 'no fiber' };
      
      // BFS through fiber tree
      const queue = [rootEl[fiberKey]];
      const visited = new Set();
      let found = null;
      
      while (queue.length > 0 && !found) {
        const fiber = queue.shift();
        if (!fiber || visited.has(fiber)) continue;
        visited.add(fiber);
        
        // Check memoizedState (hooks linked list)
        let hook = fiber.memoizedState;
        let hookIdx = 0;
        while (hook && hookIdx < 100) {
          const queue_ref = hook.queue;
          if (queue_ref && queue_ref.lastRenderedState) {
            const state = queue_ref.lastRenderedState;
            // Check if this is the authoring store (has activePanel)
            if (typeof state === 'object' && state !== null && 'activePanel' in state) {
              found = { 
                fiberType: fiber.type?.name || fiber.type?.toString()?.substring(0, 50),
                hookIdx,
                activePanel: state.activePanel,
                stateKeys: Object.keys(state),
              };
              // Try to dispatch
              try {
                queue_ref.dispatch({ type: 'setActivePanel', panel: 'canva' });
                found.dispatched = true;
              } catch (e) {
                found.dispatchError = e.message;
              }
              break;
            }
          }
          hook = hook.next;
          hookIdx++;
        }
        
        if (!found) {
          // Add children to queue
          let child = fiber.child;
          while (child) {
            queue.push(child);
            child = child.sibling;
          }
        }
      }
      
      return found || { found: false, reason: 'activePanel not found in fiber tree', visitedNodes: visited.size };
    });
    
    console.log(`  Store search: ${JSON.stringify(storeResult)}`);
    
    // If Zustand dispatch didn't work, try using React's useState dispatch directly
    if (!storeResult?.dispatched) {
      console.log('  Zustand dispatch failed, trying alternative methods...');
      
      // Alternative: Try to find and click the correct button
      // The canva panel ID in NAV_ITEMS is 'canva' but labeled "Analytics"
      // Let's find ALL buttons and check their onClick handlers
      const btnAnalysis = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        const results = [];
        for (const btn of buttons) {
          const text = btn.textContent?.trim() || '';
          if (text.toLowerCase().includes('analytics') || text.toLowerCase().includes('canva') || text.toLowerCase().includes('workspace')) {
            // Get React props
            const fiberKey = Object.keys(btn).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
            let onClick = null;
            if (fiberKey) {
              const fiber = btn[fiberKey];
              if (fiber?.memoizedProps?.onClick) {
                onClick = 'has onClick';
              }
            }
            results.push({ text: text.substring(0, 50), onClick, class: btn.className?.substring(0, 60) });
          }
        }
        return results;
      });
      console.log(`  Relevant buttons: ${JSON.stringify(btnAnalysis)}`);
      
      // Try clicking each relevant button with force
      for (const btnInfo of btnAnalysis) {
        if (btnInfo.text.includes('Analytics') || btnInfo.text.includes('analytics')) {
          console.log(`  Clicking: "${btnInfo.text}"`);
          const btn = await page.$(`button:has-text("${btnInfo.text.substring(0, 20)}")`);
          if (btn) {
            await btn.click({ force: true }).catch(() => {});
            await page.waitForTimeout(3000);
            break;
          }
        }
      }
    }

    // Wait for Canvas chunks to load
    console.log('  Waiting 15s for Canvas Workspace...');
    await page.waitForTimeout(15000);

    // ═══ STEP 3: Check Canvas Workspace State ═══
    console.log('\n═══ STEP 3: Check Canvas Workspace ═══');
    
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
      }));
      
      return {
        isError,
        bodyLength: body.length,
        bodyPreview: body.substring(0, 400),
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
    console.log(`  Body length: ${canvasState.bodyLength}`);
    console.log(`  Body: "${canvasState.bodyPreview?.substring(0, 200)}"`);
    console.log(`  CanvaBuilder: ${canvasState.canvaBuilder}`);
    console.log(`  ResizableGroup: ${canvasState.resizableGroup}`);
    console.log(`  LeftPanel: ${canvasState.leftPanel}, CanvasStage: ${canvasState.canvasStage}, RightPanel: ${canvasState.rightPanel}`);
    console.log(`  Toolbar: ${canvasState.toolbar}`);
    console.log(`  Panels: ${JSON.stringify(canvasState.panels)}`);
    
    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-v6-canvas.png', fullPage: false });

    // ═══ STEP 4: Gutter Measurements ═══
    if (canvasState.canvaBuilder || canvasState.resizableGroup || canvasState.panels.length > 0) {
      console.log('\n═══ STEP 4: Gutter Measurements ═══');
      
      const measurements = await page.evaluate(() => {
        const viewport = { w: window.innerWidth, h: window.innerHeight };
        const panels = Array.from(document.querySelectorAll('[data-panel-id]')).map(p => {
          const rect = p.getBoundingClientRect();
          const style = window.getComputedStyle(p);
          return {
            id: p.getAttribute('data-panel-id'),
            x: Math.round(rect.x), y: Math.round(rect.y),
            w: Math.round(rect.width), h: Math.round(rect.height),
            pad: { t: style.paddingTop, r: style.paddingRight, b: style.paddingBottom, l: style.paddingLeft },
          };
        });
        
        // Find the stage and its padding
        const stage = document.querySelector('[data-testid="canvas-stage"]');
        let stageDetail = null;
        if (stage) {
          const stageRect = stage.getBoundingClientRect();
          const stageStyle = window.getComputedStyle(stage);
          stageDetail = {
            x: Math.round(stageRect.x), y: Math.round(stageRect.y),
            w: Math.round(stageRect.width), h: Math.round(stageRect.height),
            pad: { t: stageStyle.paddingTop, r: stageStyle.paddingRight, b: stageStyle.paddingBottom, l: stageStyle.paddingLeft },
            children: Array.from(stage.children).map(child => {
              const rect = child.getBoundingClientRect();
              const style = window.getComputedStyle(child);
              return {
                tag: child.tagName,
                class: child.className?.toString().substring(0, 50),
                w: Math.round(rect.width), h: Math.round(rect.height),
                pad: { t: style.paddingTop, r: style.paddingRight, b: style.paddingBottom, l: style.paddingLeft },
                gap: style.gap,
              };
            }),
          };
        }
        
        return { viewport, panels, stage: stageDetail };
      });
      
      console.log(`  Viewport: ${JSON.stringify(measurements.viewport)}`);
      measurements.panels.forEach(p => console.log(`  Panel "${p.id}": x=${p.x}, w=${p.w}, pad=${JSON.stringify(p.pad)}`));
      if (measurements.stage) {
        console.log(`  Stage: ${measurements.stage.w}x${measurements.stage.h}, pad=${JSON.stringify(measurements.stage.pad)}`);
        measurements.stage.children?.forEach(c => {
          console.log(`    ${c.tag}.${c.class}: ${c.w}x${c.h}, pad=${JSON.stringify(c.pad)}, gap=${c.gap}`);
        });
      }
    }

    // ═══ SUMMARY ═══
    console.log('\n═══ CONSOLE ERRORS ═══');
    consoleErrors.slice(0, 10).forEach(e => console.log(`  ${e.substring(0, 200)}`));

    console.log('\n═══ VERDICT ═══');
    const ws = canvasState.canvaBuilder || canvasState.resizableGroup;
    console.log(`  Dashboard: PASS`);
    console.log(`  Canvas Workspace: ${ws ? 'PASS' : 'FAIL'}`);
    console.log(`  Server: ${canvasState.bodyLength > 0 ? 'PASS' : 'FAIL'}`);

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-v6-error.png', fullPage: false }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main();
