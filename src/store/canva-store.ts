// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Backward-compatible re-export
// ═══════════════════════════════════════════════════════════════
// This file is kept for backward compatibility.
// All logic has been split into src/store/canva/ modules.
// Consumers can continue to import from '@/store/canva-store'.

export { useCanvaStore } from './canva/store';
export type { CanvaState, Snapshot } from './canva/types';
export { createPage, createElId, MAX_HISTORY, CANVA_STORAGE_KEY } from './canva/constants';
