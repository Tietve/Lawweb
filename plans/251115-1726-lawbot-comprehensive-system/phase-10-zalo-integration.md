# Phase 10: Zalo OA Integration

## Context Links
- [Parent Plan](plan.md)
- [Research: Multi-platform](research/researcher-02-multiplatform-integrations.md)
- [Prev: Realtime DO](phase-09-realtime-durable-objects.md)
- [Next: FB Integration](phase-11-messenger-integration.md)

## Overview
- **Date**: 2025-11-15
- **Description**: Integrate Zalo Official Account for Vietnamese users
- **Priority**: P2 - Platform expansion
- **Implementation Status**: 🟢 Completed
- **Review Status**: 🟡 Pending Review
- **Completed Date**: 2025-11-15

## Key Insights
- Signature verification via SHA256
- OAuth 2.0 authentication
- Syntax filter: messages starting with "#"
- Native Vietnamese support
- OA approval required

## Requirements

### Functional
- Webhook registration & verification
- Message receiving/sending
- User authentication
- Quick replies support
- Media handling (images, voice)
- Message templates

### Non-functional
- Signature verification
- Rate limit handling
- Retry mechanism
- Error recovery
- Audit logging

## Architecture

```
workers/webhooks/zalo/
├── webhook.ts        # Webhook handler
├── verifier.ts       # Signature verification
├── client.ts         # Zalo API client
├── templates.ts      # Message templates
└── queue.ts          # Message queue
```

## Related Code Files

### Create
- `/workers/webhooks/zalo/webhook.ts` - Webhook handler
- `/workers/webhooks/zalo/verifier.ts` - Signature verifier
- `/workers/webhooks/zalo/client.ts` - Zalo API client
- `/workers/webhooks/zalo/templates.ts` - Templates
- `/workers/webhooks/zalo/queue.ts` - Queue processor

## Implementation Steps

1. **Webhook Handler Setup**
```typescript
// workers/webhooks/zalo/webhook.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Verify signature
    const signature = request.headers.get('X-ZEvent-Signature');
    const body = await request.text();

    if (!signature || !await verifyZaloSignature(body, signature, env)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const data = JSON.parse(body);

    // Process different event types
    switch (data.event_name) {
      case 'user_send_text':
        await handleTextMessage(data, env);
        break;
      case 'user_send_image':
        await handleImageMessage(data, env);
        break;
      case 'user_send_audio':
        await handleAudioMessage(data, env);
        break;
      case 'follow':
        await handleUserFollow(data, env);
        break;
      case 'unfollow':
        await handleUserUnfollow(data, env);
        break;
      default:
        console.log('Unknown event:', data.event_name);
    }

    // Zalo requires 200 response
    return new Response('OK', { status: 200 });
  }
};

async function handleTextMessage(data: any, env: Env) {
  const {
    sender: { id: userId },
    message: { text },
    timestamp
  } = data;

  // Check syntax filter (only process messages starting with #)
  if (env.ZALO_SYNTAX_FILTER && !text.startsWith('#')) {
    return;
  }

  // Queue for processing
  await env.ZALO_QUEUE.send({
    type: 'message',
    userId,
    text: text.replace(/^#/, '').trim(),
    timestamp,
    platform: 'zalo'
  });
}
```

2. **Signature Verification**
```typescript
// workers/webhooks/zalo/verifier.ts
export async function verifyZaloSignature(
  body: string,
  signature: string,
  env: Env
): Promise<boolean> {
  const data = JSON.parse(body);
  const { app_id, timestamp } = data;

  // Construct signature data
  const signatureData = app_id + body + timestamp + env.ZALO_SECRET_KEY;

  // Calculate SHA256
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(signatureData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  // Convert to hex
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const expectedSignature = 'mac=' + hashHex;

  return expectedSignature === signature;
}
```

