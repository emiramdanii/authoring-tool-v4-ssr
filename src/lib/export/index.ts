// ═══════════════════════════════════════════════════════════════════════
// EXPORT INDEX — Sprint 6.4-F Freeze
// ═══════════════════════════════════════════════════════════════════════
// Sprint 6.4-F: Legacy client-side export pipeline REMOVED.
//
// Deleted in this sprint:
//   - generateClientExportHtml() — only used by deprecated exportClientSide
//   - generateExportFilename() — only used by deprecated exportClientSide
//   - ClientExportPayload type — only used by legacy pipeline
//   - Re-exports of legacy renderer utilities (escapeHtml, resolveColor,
//     TOKEN_COLORS, renderBlockHtml, createExportRenderContext, etc.)
//   - All legacy renderer files (html-templates, styles, scripts,
//     quiz-renderers, block-renderers, game-renderers,
//     navigation-renderers, utils)
//
// The ONLY production export path is Vite SSR via /api/export.
// The ONLY export from this module is the canonical security serializer.
//
// ⛔ INVARIANT: serializeForHtmlScript() is the canonical security
// boundary. No route may use JSON.stringify() directly for HTML
// <script> injection. No second serializer with different rules
// may be created. Changes to this function MUST pass the security
// regression suite in export-serialization-boundary.test.ts.
//
// ⛔ ROLE: This file is the public entry point for the serializer
// only. Do NOT add export generators, HTML renderers, or payload
// types here. New export routes must import serializeForHtmlScript
// from this module or from ./serialize-html-script directly.
// ═══════════════════════════════════════════════════════════════════════

export { serializeForHtmlScript } from './serialize-html-script';
