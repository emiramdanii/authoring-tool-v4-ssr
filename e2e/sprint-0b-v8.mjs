/**
 * Sprint 0B — Browser Chunk Stability Audit v8
 * Ultra-deep DOM inspection after clicking Analytics
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
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'log') consoleLogs.push(msg.text());
  });

  try {
    // Load
    console.log('Loading Dashboard...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => {
      ['silse-onboarding-completed', 'silse-tour-completed', 'canva-tour-completed'].forEach(k => localStorage.setItem(k, 'true'));
    });
    await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
    for (let i = 0; i < 5; i++) {
      const lewati = await page.$('button:has-text("Lewati")');
      if (lewati) { await lewati.click({ force: true }).catch(() => {}); await page.waitForTimeout(500); }
      else break;
    }

    // Click Analytics to go to Canva
    console.log('Clicking Analytics...');
    const analyticsBtn = await page.$('button:has-text("Analytics")');
    if (analyticsBtn) await analyticsBtn.click({ force: true });
    await page.waitForTimeout(15000);

    // Ultra-deep DOM dump
    console.log('\n═══ DEEP DOM DUMP ═══');
    
    const deepDump = await page.evaluate(() => {
      // Get the full body DOM tree up to depth 6
      function dumpElement(el, depth = 0, maxDepth = 6) {
        if (depth > maxDepth || !el) return null;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const result = {
          tag: el.tagName,
          id: el.id || undefined,
          class: el.className?.toString().substring(0, 60) || undefined,
          testid: el.getAttribute('data-testid') || undefined,
          panelId: el.getAttribute('data-panel-id') || undefined,
          panelGroup: el.getAttribute('data-panel-group-direction') || undefined,
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0,
          display: style.display,
          overflow: style.overflow,
          text: el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 ? el.textContent?.trim().substring(0, 30) : undefined,
        };
        
        if (el.children.length > 0 && depth < maxDepth) {
          result.children = Array.from(el.children).slice(0, 10).map(c => dumpElement(c, depth + 1, maxDepth)).filter(Boolean);
        }
        return result;
      }
      
      // Start from body
      return dumpElement(document.body, 0, 6);
    });
    
    console.log(JSON.stringify(deepDump, null, 2).substring(0, 5000));

    // Also check: what does the AuthoringTool's renderPanel() actually render?
    const activePanelCheck = await page.evaluate(() => {
      // Try to find the Zustand store via React DevTools
      const allElements = document.querySelectorAll('*');
      const canvaRelated = [];
      for (const el of allElements) {
        const classStr = el.className?.toString() || '';
        if (classStr.includes('canva') || classStr.includes('Canva') || classStr.includes('resizable') || classStr.includes('Resizable')) {
          canvaRelated.push({
            tag: el.tagName,
            class: classStr.substring(0, 80),
            w: el.offsetWidth,
            h: el.offsetHeight,
            children: el.children.length,
          });
        }
      }
      return canvaRelated;
    });
    
    console.log('\n═══ CANVA-RELATED ELEMENTS ═══');
    activePanelCheck.forEach(e => console.log(`  ${e.tag}.${e.class} ${e.w}x${e.h} children=${e.children}`));

    // Check if ResizablePanelGroup component is even in the DOM
    const resizableCheck = await page.evaluate(() => {
      // Search for the react-resizable-panels specific attributes
      const all = document.querySelectorAll('*');
      const results = [];
      for (const el of all) {
        const attrs = Array.from(el.attributes).map(a => a.name);
        if (attrs.some(a => a.includes('panel') || a.includes('resize') || a.includes('data-panel'))) {
          results.push({
            tag: el.tagName,
            attrs: attrs.filter(a => a.includes('panel') || a.includes('resize')),
            class: el.className?.toString().substring(0, 40),
            w: el.offsetWidth,
            h: el.offsetHeight,
          });
        }
      }
      return results;
    });
    
    console.log('\n═══ RESIZABLE PANEL ATTRIBUTES ═══');
    if (resizableCheck.length === 0) {
      console.log('  NONE FOUND — react-resizable-panels not rendered!');
    } else {
      resizableCheck.forEach(e => console.log(`  ${e.tag} attrs=${JSON.stringify(e.attrs)} ${e.w}x${e.h}`));
    }

    // Final check: Get the current state of the authoring store
    const storeState = await page.evaluate(() => {
      // Try to find and read the Zustand store
      const rootEl = document.querySelector('#__next') || document.querySelector('[id]');
      if (!rootEl) return { error: 'no root element' };
      
      // Try all root-level elements
      const allRoots = document.querySelectorAll('body > *');
      const results = [];
      for (const root of allRoots) {
        const keys = Object.keys(root);
        const fiberKey = keys.find(k => k.startsWith('__reactFiber'));
        if (fiberKey) {
          results.push({ tag: root.tagName, id: root.id, hasFiber: true });
        }
      }
      return results;
    });
    
    console.log('\n═══ ROOT ELEMENTS ═══');
    console.log(JSON.stringify(storeState));

    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-v8-canvas.png', fullPage: false });

    console.log('\n═══ CONSOLE ERRORS ═══');
    consoleErrors.slice(0, 15).forEach(e => console.log(`  ${e.substring(0, 200)}`));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

main();
