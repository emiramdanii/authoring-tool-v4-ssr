/**
 * Sprint 0B — v9: Direct JavaScript activePanel manipulation
 * Skip UI clicks entirely, directly set the Zustand store
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
    // Load page
    console.log('Loading...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => {
      ['silse-onboarding-completed', 'silse-tour-completed', 'canva-tour-completed'].forEach(k => localStorage.setItem(k, 'true'));
    });
    await page.reload({ waitUntil: 'networkidle', timeout: 60000 });

    // Dismiss modals
    for (let i = 0; i < 5; i++) {
      const lewati = await page.$('button:has-text("Lewati")');
      if (lewati) { await lewati.click({ force: true }).catch(() => {}); await page.waitForTimeout(300); }
      else break;
    }

    // ═══ METHOD 1: Find and call the Zustand store directly ═══
    console.log('\n═══ METHOD 1: Zustand Store Access ═══');
    
    const storeAccess = await page.evaluate(() => {
      // The authoring store is created with create() from zustand
      // In dev mode, Zustand stores might be on window.__ZUSTAND_STORES__
      // Or we can find it via React fiber tree
      
      // Approach 1: Check window for exposed stores
      const windowKeys = Object.keys(window).filter(k => 
        k.includes('store') || k.includes('Store') || k.includes('zustand') || k.includes('Zustand')
      );
      
      // Approach 2: Find via React fiber tree
      const rootEl = document.getElementById('__next');
      if (!rootEl) return { error: 'no __next', windowKeys };
      
      const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber'));
      if (!fiberKey) return { error: 'no fiber key', windowKeys };
      
      // BFS through fiber tree to find store hooks
      const queue = [rootEl[fiberKey]];
      const visited = new Set();
      let storeFound = null;
      let nodesChecked = 0;
      
      while (queue.length > 0 && !storeFound && nodesChecked < 500) {
        const fiber = queue.shift();
        if (!fiber || visited.has(fiber)) continue;
        visited.add(fiber);
        nodesChecked++;
        
        // Check memoizedState (hooks linked list)
        let hook = fiber.memoizedState;
        let hookIdx = 0;
        while (hook && hookIdx < 80) {
          const q = hook.queue;
          if (q && q.lastRenderedState !== null && typeof q.lastRenderedState === 'object') {
            const state = q.lastRenderedState;
            // Look for authoring store (has activePanel)
            if ('activePanel' in state) {
              storeFound = {
                fiberType: fiber.type?.name || fiber.type?.displayName || String(fiber.type).substring(0, 50),
                hookIdx,
                activePanel: state.activePanel,
                keys: Object.keys(state).slice(0, 20),
              };
              
              // Try dispatching
              try {
                // The Zustand dispatch is the set function
                // hook.queue.dispatch expects an action object or updater function
                // For Zustand, the "dispatch" is actually the set function
                // We need to call it with a partial state update
                q.dispatch({ activePanel: 'canva' });
                storeFound.dispatchResult = 'called with {activePanel: "canva"}';
              } catch (e) {
                storeFound.dispatchError = e.message;
              }
              break;
            }
          }
          hook = hook.next;
          hookIdx++;
        }
        
        if (!storeFound) {
          // Add children
          let child = fiber.child;
          while (child) {
            queue.push(child);
            child = child.sibling;
          }
        }
      }
      
      return { windowKeys, storeFound, nodesChecked };
    });
    
    console.log(`  Window keys: ${JSON.stringify(storeAccess.windowKeys)}`);
    console.log(`  Store found: ${JSON.stringify(storeAccess.storeFound)}`);
    console.log(`  Nodes checked: ${storeAccess.nodesChecked}`);

    // Wait for React to re-render
    await page.waitForTimeout(5000);

    // Check what's on screen now
    const afterStoreCheck = await page.evaluate(() => {
      const body = document.body?.innerText || '';
      const canvaBuilder = document.querySelector('[data-testid="canva-builder"]');
      const resizableGroup = document.querySelector('[data-panel-group-direction]');
      const testIds = Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid'));
      const sidebar = document.querySelector('aside');
      return {
        bodyLength: body.length,
        bodyPreview: body.substring(0, 200),
        canvaBuilder: !!canvaBuilder,
        resizableGroup: !!resizableGroup,
        testIds,
        sidebarVisible: !!sidebar,
      };
    });
    
    console.log(`  After store dispatch: ${JSON.stringify(afterStoreCheck)}`);

    // ═══ METHOD 2: Use page.evaluate to set localStorage and reload ═══
    if (!afterStoreCheck.canvaBuilder) {
      console.log('\n═══ METHOD 2: Direct setActivePanel via exposed API ═══');
      
      // Try to expose the store via a script injection
      await page.evaluate(() => {
        // Find the Zustand store via a different method
        // Zustand stores use useSyncExternalStore under the hood
        // The store API object (getState, setState, subscribe) is captured in closure
        // But we can try to find it through React DevTools hook
        
        const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (hook) {
          console.log('React DevTools hook found');
          // The fiber tree can be accessed through the hook
        }
      });
      
      // Alternative: Inject a script that patches setActivePanel
      // Actually, let's try dispatching a custom event that the app listens to
      const eventResult = await page.evaluate(() => {
        // Try dispatching via the nav button's onClick handler directly
        const navBtn = document.querySelector('[data-testid="nav-canva"]');
        if (navBtn) {
          // Simulate a real click event
          const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
          navBtn.dispatchEvent(event);
          return { clicked: true };
        }
        return { clicked: false };
      });
      
      console.log(`  Nav button dispatch: ${JSON.stringify(eventResult)}`);
      await page.waitForTimeout(10000);
      
      // Check again
      const afterNavClick = await page.evaluate(() => {
        const body = document.body?.innerText || '';
        const canvaBuilder = document.querySelector('[data-testid="canva-builder"]');
        const resizableGroup = document.querySelector('[data-panel-group-direction]');
        const testIds = Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid'));
        return {
          bodyLength: body.length,
          bodyPreview: body.substring(0, 200),
          canvaBuilder: !!canvaBuilder,
          resizableGroup: !!resizableGroup,
          testIds,
        };
      });
      
      console.log(`  After nav click: ${JSON.stringify(afterNavClick)}`);
    }

    // ═══ METHOD 3: Check canva-store appMode ═══
    console.log('\n═══ METHOD 3: Check Canva Store appMode ═══');
    const canvaStoreState = await page.evaluate(() => {
      // Try to find the canva store (has appMode, pages, etc.)
      const rootEl = document.getElementById('__next');
      if (!rootEl) return { error: 'no __next' };
      
      const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber'));
      if (!fiberKey) return { error: 'no fiber' };
      
      const queue = [rootEl[fiberKey]];
      const visited = new Set();
      let found = null;
      
      while (queue.length > 0 && !found) {
        const fiber = queue.shift();
        if (!fiber || visited.has(fiber)) continue;
        visited.add(fiber);
        
        let hook = fiber.memoizedState;
        let idx = 0;
        while (hook && idx < 80) {
          const q = hook.queue;
          if (q && q.lastRenderedState !== null && typeof q.lastRenderedState === 'object') {
            const state = q.lastRenderedState;
            // Canva store has appMode and pages
            if ('appMode' in state && 'pages' in state) {
              found = {
                appMode: state.appMode,
                pagesCount: Array.isArray(state.pages) ? state.pages.length : 'not array',
                currentPageIndex: state.currentPageIndex,
                keys: Object.keys(state).slice(0, 15),
              };
              
              // Force set appMode to 'edit'
              try {
                q.dispatch({ appMode: 'edit' });
                found.setAppModeResult = 'dispatched {appMode: "edit"}';
              } catch (e) {
                found.setAppModeError = e.message;
              }
              break;
            }
          }
          hook = hook.next;
          idx++;
        }
        
        if (!found) {
          let child = fiber.child;
          while (child) {
            queue.push(child);
            child = child.sibling;
          }
        }
      }
      
      return found || { error: 'canva store not found' };
    });
    
    console.log(`  Canva store: ${JSON.stringify(canvaStoreState)}`);
    
    await page.waitForTimeout(5000);

    // Final check
    const finalState = await page.evaluate(() => {
      const body = document.body?.innerText || '';
      const canvaBuilder = document.querySelector('[data-testid="canva-builder"]');
      const resizableGroup = document.querySelector('[data-panel-group-direction]');
      const leftPanel = document.querySelector('[data-testid="left-panel"]');
      const canvasStage = document.querySelector('[data-testid="canvas-stage"]');
      const panels = Array.from(document.querySelectorAll('[data-panel-id]')).map(p => ({
        id: p.getAttribute('data-panel-id'),
        w: Math.round(p.getBoundingClientRect().width),
      }));
      return {
        bodyLength: body.length,
        bodyPreview: body.substring(0, 200),
        canvaBuilder: !!canvaBuilder,
        resizableGroup: !!resizableGroup,
        leftPanel: !!leftPanel,
        canvasStage: !!canvasStage,
        panels,
      };
    });
    
    console.log(`\n═══ FINAL STATE ═══`);
    console.log(`  Body: "${finalState.bodyPreview?.substring(0, 150)}"`);
    console.log(`  CanvaBuilder: ${finalState.canvaBuilder}`);
    console.log(`  ResizableGroup: ${finalState.resizableGroup}`);
    console.log(`  LeftPanel: ${finalState.leftPanel}, CanvasStage: ${finalState.canvasStage}`);
    console.log(`  Panels: ${JSON.stringify(finalState.panels)}`);
    
    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-v9-final.png', fullPage: false });

    console.log('\n═══ CONSOLE ERRORS ═══');
    consoleErrors.slice(0, 10).forEach(e => console.log(`  ${e.substring(0, 200)}`));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

main();
