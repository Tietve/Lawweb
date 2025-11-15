/**
 * Message schema and validation
 */
import { z } from 'zod';
// Message role enum
export const MessageRoleSchema = z.enum(['user', 'assistant', 'system']);
// Source schema (legal document reference)
export const MessageSourceSchema = z.object({
    law_code: z.string(),
    article: z.string(),
    relevance: z.number().min(0).max(1),
    title: z.string().optional(),
});
// Message schema (database format)
export const MessageSchema = z.object({
    id: z.string(),
    conversation_id: z.string(),
    role: MessageRoleSchema,
    content: z.string().min(1, 'Content is required'),
    embeddings_id: z.string().nullable().optional(),
    sources: z
        .string()
        .nullable()
        .transform((str) => {
        if (!str)
            return null;
        try {
            return JSON.parse(str);
        }
        catch {
            return null;
        }
    }),
    created_at: z.number().int().positive(),
});
// Message insert schema
export const MessageInsertSchema = z.object({
    id: z.string(),
    conversation_id: z.string(),
    role: MessageRoleSchema,
    content: z.string().min(1, 'Content is required'),
    embeddings_id: z.string().nullable().optional(),
    sources: z.array(MessageSourceSchema).nullable().optional(),
});
// Message update schema
export const MessageUpdateSchema = MessageInsertSchema.partial().omit({
    id: true,
    conversation_id: true,
});
