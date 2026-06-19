// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.5C — /api/upload Route Tests
// ═══════════════════════════════════════════════════════════════════
// Verifies the /api/upload route:
//   1. Successful upload returns 200 + { success, url, filename }
//   2. URL format: /uploads/<sha256>.<ext>
//   3. File is written to public/uploads/
//   4. Invalid MIME type → 400 + generic error
//   5. Empty file → 400 + generic error
//   6. Oversized file → 413 + generic error
//   7. MIME spoofing (claims image/jpeg but bytes are not JPEG) → 400
//   8. No 'file' field in form → 400
//   9. Generic error on internal failure (no stack leak)
//  10. GET discovery endpoint returns metadata
//  11. Same content uploaded twice → same URL (dedupe via content-addressing)
//
// Approach: invoke the POST/GET handlers directly with NextRequest
// objects. Use real filesystem (tmp-based cwd) so we can verify file
// actually written. Cleanup between tests.
//
// NOTE: Uses @vitest-environment node because jsdom's undici version
// has issues parsing multipart/form-data. Node env has native
// Request.formData() support.
// ═══════════════════════════════════════════════════════════════════

// @vitest-environment node

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { mkdir, rm, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

// ─────────────────────────────────────────────────────────────────
// Helpers — build real image buffers with valid magic bytes
// ─────────────────────────────────────────────────────────────────

const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG SOI + APP0 marker
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG signature
const GIF_MAGIC = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); // "GIF89a"
const WEBP_MAGIC = Buffer.from([0x52, 0x49, 0x46, 0x46]); // "RIFF"

