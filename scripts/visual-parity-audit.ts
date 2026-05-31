// ═══════════════════════════════════════════════════════════════════
// VISUAL PARITY AUDIT SCRIPT — Compare HTML originals vs Canvas
// ═══════════════════════════════════════════════════════════════════
// Run: npx tsx scripts/visual-parity-audit.ts
// ═══════════════════════════════════════════════════════════════════

import { MACAM_NORMA_LESSON } from '../src/presets/ppkn/macam-norma-schema';
import { HAKIKAT_NORMA_LESSON } from '../src/presets/ppkn/hakikat-norma-schema';
import { runVisualParityCheck } from '../src/core/template/visual-audit/visual-parity-check';
import { resolveTokens } from '../src/core/themes/tokens';
import { resolveContractStyle } from '../src/core/template/contract/TemplateThemeContract';

console.log('═'.repeat(70));
console.log('  GOLDEN TEMPLATE VISUAL AUDIT');
console.log('  HTML Original vs Canvas Render Parity Check');
console.log('═'.repeat(70));

// ═══ Audit 1: Macam-Macam Norma ════════════════════════════════

console.log('\n📋 MEDIA 1: MACAM-MACAM NORMA');
console.log('─'.repeat(50));

const macamNormaResult = runVisualParityCheck({
  screens: MACAM_NORMA_LESSON.screens,
  themeId: MACAM_NORMA_LESSON.themeId,
  contractId: 'macam-norma',
});

console.log(`\n  Overall Visual Parity Score: ${macamNormaResult.score}/100`);
console.log(`  Typography:     ${macamNormaResult.typography.score}/100`);
console.log(`  Density:        ${macamNormaResult.density.score}/100`);
console.log(`  Hierarchy:      ${macamNormaResult.hierarchy.score}/100`);
console.log(`  Color:          ${macamNormaResult.colorConsistency.score}/100`);
console.log(`  Screen Weight:  ${macamNormaResult.screenWeight.score}/100`);

// Theme token comparison
console.log('\n  🎨 Token Comparison (HTML Original vs Theme Preset):');
const tokens = resolveTokens('macam-norma');
const htmlOriginal = {
  bg: '#0e1c2f', bg2: '#13243a', card: '#182d45', c: '#3ecfcf',
  text: '#e8f2ff', muted: '#6e90b5', y: '#f9c12e',
  nkesopanan: '#3ecfcf',
};

const tokenChecks = [
  { key: 'bg', theme: tokens.colors.bg, html: htmlOriginal.bg },
  { key: 'bg2', theme: tokens.colors.bg2, html: htmlOriginal.bg2 },
  { key: 'card', theme: tokens.colors.card, html: htmlOriginal.card },
  { key: 'c (accent)', theme: tokens.colors.c, html: htmlOriginal.c },
  { key: 'text', theme: tokens.colors.text, html: htmlOriginal.text },
  { key: 'muted', theme: tokens.colors.muted, html: htmlOriginal.muted },
  { key: 'y (gold)', theme: tokens.colors.y, html: htmlOriginal.y },
  { key: 'nkesopanan', theme: tokens.colors.nkesopanan || 'NOT SET', html: htmlOriginal.nkesopanan },
];

for (const check of tokenChecks) {
  const match = check.theme === check.html ? '✅' : '❌';
  console.log(`    ${match} ${check.key}: theme=${check.theme} html=${check.html}`);
}

// Contract color comparison
console.log('\n  📜 Contract Comparison (HTML Original vs MACAM_NORMA_CONTRACT):');
const contractCover = resolveContractStyle('macam-norma', 'cover', 'A');
const contractMateri = resolveContractStyle('macam-norma', 'materi', 'A');
const contractDiskusi = resolveContractStyle('macam-norma', 'diskusi', 'A');

console.log(`    Cover bg: ${contractCover.background} (expected #0e1c2f)`);
console.log(`    Cover card: ${contractCover.cardBg} (expected #182d45)`);
console.log(`    Cover accent: ${contractCover.accent} (expected #f9c12e)`);
console.log(`    Materi accent: ${contractMateri.accent} (expected #a78bfa)`);
console.log(`    Diskusi accent: ${contractDiskusi.accent} (expected #3ecfcf)`);
console.log(`    Accent map c: ${contractCover.accentTokenMap['c']} (expected #3ecfcf)`);

// Density per screen
console.log('\n  📊 Screen Density:');
for (const [id, chars] of Object.entries(macamNormaResult.density.details.totalCharsPerScreen)) {
  const cards = macamNormaResult.density.details.totalCardsPerScreen[id] || 0;
  const accord = macamNormaResult.density.details.totalAccordionsPerScreen[id] || 0;
  const overloaded = macamNormaResult.density.details.overloadedScreens.includes(id);
  const mark = overloaded ? '⚠️' : '  ';
  console.log(`    ${mark} ${id}: ${chars} chars, ${cards} cards, ${accord} accordion rows`);
}

