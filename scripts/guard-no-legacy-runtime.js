#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// V5 GUARD: no-legacy-runtime
// ═══════════════════════════════════════════════════════════════
// Fails if the runtime entry (src/app/page.tsx + src/components/product-v5/)
// imports any legacy editor / renderer / export path.
//
// Legacy symbols that MUST NOT appear in runtime imports:
//   - MpiEditorShell        (old MPI editor shell)
//   - CanvaBuilder          (old 3-panel editor — only allowed in
//                            src/components/canva/CanvaBuilder.tsx itself,
//                            which is no longer imported by runtime)
//   - AdvancedEditor        (advanced editor — never built, but guard
//                            against future re-introduction)
//   - html-templates        (legacy export HTML template module)
//   - TOKEN_COLORS          (legacy hardcoded color tokens)
//
// Runtime entry points checked:
//   - src/app/page.tsx
//   - src/components/product-v5/**/*
//
// Allowed: legacy files can still EXIST in repo (for backup / reference),
// they just can't be IMPORTED by the runtime entry chain.
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const RUNTIME_PATHS = [
  'src/app/page.tsx',
  'src/components/product-v5',
];

const FORBIDDEN_PATTERNS = [
  // Legacy editor shells
  { name: 'MpiEditorShell', pattern: /MpiEditorShell/, reason: 'old MPI editor shell' },
  { name: 'CanvaBuilder', pattern: /\bCanvaBuilder\b/, reason: 'old 3-panel editor (CanvaBuilder)' },
  { name: 'AdvancedEditor', pattern: /AdvancedEditor|advanced-editor/, reason: 'advanced editor (not built, must not re-introduce)' },
  // Legacy export
  { name: 'html-templates', pattern: /from\s+['"][^'"]*html-templates['"]|require\(['"][^'"]*html-templates['"]\)/, reason: 'legacy export html-templates module' },
  // Legacy color tokens
  { name: 'TOKEN_COLORS', pattern: /\bTOKEN_COLORS\b/, reason: 'legacy hardcoded TOKEN_COLORS' },
  // Legacy authoring tool (no longer runtime entry)
  { name: 'AuthoringTool', pattern: /from\s+['"][^'"]*authoring\/AuthoringTool['"]/, reason: 'AuthoringTool legacy (replaced by ProductShell)' },
  // Legacy teacher mode branching at runtime (store-internal use is OK,
  // but runtime components must not branch on teacherMode)
  { name: 'teacherMode-branch', pattern: /teacherMode\s*&&|teacherMode\s*\?/, reason: 'teacherMode-based runtime branching (forbidden in V5)' },
];

function listFiles(target) {
  const full = path.resolve(PROJECT_ROOT, target);
  if (!fs.existsSync(full)) return [];
  const stat = fs.statSync(full);
  if (stat.isFile()) return [full];
  if (stat.isDirectory()) {
    const out = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) out.push(p);
      }
    };
    walk(full);
    return out;
  }
  return [];
}

function checkFile(filePath) {
  const rel = path.relative(PROJECT_ROOT, filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const violations = [];
  for (const { name, pattern, reason } of FORBIDDEN_PATTERNS) {
    // Skip comments — only check code lines
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      // Skip single-line comments
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
      if (pattern.test(line)) {
        violations.push({
          file: rel,
          line: idx + 1,
          rule: name,
          reason,
          snippet: line.trim().slice(0, 100),
        });
      }
    });
  }
  return violations;
}

console.log('══════════════════════════════════════════════════════════════');
console.log('V5 GUARD: no-legacy-runtime');
console.log('══════════════════════════════════════════════════════════════');
console.log(`Project root: ${PROJECT_ROOT}`);
console.log(`Runtime paths checked:`);
RUNTIME_PATHS.forEach((p) => console.log(`  - ${p}`));
console.log('');

const allFiles = RUNTIME_PATHS.flatMap(listFiles);
console.log(`Files scanned: ${allFiles.length}`);
allFiles.forEach((f) => console.log(`  - ${path.relative(PROJECT_ROOT, f)}`));
console.log('');

let allViolations = [];
for (const f of allFiles) {
  allViolations = allViolations.concat(checkFile(f));
}

if (allViolations.length === 0) {
  console.log('✅ PASS — no legacy runtime imports detected.');
  console.log('');
  console.log('Runtime entry chain is clean:');
  console.log('  src/app/page.tsx → ProductShell → V5 components only.');
  process.exit(0);
} else {
  console.log(`❌ FAIL — ${allViolations.length} violation(s) detected:`);
  console.log('');
  allViolations.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.file}:${v.line}`);
    console.log(`     Rule: ${v.rule} — ${v.reason}`);
    console.log(`     Line: ${v.snippet}`);
    console.log('');
  });
  console.log('To fix: remove the legacy import / branch from the runtime file.');
  console.log('Legacy files can still exist in src/legacy-disabled/ or as dead code,');
  console.log('but the runtime entry chain (page.tsx + product-v5/) must be clean.');
  process.exit(1);
}
