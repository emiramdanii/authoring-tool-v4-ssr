// ═══════════════════════════════════════════════════════════════════
// SANITIZE — Single-source HTML/URL sanitizers for Sprint 9.0C
// ═══════════════════════════════════════════════════════════════════
// Sprint 9.0C — Export Security & dangerouslySetInnerHTML Audit.
//
// This module is the single source of truth for raw-HTML-sink sanitization
// across the authoring tool. Three concerns are addressed:
//
//   1. sanitizeHtmlForRender(html) — for client-side dangerouslySetInnerHTML
//      sinks (DefBox step content, InlineTextEditor non-editing display).
//      Preserves a small allowlist of formatting tags (strong, em, br, ...)
//      while stripping <script>, on* handlers, javascript:/vbscript: URLs,
//      and the style attribute (which can carry expression()/url(javascript:)
//      in legacy contexts). The previous implementation in
//      src/core/renderer/blocks/RichText.tsx had gaps around src=
//      javascript:, <object>/<embed>/<svg>, and the style attribute.
//
//   2. sanitizeIconOrEmoji(value) — for export HTML template-literal
//      interpolations like ${icon} and ${emoji}. Icons/emojis are display
//      text (Unicode codepoints or short strings), not HTML. They MUST be
//      HTML-escaped so a teacher typing <script>alert(1)</script> into an
//      icon field cannot inject executable HTML into the exported file.
//      Emoji pass through unchanged because they are plain Unicode.
//
//   3. sanitizeUrl(url) — strips dangerous URL schemes (javascript:, vbscript:,
//      data:text/html, etc.) before a URL is placed into href/src attributes.
//      Currently used by safeRichText/defensive paths. Whitespace and control
//      chars inside the scheme are collapsed to defeat "java\tscript:" tricks.
//
// NOT IN SCOPE (out-of-sprint refactor):
//   - escapeHtml() in src/lib/export/utils.ts — kept as-is (well-tested,
//     used by export pipeline). The sanitizer below calls a local copy of
//     the same logic so it can be used outside the export module graph.
//   - safeRichText() in src/lib/export/block-renderers.ts — kept as-is
//     (allowlist-based, already safe).
//   - serializeForHtmlScript() in src/lib/export/serialize-html-script.ts
//     — frozen, do not touch.
//
// No external dependencies (no DOMPurify, no sanitize-html). Per Sprint
// 9.0C scope: "Jangan tambah dependency baru kecuali benar-benar perlu
// dan aman." The in-house allowlist approach is sufficient for the
// teacher-authored content threat model.
// ═══════════════════════════════════════════════════════════════════

