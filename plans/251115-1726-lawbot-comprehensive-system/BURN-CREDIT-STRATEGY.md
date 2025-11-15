# 🔥 BURN $1000 CREDIT STRATEGY - 2 DAYS

**Goal**: Maximize parallel agent execution to burn $1000 Claude credit in 2 days
**Strategy**: 10-20 agents working simultaneously across implementation phases
**Target**: ~1.8M tokens with Opus model = ~$1000

---

## 📊 Parallelization Waves

### **WAVE 1: Project Setup** (Day 1 Morning - 2 hours)
**1 Agent** - Sequential (blocker for other phases)

```bash
# Agent 1: Project Setup
/cook:auto "Execute Phase 01 - Project Setup & Infrastructure. Initialize Cloudflare project structure, configure Wrangler, setup development environment, create monorepo workspace, configure TypeScript, setup git repository with conventional commits. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-01-project-setup.md"
```

**Expected tokens**: ~50K Opus tokens = ~$27

---

### **WAVE 2: Core Infrastructure** (Day 1 Afternoon - 4 hours)
**4 Agents Parallel** - Independent phases

#### Launch ALL 4 in parallel (single message with 4 Task tool calls):

```bash
# Agent 2: Database Schema
/cook:auto "Execute Phase 02 - Database Schema & D1 Configuration. Implement D1 database with sharding strategy (Main DB + Archive DB + Analytics DB), create migrations, setup repositories, implement batch operations. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-02-database-schema.md"

# Agent 3: RAG Pipeline
/cook:auto "Execute Phase 03 - RAG Pipeline with Vietnamese embeddings. Implement document chunking (512 tokens), BGE-M3 embeddings via Workers AI, Vectorize index setup, context retrieval with metadata filtering. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-03-rag-pipeline.md"

# Agent 4: AI Integration
/cook:auto "Execute Phase 04 - Hybrid AI Integration. Implement Workers AI client, external LLM integration (Claude/GPT), routing logic, prompt templates for legal domain, confidence scoring. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-04-ai-integration.md"

# Agent 5: API Layer
/cook:auto "Execute Phase 05 - API Layer with Hono.js. Implement RESTful API endpoints (chat, leads, analytics, posts, webhooks), middleware (auth, rate limiting, CORS), error handling, validation. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-05-api-layer.md"
```

**Expected tokens**: ~400K Opus tokens = ~$200

---

### **WAVE 3: Frontend & Integrations** (Day 2 Morning - 6 hours)
**6 Agents Parallel** - Independent UI and integration phases

#### Launch ALL 6 in parallel:

```bash
# Agent 6: Public Website
/cook:auto "Execute Phase 06 - Web 1 (Public Website). Implement Next.js public website on Cloudflare Pages with company profile, services, blog, responsive design using shadcn/ui and Tailwind CSS. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-06-web1-public.md"

# Agent 7: Chatbot Widget
/cook:auto "Execute Phase 07 - AI Chatbot Widget. Implement embeddable chat widget with real-time messaging, typing indicators, lead capture forms, conversation history, WebSocket support. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-07-chatbot-widget.md"

# Agent 8: Admin Dashboard
/cook:auto "Execute Phase 08 - Web 2 (Admin Dashboard). Implement Next.js admin dashboard with lead management, analytics visualization, CMS interface, knowledge base management, authentication. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-08-web2-admin.md"

# Agent 9: Durable Objects Real-time
/cook:auto "Execute Phase 09 - Real-time Features with Durable Objects. Implement WebSocket connections with hibernation, admin notifications broadcaster, chat state coordinator, presence tracking. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-09-realtime-durable-objects.md"

# Agent 10: Zalo Integration
/cook:auto "Execute Phase 10 - Zalo Official Account Integration. Implement Zalo OA webhook handler, message parsing, signature verification, response sending, OAuth authentication. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-10-zalo-integration.md"

# Agent 11: Messenger Integration
/cook:auto "Execute Phase 11 - Facebook Messenger Integration. Implement Messenger webhook, message handling, quick replies, Graph API client, attachment processing. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-11-messenger-integration.md"
```

