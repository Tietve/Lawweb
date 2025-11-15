/**
 * Legal document schema and validation
 */

import { z } from 'zod';

// Legal document category enum
export const LegalCategorySchema = z.enum([
  'Hình sự',
  'Dân sự',
  'Lao động',
  'Hành chính',
  'Kinh tế',
  'Hôn nhân và gia đình',
  'Đất đai',
  'Thuế',
  'Khác',
]);

export type LegalCategory = z.infer<typeof LegalCategorySchema>;

// Legal document schema (database format)
export const LegalDocumentSchema = z.object({
  id: z.string(),
  law_code: z.string(),
  article: z.string(),
  title: z.string().min(1, 'Title is required'),
  category: LegalCategorySchema,
  content: z.string().min(1, 'Content is required'),
  effective_date: z.number().int().positive().nullable().optional(),
  vector_ids: z
    .string()
    .nullable()
    .transform((str) => {
      if (!str) return null;
      try {
        return JSON.parse(str);
      } catch {
        return null;
      }
    }),
  created_at: z.number().int().positive(),
  updated_at: z.number().int().positive(),
});

// Legal document insert schema
export const LegalDocumentInsertSchema = z.object({
  id: z.string(),
  law_code: z.string(),
  article: z.string(),
  title: z.string().min(1, 'Title is required'),
  category: LegalCategorySchema,
  content: z.string().min(1, 'Content is required'),
  effective_date: z.number().int().positive().nullable().optional(),
  vector_ids: z.array(z.string()).nullable().optional(),
});

// Legal document update schema
export const LegalDocumentUpdateSchema = LegalDocumentInsertSchema.partial().omit({
  id: true,
});

// TypeScript types
export type LegalDocument = z.infer<typeof LegalDocumentSchema>;
export type LegalDocumentInsert = z.infer<typeof LegalDocumentInsertSchema>;
export type LegalDocumentUpdate = z.infer<typeof LegalDocumentUpdateSchema>;
