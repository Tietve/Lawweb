/**
 * Authentication middleware
 */
import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import { AuthenticationError } from '../utils/errors';
/**
 * JWT authentication middleware
 * Verifies JWT token and adds user info to context
 */
export const authMiddleware = createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthenticationError('Missing or invalid authorization header');
    }
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    try {
        const payload = (await verify(token, c.env.JWT_SECRET));
        // Check token expiration
        if (payload.exp && payload.exp < Date.now() / 1000) {
            throw new AuthenticationError('Token expired');
        }
        // Add user info to context
        c.set('user', {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
        });
        await next();
    }
    catch (error) {
        if (error instanceof AuthenticationError) {
            throw error;
        }
        throw new AuthenticationError('Invalid or expired token');
    }
});
/**
 * Optional authentication middleware
 * Adds user info if token is present, but doesn't require it
 */
export const optionalAuthMiddleware = createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const payload = (await verify(token, c.env.JWT_SECRET));
            if (payload.exp && payload.exp >= Date.now() / 1000) {
                c.set('user', {
                    id: payload.userId,
                    email: payload.email,
                    role: payload.role,
                });
            }
        }
        catch {
            // Ignore invalid tokens for optional auth
        }
    }
    await next();
});
