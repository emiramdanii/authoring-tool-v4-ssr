/**
 * Golden Template QA — Health Check for Macam-Macam Norma
 * 
 * This script converts the LessonSchema to CanvaPage[] and runs
 * the Template Health Check to verify score >= 90 and errors = 0.
 * 
 * Usage: npx tsx scripts/health-check-macam-norma.ts
 */

import { MACAM_NORMA_LESSON } from '../src/presets/ppkn/macam-norma-schema';
import { schemaToCanvaPages } from '../src/core/engine/SchemaEngine.utils';
import { validateTemplate } from '../src/core/template/health-check/template-health-check';
import { getHealthStatusLabel, getHealthStatusColor } from '../src/core/template/health-check/types';

function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('GOLDEN TEMPLATE QA — Macam-Macam Norma');
  console.log('═══════════════════════════════════════════════════════════');
  console.log();

  // Step 1: Convert schema to CanvaPage[]
  const pages = schemaToCanvaPages(MACAM_NORMA_LESSON);
  console.log(`📐 Screens: ${pages.length}`);
  console.log(`📐 Template: ${MACAM_NORMA_LESSON.title} (v${MACAM_NORMA_LESSON.version})`);
  console.log();

  // Step 2: Run health check
  const result = validateTemplate({ pages });

  // Step 3: Print score
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🏆 HEALTH SCORE: ${result.score}/100`);
  console.log(`📊 STATUS: ${getHealthStatusLabel(result.status)} (${result.status})`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log();

  // Step 4: Print breakdown
  console.log('── Breakdown ──────────────────────────────────────────────');
  const breakdown = result.breakdown;
  const areas = Object.entries(breakdown) as [string, { score: number; max: number; issues: number }][];
  for (const [area, data] of areas) {
    const pct = data.max > 0 ? Math.round((data.score / data.max) * 100) : 0;
    const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
    const flag = data.issues > 0 ? ` ⚠️ ${data.issues} issue(s)` : ' ✅';
    console.log(`  ${area.padEnd(22)} ${bar} ${data.score}/${data.max}${flag}`);
  }
  console.log();

  // Step 5: Print issues
  if (result.issues.length > 0) {
    console.log('── Issues ─────────────────────────────────────────────────');
    const errors = result.issues.filter(i => i.severity === 'error');
    const warnings = result.issues.filter(i => i.severity === 'warning');
    const infos = result.issues.filter(i => i.severity === 'info');

    if (errors.length > 0) {
      console.log(`\n❌ ERRORS (${errors.length}):`);
      for (const issue of errors) {
        const page = result.pageSummaries[issue.pageIndex];
        console.log(`  [Page ${issue.pageIndex + 1}: ${page?.label || 'Unknown'}] ${issue.type}: ${issue.message}`);
        if (issue.detail) console.log(`    Detail: ${issue.detail}`);
      }
    }

    if (warnings.length > 0) {
      console.log(`\n⚠️ WARNINGS (${warnings.length}):`);
      for (const issue of warnings) {
        const page = result.pageSummaries[issue.pageIndex];
        console.log(`  [Page ${issue.pageIndex + 1}: ${page?.label || 'Unknown'}] ${issue.type}: ${issue.message}`);
      }
    }

    if (infos.length > 0) {
      console.log(`\nℹ️ INFO (${infos.length}):`);
      for (const issue of infos) {
        console.log(`  [Page ${issue.pageIndex + 1}] ${issue.type}: ${issue.message}`);
      }
    }
    console.log();
  } else {
    console.log('✅ No issues found!');
    console.log();
  }

  // Step 6: Print page summaries
  console.log('── Page Summaries ─────────────────────────────────────────');
  for (const summary of result.pageSummaries) {
    const status = summary.passed ? '✅' : summary.errors > 0 ? '❌' : '⚠️';
    console.log(`  ${status} Page ${summary.pageIndex + 1}: ${summary.label} (${summary.templateType}) — ${summary.errors}E/${summary.warnings}W`);
  }
  console.log();

  // Step 7: Print screen list for visual QA reference
  console.log('── Screen List (for Visual QA) ────────────────────────────');
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;
    const schema = page.schema;
    const blocks = schema?.blocks ?? [];
    const blockTypes = blocks.map(b => b.type).join(', ');
    console.log(`  ${(i + 1).toString().padStart(2, ' ')}. ${page.label.padEnd(40)} [${page.templateType}] → ${blockTypes}`);
  }
  console.log();

  // Step 8: Verdict
  console.log('═══════════════════════════════════════════════════════════');
  const targetScore = 90;
  const errorCount = result.issues.filter(i => i.severity === 'error').length;
  const passes = result.score >= targetScore && errorCount === 0;
  
  if (passes) {
    console.log(`✅ PASSES QUALITY GATE (score: ${result.score} >= ${targetScore}, errors: ${errorCount})`);
  } else {
    console.log(`❌ DOES NOT PASS QUALITY GATE (score: ${result.score} < ${targetScore} or errors: ${errorCount} > 0)`);
    if (result.score < targetScore) {
      console.log(`   Score deficit: ${targetScore - result.score} points needed`);
    }
    if (errorCount > 0) {
      console.log(`   Must fix ${errorCount} error(s) before publishing`);
    }
  }
  console.log('═══════════════════════════════════════════════════════════');

  process.exit(passes ? 0 : 1);
}

main();
