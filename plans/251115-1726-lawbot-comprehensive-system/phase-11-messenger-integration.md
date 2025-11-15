# Phase 11: Facebook Messenger Integration

## Context Links
- [Parent Plan](plan.md)
- [Research: Multi-platform](research/researcher-02-multiplatform-integrations.md)
- [Prev: Zalo Integration](phase-10-zalo-integration.md)
- [Next: Publishing System](phase-12-multiplatform-publishing.md)

## Overview
- **Date**: 2025-11-15
- **Description**: Integrate Facebook Messenger for chatbot interactions
- **Priority**: P2 - Platform expansion
- **Implementation Status**: 🔴 Not Started
- **Review Status**: 🔴 Not Started

## Key Insights
- 20-second webhook timeout
- Verification challenge-response
- Retry mechanism for hours
- Quick replies, persistent menu
- Platform-specific throttling

## Requirements

### Functional
- Webhook verification
- Message receiving/sending
- Quick replies
- Persistent menu
- Attachments handling
- Typing indicators

### Non-functional
- Response within 20 seconds
- Handle retries gracefully
- Rate limit compliance
- Error recovery
- Analytics tracking

## Architecture

```
workers/webhooks/facebook/
├── webhook.ts         # Webhook handler
├── verifier.ts        # Webhook verification
├── client.ts          # Messenger API client
├── templates.ts       # Message templates
└── menu.ts           # Persistent menu
```

## Related Code Files

### Create
- `/workers/webhooks/facebook/webhook.ts` - Webhook handler
- `/workers/webhooks/facebook/verifier.ts` - Verification
- `/workers/webhooks/facebook/client.ts` - FB API client
- `/workers/webhooks/facebook/templates.ts` - Templates
- `/workers/webhooks/facebook/menu.ts` - Menu setup

## Implementation Steps

1. **Webhook Handler & Verification**
```typescript
// workers/webhooks/facebook/webhook.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle verification challenge
    if (request.method === 'GET') {
      return handleVerification(url, env);
    }

    // Handle webhook events
    if (request.method === 'POST') {
      return handleWebhookEvent(request, env);
    }

    return new Response('Method Not Allowed', { status: 405 });
  }
};

function handleVerification(url: URL, env: Env): Response {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === env.FB_VERIFY_TOKEN) {
    console.log('Webhook verified');
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

async function handleWebhookEvent(
  request: Request,
  env: Env
): Promise<Response> {
  const body = await request.json();

  // Queue events for processing (must respond in 20s)
  await env.FB_QUEUE.send({
    object: body.object,
    entries: body.entry
  });

  // Facebook requires 200 OK response
  return new Response('EVENT_RECEIVED', { status: 200 });
}
```

2. **Facebook Messenger API Client**
```typescript
// workers/webhooks/facebook/client.ts
export class MessengerClient {
  private baseUrl = 'https://graph.facebook.com/v16.0';

  constructor(
    private pageAccessToken: string,
    private appSecret: string
  ) {}

  async sendMessage(
    recipientId: string,
    message: MessagePayload
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message,
        access_token: this.pageAccessToken
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`FB API error: ${error.error.message}`);
    }
  }

  async sendTextMessage(
    recipientId: string,
    text: string
  ): Promise<void> {
    await this.sendMessage(recipientId, { text });
  }

  async sendQuickReply(
    recipientId: string,
    text: string,
    quickReplies: QuickReply[]
  ): Promise<void> {
    await this.sendMessage(recipientId, {
      text,
      quick_replies: quickReplies.map(qr => ({
        content_type: 'text',
        title: qr.title,
        payload: qr.payload,
        image_url: qr.imageUrl
      }))
    });
  }

  async sendTypingOn(recipientId: string): Promise<void> {
    await this.sendAction(recipientId, 'typing_on');
  }

  async sendTypingOff(recipientId: string): Promise<void> {
    await this.sendAction(recipientId, 'typing_off');
  }

  async sendMarkSeen(recipientId: string): Promise<void> {
    await this.sendAction(recipientId, 'mark_seen');
  }

  private async sendAction(
    recipientId: string,
    action: string
  ): Promise<void> {
    await fetch(`${this.baseUrl}/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        sender_action: action,
        access_token: this.pageAccessToken
      })
    });
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    const response = await fetch(
      `${this.baseUrl}/${userId}?fields=first_name,last_name,profile_pic&access_token=${this.pageAccessToken}`
    );

    return response.json();
  }

  async sendAttachment(
    recipientId: string,
    type: 'image' | 'video' | 'audio' | 'file',
    url: string
  ): Promise<void> {
    await this.sendMessage(recipientId, {
      attachment: {
        type,
        payload: {
          url,
          is_reusable: true
        }
      }
    });
  }
}
```

3. **Message Queue Processor**
```typescript
// workers/webhooks/facebook/queue.ts
export async function processFacebookQueue(
  batch: MessageBatch,
  env: Env
): Promise<void> {
  const client = new MessengerClient(
    env.FB_PAGE_ACCESS_TOKEN,
    env.FB_APP_SECRET
  );

  for (const message of batch.messages) {
    const data = message.body;

    try {
      // Process each entry
      for (const entry of data.entries) {
        await processEntry(entry, client, env);
      }

      message.ack();
    } catch (error) {
      console.error('Error processing:', error);

      if (message.attempts < 3) {
        message.retry({ delaySeconds: 30 * message.attempts });
      } else {
        await env.DLQ.send({
          original: data,
          error: error.message
        });
        message.ack();
      }
    }
  }
}

