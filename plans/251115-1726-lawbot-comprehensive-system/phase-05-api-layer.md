# Phase 05: API Layer (Workers with Hono.js)

## Context Links
- [Parent Plan](plan.md)
- [Prev: Database Schema](phase-02-database-schema.md)
- [Next: Web Public](phase-06-web1-public.md)

## Overview
- **Date**: 2025-11-15
- **Description**: RESTful API layer using Cloudflare Workers and Hono.js
- **Priority**: P1 - Core backend
- **Implementation Status**: 🔴 Not Started
- **Review Status**: 🔴 Not Started

## Key Insights
- Hono.js optimized for edge computing
- Workers support 10ms CPU time limit
- KV for session management
- Rate limiting at edge

## Requirements

### Functional
- User authentication (JWT)
- Chat endpoints
- Document search API
- Analytics API
- Admin endpoints
- Webhook handlers

### Non-functional
- <100ms response time
- 10K req/s capacity
- CORS support
- Rate limiting
- API versioning

## Architecture

```
/api/v1/
├── /auth          # Authentication
├── /chat          # Chat operations
├── /search        # Document search
├── /users         # User management
├── /admin         # Admin operations
├── /webhooks      # Platform webhooks
└── /analytics     # Analytics data
```

## Related Code Files

### Create
- `/workers/api/src/index.ts` - Main API entry
- `/workers/api/src/routes/auth.ts` - Auth routes
- `/workers/api/src/routes/chat.ts` - Chat routes
- `/workers/api/src/middleware/auth.ts` - Auth middleware
- `/workers/api/src/middleware/ratelimit.ts` - Rate limiting

## Implementation Steps

1. **Setup Hono Application**
```typescript
// workers/api/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jwt } from 'hono/jwt';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Routes
app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/chat', chatRoutes);

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
```

2. **Authentication Routes**
```typescript
// workers/api/src/routes/auth.ts
import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/register', async (c) => {
  const { phone, email, password, platform } = await c.req.json();

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save to D1
  const user = await c.env.DB.prepare(`
    INSERT INTO users (phone, email, password_hash, platform)
    VALUES (?, ?, ?, ?)
    RETURNING id, phone, email, platform
  `).bind(phone, email, hashedPassword, platform).first();

  // Generate JWT
  const token = await sign(
    { sub: user.id, platform },
    c.env.JWT_SECRET
  );

  return c.json({ user, token });
});

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();

  // Get user
  const user = await c.env.DB.prepare(`
    SELECT id, email, password_hash
    FROM users
    WHERE email = ?
  `).bind(email).first();

  if (!user || !await bcrypt.compare(password, user.password_hash)) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Generate token
  const token = await sign(
    { sub: user.id },
    c.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Store session in KV
  await c.env.SESSIONS.put(
    `session:${user.id}`,
    JSON.stringify({ userId: user.id, loginAt: Date.now() }),
    { expirationTtl: 604800 } // 7 days
  );

  return c.json({ token, userId: user.id });
});
```

3. **Chat Endpoints**
```typescript
// workers/api/src/routes/chat.ts
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';

const chat = new Hono<{ Bindings: Env }>();

// Apply auth middleware
chat.use('*', authMiddleware);

chat.post('/conversations', async (c) => {
  const userId = c.get('userId');

  // Create conversation
  const conv = await c.env.DB.prepare(`
    INSERT INTO conversations (user_id, platform, status)
    VALUES (?, 'web', 'active')
    RETURNING id
  `).bind(userId).first();

  return c.json({ conversationId: conv.id });
});

chat.post('/conversations/:id/messages', async (c) => {
  const conversationId = c.req.param('id');
  const { message } = await c.req.json();
  const userId = c.get('userId');

  // Verify ownership
  const conv = await c.env.DB.prepare(`
    SELECT user_id FROM conversations WHERE id = ?
  `).bind(conversationId).first();

  if (conv.user_id !== userId) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  // Process with AI
  const aiWorker = c.env.AI_WORKER;
  const response = await aiWorker.fetch(new Request('https://ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      conversationId,
      message,
      userId
    })
  }));

  // Stream response
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
});
```

