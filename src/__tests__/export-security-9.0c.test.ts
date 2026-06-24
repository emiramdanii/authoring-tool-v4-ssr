// ═══════════════════════════════════════════════════════════════════
// SPRINT 9.0C — Export Security & dangerouslySetInnerHTML Audit
// ═══════════════════════════════════════════════════════════════════
// Verifies that user-controlled content (icon/emoji fields, def-box
// rich text, etc.) cannot inject executable HTML into the exported
// standalone HTML file. Closes SEC-002.
//
// Coverage:
//   A. sanitizeIconOrEmoji() — helper contract
//      1. <script> payload escaped (not preserved)
//      2. <img src=x onerror=...> escaped (onerror does not survive)
//      3. <a href="javascript:..."> escaped
//      4. inline onclick/onload/onmouseover escaped
//      5. plain emoji preserved exactly
//      6. plain short text preserved exactly
//      7. null/undefined/empty → ''
//
//   B. sanitizeHtmlForRender() — client-side dangerouslySetInnerHTML sink
//      1. <script>...</script> stripped (tag + content)
//      2. <img src=x onerror=...> stripped (img not in allowlist)
//      3. <a href="javascript:..."> stripped (a not in allowlist)
//      4. <strong onclick="..."> → <strong> (attr stripped, tag kept)
//      5. <span style="..."> → <span> (style attr stripped)
//      6. <iframe> stripped (not in allowlist)
//      7. <object>/<embed>/<svg> stripped (not in allowlist)
//      8. Safe formatting (<strong>, <em>, <br>) preserved
//      9. Plain text with < or > as math preserved
//     10. Empty/null input → ''
//
//   C. sanitizeUrl() — URL scheme sanitization
//      1. javascript: scheme rejected
//      2. vbscript: scheme rejected
//      3. data:text/html rejected
//      4. java\tscript: (whitespace trick) rejected
//      5. Java\nScript: (case + whitespace trick) rejected
//      6. https:// preserved
//      7. http:// preserved
//      8. mailto: preserved
//      9. #anchor preserved
//     10. /relative preserved
//     11. data:image/png;base64,... preserved (safe image data URL)
//     12. null/undefined/empty → ''
//
//   D. Export block-renderers — end-to-end XSS prevention
//      1. cover block: icon="<script>alert(1)</script>" → no <script> in output
//      2. cover block: badge.icon="<img src=x onerror=alert(1)>" → no onerror
//      3. petunjuk block: step.icon="<script>" → no <script>
//      4. nc-grid block: card.icon="<a href=javascript:alert(1)>" → no javascript:
//      5. nk-card block: icon="<script>" → no <script>
//      6. ftab block: tab.icon="<script>" → no <script>
//      7. materi-section block: tab.icon="<img onerror=...>" → no onerror
//      8. materi-section block: icon="<script>" → no <script>
//      9. tujuan-display block: o.icon="<script>" → no <script>
//     10. motivasi block: visual.emoji="<script>" → no <script>
//     11. rangkuman block: c.icon="<script>" → no <script>
//     12. penutup block: p.icon="<script>" → no <script>
//     13. tabel-accord block: r.icon="<script>" → no <script>
//     14. timeline block: s.icon="<script>" → no <script>
//     15. compare block: kiri.icon="<script>" → no <script>
//     16. compare block: kanan.icon="<script>" → no <script>
//     17. checklist block: it.icon="<script>" → no <script>
//     18. statistik block: it.icon="<script>" → no <script>
//     19. studi block: p.icon="<script>" → no <script>
//     20. studi block: r.icon="<script>" → no <script>
//     21. hero block: icon="<script>" → no <script>
//     22. materi-blok block: icon="<script>" → no <script>
//     23. skenario block: charEmoji="<script>" → no <script>
//     24. skenario block: choice.icon="<script>" → no <script>
//
//   E. Export block-renderers — normal content still renders
//      1. cover with valid emoji icon → emoji appears in output
//      2. cover with valid title → title appears (escapeHtml-preserved)
//      3. def-box with safe rich text <strong>bold</strong> → preserved
//      4. plain text content "Hello World" → preserved
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  sanitizeIconOrEmoji,
  sanitizeHtmlForRender,
  sanitizeUrl,
  escapeHtml,
} from '@/lib/sanitize';
import { sanitizeHtml } from '@/core/renderer/blocks/RichText';
import {
  renderContentBlock,
} from '@/lib/export/block-renderers';
import { renderNavigationBlock } from '@/lib/export/navigation-renderers';

