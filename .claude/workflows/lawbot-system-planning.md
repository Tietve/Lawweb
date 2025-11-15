# Legal AI Chatbot System - Implementation Workflow

**Project Name**: LawBot - AI-Powered Legal Consultation System
**Stack**: 100% Cloudflare (Pages, Workers, AI, Vectorize, D1, R2, KV, DO)
**Last Updated**: 2025-01-15
**Status**: Planning Phase

---

## Project Overview

Multi-platform legal consultation system với:
- **Web 1 (Public)**: Company website + AI chatbot + Blog
- **Web 2 (Admin)**: Dashboard + Analytics + CMS + Lead management
- **AI Integration**: RAG-based legal consultation + Company info
- **Multi-platform**: Web + Zalo OA + Facebook Messenger
- **Publishing**: Simultaneous posting to Web + Facebook + Zalo

---

## Phase 1: Foundation & Research (Week 1-2)

### 1.1 Technical Research
**Agent**: `researcher` (parallel execution)

**Tasks**:
```bash
# Researcher 1: Cloudflare Workers AI & Vectorize
/plan:hard "Research Cloudflare Workers AI, Vectorize, and RAG implementation patterns for legal domain in Vietnamese language"

Topics:
- Workers AI models for Vietnamese text
- Vectorize setup & optimization
- RAG architecture best practices
- Vietnamese embedding models
- Cost analysis & limitations
```

```bash
# Researcher 2: Multi-platform Integration
/plan:hard "Research integration patterns for Zalo Official Account API, Facebook Messenger Platform, and Facebook Graph API with Cloudflare Workers"

Topics:
- Zalo OA API documentation
- Facebook Messenger webhooks
- Facebook Graph API (page publishing)
- Webhook security & verification
- Unified message handling patterns
```

```bash
# Researcher 3: Legal Domain AI Safety
/plan:hard "Research AI safety, compliance, and best practices for legal consultation chatbots including hallucination prevention and data privacy"

Topics:
- Legal AI disclaimers
- Hallucination mitigation (RAG)
- Vietnamese legal data sources
- GDPR compliance
- Data privacy for law firms
```

**Outputs**:
- Research reports in `./plans/lawbot-research/`
- Technology stack recommendations
- Risk assessment document
- Compliance checklist

### 1.2 Architecture Design
**Agent**: `planner`

```bash
/plan:two "Design system architecture for dual-website legal consultation platform with RAG chatbot, admin dashboard, analytics, and multi-platform integration using Cloudflare stack"
```

**Deliverables**:
- System architecture diagram
- Database schema (D1)
- API endpoint specifications
- Data flow diagrams
- Component interactions
- Scalability plan

### 1.3 Project Setup
**Agent**: Main + `git-manager`

**Tasks**:
- Initialize Git repository
- Setup Cloudflare account & services
- Create project structure
- Configure Wrangler CLI
- Setup development environment
- Initialize documentation

**Commands**:
```bash
# Create project structure
mkdir -p {apps,packages,docs,plans}
mkdir -p apps/{public-web,admin-web,api}
mkdir -p packages/{ui,database,ai-rag}

# Initialize workspace
npm create cloudflare@latest lawbot-system

# Initialize ClaudeKit
cp -r .claude lawbot-system/
cd lawbot-system && git init
```

---

## Phase 2: Core Infrastructure (Week 3-4)

### 2.1 Database Schema & Setup
**Agent**: `database-admin`

```bash
/plan:fast "Design D1 database schema for customers, conversations, leads, posts, analytics with Vietnamese text support and efficient querying"
```

**Schema**:
```sql
-- D1 Database Schema
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source TEXT CHECK(source IN ('web', 'zalo', 'messenger')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id),
  platform TEXT NOT NULL,
  messages TEXT, -- JSON array
  metadata TEXT, -- JSON
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id),
  issue TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'new',
  assigned_to TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  images TEXT, -- JSON array of R2 URLs
  tags TEXT, -- JSON array
  published_to TEXT, -- JSON array ['web', 'facebook', 'zalo']
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics_daily (
  date DATE NOT NULL,
  metric TEXT NOT NULL,
  dimension TEXT,
  value INTEGER DEFAULT 0,
  PRIMARY KEY (date, metric, dimension)
);

-- Indexes
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_analytics_date ON analytics_daily(date);
```

