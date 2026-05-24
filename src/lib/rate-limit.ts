// ═══════════════════════════════════════════════════════════════════════
// RATE LIMITER — In-memory token bucket for API route protection
// ═══════════════════════════════════════════════════════════════════════
// Protects expensive endpoints (especially AI/LLM routes) from abuse.
// Uses a sliding-window token bucket with per-IP tracking.
//
// Strategy:
//   - AI routes: 10 requests / 60 seconds (expensive LLM calls)
//   - Project CRUD: 60 requests / 60 seconds
//   - Export routes: 10 requests / 60 seconds (heavy computation)
//   - General API: 120 requests / 60 seconds
//
// In production, replace with Redis-backed store for multi-instance.
// For single-instance deployment, in-memory is sufficient.
// ═══════════════════════════════════════════════════════════════════════

interface TokenBucket {
  /** Remaining tokens */
  tokens: number;
  /** Last refill timestamp (ms) */
  lastRefill: number;
}

interface RateLimitConfig {
  /** Maximum tokens in the bucket */
  maxTokens: number;
  /** Refill rate: how many tokens per interval */
  refillRate: number;
  /** Refill interval in milliseconds */
  refillIntervalMs: number;
}

/** Pre-configured rate limit tiers */
export const RATE_LIMIT_TIERS = {
  /** AI routes — strict limit to prevent LLM cost blowout */
  ai: { maxTokens: 10, refillRate: 10, refillIntervalMs: 60_000 },
  /** Project CRUD — moderate limit */
  project: { maxTokens: 60, refillRate: 60, refillIntervalMs: 60_000 },
  /** Export routes — strict limit (heavy computation) */
  export: { maxTokens: 10, refillRate: 10, refillIntervalMs: 60_000 },
  /** General API — generous limit */
  general: { maxTokens: 120, refillRate: 120, refillIntervalMs: 60_000 },
} as const;

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;

// ── In-memory store ─────────────────────────────────────────────────

const store = new Map<string, TokenBucket>();

// Periodically clean up stale entries (older than 5 minutes)
const CLEANUP_INTERVAL = 5 * 60_000;
const STALE_THRESHOLD = 5 * 60_000;

let lastCleanup = Date.now();

function cleanupStaleEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, bucket] of store.entries()) {
    if (now - bucket.lastRefill > STALE_THRESHOLD) {
      store.delete(key);
    }
  }
}

// ── Token bucket algorithm ──────────────────────────────────────────

function refillTokens(bucket: TokenBucket, config: RateLimitConfig): TokenBucket {
  const now = Date.now();
  const elapsed = now - bucket.lastRefill;

  if (elapsed >= config.refillIntervalMs) {
    // Full refill: one interval has passed
    const intervalsElapsed = Math.floor(elapsed / config.refillIntervalMs);
    const tokensToAdd = intervalsElapsed * config.refillRate;
    const newTokens = Math.min(config.maxTokens, bucket.tokens + tokensToAdd);
    return {
      tokens: newTokens,
      lastRefill: bucket.lastRefill + intervalsElapsed * config.refillIntervalMs,
    };
  }

  return bucket;
}

// ── Public API ──────────────────────────────────────────────────────

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining tokens after this request */
  remaining: number;
  /** Seconds until the next token refill */
  resetIn: number;
  /** Maximum tokens for this tier */
  limit: number;
}

/**
 * Check rate limit for a given key and tier.
 * Call this at the beginning of API route handlers.
 *
 * @param key - Unique identifier (typically IP address)
 * @param tier - Rate limit tier (ai, project, export, general)
 * @returns Rate limit result with allowed status and metadata
 */
export function checkRateLimit(key: string, tier: RateLimitTier): RateLimitResult {
  cleanupStaleEntries();

  const config = RATE_LIMIT_TIERS[tier];
  const storeKey = `${tier}:${key}`;

  let bucket = store.get(storeKey);

  if (!bucket) {
    // First request — start with full bucket minus 1 for this request
    bucket = {
      tokens: config.maxTokens - 1,
      lastRefill: Date.now(),
    };
    store.set(storeKey, bucket);
    return {
      allowed: true,
      remaining: bucket.tokens,
      resetIn: Math.ceil(config.refillIntervalMs / 1000),
      limit: config.maxTokens,
    };
  }

  // Refill tokens based on elapsed time
  bucket = refillTokens(bucket, config);
  store.set(storeKey, bucket);

  if (bucket.tokens <= 0) {
    // No tokens available — rate limited
    const timeSinceRefill = Date.now() - bucket.lastRefill;
    const resetIn = Math.max(1, Math.ceil((config.refillIntervalMs - timeSinceRefill) / 1000));

    return {
      allowed: false,
      remaining: 0,
      resetIn,
      limit: config.maxTokens,
    };
  }

  // Consume a token
  bucket.tokens -= 1;
  store.set(storeKey, bucket);

  const timeSinceRefill = Date.now() - bucket.lastRefill;
  const resetIn = Math.max(1, Math.ceil((config.refillIntervalMs - timeSinceRefill) / 1000));

  return {
    allowed: true,
    remaining: bucket.tokens,
    resetIn,
    limit: config.maxTokens,
  };
}

/**
 * Extract client IP from request headers.
 * Handles X-Forwarded-For from reverse proxies.
 */
export function getClientIp(request: { headers: Headers }): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // X-Forwarded-For: client, proxy1, proxy2
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}

/**
 * Build rate limit response headers for client awareness.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetIn),
  };
}
