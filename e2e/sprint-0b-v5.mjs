/**
 * Sprint 0B — Browser Chunk Stability Audit v5
 * KEY FIX: Click "Analytics" button (which maps to canva panel), NOT "Workspace"
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
  const networkErrors = [];
  const chunkRequests = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('requestfailed', request => {
    networkErrors.push({ url: request.url(), failure: request.failure()?.errorText });
  });
  page.on('response', response => {
    const url = response.url();
    if (url.includes('_next/static/chunks')) {
      chunkRequests.push({ url: url.split('/').pop(), status: response.status() });
    }
  });

  try {
    // ═══════════════════════════════════════════════════════
    // STEP 1: Load Dashboard
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ STEP 1: Load Dashboard ═══');
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Set localStorage to disable onboarding
    await page.evaluate(() => {
      const keys = ['silse-onboarding-completed', 'silse-tour-completed', 'canva-tour-completed', 'onboarding-completed', 'tour-completed'];
      keys.forEach(k => localStorage.setItem(k, 'true'));
    });
    
    // Reload with onboarding disabled
    await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
    
    const title = await page.title();
    const bodyLength = await page.evaluate(() => document.body?.innerText?.length || 0);
    console.log(`  Title: ${title}`);
    console.log(`  Body length: ${bodyLength}`);
    console.log(`  Hydrated: ${bodyLength > 100}`);
    
    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-v5-01-dashboard.png', fullPage: false });

    // Dismiss any remaining onboarding modals
    const modalExists = await page.evaluate(() => !!document.querySelector('.fixed.inset-0.z-50'));
    if (modalExists) {
      console.log('  Dismissing onboarding...');
      // Click Lewati buttons
      for (let i = 0; i < 5; i++) {
        const lewati = await page.$('button:has-text("Lewati")');
        if (lewati) {
          await lewati.click({ force: true }).catch(() => {});
          await page.waitForTimeout(500);
        } else break;
      }
    }

    // ═══════════════════════════════════════════════════════
    // STEP 2: Switch to Canva (Analytics button)
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ STEP 2: Switch to Canva via Analytics Button ═══');
    
    // Method A: Click the "Analytics" button in sidebar (which maps to 'canva' panel)
    const analyticsBtn = await page.$('button:has-text("Analytics")');
    if (analyticsBtn) {
      console.log('  Found "Analytics" button, clicking...');
      await analyticsBtn.click({ force: true, timeout: 5000 }).catch(e => console.log(`  Click error: ${e.message?.substring(0, 80)}`));
    } else {
      console.log('  "Analytics" button not found, trying direct store manipulation...');
    }

    // Method B: Directly set the Zustand store
    if (!analyticsBtn) {
      const storeResult = await page.evaluate(() => {
        // Find React fiber and dispatch state change
        const rootEl = document.getElementById('__next');
        if (!rootEl) return { found: false, reason: 'no __next' };
        
        const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber'));
        if (!fiberKey) return { found: false, reason: 'no fiber' };
        
        let fiber = rootEl[fiberKey];
        let depth = 0;
        
        while (fiber && depth < 100) {
          const hooks = fiber.memoizedState;
          let hook = hooks;
          let hookIdx = 0;
          while (hook && hookIdx < 50) {
            const state = hook.queue?.lastRenderedState;
            if (state && typeof state === 'object' && 'activePanel' in state) {
              console.log(`Found store at fiber[${depth}].hook[${hookIdx}], activePanel=${state.activePanel}`);
              try {
                hook.queue.dispatch({ type: 'setActivePanel', panel: 'canva' });
                return { found: true, dispatched: true, prevPanel: state.activePanel };
              } catch (e) {
                return { found: true, dispatched: false, error: e.message };
              }
            }
            // Check nested state (Zustand stores)
            if (state && typeof state === 'object') {
              for (const key of Object.keys(state)) {
                const nested = state[key];
                if (nested && typeof nested === 'object' && 'activePanel' in nested) {
                  console.log(`Found nested store at state.${key}.activePanel=${nested.activePanel}`);
                  // Try to find the slice
                  if (hook.queue?.dispatch) {
                    try {
                      hook.queue.dispatch({ type: 'setActivePanel', panel: 'canva' });
                      return { found: true, dispatched: true, via: 'nested', key, prevPanel: nested.activePanel };
                    } catch (e) {
                      return { found: true, dispatched: false, error: e.message };
                    }
                  }
                }
              }
            }
            hook = hook.next;
            hookIdx++;
          }
          fiber = fiber.child || fiber.sibling || fiber.return?.sibling;
          depth++;
        }
        return { found: false, reason: 'activePanel not found in fiber tree' };
      });
      console.log(`  Store search result: ${JSON.stringify(storeResult)}`);
    }

    // Method C: If store manipulation didn't work, try Zustand's built-in API
    // The store might be accessible via __ZUSTAND_DEVTOOLS__ or window
    await page.evaluate(() => {
      // Zustand stores are often accessible via window in dev mode
      if (typeof window !== 'undefined') {
        // Try accessing via React DevTools hook
        const devTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (devTools) {
          console.log('React DevTools available');
        }
      }
    });

    // Wait for Canvas Workspace chunks
    console.log('  Waiting 15s for Canvas Workspace to load...');
    await page.waitForTimeout(15000);

    // ═══════════════════════════════════════════════════════
    // STEP 3: Check Canvas Workspace State
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ STEP 3: Check Canvas Workspace ═══');
    
    const canvasState = await page.evaluate(() => {
      const body = document.body?.innerText || '';
      const isError = body.includes('Terjadi Kesalahan') || body.includes('Error');
      
      // Look for Canvas specific elements
      const canvaBuilder = document.querySelector('[data-testid="canva-builder"]');
      const resizableGroup = document.querySelector('[data-panel-group-direction]');
      const leftPanel = document.querySelector('[data-testid="left-panel"]');
      const canvasStage = document.querySelector('[data-testid="canvas-stage"]');
      const rightPanel = document.querySelector('[data-testid="right-panel"]');
      const toolbar = document.querySelector('[data-testid="toolbar"]');
      const allPanels = Array.from(document.querySelectorAll('[data-panel-id]')).map(p => ({
        id: p.getAttribute('data-panel-id'),
        width: Math.round(p.getBoundingClientRect().width),
      }));
      
      // Check for back button (appears when in canva mode)
      const backBtn = document.querySelector('button:has(> svg)'); // Back to Dashboard
      
      return {
        isError,
        bodyLength: body.length,
        bodyPreview: body.substring(0, 300),
        canvaBuilder: !!canvaBuilder,
        resizableGroup: resizableGroup ? { direction: resizableGroup.getAttribute('data-panel-group-direction') } : null,
        leftPanel: !!leftPanel,
        canvasStage: !!canvasStage,
        rightPanel: !!rightPanel,
        toolbar: !!toolbar,
        panels: allPanels,
        hasBackBtn: !!backBtn,
      };
    });
    
    console.log(`  Error: ${canvasState.isError}`);
    console.log(`  Body length: ${canvasState.bodyLength}`);
    console.log(`  Body preview: "${canvasState.bodyPreview?.substring(0, 150)}"`);
    console.log(`  CanvaBuilder: ${canvasState.canvaBuilder}`);
    console.log(`  ResizableGroup: ${JSON.stringify(canvasState.resizableGroup)}`);
    console.log(`  Left panel: ${canvasState.leftPanel}`);
    console.log(`  Canvas stage: ${canvasState.canvasStage}`);
    console.log(`  Right panel: ${canvasState.rightPanel}`);
    console.log(`  Toolbar: ${canvasState.toolbar}`);
    console.log(`  Panels: ${JSON.stringify(canvasState.panels)}`);
    
    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-v5-02-canvas.png', fullPage: false });

    // ═══════════════════════════════════════════════════════
    // STEP 4: Gutter Measurements (if workspace loaded)
    // ═══════════════════════════════════════════════════════
    if (canvasState.canvaBuilder || canvasState.resizableGroup) {
      console.log('\n═══ STEP 4: Gutter Measurements ═══');
      
      const gutterData = await page.evaluate(() => {
        const viewport = { w: window.innerWidth, h: window.innerHeight };
        const panels = Array.from(document.querySelectorAll('[data-panel-id]')).map(p => {
          const rect = p.getBoundingClientRect();
          return {
            id: p.getAttribute('data-panel-id'),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            w: Math.round(rect.width),
            h: Math.round(rect.height),
          };
        });
        
        // Find the stage element and its inner padding
        const stageEl = document.querySelector('[data-testid="canvas-stage"]');
        let stageInfo = null;
        if (stageEl) {
          const stageRect = stageEl.getBoundingClientRect();
          const stageStyle = window.getComputedStyle(stageEl);
          stageInfo = {
            x: Math.round(stageRect.x),
            y: Math.round(stageRect.y),
            w: Math.round(stageRect.width),
            h: Math.round(stageRect.height),
            padding: {
              top: stageStyle.paddingTop,
              right: stageStyle.paddingRight,
              bottom: stageStyle.paddingBottom,
              left: stageStyle.paddingLeft,
            },
          };
          
          // Check children of stage for large padding/margin
          const children = Array.from(stageEl.children);
          const childInfo = children.map(child => {
            const rect = child.getBoundingClientRect();
            const style = window.getComputedStyle(child);
            return {
              tag: child.tagName,
              class: child.className?.toString().substring(0, 60),
              w: Math.round(rect.width),
              h: Math.round(rect.height),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              padding: {
                top: style.paddingTop,
                right: style.paddingRight,
                bottom: style.paddingBottom,
                left: style.paddingLeft,
              },
              margin: {
                top: style.marginTop,
                right: style.marginRight,
                bottom: style.marginBottom,
                left: style.marginLeft,
              },
              gap: style.gap,
            };
          });
          stageInfo.children = childInfo;
          
          // Check grandchildren too for gutter-causing elements
          const grandChildren = [];
          for (const child of children) {
            for (const gc of Array.from(child.children).slice(0, 10)) {
              const rect = gc.getBoundingClientRect();
              const style = window.getComputedStyle(gc);
              const pl = parseInt(style.paddingLeft);
              const pr = parseInt(style.paddingRight);
              if (pl > 12 || pr > 12 || rect.width > 100) {
                grandChildren.push({
                  tag: gc.tagName,
                  class: gc.className?.toString().substring(0, 60),
                  w: Math.round(rect.width),
                  h: Math.round(rect.height),
                  padding: { left: style.paddingLeft, right: style.paddingRight, top: style.paddingTop, bottom: style.paddingBottom },
                  margin: { left: style.marginLeft, right: style.marginRight },
                  gap: style.gap,
                });
              }
            }
          }
          stageInfo.grandChildren = grandChildren;
        }
        
        return { viewport, panels, stage: stageInfo };
      });
      
      console.log(`  Viewport: ${JSON.stringify(gutterData.viewport)}`);
      console.log(`  Panels:`);
      gutterData.panels.forEach(p => console.log(`    ${p.id}: x=${p.x}, w=${p.w}px, h=${p.h}px`));
      console.log(`  Stage:`);
      if (gutterData.stage) {
        console.log(`    Position: x=${gutterData.stage.x}, y=${gutterData.stage.y}`);
        console.log(`    Size: ${gutterData.stage.w}x${gutterData.stage.h}`);
        console.log(`    Padding: ${JSON.stringify(gutterData.stage.padding)}`);
        console.log(`    Children:`);
        gutterData.stage.children?.forEach(c => {
          console.log(`      ${c.tag}.${c.class}: ${c.w}x${c.h}, pad=${JSON.stringify(c.padding)}, margin=${JSON.stringify(c.margin)}, gap=${c.gap}`);
        });
        console.log(`    GrandChildren (with significant padding):`);
        gutterData.stage.grandChildren?.forEach(c => {
          console.log(`      ${c.tag}.${c.class}: ${c.w}x${c.h}, pad=${JSON.stringify(c.padding)}, margin=${JSON.stringify(c.margin)}, gap=${c.gap}`);
        });
      }
    }

    // ═══════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ CHUNK FAILURES ═══');
    const fails = chunkRequests.filter(r => r.status !== 200 && r.status !== 304);
    if (fails.length === 0) console.log('  None — all chunks loaded');
    else fails.forEach(f => console.log(`  ${f.status} ${f.url}`));

    console.log('\n═══ CONSOLE ERRORS ═══');
    consoleErrors.forEach(e => console.log(`  ${e.substring(0, 200)}`));

    console.log('\n═══ NETWORK ERRORS ═══');
    networkErrors.forEach(e => console.log(`  ${e.url?.substring(0, 100)} → ${e.failure}`));

    const serverAlive = await page.evaluate(async () => {
      try { const r = await fetch('/'); return r.ok; } catch { return false; }
    });
    
    console.log('\n═══ VERDICT ═══');
    console.log(`  Dashboard: ${bodyLength > 100 ? 'PASS' : 'FAIL'}`);
    console.log(`  Canvas Workspace: ${canvasState.canvaBuilder ? 'PASS' : 'FAIL'}`);
    console.log(`  Chunks: ${fails.length === 0 ? 'ALL OK' : `${fails.length} FAILED`}`);
    console.log(`  Server: ${serverAlive ? 'PASS' : 'FAIL'}`);

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-v5-error.png', fullPage: false }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main();