4. **Rate Limiting Middleware**
```typescript
// workers/api/src/middleware/ratelimit.ts
export async function rateLimitMiddleware(c, next) {
  const ip = c.req.header('CF-Connecting-IP');
  const key = `ratelimit:${ip}`;

  // Get current count
  const current = await c.env.RATE_LIMIT.get(key);
  const count = current ? parseInt(current) : 0;

  if (count >= 100) { // 100 requests per minute
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }

  // Increment
  await c.env.RATE_LIMIT.put(key, String(count + 1), {
    expirationTtl: 60 // 1 minute
  });

  await next();
}
```

5. **Search Endpoint**
```typescript
// workers/api/src/routes/search.ts
const search = new Hono<{ Bindings: Env }>();

search.get('/documents', async (c) => {
  const query = c.req.query('q');
  const category = c.req.query('category');

  // Call RAG worker
  const ragWorker = c.env.RAG_WORKER;
  const results = await ragWorker.fetch(new Request('https://rag/search', {
    method: 'POST',
    body: JSON.stringify({
      query,
      filter: { category },
      topK: 10
    })
  }));

  const data = await results.json();

  return c.json({
    results: data.results,
    total: data.total
  });
});
```

6. **Analytics Endpoints**
```typescript
// workers/api/src/routes/analytics.ts
const analytics = new Hono<{ Bindings: Env }>();

analytics.get('/dashboard', authMiddleware, adminOnly, async (c) => {
  // Get daily stats
  const stats = await c.env.DB.prepare(`
    SELECT
      date,
      total_users,
      total_conversations,
      total_messages,
      avg_response_time
    FROM analytics_daily
    WHERE date >= date('now', '-7 days')
    ORDER BY date DESC
  `).all();

  // Get real-time stats from Durable Object
  const id = c.env.ANALYTICS_DO.idFromName('global');
  const stub = c.env.ANALYTICS_DO.get(id);
  const realtime = await stub.fetch(new Request('https://do/stats'));

  return c.json({
    daily: stats.results,
    realtime: await realtime.json()
  });
});
```

7. **Webhook Handlers**
```typescript
// workers/api/src/routes/webhooks.ts
const webhooks = new Hono<{ Bindings: Env }>();

webhooks.post('/zalo', async (c) => {
  // Verify signature
  const signature = c.req.header('X-ZEvent-Signature');
  const body = await c.req.text();

  if (!await verifyZaloSignature(body, signature, c.env)) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  const data = JSON.parse(body);

  // Queue for processing
  await c.env.WEBHOOK_QUEUE.send({
    platform: 'zalo',
    data
  });

  return c.json({ success: true });
});

webhooks.post('/facebook', async (c) => {
  // Verify webhook
  if (c.req.method === 'GET') {
    const mode = c.req.query('hub.mode');
    const token = c.req.query('hub.verify_token');
    const challenge = c.req.query('hub.challenge');

    if (mode === 'subscribe' && token === c.env.FB_VERIFY_TOKEN) {
      return new Response(challenge);
    }
  }

  // Process message
  const data = await c.req.json();
  await c.env.WEBHOOK_QUEUE.send({
    platform: 'facebook',
    data
  });

  return c.json({ success: true });
});
```

## Todo List
- [ ] Setup Hono application
- [ ] Implement auth routes
- [ ] Create chat endpoints
- [ ] Add search API
- [ ] Build analytics endpoints
- [ ] Implement webhook handlers
- [ ] Add rate limiting
- [ ] Setup CORS
- [ ] Create API documentation
- [ ] Add request validation
- [ ] Implement error handling

## Success Criteria
- All endpoints functional
- JWT authentication working
- Rate limiting effective
- <100ms response times
- Webhook verification passing

## Risk Assessment
- **Risk**: 10ms CPU limit exceeded
- **Mitigation**: Optimize queries, use async operations
- **Risk**: Session management at scale
- **Mitigation**: Use KV with TTL

## Security Considerations
- JWT secret rotation
- Rate limiting per IP/user
- Input validation with Zod
- SQL injection prevention
- CORS configuration

## Next Steps
- Phase 06: Web Public (uses API)
- Phase 07: Chatbot Widget (uses API)
- Phase 08: Admin Dashboard (uses API)