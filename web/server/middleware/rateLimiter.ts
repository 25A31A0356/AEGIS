/**
 * AGIES Backend - Sliding Window Rate Limiting Architecture
 * Protects emergency alert streams, media uploads, and AI chat endpoints from DDoS and abuse.
 */

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export class RateLimiter {
  private static store: Map<string, RateLimitRecord> = new Map();

  // Endpoint-specific rate limiting configurations
  private static readonly ENDPOINT_LIMITS: Record<string, RateLimitConfig> = {
    '/api/ai/chat': { limit: 20, windowMs: 60000 },          // 20 AI prompts per minute
    '/api/reports/media': { limit: 15, windowMs: 60000 },    // 15 uploads per minute
    '/api/reports': { limit: 10, windowMs: 60000 },          // 10 incident reports per minute
    '/api/locations': { limit: 30, windowMs: 60000 },        // 30 location saves per minute
    '/api/csrf-token': { limit: 60, windowMs: 60000 },       // 60 token requests per minute
  };

  private static readonly DEFAULT_CONFIG: RateLimitConfig = {
    limit: 120, // 120 requests per minute default
    windowMs: 60000,
  };

  /**
   * Resolves the rate limit configuration for a specific request path
   */
  public static getConfigForPath(path: string): RateLimitConfig {
    for (const [routePrefix, config] of Object.entries(this.ENDPOINT_LIMITS)) {
      if (path.startsWith(routePrefix)) {
        return config;
      }
    }
    return this.DEFAULT_CONFIG;
  }

  /**
   * Check if client IP or API key has exceeded rate limit for a given endpoint
   */
  public static check(
    identifier: string,
    path: string = '/api'
  ): { allowed: boolean; remaining: number; resetTime: number; limit: number } {
    const config = this.getConfigForPath(path);
    const key = `${identifier}:${path.split('?')[0]}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Filter timestamps within current sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= config.limit) {
      const oldestTimestamp = record.timestamps[0];
      const resetTime = oldestTimestamp + config.windowMs;
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        limit: config.limit,
      };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: config.limit - record.timestamps.length,
      resetTime: now + config.windowMs,
      limit: config.limit,
    };
  }

  /**
   * Reset store (useful for testing)
   */
  public static reset(): void {
    this.store.clear();
  }

  /**
   * Clean up stale records periodically
   */
  public static cleanup(windowMs: number = 60000): void {
    const cutoff = Date.now() - windowMs;
    for (const [key, record] of this.store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > cutoff);
      if (record.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }
}

// Periodic cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => RateLimiter.cleanup(), 300000);
}
