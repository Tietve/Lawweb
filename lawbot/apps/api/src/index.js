/**
 * LawBot API - Main Application
 * Hono-based RESTful API for LawBot system
 */
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { corsMiddleware } from './middleware/cors';
import { formatErrorResponse, getStatusCode, logError } from './utils/errors';
// Import routes
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import searchRoutes from './routes/search';
import analyticsRoutes from './routes/analytics';
import webhooksRoutes from './routes/webhooks';
// Create main application
const app = new Hono();
/**
 * Global middleware
 */
// Request logging
app.use('*', logger());
// Pretty JSON in development
app.use('*', async (c, next) => {
    if (c.env.ENVIRONMENT === 'development') {
        const prettyMiddleware = prettyJSON();
        return prettyMiddleware(c, next);
    }
    await next();
});
// CORS configuration
app.use('*', async (c, next) => {
    const origin = c.env.CORS_ORIGIN || 'http://localhost:3000';
    const corsHandler = corsMiddleware(origin);
    return corsHandler(c, next);
});
// Request ID
app.use('*', async (c, next) => {
    const requestId = crypto.randomUUID();
    c.set('requestId', requestId);
    c.header('X-Request-Id', requestId);
    await next();
});
/**
 * Error handling
 */
app.onError((err, c) => {
    // Log error
    logError(err, {
        requestId: c.get('requestId'),
        path: c.req.path,
        method: c.req.method,
    });
    // Return formatted error response
    const statusCode = getStatusCode(err);
    const errorResponse = formatErrorResponse(err);
    return c.json(errorResponse, statusCode);
});
/**
 * 404 handler
 */
app.notFound((c) => {
    return c.json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${c.req.method} ${c.req.path} not found`,
        },
        timestamp: new Date().toISOString(),
    }, 404);
});
/**
 * Health check endpoint
 */
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        service: 'lawbot-api',
        version: '0.1.0',
        environment: c.env.ENVIRONMENT,
        timestamp: new Date().toISOString(),
    });
});
/**
 * Root endpoint
 */
app.get('/', (c) => {
    return c.json({
        name: 'LawBot API',
        version: '0.1.0',
        description: 'AI-powered legal assistant API built on Cloudflare Workers',
        documentation: '/api/v1',
        health: '/health',
    });
});
/**
 * API v1 Routes
 */
const apiV1 = new Hono();
// API info
apiV1.get('/', (c) => {
    return c.json({
        version: 'v1',
        endpoints: {
            auth: '/api/v1/auth',
            chat: '/api/v1/chat',
            search: '/api/v1/search',
            analytics: '/api/v1/analytics',
            webhooks: '/api/v1/webhooks',
        },
    });
});
// Mount route handlers
apiV1.route('/auth', authRoutes);
apiV1.route('/chat', chatRoutes);
apiV1.route('/search', searchRoutes);
apiV1.route('/analytics', analyticsRoutes);
apiV1.route('/webhooks', webhooksRoutes);
// Mount API v1
app.route('/api/v1', apiV1);
export default app;
