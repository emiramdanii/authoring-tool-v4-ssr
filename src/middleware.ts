// ═══════════════════════════════════════════════════════════════════════
// NEXT.JS MIDDLEWARE — Rate limiting & security headers
// ═══════════════════════════════════════════════════════════════════════
// Runs on every request before it reaches the API route handler.
// Applies rate limiting to expensive endpoints and adds security headers
// to ALL responses (not just API).
//
// Rate limit tiers:
//   /api/ai/*         → 10 req/min (expensive LLM calls)
//   /api/export/*     → 10 req/min (heavy computation)
//   /api/projects/*/save → 20 req/min (frequent saves)
//   /api/*            → 120 req/min (general)
//
// Security headers (Sprint 8.5B):
//   X-Content-Type-Options: nosniff       — prevents MIME-type sniffing
//   X-Frame-Options: DENY                  — clickjacking protection
//   Referrer-Policy: strict-origin-when-cross-origin
//   X-XSS-Protection: 0                    — modern browsers: rely on CSP instead (legacy header off)
//   Permissions-Policy: camera=(), microphone=(), geolocation=()  — disable unused APIs
//   Strict-Transport-Security: max-age=63072000; includeSubDomains; preload — HTTPS enforcement
//   Cross-Origin-Opener-Policy: same-origin  — process isolation
//
// NOTE: Content-Security-Policy is NOT set here. CSP needs page-specific
// nonces (Next.js generateNonce pattern) and is out of scope for 8.5B.
// Tracking as future work in KNOWN_ISSUES.md.
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

// ── Security headers (Sprint 8.5B) ──────────────────────────────────

/**
 * Security headers applied to ALL responses (page + API).
 * Returns a plain object suitable for spreading into NextResponse headers.
 *
 * Design notes:
 *   - X-Frame-Options: DENY — we don't use iframes for our own content;
 *     export HTML may be embedded by users via <iframe>, but that's a
 *     separate origin's concern, not ours.
 *   - Permissions-Policy: only disables APIs we don't use. Add others
 *     (camera, microphone) only if a future feature requires them.
 *   - HSTS: 2 years + preload. Only effective over HTTPS; localhost HTTP
 *     dev is unaffected (browser ignores HSTS on HTTP).
 */
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '0', // Disable legacy XSS auditor; rely on CSP/sanitization
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

/**
 * Apply security headers to a NextResponse.
 * Used by the middleware for every response (page + API).
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

// ── Middleware ───────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Non-API routes: only apply security headers ──────────────
  if (!pathname.startsWith('/api/')) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Health check — apply security headers but skip rate limiting
  if (pathname === '/api') {
    return applySecurityHeaders(NextResponse.next());
  }

  // ── Sandbox mode: API routes return 503 without loading Prisma ──
  // Prevents OOM crash in constrained environments (Prisma Client ~132MB)
  // Client-side fallback kicks in → app renders with empty project list
  // Set SANDBOX_MODE=1 in .env to activate; remove or set 0 for production
  if (process.env.SANDBOX_MODE === '1') {
    return applySecurityHeaders(
      NextResponse.json(
        { success: false, error: 'API tidak tersedia dalam mode sandbox', sandbox: true },
        { status: 503 }
      )
    );
  }

  const clientIp = getClientIp(request);
  const tier = getRateLimitTier(pathname);
  const result = checkRateLimit(clientIp, tier);

  // Build response with rate limit headers
  const headers = rateLimitHeaders(result);

  if (!result.allowed) {
    return applySecurityHeaders(
      NextResponse.json(
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
      )
    );
  }

  // Continue with request, attach rate limit info to response headers
  const response = NextResponse.next();

  // Set rate limit headers on successful responses
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  // Apply security headers (Sprint 8.5B)
  return applySecurityHeaders(response);
}

// ── Matcher — run on all routes except static assets ────────────────
// Sprint 8.5B: expanded from /api/:path* to also cover page routes so
// security headers apply to HTML responses. _next/static/* and
// _next/image/* are excluded to preserve caching.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|sounds/|og.png|manifest.json|sw.js|robots.txt|logo.svg|mockup.html).*)',
  ],
};
