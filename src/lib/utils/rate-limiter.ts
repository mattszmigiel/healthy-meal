/**
 * In-memory rate limiter for AI preview endpoint
 * Implements sliding window rate limiting with automatic cleanup
 *
 * Rate limit: 10 requests per minute per user
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp in milliseconds
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // Seconds until next request allowed
}

// In-memory storage for rate limit tracking
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds
const MAX_REQUESTS_PER_WINDOW = 10;

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// Store cleanup interval reference for graceful shutdown
let cleanupInterval: NodeJS.Timeout | undefined;

/**
 * Periodically cleans up expired rate limit entries to prevent memory leaks
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const entriesToDelete: string[] = [];

  for (const [userId, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      entriesToDelete.push(userId);
    }
  }

  for (const userId of entriesToDelete) {
    rateLimitStore.delete(userId);
  }
}

// Start periodic cleanup
if (typeof setInterval !== "undefined") {
  cleanupInterval = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
}

/**
 * Checks if a user has exceeded the rate limit and updates their request count
 *
 * @param userId - The ID of the user making the request
 * @returns Object indicating if request is allowed and retry time if not
 *
 * @example
 * ```typescript
 * const result = checkRateLimit('user-123');
 * if (!result.allowed) {
 *   return new Response(
 *     JSON.stringify({ error: 'Rate limit exceeded', retry_after: result.retryAfter }),
 *     { status: 429 }
 *   );
 * }
 * ```
 */
export function checkRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  // No entry or entry expired - create new entry
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return { allowed: true };
  }

  // Entry exists and not expired
  if (entry.count < MAX_REQUESTS_PER_WINDOW) {
    // Increment count and allow request
    entry.count++;
    return { allowed: true };
  }

  // Rate limit exceeded
  const retryAfterMs = entry.resetAt - now;
  const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

  return {
    allowed: false,
    retryAfter: retryAfterSeconds,
  };
}

/**
 * Resets the rate limit for a specific user (useful for testing)
 *
 * @param userId - The ID of the user to reset
 */
export function resetRateLimit(userId: string): void {
  rateLimitStore.delete(userId);
}

/**
 * Clears all rate limit entries (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Gets the current rate limit status for a user without incrementing the counter
 * Useful for monitoring/debugging
 *
 * @param userId - The ID of the user to check
 * @returns Current request count and reset time, or null if no entry exists
 */
export function getRateLimitStatus(userId: string): { count: number; resetAt: number } | null {
  const entry = rateLimitStore.get(userId);
  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (now > entry.resetAt) {
    return null; // Entry expired
  }

  return {
    count: entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Cleanup function for graceful shutdown
 * Clears the cleanup interval and all rate limit entries
 * Useful for testing, hot reload, and application shutdown
 *
 * @example
 * ```typescript
 * // In test teardown or application shutdown
 * cleanup();
 * ```
 */
export function cleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = undefined;
  }
  rateLimitStore.clear();
}