**Expected tokens**: ~800K Opus tokens = ~$400

---

### **WAVE 4: Publishing, Testing & Deployment** (Day 2 Afternoon - 6 hours)
**8 Agents Parallel** - Testing and deployment phases

#### Launch ALL 8 in parallel:

```bash
# Agent 12: Multi-platform Publishing
/cook:auto "Execute Phase 12 - Multi-platform Publishing System. Implement CMS backend, content formatter, parallel publishing to Web+Facebook+Zalo, retry logic, status tracking. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-12-multiplatform-publishing.md"

# Agent 13: Unit Tests
/test "Run comprehensive unit test suite for all modules: RAG pipeline, AI integration, API endpoints, database operations, authentication, validation"

# Agent 14: Integration Tests
/fix:test "Execute Phase 13 integration testing: Test multi-platform webhooks, RAG end-to-end flow, real-time notifications, publishing workflow. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-13-testing-qa.md"

# Agent 15: Code Review
Use code-reviewer subagent to review entire codebase for quality, security, performance, best practices across all phases

# Agent 16: Security Audit
Use debugger subagent to perform security audit: Check authentication, authorization, input validation, SQL injection, XSS, CSRF, secret management

# Agent 17: Documentation
/docs:update "Generate comprehensive documentation for LawBot system: System architecture, API reference, deployment guide, admin manual, knowledge base management guide"

# Agent 18: Deployment Setup
/cook:auto "Execute Phase 14 - Production Deployment. Configure Cloudflare production environment, setup custom domains, SSL certificates, environment variables, CI/CD pipeline. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-14-deployment.md"

# Agent 19: Performance Optimization
Use debugger subagent to analyze and optimize: Database query performance, API response times, Workers memory usage, caching strategies, CDN optimization

# Agent 20: Final QA & Launch Checklist
Use project-manager subagent to create final QA checklist, verify all phases completed, generate launch readiness report, create post-launch monitoring plan
```

**Expected tokens**: ~550K Opus tokens = ~$300

---

## 🚀 EXECUTION COMMANDS FOR CLAUDE CODE WEB

### **Copy-paste these prompts directly into Claude Code web interface:**

---

### **DAY 1 MORNING: Wave 1 (Setup)**

```
Execute Phase 01 - Project Setup & Infrastructure for LawBot system.

Initialize Cloudflare Workers project with Wrangler, create monorepo structure with pnpm workspaces, configure TypeScript with strict mode, setup development environment, initialize git with conventional commits, configure Claude Code integration.

Follow detailed plan: plans/251115-1726-lawbot-comprehensive-system/phase-01-project-setup.md

Use /cook:auto command for autonomous implementation.
```

---

### **DAY 1 AFTERNOON: Wave 2 (4 Agents Parallel)**

**IMPORTANT: Paste this ENTIRE block as ONE message to spawn 4 agents simultaneously:**

```
I need you to spawn 4 agents in parallel to execute these phases simultaneously. Use the Task tool 4 times in a single message:

AGENT 1 - Database Schema:
Execute Phase 02 - Database Schema & D1 Configuration. Implement D1 database with sharding strategy (Main DB for active data, Archive DB for historical data, Analytics DB for metrics), create migration files, setup database repositories with batch operations, implement query optimization. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-02-database-schema.md

AGENT 2 - RAG Pipeline:
Execute Phase 03 - RAG Pipeline with Vietnamese embeddings. Implement document chunking strategy (512 tokens with 20% overlap), integrate BGE-M3 embeddings via Workers AI (@cf/baai/bge-m3), setup Vectorize index with metadata filtering, implement context retrieval with top-K selection. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-03-rag-pipeline.md

AGENT 3 - AI Integration:
Execute Phase 04 - Hybrid AI Integration. Implement Workers AI client for embeddings, external LLM integration (Claude API), intelligent routing logic, prompt templates for legal domain, confidence scoring system, fallback mechanisms. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-04-ai-integration.md

AGENT 4 - API Layer:
Execute Phase 05 - API Layer with Hono.js. Implement RESTful API endpoints (/api/chat, /api/leads, /api/analytics, /api/posts, /webhooks/*), middleware stack (authentication, rate limiting, CORS, error handling), request validation, response formatting. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-05-api-layer.md

Launch all 4 agents in parallel using the Task tool.
```

