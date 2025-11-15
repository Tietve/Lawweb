import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { queueWebhookEvent } from './facebook/queue';
import type { Env } from './facebook/types';
import { handleZaloWebhook } from './zalo/webhook';

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'lawbot-webhooks',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development',
  });
});

// Zalo webhook verification (GET)
// Zalo doesn't use GET for verification like Messenger
// but we keep this endpoint for testing
app.get('/webhooks/zalo', (c) => {
  return c.json({
    status: 'ready',
    platform: 'zalo',
    message: 'Zalo webhook endpoint is ready to receive POST requests',
  });
});

// Zalo webhook handler (POST)
app.post('/webhooks/zalo', async (c) => {
  return handleZaloWebhook(c);
});

// Messenger webhook verification
app.get('/webhooks/messenger', (c) => {
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');

  console.log('Messenger webhook verification:', { mode, token: token ? '***' : null });

  if (mode === 'subscribe' && token === c.env.MESSENGER_VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return c.text(challenge || '');
  }

  console.warn('Invalid verification token');
  return c.text('Invalid verification token', 403);
});

// Messenger webhook handler
app.post('/webhooks/messenger', async (c) => {
  try {
    const body = await c.req.json();

    console.log('Received Messenger webhook:', {
      object: body.object,
      entries: body.entry?.length || 0,
    });

    // Queue webhook event for async processing
    // This ensures we respond within Facebook's 20-second timeout
    await queueWebhookEvent(body, c.env);

    // Facebook requires 200 OK response
    return c.text('EVENT_RECEIVED', 200);
  } catch (error) {
    console.error('Error handling Messenger webhook:', error);

    // Still return 200 to prevent Facebook from retrying
    return c.text('EVENT_RECEIVED', 200);
  }
});

export default app;
