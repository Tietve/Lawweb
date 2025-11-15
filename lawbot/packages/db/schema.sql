-- LawBot Primary Database Schema
-- Cloudflare D1 (SQLite) Database Schema

-- Users table - Store user information across platforms
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT,
  email TEXT,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK(platform IN ('zalo', 'messenger', 'web', 'widget')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_active INTEGER NOT NULL DEFAULT (unixepoch()),
  metadata TEXT DEFAULT '{}', -- JSON: {preferences, settings, etc}
  UNIQUE(phone, platform),
  UNIQUE(email, platform)
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_platform ON users(platform);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);

-- Conversations table - Track conversation sessions
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK(platform IN ('zalo', 'messenger', 'web', 'widget')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived', 'deleted')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  metadata TEXT DEFAULT '{}', -- JSON: {topic, tags, summary, etc}
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_platform ON conversations(platform);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);

-- Messages table - Store all messages in conversations
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  embeddings_id TEXT, -- Reference to Vectorize index
  sources TEXT, -- JSON array: [{"law_code": "...", "article": "...", "relevance": 0.95}]
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_embeddings_id ON messages(embeddings_id);

-- Legal documents table - Store legal document metadata
CREATE TABLE IF NOT EXISTS legal_documents (
  id TEXT PRIMARY KEY,
  law_code TEXT NOT NULL, -- e.g., "BLHS2015", "BLDS2024"
  article TEXT NOT NULL, -- e.g., "Điều 1", "Điều 100"
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g., "Hình sự", "Dân sự", "Lao động"
  content TEXT NOT NULL,
  effective_date INTEGER, -- Unix timestamp
  vector_ids TEXT, -- JSON array: IDs in Vectorize index for chunked content
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(law_code, article)
);

CREATE INDEX IF NOT EXISTS idx_legal_documents_law_code ON legal_documents(law_code);
CREATE INDEX IF NOT EXISTS idx_legal_documents_category ON legal_documents(category);
CREATE INDEX IF NOT EXISTS idx_legal_documents_effective_date ON legal_documents(effective_date);
CREATE INDEX IF NOT EXISTS idx_legal_documents_updated_at ON legal_documents(updated_at);

-- Full-text search on legal documents
CREATE VIRTUAL TABLE IF NOT EXISTS legal_documents_fts USING fts5(
  law_code,
  article,
  title,
  content,
  category,
  content='legal_documents',
  content_rowid='rowid'
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS legal_documents_fts_insert AFTER INSERT ON legal_documents BEGIN
  INSERT INTO legal_documents_fts(rowid, law_code, article, title, content, category)
  VALUES (new.rowid, new.law_code, new.article, new.title, new.content, new.category);
END;

CREATE TRIGGER IF NOT EXISTS legal_documents_fts_update AFTER UPDATE ON legal_documents BEGIN
  UPDATE legal_documents_fts
  SET law_code = new.law_code,
      article = new.article,
      title = new.title,
      content = new.content,
      category = new.category
  WHERE rowid = new.rowid;
END;

CREATE TRIGGER IF NOT EXISTS legal_documents_fts_delete AFTER DELETE ON legal_documents BEGIN
  DELETE FROM legal_documents_fts WHERE rowid = old.rowid;
END;

-- Sessions table - Track active sessions for web/widget
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK(platform IN ('web', 'widget')),
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Feedback table - Store user feedback on responses
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feedback_message_id ON feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
