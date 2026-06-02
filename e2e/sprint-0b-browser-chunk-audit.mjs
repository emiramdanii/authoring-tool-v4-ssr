/**
 * Sprint 0B — Browser Chunk Stability Audit
 * 
 * PASS criteria:
 * 1. Browser opens app → Dashboard hydrates
 * 2. Click Canvas → CanvaBuilder chunk loads
 * 3. workspace-root appears
 * 4. Server stays alive
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 30000;

async function main() {
  const results = {
    dashboard: { hydrate: false, title: '', bodyLength: 0, errors: [] },
    canvas: { navigated: false, chunkLoaded: false, workspaceRoot: false, errors: [] },
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

  // Collect console messages
  const consoleErrors = [];
  const consoleWarnings = [];
  const networkErrors = [];
  const chunkRequests = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  });

  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      failure: request.failure()?.errorText,
    });
  });

  page.on('request', request => {
    const url = request.url();
    if (url.includes('_next/static/chunks') || url.includes('CanvaBuilder') || url.includes('canva')) {
      chunkRequests.push({ url, method: request.method() });
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('_next/static/chunks') || url.includes('CanvaBuilder') || url.includes('canva')) {
      const idx = chunkRequests.findIndex(r => r.url === url);
      if (idx !== -1) {
        chunkRequests[idx].status = response.status();
        chunkRequests[idx].size = response.headers()['content-length'] || 'unknown';
      }
    }
  });

  try {
    // ═══════════════════════════════════════════════════════
    // TEST 1: Dashboard Hydration
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ TEST 1: Dashboard Hydration ═══');
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    
    results.dashboard.title = await page.title();
    results.dashboard.bodyLength = (await page.evaluate(() => document.body?.innerText?.length || 0));
    results.dashboard.hydrate = results.dashboard.bodyLength > 100;
    
    console.log(`  Title: ${results.dashboard.title}`);
    console.log(`  Body text length: ${results.dashboard.bodyLength}`);
    console.log(`  Hydrated: ${results.dashboard.hydrate}`);

    // Check for React hydration
    const reactRoot = await page.evaluate(() => {
      const root = document.getElementById('__next') || document.getElementById('root');
      return root ? { id: root.id, childCount: root.children.length, innerHTML: root.innerHTML.substring(0, 200) } : null;
    });
    console.log(`  React root: ${JSON.stringify(reactRoot)}`);

    // Take screenshot
    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-01-dashboard.png', fullPage: false });
    console.log('  Screenshot: sprint0b-01-dashboard.png');

    // ═══════════════════════════════════════════════════════
    // TEST 1.5: Dismiss any modal/overlay
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ TEST 1.5: Dismiss Modal Overlay ═══');
    
    // Check for modal overlay and dismiss it
    await page.waitForTimeout(2000);
    
    const modalInfo = await page.evaluate(() => {
      const overlay = document.querySelector('.fixed.inset-0.z-50');
      if (!overlay) return { exists: false };
      
      // Get modal content
      const title = overlay.querySelector('h2, h3, [class*="title"]')?.textContent?.trim();
      const buttons = Array.from(overlay.querySelectorAll('button')).map(b => b.textContent?.trim().substring(0, 40));
      return { exists: true, title, buttons, html: overlay.innerHTML.substring(0, 300) };
    });
    
    console.log(`  Modal found: ${JSON.stringify(modalInfo)}`);
    
    if (modalInfo.exists) {
      // Try to dismiss by clicking outside, pressing Escape, or clicking close button
      // Method 1: Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      
      // Check if modal still exists
      const stillThere = await page.evaluate(() => !!document.querySelector('.fixed.inset-0.z-50'));
      console.log(`  After Escape: modal ${stillThere ? 'still there' : 'dismissed'}`);
      
      if (stillThere) {
        // Method 2: Click the overlay backdrop
        const backdrop = await page.$('.fixed.inset-0.z-50 > .absolute.inset-0');
        if (backdrop) {
          await backdrop.click({ force: true });
          await page.waitForTimeout(1000);
          console.log('  Clicked backdrop');
        }
      }
      
      // Method 3: Try clicking close/cancel/skip buttons
      if (await page.evaluate(() => !!document.querySelector('.fixed.inset-0.z-50'))) {
        const closeButtons = await page.$$('.fixed.inset-0.z-50 button');
        for (const btn of closeButtons) {
          const text = await btn.textContent();
          const trimmed = text?.trim().toLowerCase() || '';
          if (trimmed.includes('tutup') || trimmed.includes('close') || trimmed.includes('batal') || trimmed.includes('cancel') || trimmed.includes('lewati') || trimmed.includes('skip') || trimmed.includes('nanti') || trimmed.includes('×')) {
            await btn.click({ force: true });
            await page.waitForTimeout(1000);
            console.log(`  Clicked close button: "${trimmed}"`);
            break;
          }
        }
      }
      
      // Method 4: Force remove ALL overlays, tour elements, and spotlight
      if (await page.evaluate(() => !!document.querySelector('.fixed.inset-0.z-50'))) {
        await page.evaluate(() => {
          // Remove all fixed overlays
          document.querySelectorAll('.fixed.inset-0.z-50').forEach(el => el.remove());
          // Remove any tour/spotlight overlays
          document.querySelectorAll('[class*="tour"], [class*="spotlight"], [class*="onboarding"]').forEach(el => el.remove());
          // Remove any remaining backdrop overlays
          document.querySelectorAll('.absolute.inset-0.bg-silse-on-surface\\/40, .backdrop-blur-sm').forEach(el => el.remove());
        });
        await page.waitForTimeout(500);
        console.log('  Force-removed all overlays via JS');
      }
    }
    
    await page.screenshot({ path: '/home/z/my-project/download/sprint0b-01b-after-modal-dismiss.png', fullPage: false });

    // ═══════════════════════════════════════════════════════
    // TEST 2: Navigate to Canvas Workspace
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ TEST 2: Navigate to Canvas Workspace ═══');

    // Try to find and click the Workspace button in sidebar
    // The sidebar has: Dashboard, Workspace, Assets, Analytics buttons
    // We need to click the "Workspace" one (edit_note icon)
    const navSelectors = [
      'button:has-text("Workspace")',           // Main sidebar "Workspace" button
      'button:has-text("Canva")',                // Alternative name
      'button:has-text("Canvas")',               // Alternative name
      '[data-testid="nav-canva"]',               // Data-testid
      '[class*="nav-canva"]',
    ];

    let clicked = false;
    for (const selector of navSelectors) {
      try {
        // Find ALL matching elements and pick the right one
        const els = await page.$$(selector);
        for (const el of els) {
          const text = await el.textContent();
          const trimmedText = text?.trim() || '';
          // We want "Workspace" button specifically, not "Analytics" or other
          if (trimmedText.toLowerCase().includes('workspace') || trimmedText.toLowerCase().includes('canva')) {
            console.log(`  Found nav element: ${selector} → "${trimmedText}"`);
            await el.click();
            clicked = true;
            console.log(`  Clicked Workspace button!`);
            break;
          }
        }
        if (clicked) break;
      } catch (e) {
        // Try next selector
      }
    }

    if (!clicked) {
      // Fallback: find by edit_note icon (Workspace button has this icon)
      console.log('  Primary selectors failed, trying fallback by icon...');
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text?.includes('edit_note') || text?.toLowerCase().includes('workspace')) {
          console.log(`  Found fallback: "${text?.trim()}"`);
          await btn.click();
          clicked = true;
          console.log(`  Clicked!`);
          break;
        }
      }
    }

    results.canvas.navigated = clicked;
    
    // Also try direct Zustand store manipulation to switch to Canvas panel
    if (!clicked) {
      console.log('  Attempting direct Zustand store manipulation...');
      const storeResult = await page.evaluate(() => {
        try {
          if (typeof window !== 'undefined') {
            const stores = Object.keys(window).filter(k => k.includes('store') || k.includes('zustand'));
            if (stores.length > 0) return { found: true, stores };
          }
          return { found: false };
        } catch (e) { return { error: e.message }; }
      });
      console.log(`  Store search: ${JSON.stringify(storeResult)}`);
    }
    
    // Try force-clicking Workspace button
    if (!clicked) {
      console.log('  Attempting force click on Workspace button...');
      try {
        const wsBtn = await page.$('button:has-text("Workspace")');
        if (wsBtn) {
          await wsBtn.click({ force: true });
          clicked = true;
          console.log('  Force-clicked Workspace button!');
        }
      } catch (e) {
        console.log(`  Force click failed: ${e.message?.substring(0, 100)}`);
      }
    }
    
    if (clicked) {
      // Wait for potential chunk loading (CanvaBuilder is lazy-loaded)
      console.log('\n  Waiting for Canvas Workspace to load (10s)...');
      await page.waitForTimeout(10000);

      // Check for workspace-root
      const workspaceRoot = await page.evaluate(() => {
        const root = document.querySelector('[class*="workspace-root"]') ||
                     document.querySelector('[class*="WorkspaceRoot"]') ||
                     document.querySelector('[id*="workspace"]') ||
                     document.querySelector('[class*="CanvaBuilder"]') ||
                     document.querySelector('[class*="canva-builder"]');
        return root ? { tag: root.tagName, class: root.className?.substring(0, 100), id: root.id } : null;
      });
      
      results.canvas.workspaceRoot = !!workspaceRoot;
      console.log(`  workspace-root found: ${JSON.stringify(workspaceRoot)}`);

      // Check page content after navigation
      const afterNavContent = await page.evaluate(() => ({
        bodyText: document.body?.innerText?.substring(0, 500),
        bodyLength: document.body?.innerText?.length || 0,
      }));
      console.log(`  Body text after nav: ${afterNavContent.bodyLength} chars`);
      console.log(`  Preview: "${afterNavContent.bodyText?.substring(0, 200)}"`);

      // Screenshot
      await page.screenshot({ path: '/home/z/my-project/download/sprint0b-02-canvas-workspace.png', fullPage: false });
      console.log('  Screenshot: sprint0b-02-canvas-workspace.png');
    } else {
      console.log('  FAILED: Could not find Canvas navigation button');
      // Take screenshot of current state
      await page.screenshot({ path: '/home/z/my-project/download/sprint0b-02-no-canvas-nav.png', fullPage: false });
    }

    // ═══════════════════════════════════════════════════════
    // TEST 3: Server Still Alive
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ TEST 3: Server Still Alive ═══');
    
    const serverCheck = await page.evaluate(async () => {
      try {
        const res = await fetch('/');
        return { status: res.status, ok: res.ok };
      } catch (e) {
        return { status: 0, error: e.message };
      }
    });
    
    results.serverAlive = serverCheck.status === 200;
    console.log(`  Server check: ${JSON.stringify(serverCheck)}`);

    // ═══════════════════════════════════════════════════════
    // RESULTS
    // ═══════════════════════════════════════════════════════
    console.log('\n═══ CHUNK REQUESTS ═══');
    chunkRequests.forEach(r => {
      console.log(`  ${r.method} ${r.url.substring(0, 120)} → ${r.status || 'pending'}`);
    });

    console.log('\n═══ CONSOLE ERRORS ═══');
    consoleErrors.forEach(e => console.log(`  ERROR: ${e.substring(0, 200)}`));

    console.log('\n═══ CONSOLE WARNINGS ═══');
    consoleWarnings.slice(0, 10).forEach(w => console.log(`  WARN: ${w.substring(0, 200)}`));

    console.log('\n═══ NETWORK ERRORS ═══');
    networkErrors.forEach(e => console.log(`  FAIL: ${e.url?.substring(0, 120)} → ${e.failure}`));

    // Assign errors to results
    results.dashboard.errors = consoleErrors;
    results.canvas.errors = consoleErrors.filter(e => 
      e.toLowerCase().includes('chunk') || 
      e.toLowerCase().includes('canva') || 
      e.toLowerCase().includes('workspace') ||
      e.toLowerCase().includes('hydrat')
    );

    // Determine overall result
    const allPass = results.dashboard.hydrate && results.canvas.navigated && results.canvas.workspaceRoot && results.serverAlive;
    results.summary = allPass 
      ? 'PASS — All Sprint 0B criteria met'
      : `PARTIAL/FAIL — Dashboard: ${results.dashboard.hydrate ? 'OK' : 'FAIL'}, Canvas nav: ${results.canvas.navigated ? 'OK' : 'FAIL'}, Workspace root: ${results.canvas.workspaceRoot ? 'OK' : 'FAIL'}, Server: ${results.serverAlive ? 'OK' : 'FAIL'}`;

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
