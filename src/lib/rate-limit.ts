/**
 * Simple in-memory rate limiter for serverless.
 * Each instance tracks requests per IP within a sliding window.
 * Note: In multi-instance deployments, limits are per-instance.
 * For stricter enforcement, use Redis-backed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const store of stores.values()) {
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimit(options: {
  /** Unique name for this limiter (e.g. 'login', 'contact') */
  name: string;
  /** Max number of requests in the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
}) {
  const { name, maxRequests, windowSeconds } = options;

  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  const store = stores.get(name)!;

  return {
    /**
     * Check if the given key (typically IP) is rate limited.
     * Returns { success: true } if allowed, { success: false, retryAfter } if blocked.
     */
    check(key: string): { success: boolean; remaining: number; retryAfter?: number } {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || entry.resetAt < now) {
        // New window
        store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
        return { success: true, remaining: maxRequests - 1 };
      }

      if (entry.count >= maxRequests) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return { success: false, remaining: 0, retryAfter };
      }

      entry.count++;
      return { success: true, remaining: maxRequests - entry.count };
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
