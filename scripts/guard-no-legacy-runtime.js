#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// V5-HARDENING-01 — Recursive no-legacy-runtime guard
// ═══════════════════════════════════════════════════════════════
// V5-AUDIT-001: Previous guard only scanned page.tsx + product-v5/.
// That was insufficient because CleanEditorV5 imports from
// mpi-workspace-v2/, which itself might transitively import legacy.
//
// This guard traces the FULL import graph starting from page.tsx
// using a TypeScript-aware import resolver. For each file in the
// graph, it checks for forbidden legacy symbols.
//
// Strategy:
//   1. Start from src/app/page.tsx (entry)
//   2. Recursively resolve imports using regex + path resolution
//   3. For each visited file, scan for forbidden patterns
//   4. Print the full allowed dependency chain
//   5. Fail if any forbidden pattern is found in any visited file
//
// Limitations (acknowledged):
//   - Regex-based import extraction (not full TS AST). Sufficient
//     for catching `import X from 'path'` and `require('path')` and
//     `import('path')` dynamic imports.
//   - Does NOT follow type-only imports (`import type {X} from 'y'`)
//     because they don't appear in runtime.
//   - Skips node_modules (external deps are trusted).
//   - Skips test files (*.{test,spec}.{ts,tsx} and __tests__/).
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_ROOT = path.resolve(PROJECT_ROOT, 'src');
const ENTRY = path.resolve(SRC_ROOT, 'app/page.tsx');

// Forbidden legacy symbols — must not appear in any file in the
// runtime import graph.
const FORBIDDEN_PATTERNS = [
  { name: 'MpiEditorShell', pattern: /\bMpiEditorShell\b/, reason: 'old MPI editor shell' },
  { name: 'CanvaBuilder-import', pattern: /from\s+['"][^'"]*CanvaBuilder['"]|require\(['"][^'"]*CanvaBuilder['"]\)/, reason: 'old 3-panel CanvaBuilder editor import' },
  { name: 'AdvancedEditor', pattern: /\bAdvancedEditor\b|advanced-editor/, reason: 'advanced editor (never built, must not re-introduce)' },
  { name: 'html-templates', pattern: /from\s+['"][^'"]*html-templates['"]|require\(['"][^'"]*html-templates['"]\)/, reason: 'legacy export html-templates module' },
  { name: 'TOKEN_COLORS', pattern: /\bTOKEN_COLORS\b/, reason: 'legacy hardcoded TOKEN_COLORS' },
  { name: 'AuthoringTool-import', pattern: /from\s+['"][^'"]*authoring\/AuthoringTool['"]|require\(['"][^'"]*authoring\/AuthoringTool['"]\)/, reason: 'AuthoringTool legacy (replaced by ProductShell)' },
  { name: 'teacherMode-branch', pattern: /teacherMode\s*&&|teacherMode\s*\?/, reason: 'teacherMode-based runtime branching (forbidden in V5)' },
];

// ── Path resolution ────────────────────────────────────────────

function resolveImport(importPath, fromFile) {
  // Skip external (node_modules) imports
  if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
    return null;
  }
  // Normalize @/ alias → src/
  let normalized;
  if (importPath.startsWith('@/')) {
    normalized = path.join(SRC_ROOT, importPath.slice(2));
  } else {
    normalized = path.resolve(path.dirname(fromFile), importPath);
  }
  // Try with extensions
  const exts = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
  for (const ext of exts) {
    const candidate = normalized + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

// Extract import paths from a file's source code.
function extractImports(source) {
  const imports = new Set();
  // Static imports: import X from 'path'
  // Side-effect imports: import 'path'
  // Dynamic imports: import('path') → also followed (runtime chunk)
  // require('path')
  // Re-exports: export { X } from 'path' / export * from 'path'
  const patterns = [
    /import\s+[^'";]*?from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
    /export\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /export\s+\*\s+from\s+['"]([^'"]+)['"]/g,
  ];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(source)) !== null) {
      imports.add(m[1]);
    }
  }
  return Array.from(imports);
}

