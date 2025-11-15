# @lawbot/db

Database schemas and utilities for LawBot application using Cloudflare D1 (SQLite).

## Features

- Type-safe database operations with Zod validation
- D1 client wrapper with batch operations support
- Migration system for schema management
- Query helpers for common operations
- Automatic archival of old conversations
- Full-text search support for legal documents

## Installation

```bash
npm install @lawbot/db
```

## Database Schema

### Primary Tables

- **users** - User information across platforms (Zalo, Messenger, Web, Widget)
- **conversations** - Conversation sessions
- **messages** - Messages within conversations
- **legal_documents** - Legal document metadata with full-text search
- **sessions** - Active sessions for web/widget
- **feedback** - User feedback on responses

### Archive Tables

- **conversations_archive** - Archived conversations (30+ days old)
- **archive_metadata** - Archive operation tracking
- **archive_stats** - Archive statistics

### Analytics Tables

- **analytics_daily** - Daily aggregated metrics
- **analytics_hourly** - Hourly metrics for real-time monitoring
- **analytics_queries** - Query tracking
- **analytics_documents** - Document access statistics
- **analytics_performance** - Performance metrics
- **analytics_errors** - Error tracking
- **analytics_feedback** - Feedback analytics

## Usage

### Initialize D1 Client

```typescript
import { D1Client } from '@lawbot/db';

// In your Cloudflare Worker
const client = new D1Client(env.DB);
```

### Running Migrations

```typescript
import { migrate } from '@lawbot/db';
import path from 'path';

// Run migrations
const migrationsDir = path.join(__dirname, '../migrations');
const appliedCount = await migrate(env.DB, migrationsDir);
console.log(`Applied ${appliedCount} migrations`);
```

### Query Examples

```typescript
import { userQueries, conversationQueries, messageQueries } from '@lawbot/db';

// Find user by phone
const user = await userQueries.findByPhone(env.DB, '+84901234567', 'zalo');

// Get user conversations
const conversations = await conversationQueries.findByUserId(env.DB, user.id);

// Get conversation messages
const messages = await messageQueries.findByConversationId(env.DB, conversations[0].id);
```

### Batch Insert

```typescript
import { D1Client } from '@lawbot/db';

const client = new D1Client(env.DB);

// Insert 10,000+ records in batches
await client.batchInsert('legal_documents', documents, 10000);
```

### Archive Old Conversations

```typescript
import { D1Client } from '@lawbot/db';

const client = new D1Client(env.DB);

// Archive conversations older than 30 days
const archivedCount = await client.archiveOldConversations(30);
console.log(`Archived ${archivedCount} conversations`);
```

### Full-Text Search

```typescript
import { legalDocumentQueries } from '@lawbot/db';

// Search legal documents
const results = await legalDocumentQueries.search(env.DB, 'tội trộm cắp', 20);
```

### Validation with Zod

```typescript
import { UserInsertSchema, MessageInsertSchema } from '@lawbot/db';

// Validate user data
const userData = UserInsertSchema.parse({
  id: 'usr-001',
  name: 'Nguyễn Văn A',
  phone: '+84901234567',
  platform: 'zalo',
});

// Validate message data
const messageData = MessageInsertSchema.parse({
  id: 'msg-001',
  conversation_id: 'conv-001',
  role: 'user',
  content: 'Tội trộm cắp tài sản bị phạt như thế nào?',
});
```

## Schema Files

- `schema.sql` - Primary database schema
- `archive-schema.sql` - Archive tables schema
- `analytics-schema.sql` - Analytics tables schema
- `seed.sql` - Development seed data
- `migrations/001_initial_schema.sql` - Initial migration
- `migrations/002_archive_schema.sql` - Archive migration
- `migrations/003_analytics_schema.sql` - Analytics migration

## TypeScript Types

All schemas export TypeScript types:

```typescript
import type {
  User,
  UserInsert,
  UserUpdate,
  Conversation,
  Message,
  LegalDocument,
  Session,
  Feedback,
} from '@lawbot/db';
```

## Performance

- Query performance target: <100ms
- Batch insert: Up to 10,000 records per batch
- Automatic indexing on all foreign keys
- Full-text search using SQLite FTS5
- Parameterized queries for SQL injection prevention

## Development

```bash
# Type check
npm run type-check

# Build
npm run build
```

## License

Private - All rights reserved
