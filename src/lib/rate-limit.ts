import { redis } from './redis';

interface RateLimitResponse {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Basic rate limiting helper using Redis (or memory cache fallback)
 * @param identifier Unique identifier, usually user IP address or user ID
 * @param limit Max requests allowed in the window
 * @param windowSeconds Window length in seconds (default 60s)
 */
export async function rateLimit(
  identifier: string,
  limit = 20,
  windowSeconds = 60
): Promise<RateLimitResponse> {
  const key = `ratelimit:${identifier}`;

  try {
    const current = await redis.get(key);

    if (current === null) {
      // Key doesn't exist, set it to 1 and apply expiration
      await redis.set(key, 1, { ex: windowSeconds });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: windowSeconds,
      };
    }

    const count = Number(current);

    if (count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: windowSeconds, // Simplification of reset window
      };
    }

    // Key exists and is below limit, increment it
    const updated = await redis.incr(key);
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - updated),
      reset: windowSeconds,
    };
  } catch (error) {
    console.error('Rate limiting error, allowing request through.', error);
    // Fail-open to avoid breaking the application in case of cache issues
    return {
      success: true,
      limit,
      remaining: 1,
      reset: 0,
    };
  }
}
