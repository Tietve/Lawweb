# LawBot - AI-Powered Legal Assistant

A comprehensive legal assistant system built on Cloudflare Workers with RAG (Retrieval-Augmented Generation) capabilities, multi-platform chat integrations, and dual web interfaces.

## Project Structure

```
lawbot/
├── apps/
│   ├── web-public/       # Public website (Cloudflare Pages)
│   ├── web-admin/        # Admin dashboard (Cloudflare Pages)
│   └── api/              # API Workers
├── packages/
│   ├── ui/               # Shared UI components
│   ├── db/               # Database schemas
│   ├── ai/               # AI/RAG utilities
│   └── shared/           # Shared utilities
├── workers/
│   ├── chatbot/          # Chatbot worker with RAG
│   ├── webhooks/         # Platform webhooks (Zalo, Messenger)
│   └── scheduler/        # Cron jobs
└── infrastructure/
    └── cloudflare/       # Wrangler configs
```

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js
- **Language**: TypeScript
- **Database**: Cloudflare D1 (SQLite)
- **Vector Store**: Cloudflare Vectorize
- **Storage**: Cloudflare R2
- **Cache**: Cloudflare KV
- **Real-time**: Durable Objects
- **AI**: Anthropic Claude

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Cloudflare account with Workers paid plan

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Configure Cloudflare services (see Setup Guide below)

4. Start development server:
   ```bash
   # All workers
   npm run dev

   # Individual workers
   npm run dev:chatbot
   npm run dev:webhooks
   npm run dev:scheduler
   npm run dev:api
   ```

### Cloudflare Services Setup

```bash
# Create D1 database
wrangler d1 create lawbot-db

# Create Vectorize index
wrangler vectorize create legal-docs-index --dimensions=1024 --metric=cosine

# Create R2 buckets
wrangler r2 bucket create lawbot-assets
wrangler r2 bucket create lawbot-backups
wrangler r2 bucket create lawbot-uploads

# Create KV namespaces
wrangler kv:namespace create SESSIONS
wrangler kv:namespace create WEBHOOK_CACHE
wrangler kv:namespace create RATE_LIMIT
```

Update the IDs in `.env` file after creating the services.

## Deployment

```bash
# Deploy all workers
npm run deploy

# Deploy individual workers
npm run deploy:chatbot
npm run deploy:webhooks
npm run deploy:scheduler
npm run deploy:api
```

## Implementation Phases

- **Phase 01**: Project Setup & Infrastructure (Current)
- **Phase 02**: Database Schema
- **Phase 03**: RAG Pipeline
- **Phase 04**: AI Integration
- **Phase 05**: API Layer
- **Phase 06**: Public Website
- **Phase 07**: Chatbot Widget
- **Phase 08**: Admin Dashboard
- **Phase 09**: Real-time with Durable Objects
- **Phase 10**: Zalo Integration
- **Phase 11**: Messenger Integration
- **Phase 12**: Multi-platform Publishing
- **Phase 13**: Testing & QA
- **Phase 14**: Deployment

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build all packages
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npm run deploy` - Deploy to Cloudflare

## Architecture

### Workers

- **Chatbot Worker**: Handles chat interactions with RAG-powered responses
- **Webhooks Worker**: Processes incoming webhooks from Zalo and Messenger
- **Scheduler Worker**: Runs periodic tasks (cleanup, backups, index updates)
- **API Worker**: RESTful API for web applications

### Packages

- **@lawbot/ui**: Shared UI components
- **@lawbot/db**: Database schemas and types
- **@lawbot/ai**: AI and RAG utilities
- **@lawbot/shared**: Common utilities and types

## License

Private - All rights reserved
