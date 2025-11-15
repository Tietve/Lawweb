/**
 * Authentication routes
 */
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { rateLimitByIp } from '../middleware/ratelimit';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { AuthenticationError, ConflictError, NotFoundError } from '../utils/errors';
import { generateId } from '@lawbot/shared';
const auth = new Hono();
// Validation schemas
const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
});
const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});
// Rate limiting: 5 requests per minute for auth endpoints
const authRateLimit = rateLimitByIp({ windowMs: 60000, max: 5 });
/**
 * POST /api/v1/auth/register
 * Register new user
 */
auth.post('/register', authRateLimit, validateBody(registerSchema), async (c) => {
    const { email, password, name } = c.req.valid('json');
    // Check if user already exists
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) {
        throw new ConflictError('Email already registered');
    }
    // Hash password
    const passwordHash = await hashPassword(password);
    // Create user
    const userId = generateId();
    const now = new Date().toISOString();
    await c.env.DB.prepare(`INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(userId, email, passwordHash, name, 'user', now, now).run();
    // Generate JWT
    const token = await sign({
        userId,
        email,
        role: 'user',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    }, c.env.JWT_SECRET);
    return c.json({
        success: true,
        data: {
            user: { id: userId, email, name, role: 'user' },
            token,
        },
    }, 201);
});
/**
 * POST /api/v1/auth/login
 * User login
 */
auth.post('/login', authRateLimit, validateBody(loginSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    // Find user
    const user = await c.env.DB.prepare('SELECT id, email, name, password_hash, role FROM users WHERE email = ?').bind(email).first();
    if (!user) {
        throw new AuthenticationError('Invalid email or password');
    }
    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
        throw new AuthenticationError('Invalid email or password');
    }
    // Generate JWT
    const token = await sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    }, c.env.JWT_SECRET);
    return c.json({
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            token,
        },
    });
});
/**
 * POST /api/v1/auth/refresh
 * Refresh JWT token
 */
auth.post('/refresh', authMiddleware, async (c) => {
    const currentUser = c.get('user');
    // Generate new JWT
    const token = await sign({
        userId: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    }, c.env.JWT_SECRET);
    return c.json({
        success: true,
        data: { token },
    });
});
/**
 * GET /api/v1/auth/me
 * Get current user info
 */
auth.get('/me', authMiddleware, async (c) => {
    const currentUser = c.get('user');
    // Fetch full user data
    const user = await c.env.DB.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').bind(currentUser.id).first();
    if (!user) {
        throw new NotFoundError('User');
    }
    return c.json({
        success: true,
        data: { user },
    });
});
export default auth;