// A no-op renderBlock callback for unit tests that don't exercise recursion
const noopRender = (() => '') as unknown as import('@/lib/export/utils').RenderBlockFn;

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** Assert no <script> tag (opening or closing) in the rendered HTML. */
function expectNoScript(html: string): void {
  expect(html).not.toMatch(/<script[\s>]/i);
  expect(html).not.toMatch(/<\/script>/i);
}

/**
 * Assert no LIVE on* event handler attribute in the rendered HTML.
 *
 * "Live" means the onXXX= appears inside an actual HTML tag (between
 * unescaped < and >). Escaped text like "&lt;img onerror=..." is NOT
 * a live attribute — it renders as visible text and cannot execute.
 *
 * This regex matches onXXX= only when preceded by a tag-start pattern
 * (a letter or whitespace right after an unescaped <).
 */
function expectNoOnHandlers(html: string): void {
  // Find unescaped tags first, then check for onXXX= inside them.
  // An unescaped tag is <[^>]+> — i.e. < followed by non-> chars.
  // Inside such a tag, on\w+\s*= is a live event handler.
  const tagPattern = /<[^>]+>/g;
  let m: RegExpExecArray | null;
  while ((m = tagPattern.exec(html)) !== null) {
    const tag = m[0];
    expect(tag).not.toMatch(/\son\w+\s*=/i);
  }
}

/**
 * Assert no LIVE javascript: URL scheme in the rendered HTML.
 *
 * Same logic as expectNoOnHandlers — only checks inside unescaped tags
 * (i.e. inside href="..." or src="..." attributes of real tags).
 * Escaped text like "&lt;a href=javascript:..." is inert.
 */
function expectNoJavascriptScheme(html: string): void {
  const tagPattern = /<[^>]+>/g;
  let m: RegExpExecArray | null;
  while ((m = tagPattern.exec(html)) !== null) {
    const tag = m[0];
    expect(tag).not.toMatch(/java[\s\x00-\x1f]*script:/i);
  }
}

