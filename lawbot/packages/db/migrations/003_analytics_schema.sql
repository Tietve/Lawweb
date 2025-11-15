-- Migration 003: Analytics Schema
-- Creates analytics tables for usage metrics and performance tracking

-- Daily analytics - Aggregated daily metrics
CREATE TABLE IF NOT EXISTS analytics_daily (
  date TEXT PRIMARY KEY,
  total_users INTEGER NOT NULL DEFAULT 0,
  new_users INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  total_conversations INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER NOT NULL DEFAULT 0,
  platform_breakdown TEXT DEFAULT '{}',
  top_categories TEXT DEFAULT '[]',
  error_count INTEGER NOT NULL DEFAULT 0,
  feedback_avg REAL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date);

-- Hourly analytics - Granular hourly metrics for real-time monitoring
CREATE TABLE IF NOT EXISTS analytics_hourly (
  datetime TEXT PRIMARY KEY,
  active_users INTEGER NOT NULL DEFAULT 0,
  conversations INTEGER NOT NULL DEFAULT 0,
  messages INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  platform_breakdown TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_analytics_hourly_datetime ON analytics_hourly(datetime);

-- Query analytics - Track popular queries and search patterns
CREATE TABLE IF NOT EXISTS analytics_queries (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  category TEXT,
  results_count INTEGER NOT NULL DEFAULT 0,
  avg_relevance REAL,
  platform TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_analytics_queries_category ON analytics_queries(category);
CREATE INDEX IF NOT EXISTS idx_analytics_queries_platform ON analytics_queries(platform);
CREATE INDEX IF NOT EXISTS idx_analytics_queries_created_at ON analytics_queries(created_at);

-- Document analytics - Track document access and popularity
CREATE TABLE IF NOT EXISTS analytics_documents (
  date TEXT NOT NULL,
  law_code TEXT NOT NULL,
  article TEXT NOT NULL,
  access_count INTEGER NOT NULL DEFAULT 0,
  relevance_avg REAL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (date, law_code, article)
);

CREATE INDEX IF NOT EXISTS idx_analytics_documents_date ON analytics_documents(date);
CREATE INDEX IF NOT EXISTS idx_analytics_documents_law_code ON analytics_documents(law_code);
CREATE INDEX IF NOT EXISTS idx_analytics_documents_access_count ON analytics_documents(access_count);

-- Performance analytics - Track system performance metrics
CREATE TABLE IF NOT EXISTS analytics_performance (
  datetime TEXT PRIMARY KEY,
  avg_db_query_ms INTEGER NOT NULL DEFAULT 0,
  avg_vector_search_ms INTEGER NOT NULL DEFAULT 0,
  avg_ai_response_ms INTEGER NOT NULL DEFAULT 0,
  avg_total_response_ms INTEGER NOT NULL DEFAULT 0,
  p95_response_ms INTEGER,
  p99_response_ms INTEGER,
  requests_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_analytics_performance_datetime ON analytics_performance(datetime);

-- Error analytics - Track and categorize errors
CREATE TABLE IF NOT EXISTS analytics_errors (
  id TEXT PRIMARY KEY,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  platform TEXT NOT NULL,
  user_id TEXT,
  occurred_at INTEGER NOT NULL DEFAULT (unixepoch()),
  metadata TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_analytics_errors_error_type ON analytics_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_analytics_errors_platform ON analytics_errors(platform);
CREATE INDEX IF NOT EXISTS idx_analytics_errors_occurred_at ON analytics_errors(occurred_at);

-- Feedback analytics - Aggregated feedback metrics
CREATE TABLE IF NOT EXISTS analytics_feedback (
  date TEXT PRIMARY KEY,
  total_feedback INTEGER NOT NULL DEFAULT 0,
  avg_rating REAL NOT NULL DEFAULT 0,
  rating_breakdown TEXT DEFAULT '{}',
  with_comments INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_analytics_feedback_date ON analytics_feedback(date);
