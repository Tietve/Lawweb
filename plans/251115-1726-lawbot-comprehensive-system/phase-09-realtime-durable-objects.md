# Phase 09: Real-time Features (Durable Objects)

## Context Links
- [Parent Plan](plan.md)
- [Research: Cloudflare RAG](research/researcher-01-cloudflare-vietnamese-rag.md)
- [Prev: Web Admin](phase-08-web2-admin.md)
- [Next: Zalo Integration](phase-10-zalo-integration.md)

## Overview
- **Date**: 2025-11-15
- **Description**: Implement real-time features using Cloudflare Durable Objects
- **Priority**: P2 - Enhanced functionality
- **Implementation Status**: 🔴 Not Started
- **Review Status**: 🔴 Not Started

## Key Insights
- WebSocket hibernation saves 1000x cost
- Max 128MB memory per DO
- Supports 1000s connections
- 20 messages = 1 request billing

## Requirements

### Functional
- WebSocket connections management
- Real-time notifications
- Live analytics aggregation
- Presence tracking
- Broadcasting capabilities

### Non-functional
- <50ms message latency
- Handle 10K concurrent connections
- Auto-reconnect support
- Cost optimization via hibernation

## Architecture

```
workers/durable-objects/
├── NotificationHub.ts    # Admin notifications
├── AnalyticsAggregator.ts # Real-time stats
├── PresenceTracker.ts     # User presence
└── ChatOrchestrator.ts    # Chat coordination
```

## Related Code Files

### Create
- `/workers/durable-objects/NotificationHub.ts` - Notification DO
- `/workers/durable-objects/AnalyticsAggregator.ts` - Analytics DO
- `/workers/durable-objects/PresenceTracker.ts` - Presence DO
- `/workers/durable-objects/ChatOrchestrator.ts` - Chat DO
- `/workers/websocket/router.ts` - WebSocket router

## Implementation Steps

1. **Notification Hub with Hibernation**
```typescript
// workers/durable-objects/NotificationHub.ts
export class NotificationHub implements DurableObject {
  private sessions: Map<string, WebSocket> = new Map();
  private state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');

    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 400 });
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept WebSocket with hibernation
    this.state.acceptWebSocket(server);

    // Get user info from request
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    // Store session
    this.sessions.set(userId, server);

    // Return WebSocket response
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // Handle WebSocket messages
  async webSocketMessage(ws: WebSocket, message: string) {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'subscribe':
        await this.handleSubscribe(ws, data);
        break;
      case 'broadcast':
        await this.broadcastNotification(data);
        break;
    }
  }

  // Handle WebSocket close
  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    // Remove from sessions
    for (const [userId, socket] of this.sessions.entries()) {
      if (socket === ws) {
        this.sessions.delete(userId);
        break;
      }
    }
  }

  // Broadcast to all connected admins
  private async broadcastNotification(notification: any) {
    const message = JSON.stringify({
      type: 'notification',
      timestamp: Date.now(),
      ...notification
    });

    // Use getWebSockets() for hibernated sockets
    const webSockets = this.state.getWebSockets();

    for (const ws of webSockets) {
      try {
        ws.send(message);
      } catch (err) {
        // Socket might be closed
        ws.close(1011, 'Error sending message');
      }
    }
  }
}
```