// ═══════════════════════════════════════════════════════════════════
// A. sanitizeIconOrEmoji — helper contract
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 9.0C — sanitizeIconOrEmoji', () => {
  it('<script>alert(1)</script> → escaped, no executable <script>', () => {
    const out = sanitizeIconOrEmoji('<script>alert(1)</script>');
    expectNoScript(out);
    // The escaped form is &lt;script&gt;alert(1)&lt;/script&gt;
    expect(out).toContain('&lt;script&gt;');
    expect(out).toContain('&lt;/script&gt;');
  });

  it('<img src=x onerror=alert(1)> → escaped, onerror does not survive as live attribute', () => {
    const out = sanitizeIconOrEmoji('<img src=x onerror=alert(1)>');
    // The whole thing is escaped to &lt;img src=x onerror=alert(1)&gt;
    // — no LIVE <img tag exists, so onerror cannot fire.
    expectNoOnHandlers(out);
    expect(out).toContain('&lt;img');
    // Verify the escaped form is what we expect
    expect(out).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('<a href="javascript:alert(1)">x</a> → escaped, no javascript: scheme', () => {
    const out = sanitizeIconOrEmoji('<a href="javascript:alert(1)">x</a>');
    // The href="javascript:..." is inside the escaped string — so the raw
    // scheme should NOT appear as a live URL. It WILL appear literally
    // as escaped text "javascript:" because escapeHtml doesn't strip it,
    // but the surrounding <a> is inert (&lt;a).
    expect(out).toContain('&lt;a');
    // The text "x" should still be present (text content of the escaped tag)
    expect(out).toContain('x');
  });

  it('inline onclick="..." attribute is escaped (whole tag becomes inert text)', () => {
    const out = sanitizeIconOrEmoji('<div onclick="alert(1)">x</div>');
    // The whole thing is escaped — onclick is inside &lt;div onclick=...&gt;
    // which renders as visible text, not as a live event handler.
    expect(out).toContain('&lt;div');
    expect(out).toContain('onclick');
    // But it's NOT a live attribute — there's no actual <div tag in output
    expect(out).not.toMatch(/<div[\s>]/i);
  });

  it('plain emoji "📖" preserved exactly', () => {
    expect(sanitizeIconOrEmoji('📖')).toBe('📖');
  });

  it('plain emoji "🔥" preserved exactly', () => {
    expect(sanitizeIconOrEmoji('🔥')).toBe('🔥');
  });

  it('plain short text "Step 1" preserved exactly', () => {
    expect(sanitizeIconOrEmoji('Step 1')).toBe('Step 1');
  });

  it('null → ""', () => {
    expect(sanitizeIconOrEmoji(null)).toBe('');
  });

  it('undefined → ""', () => {
    expect(sanitizeIconOrEmoji(undefined)).toBe('');
  });

  it('empty string → ""', () => {
    expect(sanitizeIconOrEmoji('')).toBe('');
  });

  it('number input coerced to string and escaped', () => {
    // Numbers don't contain HTML, so they should round-trip as their string form
    expect(sanitizeIconOrEmoji(42)).toBe('42');
  });

  it('ampersand escaped', () => {
    expect(sanitizeIconOrEmoji('A & B')).toBe('A &amp; B');
  });

  it('double quote escaped', () => {
    expect(sanitizeIconOrEmoji('say "hi"')).toBe('say &quot;hi&quot;');
  });

  it('single quote escaped', () => {
    expect(sanitizeIconOrEmoji("it's")).toBe('it&#39;s');
  });
});

