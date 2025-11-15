/**
 * Analytics routes (Admin only)
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { validateQuery } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import type { HonoContext } from '../types';

const analytics = new Hono<HonoContext>();

// All analytics routes require admin authentication
analytics.use('*', authMiddleware, requireAdmin);

const dailyMetricsSchema = z.object({
  days: z.string().transform(Number).pipe(z.number().int().min(1).max(90)).optional().default('30'),
});

const hourlyMetricsSchema = z.object({
  hours: z.string().transform(Number).pipe(z.number().int().min(1).max(168)).optional().default('24'),
});

/**
 * GET /api/v1/analytics/dashboard
 * Get admin dashboard statistics
 */
analytics.get('/dashboard', async (c) => {
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Total users
  const totalUsers = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM users'
  ).first() as { count: number };

  // New users (last 30 days)
  const newUsers = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM users WHERE created_at >= ?'
  ).bind(last30Days).first() as { count: number };

  // Total conversations
  const totalConversations = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM conversations'
  ).first() as { count: number };

  // Active conversations (last 24 hours)
  const activeConversations = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM conversations WHERE updated_at >= ?'
  ).bind(last24Hours).first() as { count: number };

  // Total messages
  const totalMessages = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM messages'
  ).first() as { count: number };

  // Messages today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const messagesToday = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM messages WHERE created_at >= ?'
  ).bind(today.toISOString()).first() as { count: number };

  // Total documents
  const totalDocuments = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM documents'
  ).first() as { count: number };

  // Average response time (placeholder - would come from actual metrics)
  const avgResponseTime = 350; // ms

  return c.json({
    success: true,
    data: {
      users: {
        total: totalUsers.count,
        new: newUsers.count,
      },
      conversations: {
        total: totalConversations.count,
        active: activeConversations.count,
      },
      messages: {
        total: totalMessages.count,
        today: messagesToday.count,
      },
      documents: {
        total: totalDocuments.count,
      },
      performance: {
        avgResponseTime,
      },
      timestamp: now.toISOString(),
    },
  });
});

/**
 * GET /api/v1/analytics/daily
 * Get daily metrics
 */
analytics.get('/daily', validateQuery(dailyMetricsSchema), async (c) => {
  const { days } = c.req.valid('query');

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - Number(days));
  fromDate.setHours(0, 0, 0, 0);

  // Daily user registrations
  const { results: userMetrics } = await c.env.DB.prepare(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM users
     WHERE created_at >= ?
     GROUP BY DATE(created_at)
     ORDER BY date ASC`
  ).bind(fromDate.toISOString()).all();

  // Daily conversations
  const { results: conversationMetrics } = await c.env.DB.prepare(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM conversations
     WHERE created_at >= ?
     GROUP BY DATE(created_at)
     ORDER BY date ASC`
  ).bind(fromDate.toISOString()).all();

  // Daily messages
  const { results: messageMetrics } = await c.env.DB.prepare(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM messages
     WHERE created_at >= ?
     GROUP BY DATE(created_at)
     ORDER BY date ASC`
  ).bind(fromDate.toISOString()).all();

  return c.json({
    success: true,
    data: {
      users: userMetrics,
      conversations: conversationMetrics,
      messages: messageMetrics,
      period: {
        days: Number(days),
        from: fromDate.toISOString(),
        to: new Date().toISOString(),
      },
    },
  });
});

/**
 * GET /api/v1/analytics/hourly
 * Get hourly metrics
 */
analytics.get('/hourly', validateQuery(hourlyMetricsSchema), async (c) => {
  const { hours } = c.req.valid('query');

  const fromDate = new Date();
  fromDate.setHours(fromDate.getHours() - Number(hours));

  // Hourly messages
  const { results: messageMetrics } = await c.env.DB.prepare(
    `SELECT
       strftime('%Y-%m-%d %H:00:00', created_at) as hour,
       COUNT(*) as count
     FROM messages
     WHERE created_at >= ?
     GROUP BY hour
     ORDER BY hour ASC`
  ).bind(fromDate.toISOString()).all();

  // Hourly conversations
  const { results: conversationMetrics } = await c.env.DB.prepare(
    `SELECT
       strftime('%Y-%m-%d %H:00:00', created_at) as hour,
       COUNT(*) as count
     FROM conversations
     WHERE created_at >= ?
     GROUP BY hour
     ORDER BY hour ASC`
  ).bind(fromDate.toISOString()).all();

  return c.json({
    success: true,
    data: {
      messages: messageMetrics,
      conversations: conversationMetrics,
      period: {
        hours: Number(hours),
        from: fromDate.toISOString(),
        to: new Date().toISOString(),
      },
    },
  });
});

/**
 * GET /api/v1/analytics/realtime
 * Get real-time statistics from Durable Objects
 */
analytics.get('/realtime', async (c) => {
  // TODO: Implement Durable Object integration for real-time stats
  // This will be implemented in Phase 09

  return c.json({
    success: true,
    data: {
      activeUsers: 0,
      requestsPerSecond: 0,
      averageLatency: 0,
      message: 'Real-time analytics via Durable Objects - Phase 09',
    },
  });
});

export default analytics;
