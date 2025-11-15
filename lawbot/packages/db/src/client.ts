/**
 * D1 Database Client Wrapper
 * Provides type-safe database operations with batching support
 */

import type { D1Database, D1Result } from '@cloudflare/workers-types';

export class D1Client {
  constructor(private db: D1Database) {}

  /**
   * Execute a single query with parameters
   */
  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    try {
      const stmt = params ? this.db.prepare(sql).bind(...params) : this.db.prepare(sql);
      const result = await stmt.all<T>();
      return result.results || [];
    } catch (error) {
      throw new Error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute a query and return first result
   */
  async queryFirst<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
    try {
      const stmt = params ? this.db.prepare(sql).bind(...params) : this.db.prepare(sql);
      const result = await stmt.first<T>();
      return result;
    } catch (error) {
      throw new Error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute a query and return raw result
   */
  async execute(sql: string, params?: unknown[]): Promise<D1Result> {
    try {
      const stmt = params ? this.db.prepare(sql).bind(...params) : this.db.prepare(sql);
      return await stmt.run();
    } catch (error) {
      throw new Error(
        `Execute failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Batch insert records (max 10,000 records per batch)
   * Automatically splits into multiple batches if needed
   */
  async batchInsert<T extends Record<string, unknown>>(
    table: string,
    records: T[],
    batchSize = 10000
  ): Promise<void> {
    if (records.length === 0) return;

    const batches = Math.ceil(records.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const batch = records.slice(i * batchSize, (i + 1) * batchSize);
      const statements: D1PreparedStatement[] = [];

      for (const record of batch) {
        const columns = Object.keys(record);
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
        const values = Object.values(record);
        statements.push(this.db.prepare(sql).bind(...values));
      }

      await this.db.batch(statements);
    }
  }

  /**
   * Archive old conversations (older than 30 days)
   * Moves conversations and their messages to archive tables
   */
  async archiveOldConversations(daysOld = 30): Promise<number> {
    const cutoffTimestamp = Math.floor(Date.now() / 1000) - daysOld * 24 * 60 * 60;

    // Get conversations to archive
    const conversationsToArchive = await this.query<{
      id: string;
      user_id: string;
      platform: string;
      created_at: number;
      updated_at: number;
      metadata: string;
    }>(
      `SELECT id, user_id, platform, created_at, updated_at, metadata
       FROM conversations
       WHERE updated_at < ? AND status = 'active'`,
      [cutoffTimestamp]
    );

    if (conversationsToArchive.length === 0) return 0;

    const statements: D1PreparedStatement[] = [];

    for (const conv of conversationsToArchive) {
      // Get all messages for this conversation
      const messages = await this.query(
        'SELECT * FROM messages WHERE conversation_id = ?',
        [conv.id]
      );

      // Create archive record with compressed data
      const archiveData = JSON.stringify({
        conversation: conv,
        messages: messages,
      });

      // Insert into archive
      statements.push(
        this.db
          .prepare(
            `INSERT INTO conversations_archive
             (id, user_id, platform, data, message_count, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            conv.id,
            conv.user_id,
            conv.platform,
            archiveData,
            messages.length,
            conv.created_at,
            conv.updated_at
          )
      );

      // Delete messages
      statements.push(
        this.db.prepare('DELETE FROM messages WHERE conversation_id = ?').bind(conv.id)
      );

      // Update conversation status
      statements.push(
        this.db
          .prepare("UPDATE conversations SET status = 'archived' WHERE id = ?")
          .bind(conv.id)
      );
    }

    await this.db.batch(statements);
    return conversationsToArchive.length;
  }

  /**
   * Get database instance (for direct access if needed)
   */
  getDB(): D1Database {
    return this.db;
  }
}

// Type for D1 prepared statement (from Cloudflare Workers types)
type D1PreparedStatement = ReturnType<D1Database['prepare']>;