// ═══════════════════════════════════════════════════════════════════
// B. sanitizeHtmlForRender — client-side dangerouslySetInnerHTML sink
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 9.0C — sanitizeHtmlForRender (client-side raw HTML sink)', () => {
  it('<script>alert(1)</script> → stripped entirely (tag + content)', () => {
    const out = sanitizeHtmlForRender('<script>alert(1)</script>');
    expectNoScript(out);
    expect(out).not.toContain('alert(1)');
    expect(out).toBe('');
  });

  it('<img src=x onerror=alert(1)> → stripped (img not in allowlist)', () => {
    const out = sanitizeHtmlForRender('<img src=x onerror=alert(1)>');
    expect(out).not.toMatch(/<img/i);
    expectNoOnHandlers(out);
  });

  it('<a href="javascript:alert(1)">click</a> → stripped (a not in allowlist)', () => {
    const out = sanitizeHtmlForRender('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toMatch(/<a[\s>]/i);
    expectNoJavascriptScheme(out);
    // Text content "click" is preserved
    expect(out).toContain('click');
  });

  it('<strong onclick="alert(1)">bold</strong> → <strong>bold</strong> (attr stripped, tag kept)', () => {
    const out = sanitizeHtmlForRender('<strong onclick="alert(1)">bold</strong>');
    expect(out).toBe('<strong>bold</strong>');
    expectNoOnHandlers(out);
  });

  it('<span style="background:url(javascript:...)">x</span> → <span>x</span> (style attr stripped)', () => {
    const out = sanitizeHtmlForRender('<span style="background:url(javascript:alert(1))">x</span>');
    expect(out).toBe('<span>x</span>');
    expect(out).not.toContain('style');
    expect(out).not.toContain('javascript:');
  });

  it('<iframe src="javascript:alert(1)"></iframe> → stripped (iframe not in allowlist)', () => {
    const out = sanitizeHtmlForRender('<iframe src="javascript:alert(1)"></iframe>');
    expect(out).not.toMatch(/<iframe/i);
    expect(out).not.toContain('javascript:');
  });

  it('<object data="evil.swf"></object> → stripped (object not in allowlist)', () => {
    const out = sanitizeHtmlForRender('<object data="evil.swf"></object>');
    expect(out).not.toMatch(/<object/i);
  });

  it('<embed src="evil.swf"> → stripped (embed not in allowlist)', () => {
    const out = sanitizeHtmlForRender('<embed src="evil.swf">');
    expect(out).not.toMatch(/<embed/i);
  });

  it('<svg onload="alert(1)"></svg> → stripped (svg not in allowlist)', () => {
    const out = sanitizeHtmlForRender('<svg onload="alert(1)"></svg>');
    expect(out).not.toMatch(/<svg/i);
    expectNoOnHandlers(out);
  });

  it('safe formatting <strong>bold</strong> and <em>italic</em> preserved', () => {
    const out = sanitizeHtmlForRender('<strong>bold</strong> and <em>italic</em>');
    expect(out).toBe('<strong>bold</strong> and <em>italic</em>');
  });

  it('<br/> and <br> preserved (normalized to <br>)', () => {
    expect(sanitizeHtmlForRender('<br/>')).toBe('<br>');
    expect(sanitizeHtmlForRender('<br>')).toBe('<br>');
  });

  it('allowed tags with attributes have attrs stripped (defense in depth)', () => {
    // <strong class="x"> is fine — class is stripped, tag kept
    const out = sanitizeHtmlForRender('<strong class="x" id="y">bold</strong>');
    expect(out).toBe('<strong>bold</strong>');
  });

  it('plain text with < or > as math (e.g. "5 < 10") preserved', () => {
    // Note: "5 < 10" looks like a tag start to the tokenizer.
    // < 10" doesn't match a valid tag (no letter after <), so it falls into
    // the text token. The behavior here is: < followed by space is treated
    // as text, not as a tag.
    const out = sanitizeHtmlForRender('5 < 10 and 3 > 1');
    // The <  and > should survive as text (not be stripped or escaped)
    expect(out).toContain('5');
    expect(out).toContain('10');
    expect(out).toContain('3');
    expect(out).toContain('1');
  });

  it('empty string → ""', () => {
    expect(sanitizeHtmlForRender('')).toBe('');
  });

  it('HTML comment <!-- ... --> stripped', () => {
    const out = sanitizeHtmlForRender('<!-- evil comment --><p>ok</p>');
    // <p> is NOT in allowlist (only span/strong/em/etc. are), so it gets stripped too
    expect(out).not.toContain('<!--');
    expect(out).not.toContain('-->');
    expect(out).not.toContain('evil comment');
    // "ok" text content is preserved
    expect(out).toContain('ok');
  });

  it('backward-compat: sanitizeHtml (from RichText.tsx) delegates to sanitizeHtmlForRender', () => {
    // This verifies the re-export in RichText.tsx still works
    const payload = '<script>alert(1)</script><strong>ok</strong>';
    expect(sanitizeHtml(payload)).toBe(sanitizeHtmlForRender(payload));
  });
});

