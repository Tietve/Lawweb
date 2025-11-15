-- LawBot Archive Database Schema
-- For archiving conversations and messages older than 30 days
-- Optimized for storage efficiency using compressed JSON format

-- Archived conversations - Compressed format for storage efficiency
CREATE TABLE IF NOT EXISTS conversations_archive (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  archived_at INTEGER NOT NULL DEFAULT (unixepoch()),
  data TEXT NOT NULL, -- Compressed JSON: {conversation: {...}, messages: [...]}
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_archive_user_id ON conversations_archive(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_archive_platform ON conversations_archive(platform);
CREATE INDEX IF NOT EXISTS idx_conversations_archive_archived_at ON conversations_archive(archived_at);
CREATE INDEX IF NOT EXISTS idx_conversations_archive_created_at ON conversations_archive(created_at);

-- Archive metadata - Track archival operations
CREATE TABLE IF NOT EXISTS archive_metadata (
  id TEXT PRIMARY KEY,
  archive_type TEXT NOT NULL CHECK(archive_type IN ('conversation', 'message')),
  records_archived INTEGER NOT NULL DEFAULT 0,
  compression_ratio REAL, -- Original size / Compressed size
  archived_at INTEGER NOT NULL DEFAULT (unixepoch()),
  metadata TEXT DEFAULT '{}' -- JSON: {batch_id, source_table, etc}
);

CREATE INDEX IF NOT EXISTS idx_archive_metadata_archive_type ON archive_metadata(archive_type);
CREATE INDEX IF NOT EXISTS idx_archive_metadata_archived_at ON archive_metadata(archived_at);

-- Archive stats - Aggregated statistics for monitoring
CREATE TABLE IF NOT EXISTS archive_stats (
  date TEXT PRIMARY KEY, -- Format: YYYY-MM-DD
  total_archived INTEGER NOT NULL DEFAULT 0,
  conversations_archived INTEGER NOT NULL DEFAULT 0,
  messages_archived INTEGER NOT NULL DEFAULT 0,
  storage_saved_mb REAL NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_archive_stats_date ON archive_stats(date);
