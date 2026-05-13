// ═══════════════════════════════════════════════════════════════════════
// CLIENT-SIDE EXPORT — Re-export barrel
// ═══════════════════════════════════════════════════════════════════════
// This file has been refactored into modular files under ./export/
// for maintainability. All public APIs are re-exported here for
// backward compatibility.
// ═══════════════════════════════════════════════════════════════════════

export {
  generateClientExportHtml,
  generateExportFilename,
  type ClientExportPayload,
  escapeHtml,
  resolveColor,
  TOKEN_COLORS,
  renderBlockHtml,
} from './export';