2. **Analytics Aggregator DO**
```typescript
// workers/durable-objects/AnalyticsAggregator.ts
export class AnalyticsAggregator implements DurableObject {
  private metrics: Map<string, any> = new Map();
  private aggregationInterval: number;

  constructor(private state: DurableObjectState, private env: Env) {
    // Restore state
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get('metrics');
      if (stored) {
        this.metrics = new Map(stored);
      }
    });

    // Schedule aggregation
    this.aggregationInterval = setInterval(() => {
      this.aggregate();
    }, 60000); // Every minute
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    switch (path) {
      case '/increment':
        return this.handleIncrement(request);
      case '/stats':
        return this.handleGetStats();
      case '/reset':
        return this.handleReset();
      default:
        return new Response('Not Found', { status: 404 });
    }
  }

  private async handleIncrement(request: Request): Promise<Response> {
    const { metric, value = 1 } = await request.json();

    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);

    // Persist state
    await this.state.storage.put('metrics', Array.from(this.metrics));

    return Response.json({ success: true });
  }

  private async handleGetStats(): Promise<Response> {
    const stats = {
      timestamp: Date.now(),
      metrics: Object.fromEntries(this.metrics),
      uptime: process.uptime()
    };

    return Response.json(stats);
  }

  private async aggregate() {
    // Get current metrics
    const snapshot = Object.fromEntries(this.metrics);

    // Write to D1
    await this.env.DB.prepare(`
      INSERT INTO analytics_hourly (datetime, active_users, conversations, messages)
      VALUES (datetime('now'), ?, ?, ?)
    `).bind(
      snapshot.active_users || 0,
      snapshot.conversations || 0,
      snapshot.messages || 0
    ).run();

    // Reset hourly metrics
    this.metrics.set('messages', 0);
    this.metrics.set('conversations', 0);
  }
}
```

3. **Presence Tracker DO**
```typescript
// workers/durable-objects/PresenceTracker.ts
export class PresenceTracker implements DurableObject {
  private presence: Map<string, UserPresence> = new Map();
  private heartbeatInterval = 30000; // 30 seconds

  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    const { method } = request;
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/update':
        return this.updatePresence(request);
      case '/list':
        return this.listPresence();
      case '/cleanup':
        return this.cleanupStale();
    }

    return new Response('Not Found', { status: 404 });
  }

  private async updatePresence(request: Request): Promise<Response> {
    const { userId, status, metadata } = await request.json();

    this.presence.set(userId, {
      userId,
      status,
      lastSeen: Date.now(),
      metadata
    });

    // Persist
    await this.state.storage.put(`presence:${userId}`, {
      status,
      lastSeen: Date.now(),
      metadata
    });

    // Broadcast to subscribers
    await this.broadcastPresenceUpdate(userId, status);

    return Response.json({ success: true });
  }

  private async listPresence(): Promise<Response> {
    const now = Date.now();
    const active = [];

    for (const [userId, data] of this.presence.entries()) {
      if (now - data.lastSeen < this.heartbeatInterval * 2) {
        active.push(data);
      }
    }

    return Response.json({ active, total: active.length });
  }

  private async cleanupStale(): Promise<Response> {
    const now = Date.now();
    const staleThreshold = this.heartbeatInterval * 3;
    let cleaned = 0;

    for (const [userId, data] of this.presence.entries()) {
      if (now - data.lastSeen > staleThreshold) {
        this.presence.delete(userId);
        await this.state.storage.delete(`presence:${userId}`);
        cleaned++;
      }
    }

    return Response.json({ cleaned });
  }

  private async broadcastPresenceUpdate(userId: string, status: string) {
    // Send to notification hub
    const hubId = this.env.NOTIFICATION_HUB.idFromName('global');
    const hub = this.env.NOTIFICATION_HUB.get(hubId);

    await hub.fetch(new Request('https://do/broadcast', {
      method: 'POST',
      body: JSON.stringify({
        type: 'presence',
        userId,
        status
      })
    }));
  }
}
```

