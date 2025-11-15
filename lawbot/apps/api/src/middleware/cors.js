/**
 * CORS middleware configuration
 */
import { cors } from 'hono/cors';
/**
 * CORS middleware with environment-aware configuration
 */
export function corsMiddleware(allowedOrigin) {
    return cors({
        origin: (origin) => {
            // Allow all origins in development
            if (allowedOrigin === '*') {
                return origin;
            }
            // Check if origin is allowed
            const allowed = allowedOrigin.split(',').map((o) => o.trim());
            if (allowed.includes(origin)) {
                return origin;
            }
            // Default to first allowed origin
            return allowed[0];
        },
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposeHeaders: ['Content-Length', 'X-Request-Id'],
        maxAge: 86400, // 24 hours
        credentials: true,
    });
}
