// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Public API (barrel)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.1 — Style Contract Audit & Consolidation
//
// Single import surface for the Style Contract system.
// Consumers should import from '@/core/style' — never from individual
// files. This keeps the module boundary stable across sprints.
// ═══════════════════════════════════════════════════════════════════

export * from './types';
export * from './defaults';
export * from './preset-registry';
export * from './resolve-style-contract';
export * from './legacy-style-adapter';
// Sprint 8.2A — Page → StyleContract adapter + shared consumer helper.
// Canvas and Preview MUST both import resolvePageStyleTokens() from here.
export * from './page-style-adapter';
export * from './consumer';
// Sprint 8.2A — Explicit Canvas/Preview entry points for the parity
// test. Both delegate to resolvePageStyleTokens() with no extra logic.
export * from './consumer-entry-points';
