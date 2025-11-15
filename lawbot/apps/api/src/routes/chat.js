/**
 * Chat routes
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { rateLimitByUser } from '../middleware/ratelimit';
import { NotFoundError } from '../utils/errors';
import { generateId } from '@lawbot/shared';
const chat = new Hono();
// All chat routes require authentication
chat.use('*', authMiddleware);
// Rate limiting: 50 requests per minute per user
const chatRateLimit = rateLimitByUser({ windowMs: 60000, max: 50 });
// Validation schemas
const createConversationSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    metadata: z.record(z.unknown()).optional(),
});
const sendMessageSchema = z.object({
    content: z.string().min(1).max(5000),
    metadata: z.record(z.unknown()).optional(),
});
const listConversationsSchema = z.object({
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('20'),
    offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional().default('0'),
});
const listMessagesSchema = z.object({
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('50'),
    offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional().default('0'),
});
const conversationIdSchema = z.object({
    id: z.string().min(1),
});
/**
 * POST /api/v1/chat/conversations
 * Create new conversation
 */
chat.post('/conversations', chatRateLimit, validateBody(createConversationSchema), async (c) => {
    const user = c.get('user');
    const { title, metadata } = c.req.valid('json');
    const conversationId = generateId();
    const now = new Date().toISOString();
    await c.env.DB.prepare(`INSERT INTO conversations (id, user_id, title, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`).bind(conversationId, user.id, title || 'New conversation', metadata ? JSON.stringify(metadata) : null, now, now).run();
    return c.json({
        success: true,
        data: {
            conversation: {
                id: conversationId,
                title: title || 'New conversation',
                createdAt: now,
                updatedAt: now,
            },
        },
    }, 201);
});
/**
 * GET /api/v1/chat/conversations
 * List user conversations
 */
chat.get('/conversations', validateQuery(listConversationsSchema), async (c) => {
    const user = c.get('user');
    const { limit, offset } = c.req.valid('query');
    const { results } = await c.env.DB.prepare(`SELECT id, title, created_at, updated_at
     FROM conversations
     WHERE user_id = ?
     ORDER BY updated_at DESC
     LIMIT ? OFFSET ?`).bind(user.id, limit, offset).all();
    // Get total count
    const countResult = await c.env.DB.prepare('SELECT COUNT(*) as total FROM conversations WHERE user_id = ?').bind(user.id).first();
    return c.json({
        success: true,
        data: {
            conversations: results,
            pagination: {
                total: countResult.total,
                limit: Number(limit),
                offset: Number(offset),
            },
        },
    });
});
/**
 * GET /api/v1/chat/conversations/:id
 * Get conversation details
 */
chat.get('/conversations/:id', validateParams(conversationIdSchema), async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const conversation = await c.env.DB.prepare(`SELECT id, title, metadata, created_at, updated_at
     FROM conversations
     WHERE id = ? AND user_id = ?`).bind(id, user.id).first();
    if (!conversation) {
        throw new NotFoundError('Conversation');
    }
    return c.json({
        success: true,
        data: { conversation },
    });
});
/**
 * POST /api/v1/chat/conversations/:id/messages
 * Send message in conversation
 */
chat.post('/conversations/:id/messages', chatRateLimit, validateParams(conversationIdSchema), validateBody(sendMessageSchema), async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const { content, metadata } = c.req.valid('json');
    // Verify conversation exists and belongs to user
    const conversation = await c.env.DB.prepare('SELECT id FROM conversations WHERE id = ? AND user_id = ?').bind(id, user.id).first();
    if (!conversation) {
        throw new NotFoundError('Conversation');
    }
    // Save user message
    const messageId = generateId();
    const now = new Date().toISOString();
    await c.env.DB.prepare(`INSERT INTO messages (id, conversation_id, role, content, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`).bind(messageId, id, 'user', content, metadata ? JSON.stringify(metadata) : null, now).run();
    // Forward to chatbot worker for processing
    const response = await c.env.CHATBOT.fetch('http://chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            conversationId: id,
            messageId,
            content,
        }),
    });
    const data = await response.json();
    // Update conversation timestamp
    await c.env.DB.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').bind(now, id).run();
    return c.json({
        success: true,
        data: {
            userMessage: { id: messageId, role: 'user', content, createdAt: now },
            assistantMessage: {
                id: data.assistantMessageId,
                role: 'assistant',
                content: data.content,
                createdAt: now,
            },
        },
    });
});
/**
 * GET /api/v1/chat/conversations/:id/messages
 * Get message history
 */
chat.get('/conversations/:id/messages', validateParams(conversationIdSchema), validateQuery(listMessagesSchema), async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const { limit, offset } = c.req.valid('query');
    // Verify conversation belongs to user
    const conversation = await c.env.DB.prepare('SELECT id FROM conversations WHERE id = ? AND user_id = ?').bind(id, user.id).first();
    if (!conversation) {
        throw new NotFoundError('Conversation');
    }
    // Get messages
    const { results } = await c.env.DB.prepare(`SELECT id, role, content, metadata, created_at
       FROM messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC
       LIMIT ? OFFSET ?`).bind(id, limit, offset).all();
    // Get total count
    const countResult = await c.env.DB.prepare('SELECT COUNT(*) as total FROM messages WHERE conversation_id = ?').bind(id).first();
    return c.json({
        success: true,
        data: {
            messages: results,
            pagination: {
                total: countResult.total,
                limit: Number(limit),
                offset: Number(offset),
            },
        },
    });
});
export default chat;