// ── Graph traversal ────────────────────────────────────────────

const visited = new Map(); // path → { imports: string[], violations: [] }
const queue = [ENTRY];

function isTestFile(filePath) {
  return (
    /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath) ||
    filePath.includes(`${path.sep}__tests__${path.sep}`)
  );
}

function scanFile(filePath) {
  if (visited.has(filePath)) return;
  if (isTestFile(filePath)) {
    visited.set(filePath, { imports: [], violations: [], skipped: 'test file' });
    return;
  }
  if (!fs.existsSync(filePath)) {
    visited.set(filePath, { imports: [], violations: [], skipped: 'not found' });
    return;
  }
  const source = fs.readFileSync(filePath, 'utf-8');
  const importPaths = extractImports(source);
  const resolved = importPaths
    .map((p) => resolveImport(p, filePath))
    .filter((p) => p !== null);

  const violations = [];
  for (const { name, pattern, reason } of FORBIDDEN_PATTERNS) {
    const lines = source.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
      if (pattern.test(line)) {
        violations.push({
          rule: name,
          reason,
          line: idx + 1,
          snippet: line.trim().slice(0, 100),
        });
      }
    });
  }

  visited.set(filePath, { imports: resolved, violations });
  for (const r of resolved) {
    if (!visited.has(r)) queue.push(r);
  }
}

// BFS through the import graph
while (queue.length > 0) {
  const next = queue.shift();
  scanFile(next);
}

// ── Reporting ─────────────────────────────────────────────────

console.log('══════════════════════════════════════════════════════════════');
console.log('V5-HARDENING-01 — Recursive no-legacy-runtime guard');
console.log('══════════════════════════════════════════════════════════════');
console.log(`Entry: ${path.relative(PROJECT_ROOT, ENTRY)}`);
console.log(`Files in runtime import graph: ${visited.size}`);
console.log('');

// Print dependency chain
console.log('─── Runtime dependency chain (allowed) ───');
const sorted = Array.from(visited.keys()).sort();
for (const f of sorted) {
  const rel = path.relative(PROJECT_ROOT, f);
  const info = visited.get(f);
  if (info.skipped) {
    console.log(`  ${rel}  [skipped: ${info.skipped}]`);
  } else {
    console.log(`  ${rel}`);
    for (const imp of info.imports) {
      console.log(`    → ${path.relative(PROJECT_ROOT, imp)}`);
    }
  }
}
console.log('');

// Collect violations
let allViolations = [];
for (const [file, info] of visited) {
  for (const v of info.violations) {
    allViolations.push({ file: path.relative(PROJECT_ROOT, file), ...v });
  }
}

if (allViolations.length === 0) {
  console.log('✅ PASS — recursive guard found no legacy runtime imports.');
  console.log('');
  console.log(`Runtime import graph (${visited.size} files) is clean:`);
  console.log('  src/app/page.tsx → ProductShell → V5 components →');
  console.log('  mpi-workspace-v2/* (schema-canonical) → PageRenderer →');
  console.log('  SchemaScreenRenderer (official renderer)');
  console.log('');
  console.log('No legacy symbols (MpiEditorShell, CanvaBuilder, AdvancedEditor,');
  console.log('html-templates, TOKEN_COLORS, AuthoringTool, teacherMode-branch)');
  console.log('appear anywhere in the runtime import graph.');
  process.exit(0);
} else {
  console.log(`❌ FAIL — ${allViolations.length} violation(s) in runtime graph:`);
  console.log('');
  allViolations.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.file}:${v.line}`);
    console.log(`     Rule: ${v.rule} — ${v.reason}`);
    console.log(`     Line: ${v.snippet}`);
    console.log('');
  });
  console.log('To fix: remove the legacy import / branch from the file.');
  console.log('Legacy files can still EXIST in src/ but must not be in the');
  console.log('runtime import graph starting from src/app/page.tsx.');
  process.exit(1);
}
