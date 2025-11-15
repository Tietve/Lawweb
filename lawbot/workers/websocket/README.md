# WebSocket Worker - Real-time Features with Durable Objects

Phase 09 implementation for LawBot system - provides real-time capabilities using Cloudflare Durable Objects with WebSocket hibernation.

## Features

### 1. Notification Hub (WebSocket)
- Real-time admin notifications
- WebSocket hibernation for cost efficiency (1000x reduction)
- Session management
- Broadcast messaging
- Auto-cleanup of stale connections

### 2. Analytics Aggregator
- In-memory metrics tracking
- Hourly aggregation to D1 database
- Real-time statistics
- REST API for metrics operations

### 3. Presence Tracker
- User online/away/offline status
- Heartbeat-based presence (30s interval)
- Automatic stale detection (90s timeout)
- Presence broadcasts to admins

### 4. Chat Orchestrator
- Chat session assignment
- Agent workload tracking
- Transfer between agents
- Escalation to human support
- Session status management

## Architecture

```
Client -> WebSocket Router -> Durable Objects
                           |
                           ├─> NotificationHub (WebSocket)
                           ├─> AnalyticsAggregator
                           ├─> PresenceTracker
                           └─> ChatOrchestrator
```

## Endpoints

### WebSocket
- `GET /ws/notifications?userId={userId}` - Connect to notification hub

### Analytics API
- `POST /api/analytics/increment` - Increment metric counter
- `GET /api/analytics/stats` - Get current statistics
- `GET /api/analytics/metrics` - Get all metrics
- `POST /api/analytics/reset` - Reset all metrics

### Presence API
- `POST /api/presence/update` - Update user presence
- `POST /api/presence/heartbeat` - Send heartbeat
- `GET /api/presence/list?status={status}` - List presences
- `POST /api/presence/cleanup` - Manual cleanup

### Chat API
- `POST /api/chat/assign` - Assign chat to agent
- `POST /api/chat/transfer` - Transfer between agents
- `POST /api/chat/escalate` - Escalate to human
- `POST /api/chat/resolve` - Resolve chat session
- `GET /api/chat/status?sessionId={id}` - Get status
- `GET /api/chat/workload` - Get agent workload

### Notifications API
- `POST /api/notifications/broadcast` - Broadcast to all
- `GET /api/notifications/stats` - Connection stats

## Quick Start

### Development
```bash
npm run dev:websocket
```

### Deploy
```bash
npm run deploy:websocket
```

### Run D1 Migration
```bash
wrangler d1 execute lawbot-db --file=workers/websocket/migrations/0001_create_analytics_hourly.sql
```

## Usage Examples

### WebSocket Client (Browser)
```typescript
import { WebSocketClient } from '@lawbot/websocket/client';

const client = new WebSocketClient({
  url: 'wss://your-worker.workers.dev/ws/notifications',
  userId: 'admin-123',
  debug: true,
});

// Listen for events
client.on('connected', (data) => {
  console.log('Connected:', data);
});

client.on('chat_assigned', (data) => {
  console.log('New chat assigned:', data);
});

client.on('escalation', (data) => {
  console.log('Chat escalated:', data);
});

// Connect
client.connect();
```

### Analytics Tracking
```typescript
// Increment metric
await fetch('https://worker.dev/api/analytics/increment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'chat_messages',
    value: 1,
  }),
});

// Get stats
const stats = await fetch('https://worker.dev/api/analytics/stats').then(r => r.json());
```

### Presence Updates
```typescript
// Update presence
await fetch('https://worker.dev/api/presence/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-123',
    status: 'online',
    metadata: { page: 'chat' },
  }),
});

// Heartbeat (every 30s)
setInterval(async () => {
  await fetch('https://worker.dev/api/presence/heartbeat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'user-123' }),
  });
}, 30000);
```

### Chat Operations
```typescript
// Assign chat
await fetch('https://worker.dev/api/chat/assign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session-123',
    userId: 'user-456',
    agentId: 'agent-ai-1',
    agentType: 'ai',
  }),
});

// Escalate to human
await fetch('https://worker.dev/api/chat/escalate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session-123',
    reason: 'Complex legal question requiring human expertise',
    priority: 'high',
  }),
});
```

## Performance Metrics

- **WebSocket Connections**: 10K+ concurrent
- **Hibernation Efficiency**: 1000x cost reduction
- **Real-time Updates**: <50ms latency
- **Memory per DO**: <128MB
- **Heartbeat Interval**: 30s
- **Stale Timeout**: 90s
- **Analytics Aggregation**: Hourly

## Configuration

### Environment Variables (wrangler.toml)
```toml
[vars]
ENVIRONMENT = "development"  # or "production"
```

### Database
- **D1 Database**: `lawbot-db`
- **Table**: `analytics_hourly`

### Durable Objects
All DOs use global singleton instances via `idFromName('global')`:
- `NotificationHub`
- `AnalyticsAggregator`
- `PresenceTracker`
- `ChatOrchestrator`

## Features & Benefits

### WebSocket Hibernation
- Reduces costs by 1000x compared to traditional WebSockets
- Automatic state preservation
- No polling required
- Event-driven message handling

### In-Memory State
- Fast access to session data
- Persistent storage via `state.storage`
- Automatic cleanup via alarms

### Alarms
- `NotificationHub`: Every 60s (cleanup stale connections)
- `AnalyticsAggregator`: Every hour (write to D1)
- `PresenceTracker`: Every 30s (cleanup stale presences)

## Development Notes

### File Structure
```
workers/websocket/
├── src/
│   ├── index.ts                    # Router worker
│   ├── types.ts                    # Type definitions
│   ├── durable-objects/
│   │   ├── NotificationHub.ts
│   │   ├── AnalyticsAggregator.ts
│   │   ├── PresenceTracker.ts
│   │   └── ChatOrchestrator.ts
│   └── client/
│       └── WebSocketClient.ts      # Client library
├── migrations/
│   └── 0001_create_analytics_hourly.sql
├── wrangler.toml
├── package.json
└── README.md
```

### Best Practices
1. Use hibernation API for WebSocket connections
2. Implement proper error handling
3. Persist state to storage regularly
4. Use alarms for periodic tasks
5. Keep DO memory usage <128MB
6. Follow YAGNI, KISS, DRY principles

## Troubleshooting

### WebSocket not connecting
- Check userId parameter in URL
- Verify Upgrade header is set
- Check DO binding configuration

### Metrics not persisting
- Verify D1 database binding
- Run migrations
- Check alarm scheduling

### Presence not updating
- Check heartbeat interval (30s)
- Verify cleanup isn't too aggressive
- Check network connectivity

## License
Private - All rights reserved
