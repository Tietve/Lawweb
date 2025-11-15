/**
 * Search routes
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { validateQuery, validateBody } from '../middleware/validate';
import { optionalAuthMiddleware } from '../middleware/auth';
import { rateLimitByIp } from '../middleware/ratelimit';
const search = new Hono();
// Optional auth - logged in users get personalized results
search.use('*', optionalAuthMiddleware);
// Rate limiting: 100 requests per minute
const searchRateLimit = rateLimitByIp({ windowMs: 60000, max: 100 });
// Validation schemas
const documentSearchSchema = z.object({
    query: z.string().min(1).max(500),
    category: z.string().optional(),
    lawCode: z.string().optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('20'),
    offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional().default('0'),
});
const semanticSearchSchema = z.object({
    query: z.string().min(1).max(1000),
    topK: z.number().int().min(1).max(10).optional().default(5),
    threshold: z.number().min(0).max(1).optional().default(0.7),
    filters: z.object({
        category: z.string().optional(),
        lawCode: z.string().optional(),
    }).optional(),
});
const categoriesSchema = z.object({
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('50'),
});
/**
 * GET /api/v1/search/documents
 * Search legal documents with filters
 */
search.get('/documents', searchRateLimit, validateQuery(documentSearchSchema), async (c) => {
    const { query, category, lawCode, fromDate, toDate, limit, offset } = c.req.valid('query');
    // Build SQL query
    let sql = `
    SELECT d.id, d.title, d.law_code, d.category, d.issued_date, d.content_preview
    FROM documents d
    WHERE 1=1
  `;
    const params = [];
    // Full-text search on title and content
    if (query) {
        sql += ` AND (d.title LIKE ? OR d.content LIKE ?)`;
        params.push(`%${query}%`, `%${query}%`);
    }
    // Category filter
    if (category) {
        sql += ` AND d.category = ?`;
        params.push(category);
    }
    // Law code filter
    if (lawCode) {
        sql += ` AND d.law_code = ?`;
        params.push(lawCode);
    }
    // Date range filter
    if (fromDate) {
        sql += ` AND d.issued_date >= ?`;
        params.push(fromDate);
    }
    if (toDate) {
        sql += ` AND d.issued_date <= ?`;
        params.push(toDate);
    }
    sql += ` ORDER BY d.issued_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    // Execute query
    const { results } = await c.env.DB.prepare(sql).bind(...params).all();
    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM documents d WHERE 1=1';
    const countParams = [];
    if (query) {
        countSql += ` AND (d.title LIKE ? OR d.content LIKE ?)`;
        countParams.push(`%${query}%`, `%${query}%`);
    }
    if (category) {
        countSql += ` AND d.category = ?`;
        countParams.push(category);
    }
    if (lawCode) {
        countSql += ` AND d.law_code = ?`;
        countParams.push(lawCode);
    }
    if (fromDate) {
        countSql += ` AND d.issued_date >= ?`;
        countParams.push(fromDate);
    }
    if (toDate) {
        countSql += ` AND d.issued_date <= ?`;
        countParams.push(toDate);
    }
    const countResult = await c.env.DB.prepare(countSql).bind(...countParams).first();
    return c.json({
        success: true,
        data: {
            documents: results,
            pagination: {
                total: countResult.total,
                limit: Number(limit),
                offset: Number(offset),
            },
        },
    });
});
/**
 * POST /api/v1/search/semantic
 * Semantic search using RAG
 */
search.post('/semantic', searchRateLimit, validateBody(semanticSearchSchema), async (c) => {
    const { query, topK, threshold, filters } = c.req.valid('json');
    // TODO: Generate embedding for query using AI service
    // For now, we'll use a placeholder
    const queryEmbedding = new Array(1024).fill(0);
    // Search in Vectorize
    const vectorResults = await c.env.VECTORIZE.query(queryEmbedding, {
        topK,
        returnValues: true,
        returnMetadata: true,
    });
    // Filter by threshold
    const relevantResults = vectorResults.matches.filter((match) => match.score >= threshold);
    // Fetch full document details
    const documentIds = relevantResults.map((match) => match.id);
    if (documentIds.length === 0) {
        return c.json({
            success: true,
            data: {
                results: [],
                query,
            },
        });
    }
    // Build SQL to fetch documents
    let sql = `
    SELECT id, title, law_code, category, issued_date, content_preview
    FROM documents
    WHERE id IN (${documentIds.map(() => '?').join(',')})
  `;
    const params = [...documentIds];
    // Apply additional filters
    if (filters?.category) {
        sql += ` AND category = ?`;
        params.push(filters.category);
    }
    if (filters?.lawCode) {
        sql += ` AND law_code = ?`;
        params.push(filters.lawCode);
    }
    const { results } = await c.env.DB.prepare(sql).bind(...params).all();
    // Merge with vector scores
    const resultsWithScores = results.map((doc) => {
        const docRecord = doc;
        const match = relevantResults.find((m) => m.id === docRecord.id);
        return {
            ...docRecord,
            relevanceScore: match?.score || 0,
        };
    });
    // Sort by relevance
    resultsWithScores.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return c.json({
        success: true,
        data: {
            results: resultsWithScores,
            query,
        },
    });
});
/**
 * GET /api/v1/search/categories
 * Get available legal categories
 */
search.get('/categories', validateQuery(categoriesSchema), async (c) => {
    const { limit } = c.req.valid('query');
    const { results } = await c.env.DB.prepare(`SELECT DISTINCT category, COUNT(*) as count
     FROM documents
     GROUP BY category
     ORDER BY count DESC
     LIMIT ?`).bind(limit).all();
    return c.json({
        success: true,
        data: { categories: results },
    });
});
export default search;
