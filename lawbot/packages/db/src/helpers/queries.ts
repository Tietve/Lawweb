/**
 * Query helper functions
 * Type-safe query builders for common database operations
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { User, Conversation, Message, LegalDocument } from '../schemas';

/**
 * User queries
 */
export const userQueries = {
  findById: async (db: D1Database, id: string): Promise<User | null> => {
    const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
    return result;
  },

  findByPhone: async (db: D1Database, phone: string, platform: string): Promise<User | null> => {
    const result = await db
      .prepare('SELECT * FROM users WHERE phone = ? AND platform = ?')
      .bind(phone, platform)
      .first<User>();
    return result;
  },

  findByEmail: async (db: D1Database, email: string, platform: string): Promise<User | null> => {
    const result = await db
      .prepare('SELECT * FROM users WHERE email = ? AND platform = ?')
      .bind(email, platform)
      .first<User>();
    return result;
  },

  updateLastActive: async (db: D1Database, id: string): Promise<void> => {
    await db
      .prepare('UPDATE users SET last_active = unixepoch() WHERE id = ?')
      .bind(id)
      .run();
  },
};

/**
 * Conversation queries
 */
export const conversationQueries = {
  findById: async (db: D1Database, id: string): Promise<Conversation | null> => {
    const result = await db
      .prepare('SELECT * FROM conversations WHERE id = ?')
      .bind(id)
      .first<Conversation>();
    return result;
  },

  findByUserId: async (
    db: D1Database,
    userId: string,
    limit = 10
  ): Promise<Conversation[]> => {
    const result = await db
      .prepare(
        `SELECT * FROM conversations
         WHERE user_id = ? AND status = 'active'
         ORDER BY updated_at DESC
         LIMIT ?`
      )
      .bind(userId, limit)
      .all<Conversation>();
    return result.results || [];
  },

  updateTimestamp: async (db: D1Database, id: string): Promise<void> => {
    await db
      .prepare('UPDATE conversations SET updated_at = unixepoch() WHERE id = ?')
      .bind(id)
      .run();
  },
};

/**
 * Message queries
 */
export const messageQueries = {
  findByConversationId: async (
    db: D1Database,
    conversationId: string,
    limit = 50
  ): Promise<Message[]> => {
    const result = await db
      .prepare(
        `SELECT * FROM messages
         WHERE conversation_id = ?
         ORDER BY created_at ASC
         LIMIT ?`
      )
      .bind(conversationId, limit)
      .all<Message>();
    return result.results || [];
  },

  findLatest: async (db: D1Database, conversationId: string, count = 10): Promise<Message[]> => {
    const result = await db
      .prepare(
        `SELECT * FROM messages
         WHERE conversation_id = ?
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .bind(conversationId, count)
      .all<Message>();
    return (result.results || []).reverse(); // Reverse to get chronological order
  },
};

/**
 * Legal document queries
 */
export const legalDocumentQueries = {
  findById: async (db: D1Database, id: string): Promise<LegalDocument | null> => {
    const result = await db
      .prepare('SELECT * FROM legal_documents WHERE id = ?')
      .bind(id)
      .first<LegalDocument>();
    return result;
  },

  findByLawCode: async (
    db: D1Database,
    lawCode: string,
    limit = 100
  ): Promise<LegalDocument[]> => {
    const result = await db
      .prepare('SELECT * FROM legal_documents WHERE law_code = ? LIMIT ?')
      .bind(lawCode, limit)
      .all<LegalDocument>();
    return result.results || [];
  },

  findByCategory: async (
    db: D1Database,
    category: string,
    limit = 100
  ): Promise<LegalDocument[]> => {
    const result = await db
      .prepare('SELECT * FROM legal_documents WHERE category = ? LIMIT ?')
      .bind(category, limit)
      .all<LegalDocument>();
    return result.results || [];
  },

  search: async (db: D1Database, query: string, limit = 20): Promise<LegalDocument[]> => {
    // Full-text search using FTS5
    const result = await db
      .prepare(
        `SELECT ld.*
         FROM legal_documents ld
         JOIN legal_documents_fts fts ON ld.rowid = fts.rowid
         WHERE legal_documents_fts MATCH ?
         ORDER BY rank
         LIMIT ?`
      )
      .bind(query, limit)
      .all<LegalDocument>();
    return result.results || [];
  },
};

/**
 * Analytics queries
 */
export const analyticsQueries = {
  recordQuery: async (
    db: D1Database,
    id: string,
    query: string,
    platform: string,
    resultsCount: number,
    avgRelevance?: number
  ): Promise<void> => {
    await db
      .prepare(
        `INSERT INTO analytics_queries
         (id, query, results_count, avg_relevance, platform)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(id, query, resultsCount, avgRelevance ?? null, platform)
      .run();
  },

  recordDocumentAccess: async (
    db: D1Database,
    lawCode: string,
    article: string,
    relevance: number
  ): Promise<void> => {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    await db
      .prepare(
        `INSERT INTO analytics_documents
         (date, law_code, article, access_count, relevance_avg)
         VALUES (?, ?, ?, 1, ?)
         ON CONFLICT(date, law_code, article) DO UPDATE SET
           access_count = access_count + 1,
           relevance_avg = ((relevance_avg * access_count) + ?) / (access_count + 1),
           updated_at = unixepoch()`
      )
      .bind(date, lawCode, article, relevance, relevance)
      .run();
  },
};
