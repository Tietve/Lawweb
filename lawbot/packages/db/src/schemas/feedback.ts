/**
 * Feedback schema and validation
 */

import { z } from 'zod';

// Feedback schema (database format)
export const FeedbackSchema = z.object({
  id: z.string(),
  message_id: z.string(),
  user_id: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable().optional(),
  created_at: z.number().int().positive(),
});

// Feedback insert schema
export const FeedbackInsertSchema = z.object({
  id: z.string(),
  message_id: z.string(),
  user_id: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable().optional(),
});

// TypeScript types
export type Feedback = z.infer<typeof FeedbackSchema>;
export type FeedbackInsert = z.infer<typeof FeedbackInsertSchema>;