**Implementation**:
```bash
/cook "Implement D1 database setup with Wrangler, create migration files, and setup database helpers in packages/database"
```

### 2.2 RAG System Foundation
**Agent**: Main + `planner`

```bash
/cook "Implement RAG pipeline with Cloudflare Vectorize including document chunking, embedding generation, vector search, and context retrieval"
```

**Components**:
```typescript
// packages/ai-rag/src/index.ts
export class RAGPipeline {
  async embedDocument(text: string): Promise<number[]> {
    // Workers AI embedding
    const response = await ai.run('@cf/baai/bge-base-en-v1.5', {
      text: [text]
    });
    return response.data[0];
  }

  async searchContext(query: string, topK = 5) {
    const embedding = await this.embedDocument(query);
    const results = await vectorize.query(embedding, { topK });
    return results;
  }

  async generateResponse(context: string, query: string) {
    // Claude API or Workers AI
    const prompt = buildPrompt(context, query);
    return await generateLLMResponse(prompt);
  }
}
```

### 2.3 API Layer (Workers)
**Agent**: Main

```bash
/cook "Create Cloudflare Workers API with Hono.js including routing for chat, leads, analytics, posts, and webhooks"
```

**Structure**:
```typescript
// apps/api/src/index.ts
import { Hono } from 'hono';

const app = new Hono();

// Chat endpoints
app.post('/api/chat', chatHandler);
app.get('/api/chat/:sessionId', getChatHistory);

// Lead management
app.get('/api/leads', getLeads);
app.post('/api/leads', createLead);

// Analytics
app.get('/api/analytics', getAnalytics);

// Posts/CMS
app.post('/api/posts', createPost);
app.post('/api/publish', publishMultiPlatform);

// Webhooks
app.post('/webhooks/zalo', zaloWebhook);
app.post('/webhooks/messenger', messengerWebhook);

export default app;
```

---

## Phase 3: Web 1 - Public Website (Week 5-6)

### 3.1 Frontend Development
**Agent**: Main + `ui-ux-designer`

```bash
/design:good "Design modern, professional law firm website with integrated AI chatbot, blog section, and company information using shadcn/ui and Tailwind CSS"
```

```bash
/cook "Implement Web 1 (Public) using Next.js 15 on Cloudflare Pages with:
- Company profile pages
- Services & pricing
- Blog with legal articles
- AI chatbot widget
- Contact forms
- Responsive design"
```

**Key Features**:
- Homepage with hero section
- Services page (danh sách dịch vụ)
- About page (giới thiệu công ty, team)
- Blog/News (tin tức, án lệ, chính sách)
- AI Chatbot widget (floating button)
- Contact page

### 3.2 AI Chatbot Widget
**Agent**: Main

```bash
/cook "Create AI chatbot widget component with real-time messaging, typing indicators, lead collection forms, and conversation history"
```

**Features**:
```typescript
interface ChatWidget {
  // UI Components
  toggleButton: FloatingButton,
  chatWindow: ChatWindow,
  messageList: Message[],
  inputBox: TextInput,

  // Features
  realTimeTyping: boolean,
  conversationHistory: boolean,
  leadForm: {
    trigger: 'auto' | 'manual',
    fields: ['name', 'phone', 'issue']
  },

  // Integration
  apiEndpoint: '/api/chat',
  websocket: boolean,
  reconnection: boolean
}
```

---

## Phase 4: Web 2 - Admin Dashboard (Week 7-8)

### 4.1 Dashboard UI
**Agent**: Main + `ui-ux-designer`

```bash
/design:good "Design comprehensive admin dashboard with lead management, real-time notifications, analytics charts, CMS, and multi-platform publishing interface"
```

```bash
/cook "Implement Admin Dashboard using Next.js with:
- Real-time lead notifications (WebSocket)
- Lead management table with filters
- Analytics dashboard with charts
- CMS for creating and publishing posts
- Knowledge base management
- User authentication"
```

### 4.2 Real-time Features (Durable Objects)
**Agent**: Main

```bash
/cook "Implement Durable Objects for real-time admin notifications and WebSocket connections"
```

```typescript
// apps/api/src/durable-objects/admin-notifier.ts
export class AdminNotifier {
  state: DurableObjectState;
  connections: WebSocket[] = [];

  async fetch(request: Request) {
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      this.handleWebSocket(pair[1]);
      return new Response(null, {
        status: 101,
        webSocket: pair[0]
      });
    }
  }

  async broadcastNewLead(lead: Lead) {
    const message = JSON.stringify({
      type: 'new_lead',
      data: lead
    });
    this.connections.forEach(ws => ws.send(message));
  }
}
```