async function processEntry(
  entry: any,
  client: MessengerClient,
  env: Env
): Promise<void> {
  // Handle messaging events
  if (entry.messaging) {
    for (const event of entry.messaging) {
      await processMessagingEvent(event, client, env);
    }
  }

  // Handle standby events (when not primary receiver)
  if (entry.standby) {
    for (const event of entry.standby) {
      console.log('Standby event:', event);
    }
  }
}

async function processMessagingEvent(
  event: any,
  client: MessengerClient,
  env: Env
): Promise<void> {
  const senderId = event.sender.id;

  // Mark as seen
  await client.sendMarkSeen(senderId);

  if (event.message) {
    await handleMessage(event, client, env);
  } else if (event.postback) {
    await handlePostback(event, client, env);
  } else if (event.quick_reply) {
    await handleQuickReply(event, client, env);
  }
}
```

4. **Message Handlers**
```typescript
// workers/webhooks/facebook/handlers.ts
async function handleMessage(
  event: any,
  client: MessengerClient,
  env: Env
): Promise<void> {
  const senderId = event.sender.id;
  const message = event.message;

  // Show typing indicator
  await client.sendTypingOn(senderId);

  try {
    // Get or create user
    const user = await getOrCreateFBUser(senderId, client, env);

    let responseText: string;
    let citations: Citation[] = [];

    if (message.text) {
      // Process text message with AI
      const aiResponse = await env.AI_WORKER.fetch(
        new Request('https://ai/chat', {
          method: 'POST',
          body: JSON.stringify({
            userId: user.id,
            message: message.text,
            platform: 'facebook'
          })
        })
      );

      const result = await aiResponse.json();
      responseText = result.answer;
      citations = result.citations;
    } else if (message.attachments) {
      // Handle attachments
      responseText = await handleAttachments(message.attachments, env);
    }

    // Send response
    await sendFormattedResponse(
      senderId,
      responseText,
      citations,
      client
    );
  } finally {
    await client.sendTypingOff(senderId);
  }
}

async function handlePostback(
  event: any,
  client: MessengerClient,
  env: Env
): Promise<void> {
  const senderId = event.sender.id;
  const payload = event.postback.payload;

  switch (payload) {
    case 'GET_STARTED':
      await sendWelcomeMessage(senderId, client);
      break;
    case 'LEGAL_CATEGORIES':
      await sendLegalCategories(senderId, client);
      break;
    case 'CONTACT_LAWYER':
      await sendContactInfo(senderId, client);
      break;
    default:
      console.log('Unknown postback:', payload);
  }
}
```

5. **Persistent Menu Setup**
```typescript
// workers/webhooks/facebook/menu.ts
export async function setupPersistentMenu(env: Env): Promise<void> {
  const client = new MessengerClient(
    env.FB_PAGE_ACCESS_TOKEN,
    env.FB_APP_SECRET
  );

  const menu = {
    persistent_menu: [
      {
        locale: 'default',
        composer_input_disabled: false,
        call_to_actions: [
          {
            title: '🏠 Trang Chủ',
            type: 'postback',
            payload: 'GET_STARTED'
          },
          {
            title: '📚 Danh Mục Pháp Luật',
            type: 'postback',
            payload: 'LEGAL_CATEGORIES'
          },
          {
            title: '💬 Liên Hệ',
            type: 'nested',
            call_to_actions: [
              {
                title: '📞 Hotline',
                type: 'postback',
                payload: 'CONTACT_HOTLINE'
              },
              {
                title: '🌐 Website',
                type: 'web_url',
                url: 'https://lawbot.vn'
              },
              {
                title: '✉️ Email',
                type: 'postback',
                payload: 'CONTACT_EMAIL'
              }
            ]
          }
        ]
      }
    ]
  };

  await fetch(
    `https://graph.facebook.com/v16.0/me/messenger_profile?access_token=${env.FB_PAGE_ACCESS_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menu)
    }
  );

  // Set greeting
  await setGreeting(env);

  // Set Get Started button
  await setGetStarted(env);
}

async function setGreeting(env: Env): Promise<void> {
  const greeting = {
    greeting: [
      {
        locale: 'default',
        text: 'Xin chào {{user_first_name}}! Tôi là trợ lý tư vấn pháp luật AI. Tôi có thể giúp gì cho bạn?'
      },
      {
        locale: 'vi_VN',
        text: 'Xin chào {{user_first_name}}! Tôi là trợ lý tư vấn pháp luật AI. Tôi có thể giúp gì cho bạn?'
      }
    ]
  };

  await fetch(
    `https://graph.facebook.com/v16.0/me/messenger_profile?access_token=${env.FB_PAGE_ACCESS_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(greeting)
    }
  );
}
```

6. **Message Templates**
```typescript
// workers/webhooks/facebook/templates.ts
export async function sendWelcomeMessage(
  recipientId: string,
  client: MessengerClient
): Promise<void> {
  const welcomeText = `Chào mừng bạn đến với Tư Vấn Pháp Luật AI! 🎯

Tôi có thể hỗ trợ bạn:
✅ Giải đáp thắc mắc pháp lý
✅ Tìm kiếm văn bản luật
✅ Tư vấn quy trình pháp lý

Hãy chọn một chủ đề hoặc gửi câu hỏi của bạn!`;

  await client.sendQuickReply(recipientId, welcomeText, [
    {
      title: '⚖️ Luật Dân Sự',
      payload: 'CATEGORY_CIVIL'
    },
    {
      title: '💼 Luật Lao Động',
      payload: 'CATEGORY_LABOR'
    },
    {
      title: '🏢 Luật Doanh Nghiệp',
      payload: 'CATEGORY_BUSINESS'
    },
    {
      title: '📋 Câu Hỏi Khác',
      payload: 'CUSTOM_QUESTION'
    }
  ]);
}

