// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.5B — API Error Response No-Leak Tests
// ═══════════════════════════════════════════════════════════════════
// Verifies that production error responses from API routes return
// GENERIC messages to the client (no raw error.message / stack trace
// leak), while still logging the full error server-side.
//
// Routes covered:
//   - /api/export         (was leaking raw error.message before 8.5B)
//   - /api/export/scorm   (was leaking raw error.message before 8.5B)
//   - /api/projects       (already generic — regression coverage)
//   - /api/ai             (already generic — regression coverage)
//
// Approach: mock Prisma + fs + AI SDK + heavy modules so the route
// handlers can be invoked in isolation. Trigger error paths by
// making dependencies throw, then assert the response body.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─────────────────────────────────────────────────────────────────
// Mocks — Prisma, fs, serializeForHtmlScript, etc.
// ─────────────────────────────────────────────────────────────────

vi.mock('@/lib/db', () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    page: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/api-validation', () => ({
  exportRequestSchema: { safeParse: vi.fn(() => ({ success: true, data: {} })) },
  zodErrorResponse: vi.fn(() => ({ success: false, error: 'Validation failed' })),
  createProjectSchema: { safeParse: vi.fn(() => ({ success: true, data: {} })) },
  updateProjectSchema: { safeParse: vi.fn(() => ({ success: true, data: {} })) },
}));

vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(() => '<html><body>{{__EXPORT_DATA__}}</body></html>'),
    existsSync: vi.fn(() => true),
    statSync: vi.fn(() => ({ mtimeMs: 12345 })),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
  readFileSync: vi.fn(() => '<html><body>{{__EXPORT_DATA__}}</body></html>'),
  existsSync: vi.fn(() => true),
  statSync: vi.fn(() => ({ mtimeMs: 12345 })),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('@/lib/export/serialize-html-script', () => ({
  serializeForHtmlScript: vi.fn(() => '{}'),
}));

// ─────────────────────────────────────────────────────────────────
// Real imports (after mocks)
// ─────────────────────────────────────────────────────────────────

import { POST as exportPOST } from '@/app/api/export/route';
import { POST as scormPOST } from '@/app/api/export/scorm/route';
import { prisma } from '@/lib/db';
import fs from 'fs';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function makeJsonRequest(body: unknown): NextRequest {
  return new NextRequest('https://example.com/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeScormRequest(body: unknown): NextRequest {
  return new NextRequest('https://example.com/api/export/scorm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.5B — API Error Response No-Leak', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── /api/export no-leak ──────────────────────────────────────

  it('/api/export POST returns GENERIC error message when serializeForHtmlScript throws', async () => {
    // Force serializeForHtmlScript to throw — happens AFTER template is loaded
    // so we reach the catch block at the end of the route handler.
    const { serializeForHtmlScript } = await import('@/lib/export/serialize-html-script');
    vi.mocked(serializeForHtmlScript).mockImplementationOnce(() => {
      throw new Error('TypeError: Cannot read properties of undefined (reading "blocks") at internal/serialize:line:42');
    });

    const req = makeJsonRequest({ pages: [{ id: 'p1', schema: { blocks: [] } }] });
    const res = await exportPOST(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    // The error message MUST be generic — NOT the raw serialize error
    expect(body.error).toBe('Export gagal. Silakan coba lagi.');
    expect(body.error).not.toContain('TypeError');
    expect(body.error).not.toContain('Cannot read properties');
    expect(body.error).not.toContain('internal/serialize:line');
    // success: false also present
    expect(body.success).toBe(false);
  });

  it('/api/export POST logs full error server-side (console.error called)', async () => {
    const { serializeForHtmlScript } = await import('@/lib/export/serialize-html-script');
    vi.mocked(serializeForHtmlScript).mockImplementationOnce(() => {
      throw new Error('Internal serialization error');
    });

    const req = makeJsonRequest({ pages: [{ id: 'p1', schema: { blocks: [] } }] });
    await exportPOST(req);

    // Server-side log MUST have happened (so we don't lose debug info)
    expect(console.error).toHaveBeenCalled();
  });

  // ── /api/export/scorm no-leak ────────────────────────────────

  it('/api/export/scorm POST returns GENERIC error message when serializeForHtmlScript throws', async () => {
    // Force serializeForHtmlScript to throw an internal error
    const { serializeForHtmlScript } = await import('@/lib/export/serialize-html-script');
    vi.mocked(serializeForHtmlScript).mockImplementationOnce(() => {
      throw new Error('TypeError: Cannot read properties of undefined (reading "blocks") at deep:stack:line:99');
    });

    // SCORM route requires valid body — provide minimal valid shape so we
    // get past Zod validation and reach the serialize call.
    const req = makeScormRequest({
      pages: [{ id: 'p1', schema: { blocks: [] } }],
      meta: { title: 'Test' },
    });
    const res = await scormPOST(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    // Generic message — no stack / internal detail leak
    expect(body.error).toBe('Export SCORM gagal. Silakan coba lagi.');
    expect(body.error).not.toContain('TypeError');
    expect(body.error).not.toContain('Cannot read properties');
    expect(body.error).not.toContain('deep:stack');
    expect(body.success).toBe(false);
  });

  // ── /api/projects no-leak (regression — already generic) ────

  it('/api/projects GET returns GENERIC error message when prisma.findMany throws', async () => {
    const { GET } = await import('@/app/api/projects/route');
    vi.mocked(prisma.project.findMany).mockRejectedValueOnce(
      new Error('PrismaClientInitializationError: db connection refused at pclient:line:88')
    );

    const req = new NextRequest('https://example.com/api/projects');
    const res = await GET(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('Failed to fetch projects');
    expect(body.error).not.toContain('PrismaClient');
    expect(body.error).not.toContain('db connection');
    expect(body.error).not.toContain('pclient:line');
  });

  // ── /api/ai no-leak (regression — already generic) ──────────

  it('/api/ai POST returns GENERIC error message when underlying throws', async () => {
    // Mock fetch to throw — AI routes use fetch for SDK calls
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(
      new Error('NetworkError: DNS resolution failed for ai-provider.example.com at resolver:line:42')
    );

    try {
      const { POST } = await import('@/app/api/ai/route');
      const req = new NextRequest('https://example.com/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'test' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe('Gagal menghasilkan konten AI. Silakan coba lagi.');
      expect(body.error).not.toContain('NetworkError');
      expect(body.error).not.toContain('DNS resolution');
      expect(body.error).not.toContain('ai-provider.example.com');
      expect(body.error).not.toContain('resolver:line');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