3. **Zalo API Client**
```typescript
// workers/webhooks/zalo/client.ts
export class ZaloClient {
  private baseUrl = 'https://openapi.zalo.me/v3.0';
  private accessToken: string;
  private tokenExpiry: number;

  constructor(
    private appId: string,
    private secretKey: string,
    private oaId: string
  ) {}

  async sendMessage(userId: string, message: string): Promise<void> {
    await this.ensureValidToken();

    const response = await fetch(`${this.baseUrl}/oa/message/cs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.accessToken
      },
      body: JSON.stringify({
        recipient: {
          user_id: userId
        },
        message: {
          text: message
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Zalo API error: ${error.message}`);
    }
  }

  async sendTemplate(
    userId: string,
    templateId: string,
    params: Record<string, any>
  ): Promise<void> {
    await this.ensureValidToken();

    const response = await fetch(`${this.baseUrl}/oa/message/template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.accessToken
      },
      body: JSON.stringify({
        recipient: {
          user_id: userId
        },
        template_id: templateId,
        template_data: params
      })
    });

    const result = await response.json();
    if (result.error) {
      throw new Error(`Template error: ${result.error}`);
    }
  }

  async sendQuickReply(
    userId: string,
    message: string,
    options: QuickReplyOption[]
  ): Promise<void> {
    await this.ensureValidToken();

    const quickReplies = options.map(opt => ({
      content_type: 'text',
      title: opt.title,
      payload: opt.payload,
      image_icon: opt.icon
    }));

    await fetch(`${this.baseUrl}/oa/message/cs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.accessToken
      },
      body: JSON.stringify({
        recipient: { user_id: userId },
        message: {
          text: message,
          quick_replies: quickReplies
        }
      })
    });
  }

  private async ensureValidToken() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.refreshAccessToken();
    }
  }

  private async refreshAccessToken() {
    const response = await fetch(`${this.baseUrl}/oa/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        app_id: this.appId,
        app_secret: this.secretKey,
        grant_type: 'authorization_code',
        code: await this.getAuthCode()
      })
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);
  }
}
```

4. **Message Templates**
```typescript
// workers/webhooks/zalo/templates.ts
export const messageTemplates = {
  welcome: {
    id: 'welcome_template',
    text: `Chào mừng bạn đến với Tư Vấn Pháp Luật AI! 🎯

Tôi có thể giúp bạn:
✅ Giải đáp thắc mắc pháp lý
✅ Tìm kiếm văn bản luật
✅ Tư vấn các vấn đề pháp lý

Hãy gửi câu hỏi của bạn hoặc chọn một trong các tùy chọn bên dưới.`
  },

  legalCategories: {
    id: 'legal_categories',
    quickReplies: [
      { title: '⚖️ Luật Dân Sự', payload: 'category_civil' },
      { title: '💼 Luật Lao Động', payload: 'category_labor' },
      { title: '🏢 Luật Doanh Nghiệp', payload: 'category_business' },
      { title: '🏠 Luật Đất Đai', payload: 'category_land' },
      { title: '📋 Khác', payload: 'category_other' }
    ]
  },

  disclaimer: {
    text: `⚠️ Lưu ý: Thông tin được cung cấp bởi AI chỉ mang tính tham khảo. Vui lòng tham khảo ý kiến chuyên gia pháp lý cho các vấn đề quan trọng.`
  }
};

export function formatLegalResponse(
  answer: string,
  citations: Citation[]
): string {
  let response = answer + '\n\n';

  if (citations.length > 0) {
    response += '📚 *Nguồn tham khảo:*\n';
    citations.forEach(c => {
      response += `• ${c.law} - Điều ${c.article}\n`;
    });
  }

  response += '\n' + messageTemplates.disclaimer.text;

  return response;
}
```

5. **Message Queue Processor**
```typescript
// workers/webhooks/zalo/queue.ts
export async function processZaloQueue(
  batch: MessageBatch,
  env: Env
): Promise<void> {
  const zaloClient = new ZaloClient(
    env.ZALO_APP_ID,
    env.ZALO_SECRET_KEY,
    env.ZALO_OA_ID
  );

  for (const message of batch.messages) {
    const data = message.body;

    try {
      switch (data.type) {
        case 'message':
          await processUserMessage(data, zaloClient, env);
          break;
        case 'follow':
          await sendWelcomeMessage(data.userId, zaloClient);
          break;
      }

      // Acknowledge message
      message.ack();
    } catch (error) {
      console.error('Error processing message:', error);

      // Retry logic
      if (message.attempts < 3) {
        message.retry();
      } else {
        // Dead letter queue
        await env.DLQ.send({
          originalMessage: data,
          error: error.message,
          attempts: message.attempts
        });
        message.ack();
      }
    }
  }
}

