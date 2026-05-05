// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Public API (re-exports for backward compatibility)
// ═══════════════════════════════════════════════════════════════
// Import path: @/store/canva-store or @/store/canva
// Both work — canva-store.ts re-exports from here.

export { useCanvaStore } from './store';
export type { CanvaState, Snapshot } from './types';
export { createPage, createElId, MAX_HISTORY, CANVA_STORAGE_KEY } from './constants';
export { autoGenerateContent } from './auto-generate';
export type { AutoGenerateSlice } from './auto-generate';
