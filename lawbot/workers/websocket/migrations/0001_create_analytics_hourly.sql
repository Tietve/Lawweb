-- Migration: Create analytics_hourly table
-- Created: 2025-11-15
-- Description: Store aggregated hourly analytics metrics from AnalyticsAggregator DO

CREATE TABLE IF NOT EXISTS analytics_hourly (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hour TEXT NOT NULL,              -- YYYY-MM-DDTHH format
  metric_name TEXT NOT NULL,       -- Name of the metric
  value INTEGER NOT NULL DEFAULT 0, -- Aggregated value
  recorded_at TEXT NOT NULL,       -- ISO timestamp
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(hour, metric_name)        -- Prevent duplicates per hour/metric
);

-- Index for faster queries by hour
CREATE INDEX IF NOT EXISTS idx_analytics_hourly_hour
  ON analytics_hourly(hour);

-- Index for faster queries by metric name
CREATE INDEX IF NOT EXISTS idx_analytics_hourly_metric
  ON analytics_hourly(metric_name);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_analytics_hourly_recorded
  ON analytics_hourly(recorded_at);
