// ═══════════════════════════════════════════════════════════════
// EXPORT-HTML — Barrel file re-exporting all public API
// Maintains backward compatibility with `import { ... } from '@/lib/export-html'`
// ═══════════════════════════════════════════════════════════════

export type { ExportState } from './types';
export { generateExportHtml } from './generate-export-html';
export { generatePrintAdminHtml } from './generate-print-admin-html';
