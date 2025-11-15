# Facebook Messenger Integration - Quick Start Guide

## 🚀 Fast Track Deployment (5 Steps)

### 1. Create Facebook App (10 min)

1. Go to https://developers.facebook.com/apps
2. Create app → Business → Next
3. Add Messenger product
4. Select/Create Facebook Page
5. Generate Page Access Token
6. Copy: App Secret, App ID, Page Access Token

### 2. Setup Cloudflare (5 min)

```bash
cd /home/user/Lawweb/lawbot/workers/webhooks

# Create queues
wrangler queues create facebook-webhooks-queue
wrangler queues create facebook-webhooks-dlq

# Set secrets
wrangler secret put MESSENGER_VERIFY_TOKEN     # Create your own random string
wrangler secret put MESSENGER_PAGE_ACCESS_TOKEN # From FB App
wrangler secret put MESSENGER_APP_SECRET        # From FB App
```

### 3. Deploy Worker (2 min)

```bash
npm run deploy
# Note the URL: https://lawbot-webhooks.YOUR_NAME.workers.dev
```

### 4. Configure Facebook Webhook (3 min)

1. FB App Dashboard → Messenger → Settings → Webhooks
2. Click "Add Callback URL"
3. Enter:
   - URL: `https://lawbot-webhooks.YOUR_NAME.workers.dev/webhooks/messenger`
   - Verify Token: (same as MESSENGER_VERIFY_TOKEN)
4. Click "Verify and Save" ✅
5. Subscribe to: `messages`, `messaging_postbacks`

### 5. Setup Menu (1 min)

```bash
export MESSENGER_PAGE_ACCESS_TOKEN=your_token_here
npx tsx src/facebook/setup-menu.ts
```

## ✅ Test It!

1. Open Messenger
2. Search for your Facebook Page
3. Send "Hello"
4. Bot should respond! 🎉

## 📚 Full Documentation

- `/workers/webhooks/src/facebook/README.md` - Comprehensive guide
- `/workers/webhooks/FACEBOOK_IMPLEMENTATION.md` - Technical details
- `/workers/webhooks/PHASE_11_CHECKLIST.md` - Deployment checklist
- `/lawbot/PHASE_11_COMPLETE.md` - Completion report

## 🆘 Troubleshooting

**Webhook verification fails?**
- Check MESSENGER_VERIFY_TOKEN matches
- Verify worker is deployed
- Check logs: `wrangler tail lawbot-webhooks`

**Messages not received?**
- Verify webhook subscriptions active
- Check FB App in "Live" mode
- Review queue: `wrangler queues list`

**Menu not showing?**
- Wait 5-10 minutes
- Re-run setup-menu.ts script

---

**Need Help?** Check the full README in `/src/facebook/README.md`
