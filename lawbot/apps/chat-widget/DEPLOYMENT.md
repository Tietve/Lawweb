# Deployment Guide - Chat Widget

## Overview

This guide covers deploying the LawBot chat widget to Cloudflare Pages.

## Prerequisites

- Cloudflare account
- Wrangler CLI installed
- Widget built (`npm run build`)

## Cloudflare Pages Deployment

### Option 1: Wrangler CLI

```bash
# Install wrangler if not already installed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create Pages project
wrangler pages project create lawbot-chat-widget

# Deploy
wrangler pages deploy dist --project-name=lawbot-chat-widget
```

### Option 2: GitHub Integration

1. Push code to GitHub repository
2. Go to Cloudflare Dashboard > Pages
3. Click "Create a project"
4. Connect to GitHub repository
5. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `apps/chat-widget`

### Option 3: Direct Upload

1. Build the project: `npm run build`
2. Go to Cloudflare Dashboard > Pages
3. Click "Create a project" > "Upload assets"
4. Upload the `dist` folder

## Environment Variables

Set these in Cloudflare Pages settings:

```
VITE_WS_URL=wss://api.lawbot.vn/chat
```

## Custom Domain

1. Go to Pages project > Custom domains
2. Add your domain (e.g., chat.lawbot.vn)
3. Update DNS records as instructed

## CDN Configuration

The embed script should be served from:
```
https://chat.lawbot.vn/embed.js
```

## Usage on Websites

After deployment, users can embed the widget with:

```html
<script src="https://chat.lawbot.vn/embed.js"></script>
```

## Performance Optimization

- Enable HTTP/3
- Enable Auto Minify (JS, CSS, HTML)
- Enable Brotli compression
- Set browser cache TTL to 1 year for static assets

## Monitoring

Monitor widget performance in Cloudflare Analytics:
- Page views
- Bandwidth usage
- Requests per second
- Error rates

## Rollback

To rollback to previous version:

```bash
wrangler pages deployment list --project-name=lawbot-chat-widget
wrangler pages deployment rollback <deployment-id>
```

## Security

- CORS headers configured for iframe embedding
- Content Security Policy headers
- Subresource Integrity (SRI) for embed script
- Rate limiting via Cloudflare

## Testing

Before deploying to production:

1. Test in staging environment
2. Verify WebSocket connection
3. Test on multiple browsers
4. Test mobile responsiveness
5. Check bundle size (<50KB)
6. Verify embed script works on sample sites

## Post-Deployment Checklist

- [ ] Widget loads in <2s
- [ ] WebSocket connects successfully
- [ ] Streaming messages work
- [ ] Citations display correctly
- [ ] Mobile responsive
- [ ] Embed script works
- [ ] Analytics tracking enabled
- [ ] Error monitoring setup
