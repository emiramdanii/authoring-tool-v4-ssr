/**
 * Sprint 0B — Direct state navigation test
 * Bypass UI clicks to directly set activePanel = 'canva'
 */
import { test, expect } from '@playwright/test';

test.setTimeout(90000);

test('Sprint 0B: Direct Canvas Workspace load + layout measurement', async ({ page }) => {
  // 1. Open app
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 2. Dismiss tour first
  // Set localStorage to skip tour
  await page.evaluate(() => {
    localStorage.setItem('at_tour_done', '1');
  });
  // Reload to skip tour
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 3. Screenshot clean dashboard
  await page.screenshot({ path: '/home/z/my-project/download/s0b-v2-01-dashboard.png' });

  // 4. Directly set the store to navigate to canva
  console.log('Setting activePanel to canva via store...');
  await page.evaluate(() => {
    // Access Zustand store directly
    const store = (window as any).__AUTHORING_STORE__ || null;
    if (store) {
      store.getState().setActivePanel('canva');
    } else {
      // Try using the React internals to find the store
      // Alternative: find and click the nav button after tour is dismissed
      const btn = document.querySelector('[data-testid="nav-canva"]') as HTMLElement;
      if (btn) btn.click();
    }
  });

  // Also try clicking the nav button directly (tour should be dismissed now)
  await page.waitForTimeout(500);
  const canvaBtn = page.locator('[data-testid="nav-canva"]').first();
  await canvaBtn.click();
  console.log('Clicked canva nav');

  // 5. Wait for CanvaBuilder dynamic import
  console.log('Waiting for CanvaBuilder to load...');
  await page.waitForTimeout(15000);

  // 6. Take screenshot
  await page.screenshot({ path: '/home/z/my-project/download/s0b-v2-02-canvas.png' });

  // 7. Check what's actually on the page
  const pageState = await page.evaluate(() => {
    // Check URL
    const url = window.location.href;

    // Check what components are in the DOM
    const allTestIds = Array.from(document.querySelectorAll('[data-testid]')).map(el => ({
      testid: el.getAttribute('data-testid'),
      tag: el.tagName,
      visible: (el as HTMLElement).offsetParent !== null,
      rect: el.getBoundingClientRect().toJSON(),
    }));

    // Check body content (first 300 chars)
    const bodyText = document.body.textContent?.substring(0, 300);

    // Check for loading states
    const loadingElements = Array.from(document.querySelectorAll('.animate-spin, [class*="loading"], [class*="skeleton"]')).length;

    return { url, allTestIds, bodyText, loadingElements };
  });

  console.log('Page state:');
  console.log('URL:', pageState.url);
  console.log('Loading elements:', pageState.loadingElements);
  console.log('Body text:', pageState.bodyText);
  console.log('All testids:', JSON.stringify(pageState.allTestIds.map(t => ({
    id: t.testid,
    visible: t.visible,
    w: Math.round(t.rect.width),
    h: Math.round(t.rect.height)
  })), null, 2));

  // 8. Measure CanvaBuilder elements if present
  const canvaBuilder = page.locator('[data-testid="canva-builder"]');
  const cbCount = await canvaBuilder.count();
  console.log('canva-builder count:', cbCount);

  if (cbCount > 0) {
    // Measure everything
    const measurements = await page.evaluate(() => {
      const get = (sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      };

      const area = document.getElementById('cm-canvas-area');
      const wrap = document.getElementById('cm-stage-wrap');

      return {
        leftPanel: get('[data-testid="left-panel"]'),
        canvasStage: get('[data-testid="canvas-stage"]'),
        rightPanel: get('[data-testid="right-panel"]'),
        toolbar: get('[data-testid="toolbar"]'),
        canvaBuilder: get('[data-testid="canva-builder"]'),
        canvasArea: area ? (() => { const r = area.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
        stageWrap: wrap ? (() => { const r = wrap.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        panels: Array.from(document.querySelectorAll('[data-panel]')).map(p => ({
          id: p.getAttribute('data-panel'),
          r: (() => { const rect = p.getBoundingClientRect(); return { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) }; })()
        })),
      };
    });

    console.log('\n=== MEASUREMENTS ===');
    console.log(JSON.stringify(measurements, null, 2));

    // Gutter analysis
    if (measurements.canvasStage && measurements.stageWrap) {
      const stage = measurements.canvasStage;
      const wrap = measurements.stageWrap;
      const gutterLeft = wrap.x - stage.x;
      const gutterRight = (stage.x + stage.w) - (wrap.x + wrap.w);
      const gutterTop = wrap.y - stage.y;
      const gutterBottom = (stage.y + stage.h) - (wrap.y + wrap.h);
      console.log('\n=== GUTTER ANALYSIS ===');
      console.log('Canvas stage area:', stage.w, 'x', stage.h);
      console.log('Stage wrap (actual canvas):', wrap.w, 'x', wrap.h);
      console.log('Gutter left:', gutterLeft, 'px');
      console.log('Gutter right:', gutterRight, 'px');
      console.log('Gutter top:', gutterTop, 'px');
      console.log('Gutter bottom:', gutterBottom, 'px');
    }

    // Save measurements
    const fs = require('fs');
    fs.writeFileSync('/home/z/my-project/download/s0b-v2-measurements.json', JSON.stringify(measurements, null, 2));
  } else {
    console.log('CanvaBuilder NOT loaded. Dumping page content...');
    // Take full page screenshot for debugging
    await page.screenshot({ path: '/home/z/my-project/download/s0b-v2-03-debug.png', fullPage: true });

    // Check console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(2000);
    console.log('Console errors:', errors.slice(0, 10));
  }

  // Final screenshot
  await page.screenshot({ path: '/home/z/my-project/download/s0b-v2-final.png', fullPage: true });

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log('CanvaBuilder loaded:', cbCount > 0 ? 'YES' : 'NO');
});
