# Multi-Platform Integration Research Report
Generated: 2024-11-15

## 1. Zalo Official Account API Integration

### Webhook Setup & Verification
- Register webhook URL in Zalo Developer Portal after linking app to OA
- Enable specific webhook permissions for message types (text, sticker, gif, voice, attachments)
- Signature verification via `X-ZEvent-Signature` header using SHA256
```javascript
// Cloudflare Workers implementation
async function verifyZaloSignature(request, appId, secretKey) {
  const body = await request.text();
  const signature = request.headers.get('X-ZEvent-Signature');
  const data = JSON.parse(body);

  const mac = await crypto.subtle.digest('SHA-256',
    new TextEncoder().encode(appId + body + data.timestamp + secretKey)
  );
  const computed = 'mac=' + Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  return computed === signature;
}
```

### Message Handling
- Syntax filter option: Only receive messages starting with "#"
- Support for text, images, stickers, GIFs, voice, attachments
- OAuth 2.0 authentication with limited-lifespan access tokens
- Vietnamese language fully supported natively

**Rate Limits**: Not documented in public sources
**Complexity**: Medium - requires OA approval process

## 2. Facebook Messenger Platform Integration

### Webhook Configuration
- HTTPS required (use Cloudflare Tunnel for local dev)
- Verification challenge-response pattern
- 20-second timeout for webhook responses
```javascript
// Cloudflare Workers verification
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === env.VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
      }
      return new Response('Forbidden', { status: 403 });
    }
    // Handle POST messages...
  }
}
```

### Message Handling
- Quick replies, persistent menu, attachments supported
- Retry mechanism for failed deliveries (keeps retrying for hours)
- Must respond with 200 within 20 seconds

**Rate Limits**: Platform-specific throttling
**Complexity**: Low-Medium

## 3. Facebook Graph API Publishing

### Authentication Flow
- Page access tokens required with `pages_manage_posts` permission
- API version v16.0+ (2-year support lifecycle)
- User must have CREATE_CONTENT permission on target page

### Publishing Features
```javascript
// Schedule post example
const publishPost = async (pageId, accessToken, content, scheduledTime) => {
  const response = await fetch(
    `https://graph.facebook.com/v16.0/${pageId}/feed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: content,
        published: false,
        scheduled_publish_time: Math.floor(scheduledTime / 1000),
        access_token: accessToken
      })
    }
  );
  return response.json();
};
```

**Complexity**: Low - well-documented API

## 4. Unified Message Handler Architecture

### Cloudflare Workers Pattern
```javascript
export default {
  async fetch(request, env, ctx) {
    const platform = detectPlatform(request);

    switch(platform) {
      case 'zalo':
        if (!await verifyZaloSignature(request, env)) return forbidden();
        return handleZaloMessage(request, env);

      case 'facebook':
        if (!verifyFacebookSignature(request, env)) return forbidden();
        return handleFacebookMessage(request, env);

      default:
        return new Response('Unknown platform', { status: 400 });
    }
  }
};
```

### Queue Pattern for Rate Limiting
- Use Cloudflare Queues for message buffering
- Implement exponential backoff for retries
- Store platform-specific rate limit state in KV

**Complexity**: Medium-High

## 5. Multi-Platform Publishing Automation

### Simultaneous Publishing Strategy
```javascript
async function publishToAllPlatforms(content, media) {
  const results = await Promise.allSettled([
    publishToWeb(content, media),
    publishToFacebook(content, media),
    publishToZalo(content, media)
  ]);

  return {
    web: results[0],
    facebook: results[1],
    zalo: results[2],
    success: results.every(r => r.status === 'fulfilled')
  };
}
```

### Platform-Specific Formatting
- Facebook: 63,206 char limit, supports rich media
- Zalo: Message templates, quick replies
- Web: Full HTML/markdown support

### Error Handling
- Implement circuit breaker pattern
- Log failures to Cloudflare Analytics
- Fallback to queue for failed publishes

**Complexity**: High - requires orchestration

## Implementation Complexity Estimates

| Component | Complexity | Time Estimate |
|-----------|------------|---------------|
| Zalo Webhook | Medium | 2-3 days |
| FB Messenger | Low-Medium | 1-2 days |
| FB Graph API | Low | 1 day |
| Unified Handler | Medium-High | 3-4 days |
| Publishing System | High | 4-5 days |

## Security Considerations
- Store secrets in Cloudflare Workers secrets (encrypted)
- Implement request signature verification for all platforms
- Use webhook URL obfuscation
- Implement rate limiting at edge

## Unresolved Questions
1. Zalo API rate limits not publicly documented
2. Zalo bulk message sending capabilities unclear
3. Facebook API deprecation timeline for v16.0
4. Zalo attachment size limits not specified
5. Cost implications for Cloudflare Queues at scale
6. Zalo webhook retry behavior not documented
7. Facebook Graph API batch request limits for publishing