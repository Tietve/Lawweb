# LawBot Chat Widget

Lightweight embeddable chat widget for the LawBot AI legal assistant.

## Features

- Real-time chat with WebSocket support
- Streaming AI responses
- Citation display
- Auto-reconnect on connection loss
- Mobile responsive
- <50KB bundle size (gzipped)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Embed

Add this script to your website:

```html
<script src="https://chat.lawbot.vn/embed.js"></script>
```

### JavaScript API

```javascript
// Open widget
window.LawBot.open();

// Close widget
window.LawBot.close();

// Toggle widget
window.LawBot.toggle();
```

## Environment Variables

Create a `.env` file:

```
VITE_WS_URL=wss://api.lawbot.vn/chat
```

## Tech Stack

- Preact (React alternative, smaller bundle)
- TypeScript
- Vite
- WebSocket

## Bundle Size

Target: <50KB gzipped
- Preact: ~3KB
- App code: ~15KB
- CSS: ~5KB
- Total: ~23KB ✓