4. **Chat Orchestrator DO**
```typescript
// workers/durable-objects/ChatOrchestrator.ts
export class ChatOrchestrator implements DurableObject {
  private activeChats: Map<string, ChatSession> = new Map();
  private agentPool: AgentInfo[] = [];

  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/assign':
        return this.assignAgent(request);
      case '/transfer':
        return this.transferChat(request);
      case '/escalate':
        return this.escalateToHuman(request);
      case '/status':
        return this.getChatStatus(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  private async assignAgent(request: Request): Promise<Response> {
    const { conversationId, userId, platform } = await request.json();

    // Check if already assigned
    if (this.activeChats.has(conversationId)) {
      return Response.json({
        assigned: true,
        agentId: this.activeChats.get(conversationId).agentId
      });
    }

    // Find available agent (AI by default)
    const agent = {
      id: 'ai-primary',
      type: 'ai',
      model: 'claude-3.5'
    };

    // Create session
    const session: ChatSession = {
      conversationId,
      userId,
      platform,
      agentId: agent.id,
      startTime: Date.now(),
      status: 'active'
    };

    this.activeChats.set(conversationId, session);

    // Persist
    await this.state.storage.put(`chat:${conversationId}`, session);

    return Response.json({
      assigned: true,
      agentId: agent.id,
      sessionId: conversationId
    });
  }

  private async escalateToHuman(request: Request): Promise<Response> {
    const { conversationId, reason } = await request.json();

    const session = this.activeChats.get(conversationId);
    if (!session) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update session
    session.status = 'escalated';
    session.escalationReason = reason;

    // Notify admins
    await this.notifyAdmins({
      type: 'escalation',
      conversationId,
      userId: session.userId,
      reason
    });

    return Response.json({ escalated: true });
  }

  private async notifyAdmins(notification: any) {
    const hubId = this.env.NOTIFICATION_HUB.idFromName('global');
    const hub = this.env.NOTIFICATION_HUB.get(hubId);

    await hub.fetch(new Request('https://do/broadcast', {
      method: 'POST',
      body: JSON.stringify(notification)
    }));
  }
}
```

5. **WebSocket Router Worker**
```typescript
// workers/websocket/router.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Route to appropriate DO
    switch (url.pathname) {
      case '/notifications':
        const notifId = env.NOTIFICATION_HUB.idFromName('global');
        const notifHub = env.NOTIFICATION_HUB.get(notifId);
        return notifHub.fetch(request);

      case '/analytics':
        const analyticsId = env.ANALYTICS_DO.idFromName('global');
        const analytics = env.ANALYTICS_DO.get(analyticsId);
        return analytics.fetch(request);

      case '/presence':
        const presenceId = env.PRESENCE_DO.idFromName('global');
        const presence = env.PRESENCE_DO.get(presenceId);
        return presence.fetch(request);

      case '/chat':
        const chatId = env.CHAT_DO.idFromName('global');
        const chat = env.CHAT_DO.get(chatId);
        return chat.fetch(request);

      default:
        return new Response('Not Found', { status: 404 });
    }
  }
};
```

6. **Client Connection Handler**
```typescript
// workers/websocket/client.ts
export class WebSocketClient {
  private ws: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private url: string) {
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.sendHeartbeat();
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(JSON.parse(event.data));
    };
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }

  private sendHeartbeat() {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
      setTimeout(() => this.sendHeartbeat(), 30000);
    }
  }

  send(data: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      // Queue message for retry
      this.messageQueue.push(data);
    }
  }
}
```

## Todo List
- [ ] Create Notification Hub DO
- [ ] Implement Analytics Aggregator
- [ ] Build Presence Tracker
- [ ] Create Chat Orchestrator
- [ ] Setup WebSocket router
- [ ] Implement hibernation
- [ ] Add reconnection logic
- [ ] Create client library
- [ ] Test concurrent connections
- [ ] Monitor memory usage
- [ ] Implement cost optimization

## Success Criteria
- WebSocket connections stable
- Hibernation reduces costs 1000x
- Real-time updates <50ms
- 10K concurrent connections supported
- Auto-reconnect works

## Risk Assessment
- **Risk**: Memory limits (128MB)
- **Mitigation**: Efficient data structures, pagination
- **Risk**: WebSocket disconnections
- **Mitigation**: Auto-reconnect, message queuing

## Security Considerations
- Authenticate WebSocket connections
- Rate limit per connection
- Validate message payloads
- Prevent broadcast storms

## Next Steps
- Phase 10: Zalo Integration
- Phase 11: FB Messenger Integration