/**
 * Sprint 0B — Browser Chunk Stability Audit v4
 * Correct approach: Dismiss onboarding properly, then navigate to Canvas
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

  const results = {};

  try {
    // ═══════════════════════════════════════════════════════
    // STEP 1: Load Dashboard (disable onboarding first)
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ STEP 1: Load Dashboard with Onboarding Disabled ═══');
    
    // First, set localStorage to skip onboarding
    await page.goto(BASE_URL, { waitUntil: 'commit', timeout: 30000 });
    
    // Disable onboarding tour via localStorage
    await page.evaluate(() => {
      localStorage.setItem('silse-onboarding-completed', 'true');
      localStorage.setItem('silse-tour-completed', 'true');
      localStorage.setItem('canva-tour-completed', 'true');
      localStorage.setItem('onboarding-completed', 'true');
      localStorage.setItem('tour-completed', 'true');
      // Try all possible keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('tour') || key?.includes('onboard') || key?.includes('guide')) {
          localStorage.setItem(key, 'true');
        }
      }
    });
    
    // Now reload with onboarding disabled
    await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
    
    const title = await page.title();
    const bodyLength = await page.evaluate(() => document.body?.innerText?.length || 0);
    console.log(`  Title: ${title}`);
    console.log(`  Body length: ${bodyLength}`);
    results.dashboard = { title, bodyLength, hydrated: bodyLength > 100 };

    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-v4-01-dashboard.png', fullPage: false });

    // Check if onboarding modal is still visible
    const modalVisible = await page.evaluate(() => !!document.querySelector('.fixed.inset-0.z-50'));
    console.log(`  Onboarding modal visible: ${modalVisible}`);

    // If still visible, click "Lewati" properly
    if (modalVisible) {
      console.log('  Clicking "Lewati" to dismiss onboarding...');
      const skipBtn = await page.$('button:has-text("Lewati")');
      if (skipBtn) {
        await skipBtn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(1500);
        
        // Check for more onboarding steps
        let moreSteps = true;
        let stepCount = 0;
        while (moreSteps && stepCount < 5) {
          const stillModal = await page.evaluate(() => !!document.querySelector('.fixed.inset-0.z-50'));
          if (stillModal) {
            const lewati = await page.$('button:has-text("Lewati")');
            if (lewati) {
              await lewati.click({ force: true }).catch(() => {});
              await page.waitForTimeout(1000);
              stepCount++;
            } else {
              // Try clicking "Skip" or pressing Escape
              await page.keyboard.press('Escape');
              await page.waitForTimeout(1000);
              stepCount++;
            }
          } else {
            moreSteps = false;
          }
        }
        console.log(`  Dismissed ${stepCount} onboarding steps`);
      }
    }

    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-v4-02-after-onboarding.png', fullPage: false });

    // ═══════════════════════════════════════════════════════
    // STEP 2: Navigate to Canvas Workspace
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ STEP 2: Navigate to Canvas Workspace ═══');
    
    // Click Workspace button with force
    const wsBtn = await page.$('button:has-text("Workspace")');
    if (wsBtn) {
      await wsBtn.click({ force: true, timeout: 5000 }).catch(e => console.log(`  Click error: ${e.message?.substring(0, 80)}`));
      console.log('  Clicked Workspace button');
    } else {
      console.log('  Workspace button not found!');
    }

    // Wait for Canvas Workspace to load
    console.log('  Waiting 15s for Canvas chunks...');
    await page.waitForTimeout(15000);

    // ═══════════════════════════════════════════════════════
    // STEP 3: Check Canvas Workspace State
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ STEP 3: Check Canvas Workspace ═══');
    
    const canvasState = await page.evaluate(() => {
      const body = document.body?.innerText || '';
      
      // Check for error state
      const isError = body.includes('Terjadi Kesalahan') || body.includes('Error');
      
      // Look for Canvas/Workspace specific elements
      const resizableGroup = document.querySelector('[data-panel-group-direction]');
      const canvaBuilder = document.querySelector('[class*="CanvaBuilder"]');
      const stage = document.querySelector('[class*="stage"]') || document.querySelector('[class*="Stage"]');
      const leftPanel = document.querySelector('[data-panel-id]');
      const allPanels = Array.from(document.querySelectorAll('[data-panel-id]')).map(p => ({
        id: p.getAttribute('data-panel-id'),
        width: Math.round(p.getBoundingClientRect().width),
      }));
      
      // Get body text for analysis
      return {
        isError,
        bodyText: body.substring(0, 300),
        bodyLength: body.length,
        resizableGroup: resizableGroup ? { direction: resizableGroup.getAttribute('data-panel-group-direction') } : null,
        canvaBuilder: !!canvaBuilder,
        stage: stage ? { class: stage.className?.substring(0, 100), w: Math.round(stage.getBoundingClientRect().width), h: Math.round(stage.getBoundingClientRect().height) } : null,
        panels: allPanels,
      };
    });
    
    console.log(`  Error state: ${canvasState.isError}`);
    console.log(`  Body text: "${canvasState.bodyText?.substring(0, 200)}"`);
    console.log(`  ResizablePanel: ${JSON.stringify(canvasState.resizableGroup)}`);
    console.log(`  CanvaBuilder: ${canvasState.canvaBuilder}`);
    console.log(`  Stage: ${JSON.stringify(canvasState.stage)}`);
    console.log(`  Panels: ${JSON.stringify(canvasState.panels)}`);
    
    results.canvas = canvasState;
    
    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-v4-03-canvas.png', fullPage: false });

    // ═══════════════════════════════════════════════════════
    // STEP 4: If error, try "Coba Lagi" button
    // ═══════════════════════════════════════════════════════
    if (canvasState.isError) {
      console.log('\n═══ STEP 4: Retry after error ═══');
      
      const cobaLagi = await page.$('button:has-text("Coba Lagi")');
      if (cobaLagi) {
        await cobaLagi.click({ force: true });
        console.log('  Clicked "Coba Lagi"');
        await page.waitForTimeout(10000);
        
        const retryState = await page.evaluate(() => {
          const body = document.body?.innerText || '';
          const isError = body.includes('Terjadi Kesalahan');
          const resizableGroup = document.querySelector('[data-panel-group-direction]');
          const allPanels = Array.from(document.querySelectorAll('[data-panel-id]')).map(p => ({
            id: p.getAttribute('data-panel-id'),
            width: Math.round(p.getBoundingClientRect().width),
          }));
          return { isError, bodyText: body.substring(0, 300), bodyLength: body.length, resizableGroup: !!resizableGroup, panels: allPanels };
        });
        
        console.log(`  Retry - Error: ${retryState.isError}`);
        console.log(`  Retry - Body: "${retryState.bodyText?.substring(0, 200)}"`);
        console.log(`  Retry - ResizableGroup: ${retryState.resizableGroup}`);
        console.log(`  Retry - Panels: ${JSON.stringify(retryState.panels)}`);
        
        results.canvasRetry = retryState;
        await page.screenshot({ path: '/home/z/my-project/download/sprint0b-v4-04-retry.png', fullPage: false });
      }
    }

    // ═══════════════════════════════════════════════════════
    // STEP 5: Gutter measurements (if workspace loaded)
    // ═══════════════════════════════════════════════════════
    const hasWorkspace = canvasState.resizableGroup || canvasState.canvaBuilder || (canvasState.panels && canvasState.panels.length > 0);
    
    if (hasWorkspace) {
      console.log('\n═══ STEP 5: Gutter Measurements ═══');
      
      const gutterData = await page.evaluate(() => {
        const panels = Array.from(document.querySelectorAll('[data-panel-id]'));
        const stageEl = document.querySelector('[class*="stage"]') || document.querySelector('[class*="Stage"]');
        
        // Measure gutters by looking at padding/gaps between panels
        const measurements = panels.map(p => {
          const rect = p.getBoundingClientRect();
          const style = window.getComputedStyle(p);
          return {
            id: p.getAttribute('data-panel-id'),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            paddingLeft: style.paddingLeft,
            paddingRight: style.paddingRight,
            paddingTop: style.paddingTop,
            gap: style.gap,
          };
        });
        
        // Find elements with large padding inside the stage
        const stageChildren = stageEl ? Array.from(stageEl.querySelectorAll('*')).slice(0, 30).map(el => {
          const style = window.getComputedStyle(el);
          const pl = parseInt(style.paddingLeft);
          const pr = parseInt(style.paddingRight);
          if (pl > 16 || pr > 16) {
            return {
              tag: el.tagName,
              class: el.className?.toString().substring(0, 60),
              paddingLeft: style.paddingLeft,
              paddingRight: style.paddingRight,
              width: Math.round(el.getBoundingClientRect().width),
            };
          }
          return null;
        }).filter(Boolean) : [];
        
        return { panels: measurements, stageChildren, viewport: { w: window.innerWidth, h: window.innerHeight } };
      });
      
      console.log(`  Viewport: ${JSON.stringify(gutterData.viewport)}`);
      gutterData.panels.forEach(p => console.log(`  Panel ${p.id}: x=${p.x}, w=${p.width}, padding=${p.paddingLeft}/${p.paddingRight}`));
      console.log(`  Stage children with large padding:`);
      gutterData.stageChildren.forEach(c => console.log(`    ${c.tag}.${c.class}: pad=${c.paddingLeft}/${c.paddingRight}, w=${c.width}`));
      
      results.gutter = gutterData;
    }

    // ═══════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ CHUNK FAILURES ═══');
    const fails = chunkRequests.filter(r => r.status !== 200);
    if (fails.length === 0) console.log('  None');
    else fails.forEach(f => console.log(`  ${f.status} ${f.url}`));

    console.log('\n═══ CONSOLE ERRORS ═══');
    consoleErrors.forEach(e => console.log(`  ${e.substring(0, 200)}`));

    console.log('\n═══ NETWORK ERRORS ═══');
    networkErrors.forEach(e => console.log(`  ${e.url?.substring(0, 100)} → ${e.failure}`));

    // Server alive check
    const serverAlive = await page.evaluate(async () => {
      try { const r = await fetch('/'); return r.ok; } catch { return false; }
    });
    
    console.log(`\n═══ VERDICT ═══`);
    console.log(`  Dashboard: ${results.dashboard?.hydrated ? 'OK' : 'FAIL'}`);
    console.log(`  Canvas loaded: ${hasWorkspace ? 'OK' : 'FAIL'}`);
    console.log(`  Chunks: ${fails.length === 0 ? 'ALL OK' : `${fails.length} FAILED`}`);
    console.log(`  Server: ${serverAlive ? 'OK' : 'FAIL'}`);

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-v4-error.png', fullPage: false }).catch(() => {});
  } finally {
    await browser.close();
  }

  return results;
}

main().then(r => console.log('\nFINAL:', JSON.stringify(r, null, 2)));
