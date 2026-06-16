// ═══════════════════════════════════════════════════════════════════════
// HTML-SAFE JSON SERIALIZER — CANONICAL SECURITY BOUNDARY
// ═══════════════════════════════════════════════════════════════════════
// Sprint 6.4-E1-QA2: Created. Sprint 6.4-F: Frozen.
//
// Serializes JSON for safe embedding inside HTML <script> tags.
//
// OWASP XSS Prevention Cheat Sheet — Rule #3:
// "Data must be JavaScript-encoded before being inserted into
//  JavaScript data values in HTML <script> elements."
//
// The key attack vector: </script> in JSON data can terminate the
// <script> element before the browser's JS parser runs, allowing
// injection of arbitrary HTML elements (new <script>, <img onerror>,
// etc.) that execute before React even starts.
//
// This serializer prevents ALL known script-termination attacks:
//   < → \u003c   (prevents </script> and <script> tag formation)
//   > → \u003e   (prevents closing tag formation)
//   / → \u002f   (belt-and-suspenders: the / in </script>)
//   & → \u0026   (defense in depth: & can introduce HTML entities)
//   U+2028 → \u2028 (Line Separator — breaks JS string literals pre-ES2019)
//   U+2029 → \u2029 (Paragraph Separator — same)
//
// Note: JSON.stringify() in current Node.js (v24) does NOT escape
// U+2028/U+2029. While ES2019+ browsers handle them correctly in
// string literals, explicit escaping ensures:
//   1. Safety in older browsers
//   2. OWASP compliance
//   3. No silent breakage if the runtime changes
//
// ⛔ FREEZE INVARIANTS (Sprint 6.4-F):
//
//   1. No export route may use JSON.stringify() directly for HTML
//      <script> injection. All routes MUST use this function.
//
//   2. No second serializer with different escaping rules may be
//      created. This is the single canonical security boundary.
//
//   3. Any change to the 6 replacement rules below MUST pass the
//      full security regression suite in:
//        src/__tests__/export-serialization-boundary.test.ts
//      specifically Section 10 (serializer freeze guard).
//
//   4. Adding a new replacement rule is permitted ONLY if it fixes
//      a demonstrated vulnerability and the full suite still passes.
//
//   5. Removing or weakening an existing replacement rule is FORBIDDEN.
//
//   6. All new routes that produce standalone HTML MUST use this
//      function via the canonical import from @/lib/export or
//      @/lib/export/serialize-html-script. No alternative import
//      path or copy-paste of the logic is acceptable.
//
// Reference: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
// ═══════════════════════════════════════════════════════════════════════

/**
 * Serialize a value as JSON that is safe to embed inside an HTML
 * <script> tag. The output, when placed in:
 *
 *   <script>window.__DATA__=${serializeForHtmlScript(data)};</script>
 *
 * will NOT allow the data to break out of the script element,
 * regardless of what characters the data contains.
 *
 * The serialized value round-trips correctly:
 *   JSON.parse(output) === originalValue
 */
export function serializeForHtmlScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