export async function sendFormattedResponse(
  recipientId: string,
  answer: string,
  citations: Citation[],
  client: MessengerClient
): Promise<void> {
  // Split long messages (FB limit: 2000 chars)
  const chunks = splitMessage(answer, 1800);

  for (let i = 0; i < chunks.length; i++) {
    await client.sendTextMessage(recipientId, chunks[i]);

    // Add delay between messages
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Send citations if available
  if (citations.length > 0) {
    let citationText = '📚 Nguồn tham khảo:\n';
    citations.forEach(c => {
      citationText += `• ${c.law} - Điều ${c.article} (${Math.round(c.confidence * 100)}%)\n`;
    });

    await client.sendTextMessage(recipientId, citationText);
  }

  // Add disclaimer
  await client.sendTextMessage(
    recipientId,
    '⚠️ Lưu ý: Thông tin chỉ mang tính tham khảo. Vui lòng tham khảo chuyên gia cho vấn đề cụ thể.'
  );
}

function splitMessage(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let current = '';

  const sentences = text.split('. ');
  for (const sentence of sentences) {
    if (current.length + sentence.length > maxLength) {
      chunks.push(current);
      current = sentence + '.';
    } else {
      current += sentence + '. ';
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
```

7. **User Management**
```typescript
// workers/webhooks/facebook/users.ts
export async function getOrCreateFBUser(
  fbUserId: string,
  client: MessengerClient,
  env: Env
): Promise<User> {
  // Check existing user
  let user = await env.DB.prepare(`
    SELECT * FROM users WHERE fb_id = ?
  `).bind(fbUserId).first();

  if (!user) {
    // Get profile from Facebook
    const profile = await client.getUserProfile(fbUserId);

    // Create user
    user = await env.DB.prepare(`
      INSERT INTO users (
        fb_id, name, platform, created_at
      ) VALUES (?, ?, 'facebook', datetime('now'))
      RETURNING *
    `).bind(
      fbUserId,
      `${profile.first_name} ${profile.last_name}`
    ).first();
  }

  return user;
}
```

## Todo List
- [ ] Register Facebook App
- [ ] Setup webhook endpoint
- [ ] Implement verification
- [ ] Create Messenger client
- [ ] Build message handlers
- [ ] Setup persistent menu
- [ ] Add quick replies
- [ ] Implement typing indicators
- [ ] Handle attachments
- [ ] Create message queue
- [ ] Test end-to-end

## Success Criteria
- Webhook verification passes
- Messages sent/received
- Menu displays correctly
- Quick replies working
- 20s response time met

## Risk Assessment
- **Risk**: 20-second timeout
- **Mitigation**: Queue processing, async handling
- **Risk**: Rate limits
- **Mitigation**: Implement backoff strategy

## Security Considerations
- Verify webhook signatures
- Validate user inputs
- Secure token storage
- Audit all messages

## Next Steps
- Phase 12: Multi-platform Publishing
- Phase 13: Testing & QA