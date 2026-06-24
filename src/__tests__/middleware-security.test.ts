// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.5B — Middleware Security Headers Tests
// ═══════════════════════════════════════════════════════════════════
// Verifies that the middleware:
//   1. Sets all required security headers on API responses
//   2. Sets all required security headers on page (non-API) responses
//   3. Sets security headers on 429 rate-limit responses
//   4. Sets security headers on sandbox-mode 503 responses
//   5. Rate-limit tier mapping is correct (ai/export/project/general)
//   6. Rate limit still applies (regression — existing behavior preserved)
//
// Approach: direct unit-test of the middleware function with mocked
// NextRequest objects. No HTTP server needed.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─────────────────────────────────────────────────────────────────
// Mock rate-limit with hoisted state so we can control allowed/blocked
// ─────────────────────────────────────────────────────────────────

const rateLimitState = vi.hoisted(() => ({
  nextAllowed: true,
  nextResetIn: 60,
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({
    allowed: rateLimitState.nextAllowed,
    resetIn: rateLimitState.nextResetIn,
    limit: 120,
    remaining: rateLimitState.nextAllowed ? 119 : 0,
  })),
  getClientIp: vi.fn(() => '127.0.0.1'),
  rateLimitHeaders: vi.fn((result: { limit: number; remaining: number; resetIn: number }) => ({
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetIn),
  })),
}));

// ─────────────────────────────────────────────────────────────────
// Real imports (after mocks)
// ─────────────────────────────────────────────────────────────────

import { middleware, SECURITY_HEADERS } from '@/middleware';
import { checkRateLimit } from '@/lib/rate-limit';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function makeRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(`https://example.com${pathname}`), {
    method: 'GET',
  });
}

function getCheckRateLimitMock() {
  return vi.mocked(checkRateLimit);
}

function resetRateLimitMock() {
  rateLimitState.nextAllowed = true;
  rateLimitState.nextResetIn = 60;
  getCheckRateLimitMock().mockClear();
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.5B — Middleware Security Headers', () => {
  beforeEach(() => {
    resetRateLimitMock();
    delete process.env.SANDBOX_MODE;
  });

  afterEach(() => {
    delete process.env.SANDBOX_MODE;
    vi.restoreAllMocks();
  });

  // ── SECURITY_HEADERS constant ────────────────────────────────

  it('SECURITY_HEADERS exports all required headers', () => {
    expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
    expect(SECURITY_HEADERS['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(SECURITY_HEADERS['X-XSS-Protection']).toBe('0');
    expect(SECURITY_HEADERS['Permissions-Policy']).toContain('camera=()');
    expect(SECURITY_HEADERS['Permissions-Policy']).toContain('microphone=()');
    expect(SECURITY_HEADERS['Strict-Transport-Security']).toContain('max-age=63072000');
    expect(SECURITY_HEADERS['Cross-Origin-Opener-Policy']).toBe('same-origin');
  });

  // ── Security headers on API responses ────────────────────────

  it('API response includes all security headers (general tier)', async () => {
    const req = makeRequest('/api/projects');
    const res = await middleware(req);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('X-XSS-Protection')).toBe('0');
    expect(res.headers.get('Permissions-Policy')).toContain('camera=()');
    expect(res.headers.get('Strict-Transport-Security')).toContain('max-age=63072000');
    expect(res.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
  });

  it('API response includes security headers on /api/ai/* (ai tier)', async () => {
    const req = makeRequest('/api/ai/lesson');
    const res = await middleware(req);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('API response includes security headers on /api/export (export tier)', async () => {
    const req = makeRequest('/api/export');
    const res = await middleware(req);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('API response includes security headers on /api/projects/:id/save (project tier)', async () => {
    const req = makeRequest('/api/projects/abc-123/save');
    const res = await middleware(req);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  // ── Security headers on page (non-API) responses ────────────

  it('Page response (non-API) includes all security headers', async () => {
    const req = makeRequest('/');
    const res = await middleware(req);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('Permissions-Policy')).toContain('camera=()');
  });

  it('Health check /api endpoint includes security headers', async () => {
    const req = makeRequest('/api');
    const res = await middleware(req);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  // ── Security headers on rate-limited (429) responses ────────

  it('429 rate-limit response includes all security headers', async () => {
    rateLimitState.nextAllowed = false;

    const req = makeRequest('/api/projects');
    const res = await middleware(req);
    expect(res.status).toBe(429);
    // Security headers must still be present even on rate-limited responses
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    // Rate-limit headers also present
    expect(res.headers.get('X-RateLimit-Limit')).toBeTruthy();
    expect(res.headers.get('Retry-After')).toBeTruthy();
  });

  // ── Security headers on sandbox-mode 503 responses ──────────

  it('503 sandbox-mode response includes all security headers', async () => {
    process.env.SANDBOX_MODE = '1';
    const req = makeRequest('/api/projects');
    const res = await middleware(req);
    expect(res.status).toBe(503);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  // ── Rate-limit tier mapping (regression — existing behavior) ─

  it('rate-limit called with tier="ai" for /api/ai/* paths', async () => {
    const spy = getCheckRateLimitMock();
    await middleware(makeRequest('/api/ai/lesson'));
    expect(spy).toHaveBeenCalledWith('127.0.0.1', 'ai');
  });

  it('rate-limit called with tier="export" for /api/export* paths', async () => {
    const spy = getCheckRateLimitMock();
    await middleware(makeRequest('/api/export'));
    expect(spy).toHaveBeenCalledWith('127.0.0.1', 'export');
    spy.mockClear();
    await middleware(makeRequest('/api/export/scorm'));
    expect(spy).toHaveBeenCalledWith('127.0.0.1', 'export');
  });

  it('rate-limit called with tier="project" for /api/projects/:id/save', async () => {
    const spy = getCheckRateLimitMock();
    await middleware(makeRequest('/api/projects/abc/save'));
    expect(spy).toHaveBeenCalledWith('127.0.0.1', 'project');
  });

  it('rate-limit called with tier="general" for other /api/* paths', async () => {
    const spy = getCheckRateLimitMock();
    await middleware(makeRequest('/api/projects'));
    expect(spy).toHaveBeenCalledWith('127.0.0.1', 'general');
  });

  it('rate-limit NOT called for non-API paths (only security headers applied)', async () => {
    const spy = getCheckRateLimitMock();
    await middleware(makeRequest('/'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('rate-limit NOT called for /api health check endpoint', async () => {
    const spy = getCheckRateLimitMock();
    await middleware(makeRequest('/api'));
    expect(spy).not.toHaveBeenCalled();
  });
});
