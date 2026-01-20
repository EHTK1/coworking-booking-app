// lib/rate-limit.ts - Simple in-memory rate limiting

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitStore>();

export interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

/**
 * Simple in-memory rate limiter
 * For production, use Redis-backed solution (e.g., upstash/ratelimit)
 */
export function rateLimit(identifier: string, config: RateLimitConfig): {
  success: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const key = identifier;

  let record = store.get(key);

  // Clean expired entries periodically
  if (Math.random() < 0.01) {
    cleanupExpired();
  }

  // Reset if window expired
  if (!record || now > record.resetAt) {
    record = {
      count: 0,
      resetAt: now + config.interval,
    };
  }

  record.count++;
  store.set(key, record);

  const success = record.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - record.count);

  return {
    success,
    remaining,
    resetAt: record.resetAt,
  };
}

function cleanupExpired() {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  // Try various headers for real IP (behind proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return 'unknown';
}

/**
 * Preset configurations
 */
export const RATE_LIMITS = {
  // Auth endpoints: 5 requests per 15 minutes
  AUTH: {
    interval: 15 * 60 * 1000,
    maxRequests: 5,
  },
  // Admin endpoints: 100 requests per minute
  ADMIN: {
    interval: 60 * 1000,
    maxRequests: 100,
  },
  // API endpoints: 200 requests per minute
  API: {
    interval: 60 * 1000,
    maxRequests: 200,
  },
} as const;
