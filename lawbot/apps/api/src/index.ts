import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jwt } from 'hono/jwt';

type Bindings = {
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  UPLOADS: R2Bucket;
  RATE_LIMIT: KVNamespace;
  CHATBOT: Fetcher;
  JWT_SECRET: string;
  CLAUDE_API_KEY: string;
  CORS_ORIGIN: string;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.CORS_ORIGIN,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'lawbot-api',
    timestamp: new Date().toISOString(),
  });
});

// Public routes
const publicRoutes = new Hono<{ Bindings: Bindings }>();

publicRoutes.get('/', (c) => {
  return c.json({
    name: 'LawBot API',
    version: '0.1.0',
    description: 'AI-powered legal assistant API',
  });
});

app.route('/api/v1', publicRoutes);

// Protected routes (require JWT)
const protectedRoutes = new Hono<{ Bindings: Bindings }>();

protectedRoutes.use('*', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});

protectedRoutes.get('/documents', async (c) => {
  // TODO: Implement document listing
  return c.json({ documents: [] });
});

protectedRoutes.post('/documents', async (c) => {
  // TODO: Implement document upload
  return c.json({ message: 'Document upload endpoint - Phase 03' });
});

app.route('/api/v1/protected', protectedRoutes);

export default app;
