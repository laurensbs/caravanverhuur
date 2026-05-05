/**
 * Rate limiter met dual-mode:
 *   - Upstash Redis (sliding-window, shared state over alle Vercel instances)
 *     wanneer UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN gezet zijn.
 *   - In-memory fallback per instance voor lokale dev en als safety-net.
 *
 * Alle limiters retourneren `Promise<{ success, remaining, retryAfter? }>`.
 * Callers gebruiken `await limiter.check(ip)`.
 *
 * Migration-pad: zet de twee env-vars in Vercel (gratis tier van Upstash
 * is ruim genoeg) en alle limits worden meteen multi-instance-correct.
 * Zonder env-vars werkt alles als voorheen.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memStores = new Map<string, Map<string, RateLimitEntry>>();

// Cleanup verouderde entries elke 5 minuten (alleen in-memory mode).
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const store of memStores.values()) {
      for (const [key, entry] of store) {
        if (entry.resetAt < now) store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

// Lazy Redis-client: één instance gedeeld door alle limiters.
let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

export interface CheckResult {
  success: boolean;
  remaining: number;
  retryAfter?: number;
}

export function rateLimit(options: {
  /** Unique name (gebruikt als Redis-prefix + memory-key). */
  name: string;
  /** Max requests in window. */
  maxRequests: number;
  /** Window in seconden. */
  windowSeconds: number;
}) {
  const { name, maxRequests, windowSeconds } = options;

  // Bouw Upstash-limiter lazy zodat tests/dev-mode zonder env-vars werken.
  let _upstash: Ratelimit | null = null;
  function getUpstash(): Ratelimit | null {
    if (_upstash) return _upstash;
    const redis = getRedis();
    if (!redis) return null;
    _upstash = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
      prefix: `rl:${name}`,
      analytics: false,
    });
    return _upstash;
  }

  function memCheck(key: string): CheckResult {
    if (!memStores.has(name)) memStores.set(name, new Map());
    const store = memStores.get(name)!;
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return { success: true, remaining: maxRequests - 1 };
    }
    if (entry.count >= maxRequests) {
      return { success: false, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }
    entry.count++;
    return { success: true, remaining: maxRequests - entry.count };
  }

  return {
    /**
     * Check of `key` (typisch IP) onder de limit zit. Geeft success=false
     * + retryAfter als het rate-limit is bereikt.
     *
     * Redis-failure → fallt back naar in-memory zodat een Upstash-outage
     * geen rate-limiting completely uitschakelt of users blokkeert.
     */
    async check(key: string): Promise<CheckResult> {
      const limiter = getUpstash();
      if (!limiter) return memCheck(key);
      try {
        const res = await limiter.limit(key);
        if (res.success) {
          return { success: true, remaining: res.remaining };
        }
        const retryAfter = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
        return { success: false, remaining: 0, retryAfter };
      } catch (err) {
        console.error(`[rate-limit:${name}] Upstash error, falling back to in-memory:`, err);
        return memCheck(key);
      }
    },
  };
}

// ===== Pre-configured limiters =====

/** Login: 5 attempts per 15 minutes per IP */
export const loginLimiter = rateLimit({ name: 'login', maxRequests: 5, windowSeconds: 15 * 60 });

/** Register: 3 attempts per 30 minutes per IP */
export const registerLimiter = rateLimit({ name: 'register', maxRequests: 3, windowSeconds: 30 * 60 });

/** Contact form: 3 submissions per 10 minutes per IP */
export const contactLimiter = rateLimit({ name: 'contact', maxRequests: 3, windowSeconds: 10 * 60 });

/** Chat: 10 messages per 5 minutes per IP */
export const chatLimiter = rateLimit({ name: 'chat', maxRequests: 10, windowSeconds: 5 * 60 });

/** Password reset: 3 requests per 30 minutes per IP */
export const passwordResetLimiter = rateLimit({ name: 'password-reset', maxRequests: 3, windowSeconds: 30 * 60 });

/** Admin login: 5 attempts per 15 minutes per IP */
export const adminLoginLimiter = rateLimit({ name: 'admin-login', maxRequests: 5, windowSeconds: 15 * 60 });

/** Checkout: 10 sessions per 15 minutes per IP */
export const checkoutLimiter = rateLimit({ name: 'checkout', maxRequests: 10, windowSeconds: 15 * 60 });

/** Booking creation: 5 bookings per 30 minutes per IP */
export const bookingLimiter = rateLimit({ name: 'booking', maxRequests: 5, windowSeconds: 30 * 60 });

/** Borg token lookup: 20 requests per 5 minutes per IP */
export const borgLimiter = rateLimit({ name: 'borg', maxRequests: 20, windowSeconds: 5 * 60 });

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
