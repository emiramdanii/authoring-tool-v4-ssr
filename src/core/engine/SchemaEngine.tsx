// ═══════════════════════════════════════════════════════════════════
// SCHEMA ENGINE — Barrel re-export for utility functions
// ═══════════════════════════════════════════════════════════════════
// Sprint 4 (Engine): Removed the unused React component that was
// creating a parallel render path (SchemaEngine → SchemaScreenRenderer).
// The actual rendering pipeline goes through PageRenderer → SchemaScreenRenderer.
//
// This parallel path was dead code — never rendered in the application.
// Only the utility function re-exports are kept, which come from the
// renderer-free SchemaEngine.utils.ts module.
//
// NOTE: DO NOT import this file from store modules to avoid circular
// dependencies. Import from SchemaEngine.utils.ts directly instead.
// ═══════════════════════════════════════════════════════════════════

// Re-export utility functions from the renderer-free module
export { loadPreset, getAvailablePresets, schemaToCanvaPages } from './SchemaEngine.utils';
