# Zalo Official Account Integration

This module implements integration with Zalo Official Account (OA) for the LawBot system.

## Overview

The Zalo integration allows Vietnamese users to interact with the LawBot via Zalo Messenger, one of the most popular messaging platforms in Vietnam.

## Features

- ✅ Webhook signature verification (HMAC-SHA256)
- ✅ Message receiving and sending
- ✅ Quick replies support
- ✅ User management
- ✅ Conversation tracking
- ✅ Message templates (Vietnamese)
- ✅ Error handling and monitoring
- ✅ Async message processing via KV

## Architecture

```
zalo/
├── webhook.ts      # Main webhook handler
├── verifier.ts     # Signature verification
├── client.ts       # Zalo API client
├── templates.ts    # Message templates
├── queue.ts        # Message queue processor
├── users.ts        # User management
├── monitor.ts      # Logging & metrics
└── index.ts        # Module exports
```

## Setup

### 1. Register Zalo Official Account

1. Go to [Zalo Official Account Portal](https://oa.zalo.me/)
2. Create a new Official Account
3. Complete verification process
4. Get your App ID, App Secret, and OA ID

### 2. Configure Webhook

1. In Zalo OA settings, set webhook URL:
   ```
   https://your-domain.workers.dev/webhooks/zalo
   ```

2. Add environment variables to `.dev.vars`:
   ```bash
   ZALO_APP_ID=your_app_id
   ZALO_APP_SECRET=your_app_secret
   ZALO_OA_ID=your_oa_id
   ZALO_SYNTAX_FILTER=false  # Set to "true" to only process messages starting with #
   ```

### 3. Set Access Token

The Zalo client requires an access token. In production, you should:

1. Implement OAuth 2.0 flow
2. Store token in KV with automatic refresh
3. Use the `setAccessToken` method:

```typescript
const client = new ZaloClient(appId, secretKey, oaId, kv);
await client.setAccessToken('your_access_token', 7200);
```

## Usage

### Webhook Handler

The webhook handler is automatically registered in the main app:

```typescript
import { handleZaloWebhook } from './zalo/webhook';

app.post('/webhooks/zalo', async (c) => {
  return handleZaloWebhook(c);
});
```

### Supported Events

- `user_send_text` - User sends text message
- `user_send_image` - User sends image
- `user_send_audio` - User sends audio
- `follow` - User follows the OA
- `unfollow` - User unfollows the OA

### Message Templates

Vietnamese language templates are provided:

```typescript
import { getWelcomeMessage, getCategorySelectionMessage } from './zalo/templates';

// Send welcome message
const welcomeMsg = getWelcomeMessage();
await client.sendMessage(userId, welcomeMsg);

// Send category selection
const categoryMsg = getCategorySelectionMessage();
await client.sendQuickReply(userId, categoryMsg.text, categoryMsg.quickReplies);
```

### Signature Verification

All webhook requests are verified using HMAC-SHA256:

```typescript
import { verifyZaloSignature } from './zalo/verifier';

const isValid = await verifyZaloSignature(body, signature, secretKey);
```

## Security

- ✅ Signature verification on all webhook requests
- ✅ Timing-safe string comparison
- ✅ Environment variables for secrets
- ✅ Request logging and monitoring
- ✅ Error handling without exposing internals

## Monitoring

All webhook events are logged to D1:

```sql
CREATE TABLE webhook_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_id TEXT,
  data TEXT,
  created_at INTEGER NOT NULL
);
```

## Testing

### Test Webhook Endpoint

```bash
# Test GET endpoint
curl https://your-domain.workers.dev/webhooks/zalo

# Test POST endpoint (requires valid signature)
curl -X POST https://your-domain.workers.dev/webhooks/zalo \
  -H "Content-Type: application/json" \
  -H "X-ZEvent-Signature: mac=<signature>" \
  -d '{"app_id":"...","event_name":"user_send_text","...}'
```

### Local Development

```bash
cd workers/webhooks
npm run dev
```

## Limitations

- Access token refresh not fully implemented (requires OAuth flow)
- Image/Audio processing not implemented (returns placeholder message)
- Queue processing uses KV (should use Cloudflare Queues in production)
- Rate limiting not implemented

## Next Steps

1. Implement OAuth 2.0 flow for automatic token refresh
2. Add Cloudflare Queue for message processing
3. Implement image/audio processing
4. Add rate limiting
5. Add analytics and reporting
6. Add admin panel for managing OA

## Resources

- [Zalo OA Documentation](https://developers.zalo.me/docs/official-account)
- [Zalo API Reference](https://developers.zalo.me/docs/api)
- [Phase 10 Plan](../../../../plans/251115-1726-lawbot-comprehensive-system/phase-10-zalo-integration.md)
