// ═══════════════════════════════════════════════════════════════
// UTILS — Shared HTML entity escaping helper
// ═══════════════════════════════════════════════════════════════

/** Escape HTML entities in a string to prevent XSS in generated output */
export function esc(str: string | number | null | undefined): string {
  if (str == null) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
