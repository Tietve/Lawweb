/**
 * WebSocket Router Worker
 * Routes WebSocket connections and REST requests to appropriate Durable Objects
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Import Durable Objects
import { NotificationHub } from './durable-objects/NotificationHub';
import { AnalyticsAggregator } from './durable-objects/AnalyticsAggregator';
import { PresenceTracker } from './durable-objects/PresenceTracker';
import { ChatOrchestrator } from './durable-objects/ChatOrchestrator';

// Export Durable Objects
export { NotificationHub, AnalyticsAggregator, PresenceTracker, ChatOrchestrator };

export interface Env {
  NOTIFICATION_HUB: DurableObjectNamespace;
  ANALYTICS_AGGREGATOR: DurableObjectNamespace;
  PRESENCE_TRACKER: DurableObjectNamespace;
  CHAT_ORCHESTRATOR: DurableObjectNamespace;
  DB?: D1Database;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'lawbot-websocket-router',
    timestamp: new Date().toISOString(),
  });
});

/**
 * WebSocket connection endpoints
 */

// Notifications WebSocket (for admin dashboard)
app.get('/ws/notifications', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected Upgrade: websocket', 426);
  }

  const id = c.env.NOTIFICATION_HUB.idFromName('global');
  const stub = c.env.NOTIFICATION_HUB.get(id);

  return stub.fetch(c.req.raw);
});

/**
 * REST API endpoints for Durable Objects
 */

// Analytics endpoints
app.post('/api/analytics/increment', async (c) => {
  const id = c.env.ANALYTICS_AGGREGATOR.idFromName('global');
  const stub = c.env.ANALYTICS_AGGREGATOR.get(id);

  return stub.fetch(new Request('https://analytics/increment', {
    method: 'POST',
    headers: c.req.raw.headers,
    body: await c.req.text(),
  }));
});

app.get('/api/analytics/stats', async (c) => {
  const id = c.env.ANALYTICS_AGGREGATOR.idFromName('global');
  const stub = c.env.ANALYTICS_AGGREGATOR.get(id);

  return stub.fetch('https://analytics/stats');
});

app.get('/api/analytics/metrics', async (c) => {
  const id = c.env.ANALYTICS_AGGREGATOR.idFromName('global');
  const stub = c.env.ANALYTICS_AGGREGATOR.get(id);

  return stub.fetch('https://analytics/metrics');
});

app.post('/api/analytics/reset', async (c) => {
  const id = c.env.ANALYTICS_AGGREGATOR.idFromName('global');
  const stub = c.env.ANALYTICS_AGGREGATOR.get(id);

  return stub.fetch('https://analytics/reset', { method: 'POST' });
});

// Presence endpoints
app.post('/api/presence/update', async (c) => {
  const id = c.env.PRESENCE_TRACKER.idFromName('global');
  const stub = c.env.PRESENCE_TRACKER.get(id);

  return stub.fetch(new Request('https://presence/update', {
    method: 'POST',
    headers: c.req.raw.headers,
    body: await c.req.text(),
  }));
});

app.post('/api/presence/heartbeat', async (c) => {
  const id = c.env.PRESENCE_TRACKER.idFromName('global');
  const stub = c.env.PRESENCE_TRACKER.get(id);

  return stub.fetch(new Request('https://presence/heartbeat', {
    method: 'POST',
    headers: c.req.raw.headers,
    body: await c.req.text(),
  }));
});

app.get('/api/presence/list', async (c) => {
  const id = c.env.PRESENCE_TRACKER.idFromName('global');
  const stub = c.env.PRESENCE_TRACKER.get(id);

  const url = new URL(c.req.url);
  return stub.fetch(`https://presence/list${url.search}`);
});

app.post('/api/presence/cleanup', async (c) => {
  const id = c.env.PRESENCE_TRACKER.idFromName('global');
  const stub = c.env.PRESENCE_TRACKER.get(id);

  return stub.fetch('https://presence/cleanup', { method: 'POST' });
});

// Chat orchestration endpoints
app.post('/api/chat/assign', async (c) => {
  const id = c.env.CHAT_ORCHESTRATOR.idFromName('global');
  const stub = c.env.CHAT_ORCHESTRATOR.get(id);

  return stub.fetch(new Request('https://chat/assign', {
    method: 'POST',
    headers: c.req.raw.headers,
    body: await c.req.text(),
  }));
});

app.post('/api/chat/transfer', async (c) => {
  const id = c.env.CHAT_ORCHESTRATOR.idFromName('global');
  const stub = c.env.CHAT_ORCHESTRATOR.get(id);

  return stub.fetch(new Request('https://chat/transfer', {
    method: 'POST',
    headers: c.req.raw.headers,
    body: await c.req.text(),
  }));
});

app.post('/api/chat/escalate', async (c) => {
  const id = c.env.CHAT_ORCHESTRATOR.idFromName('global');
  const stub = c.env.CHAT_ORCHESTRATOR.get(id);

  return stub.fetch(new Request('https://chat/escalate', {
    method: 'POST',
    headers: c.req.raw.headers,
    body: await c.req.text(),
  }));
});

app.post('/api/chat/resolve', async (c) => {
  const id = c.env.CHAT_ORCHESTRATOR.idFromName('global');
  const stub = c.env.CHAT_ORCHESTRATOR.get(id);

  return stub.fetch(new Request('https://chat/resolve', {
    method: 'POST',
    headers: c.req.raw.headers,
    body: await c.req.text(),
  }));
});

app.get('/api/chat/status', async (c) => {
  const id = c.env.CHAT_ORCHESTRATOR.idFromName('global');
  const stub = c.env.CHAT_ORCHESTRATOR.get(id);

  const url = new URL(c.req.url);
  return stub.fetch(`https://chat/status${url.search}`);
});

app.get('/api/chat/workload', async (c) => {
  const id = c.env.CHAT_ORCHESTRATOR.idFromName('global');
  const stub = c.env.CHAT_ORCHESTRATOR.get(id);

  return stub.fetch('https://chat/workload');
});

// Notification broadcast endpoint (for internal use)
app.post('/api/notifications/broadcast', async (c) => {
  const id = c.env.NOTIFICATION_HUB.idFromName('global');
  const stub = c.env.NOTIFICATION_HUB.get(id);

  return stub.fetch(new Request('https://notification-hub/broadcast', {
    method: 'POST',
    headers: c.req.raw.headers,
    body: await c.req.text(),
  }));
});

app.get('/api/notifications/stats', async (c) => {
  const id = c.env.NOTIFICATION_HUB.idFromName('global');
  const stub = c.env.NOTIFICATION_HUB.get(id);

  return stub.fetch('https://notification-hub/stats');
});

export default app;
