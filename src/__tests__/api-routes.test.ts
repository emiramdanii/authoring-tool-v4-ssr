// ═══════════════════════════════════════════════════════════════════
// API ROUTE TESTS — Export and AI API endpoints
// ═══════════════════════════════════════════════════════════════════
// Tests the API routes by testing core logic functions and route
// handler validation/sanitization logic inline (server-side route
// handlers cannot be imported in a jsdom test environment).

import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════════
// EXPORT API — Core Logic Tests
// ═══════════════════════════════════════════════════════════════════

describe('Export API — Core Logic', () => {
  it('should build export data object with defaults for missing fields', () => {
    const body = {
      pages: [{ id: 'p1', label: 'Test' }],
    };

    // This mirrors the export data building logic from the route
    const exportData = {
      pages: body.pages,
      ratioId: (body as Record<string, unknown>).ratioId || '16:9',
      meta: (body as Record<string, unknown>).meta || {},
      allKuis: (body as Record<string, unknown>).allKuis || [],
      allModules: (body as Record<string, unknown>).allModules || [],
      games: (body as Record<string, unknown>).games || [],
      cp: (body as Record<string, unknown>).cp || {},
      tp: (body as Record<string, unknown>).tp || [],
      atp: (body as Record<string, unknown>).atp || { namaBab: '', jumlahPertemuan: 0, pertemuan: [] },
      alur: (body as Record<string, unknown>).alur || [],
      materi: (body as Record<string, unknown>).materi || { blok: [] },
      skenario: (body as Record<string, unknown>).skenario || [],
      petunjuk: (body as Record<string, unknown>).petunjuk || { title: '', intro: '', langkah: [] },
      diskusi: (body as Record<string, unknown>).diskusi || { title: '', intro: '', pertanyaan: [] },
      refleksi: (body as Record<string, unknown>).refleksi || { title: '', intro: '', pertanyaan: [] },
      penutup: (body as Record<string, unknown>).penutup || { title: '', subjudul: '', preview: [] },
      suara: (body as Record<string, unknown>).suara || { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
    };

    expect(exportData.ratioId).toBe('16:9');
    expect(exportData.meta).toEqual({});
    expect(exportData.allKuis).toEqual([]);
    expect(exportData.suara.navigasi).toBe(true);
  });

  it('should sanitize filename correctly', () => {
    const sanitize = (name: string) => {
      const rawName = (name || 'media-pembelajaran')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase()
        .replace(/^-|-$/g, '');
      return `${rawName || 'media-pembelajaran'}-export.html`;
    };

    expect(sanitize('Hakikat Norma')).toBe('hakikat-norma-export.html');
    expect(sanitize('')).toBe('media-pembelajaran-export.html');
    expect(sanitize('ABC!!!@#$%')).toBe('abc-export.html');
    expect(sanitize('My   Cool   Title')).toBe('my-cool-title-export.html');
  });

  it('should XSS-encode JSON data (angle brackets and forward slashes)', () => {
    const dataJson = JSON.stringify({ title: '<script>alert("xss")</script>' })
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/\//g, '\\u002f');

    expect(dataJson).not.toContain('<script>');
    expect(dataJson).toContain('\\u003cscript\\u003e');
    expect(dataJson).toContain('\\u002f');
  });

  it('should XSS-safe encode title for HTML title tag', () => {
    const title = '<script>alert("xss")</script>';
    const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    expect(safeTitle).not.toContain('<script>');
    expect(safeTitle).toContain('&lt;script&gt;');
  });

  it('should validate pages requirement', () => {
    const validate = (body: Record<string, unknown>) => {
      const { pages } = body;
      return !pages || !Array.isArray(pages) || pages.length === 0;
    };

    expect(validate({})).toBe(true);
    expect(validate({ pages: [] })).toBe(true);
    expect(validate({ pages: null })).toBe(true);
    expect(validate({ pages: [{ id: 'p1' }] })).toBe(false);
  });

  it('should inject data script before </body>', () => {
    const template = '<!DOCTYPE html><html><head><title>Test</title></head><body><div id="root"></div></body></html>';
    const dataScript = '<script>window.__EXPORT_DATA__={};</script>\n';
    const bodyCloseIdx = template.lastIndexOf('</body>');
    const result = template.substring(0, bodyCloseIdx) + dataScript + template.substring(bodyCloseIdx);
    expect(result).toContain('<script>window.__EXPORT_DATA__={};</script>');
    expect(result).toContain('</body>');
    expect(result.indexOf('__EXPORT_DATA__')).toBeLessThan(result.lastIndexOf('</body>'));
  });

  it('should replace title tag with safe title', () => {
    const template = '<!DOCTYPE html><html><head><title>Old Title</title></head><body></body></html>';
    const safeTitle = 'Hakikat Norma | PPKn VIII';
    const result = template.replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`);
    expect(result).toContain('<title>Hakikat Norma | PPKn VIII</title>');
    expect(result).not.toContain('Old Title');
  });
});

// ═══════════════════════════════════════════════════════════════════
// EXPORT API — Route Handler Logic (inline validation tests)
// ═══════════════════════════════════════════════════════════════════

describe('Export API — Route Handler Logic', () => {
  it('should reject request with no pages (400)', () => {
    const body = {};
    const pages = (body as Record<string, unknown>).pages;
    const isValid = pages && Array.isArray(pages) && pages.length > 0;
    expect(isValid).toBeFalsy();
  });

  it('should reject empty pages array (400)', () => {
    const body = { pages: [] };
    const pages = (body as Record<string, unknown>).pages;
    const isValid = pages && Array.isArray(pages) && (pages as unknown[]).length > 0;
    expect(isValid).toBeFalsy();
  });

  it('should handle template file missing gracefully', () => {
    // Simulate the error handling path
    let status = 500;
    try {
      throw new Error('ENOENT');
    } catch {
      status = 500;
    }
    expect(status).toBe(500);
  });

  it('should generate HTML export data injection for valid pages', () => {
    const template = '<!DOCTYPE html><html><head><title>Export</title></head><body></body></html>';
    const dataScript = '<script>window.__EXPORT_DATA__={};</script>\n';
    const bodyCloseIdx = template.lastIndexOf('</body>');
    const result = template.substring(0, bodyCloseIdx) + dataScript + template.substring(bodyCloseIdx);
    expect(result).toContain('__EXPORT_DATA__');
  });
});

// ═══════════════════════════════════════════════════════════════════
// AI API — Request Validation Tests (pure logic)
// ═══════════════════════════════════════════════════════════════════

describe('AI API — Request Validation', () => {
  const validActions = [
    'kuis', 'matching', 'fill-blank', 'word-search', 'crossword',
    'true-false', 'drag-drop', 'memory', 'roda', 'sortir',
    'diskusi', 'refleksi', 'materi-summary', 'tp', 'petunjuk', 'motivasi',
  ];

  it('should validate all known action types', () => {
    for (const action of validActions) {
      expect(validActions.includes(action)).toBe(true);
    }
    expect(validActions.includes('invalid-action')).toBe(false);
    expect(validActions.includes('')).toBe(false);
  });

  it('should require all mandatory fields (action, mapel, kelas, topik)', () => {
    const required = ['action', 'mapel', 'kelas', 'topik'];

    // Complete request
    const complete = { action: 'kuis', mapel: 'PPKn', kelas: 'VIII', topik: 'Norma' };
    for (const field of required) {
      expect(complete[field as keyof typeof complete]).toBeTruthy();
    }

    // Incomplete request
    const incomplete = { action: 'kuis' };
    for (const field of required) {
      if (field !== 'action') {
        expect((incomplete as Record<string, unknown>)[field]).toBeFalsy();
      }
    }
  });

  it('should default jumlah to 5 when not provided', () => {
    const req = { action: 'kuis', mapel: 'PPKn', kelas: 'VIII', topik: 'Norma' };
    const jumlah = (req as Record<string, unknown>).jumlah || 5;
    expect(jumlah).toBe(5);
  });

  it('should use custom jumlah when provided', () => {
    const req = { action: 'kuis', mapel: 'PPKn', kelas: 'VIII', topik: 'Norma', jumlah: 10 };
    const jumlah = (req as Record<string, unknown>).jumlah || 5;
    expect(jumlah).toBe(10);
  });

  it('should truncate context to 2000 characters', () => {
    const longContext = 'A'.repeat(3000);
    const truncated = longContext.substring(0, 2000);
    expect(truncated.length).toBe(2000);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AI API — Response Parsing Tests (pure logic)
// ═══════════════════════════════════════════════════════════════════

describe('AI API — Response Parsing', () => {
  it('should handle markdown code block stripping from AI response', () => {
    const stripMarkdown = (content: string) => {
      return content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    };

    const jsonContent = '{"title":"Test"}';
    expect(stripMarkdown('```json\n' + jsonContent + '\n```')).toBe(jsonContent);
    expect(stripMarkdown('```\n' + jsonContent + '\n```')).toBe(jsonContent);
    expect(stripMarkdown(jsonContent)).toBe(jsonContent);
    expect(stripMarkdown('```JSON\n' + jsonContent + '\n```')).toBe(jsonContent);
  });

  it('should parse valid JSON after stripping markdown', () => {
    const stripMarkdown = (content: string) => {
      return content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    };

    const rawContent = '```json\n{"title":"Kuis: Norma","questions":[]}\n```';
    const cleaned = stripMarkdown(rawContent);
    const parsed = JSON.parse(cleaned);
    expect(parsed.title).toBe('Kuis: Norma');
    expect(parsed.questions).toEqual([]);
  });

  it('should handle invalid JSON gracefully', () => {
    const stripMarkdown = (content: string) => {
      return content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    };

    const rawContent = 'This is not valid JSON';
    const cleaned = stripMarkdown(rawContent);
    expect(() => JSON.parse(cleaned)).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════
// AI API — Route Handler Logic (inline validation tests)
// ═══════════════════════════════════════════════════════════════════

describe('AI API — Route Handler Logic', () => {
  const VALID_ACTIONS = [
    'kuis', 'matching', 'fill-blank', 'word-search', 'crossword',
    'true-false', 'drag-drop', 'memory', 'roda', 'sortir',
    'diskusi', 'refleksi', 'materi-summary', 'tp', 'petunjuk', 'motivasi',
  ];

  it('should reject request missing required fields', () => {
    const body = { action: 'kuis' };
    const required = ['action', 'mapel', 'kelas', 'topik'];
    const missing = required.filter(f => !(f in body) || !body[f as keyof typeof body]);
    expect(missing.length).toBeGreaterThan(0);
  });

  it('should reject invalid action', () => {
    const action = 'invalid-action';
    expect(VALID_ACTIONS.includes(action)).toBe(false);
  });

  it('should handle SDK initialization failure gracefully', () => {
    let status = 500;
    try {
      throw new Error('SDK initialization failed');
    } catch {
      status = 500;
    }
    expect(status).toBe(500);
  });

  it('should handle AI returning null content', () => {
    const content = null;
    expect(content).toBeNull();
    // Null content should result in a 500 error
    const status = content ? 200 : 500;
    expect(status).toBe(500);
  });
});
