# Phase 01: Project Setup & Infrastructure

## Context Links
- [Parent Plan](plan.md)
- [Next: Database Schema](phase-02-database-schema.md)

## Overview
- **Date**: 2025-11-15
- **Description**: Initialize project structure, Cloudflare services, development environment
- **Priority**: P0 - Blocker for all phases
- **Implementation Status**: 🔴 Not Started
- **Review Status**: 🔴 Not Started

## Key Insights
- Cloudflare stack provides edge computing capabilities
- Wrangler CLI essential for local development
- Monorepo structure recommended for dual-website architecture

## Requirements

### Functional
- Initialize Git repository with proper .gitignore
- Setup Cloudflare account & services
- Configure development environment
- Create project structure

### Non-functional
- Support local development with hot reload
- Enable TypeScript for type safety
- Configure ESLint/Prettier

## Architecture

```
lawbot/
├── apps/
│   ├── web-public/       # Public website (Pages)
│   ├── web-admin/        # Admin dashboard (Pages)
│   └── api/              # API Workers
├── packages/
│   ├── ui/               # Shared UI components
│   ├── db/               # Database schemas
│   ├── ai/               # AI/RAG utilities
│   └── shared/           # Shared utilities
├── workers/
│   ├── chatbot/          # Chatbot worker
│   ├── webhooks/         # Platform webhooks
│   └── scheduler/        # Cron jobs
└── infrastructure/
    └── cloudflare/       # Wrangler configs
```

## Related Code Files

### Create
- `/package.json` - Root package.json with workspaces
- `/turbo.json` - Turborepo configuration
- `/wrangler.toml` - Cloudflare Workers config
- `/.env.example` - Environment variables template
- `/tsconfig.json` - TypeScript configuration

## Implementation Steps

1. **Initialize Repository**
   ```bash
   git init
   npm init -y
   npm install -D @cloudflare/workers-types wrangler typescript
   ```

2. **Setup Turborepo**
   ```bash
   npm install -D turbo
   npx create-turbo@latest --template=basic
   ```

3. **Configure Cloudflare Services**
   - Create Cloudflare account
   - Generate API tokens
   - Initialize D1 database: `wrangler d1 create lawbot-db`
   - Create Vectorize index: `wrangler vectorize create legal-docs-index --dimensions=1024 --metric=cosine`
   - Setup R2 bucket: `wrangler r2 bucket create lawbot-assets`
   - Create KV namespaces: `wrangler kv:namespace create sessions`

4. **Setup Development Environment**
   ```bash
   # Install dependencies
   npm install hono @hono/zod-validator zod
   npm install -D @types/node vitest

   # Configure TypeScript
   npx tsc --init
   ```

5. **Create Initial Workers**
   ```bash
   wrangler generate api workers/api --template=hono
   wrangler generate chatbot workers/chatbot
   wrangler generate webhooks workers/webhooks
   ```

6. **Configure Environment Variables**
   - CLOUDFLARE_ACCOUNT_ID
   - CLOUDFLARE_API_TOKEN
   - D1_DATABASE_ID
   - VECTORIZE_INDEX_NAME
   - R2_BUCKET_NAME
   - KV_NAMESPACE_ID

## Todo List
- [ ] Create Git repository
- [ ] Setup Turborepo monorepo
- [ ] Configure Cloudflare account
- [ ] Initialize D1 database
- [ ] Create Vectorize index
- [ ] Setup R2 bucket
- [ ] Create KV namespaces
- [ ] Configure Wrangler
- [ ] Setup TypeScript
- [ ] Create initial Workers
- [ ] Configure environment variables
- [ ] Setup local development scripts

## Success Criteria
- Local development environment working
- All Cloudflare services initialized
- Wrangler deployments successful
- TypeScript compilation passing

## Risk Assessment
- **Risk**: Cloudflare service limits
- **Mitigation**: Monitor usage, implement pagination
- **Risk**: API token exposure
- **Mitigation**: Use .env files, never commit secrets

## Security Considerations
- Store secrets in Cloudflare Workers secrets
- Use environment-specific configurations
- Implement CORS properly
- Enable Cloudflare security features

## Next Steps
- Phase 02: Database Schema (can run parallel)
- Phase 03: RAG Pipeline (can run parallel)