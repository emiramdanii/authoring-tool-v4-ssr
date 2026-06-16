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