function makeFakeImage(mimeType: string, sizeBytes = 1024): Buffer {
  let magic: Buffer;
  switch (mimeType) {
    case 'image/jpeg': magic = JPEG_MAGIC; break;
    case 'image/png':  magic = PNG_MAGIC;  break;
    case 'image/gif':  magic = GIF_MAGIC;  break;
    case 'image/webp': magic = WEBP_MAGIC; break;
    case 'image/svg+xml':
      // SVG is text/XML — no magic bytes
      return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect/></svg>`);
    default:
      throw new Error(`Unknown MIME: ${mimeType}`);
  }
  // Pad with zeros to reach requested size
  const padding = Buffer.alloc(Math.max(0, sizeBytes - magic.length), 0);
  return Buffer.concat([magic, padding]);
}

function makeMaliciousBuffer(mimeType: string, sizeBytes = 1024): Buffer {
  // Start with non-magic bytes — e.g. a script pretending to be JPEG
  const fake = Buffer.alloc(sizeBytes, 0x41); // "AAAA..."
  return fake;
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

// ─────────────────────────────────────────────────────────────────
// Real imports (after helpers defined)
// ─────────────────────────────────────────────────────────────────

import { POST, GET } from '@/app/api/upload/route';

// ─────────────────────────────────────────────────────────────────
// Test setup — use a tmp cwd so uploads go to public/uploads/ in test
// workspace, then clean up after.
// ─────────────────────────────────────────────────────────────────

const ORIGINAL_CWD = process.cwd();
const TEST_UPLOAD_DIR = path.resolve(ORIGINAL_CWD, 'public', 'uploads');

async function clearUploadDir() {
  try {
    await rm(TEST_UPLOAD_DIR, { recursive: true, force: true });
  } catch { /* ignore */ }
}

async function ensureUploadDir() {
  await mkdir(TEST_UPLOAD_DIR, { recursive: true });
}

function makeUploadRequest(file: File): NextRequest {
  const formData = new FormData();
  formData.append('file', file);
  return new NextRequest('https://example.com/api/upload', {
    method: 'POST',
    body: formData,
  });
}

function makeEmptyFormRequest(): NextRequest {
  // No 'file' field
  const formData = new FormData();
  return new NextRequest('https://example.com/api/upload', {
    method: 'POST',
    body: formData,
  });
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.5C — /api/upload Route', () => {
  beforeEach(async () => {
    await clearUploadDir();
    await ensureUploadDir();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await clearUploadDir();
  });

  // ── Successful uploads ───────────────────────────────────────

  it('POST with valid JPEG returns 200 + { success, url, filename }', async () => {
    const buffer = makeFakeImage('image/jpeg', 2048);
    const file = new File([buffer], 'test.jpg', { type: 'image/jpeg' });
    const req = makeUploadRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.url).toMatch(/^\/uploads\/[a-f0-9]{64}\.jpg$/);
    expect(body.filename).toMatch(/^([a-f0-9]{64})\.jpg$/);
    expect(body.size).toBe(buffer.length);
    expect(body.mimeType).toBe('image/jpeg');
  });

  it('POST with valid PNG writes file to public/uploads/<sha256>.png', async () => {
    const buffer = makeFakeImage('image/png', 1024);
    const expectedHash = sha256(buffer);
    const expectedFilename = `${expectedHash}.png`;
    const expectedPath = path.join(TEST_UPLOAD_DIR, expectedFilename);

    const file = new File([buffer], 'test.png', { type: 'image/png' });
    const req = makeUploadRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify file exists on disk
    await access(expectedPath);

    // Verify content matches
    const written = await readFile(expectedPath);
    expect(written.equals(buffer)).toBe(true);
  });

  it('POST with valid GIF returns URL with .gif extension', async () => {
    const buffer = makeFakeImage('image/gif', 512);
    const file = new File([buffer], 'anim.gif', { type: 'image/gif' });
    const req = makeUploadRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toMatch(/^\/uploads\/[a-f0-9]{64}\.gif$/);
  });

  it('POST with valid WebP returns URL with .webp extension', async () => {
    const buffer = makeFakeImage('image/webp', 1024);
    const file = new File([buffer], 'photo.webp', { type: 'image/webp' });
    const req = makeUploadRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toMatch(/^\/uploads\/[a-f0-9]{64}\.webp$/);
  });

  it('POST with valid SVG returns URL with .svg extension', async () => {
    const buffer = makeFakeImage('image/svg+xml', 0); // size override ignored for SVG
    const file = new File([buffer], 'icon.svg', { type: 'image/svg+xml' });
    const req = makeUploadRequest(file);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toMatch(/^\/uploads\/[a-f0-9]{64}\.svg$/);
  });

  // ── Content-addressed dedupe ────────────────────────────────

  it('Same content uploaded twice returns the SAME url (content-addressed dedupe)', async () => {
    const buffer = makeFakeImage('image/png', 1024);
    const file1 = new File([buffer], 'a.png', { type: 'image/png' });
    const file2 = new File([buffer], 'b.png', { type: 'image/png' });

    const res1 = await POST(makeUploadRequest(file1));
    const res2 = await POST(makeUploadRequest(file2));

    const body1 = await res1.json();
    const body2 = await res2.json();

    expect(body1.url).toBe(body2.url);
    expect(body1.filename).toBe(body2.filename);
  });

  // ── Validation failures ─────────────────────────────────────

  it('POST with invalid MIME type (text/plain) returns 400 + generic error', async () => {
    const buffer = Buffer.from('hello world');
    const file = new File([buffer], 'notes.txt', { type: 'text/plain' });
    const req = makeUploadRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Tipe file tidak didukung');
  });

  it('POST with empty file returns 400 + generic error', async () => {
    const buffer = Buffer.alloc(0);
    const file = new File([buffer], 'empty.png', { type: 'image/png' });
    const req = makeUploadRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('kosong');
  });

  it('POST with file >5MB returns 413 + generic error', async () => {
    // Build a buffer just over 5MB
    const buffer = Buffer.concat([
      PNG_MAGIC,
      Buffer.alloc(5 * 1024 * 1024 + 1 - PNG_MAGIC.length, 0),
    ]);
    const file = new File([buffer], 'huge.png', { type: 'image/png' });
    const req = makeUploadRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Ukuran file melebihi batas');
  });

  it('POST with MIME spoofing (claims JPEG but bytes are not JPEG) returns 400', async () => {
    const buffer = makeMaliciousBuffer('image/jpeg', 1024);
    const file = new File([buffer], 'malicious.jpg', { type: 'image/jpeg' });
    const req = makeUploadRequest(file);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Konten file tidak sesuai');
  });

  it('POST with no "file" field in form returns 400', async () => {
    const req = makeEmptyFormRequest();
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('File tidak ditemukan');
  });

  // ── No stack leak (Sprint 8.5B regression) ──────────────────

  it('POST returns GENERIC error message on internal failure (no stack leak)', async () => {
    // Force an internal failure by mocking fs/promises.writeFile to throw
    // a non-EEXIST error. We use vi.mock to replace the module BEFORE
    // the route is imported — but since the route already imported the
    // real fs/promises, we use vi.doMock + dynamic import instead.
    //
    // Simpler approach: spy on console.error + verify the route's catch
    // block returns the generic message. We do this by mocking the
    // crypto module — but that's also imported.
    //
    // Cleanest approach: use vi.spyOn on fs/promises.writeFile AFTER
    // the route is loaded. Since the route captures writeFile at module
    // load time, we need to mock the module itself. Use vi.resetModules
    // + dynamic import.

    vi.resetModules();
    vi.doMock('node:fs/promises', () => ({
      mkdir: vi.fn(async () => undefined),
      writeFile: vi.fn(async () => {
        const err: NodeJS.ErrnoException = new Error('EACCES: permission denied, open \'/etc/passwd\'');
        err.code = 'EACCES';
        throw err;
      }),
    }));

    const { POST: POSTMocked } = await import('@/app/api/upload/route');

    const buffer = makeFakeImage('image/png', 512);
    const file = new File([buffer], 'test.png', { type: 'image/png' });
    const req = makeUploadRequest(file);
    const res = await POSTMocked(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    // Generic message — no stack / internal path leak
    expect(body.error).toBe('Gagal mengunggah file. Silakan coba lagi.');
    expect(body.error).not.toContain('EACCES');
    expect(body.error).not.toContain('permission denied');
    expect(body.error).not.toContain('/etc/passwd');
    // Server-side log preserved
    expect(console.error).toHaveBeenCalled();

    vi.doUnmock('node:fs/promises');
    vi.resetModules();
  });

  // ── GET discovery endpoint ──────────────────────────────────

  it('GET returns discovery metadata (endpoint, methods, maxFileSize, allowedTypes)', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.endpoint).toBe('/api/upload');
    expect(body.methods).toContain('POST');
    expect(body.maxFileSize).toBe('5MB');
    expect(body.allowedTypes).toContain('image/jpeg');
    expect(body.allowedTypes).toContain('image/png');
    expect(body.allowedTypes).toContain('image/gif');
    expect(body.allowedTypes).toContain('image/webp');
    expect(body.allowedTypes).toContain('image/svg+xml');
  });
});
