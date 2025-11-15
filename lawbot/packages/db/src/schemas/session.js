/**
 * Session schema and validation
 */
import { z } from 'zod';
// Session schema (database format)
export const SessionSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    platform: z.enum(['web', 'widget']),
    expires_at: z.number().int().positive(),
    created_at: z.number().int().positive(),
});
// Session insert schema
export const SessionInsertSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    platform: z.enum(['web', 'widget']),
    expires_at: z.number().int().positive(),
});