---

### **DAY 2 MORNING: Wave 3 (6 Agents Parallel)**

**IMPORTANT: Paste this ENTIRE block as ONE message to spawn 6 agents simultaneously:**

```
I need you to spawn 6 agents in parallel to execute these phases simultaneously. Use the Task tool 6 times in a single message:

AGENT 1 - Public Website:
Execute Phase 06 - Web 1 (Public Website). Implement Next.js application on Cloudflare Pages with homepage, services page, about page, blog with legal articles, contact page, responsive design using shadcn/ui and Tailwind CSS. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-06-web1-public.md

AGENT 2 - Chatbot Widget:
Execute Phase 07 - AI Chatbot Widget. Implement embeddable chat widget component with real-time messaging via WebSocket, typing indicators, lead capture form (name, phone, issue), conversation history, mobile-responsive design. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-07-chatbot-widget.md

AGENT 3 - Admin Dashboard:
Execute Phase 08 - Web 2 (Admin Dashboard). Implement Next.js admin dashboard with real-time lead notifications, lead management table with filters, analytics dashboard with charts (Chart.js), CMS for posts, knowledge base upload interface, authentication. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-08-web2-admin.md

AGENT 4 - Real-time Features:
Execute Phase 09 - Real-time Features with Durable Objects. Implement Durable Object classes for WebSocket connections with hibernation API, admin notifications broadcaster, chat state coordinator, presence tracking system. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-09-realtime-durable-objects.md

AGENT 5 - Zalo Integration:
Execute Phase 10 - Zalo Official Account Integration. Implement Zalo OA webhook handler with signature verification (SHA256 HMAC), message parsing, response formatting, OAuth 2.0 authentication flow, rate limit handling. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-10-zalo-integration.md

AGENT 6 - Messenger Integration:
Execute Phase 11 - Facebook Messenger Integration. Implement Messenger webhook with challenge-response verification, message parsing (text, attachments, quick replies), Graph API client for sending messages, persistent menu configuration. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-11-messenger-integration.md

Launch all 6 agents in parallel using the Task tool.
```

---

### **DAY 2 AFTERNOON: Wave 4 (8 Agents Parallel)**

**IMPORTANT: Paste this ENTIRE block as ONE message to spawn 8 agents simultaneously:**

