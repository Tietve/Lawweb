import { Hono } from 'hono';
import { logger } from 'hono/logger';

type Bindings = {
  DB: D1Database;
  WEBHOOK_CACHE: KVNamespace;
  CHATBOT: Fetcher;
  ZALO_APP_ID: string;
  ZALO_APP_SECRET: string;
  MESSENGER_VERIFY_TOKEN: string;
  MESSENGER_PAGE_ACCESS_TOKEN: string;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'lawbot-webhooks',
    timestamp: new Date().toISOString(),
  });
});

// Zalo webhook verification
app.get('/webhooks/zalo', (c) => {
  // TODO: Implement Zalo webhook verification
  return c.text('Zalo webhook endpoint - Phase 10');
});

// Zalo webhook handler
app.post('/webhooks/zalo', async (c) => {
  // TODO: Implement Zalo webhook handler
  return c.json({ received: true });
});

// Messenger webhook verification
app.get('/webhooks/messenger', (c) => {
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');

  if (mode === 'subscribe' && token === c.env.MESSENGER_VERIFY_TOKEN) {
    return c.text(challenge || '');
  }

  return c.text('Invalid verification token', 403);
});

// Messenger webhook handler
app.post('/webhooks/messenger', async (c) => {
  // TODO: Implement Messenger webhook handler
  return c.json({ received: true });
});

export default app;
