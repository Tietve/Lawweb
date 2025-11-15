import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

type Bindings = {
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  ASSETS: R2Bucket;
  SESSIONS: KVNamespace;
  CHAT_ROOM: DurableObjectNamespace;
  CLAUDE_API_KEY: string;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'lawbot-chatbot',
    timestamp: new Date().toISOString(),
  });
});

// Chat endpoint
app.post('/chat', async (c) => {
  const { message: _message, sessionId } = await c.req.json();

  // TODO: Implement chat logic with RAG
  return c.json({
    response: 'Chat functionality will be implemented in Phase 04',
    sessionId,
  });
});

// Sessions endpoint
app.get('/sessions/:id', async (c) => {
  const sessionId = c.req.param('id');

  // TODO: Retrieve session from KV
  return c.json({
    sessionId,
    messages: [],
  });
});

export default app;
