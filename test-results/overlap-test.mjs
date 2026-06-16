/**
 * Sprint 1 Bounding Box Overlap Test
 * Memeriksa apakah canvas/stage menutupi panel kiri dan kanan
 * 
 * Run: node test-results/overlap-test.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/home/z/my-project/test-results';
const SCREENSHOT_PATH = path.join(SCREENSHOT_DIR, 'workspace-screenshot.png');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // Retina for clarity
  });
  const page = await context.newPage();

  console.log('1. Navigating to http://21.0.22.43:3000...');
  await page.goto('http://21.0.22.43:3000/', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Wait for the app to load
  await page.waitForTimeout(3000);

  console.log('2. Taking initial screenshot (Dashboard)...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dashboard-initial.png'), fullPage: false });

  // Navigate to Canva/Workspace panel
  console.log('3. Navigating to Canva workspace...');
  
  // Try clicking nav-canva button
  const canvaNav = page.getByTestId('nav-canva');
  const canvaNavExists = await canvaNav.count();
  
  if (canvaNavExists > 0) {
    await canvaNav.click();
    console.log('   Clicked nav-canva');
  } else {
    // Try clicking the "Desain" or "Canva" button in sidebar
    const desainBtn = page.locator('text=Desain').first();
    if (await desainBtn.count() > 0) {
      await desainBtn.click();
      console.log('   Clicked Desain button');
    } else {
      // Try the palette/Canva button in header
      const paletteBtn = page.locator('text=Canva').first();
      if (await paletteBtn.count() > 0) {
        await paletteBtn.click();
        console.log('   Clicked Canva button');
      } else {
        console.log('   Could not find Canva navigation, trying direct approach...');
        // Use authoring store to set panel
        await page.evaluate(() => {
          if (window.__AUTHORING_STORE__) {
            window.__AUTHORING_STORE__.setActivePanel('canva');
          }
        });
      }
    }
  }
  
  await page.waitForTimeout(2000);

  console.log('4. Taking workspace screenshot...');
  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });

  // Get bounding boxes
  console.log('\n5. Getting bounding boxes...');
  
  const leftPanel = page.locator('[data-testid="left-panel"]');
  const canvasStage = page.locator('[data-testid="canvas-stage"]');
  const rightPanel = page.locator('[data-testid="right-panel"]');
  
  // Also check by other selectors
  const cmCanvasArea = page.locator('#cm-canvas-area');
  const cmStageWrap = page.locator('#cm-stage-wrap');
  const mainContent = page.locator('#main-content');
  
  const results = {
    leftPanel: null,
    canvasStage: null,
    rightPanel: null,
    cmCanvasArea: null,
    cmStageWrap: null,
    mainContent: null,
    overlap: false,
    issues: [],
  };

  // Left panel
  if (await leftPanel.count() > 0) {
    const box = await leftPanel.boundingBox();
    if (box) {
      results.leftPanel = { x: box.x, y: box.y, width: box.width, height: box.height };
      console.log(`   left-panel: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
    } else {
      console.log('   left-panel: NO BOUNDING BOX (hidden/zero-size)');
      results.issues.push('left-panel has no bounding box');
    }
  } else {
    console.log('   left-panel: NOT FOUND in DOM');
    results.issues.push('left-panel not found');
  }

  // Canvas stage
  if (await canvasStage.count() > 0) {
    const box = await canvasStage.boundingBox();
    if (box) {
      results.canvasStage = { x: box.x, y: box.y, width: box.width, height: box.height };
      console.log(`   canvas-stage: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
    } else {
      console.log('   canvas-stage: NO BOUNDING BOX');
      results.issues.push('canvas-stage has no bounding box');
    }
  } else {
    console.log('   canvas-stage: NOT FOUND in DOM');
    results.issues.push('canvas-stage not found');
  }

  // Right panel
  if (await rightPanel.count() > 0) {
    const box = await rightPanel.boundingBox();
    if (box) {
      results.rightPanel = { x: box.x, y: box.y, width: box.width, height: box.height };
      console.log(`   right-panel: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
    } else {
      console.log('   right-panel: NO BOUNDING BOX (hidden/zero-size)');
      results.issues.push('right-panel has no bounding box (may be collapsed)');
    }
  } else {
    console.log('   right-panel: NOT FOUND in DOM');
    results.issues.push('right-panel not found (may be closed)');
  }

  // cm-canvas-area
  if (await cmCanvasArea.count() > 0) {
    const box = await cmCanvasArea.boundingBox();
    if (box) {
      results.cmCanvasArea = { x: box.x, y: box.y, width: box.width, height: box.height };
      console.log(`   cm-canvas-area: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
    }
  }

  // cm-stage-wrap
  if (await cmStageWrap.count() > 0) {
    const box = await cmStageWrap.boundingBox();
    if (box) {
      results.cmStageWrap = { x: box.x, y: box.y, width: box.width, height: box.height };
      console.log(`   cm-stage-wrap: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
    }
  }

  // main-content
  if (await mainContent.count() > 0) {
    const box = await mainContent.boundingBox();
    if (box) {
      results.mainContent = { x: box.x, y: box.y, width: box.width, height: box.height };
      console.log(`   main-content: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
    }
  }

  // Overlap detection
  console.log('\n6. OVERLAP ANALYSIS...');
  
  if (results.leftPanel && results.canvasStage) {
    const canvasStartsBeforeLeftEnds = results.canvasStage.x < (results.leftPanel.x + results.leftPanel.width);
    const canvasOverlapsLeft = results.canvasStage.x < results.leftPanel.x + results.leftPanel.width && 
                               results.canvasStage.x + results.canvasStage.width > results.leftPanel.x;
    
    if (canvasOverlapsLeft) {
      console.log('   ❌ OVERLAP: canvas-stage overlaps with left-panel!');
      console.log(`      Left panel ends at x=${results.leftPanel.x + results.leftPanel.width}`);
      console.log(`      Canvas starts at x=${results.canvasStage.x}`);
      results.overlap = true;
      results.issues.push('canvas-stage overlaps left-panel');
    } else {
      console.log('   ✅ No overlap between left-panel and canvas-stage');
      console.log(`      Left panel ends at x=${results.leftPanel.x + results.leftPanel.width}`);
      console.log(`      Canvas starts at x=${results.canvasStage.x}`);
    }
  }

  if (results.rightPanel && results.canvasStage) {
    const canvasEndsAfterRightStarts = (results.canvasStage.x + results.canvasStage.width) > results.rightPanel.x;
    
    if (canvasEndsAfterRightStarts) {
      console.log('   ❌ OVERLAP: canvas-stage overlaps with right-panel!');
      console.log(`      Canvas ends at x=${results.canvasStage.x + results.canvasStage.width}`);
      console.log(`      Right panel starts at x=${results.rightPanel.x}`);
      results.overlap = true;
      results.issues.push('canvas-stage overlaps right-panel');
    } else {
      console.log('   ✅ No overlap between canvas-stage and right-panel');
      console.log(`      Canvas ends at x=${results.canvasStage.x + results.canvasStage.width}`);
      console.log(`      Right panel starts at x=${results.rightPanel.x}`);
    }
  }

  // Click test
  console.log('\n7. CLICK TEST...');
  
  if (results.leftPanel) {
    try {
      const clickX = results.leftPanel.x + 20;
      const clickY = results.leftPanel.y + 80;
      await page.mouse.click(clickX, clickY);
      console.log(`   ✅ Clicked left-panel at (${clickX}, ${clickY}) - no error`);
    } catch (e) {
      console.log(`   ❌ Cannot click left-panel: ${e.message}`);
      results.issues.push('left-panel not clickable');
    }
  }

  if (results.rightPanel) {
    try {
      const clickX = results.rightPanel.x + 20;
      const clickY = results.rightPanel.y + 80;
      await page.mouse.click(clickX, clickY);
      console.log(`   ✅ Clicked right-panel at (${clickX}, ${clickY}) - no error`);
    } catch (e) {
      console.log(`   ❌ Cannot click right-panel: ${e.message}`);
      results.issues.push('right-panel not clickable');
    }
  }

  // Check z-index and position CSS of key elements
  console.log('\n8. CSS ANALYSIS...');
  
  const cssChecks = await page.evaluate(() => {
    const checks = {};
    
    // Check cm-canvas-area
    const canvasArea = document.getElementById('cm-canvas-area');
    if (canvasArea) {
      const style = getComputedStyle(canvasArea);
      checks.canvasArea = {
        position: style.position,
        width: style.width,
        zIndex: style.zIndex,
        overflow: style.overflow,
      };
    }
    
    // Check cm-stage-wrap
    const stageWrap = document.getElementById('cm-stage-wrap');
    if (stageWrap) {
      const style = getComputedStyle(stageWrap);
      checks.stageWrap = {
        position: style.position,
        width: style.width,
        zIndex: style.zIndex,
        overflow: style.overflow,
      };
    }
    
    // Check left-panel
    const leftPanel = document.querySelector('[data-testid="left-panel"]');
    if (leftPanel) {
      const style = getComputedStyle(leftPanel);
      checks.leftPanel = {
        position: style.position,
        width: style.width,
        zIndex: style.zIndex,
        overflow: style.overflow,
      };
    }
    
    // Check right-panel
    const rightPanel = document.querySelector('[data-testid="right-panel"]');
    if (rightPanel) {
      const style = getComputedStyle(rightPanel);
      checks.rightPanel = {
        position: style.position,
        width: style.width,
        zIndex: style.zIndex,
        overflow: style.overflow,
      };
    }
    
    // Check canvas-stage
    const canvasStage = document.querySelector('[data-testid="canvas-stage"]');
    if (canvasStage) {
      const style = getComputedStyle(canvasStage);
      checks.canvasStage = {
        position: style.position,
        width: style.width,
        zIndex: style.zIndex,
        overflow: style.overflow,
      };
    }
    
    // Check main-content
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      const style = getComputedStyle(mainContent);
      checks.mainContent = {
        position: style.position,
        width: style.width,
        zIndex: style.zIndex,
        overflow: style.overflow,
      };
    }

    // Check the ResizablePanelGroup parent
    const panelGroup = document.querySelector('[data-panel-group]');
    if (panelGroup) {
      const style = getComputedStyle(panelGroup);
      checks.panelGroup = {
        position: style.position,
        width: style.width,
        display: style.display,
      };
    }
    
    return checks;
  });
  
  console.log('   CSS computed styles:');
  for (const [el, styles] of Object.entries(cssChecks)) {
    console.log(`   ${el}: ${JSON.stringify(styles)}`);
  }

  // Final result
  console.log('\n═══════════════════════════════════════');
  console.log('AUDIT RESULT:');
  console.log(`Overlap detected: ${results.overlap ? 'YES ❌' : 'NO ✅'}`);
  console.log(`Issues: ${results.issues.length > 0 ? results.issues.join(', ') : 'None'}`);
  console.log(`Screenshot: ${SCREENSHOT_PATH}`);
  console.log('═══════════════════════════════════════');

  // Save results
  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'overlap-results.json'),
    JSON.stringify({ ...results, cssChecks }, null, 2)
  );

  await browser.close();
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