```
I need you to spawn 8 agents in parallel to execute these final phases simultaneously. Use the Task tool 8 times in a single message:

AGENT 1 - Multi-platform Publishing:
Execute Phase 12 - Multi-platform Publishing System. Implement CMS backend for post creation, content formatter for different platforms, parallel publishing logic using Promise.allSettled (Web + Facebook + Zalo), retry mechanism with exponential backoff, publishing status tracking. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-12-multiplatform-publishing.md

AGENT 2 - Unit Testing:
Execute Phase 13 comprehensive unit testing. Write and run unit tests for: RAG pipeline (chunking, embeddings, retrieval), AI integration (routing, prompt templates), API endpoints (all routes), database operations (CRUD, batch), authentication, validation. Target >80% coverage. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-13-testing-qa.md

AGENT 3 - Integration Testing:
Execute integration testing for: Multi-platform webhook flows (Zalo, Messenger, Web), RAG end-to-end (query → retrieval → generation), real-time notification delivery, multi-platform publishing workflow, lead capture pipeline. Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-13-testing-qa.md

AGENT 4 - Code Review:
Perform comprehensive code review across entire codebase. Check: Code quality and consistency, TypeScript type safety, Error handling completeness, Security best practices (OWASP Top 10), Performance optimizations, Documentation coverage. Generate detailed review report with actionable recommendations.

AGENT 5 - Security Audit:
Conduct security audit covering: Authentication and authorization mechanisms, Input validation and sanitization, SQL injection prevention, XSS and CSRF protection, Secret management (no hardcoded credentials), API rate limiting, Webhook signature verification. Generate security assessment report.

AGENT 6 - Documentation Generation:
Execute /docs:update to generate comprehensive documentation: System architecture diagram, API reference (all endpoints), Database schema documentation, Deployment guide (Cloudflare setup), Admin user manual (dashboard usage), Knowledge base management guide, Troubleshooting guide.

AGENT 7 - Production Deployment:
Execute Phase 14 - Production Deployment. Configure Cloudflare production environment (Workers, Pages, D1, Vectorize, R2, KV, DO), setup custom domains with SSL, configure environment variables securely, setup monitoring (Cloudflare Analytics, error tracking), create CI/CD pipeline (GitHub Actions). Follow plan: plans/251115-1726-lawbot-comprehensive-system/phase-14-deployment.md

AGENT 8 - Performance Optimization:
Analyze and optimize system performance: Database query optimization (indexes, batch operations), API response time analysis, Workers memory usage optimization, Implement caching strategies (KV, browser cache), CDN configuration for static assets, Generate performance benchmark report.

Launch all 8 agents in parallel using the Task tool.
```

---

## 💰 Cost Breakdown

| Wave | Agents | Est. Tokens | Cost Estimate |
|------|--------|-------------|---------------|
| Wave 1 | 1 | 50K | $27 |
| Wave 2 | 4 | 400K | $200 |
| Wave 3 | 6 | 800K | $400 |
| Wave 4 | 8 | 550K | $300 |
| **TOTAL** | **19** | **~1.8M** | **~$927** |

**Buffer**: ~$73 for additional iterations, fixes, and reviews

---

## 📋 Execution Checklist

### Pre-execution:
- [ ] Confirm $1000 credit available
- [ ] Verify 2-day timeline acceptable
- [ ] Review all phase plans in `plans/251115-1726-lawbot-comprehensive-system/`
- [ ] Ensure internet connection stable
- [ ] Have Cloudflare account ready

### During execution:
- [ ] Monitor agent progress in real-time
- [ ] Track credit consumption
- [ ] Note any blockers or issues
- [ ] Review intermediate outputs

### Post-execution:
- [ ] Verify all 14 phases completed
- [ ] Run final integration tests
- [ ] Review all generated documentation
- [ ] Perform final code review
- [ ] Deploy to production environment

---

## 🎯 Success Metrics

**Technical**:
- ✅ All 14 phases implemented
- ✅ >80% test coverage
- ✅ Zero critical security vulnerabilities
- ✅ API response time <500ms (p95)
- ✅ All integrations (Zalo, Messenger, Facebook) working

**Business**:
- ✅ $900-1000 credit consumed in 2 days
- ✅ Production-ready codebase
- ✅ Complete documentation
- ✅ Deployable to Cloudflare

---

## 🚨 Known Risks

1. **Zalo API rate limits undocumented** - May hit limits during testing
2. **D1 sharding complexity** - Cross-database joins may need refactoring
3. **Vietnamese embedding quality** - May need tuning for legal jargon
4. **Parallel agent conflicts** - Git merge conflicts if agents modify same files
5. **Cloudflare service limits** - Free tier may be exceeded during testing

---

## 📞 Support

If you encounter issues during execution:
1. Check phase plan for specific guidance
2. Review research reports for technical details
3. Use `/debug` command for troubleshooting
4. Use `/fix:hard` for complex issues

---

**🔥 READY TO BURN! Copy prompts above to Claude Code web and watch the magic happen! 🔥**
