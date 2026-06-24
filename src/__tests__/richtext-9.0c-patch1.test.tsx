// ═══════════════════════════════════════════════════════════════════
// SPRINT 9.0C-PATCH-1 — RichText HTML Render Branch Restoration
// ═══════════════════════════════════════════════════════════════════
// Verifies that <RichText> correctly renders sanitized HTML when
// `content` contains HTML tags. Closes RICH-001.
//
// Pre-Patch-1 bug: when `hasHtml=true`, <RichText> returned a debug
// placeholder icon (`<span class="material-symbols-outlined">label</span>`)
// instead of rendering the sanitized HTML. This broke rich-text display
// for 22+ block renderers that delegate to <RichText>.
//
// Coverage:
//   1. HTML branch renders sanitized HTML (not debug icon)
//   2. <strong>Halo</strong><br/>Dunia → "Halo" + "Dunia" text both visible
//   3. Allowlist tags preserved: <strong>, <em>, <br>, <span>, <b>, <i>, <u>
//   4. <script>alert(1)</script> → not rendered as live script
//   5. <img src=x onerror=alert(1)> → no live <img or onerror
//   6. <a href="javascript:alert(1)"> → no live <a or javascript:
//   7. <strong onclick="..."> → tag preserved, attr stripped
//   8. <span style="..."> → tag preserved, style attr stripped
//   9. Plain text (no HTML) → renders as React children (no dSIH)
//  10. Placeholder renders when content is empty
//  11. Placeholder NOT used when content has HTML
//  12. Tag prop respected (default 'span', can be 'div', 'p', etc.)
//  13. className + style applied in both branches
//  14. Word-break baseline style applied in both branches
//  15. No regression: existing sanitizeHtml re-export still works
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as React from 'react';

import { RichText, sanitizeHtml, hasHtmlTags, stripHtmlTags } from '@/core/renderer/blocks/RichText';
import { sanitizeHtmlForRender } from '@/lib/sanitize';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

afterEach(() => {
  cleanup();
});

/**
 * Assert no live <script> tag (opening or closing) anywhere in the
 * rendered DOM container. dangerouslySetInnerHTML content shows up
 * in container.innerHTML.
 */
function expectNoLiveScript(container: HTMLElement): void {
  // No <script> elements in the DOM (browser won't execute scripts
  // inserted via innerHTML in jsdom, but we still assert the tag is
  // absent to prove sanitization worked).
  expect(container.querySelectorAll('script').length).toBe(0);
  // Also assert no raw <script> substring in serialized HTML
  expect(container.innerHTML).not.toMatch(/<script[\s>]/i);
  expect(container.innerHTML).not.toMatch(/<\/script>/i);
}

/**
 * Assert no live on* event handler attribute on any element in the
 * rendered DOM. Only checks actual DOM attributes (not escaped text).
 */
function expectNoLiveOnHandlers(container: HTMLElement): void {
  const all = container.querySelectorAll('*');
  for (const el of Array.from(all)) {
    const attrs = Array.from(el.attributes).map(a => a.name.toLowerCase());
    const onAttrs = attrs.filter(a => a.startsWith('on'));
    expect(onAttrs).toEqual([]);
  }
}

/**
 * Assert no live <img> element with src/javascript: in the DOM.
 */