// ── Local escapeHtml (mirror of src/lib/export/utils.ts escapeHtml) ──
// Kept local so this module is importable from contexts that don't want
// to pull the entire export module graph (e.g. client-side React).
function escapeHtmlLocal(str: string): string {
  if (typeof str !== 'string') {
    str = str == null ? '' : String(str);
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── 1. sanitizeHtmlForRender ──────────────────────────────────────

/**
 * Allowlist of tags that may pass through sanitizeHtmlForRender.
 * Anything not in this list is stripped (tag removed, text content kept).
 */
const RENDER_ALLOWED_TAGS = new Set([
  'strong', 'em', 'b', 'i', 'u', 'br', 'span', 'sub', 'sup', 'mark', 'small',
]);

/**
 * Allowlist of attributes that may pass through on allowed tags.
 * Anything not in this list is stripped from the tag.
 *
 * Note: 'style' is intentionally NOT allowed. Style attributes can carry
 * CSS expressions in legacy IE contexts and url(javascript:...) payloads
 * in some browsers. The risk/benefit tradeoff for teacher content is not
 * worth it — teachers don't need inline styles in def-box content.
 */
const RENDER_ALLOWED_ATTRS = new Set([]);

/**
 * Tags whose CONTENT must be removed entirely (not just the tag).
 * These tags can carry executable payloads even when the tag itself is
 * "stripped" — e.g. <script>alert(1)</script> stripped to "alert(1)"
 * is still safe, but <svg onload="..."> stripped to "" is safer.
 *
 * For <script> and <style>, we strip both tag AND content. For others,
 * we strip just the tag (allowlist filter handles the rest).
 *
 * <style> is included because CSS can carry url(javascript:...) payloads
 * in older browsers and expression() in legacy IE. Even modern browsers
 * can be tricked via @import and font-face — safest to strip content.
 */
const RENDER_STRIP_CONTENT_TAGS = /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi;

/**
 * Sanitize HTML for dangerouslySetInnerHTML sinks on the client side.
 *
 * Strategy:
 *   1. Remove <script>...</script> blocks entirely (tag + content).
 *   2. Remove HTML comments <!-- ... --> entirely.
 *   3. Tokenize the remaining HTML into tag/non-tag chunks.
 *   4. For each tag:
 *      - If tag name is in RENDER_ALLOWED_TAGS, keep it but strip ALL
 *        attributes (no on*, no style, no href, no src — defense in depth).
 *      - If tag name is NOT in allowlist, drop the tag entirely but
 *        preserve any text content between open/close.
 *   5. Non-tag chunks (including stray < chars) are kept as-is.
 *
 * Edge cases handled:
 *   - <img src=x onerror=alert(1)> → stripped (img not in allowlist)
 *   - <a href="javascript:alert(1)"> → stripped (a not in allowlist)
 *   - <strong onclick="alert(1)">bold</strong> → <strong>bold</strong>
 *   - <span style="background:url(javascript:...)">x</span> → <span>x</span>
 *   - <script>alert(1)</script> → "" (content removed)
 *   - <!-- comment --> → "" (removed entirely)
 *   - Plain text "5 < 10 && 3 > 1" → unchanged (stray < treated as text)
 */
export function sanitizeHtmlForRender(html: string): string {
  if (!html) return '';

  // Step 1: Strip <script>...</script> blocks entirely (tag + content).
  // Case-insensitive, handles attributes on the opening tag.
  let s = html.replace(RENDER_STRIP_CONTENT_TAGS, '');

  // Step 2: Strip HTML comments <!-- ... --> entirely (including content).
  // Non-greedy match; handles multi-line comments.
  s = s.replace(/<!--[\s\S]*?-->/g, '');

  // Step 3: Tokenize. Match either a tag, a comment/declaration, a stray <,
  // or a run of non-< text.
  //   - <\/?[a-zA-Z][^>]*>?  → opening/closing tag (must start with letter)
  //   - <![^>]*>?            → declaration like <!DOCTYPE ...> (drop)
  //   - <                    → stray < (treat as text)
  //   - [^<]+                → run of non-< text
  const tokenPattern = /<\/?[a-zA-Z][^>]*>?|<![^>]*>?|<|[^<]+/g;
  s = s.replace(tokenPattern, (token) => {
    if (token === '<') {
      // Stray < — keep as text (don't drop, it's math/comparison context)
      return '<';
    }
    if (!token.startsWith('<')) {
      // Text content — pass through unchanged.
      return token;
    }
    // It's a tag or declaration. Drop declarations (<!...).
    if (token.startsWith('<!')) {
      return '';
    }
    // Extract tag name (lowercased). Handles <tag>, </tag>, <tag/>, <tag attr=...>.
    const nameMatch = token.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
    if (!nameMatch) {
      // Malformed — drop it.
      return '';
    }
    const tagName = nameMatch[1].toLowerCase();
    if (!RENDER_ALLOWED_TAGS.has(tagName)) {
      // Not in allowlist — drop the tag, keep text content (which is in
      // subsequent tokens). For self-closing unknown tags like <img/>,
      // this drops the whole tag.
      return '';
    }
    // Allowed tag — reconstruct without any attributes.
    // <strong onclick="x"> → <strong>, </strong> → </strong>, <br/> → <br>.
    const isClosing = token.startsWith('</');
    if (isClosing) {
      return `</${tagName}>`;
    }
    // Self-closing or opening — emit as bare tag.
    // For <br>, emit <br> (HTML5 style). For others, emit <tag>.
    if (tagName === 'br') return '<br>';
    return `<${tagName}>`;
  });

  return s;
}

// ── 2. sanitizeIconOrEmoji ────────────────────────────────────────

/**
 * Sanitize a value used as an icon/emoji in export HTML template literals.
 *
 * Icons and emojis are DISPLAY TEXT — they should never contain HTML.
 * If a teacher types "<script>alert(1)</script>" into an icon field in
 * the guided editor (icon fields are plain TextFields — see
 * src/components/canva/right-panel/block-properties/field-registry.tsx),
 * that string would otherwise be interpolated raw into the exported
 * HTML and execute when the file is viewed.
 *
 * This function HTML-escapes the input so:
 *   - Plain emoji ("📖", "🔥", "✅") pass through unchanged
 *     (emoji are Unicode codepoints, not HTML).
 *   - Plain short text ("Step 1", "Option A") passes through unchanged.
 *   - HTML payloads ("<script>...</script>", "<img onerror=...>") become
 *     inert escaped text ("&lt;script&gt;...&lt;/script&gt;") that render
 *     as literal visible text in the export — no XSS.
 *
 * Empty/null/undefined input returns ''.
 */
export function sanitizeIconOrEmoji(value: unknown): string {
  if (value == null) return '';
  const str = typeof value === 'string' ? value : String(value);
  return escapeHtmlLocal(str);
}

// ── 3. sanitizeUrl ────────────────────────────────────────────────

/**
 * Dangerous URL schemes that must NEVER appear in href/src attributes.
 * Matched case-insensitively after stripping ALL whitespace and control
 * characters (defeats "java\tscript:", "Java\nScript:", etc.).
 */
const DANGEROUS_SCHEMES = /^(javascript|vbscript|data:text\/html|data:application\/x-javascript|data:application\/javascript)/i;

/**
 * Sanitize a URL for safe embedding in href/src attributes.
 *
 * Returns '' (empty) for URLs that:
 *   - Are null/undefined/empty/non-string
 *   - Use a dangerous scheme (javascript:, vbscript:, data:text/html, etc.)
 *   - Start with whitespace + dangerous scheme after collapsing
 *
 * Returns the original URL (trimmed) for:
 *   - http://, https://, mailto:, tel:, #anchor, /relative, ../relative
 *   - data:image/* (images — png/jpeg/gif/webp/svg+xml; SVG would be
 *     blocked at upload time per Sprint 8.5C, so this is safe here)
 *
 * Whitespace and control characters between scheme and colon are
 * collapsed BEFORE scheme detection. This catches "java\tscript:" and
 * "java\nscript:" tricks. The returned URL is the trimmed original
 * (whitespace is preserved in output for legitimate URLs that happen
 * to have leading/trailing spaces — they get trimmed).
 *
 * Note: this function does NOT escape HTML entities in the URL. The
 * caller is responsible for HTML-escaping the result if it is being
 * interpolated into an HTML attribute (most call sites use
 * escapeHtml() on the whole attribute value).
 */
export function sanitizeUrl(url: unknown): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Collapse ALL whitespace and control chars (0x00-0x20) for scheme check.
  // This defeats "java\tscript:", "java\nscript:", "java\x00script:".
  const schemeCheck = trimmed.replace(/[\s\x00-\x1f]+/g, '').toLowerCase();

  if (DANGEROUS_SCHEMES.test(schemeCheck)) {
    return '';
  }

  return trimmed;
}

// ── 4. escapeHtml (re-export for symmetry) ────────────────────────

/**
 * HTML-escape a string. Use this for any user-controlled text being
 * interpolated into an HTML template literal.
 *
 * Escapes: & < > " '
 *   &  → &amp;
 *   <  → &lt;
 *   >  → &gt;
 *   "  → &quot;
 *   '  → &#39;
 *
 * Null/undefined/non-string input returns ''.
 *
 * This is the canonical escape for Sprint 9.0C. The export pipeline
 * has its own escapeHtml in src/lib/export/utils.ts (which does NOT
 * escape single quotes — that's a known minor gap there that we are
 * NOT changing in this sprint to avoid export regression). This
 * canonical version DOES escape single quotes for safer attribute
 * interpolation in non-export contexts.
 */
export function escapeHtml(str: unknown): string {
  if (typeof str !== 'string') {
    if (str == null) return '';
    return escapeHtmlLocal(String(str));
  }
  return escapeHtmlLocal(str);
}
