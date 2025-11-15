# Facebook Messenger Integration

Phase 11 implementation for LawBot's Facebook Messenger integration.

## Overview

This module handles all Facebook Messenger webhook events and provides a complete chatbot experience through Messenger.

## Architecture

```
facebook/
├── types.ts          # TypeScript type definitions
├── client.ts         # Messenger API client
├── templates.ts      # Message templates & formatting
├── handlers.ts       # Message/postback/quick reply handlers
├── users.ts          # User management (DB operations)
├── menu.ts          # Persistent menu & greeting setup
├── queue.ts         # Queue processor for async webhook handling
├── consumer.ts      # Queue consumer export
├── setup-menu.ts    # CLI script to setup persistent menu
├── index.ts         # Module exports
└── README.md        # This file
```

## Features

### Implemented

✅ Webhook verification (GET endpoint)
✅ Webhook event handling (POST endpoint)
✅ Queue-based async processing (20s timeout compliance)
✅ Messenger API client (send messages, typing indicators, etc.)
✅ User management (auto-create from FB profile)
✅ Message handlers (text, attachments, quick replies, postbacks)
✅ Persistent menu configuration
✅ Greeting message with personalization
✅ Message templates (welcome, categories, formatted responses)
✅ Citation formatting
✅ Long message splitting (2000 char limit)
✅ Error handling & retry logic
✅ Typing indicators
✅ Read receipts

### Key Components

#### 1. Webhook Handler (`index.ts`)

- **GET /webhooks/messenger**: Webhook verification
  - Verifies `hub.mode`, `hub.verify_token`, `hub.challenge`
  - Returns challenge on successful verification

- **POST /webhooks/messenger**: Webhook events
  - Receives events from Facebook
  - Queues events for async processing
  - Returns `EVENT_RECEIVED` within 20 seconds

#### 2. API Client (`client.ts`)

Methods:
- `sendMessage(recipientId, message)` - Send any message
- `sendTextMessage(recipientId, text)` - Send text
- `sendQuickReply(recipientId, text, quickReplies)` - Send quick replies
- `sendTypingOn(recipientId)` - Show typing indicator
- `sendTypingOff(recipientId)` - Hide typing indicator
- `sendMarkSeen(recipientId)` - Mark message as seen
- `getUserProfile(userId)` - Get user profile from FB
- `sendAttachment(recipientId, type, url)` - Send media
- `setMessengerProfile(profile)` - Configure menu/greeting

#### 3. Queue Processor (`queue.ts`)

- Processes webhook events asynchronously
- Handles retry logic (max 3 attempts, exponential backoff)
- Supports both queue and direct processing modes
- Routes events to appropriate handlers

#### 4. Message Handlers (`handlers.ts`)

- `handleMessage()` - Process text messages and attachments
- `handlePostback()` - Handle button clicks and menu selections
- `handleQuickReply()` - Handle quick reply selections
- Calls chatbot worker for AI responses
- Formats and sends responses with citations

#### 5. Templates (`templates.ts`)

- `sendWelcomeMessage()` - Welcome message with quick replies
- `sendLegalCategories()` - Category selection menu
- `sendContactInfo()` - Contact information
- `sendCategoryMessage()` - Category-specific info
- `sendFormattedResponse()` - Format AI responses with citations
- `sendErrorMessage()` - Error messages
- Message splitting for 2000 char limit

#### 6. User Management (`users.ts`)

- `getOrCreateFBUser()` - Get existing or create new user
- Stores `fb_id` in user metadata JSON field
- Fetches profile from Facebook Graph API
- Updates `last_active` timestamp

#### 7. Persistent Menu (`menu.ts`)

- `setupMessengerProfile()` - Setup menu, greeting, get started button
- Menu items:
  - 🏠 Trang Chủ (Home)
  - 📚 Danh Mục Pháp Luật (Legal Categories)
  - 💬 Liên Hệ (Contact) - nested menu
- Greeting with `{{user_first_name}}` placeholder
- Multi-locale support (default, vi_VN, en_US)

## Setup Instructions

### 1. Create Facebook App & Page

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (Type: Business)
3. Add Messenger product
4. Create/select a Facebook Page
5. Generate Page Access Token
6. Set up webhook subscription

### 2. Configure Environment Variables

Add to `.env` or Wrangler secrets:

```bash
MESSENGER_VERIFY_TOKEN=your_verify_token_here
MESSENGER_PAGE_ACCESS_TOKEN=your_page_access_token_here
MESSENGER_APP_SECRET=your_app_secret_here
```

### 3. Setup Webhook

1. Deploy the worker: `npm run deploy`
2. In Facebook App Dashboard > Messenger > Settings:
   - Callback URL: `https://your-worker.workers.dev/webhooks/messenger`
   - Verify Token: (same as `MESSENGER_VERIFY_TOKEN`)
   - Click "Verify and Save"
3. Subscribe to events:
   - messages
   - messaging_postbacks
   - message_deliveries
   - message_reads

