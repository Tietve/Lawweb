-- LawBot Analytics Database Schema
-- For tracking usage metrics and performance analytics

-- Daily analytics - Aggregated daily metrics
CREATE TABLE IF NOT EXISTS analytics_daily (
  date TEXT PRIMARY KEY, -- Format: YYYY-MM-DD
  total_users INTEGER NOT NULL DEFAULT 0,
  new_users INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  total_conversations INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER NOT NULL DEFAULT 0,
  platform_breakdown TEXT DEFAULT '{}', -- JSON: {zalo: 100, messenger: 50, web: 75, widget: 25}
  top_categories TEXT DEFAULT '[]', -- JSON: [{category: "Hình sự", count: 150}, ...]
  error_count INTEGER NOT NULL DEFAULT 0,
  feedback_avg REAL, -- Average feedback rating
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date);

-- Hourly analytics - Granular hourly metrics for real-time monitoring
CREATE TABLE IF NOT EXISTS analytics_hourly (
  datetime TEXT PRIMARY KEY, -- Format: YYYY-MM-DD HH:00:00
  active_users INTEGER NOT NULL DEFAULT 0,
  conversations INTEGER NOT NULL DEFAULT 0,
  messages INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  platform_breakdown TEXT DEFAULT '{}', -- JSON: {zalo: 10, messenger: 5, web: 7, widget: 2}
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_analytics_hourly_datetime ON analytics_hourly(datetime);

-- Query analytics - Track popular queries and search patterns
CREATE TABLE IF NOT EXISTS analytics_queries (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  category TEXT, -- Categorized query type
  results_count INTEGER NOT NULL DEFAULT 0,
  avg_relevance REAL, -- Average relevance score of results
  platform TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_analytics_queries_category ON analytics_queries(category);
CREATE INDEX IF NOT EXISTS idx_analytics_queries_platform ON analytics_queries(platform);
CREATE INDEX IF NOT EXISTS idx_analytics_queries_created_at ON analytics_queries(created_at);

-- Document analytics - Track document access and popularity
CREATE TABLE IF NOT EXISTS analytics_documents (
  date TEXT NOT NULL, -- Format: YYYY-MM-DD
  law_code TEXT NOT NULL,
  article TEXT NOT NULL,
  access_count INTEGER NOT NULL DEFAULT 0,
  relevance_avg REAL, -- Average relevance when returned in results
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (date, law_code, article)
);

CREATE INDEX IF NOT EXISTS idx_analytics_documents_date ON analytics_documents(date);
CREATE INDEX IF NOT EXISTS idx_analytics_documents_law_code ON analytics_documents(law_code);
CREATE INDEX IF NOT EXISTS idx_analytics_documents_access_count ON analytics_documents(access_count);

-- Performance analytics - Track system performance metrics
CREATE TABLE IF NOT EXISTS analytics_performance (
  datetime TEXT PRIMARY KEY, -- Format: YYYY-MM-DD HH:00:00
  avg_db_query_ms INTEGER NOT NULL DEFAULT 0,
  avg_vector_search_ms INTEGER NOT NULL DEFAULT 0,
  avg_ai_response_ms INTEGER NOT NULL DEFAULT 0,
  avg_total_response_ms INTEGER NOT NULL DEFAULT 0,
  p95_response_ms INTEGER, -- 95th percentile response time
  p99_response_ms INTEGER, -- 99th percentile response time
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
  metadata TEXT DEFAULT '{}' -- JSON: {request_id, conversation_id, etc}
);

CREATE INDEX IF NOT EXISTS idx_analytics_errors_error_type ON analytics_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_analytics_errors_platform ON analytics_errors(platform);
CREATE INDEX IF NOT EXISTS idx_analytics_errors_occurred_at ON analytics_errors(occurred_at);

-- Feedback analytics - Aggregated feedback metrics
CREATE TABLE IF NOT EXISTS analytics_feedback (
  date TEXT PRIMARY KEY, -- Format: YYYY-MM-DD
  total_feedback INTEGER NOT NULL DEFAULT 0,
  avg_rating REAL NOT NULL DEFAULT 0,
  rating_breakdown TEXT DEFAULT '{}', -- JSON: {1: 5, 2: 10, 3: 20, 4: 30, 5: 35}
  with_comments INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_analytics_feedback_date ON analytics_feedback(date);
