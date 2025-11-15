/**
 * Zalo Monitoring & Logging
 * Track webhook events and metrics
 */

import type { ZaloEventType } from '@lawbot/shared';

/**
 * Monitor class for Zalo webhook events
 */
export class ZaloMonitor {
  /**
   * Log webhook event to database
   *
   * @param eventType - Type of webhook event
   * @param userId - User ID (optional)
   * @param data - Event data
   * @param db - D1 database instance
   */
  static async logWebhookEvent(
    eventType: ZaloEventType,
    userId: string | undefined,
    data: unknown,
    db: D1Database
  ): Promise<void> {
    try {
      await db
        .prepare(
          `
        INSERT INTO webhook_logs (platform, event_type, user_id, data, created_at)
        VALUES (?, ?, ?, ?, unixepoch())
      `
        )
        .bind('zalo', eventType, userId || null, JSON.stringify(data))
        .run();
    } catch (error) {
      console.error('Failed to log webhook event:', error);
      // Don't throw - logging should not break the main flow
    }
  }

  /**
   * Log error event
   *
   * @param error - Error object
   * @param context - Additional context
   * @param db - D1 database instance
   */
  static async logError(
    error: Error,
    context: Record<string, unknown>,
    db: D1Database
  ): Promise<void> {
    try {
      await db
        .prepare(
          `
        INSERT INTO webhook_logs (platform, event_type, data, created_at)
        VALUES (?, 'error', ?, unixepoch())
      `
        )
        .bind(
          'zalo',
          JSON.stringify({
            error: error.message,
            stack: error.stack,
            context,
          })
        )
        .run();
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  /**
   * Track processing metrics
   *
   * @param metric - Metric name
   * @param value - Metric value
   * @param labels - Additional labels
   */
  static async trackMetric(
    metric: string,
    value: number,
    labels?: Record<string, string>
  ): Promise<void> {
    // In production, this would send metrics to Analytics DO or external service
    console.log(`[METRIC] ${metric}:`, value, labels);
  }

  /**
   * Track message processing time
   *
   * @param startTime - Processing start timestamp
   * @param eventType - Event type
   */
  static async trackProcessingTime(
    startTime: number,
    eventType: ZaloEventType
  ): Promise<void> {
    const duration = Date.now() - startTime;
    await this.trackMetric('webhook_processing_time_ms', duration, {
      platform: 'zalo',
      event_type: eventType,
    });
  }

  /**
   * Create monitoring context for request
   *
   * @param request - Incoming request
   * @returns Monitoring context
   */
  static createContext(request: Request): MonitoringContext {
    return {
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip:
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for') ||
        'unknown',
    };
  }
}

/**
 * Monitoring context
 */
export interface MonitoringContext {
  requestId: string;
  timestamp: number;
  userAgent: string;
  ip: string;
}

/**
 * Ensure webhook_logs table exists
 * This is a helper for initial setup
 */
export async function ensureWebhookLogsTable(db: D1Database): Promise<void> {
  await db
    .prepare(
      `
    CREATE TABLE IF NOT EXISTS webhook_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      event_type TEXT NOT NULL,
      user_id TEXT,
      data TEXT,
      created_at INTEGER NOT NULL
    )
  `
    )
    .run();

  await db
    .prepare(
      `
    CREATE INDEX IF NOT EXISTS idx_webhook_logs_platform
    ON webhook_logs(platform)
  `
    )
    .run();

  await db
    .prepare(
      `
    CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type
    ON webhook_logs(event_type)
  `
    )
    .run();

  await db
    .prepare(
      `
    CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at
    ON webhook_logs(created_at)
  `
    )
    .run();
}
