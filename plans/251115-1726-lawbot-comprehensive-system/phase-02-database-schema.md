# Phase 02: Database Schema & D1 Configuration

## Context Links
- [Parent Plan](plan.md)
- [Research: Cloudflare RAG](research/researcher-01-cloudflare-vietnamese-rag.md)
- [Prev: Project Setup](phase-01-project-setup.md)
- [Next: API Layer](phase-05-api-layer.md)

## Overview
- **Date**: 2025-11-15
- **Description**: Design & implement D1 database schema with sharding strategy
- **Priority**: P0 - Core foundation
- **Implementation Status**: 🔴 Not Started
- **Review Status**: 🔴 Not Started

## Key Insights
- D1 limit: 10GB per database
- Solution: Shard by date/category
- Batch inserts: 10-11x performance gain
- Time Travel API for analytics

## Requirements

### Functional
- User management & authentication
- Conversation storage with history
- Legal document metadata
- Analytics data aggregation
- Admin activity logs

### Non-functional
- Support 10K concurrent users
- Sub-100ms query response
- Automatic archival after 30 days
- Efficient batch operations

## Architecture

### Database Sharding Strategy
```
Primary DB (lawbot-main): Active data (last 30 days)
Archive DB (lawbot-archive): Historical data
Analytics DB (lawbot-analytics): Aggregated metrics
```

## Related Code Files

### Create
- `/packages/db/schema.sql` - Database schema
- `/packages/db/migrations/` - Migration files
- `/packages/db/seed.sql` - Seed data
- `/packages/db/index.ts` - D1 client wrapper

## Implementation Steps

1. **Create Primary Database Schema**
```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  name TEXT,
  platform TEXT CHECK(platform IN ('web', 'zalo', 'facebook')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME,
  metadata JSON
);
CREATE INDEX idx_users_platform ON users(platform);
CREATE INDEX idx_users_last_active ON users(last_active);

-- Conversations table
CREATE TABLE conversations (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_conv_user ON conversations(user_id);
CREATE INDEX idx_conv_created ON conversations(created_at);

-- Messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  conversation_id TEXT NOT NULL,
  role TEXT CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  embeddings_id TEXT,
  sources JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
CREATE INDEX idx_msg_conv ON messages(conversation_id);

-- Legal documents metadata
CREATE TABLE legal_documents (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  law_code TEXT NOT NULL,
  article TEXT NOT NULL,
  title TEXT,
  category TEXT,
  effective_date DATE,
  vector_ids JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_legal_code ON legal_documents(law_code);
CREATE INDEX idx_legal_category ON legal_documents(category);
```

2. **Create Archive Database Schema**
```sql
CREATE TABLE conversation_archive (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  summary TEXT,
  message_count INTEGER,
  created_at DATETIME,
  archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata JSON
);

CREATE TABLE message_archive (
  conversation_id TEXT,
  messages JSON,
  archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

3. **Create Analytics Database**
```sql
CREATE TABLE analytics_daily (
  date DATE PRIMARY KEY,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  avg_response_time REAL,
  platform_breakdown JSON
);

CREATE TABLE analytics_hourly (
  datetime DATETIME PRIMARY KEY,
  active_users INTEGER,
  conversations INTEGER,
  messages INTEGER,
  errors INTEGER
);
```

4. **Implement D1 Client Wrapper**
```typescript
// packages/db/index.ts
export class D1Client {
  constructor(
    private mainDb: D1Database,
    private archiveDb: D1Database,
    private analyticsDb: D1Database
  ) {}

  async batchInsert(table: string, records: any[]) {
    const chunks = this.chunk(records, 10000);
    for (const chunk of chunks) {
      await this.mainDb.batch(
        chunk.map(record =>
          this.mainDb.prepare(`INSERT INTO ${table} ...`).bind(...values)
        )
      );
    }
  }

  async archiveOldConversations() {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    // Move to archive DB
  }
}
```

5. **Create Migration System**
```typescript
// packages/db/migrate.ts
export async function migrate(db: D1Database) {
  const migrations = await readMigrations();
  for (const migration of migrations) {
    await db.exec(migration.sql);
  }
}
```

6. **Setup Seed Data**
```sql
-- Legal categories
INSERT INTO legal_documents (law_code, article, title, category)
VALUES
  ('civil_2015', '123', 'Property Rights', 'civil'),
  ('labor_2019', '45', 'Working Hours', 'labor');
```

## Todo List
- [ ] Create main database schema
- [ ] Create archive database schema
- [ ] Create analytics database schema
- [ ] Implement D1 client wrapper
- [ ] Setup migration system
- [ ] Create indexes for performance
- [ ] Implement batch operations
- [ ] Setup archival job
- [ ] Create seed data
- [ ] Test database connections
- [ ] Benchmark query performance

## Success Criteria
- All tables created successfully
- Indexes improve query performance <100ms
- Batch inserts working efficiently
- Archive process automated
- Analytics aggregation functional

## Risk Assessment
- **Risk**: 10GB D1 limit reached
- **Mitigation**: Implement aggressive archival, monitor growth
- **Risk**: Query performance degradation
- **Mitigation**: Proper indexing, query optimization

## Security Considerations
- Parameterized queries to prevent SQL injection
- User data encryption at rest
- Audit logs for admin actions
- PII data handling compliance

## Next Steps
- Phase 05: API Layer (needs schema)
- Phase 03: RAG Pipeline (can run parallel)