async function processUserMessage(
  data: any,
  client: ZaloClient,
  env: Env
): Promise<void> {
  const { userId, text, platform } = data;

  // Get or create user
  const user = await getOrCreateUser(userId, platform, env);

  // Get AI response
  const aiResponse = await env.AI_WORKER.fetch(
    new Request('https://ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        userId: user.id,
        message: text,
        platform: 'zalo'
      })
    })
  );

  const response = await aiResponse.json();

  // Format and send response
  const formattedMessage = formatLegalResponse(
    response.answer,
    response.citations
  );

  await client.sendMessage(userId, formattedMessage);

  // Send quick replies if applicable
  if (response.suggestions) {
    await client.sendQuickReply(
      userId,
      'Bạn có thể hỏi thêm về:',
      response.suggestions
    );
  }
}
```

6. **User Management**
```typescript
// workers/webhooks/zalo/users.ts
export async function getOrCreateUser(
  zaloUserId: string,
  platform: string,
  env: Env
): Promise<User> {
  // Check if user exists
  let user = await env.DB.prepare(`
    SELECT id, zalo_id, name, phone
    FROM users
    WHERE zalo_id = ?
  `).bind(zaloUserId).first();

  if (!user) {
    // Get user info from Zalo
    const zaloClient = new ZaloClient(
      env.ZALO_APP_ID,
      env.ZALO_SECRET_KEY,
      env.ZALO_OA_ID
    );

    const userInfo = await zaloClient.getUserInfo(zaloUserId);

    // Create user
    user = await env.DB.prepare(`
      INSERT INTO users (zalo_id, name, phone, platform, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      RETURNING *
    `).bind(
      zaloUserId,
      userInfo.display_name,
      userInfo.user_phone,
      'zalo'
    ).first();
  }

  return user;
}
```

7. **Error Handling & Monitoring**
```typescript
// workers/webhooks/zalo/monitor.ts
export class ZaloMonitor {
  static async logWebhookEvent(
    eventType: string,
    data: any,
    env: Env
  ): Promise<void> {
    await env.DB.prepare(`
      INSERT INTO webhook_logs (
        platform, event_type, data, created_at
      ) VALUES ('zalo', ?, ?, datetime('now'))
    `).bind(eventType, JSON.stringify(data)).run();
  }

  static async trackMetrics(
    metric: string,
    value: number,
    env: Env
  ): Promise<void> {
    const analyticsId = env.ANALYTICS_DO.idFromName('global');
    const analytics = env.ANALYTICS_DO.get(analyticsId);

    await analytics.fetch(new Request('https://do/increment', {
      method: 'POST',
      body: JSON.stringify({ metric, value })
    }));
  }
}
```

## Todo List
- [ ] Register Zalo OA
- [ ] Setup webhook endpoint
- [ ] Implement signature verification
- [ ] Create Zalo API client
- [ ] Build message handlers
- [ ] Add template support
- [ ] Implement quick replies
- [ ] Setup user management
- [ ] Create message queue
- [ ] Add retry logic
- [ ] Test end-to-end flow

## Success Criteria
- Webhook verification passing
- Messages received/sent successfully
- Quick replies working
- Templates rendering properly
- Error handling robust

## Risk Assessment
- **Risk**: Rate limits unknown
- **Mitigation**: Implement backoff, queue messages
- **Risk**: OA approval delays
- **Mitigation**: Prepare documentation early

## Security Considerations
- Verify all webhook signatures
- Store tokens securely
- Validate user inputs
- Audit all interactions

## Next Steps
- Phase 11: FB Messenger Integration
- Phase 12: Multi-platform Publishing