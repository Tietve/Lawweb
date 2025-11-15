/**
 * Conversation schema and validation
 */

import { z } from 'zod';
import { PlatformSchema } from './user';

// Conversation status enum
export const ConversationStatusSchema = z.enum(['active', 'archived', 'deleted']);
export type ConversationStatus = z.infer<typeof ConversationStatusSchema>;

// Conversation metadata schema
export const ConversationMetadataSchema = z
  .object({
    topic: z.string().optional(),
    tags: z.array(z.string()).optional(),
    summary: z.string().optional(),
    category: z.string().optional(),
  })
  .passthrough();

// Conversation schema (database format)
export const ConversationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  platform: PlatformSchema,
  status: ConversationStatusSchema,
  created_at: z.number().int().positive(),
  updated_at: z.number().int().positive(),
  metadata: z.string().transform((str) => {
    try {
      return JSON.parse(str);
    } catch {
      return {};
    }
  }),
});

// Conversation insert schema
export const ConversationInsertSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  platform: PlatformSchema,
  status: ConversationStatusSchema.default('active'),
  metadata: ConversationMetadataSchema.optional().default({}),
});

// Conversation update schema
export const ConversationUpdateSchema = ConversationInsertSchema.partial().omit({
  id: true,
  user_id: true,
});

// TypeScript types
export type Conversation = z.infer<typeof ConversationSchema>;
export type ConversationInsert = z.infer<typeof ConversationInsertSchema>;
export type ConversationUpdate = z.infer<typeof ConversationUpdateSchema>;
export type ConversationMetadata = z.infer<typeof ConversationMetadataSchema>;