function expectNoLiveImgWithJavascript(container: HTMLElement): void {
  const imgs = container.querySelectorAll('img');
  for (const img of Array.from(imgs)) {
    const src = img.getAttribute('src') || '';
    expect(src).not.toMatch(/java[\s\x00-\x1f]*script:/i);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 9.0C-Patch-1 — RichText HTML render branch', () => {

  // ── 1. HTML branch renders sanitized HTML (not debug icon) ──────

  it('HTML content renders sanitized HTML, not the debug "label" icon', () => {
    const { container } = render(<RichText content="<strong>Halo</strong>" />);
    // The debug bug returned <span class="material-symbols-outlined">label</span>
    // Verify that bug is GONE — no material-symbols-outlined span
    expect(container.querySelectorAll('.material-symbols-outlined').length).toBe(0);
    // And the actual <strong> tag is rendered
    expect(container.querySelectorAll('strong').length).toBe(1);
    expect(container.querySelector('strong')?.textContent).toBe('Halo');
  });

  // ── 2. <strong>Halo</strong><br/>Dunia → both visible ───────────

  it('<strong>Halo</strong><br/>Dunia renders "Halo" + "Dunia" text', () => {
    const { container } = render(<RichText content="<strong>Halo</strong><br/>Dunia" />);
    // The text content of the container should include both words
    expect(container.textContent).toContain('Halo');
    expect(container.textContent).toContain('Dunia');
    // <strong> tag preserved
    expect(container.querySelectorAll('strong').length).toBe(1);
    // <br> tag preserved (sanitizer normalizes <br/> to <br>)
    expect(container.querySelectorAll('br').length).toBe(1);
  });

  // ── 3. Allowlist tags preserved ────────────────────────────────

  it('allowlist tags (<strong>, <em>, <br>, <b>, <i>, <u>, <span>) preserved', () => {
    // Use tag="div" so the inner <span> doesn't collide with the wrapper
    const { container } = render(
      <RichText
        content="<strong>s</strong><em>e</em><b>b</b><i>i</i><u>u</u><span>x</span>"
        tag="div"
      />
    );
    expect(container.querySelectorAll('strong').length).toBe(1);
    expect(container.querySelectorAll('em').length).toBe(1);
    expect(container.querySelectorAll('b').length).toBe(1);
    expect(container.querySelectorAll('i').length).toBe(1);
    expect(container.querySelectorAll('u').length).toBe(1);
    expect(container.querySelectorAll('span').length).toBe(1); // just the inner one
    // Text content survives
    expect(container.textContent).toContain('s');
    expect(container.textContent).toContain('e');
    expect(container.textContent).toContain('b');
    expect(container.textContent).toContain('i');
    expect(container.textContent).toContain('u');
    expect(container.textContent).toContain('x');
  });

  it('<br/> normalized to HTML5 <br>', () => {
    const { container } = render(<RichText content="line1<br/>line2" />);
    const brs = container.querySelectorAll('br');
    expect(brs.length).toBe(1);
  });

  // ── 4. <script>alert(1)</script> → not live ───────────────────

  it('<script>alert(1)</script> stripped — no live script element', () => {
    const { container } = render(<RichText content="<script>alert(1)</script>safe text" />);
    expectNoLiveScript(container);
    // The text "safe text" should still be present (text content kept)
    expect(container.textContent).toContain('safe text');
    // The alert(1) payload should NOT be in textContent (script content stripped)
    expect(container.textContent).not.toContain('alert(1)');
  });

  // ── 5. <img src=x onerror=alert(1)> → no live img/onerror ─────

  it('<img src=x onerror=alert(1)> → no live <img> or onerror attribute', () => {
    const { container } = render(<RichText content="<img src=x onerror=alert(1)>" />);
    // <img> is NOT in the allowlist → stripped entirely
    expect(container.querySelectorAll('img').length).toBe(0);
    expectNoLiveOnHandlers(container);
  });

  // ── 6. <a href="javascript:alert(1)"> → no live <a> or javascript:

  it('<a href="javascript:alert(1)">x</a> → no live <a> with javascript: href', () => {
    const content = '<a href="javascript:alert(1)">x</a>';
    const { container } = render(<RichText content={content} />);
    // <a> is NOT in the allowlist → stripped entirely
    expect(container.querySelectorAll('a').length).toBe(0);
    // Text "x" preserved (content of stripped tag)
    expect(container.textContent).toContain('x');
  });

  // ── 7. <strong onclick="..."> → tag kept, attr stripped ────────

  it('<strong onclick="alert(1)"> → <strong> kept, onclick attr stripped', () => {
    const content = '<strong onclick="alert(1)">bold</strong>';
    const { container } = render(<RichText content={content} />);
    const strongs = container.querySelectorAll('strong');
    expect(strongs.length).toBe(1);
    expect(strongs[0].getAttribute('onclick')).toBeNull();
    expect(strongs[0].textContent).toBe('bold');
    expectNoLiveOnHandlers(container);
  });

  // ── 8. <span style="..."> → tag kept, style attr stripped ──────

  it('<span style="color:red"> → <span> kept, style attr stripped', () => {
    // Use tag="div" wrapper so the inner <span> is the only span counted
    const content = '<span style="color:red">x</span>';
    const { container } = render(<RichText content={content} tag="div" />);
    const spans = container.querySelectorAll('span');
    expect(spans.length).toBe(1);
    expect(spans[0].getAttribute('style')).toBeNull();
    expect(spans[0].textContent).toBe('x');
  });

  // ── 9. Plain text → React children (no dSIH) ───────────────────

  it('plain text (no HTML) renders as React children, not via dangerouslySetInnerHTML', () => {
    const { container } = render(<RichText content="Hello World" />);
    // Text content present
    expect(container.textContent).toBe('Hello World');
    // No HTML tags in the output (just the wrapping span from <Tag>)
    const spans = container.querySelectorAll('span');
    expect(spans.length).toBe(1); // The default Tag is 'span'
    // The span's text content is exactly "Hello World" — not via dSIH
    expect(spans[0].textContent).toBe('Hello World');
  });

  // ── 10. Placeholder works when content is empty ────────────────

  it('placeholder renders when content is empty', () => {
    const { container } = render(<RichText content="" placeholder="Ketik teks..." />);
    expect(container.textContent).toContain('Ketik teks...');
  });

  it('placeholder renders when content is undefined', () => {
    const { container } = render(<RichText content={undefined as unknown as string} placeholder="Placeholder" />);
    expect(container.textContent).toContain('Placeholder');
  });

  // ── 11. Placeholder NOT used when content has HTML ─────────────

  it('placeholder NOT used when content has HTML', () => {
    const { container } = render(
      <RichText content="<strong>Real</strong>" placeholder="Should not appear" />
    );
    expect(container.textContent).toContain('Real');
    expect(container.textContent).not.toContain('Should not appear');
  });

  // ── 12. Tag prop respected ─────────────────────────────────────

  it('tag="div" wraps in a <div>', () => {
    const { container } = render(<RichText content="hello" tag="div" />);
    expect(container.querySelectorAll('div').length).toBe(1);
    expect(container.querySelector('div')?.textContent).toBe('hello');
  });

  it('tag="p" wraps in a <p>', () => {
    const { container } = render(<RichText content="hello" tag="p" />);
    expect(container.querySelectorAll('p').length).toBe(1);
  });

  it('tag="h1" wraps in an <h1>', () => {
    const { container } = render(<RichText content="title" tag="h1" />);
    expect(container.querySelectorAll('h1').length).toBe(1);
  });

  it('HTML branch respects tag prop (default span still wraps)', () => {
    const { container } = render(<RichText content="<strong>x</strong>" tag="p" />);
    // The wrapping element should be <p>, not <span>
    const ps = container.querySelectorAll('p');
    expect(ps.length).toBe(1);
    // And the <strong> inside it
    expect(ps[0].querySelectorAll('strong').length).toBe(1);
  });

  // ── 13. className + style applied in both branches ─────────────

  it('HTML branch applies className', () => {
    const { container } = render(
      <RichText content="<strong>x</strong>" className="my-class" />
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.classList.contains('my-class')).toBe(true);
  });

  it('plain text branch applies className', () => {
    const { container } = render(
      <RichText content="hello" className="my-class" />
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.classList.contains('my-class')).toBe(true);
  });

  it('HTML branch applies style prop', () => {
    const { container } = render(
      <RichText content="<strong>x</strong>" style={{ color: 'rgb(255, 0, 0)' }} />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.color).toBe('rgb(255, 0, 0)');
  });

  it('plain text branch applies style prop', () => {
    const { container } = render(
      <RichText content="hello" style={{ color: 'rgb(255, 0, 0)' }} />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.color).toBe('rgb(255, 0, 0)');
  });

  // ── 14. Word-break baseline style applied in both branches ─────

  it('HTML branch applies word-break baseline style', () => {
    const { container } = render(<RichText content="<strong>x</strong>" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.wordBreak).toBe('break-word');
    expect(wrapper.style.overflowWrap).toBe('break-word');
  });

  it('plain text branch applies word-break baseline style', () => {
    const { container } = render(<RichText content="hello" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.wordBreak).toBe('break-word');
    expect(wrapper.style.overflowWrap).toBe('break-word');
  });

  it('custom style overrides are merged with baseline (style prop wins)', () => {
    const { container } = render(
      <RichText content="x" style={{ wordBreak: 'normal' } as React.CSSProperties} />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    // User override wins over baseline
    expect(wrapper.style.wordBreak).toBe('normal');
    // But baseline overflowWrap is preserved (not overridden)
    expect(wrapper.style.overflowWrap).toBe('break-word');
  });

  // ── 15. Backward-compat: sanitizeHtml re-export still works ────

  it('sanitizeHtml re-export from RichText.tsx still works (backward compat)', () => {
    // This proves the re-export path used by DefBoxRenderer + InlineTextEditor
    // still produces the same output as the canonical sanitizeHtmlForRender.
    const payload = '<script>alert(1)</script><strong>ok</strong>';
    expect(sanitizeHtml(payload)).toBe(sanitizeHtmlForRender(payload));
    expect(sanitizeHtml(payload)).toBe('<strong>ok</strong>');
  });

  // ── 16. hasHtmlTags + stripHtmlTags helpers ────────────────────

  it('hasHtmlTags detects HTML tags', () => {
    expect(hasHtmlTags('<strong>x</strong>')).toBe(true);
    expect(hasHtmlTags('plain text')).toBe(false);
    expect(hasHtmlTags('')).toBe(false);
    // HTML entities like &amp; are NOT tags
    expect(hasHtmlTags('Tom &amp; Jerry')).toBe(false);
  });

  it('stripHtmlTags removes all tags', () => {
    expect(stripHtmlTags('<strong>bold</strong>')).toBe('bold');
    expect(stripHtmlTags('<p>line</p><br/>')).toBe('line');
    expect(stripHtmlTags('plain')).toBe('plain');
  });

  // ── 17. Complex real-world content ────────────────────────────

  it('complex mixed content renders correctly (formatting + plain text)', () => {
    const content = 'Norma <strong>kesusilaan</strong> adalah aturan tentang <em>kesopanan</em> di masyarakat.';
    const { container } = render(<RichText content={content} />);
    expect(container.textContent).toContain('Norma');
    expect(container.textContent).toContain('kesusilaan');
    expect(container.textContent).toContain('adalah aturan tentang');
    expect(container.textContent).toContain('kesopanan');
    expect(container.textContent).toContain('di masyarakat.');
    expect(container.querySelectorAll('strong').length).toBe(1);
    expect(container.querySelectorAll('em').length).toBe(1);
  });

  it('mixed safe + unsafe content: safe tags preserved, unsafe stripped', () => {
    const content = '<strong>safe</strong> <script>evil()</script> <img src=x onerror=alert(1)> <em>also safe</em>';
    const { container } = render(<RichText content={content} />);
    // Safe tags preserved
    expect(container.querySelectorAll('strong').length).toBe(1);
    expect(container.querySelectorAll('em').length).toBe(1);
    // Unsafe tags stripped
    expectNoLiveScript(container);
    expect(container.querySelectorAll('img').length).toBe(0);
    expectNoLiveOnHandlers(container);
    // Text content of safe tags preserved
    expect(container.textContent).toContain('safe');
    expect(container.textContent).toContain('also safe');
    // Script content stripped (not in textContent)
    expect(container.textContent).not.toContain('evil()');
  });
});
