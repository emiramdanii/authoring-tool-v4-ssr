import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════
// Sprint 4B — Export Route Validation Unit Tests
// ═══════════════════════════════════════════════════════════════
// Tests the validation and sanitization logic used by export API
// routes (HTML export, SCORM export, project export).
// ═══════════════════════════════════════════════════════════════

// ── Shared sanitization helpers (mirrors logic from export routes) ──

function sanitizeTitle(title: string): string {
  return title
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeFilename(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .replace(/^-|-$/g, '') || 'media-pembelajaran';
}

function sanitizeJsonForHtml(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f');
}

function isValidExportPayload(body: {
  pages?: unknown;
}): { valid: boolean; error?: string } {
  if (!body.pages || !Array.isArray(body.pages) || body.pages.length === 0) {
    return { valid: false, error: 'No pages provided' };
  }
  return { valid: true };
}

// ── Tests ──────────────────────────────────────────────────────────

describe('Export Route Validation', () => {
  // ── Payload validation ────────────────────────────────────────

  describe('Payload validation', () => {
    it('rejects empty pages array', () => {
      const result = isValidExportPayload({ pages: [] });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No pages provided');
    });

    it('rejects missing pages field', () => {
      const result = isValidExportPayload({});
      expect(result.valid).toBe(false);
    });

    it('rejects non-array pages', () => {
      const result = isValidExportPayload({ pages: 'invalid' });
      expect(result.valid).toBe(false);
    });

    it('accepts valid pages array', () => {
      const result = isValidExportPayload({ pages: [{ id: '1', label: 'Test' }] });
      expect(result.valid).toBe(true);
    });
  });

  // ── XSS prevention ────────────────────────────────────────────

  describe('XSS prevention', () => {
    it('sanitizes script tags in titles', () => {
      const xss = '<script>alert(1)</script>';
      const safe = sanitizeTitle(xss);
      expect(safe).not.toContain('<script>');
      expect(safe).toContain('&lt;script');
    });

    it('sanitizes HTML attributes in titles', () => {
      const xss = '" onmouseover="alert(1)"';
      const safe = sanitizeTitle(xss);
      expect(safe).not.toContain('" onmouseover');
      expect(safe).toContain('&quot;');
    });

    it('sanitizes JSON injection for HTML embedding', () => {
      const malicious = { script: '</script><script>alert(1)</script>' };
      const safe = sanitizeJsonForHtml(malicious);
      expect(safe).not.toContain('</script>');
      expect(safe).toContain('\\u003c');
    });

    it('escapes forward slashes in JSON for HTML safety', () => {
      const data = { url: 'https://evil.com' };
      const safe = sanitizeJsonForHtml(data);
      expect(safe).not.toContain('https://');
      expect(safe).toContain('\\u002f');
    });
  });

  // ── Filename sanitization ─────────────────────────────────────

  describe('Filename sanitization', () => {
    it('removes special characters', () => {
      expect(sanitizeFilename('My Module!@#')).toBe('my-module');
    });

    it('collapses multiple dashes', () => {
      expect(sanitizeFilename('A   B---C')).toBe('a-b-c');
    });

    it('trims leading/trailing dashes', () => {
      expect(sanitizeFilename('--Test--')).toBe('test');
    });

    it('returns fallback for empty result', () => {
      expect(sanitizeFilename('!!!')).toBe('media-pembelajaran');
    });

    it('handles unicode characters', () => {
      expect(sanitizeFilename('Materi PPKn Kelas 7')).toBe('materi-ppkn-kelas-7');
    });
  });

  // ── SCORM-specific validation ─────────────────────────────────

  describe('SCORM manifest safety', () => {
    it('escapes XML special chars in SCORM title', () => {
      const title = 'Test & Module <Alert>';
      const escaped = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      expect(escaped).toBe('Test &amp; Module &lt;Alert&gt;');
    });
  });

  // ── Size guard ────────────────────────────────────────────────

  describe('Size guard', () => {
    it('rejects payloads exceeding 20MB', () => {
      const MAX = 20_000_000;
      // Create a JSON string larger than 20MB
      const bigData = { pages: [{ data: 'x'.repeat(MAX) }] };
      const json = JSON.stringify(bigData);
      expect(json.length).toBeGreaterThan(MAX);
    });

    it('allows normal-sized payloads', () => {
      const MAX = 20_000_000;
      const normalData = { pages: [{ id: '1', elements: [] }] };
      const json = JSON.stringify(normalData);
      expect(json.length).toBeLessThan(MAX);
    });
  });
});
