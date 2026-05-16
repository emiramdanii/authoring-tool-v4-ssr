#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// MEMORY STRESS TEST — Long-session memory leak detection
// ═══════════════════════════════════════════════════════════════
// [G.4] Automated test that simulates a long editing session
// to detect memory leaks in the SILSE authoring tool.
//
// What it does:
//   1. Opens the app in a headless browser
//   2. Creates 50 pages with random blocks
//   3. Switches between pages rapidly
//   4. Performs 1000 undo/redo cycles
//   5. Monitors memory growth throughout
//   6. Reports if heap grows beyond thresholds
//
// Prerequisites:
//   - Puppeteer installed: npm install puppeteer
//   - App running on http://localhost:3000
//
// Usage:
//   node scripts/memory-stress-test.js
//   node scripts/memory-stress-test.js --pages 20 --undo-redo 500
// ═══════════════════════════════════════════════════════════════

const DEFAULT_PAGES = 50;
const DEFAULT_UNDO_REDO = 1000;
const HEAP_WARNING_MB = 100;
const HEAP_CRITICAL_MB = 200;
const GROWTH_WARNING_MB_PER_MIN = 2;
const GROWTH_CRITICAL_MB_PER_MIN = 5;

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { pages: DEFAULT_PAGES, undoRedo: DEFAULT_UNDO_REDO };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pages' && args[i + 1]) parsed.pages = parseInt(args[i + 1], 10);
    if (args[i] === '--undo-redo' && args[i + 1]) parsed.undoRedo = parseInt(args[i + 1], 10);
  }
  return parsed;
}

async function runStressTest() {
  const { pages: numPages, undoRedo: numUndoRedo } = parseArgs();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  [G.4] SILSE Memory Stress Test');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Pages to create: ${numPages}`);
  console.log(`  Undo/redo cycles: ${numUndoRedo}`);
  console.log(`  Heap warning: ${HEAP_WARNING_MB}MB`);
  console.log(`  Heap critical: ${HEAP_CRITICAL_MB}MB`);
  console.log('');

  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    console.error('❌ Puppeteer not installed. Install with: npm install puppeteer');
    console.log('');
    console.log('Alternatively, run this test manually:');
    console.log('  1. Open the app in Chrome');
    console.log('  2. Open DevTools → Memory');
    console.log('  3. Create many pages and blocks');
    console.log('  4. Switch between pages rapidly');
    console.log('  5. Perform many undo/redo operations');
    console.log('  6. Check if heap grows beyond normal');
    console.log('  7. Use the PerformanceMonitor Memory tab for live stats');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--js-flags=--expose-gc'],
  });

  const page = await browser.newPage();
  const memorySamples = [];

  async function sampleMemory(label) {
    const metrics = await page.metrics();
    const heapUsed = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    const sample = {
      label,
      timestamp: Date.now(),
      heapUsedMB: heapUsed ? (heapUsed.usedJSHeapSize / 1048576).toFixed(1) : 'N/A',
      totalHeapMB: heapUsed ? (heapUsed.totalJSHeapSize / 1048576).toFixed(1) : 'N/A',
      jsHeapNodes: metrics.JSHeapUsedSize || 0,
    };
    memorySamples.push(sample);
    console.log(`  📊 [${label}] Heap: ${sample.heapUsedMB}MB / ${sample.totalHeapMB}MB`);
    return sample;
  }

  try {
    console.log('📡 Navigating to app...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Force GC before baseline measurement
    await page.evaluate(() => {
      if (typeof gc === 'function') gc();
    });
    const baseline = await sampleMemory('baseline');

    // Phase 1: Create pages
    console.log(`\n📝 Phase 1: Creating ${numPages} pages...`);
    for (let i = 0; i < numPages; i++) {
      await page.evaluate(() => {
        // Access the canva store and add a page
        const store = window.__SILSE_CANVA_STORE__;
        if (store) store.getState().addPage();
      });
      if (i % 10 === 9) {
        await sampleMemory(`pages-${i + 1}`);
      }
    }
    await sampleMemory('after-page-creation');

    // Phase 2: Rapid page switching
    console.log(`\n🔄 Phase 2: Rapid page switching...`);
    for (let round = 0; round < 5; round++) {
      for (let i = 0; i < numPages; i++) {
        await page.evaluate((idx) => {
          const store = window.__SILSE_CANVA_STORE__;
          if (store) store.getState().goPage(idx);
        }, i);
      }
    }
    await sampleMemory('after-page-switching');

    // Phase 3: Undo/redo cycles
    console.log(`\n↩️ Phase 3: ${numUndoRedo} undo/redo cycles...`);
    for (let i = 0; i < numUndoRedo; i++) {
      // Try undo
      await page.evaluate(() => {
        const store = window.__SILSE_CANVA_STORE__;
        if (store && store.getState().canUndo()) {
          store.getState().undo();
        }
      });
      // Try redo
      await page.evaluate(() => {
        const store = window.__SILSE_CANVA_STORE__;
        if (store && store.getState().canRedo()) {
          store.getState().redo();
        }
      });
      if (i % 100 === 99) {
        await sampleMemory(`undo-redo-${i + 1}`);
      }
    }
    await sampleMemory('after-undo-redo');

    // Force GC for final measurement
    await page.evaluate(() => {
      if (typeof gc === 'function') gc();
    });
    await page.waitForTimeout(1000);
    const final = await sampleMemory('final');

    // Calculate results
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  RESULTS');
    console.log('═══════════════════════════════════════════════════════════');

    const baselineMB = parseFloat(baseline.heapUsedMB) || 0;
    const finalMB = parseFloat(final.heapUsedMB) || 0;
    const growthMB = finalMB - baselineMB;
    const durationMin = ((final.timestamp - baseline.timestamp) / 60000);
    const growthRate = durationMin > 0 ? growthMB / durationMin : 0;

    console.log(`  Baseline heap: ${baselineMB}MB`);
    console.log(`  Final heap: ${finalMB}MB`);
    console.log(`  Growth: ${growthMB.toFixed(1)}MB`);
    console.log(`  Duration: ${durationMin.toFixed(1)}min`);
    console.log(`  Growth rate: ${growthRate.toFixed(2)}MB/min`);
    console.log('');

    // Determine status
    let status = '🟢 HEALTHY';
    if (growthRate > GROWTH_CRITICAL_MB_PER_MIN || finalMB > HEAP_CRITICAL_MB) {
      status = '🔴 CRITICAL — Memory leak detected!';
    } else if (growthRate > GROWTH_WARNING_MB_PER_MIN || finalMB > HEAP_WARNING_MB) {
      status = '🟡 WARNING — Memory growth above threshold';
    }
    console.log(`  Status: ${status}`);

    if (growthRate > GROWTH_WARNING_MB_PER_MIN) {
      console.log('\n  ⚠️  Recommendations:');
      console.log('  - Check SubscriptionManager for unclosed subscriptions');
      console.log('  - Check history queue size with getHistorySize()');
      console.log('  - Check schema tree size with estimateSchemaSize()');
      console.log('  - Review useEffect cleanup in components');
    }

    // Write samples to file for analysis
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, '..', 'memory-stress-results.json');
    fs.writeFileSync(outputPath, JSON.stringify({ memorySamples, summary: { baselineMB, finalMB, growthMB, growthRate, status } }, null, 2));
    console.log(`\n  Results saved to: ${outputPath}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

runStressTest().catch(console.error);
