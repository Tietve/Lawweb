# Phase 11: Facebook Messenger Integration - Deployment Checklist

## ✅ Implementation Complete

### Files Created (14 files)

- [x] `/src/facebook/types.ts` (96 lines) - Type definitions
- [x] `/src/facebook/client.ts` (199 lines) - Messenger API client
- [x] `/src/facebook/templates.ts` (232 lines) - Message templates
- [x] `/src/facebook/handlers.ts` (267 lines) - Event handlers
- [x] `/src/facebook/users.ts` (144 lines) - User management
- [x] `/src/facebook/menu.ts` (205 lines) - Persistent menu
- [x] `/src/facebook/queue.ts` (158 lines) - Queue processor
- [x] `/src/facebook/consumer.ts` (28 lines) - Queue consumer
- [x] `/src/facebook/index.ts` (12 lines) - Module exports
- [x] `/src/facebook/setup-menu.ts` (32 lines) - CLI setup script
- [x] `/src/facebook/README.md` - Comprehensive documentation
- [x] `/src/facebook/test-event.json` - Test message event
- [x] `/src/facebook/test-postback.json` - Test postback event
- [x] `/src/facebook/test-quickreply.json` - Test quick reply

### Files Updated (2 files)

- [x] `/src/index.ts` - Integrated Facebook webhook handlers
- [x] `/wrangler.toml` - Added queue config and env vars

### Documentation Created (2 files)

- [x] `/FACEBOOK_IMPLEMENTATION.md` - Implementation summary
- [x] `/PHASE_11_CHECKLIST.md` - This checklist

## 📋 Pre-Deployment Checklist

### Facebook App Setup

- [ ] Create Facebook App at https://developers.facebook.com/
- [ ] Add Messenger product to app
- [ ] Create or select Facebook Page
- [ ] Generate Page Access Token
- [ ] Copy App Secret
- [ ] Note App ID

### Environment Configuration

- [ ] Set `MESSENGER_VERIFY_TOKEN` (create your own random string)
- [ ] Set `MESSENGER_PAGE_ACCESS_TOKEN` (from Facebook App)
- [ ] Set `MESSENGER_APP_SECRET` (from Facebook App)
- [ ] Verify D1 database configured
- [ ] Verify chatbot worker service binding

### Cloudflare Queue Setup

```bash
# Create queues
wrangler queues create facebook-webhooks-queue
wrangler queues create facebook-webhooks-dlq

# Verify queues exist
wrangler queues list
```

- [ ] facebook-webhooks-queue created
- [ ] facebook-webhooks-dlq created
- [ ] Queue bindings in wrangler.toml updated

### Database Schema

- [ ] Verify users table exists with metadata column
- [ ] Test JSON extraction: `json_extract(metadata, '$.fb_id')`
- [ ] Verify indexes on platform and created_at

## 🚀 Deployment Steps

### 1. Local Testing

```bash
# Type check
npm run type-check

# Start dev server
npm run dev:webhooks

# Test webhook verification
curl "http://localhost:8787/webhooks/messenger?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"

# Test message event
curl -X POST http://localhost:8787/webhooks/messenger \
  -H "Content-Type: application/json" \
  -d @src/facebook/test-event.json
```

- [ ] Type check passes (ignore unrelated errors)
- [ ] Dev server starts
- [ ] Webhook verification works
- [ ] Message event accepted

### 2. Deploy to Cloudflare

```bash
# Deploy worker
npm run deploy:webhooks

# Note the deployed URL
# Example: https://lawbot-webhooks.username.workers.dev
```

- [ ] Deployment successful
- [ ] Worker URL noted: _________________________

### 3. Configure Facebook Webhook

1. Go to Facebook App Dashboard
2. Navigate to: Messenger > Settings > Webhooks
3. Click "Add Callback URL"
4. Enter:
   - **Callback URL**: `https://your-worker.workers.dev/webhooks/messenger`
   - **Verify Token**: Your `MESSENGER_VERIFY_TOKEN`
5. Click "Verify and Save"
6. Subscribe to webhook events:
   - [x] messages
   - [x] messaging_postbacks
   - [x] messaging_optins (optional)
   - [x] message_deliveries (optional)
   - [x] message_reads (optional)

- [ ] Webhook verified successfully
- [ ] Events subscribed

### 4. Setup Persistent Menu

```bash
# Set environment variable
export MESSENGER_PAGE_ACCESS_TOKEN=your_token_here

# Run setup script
npx tsx src/facebook/setup-menu.ts

# Should see:
# ✅ Persistent menu set successfully
# ✅ Greeting set successfully
# ✅ Get started button set successfully
```