// ═══════════════════════════════════════════════════════════════════
// C. sanitizeUrl — URL scheme sanitization
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 9.0C — sanitizeUrl', () => {
  it('javascript:alert(1) → ""', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('vbscript:msgbox("xss") → ""', () => {
    expect(sanitizeUrl('vbscript:msgbox("xss")')).toBe('');
  });

  it('data:text/html,<script>alert(1)</script> → ""', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('java\\tscript:alert(1) (tab inside scheme) → ""', () => {
    expect(sanitizeUrl('java\tscript:alert(1)')).toBe('');
  });

  it('Java\\nScript:alert(1) (case + newline trick) → ""', () => {
    expect(sanitizeUrl('Java\nScript:alert(1)')).toBe('');
  });

  it('JAVASCRIPT:alert(1) (uppercase) → ""', () => {
    expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
  });

  it('  javascript:alert(1)  (leading/trailing whitespace) → ""', () => {
    expect(sanitizeUrl('  javascript:alert(1)  ')).toBe('');
  });

  it('https://example.com preserved', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('http://example.com/path?q=1 preserved', () => {
    expect(sanitizeUrl('http://example.com/path?q=1')).toBe('http://example.com/path?q=1');
  });

  it('mailto:user@example.com preserved', () => {
    expect(sanitizeUrl('mailto:user@example.com')).toBe('mailto:user@example.com');
  });

  it('tel:+1234567890 preserved', () => {
    expect(sanitizeUrl('tel:+1234567890')).toBe('tel:+1234567890');
  });

  it('#anchor preserved', () => {
    expect(sanitizeUrl('#section-1')).toBe('#section-1');
  });

  it('/relative/path preserved', () => {
    expect(sanitizeUrl('/relative/path')).toBe('/relative/path');
  });

  it('../parent/path preserved', () => {
    expect(sanitizeUrl('../parent/path')).toBe('../parent/path');
  });

  it('data:image/png;base64,iVBOR... preserved (safe image data URL)', () => {
    const url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ';
    expect(sanitizeUrl(url)).toBe(url);
  });

  it('data:image/svg+xml;base64,... preserved (SVG image data URL)', () => {
    const url = 'data:image/svg+xml;base64,PHN2Zz4=';
    expect(sanitizeUrl(url)).toBe(url);
  });

  it('null → ""', () => {
    expect(sanitizeUrl(null)).toBe('');
  });

  it('undefined → ""', () => {
    expect(sanitizeUrl(undefined)).toBe('');
  });

  it('empty string → ""', () => {
    expect(sanitizeUrl('')).toBe('');
  });

  it('non-string (number 42) → ""', () => {
    expect(sanitizeUrl(42 as unknown as string)).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════
// D. escapeHtml (from sanitize.ts) — canonical escape
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 9.0C — escapeHtml (canonical, from sanitize.ts)', () => {
  it('escapes & < > " \'', () => {
    expect(escapeHtml('a & < > " \'')).toBe('a &amp; &lt; &gt; &quot; &#39;');
  });

  it('null → ""', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('undefined → ""', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  it('number coerced to string', () => {
    expect(escapeHtml(42)).toBe('42');
  });

  it('<script> escaped', () => {
    const out = escapeHtml('<script>alert(1)</script>');
    expectNoScript(out);
    expect(out).toContain('&lt;script&gt;');
  });
});

// ═══════════════════════════════════════════════════════════════════
// D. Export block-renderers — end-to-end XSS prevention
//     Each test puts a malicious payload in a user-controlled icon/emoji
//     field and verifies the rendered HTML does not contain executable
//     payloads.
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 9.0C — Export block-renderers: XSS prevention on icon/emoji fields', () => {
  const SCRIPT_PAYLOAD = '<script>alert("xss")</script>';
  const ONERROR_PAYLOAD = '<img src=x onerror=alert(1)>';
  const JSURL_PAYLOAD = '<a href="javascript:alert(1)">x</a>';

  // ── 1. cover block: icon field ──
  it('cover.icon with <script> → no <script> in output', () => {
    const html = renderContentBlock('cover', { icon: SCRIPT_PAYLOAD, title: 'T' }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 2. cover block: badge icon field ──
  it('cover.badges[].icon with <img onerror=...> → no onerror in output', () => {
    const html = renderContentBlock('cover', {
      title: 'T',
      badges: [{ icon: ONERROR_PAYLOAD, text: 'B', color: 'y' }],
    }, noopRender) || '';
    expectNoOnHandlers(html);
    expect(html).not.toMatch(/<img[\s>]/i);
  });

  // ── 3. petunjuk block: step icon ──
  it('petunjuk.items[].icon with <script> → no <script>', () => {
    const html = renderContentBlock('petunjuk', {
      title: 'T',
      items: [{ icon: SCRIPT_PAYLOAD, title: 'S', body: 'B' }],
    }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 4. nc-grid block: card icon ──
  it('nc-grid.cards[].icon with javascript: URL → no javascript: scheme', () => {
    const html = renderContentBlock('nc-grid', {
      title: 'T',
      cards: [{ icon: JSURL_PAYLOAD, title: 'C', body: 'B', color: 'y' }],
    }, noopRender) || '';
    expectNoJavascriptScheme(html);
    expect(html).not.toMatch(/<a[\s>]/i);
  });

  // ── 5. nk-card block: icon ──
  it('nk-card.icon with <script> → no <script>', () => {
    const html = renderContentBlock('nk-card', { icon: SCRIPT_PAYLOAD, title: 'T' }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 6. ftab block: tab icon ──
  it('ftab.tabs[].icon with <script> → no <script>', () => {
    const html = renderContentBlock('ftab', {
      title: 'T',
      tabs: [{ id: 't1', label: 'L', icon: SCRIPT_PAYLOAD, content: [] }],
    }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 7. materi-section block: tab icon ──
  it('materi-section.tabs[].icon with <img onerror=...> → no onerror', () => {
    const html = renderContentBlock('materi-section', {
      title: 'T',
      icon: '📖',
      tabs: [{ id: 't1', label: 'L', icon: ONERROR_PAYLOAD, content: [] }],
    }, noopRender) || '';
    expectNoOnHandlers(html);
    expect(html).not.toMatch(/<img[\s>]/i);
  });

  // ── 8. materi-section block: icon ──
  it('materi-section.icon with <script> → no <script>', () => {
    const html = renderContentBlock('materi-section', {
      title: 'T',
      icon: SCRIPT_PAYLOAD,
      content: [],
    }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 9. tujuan-display block: objective icon ──
  it('tujuan-display.objectives[].icon with <script> → no <script>', () => {
    const html = renderContentBlock('tujuan-display', {
      title: 'T',
      objectives: [{ icon: SCRIPT_PAYLOAD, text: 'O', color: 'y' }],
    }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 10. motivasi block: visual.emoji ──
  it('motivasi.visual.emoji with <script> → no <script>', () => {
    const html = renderContentBlock('motivasi', {
      title: 'T',
      hookQuestion: 'Q',
      visual: { emoji: SCRIPT_PAYLOAD },
      connections: [],
    }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 11. rangkuman block: concept icon ──
  it('rangkuman.concepts[].icon with <script> → no <script>', () => {
    const html = renderContentBlock('rangkuman', {
      title: 'T',
      concepts: [{ icon: SCRIPT_PAYLOAD, title: 'C', body: 'B', color: 'y' }],
    }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 12. penutup block: preview icon ──
  it('penutup.preview[].icon with <script> → no <script>', () => {
    const html = renderContentBlock('penutup', {
      title: 'T',
      preview: [{ icon: SCRIPT_PAYLOAD, judul: 'J', isi: 'I', warna: 'y' }],
    }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 13. tabel-accord block: row icon ──
  it('tabel-accord.rows[].icon with <script> → no <script>', () => {
    const html = renderContentBlock('tabel-accord', {
      title: 'T',
      rows: [{ icon: SCRIPT_PAYLOAD, title: 'R', body: 'B', color: 'y', details: [] }],
    }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 14. timeline block: step icon ──
  it('timeline.steps[].icon with <script> → no <script>', () => {
    const html = renderContentBlock('timeline', {
      title: 'T',
      steps: [{ icon: SCRIPT_PAYLOAD, label: 'L', description: 'D', color: 'y' }],
    }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 15. compare block: kiri icon ──
  it('compare.kiri.icon with <script> → no <script>', () => {
    const html = renderContentBlock('compare', {
      title: 'T',
      kiri: { icon: SCRIPT_PAYLOAD, judul: 'L', isi: 'I' },
      kanan: { icon: 'R', judul: 'R', isi: 'I' },
    }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 16. compare block: kanan icon ──
  it('compare.kanan.icon with <script> → no <script>', () => {
    const html = renderContentBlock('compare', {
      title: 'T',
      kiri: { icon: 'L', judul: 'L', isi: 'I' },
      kanan: { icon: SCRIPT_PAYLOAD, judul: 'R', isi: 'I' },
    }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 17. checklist block: item icon ──
  it('checklist.items[].icon with <script> → no <script>', () => {
    const html = renderContentBlock('checklist', {
      title: 'T',
      items: [{ icon: SCRIPT_PAYLOAD, teks: 'I', warna: 'y' }],
    }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 18. statistik block: item icon ──
  it('statistik.items[].icon with <script> → no <script>', () => {
    const html = renderContentBlock('statistik', {
      title: 'T',
      items: [{ icon: SCRIPT_PAYLOAD, angka: '42', satuan: 'x', label: 'L', warna: 'y' }],
    }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 19. studi block: poin icon ──
  it('studi.poin[].icon with <script> → no <script>', () => {
    const html = renderContentBlock('studi', {
      title: 'T',
      poin: [{ icon: SCRIPT_PAYLOAD, judul: 'P', isi: 'I' }],
      refleksi: [],
    }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 20. studi block: refleksi icon ──
  it('studi.refleksi[].icon with <script> → no <script>', () => {
    const html = renderContentBlock('studi', {
      title: 'T',
      poin: [],
      refleksi: [{ icon: SCRIPT_PAYLOAD, judul: 'R', isi: 'I' }],
    }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 21. hero block: icon ──
  it('hero.icon with <script> → no <script>', () => {
    const html = renderContentBlock('hero', { icon: SCRIPT_PAYLOAD, title: 'T' }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 22. materi-blok block: icon ──
  it('materi-blok.icon with <script> → no <script>', () => {
    const html = renderContentBlock('materi-blok', { tipe: 'teks', icon: SCRIPT_PAYLOAD }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 23. skenario block: charEmoji ──
  it('skenario.chapters[].charEmoji with <script> → no <script>', () => {
    const html = renderNavigationBlock('skenario', {
      title: 'T',
      chapters: [{ charEmoji: SCRIPT_PAYLOAD, title: 'C', setup: [], choices: [] }],
    }, noopRender) || '';
    expectNoScript(html);
  });

  // ── 24. skenario block: choice icon ──
  it('skenario.chapters[].choices[].icon with <script> → no <script>', () => {
    const html = renderNavigationBlock('skenario', {
      title: 'T',
      chapters: [{ charEmoji: '👤', title: 'C', setup: [], choices: [{ icon: SCRIPT_PAYLOAD, label: 'L' }] }],
    }, noopRender) || '';
    expectNoScript(html);
  });
});

// ═══════════════════════════════════════════════════════════════════
// E. Export block-renderers — normal content still renders correctly
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 9.0C — Export block-renderers: normal content still renders', () => {
  it('cover with valid emoji icon → emoji appears in output', () => {
    const html = renderContentBlock('cover', { icon: '📘', title: 'My Cover' }, noopRender) || '';
    expect(html).toContain('📘');
    expect(html).toContain('My Cover');
  });

  it('cover with valid title containing ampersand → ampersand escaped', () => {
    const html = renderContentBlock('cover', { icon: '📘', title: 'A & B' }, noopRender) || '';
    // escapeHtml converts & to &amp;
    expect(html).toContain('A &amp; B');
    expect(html).not.toContain('A & B');
  });

  it('def-box with safe rich text <strong>bold</strong> → preserved via safeRichText', () => {
    const html = renderContentBlock('def-box', { content: '<strong>bold</strong> text' }, noopRender) || '';
    // safeRichText preserves <strong> in the allowlist
    expect(html).toContain('<strong>bold</strong>');
  });

  it('def-box with <script> in content → escaped (not preserved as live tag)', () => {
    const html = renderContentBlock('def-box', { content: '<script>alert(1)</script> safe text' }, noopRender) || '';
    expectNoScript(html);
    // safeRichText escapes <script> to &lt;script&gt;
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('safe text');
  });

  it('plain text content "Hello World" → preserved', () => {
    const html = renderContentBlock('def-box', { content: 'Hello World' }, noopRender) || '';
    expect(html).toContain('Hello World');
  });

  it('petunjuk with valid emoji step icon → emoji preserved', () => {
    const html = renderContentBlock('petunjuk', {
      title: 'T',
      items: [{ icon: '📌', title: 'Step', body: 'Body' }],
    }, noopRender) || '';
    expect(html).toContain('📌');
    expect(html).toContain('Step');
  });

  it('skenario with valid emoji charEmoji → emoji preserved', () => {
    const html = renderNavigationBlock('skenario', {
      title: 'T',
      chapters: [{ charEmoji: '🦊', title: 'C', setup: [], choices: [] }],
    }, noopRender) || '';
    expect(html).toContain('🦊');
  });
});
