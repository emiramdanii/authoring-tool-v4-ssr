/**
 * Sprint 0B — Browser Chunk Stability Audit v7
 * Deep DOM analysis - check exactly what renders inside CanvaBuilder
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
    console.log('═══ STEP 1: Load Dashboard ═══');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => {
      ['silse-onboarding-completed', 'silse-tour-completed', 'canva-tour-completed'].forEach(k => localStorage.setItem(k, 'true'));
    });
    await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
    
    // Dismiss onboarding
    for (let i = 0; i < 5; i++) {
      const lewati = await page.$('button:has-text("Lewati")');
      if (lewati) { await lewati.click({ force: true }).catch(() => {}); await page.waitForTimeout(500); }
      else break;
    }
    console.log('  Dashboard loaded');

    // Navigate to Canva via Analytics button
    console.log('═══ STEP 2: Navigate to Canva ═══');
    const analyticsBtn = await page.$('button:has-text("Analytics")');
    if (analyticsBtn) {
      await analyticsBtn.click({ force: true });
      console.log('  Clicked Analytics button');
    }
    await page.waitForTimeout(15000);

    // Deep DOM analysis
    console.log('═══ STEP 3: Deep DOM Analysis ═══');
    
    const domAnalysis = await page.evaluate(() => {
      const body = document.body;
      
      // Find all elements with data-testid
      const testIds = Array.from(body.querySelectorAll('[data-testid]')).map(el => ({
        testid: el.getAttribute('data-testid'),
        tag: el.tagName,
        class: el.className?.toString().substring(0, 50),
        visible: el.offsetHeight > 0 && el.offsetWidth > 0,
        w: el.offsetWidth,
        h: el.offsetHeight,
      }));
      
      // Find all elements with data-panel
      const panels = Array.from(body.querySelectorAll('[data-panel-id], [data-panel-group-direction]')).map(el => ({
        tag: el.tagName,
        id: el.getAttribute('data-panel-id'),
        direction: el.getAttribute('data-panel-group-direction'),
        class: el.className?.toString().substring(0, 60),
        visible: el.offsetHeight > 0,
        w: el.offsetWidth,
        h: el.offsetHeight,
        childCount: el.children.length,
      }));
      
      // Find the main content area
      const mainContent = body.querySelector('#main-content');
      let mainContentInfo = null;
      if (mainContent) {
        mainContentInfo = {
          childCount: mainContent.children.length,
          children: Array.from(mainContent.children).map(c => ({
            tag: c.tagName,
            class: c.className?.toString().substring(0, 60),
            testid: c.getAttribute('data-testid'),
            w: c.offsetWidth,
            h: c.offsetHeight,
            childCount: c.children.length,
          })),
        };
      }
      
      // Check for any SVG/icon elements that might indicate Toolbar rendered
      const svgs = body.querySelectorAll('svg');
      
      // Check current URL
      const url = window.location.href;
      
      // Get all style tags and link tags (check CSS loading)
      const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
      
      return {
        url,
        testIds,
        panels,
        mainContent: mainContentInfo,
        svgCount: svgs.length,
        stylesheetCount: stylesheets.length,
        bodyHTML: body.innerHTML.substring(0, 500),
      };
    });
    
    console.log(`  URL: ${domAnalysis.url}`);
    console.log(`  Elements with data-testid:`);
    domAnalysis.testIds.forEach(t => console.log(`    ${t.testid}: ${t.tag}.${t.class} visible=${t.visible} ${t.w}x${t.h}`));
    console.log(`  Panel elements:`);
    domAnalysis.panels.forEach(p => console.log(`    ${p.id || p.direction}: ${p.tag}.${p.class} visible=${p.visible} ${p.w}x${p.h} children=${p.childCount}`));
    console.log(`  Main content (#main-content):`);
    if (domAnalysis.mainContent) {
      console.log(`    Children: ${domAnalysis.mainContent.childCount}`);
      domAnalysis.mainContent.children.forEach(c => console.log(`      ${c.tag}.${c.class} [${c.testid || '-'}] ${c.w}x${c.h} children=${c.childCount}`));
    } else {
      console.log('    NOT FOUND');
    }
    console.log(`  SVGs: ${domAnalysis.svgCount}, Stylesheets: ${domAnalysis.stylesheetCount}`);
    
    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-v7-canvas.png', fullPage: false });

    // If CanvaBuilder not found, try the "Workspace" (Dokumen) button instead
    console.log('\n═══ STEP 4: Try Workspace (Dokumen) Panel ═══');
    
    // Go back to Dashboard first
    const backBtn = await page.$('button:has-text("Beranda")');
    if (backBtn) {
      await backBtn.click({ force: true });
      await page.waitForTimeout(3000);
    }
    
    // Click the Workspace button (id='dokumen')
    const wsBtn = await page.$('button:has-text("Workspace")');
    if (wsBtn) {
      await wsBtn.click({ force: true });
      console.log('  Clicked Workspace button');
      await page.waitForTimeout(10000);
    }
    
    const wsState = await page.evaluate(() => {
      const body = document.body?.innerText || '';
      const testIds = Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid'));
      return { bodyLength: body.length, bodyPreview: body.substring(0, 300), testIds };
    });
    
    console.log(`  Body: "${wsState.bodyPreview?.substring(0, 200)}"`);
    console.log(`  testIds: ${JSON.stringify(wsState.testIds)}`);
    
    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-v7-workspace.png', fullPage: false });

    // Summary
    console.log('\n═══ CONSOLE ERRORS ═══');
    consoleErrors.forEach(e => console.log(`  ${e.substring(0, 200)}`));

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-v7-error.png', fullPage: false }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main();