// Screen weight
console.log('\n  ⚖️ Screen Weight:');
for (const [id, weight] of Object.entries(macamNormaResult.screenWeight.details.weights)) {
  const bar = '█'.repeat(Math.min(Math.round(weight), 30));
  console.log(`    ${id}: ${weight.toFixed(1)} ${bar}`);
}
console.log(`    Imbalance ratio: ${macamNormaResult.screenWeight.details.imbalance}x`);

// Issues
if (macamNormaResult.issues.length > 0) {
  console.log('\n  🚨 Issues Found:');
  for (const issue of macamNormaResult.issues) {
    const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`    ${icon} [${issue.category}] ${issue.screenId}: ${issue.message}`);
    if (issue.expected) console.log(`       Expected: ${issue.expected}`);
    if (issue.actual) console.log(`       Actual: ${issue.actual}`);
  }
}

// ═══ Audit 2: Hakikat Norma ════════════════════════════════════

console.log('\n\n📋 MEDIA 2: HAKIKAT NORMA');
console.log('─'.repeat(50));

const hakikatNormaResult = runVisualParityCheck({
  screens: HAKIKAT_NORMA_LESSON.screens,
  themeId: HAKIKAT_NORMA_LESSON.themeId,
  contractId: 'golden-pertemuan',
});

console.log(`\n  Overall Visual Parity Score: ${hakikatNormaResult.score}/100`);
console.log(`  Typography:     ${hakikatNormaResult.typography.score}/100`);
console.log(`  Density:        ${hakikatNormaResult.density.score}/100`);
console.log(`  Hierarchy:      ${hakikatNormaResult.hierarchy.score}/100`);
console.log(`  Color:          ${hakikatNormaResult.colorConsistency.score}/100`);
console.log(`  Screen Weight:  ${hakikatNormaResult.screenWeight.score}/100`);

// Theme token comparison
console.log('\n  🎨 Token Comparison (HTML Original vs Theme Preset):');
const hnTokens = resolveTokens('hakikat-norma');
const hnHtmlOriginal = {
  bg: '#0f172a', bg2: '#1e293b', card: 'rgba(255,255,255,0.06)', c: '#2563eb',
  text: '#ffffff', muted: '#64748b', y: '#fbbf24',
};

const hnTokenChecks = [
  { key: 'bg', theme: hnTokens.colors.bg, html: hnHtmlOriginal.bg },
  { key: 'bg2', theme: hnTokens.colors.bg2, html: hnHtmlOriginal.bg2 },
  { key: 'card', theme: hnTokens.colors.card, html: hnHtmlOriginal.card },
  { key: 'c (accent)', theme: hnTokens.colors.c, html: hnHtmlOriginal.c },
  { key: 'text', theme: hnTokens.colors.text, html: hnHtmlOriginal.text },
  { key: 'muted', theme: hnTokens.colors.muted, html: hnHtmlOriginal.muted },
  { key: 'y (gold)', theme: hnTokens.colors.y, html: hnHtmlOriginal.y },
];

for (const check of hnTokenChecks) {
  const match = check.theme === check.html ? '✅' : '❌';
  console.log(`    ${match} ${check.key}: theme=${check.theme} html=${check.html}`);
}

if (hakikatNormaResult.issues.length > 0) {
  console.log('\n  🚨 Issues Found:');
  for (const issue of hakikatNormaResult.issues) {
    const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`    ${icon} [${issue.category}] ${issue.screenId}: ${issue.message}`);
    if (issue.expected) console.log(`       Expected: ${issue.expected}`);
    if (issue.actual) console.log(`       Actual: ${issue.actual}`);
  }
}

// ═══ Summary ═══════════════════════════════════════════════════

console.log('\n\n' + '═'.repeat(70));
console.log('  SUMMARY');
console.log('═'.repeat(70));
console.log(`  Macam-Macam Norma: ${macamNormaResult.score}/100 parity`);
console.log(`  Hakikat Norma:     ${hakikatNormaResult.score}/100 parity`);

const bothPass = macamNormaResult.score >= 90 && hakikatNormaResult.score >= 90;
console.log(`\n  ${bothPass ? '✅' : '❌'} Visual Parity Target: ≥90%`);

if (!bothPass) {
  console.log('\n  ACTION ITEMS:');
  const allIssues = [...macamNormaResult.issues, ...hakikatNormaResult.issues];
  for (const issue of allIssues.filter(i => i.severity === 'error')) {
    console.log(`    ❌ [${issue.category}] ${issue.message}`);
  }
  for (const issue of allIssues.filter(i => i.severity === 'warning').slice(0, 5)) {
    console.log(`    ⚠️ [${issue.category}] ${issue.message}`);
  }
}

console.log('\n');
