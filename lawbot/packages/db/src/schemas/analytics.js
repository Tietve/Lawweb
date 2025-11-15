/**
 * Analytics schemas and validation
 */
import { z } from 'zod';
// Analytics daily schema
export const AnalyticsDailySchema = z.object({
    date: z.string(), // Format: YYYY-MM-DD
    total_users: z.number().int().nonnegative(),
    new_users: z.number().int().nonnegative(),
    active_users: z.number().int().nonnegative(),
    total_conversations: z.number().int().nonnegative(),
    total_messages: z.number().int().nonnegative(),
    avg_response_time_ms: z.number().int().nonnegative(),
    platform_breakdown: z.string().transform((str) => {
        try {
            return JSON.parse(str);
        }
        catch {
            return {};
        }
    }),
    top_categories: z.string().transform((str) => {
        try {
            return JSON.parse(str);
        }
        catch {
            return [];
        }
    }),
    error_count: z.number().int().nonnegative(),
    feedback_avg: z.number().nullable().optional(),
    created_at: z.number().int().positive(),
    updated_at: z.number().int().positive(),
});
// Analytics hourly schema
export const AnalyticsHourlySchema = z.object({
    datetime: z.string(), // Format: YYYY-MM-DD HH:00:00
    active_users: z.number().int().nonnegative(),
    conversations: z.number().int().nonnegative(),
    messages: z.number().int().nonnegative(),
    avg_response_time_ms: z.number().int().nonnegative(),
    errors: z.number().int().nonnegative(),
    platform_breakdown: z.string().transform((str) => {
        try {
            return JSON.parse(str);
        }
        catch {
            return {};
        }
    }),
    created_at: z.number().int().positive(),
});
// Analytics query schema
export const AnalyticsQuerySchema = z.object({
    id: z.string(),
    query: z.string(),
    category: z.string().nullable().optional(),
    results_count: z.number().int().nonnegative(),
    avg_relevance: z.number().nullable().optional(),
    platform: z.string(),
    created_at: z.number().int().positive(),
});
// Analytics document schema
export const AnalyticsDocumentSchema = z.object({
    date: z.string(),
    law_code: z.string(),
    article: z.string(),
    access_count: z.number().int().nonnegative(),
    relevance_avg: z.number().nullable().optional(),
    created_at: z.number().int().positive(),
    updated_at: z.number().int().positive(),
});