### 4. Setup Persistent Menu

Run the setup script:

```bash
MESSENGER_PAGE_ACCESS_TOKEN=your_token npx tsx src/facebook/setup-menu.ts
```

Or use the menu module programmatically:

```typescript
import { setupMessengerProfile } from './facebook/menu';

await setupMessengerProfile(pageAccessToken);
```

### 5. Create Queue (if not exists)

```bash
wrangler queues create facebook-webhooks-queue
wrangler queues create facebook-webhooks-dlq
```

## Usage

### Webhook Verification

```bash
curl "https://your-worker.workers.dev/webhooks/messenger?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test123"
# Returns: test123
```

### Send Test Event

```bash
curl -X POST https://your-worker.workers.dev/webhooks/messenger \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "id": "page_id",
      "time": 1234567890,
      "messaging": [{
        "sender": {"id": "user_id"},
        "recipient": {"id": "page_id"},
        "timestamp": 1234567890,
        "message": {
          "mid": "mid.123",
          "text": "Hello"
        }
      }]
    }]
  }'
```

## Message Flow

1. User sends message to Facebook Page
2. Facebook sends webhook event to worker
3. Worker queues event (responds with `EVENT_RECEIVED` < 20s)
4. Queue processor picks up event
5. Mark message as seen, show typing indicator
6. Get or create user in database
7. Process message (text/attachment/postback)
8. Call chatbot worker for AI response
9. Format and send response
10. Send citations and disclaimer
11. Hide typing indicator

## Event Types Handled

- **messages**: Text messages, attachments
- **messaging_postbacks**: Button clicks, menu selections
- **quick_reply**: Quick reply button selections

## Postback Payloads

- `GET_STARTED` - Welcome message
- `LEGAL_CATEGORIES` - Show legal categories
- `CONTACT_HOTLINE` - Show contact info
- `CONTACT_EMAIL` - Show contact info
- `CUSTOM_QUESTION` - Prompt for custom question
- `CATEGORY_CIVIL` - Civil law category
- `CATEGORY_CRIMINAL` - Criminal law category
- `CATEGORY_LABOR` - Labor law category
- `CATEGORY_BUSINESS` - Business law category
- `CATEGORY_LAND` - Land law category
- `CATEGORY_FAMILY` - Family law category
- `CATEGORY_TAX` - Tax law category

## Quick Reply Payloads

Same as postback payloads.

## Error Handling

- Webhook errors: Log and return 200 (prevent retry loop)
- Queue processing errors: Retry up to 3 times with exponential backoff
- API errors: Log and send user-friendly error message
- User creation errors: Fallback to minimal user info

## Rate Limits

Facebook Messenger API rate limits:
- 100 messages/second per page
- Implement backoff if rate limited
- Queue processor handles retry logic

## Testing

### Local Development

```bash
npm run dev:webhooks
```

### Test Webhook Verification

```bash
curl "http://localhost:8787/webhooks/messenger?hub.mode=subscribe&hub.verify_token=test_token&hub.challenge=12345"
```

### Test Message Handling

```bash
curl -X POST http://localhost:8787/webhooks/messenger \
  -H "Content-Type: application/json" \
  -d @test-event.json
```

## Troubleshooting

### Webhook Verification Fails

- Check `MESSENGER_VERIFY_TOKEN` matches
- Ensure GET endpoint is accessible
- Check worker logs for errors

### Messages Not Received

- Verify webhook subscriptions in FB App Dashboard
- Check worker logs for incoming events
- Ensure queue is configured correctly

### User Creation Fails

- Check D1 database is accessible
- Verify user table schema
- Check `getUserProfile()` API call

### Typing Indicator Stuck

- Ensure `sendTypingOff()` is called in finally block
- Check for handler exceptions

### Long Messages Cut Off

- Messages are auto-split at 1800 chars
- Check `splitMessage()` function
- Ensure all chunks are sent

## Security Considerations

- ✅ Verify webhook signature (planned)
- ✅ Validate verify token
- ✅ Sanitize user inputs (planned)
- ✅ Secure token storage (Wrangler secrets)
- ✅ Rate limiting (Cloudflare Workers)

## Performance

- Webhook responds < 20 seconds (queue-based)
- Async processing prevents timeout
- Batch processing up to 10 messages
- Retry with exponential backoff

## Monitoring

- Log all webhook events
- Track queue processing metrics
- Monitor error rates
- Track user creation/lookup performance

## Next Steps

- [ ] Implement webhook signature verification
- [ ] Add analytics tracking
- [ ] Implement conversation context
- [ ] Add more message templates
- [ ] Support rich media (cards, carousels)
- [ ] Implement handover protocol
- [ ] Add broadcast messaging
- [ ] Implement A/B testing for responses

## References

- [Messenger Platform Documentation](https://developers.facebook.com/docs/messenger-platform)
- [Send API Reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api)
- [Webhook Reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events)
- [Messenger Profile API](https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api)
