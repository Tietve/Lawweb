/**
 * Rate limiting middleware
 */
import { createMiddleware } from 'hono/factory';
import { RateLimitError } from '../utils/errors';
/**
 * Rate limit by IP address
 */
export function rateLimitByIp(config) {
    const { windowMs, max, keyPrefix = 'ratelimit:ip' } = config;
    return createMiddleware(async (c, next) => {
        const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
        const key = `${keyPrefix}:${ip}`;
        const now = Date.now();
        try {
            // Get current count from KV
            const data = await c.env.RATE_LIMIT.get(key, 'json');
            if (data) {
                // Check if window has expired
                if (now > data.resetAt) {
                    // Reset counter
                    await c.env.RATE_LIMIT.put(key, JSON.stringify({ count: 1, resetAt: now + windowMs }), { expirationTtl: Math.ceil(windowMs / 1000) });
                }
                else if (data.count >= max) {
                    // Rate limit exceeded
                    const retryAfter = Math.ceil((data.resetAt - now) / 1000);
                    c.header('Retry-After', retryAfter.toString());
                    c.header('X-RateLimit-Limit', max.toString());
                    c.header('X-RateLimit-Remaining', '0');
                    c.header('X-RateLimit-Reset', data.resetAt.toString());
                    throw new RateLimitError(`Too many requests. Retry after ${retryAfter} seconds`);
                }
                else {
                    // Increment counter
                    await c.env.RATE_LIMIT.put(key, JSON.stringify({ count: data.count + 1, resetAt: data.resetAt }), { expirationTtl: Math.ceil((data.resetAt - now) / 1000) });
                    // Set rate limit headers
                    c.header('X-RateLimit-Limit', max.toString());
                    c.header('X-RateLimit-Remaining', (max - data.count - 1).toString());
                    c.header('X-RateLimit-Reset', data.resetAt.toString());
                }
            }
            else {
                // First request in window
                await c.env.RATE_LIMIT.put(key, JSON.stringify({ count: 1, resetAt: now + windowMs }), { expirationTtl: Math.ceil(windowMs / 1000) });
                c.header('X-RateLimit-Limit', max.toString());
                c.header('X-RateLimit-Remaining', (max - 1).toString());
                c.header('X-RateLimit-Reset', (now + windowMs).toString());
            }
        }
        catch (error) {
            if (error instanceof RateLimitError) {
                throw error;
            }
            // If KV fails, allow request but log error
            console.error('Rate limit check failed:', error);
        }
        await next();
    });
}
/**
 * Rate limit by user ID
 */
export function rateLimitByUser(config) {
    const { windowMs, max, keyPrefix = 'ratelimit:user' } = config;
    return createMiddleware(async (c, next) => {
        const user = c.get('user');
        if (!user) {
            await next();
            return;
        }
        const key = `${keyPrefix}:${user.id}`;
        const now = Date.now();
        try {
            const data = await c.env.RATE_LIMIT.get(key, 'json');
            if (data) {
                if (now > data.resetAt) {
                    await c.env.RATE_LIMIT.put(key, JSON.stringify({ count: 1, resetAt: now + windowMs }), { expirationTtl: Math.ceil(windowMs / 1000) });
                }
                else if (data.count >= max) {
                    const retryAfter = Math.ceil((data.resetAt - now) / 1000);
                    throw new RateLimitError(`Too many requests. Retry after ${retryAfter} seconds`);
                }
                else {
                    await c.env.RATE_LIMIT.put(key, JSON.stringify({ count: data.count + 1, resetAt: data.resetAt }), { expirationTtl: Math.ceil((data.resetAt - now) / 1000) });
                }
            }
            else {
                await c.env.RATE_LIMIT.put(key, JSON.stringify({ count: 1, resetAt: now + windowMs }), { expirationTtl: Math.ceil(windowMs / 1000) });
            }
        }
        catch (error) {
            if (error instanceof RateLimitError) {
                throw error;
            }
            console.error('Rate limit check failed:', error);
        }
        await next();
    });
}