### 4.3 Analytics System
**Agent**: Main

```bash
/cook "Implement analytics tracking and visualization with daily aggregation, metrics calculation, and chart generation"
```

**Metrics**:
- Total conversations (day/week/month)
- Leads generated by source
- Case type breakdown
- Platform distribution
- Response time averages
- Peak hours heatmap

---

## Phase 5: Multi-platform Integration (Week 9-10)

### 5.1 Facebook Messenger
**Agent**: `researcher` + Main

```bash
/plan:fast "Plan Facebook Messenger integration with webhook verification, message handling, and sending responses"
```

```bash
/cook "Implement Facebook Messenger integration with webhook endpoint, message parsing, and unified message routing"
```

### 5.2 Zalo Official Account
**Agent**: `researcher` + Main

```bash
/plan:fast "Plan Zalo Official Account integration with API authentication, webhook handling, and message sending"
```

```bash
/cook "Implement Zalo OA integration with webhook verification, message handling, and response sending"
```

### 5.3 Unified Message Handler
**Agent**: Main

```bash
/cook "Create unified message processing pipeline that routes messages from all platforms through same RAG system"
```

```typescript
interface UnifiedMessage {
  id: string;
  source: 'web' | 'zalo' | 'messenger';
  userId: string;
  text: string;
  timestamp: Date;
  metadata?: any;
}

async function processUnifiedMessage(msg: UnifiedMessage) {
  // 1. Store conversation
  await storeMessage(msg);

  // 2. RAG pipeline
  const context = await ragPipeline.searchContext(msg.text);
  const response = await ragPipeline.generateResponse(context, msg.text);

  // 3. Detect lead intent
  if (isLeadIntent(response)) {
    await createLead(msg);
    await notifyAdmin(msg);
  }

  // 4. Send response via appropriate platform
  await sendMessage(msg.source, msg.userId, response);
}
```

---

## Phase 6: Multi-platform Publishing (Week 11)

### 6.1 CMS Backend
**Agent**: Main

```bash
/cook "Implement CMS backend with post creation, image upload to R2, and multi-platform publishing queue"
```

### 6.2 Platform Publishers
**Agent**: Main

```bash
/cook "Create publishing modules for Website, Facebook Page, and Zalo OA with error handling and status tracking"
```

```typescript
async function publishPost(post: Post, platforms: string[]) {
  const results = await Promise.allSettled([
    platforms.includes('web') && publishToWebsite(post),
    platforms.includes('facebook') && publishToFacebookPage(post),
    platforms.includes('zalo') && publishToZaloOA(post)
  ]);

  await updatePublishStatus(post.id, results);
  return results;
}
```

---

## Phase 7: Knowledge Base & RAG Training (Week 12-13)

### 7.1 Document Processing Pipeline
**Agent**: Main

```bash
/cook "Create document processing pipeline for uploading legal documents (PDF, DOCX), extracting text, chunking, and generating embeddings"
```

**Pipeline**:
1. Upload to R2
2. Extract text (PDF.js, mammoth.js)
3. Clean & normalize (Vietnamese text)
4. Chunk (512 tokens, overlap 50)
5. Generate embeddings (Workers AI)
6. Store in Vectorize
7. Store metadata in D1

### 7.2 Knowledge Base Management UI
**Agent**: Main

```bash
/cook "Create admin UI for uploading documents, viewing knowledge base, testing RAG queries, and managing categories"
```

---

## Phase 8: Testing & Quality Assurance (Week 14-15)

### 8.1 Unit & Integration Tests
**Agent**: `tester`

```bash
/test "Run comprehensive test suite for all components"
```

**Test Coverage**:
- RAG pipeline accuracy
- API endpoints
- Database operations
- Webhook handlers
- Multi-platform publishing
- Real-time notifications
- Authentication
- Error handling

### 8.2 AI Quality Testing
**Agent**: Main + Manual QA

**Tests**:
- Vietnamese language understanding
- Legal terminology accuracy
- Hallucination detection
- Response quality (Claude vs Workers AI)
- RAG context relevance
- Lead capture effectiveness

### 8.3 Security Testing
**Agent**: `code-reviewer`

```bash
/fix:test "Security audit for authentication, data privacy, API vulnerabilities, and compliance"
```

