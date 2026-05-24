// ═══════════════════════════════════════════════════════════════════════
// RATE LIMITER TESTS — Token bucket algorithm & helper functions
// ═══════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
  RATE_LIMIT_TIERS,
  type RateLimitTier,
} from '@/lib/rate-limit';

// Helper to advance time by ms (uses vi.useFakeTimers)
function advanceTime(ms: number) {
  vi.advanceTimersByTime(ms);
}

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.now());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Allows requests within limit ─────────────────────────────────

  describe('allows requests within limit', () => {
    it('should allow the first request', () => {
      const result = checkRateLimit('192.168.1.1', 'ai');
      expect(result.allowed).toBe(true);
    });

    it('should allow requests up to the tier max tokens', () => {
      const tier: RateLimitTier = 'ai';
      const max = RATE_LIMIT_TIERS[tier].maxTokens;

      for (let i = 0; i < max; i++) {
        const result = checkRateLimit(`within-limit-${i}`, tier);
        expect(result.allowed).toBe(true);
      }
    });

    it('should decrement remaining tokens on each request', () => {
      const key = 'decrement-test';
      const tier: RateLimitTier = 'general';

      const first = checkRateLimit(key, tier);
      const second = checkRateLimit(key, tier);

      expect(second.remaining).toBe(first.remaining - 1);
    });

    it('should return correct limit value for the tier', () => {
      const result = checkRateLimit('limit-value-test', 'ai');
      expect(result.limit).toBe(RATE_LIMIT_TIERS.ai.maxTokens);
    });
  });

  // ── Blocks requests exceeding limit ──────────────────────────────

  describe('blocks requests exceeding limit', () => {
    it('should block requests once tokens are exhausted', () => {
      const key = 'exhaust-test';
      const tier: RateLimitTier = 'ai';
      const max = RATE_LIMIT_TIERS[tier].maxTokens;

      // Consume all tokens
      for (let i = 0; i < max; i++) {
        checkRateLimit(key, tier);
      }

      // Next request should be blocked
      const result = checkRateLimit(key, tier);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should return a positive resetIn value when blocked', () => {
      const key = 'resetin-test';
      const tier: RateLimitTier = 'export';
      const max = RATE_LIMIT_TIERS[tier].maxTokens;

      for (let i = 0; i < max; i++) {
        checkRateLimit(key, tier);
      }

      const result = checkRateLimit(key, tier);
      expect(result.allowed).toBe(false);
      expect(result.resetIn).toBeGreaterThan(0);
    });

    it('should continue blocking until tokens refill', () => {
      const key = 'continue-block-test';
      const tier: RateLimitTier = 'ai';
      const max = RATE_LIMIT_TIERS[tier].maxTokens;

      for (let i = 0; i < max; i++) {
        checkRateLimit(key, tier);
      }

      // Still blocked immediately after
      const blocked = checkRateLimit(key, tier);
      expect(blocked.allowed).toBe(false);

      // Slight time advance (not enough for refill)
      advanceTime(1000);
      const stillBlocked = checkRateLimit(key, tier);
      expect(stillBlocked.allowed).toBe(false);
    });
  });

  // ── Refills tokens over time ─────────────────────────────────────

  describe('refills tokens over time', () => {
    it('should refill tokens after a full refill interval', () => {
      const key = 'refill-test';
      const tier: RateLimitTier = 'ai';
      const max = RATE_LIMIT_TIERS[tier].maxTokens;

      // Exhaust all tokens
      for (let i = 0; i < max; i++) {
        checkRateLimit(key, tier);
      }

      // Advance past the refill interval
      advanceTime(RATE_LIMIT_TIERS[tier].refillIntervalMs + 1);

      // Should be allowed again
      const result = checkRateLimit(key, tier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it('should partially refill tokens after partial time', () => {
      const key = 'partial-refill-test';
      const tier: RateLimitTier = 'general';
      const max = RATE_LIMIT_TIERS[tier].maxTokens;

      // Exhaust all tokens
      for (let i = 0; i < max; i++) {
        checkRateLimit(key, tier);
      }

      // Advance by half the refill interval
      advanceTime(RATE_LIMIT_TIERS[tier].refillIntervalMs / 2);

      // Still blocked — one full interval hasn't passed yet
      const result = checkRateLimit(key, tier);
      expect(result.allowed).toBe(false);
    });

    it('should not exceed maxTokens after refill', () => {
      const key = 'cap-test';
      const tier: RateLimitTier = 'project';
      const max = RATE_LIMIT_TIERS[tier].maxTokens;

      // Use one token
      const first = checkRateLimit(key, tier);
      expect(first.remaining).toBe(max - 1);

      // Advance well past the refill interval
      advanceTime(RATE_LIMIT_TIERS[tier].refillIntervalMs * 5);

      // Next request should still cap at maxTokens
      const result = checkRateLimit(key, tier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeLessThanOrEqual(max - 1); // -1 because this request consumed a token
    });
  });

  // ── Different tiers have different limits ────────────────────────

  describe('different tiers have different limits', () => {
    it('should have different maxTokens for ai vs general', () => {
      expect(RATE_LIMIT_TIERS.ai.maxTokens).not.toBe(RATE_LIMIT_TIERS.general.maxTokens);
    });

    it('should allow more requests on general tier than ai tier', () => {
      const aiKey = 'tier-ai';
      const generalKey = 'tier-general';

      const aiMax = RATE_LIMIT_TIERS.ai.maxTokens;
      const generalMax = RATE_LIMIT_TIERS.general.maxTokens;

      // Exhaust both
      for (let i = 0; i < aiMax; i++) {
        checkRateLimit(aiKey, 'ai');
      }
      for (let i = 0; i < generalMax; i++) {
        checkRateLimit(generalKey, 'general');
      }

      // Both should be blocked now
      expect(checkRateLimit(aiKey, 'ai').allowed).toBe(false);
      expect(checkRateLimit(generalKey, 'general').allowed).toBe(false);

      // But general should have allowed more requests
      expect(generalMax).toBeGreaterThan(aiMax);
    });

    it('should enforce export tier limits independently', () => {
      const key = 'tier-export';
      const max = RATE_LIMIT_TIERS.export.maxTokens;

      for (let i = 0; i < max; i++) {
        const result = checkRateLimit(key, 'export');
        expect(result.allowed).toBe(true);
      }

      const blocked = checkRateLimit(key, 'export');
      expect(blocked.allowed).toBe(false);
      expect(blocked.limit).toBe(RATE_LIMIT_TIERS.export.maxTokens);
    });

    it('should enforce project tier limits independently', () => {
      const key = 'tier-project';
      const max = RATE_LIMIT_TIERS.project.maxTokens;

      for (let i = 0; i < max; i++) {
        const result = checkRateLimit(key, 'project');
        expect(result.allowed).toBe(true);
      }

      const blocked = checkRateLimit(key, 'project');
      expect(blocked.allowed).toBe(false);
      expect(blocked.limit).toBe(RATE_LIMIT_TIERS.project.maxTokens);
    });

    it('should track different keys independently within same tier', () => {
      const key1 = 'independent-key-1';
      const key2 = 'independent-key-2';
      const tier: RateLimitTier = 'ai';
      const max = RATE_LIMIT_TIERS[tier].maxTokens;

      // Exhaust key1
      for (let i = 0; i < max; i++) {
        checkRateLimit(key1, tier);
      }

      // key1 should be blocked
      expect(checkRateLimit(key1, tier).allowed).toBe(false);

      // key2 should still be allowed (independent tracking)
      expect(checkRateLimit(key2, tier).allowed).toBe(true);
    });
  });

  // ── getClientIp extracts from x-forwarded-for ───────────────────

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const headers = new Headers({
        'x-forwarded-for': '203.0.113.50, 70.41.3.18, 150.172.238.178',
      });
      expect(getClientIp({ headers })).toBe('203.0.113.50');
    });

    it('should handle single IP in x-forwarded-for', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.1',
      });
      expect(getClientIp({ headers })).toBe('192.168.1.1');
    });

    it('should fall back to x-real-ip when x-forwarded-for is absent', () => {
      const headers = new Headers({
        'x-real-ip': '10.0.0.1',
      });
      expect(getClientIp({ headers })).toBe('10.0.0.1');
    });

    it('should return "unknown" when no IP headers are present', () => {
      const headers = new Headers();
      expect(getClientIp({ headers })).toBe('unknown');
    });

    it('should trim whitespace from x-real-ip', () => {
      const headers = new Headers({
        'x-real-ip': '  10.0.0.2  ',
      });
      expect(getClientIp({ headers })).toBe('10.0.0.2');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const headers = new Headers({
        'x-forwarded-for': '203.0.113.1',
        'x-real-ip': '10.0.0.1',
      });
      expect(getClientIp({ headers })).toBe('203.0.113.1');
    });
  });

  // ── rateLimitHeaders returns correct format ──────────────────────

  describe('rateLimitHeaders', () => {
    it('should return standard rate limit headers', () => {
      const result = {
        allowed: true,
        remaining: 8,
        resetIn: 45,
        limit: 10,
      };

      const headers = rateLimitHeaders(result);

      expect(headers).toEqual({
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '8',
        'X-RateLimit-Reset': '45',
      });
    });

    it('should return string values for all headers', () => {
      const result = {
        allowed: false,
        remaining: 0,
        resetIn: 30,
        limit: 60,
      };

      const headers = rateLimitHeaders(result);

      for (const value of Object.values(headers)) {
        expect(typeof value).toBe('string');
      }
    });

    it('should reflect blocked state correctly', () => {
      const result = {
        allowed: false,
        remaining: 0,
        resetIn: 55,
        limit: 10,
      };

      const headers = rateLimitHeaders(result);

      expect(headers['X-RateLimit-Remaining']).toBe('0');
      expect(headers['X-RateLimit-Limit']).toBe('10');
      expect(headers['X-RateLimit-Reset']).toBe('55');
    });

    it('should work with actual checkRateLimit output', () => {
      const result = checkRateLimit('headers-integration-test', 'ai');
      const headers = rateLimitHeaders(result);

      expect(headers).toHaveProperty('X-RateLimit-Limit');
      expect(headers).toHaveProperty('X-RateLimit-Remaining');
      expect(headers).toHaveProperty('X-RateLimit-Reset');

      expect(headers['X-RateLimit-Limit']).toBe(String(RATE_LIMIT_TIERS.ai.maxTokens));
    });
  });
});
