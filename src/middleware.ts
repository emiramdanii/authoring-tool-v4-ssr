// ═══════════════════════════════════════════════════════════════════════
// NEXT.JS MIDDLEWARE — Rate limiting & security headers
// ═══════════════════════════════════════════════════════════════════════
// Runs on every request before it reaches the API route handler.
// Applies rate limiting to expensive endpoints and adds security headers.
//
// Rate limit tiers:
//   /api/ai/*         → 10 req/min (expensive LLM calls)
//   /api/export/*     → 10 req/min (heavy computation)
//   /api/projects/*/save → 20 req/min (frequent saves)
//   /api/*            → 120 req/min (general)
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, rateLimitHeaders, type RateLimitTier } from '@/lib/rate-limit';

// ── Route → Tier mapping ────────────────────────────────────────────

function getRateLimitTier(pathname: string): RateLimitTier {
  if (pathname.startsWith('/api/ai/')) return 'ai';
  // Match both /api/export and /api/export/ (no trailing slash gap)
  if (pathname.startsWith('/api/export')) return 'export';
  if (pathname.startsWith('/api/projects/') && pathname.endsWith('/save')) return 'project';
  if (pathname.startsWith('/api/')) return 'general';
  return 'general';
}

// ── Middleware ───────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply rate limiting to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Health check — bypass rate limiting
  if (pathname === '/api') {
    return NextResponse.next();
  }

  // ── Sandbox mode: API routes return 503 without loading Prisma ──
  // Prevents OOM crash in constrained environments (Prisma Client ~132MB)
  // Client-side fallback kicks in → app renders with empty project list
  // Set SANDBOX_MODE=1 in .env to activate; remove or set 0 for production
  if (process.env.SANDBOX_MODE === '1') {
    return NextResponse.json(
      { success: false, error: 'API tidak tersedia dalam mode sandbox', sandbox: true },
      { status: 503 }
    );
  }

  const clientIp = getClientIp(request);
  const tier = getRateLimitTier(pathname);
  const result = checkRateLimit(clientIp, tier);

  // Build response with rate limit headers
  const headers = rateLimitHeaders(result);

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Terlalu banyak permintaan. Silakan coba lagi dalam beberapa saat.',
        retryAfter: result.resetIn,
      },
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': String(result.resetIn),
        },
      }
    );
  }

  // Continue with request, attach rate limit info to response headers
  const response = NextResponse.next();

  // Set rate limit headers on successful responses
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

// ── Matcher — only run on API routes ────────────────────────────────

export const config = {
  matcher: ['/api/:path*'],
};