- [ ] Menu setup successful
- [ ] Greeting configured
- [ ] Get started button active

### 5. Test Live Integration

1. Open Messenger and search for your Facebook Page
2. Send a test message (e.g., "Hello")
3. Verify bot responds

**Test Cases:**

- [ ] Send text message → Bot responds with AI answer
- [ ] Click Get Started button → Welcome message appears
- [ ] Click menu item → Correct action triggered
- [ ] Send quick reply → Category message appears
- [ ] Send image → Acknowledgment received
- [ ] Typing indicator shows during processing
- [ ] Messages marked as seen

### 6. Monitor & Verify

```bash
# Check worker logs
wrangler tail lawbot-webhooks

# Check queue metrics (if available)
# - Queue depth
# - Processing rate
# - Error rate
```

**Verify:**

- [ ] Webhook events logged correctly
- [ ] Queue processing works
- [ ] Users created in database
- [ ] No errors in logs
- [ ] Response time < 20 seconds

## 🔍 Testing Scenarios

### Basic Flow

1. **User sends text message**
   - [ ] Message received by webhook
   - [ ] Event queued successfully
   - [ ] User created/retrieved
   - [ ] Typing indicator shown
   - [ ] AI response generated
   - [ ] Response formatted with citations
   - [ ] Message sent to user
   - [ ] Typing indicator hidden

2. **User clicks Get Started**
   - [ ] Postback event received
   - [ ] Welcome message sent
   - [ ] Quick replies displayed

3. **User selects category**
   - [ ] Quick reply processed
   - [ ] Category info sent
   - [ ] User can ask questions

4. **User opens menu**
   - [ ] Persistent menu visible
   - [ ] All menu items work
   - [ ] Nested menu accessible

### Edge Cases

- [ ] Long message (>2000 chars) → Split correctly
- [ ] Multiple quick messages → All processed
- [ ] Rapid fire messages → Queue handles
- [ ] Invalid user ID → Gracefully handled
- [ ] AI worker timeout → Fallback message
- [ ] Network error → Retry logic works
- [ ] Queue full → Direct processing fallback

## 📊 Success Criteria

- [x] ✅ All files created
- [x] ✅ TypeScript compiles
- [ ] ⏳ Webhook verified
- [ ] ⏳ Messages sent/received
- [ ] ⏳ Menu displays correctly
- [ ] ⏳ Quick replies working
- [ ] ⏳ Typing indicators functional
- [ ] ⏳ 20s response time met
- [ ] ⏳ Attachments handled
- [ ] ⏳ Queue processing works
- [ ] ⏳ Error handling robust

## 🐛 Troubleshooting

### Webhook Verification Fails

- Check `MESSENGER_VERIFY_TOKEN` matches
- Verify worker is deployed and accessible
- Check webhook URL is correct
- Review worker logs for errors

### Messages Not Received

- Verify webhook subscriptions active
- Check FB App is in "Live" mode (not Development)
- Ensure page is subscribed to app
- Review queue consumer is running

### Queue Issues

- Verify queue exists: `wrangler queues list`
- Check queue binding in wrangler.toml
- Review consumer configuration
- Check for DLQ messages

### User Creation Fails

- Verify D1 database accessible
- Check users table schema
- Ensure metadata column type is TEXT
- Test JSON extraction query

### Persistent Menu Not Showing

- Wait 5-10 minutes after setup
- Re-run setup script
- Check token has `pages_messaging` permission
- Try removing and re-adding menu

## 📚 Documentation

- Implementation Details: `/FACEBOOK_IMPLEMENTATION.md`
- Usage Guide: `/src/facebook/README.md`
- Phase Plan: `/plans/.../phase-11-messenger-integration.md`
- Facebook Docs: https://developers.facebook.com/docs/messenger-platform

## 🎯 Next Steps

After successful deployment:

1. [ ] Monitor for 24 hours
2. [ ] Collect user feedback
3. [ ] Review analytics
4. [ ] Optimize response times
5. [ ] Plan Phase 12: Multi-platform Publishing

## ✅ Sign-off

- [ ] Implementation complete
- [ ] Tests passing
- [ ] Deployed to production
- [ ] Monitoring active
- [ ] Documentation updated
- [ ] Team notified

**Deployed by**: _________________
**Date**: _________________
**Status**: _________________

---

**Phase 11 Complete** 🎉
