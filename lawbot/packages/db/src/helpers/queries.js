/**
 * Query helper functions
 * Type-safe query builders for common database operations
 */
/**
 * User queries
 */
export const userQueries = {
    findById: async (db, id) => {
        const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
        return result;
    },
    findByPhone: async (db, phone, platform) => {
        const result = await db
            .prepare('SELECT * FROM users WHERE phone = ? AND platform = ?')
            .bind(phone, platform)
            .first();
        return result;
    },
    findByEmail: async (db, email, platform) => {
        const result = await db
            .prepare('SELECT * FROM users WHERE email = ? AND platform = ?')
            .bind(email, platform)
            .first();
        return result;
    },
    updateLastActive: async (db, id) => {
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
    findById: async (db, id) => {
        const result = await db
            .prepare('SELECT * FROM conversations WHERE id = ?')
            .bind(id)
            .first();
        return result;
    },
    findByUserId: async (db, userId, limit = 10) => {
        const result = await db
            .prepare(`SELECT * FROM conversations
         WHERE user_id = ? AND status = 'active'
         ORDER BY updated_at DESC
         LIMIT ?`)
            .bind(userId, limit)
            .all();
        return result.results || [];
    },
    updateTimestamp: async (db, id) => {
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
    findByConversationId: async (db, conversationId, limit = 50) => {
        const result = await db
            .prepare(`SELECT * FROM messages
         WHERE conversation_id = ?
         ORDER BY created_at ASC
         LIMIT ?`)
            .bind(conversationId, limit)
            .all();
        return result.results || [];
    },
    findLatest: async (db, conversationId, count = 10) => {
        const result = await db
            .prepare(`SELECT * FROM messages
         WHERE conversation_id = ?
         ORDER BY created_at DESC
         LIMIT ?`)
            .bind(conversationId, count)
            .all();
        return (result.results || []).reverse(); // Reverse to get chronological order
    },
};
/**
 * Legal document queries
 */
export const legalDocumentQueries = {
    findById: async (db, id) => {
        const result = await db
            .prepare('SELECT * FROM legal_documents WHERE id = ?')
            .bind(id)
            .first();
        return result;
    },
    findByLawCode: async (db, lawCode, limit = 100) => {
        const result = await db
            .prepare('SELECT * FROM legal_documents WHERE law_code = ? LIMIT ?')
            .bind(lawCode, limit)
            .all();
        return result.results || [];
    },
    findByCategory: async (db, category, limit = 100) => {
        const result = await db
            .prepare('SELECT * FROM legal_documents WHERE category = ? LIMIT ?')
            .bind(category, limit)
            .all();
        return result.results || [];
    },
    search: async (db, query, limit = 20) => {
        // Full-text search using FTS5
        const result = await db
            .prepare(`SELECT ld.*
         FROM legal_documents ld
         JOIN legal_documents_fts fts ON ld.rowid = fts.rowid
         WHERE legal_documents_fts MATCH ?
         ORDER BY rank
         LIMIT ?`)
            .bind(query, limit)
            .all();
        return result.results || [];
    },
};
/**
 * Analytics queries
 */
export const analyticsQueries = {
    recordQuery: async (db, id, query, platform, resultsCount, avgRelevance) => {
        await db
            .prepare(`INSERT INTO analytics_queries
         (id, query, results_count, avg_relevance, platform)
         VALUES (?, ?, ?, ?, ?)`)
            .bind(id, query, resultsCount, avgRelevance ?? null, platform)
            .run();
    },
    recordDocumentAccess: async (db, lawCode, article, relevance) => {
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        await db
            .prepare(`INSERT INTO analytics_documents
         (date, law_code, article, access_count, relevance_avg)
         VALUES (?, ?, ?, 1, ?)
         ON CONFLICT(date, law_code, article) DO UPDATE SET
           access_count = access_count + 1,
           relevance_avg = ((relevance_avg * access_count) + ?) / (access_count + 1),
           updated_at = unixepoch()`)
            .bind(date, lawCode, article, relevance, relevance)
            .run();
    },
};