**Checks**:
- SQL injection prevention
- XSS protection
- CSRF tokens
- Rate limiting
- Webhook signature verification
- Data encryption
- Access controls

---

## Phase 9: Deployment & Launch (Week 16)

### 9.1 Production Deployment
**Agent**: Main

**Steps**:
1. Configure Cloudflare production environment
2. Deploy Web 1 (Pages)
3. Deploy Web 2 (Pages)
4. Deploy API (Workers)
5. Setup D1 production database
6. Configure Vectorize index
7. Setup R2 buckets
8. Configure KV namespaces
9. Deploy Durable Objects
10. Setup custom domains
11. Configure SSL/TLS

### 9.2 Monitoring & Logging
**Agent**: Main

```bash
/cook "Setup monitoring with Cloudflare Analytics, error tracking, and logging for debugging"
```

**Monitors**:
- API response times
- Error rates
- Conversation volumes
- Lead conversion rates
- Platform health checks
- RAG quality metrics

### 9.3 Documentation
**Agent**: `docs-manager`

```bash
/docs:init "Create comprehensive documentation including system architecture, API docs, deployment guide, and user manuals"
```

**Docs**:
- System architecture
- API reference
- Deployment guide
- Admin user manual
- Knowledge base management
- Troubleshooting guide
- Security best practices

---

## Phase 10: Post-Launch Optimization (Week 17+)

### 10.1 Performance Optimization
**Agent**: Main + `debugger`

- Monitor response times
- Optimize database queries
- Cache frequently accessed data (KV)
- CDN optimization
- Workers performance tuning

### 10.2 AI Improvement
**Agent**: Main

- Collect user feedback
- Analyze conversation quality
- Refine RAG prompts
- Expand knowledge base
- Fine-tune retrieval parameters
- A/B test Claude vs Workers AI

### 10.3 Feature Enhancements
**Agent**: `planner` + Main

Based on user feedback:
- Voice message support
- Document sharing in chat
- Appointment scheduling
- Email notifications
- SMS integration
- Advanced analytics

---

## Risk Management

### High Priority Risks

1. **AI Hallucination**
   - Mitigation: RAG with verified sources, clear disclaimers, human review option

2. **Platform API Changes**
   - Mitigation: Abstract integration layer, version pinning, monitoring

3. **Data Privacy**
   - Mitigation: Encryption, access controls, compliance audit, GDPR

4. **Scale Limits**
   - Mitigation: D1 archival, KV caching, pagination, cleanup

### Medium Priority Risks

5. **Integration Rate Limits**
   - Mitigation: Request queuing, exponential backoff, caching

6. **Workers AI Quality**
   - Mitigation: Hybrid approach (Claude primary), fallback, testing

---

## Success Metrics

### Technical Metrics
- API response time < 500ms (p95)
- RAG retrieval accuracy > 85%
- Uptime > 99.9%
- Error rate < 1%

### Business Metrics
- Lead conversion rate > 10%
- Customer satisfaction > 4.5/5
- Platform engagement (messages/day)
- Response quality rating

---

## Budget Estimate

### Development (16 weeks)
- Planning: 2 weeks
- Core development: 12 weeks
- Testing & deployment: 2 weeks

### Cloudflare Costs (Monthly)
- **Free Tier** (MVP): $0
- **Paid Plan** (Production): $50-150/month
  - Workers Paid: $5
  - D1 Paid: $5
  - R2 Storage: $10-20
  - Workers AI: $10-30
  - Claude API: $30-100

### Total Estimate
- **MVP**: ~$0-10/month
- **Production**: ~$50-150/month
- **Scale**: ~$200-500/month (high traffic)

---

## Next Steps

1. **Review this workflow** with stakeholders
2. **Approve tech stack** and architecture
3. **Setup development environment**
4. **Start Phase 1 research** using ClaudeKit agents
5. **Weekly progress reviews**

---

## Commands for Execution

```bash
# Start planning phase
/plan:hard "Execute Phase 1 technical research for LawBot system"

# Begin development
/cook "Start Phase 2 core infrastructure implementation"

# Test and review
/test "Run test suite"
/watzup "Review current progress"

# Deploy
/git:pr main "Phase X complete: [description]"
```

---

**This workflow will be executed by ClaudeKit's orchestration system with specialized agents handling each phase autonomously while maintaining quality and consistency.**
