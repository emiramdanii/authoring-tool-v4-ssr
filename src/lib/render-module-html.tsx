// ═══════════════════════════════════════════════════════════════════
// RENDER-MODULE-HTML.TSX — Thin bridge for backward compatibility
// All actual rendering is in @/lib/render-module
// ═══════════════════════════════════════════════════════════════════

export { renderModuleToStyledHTML, renderModulesToStyledHTML, renderModuleToHTML, renderModulesToHTML } from './render-module';
export type { LayoutVariant, M, ModuleTypeMeta } from './render-module';
