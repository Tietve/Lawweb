/**
 * User schema and validation
 */

import { z } from 'zod';

// Platform enum
export const PlatformSchema = z.enum(['zalo', 'messenger', 'web', 'widget']);
export type Platform = z.infer<typeof PlatformSchema>;

// Vietnamese phone number validation (10 digits starting with 0, or with +84)
const vietnamesePhoneRegex = /^(\+84|0)(3|5|7|8|9)[0-9]{8}$/;

export const PhoneNumberSchema = z
  .string()
  .regex(vietnamesePhoneRegex, 'Invalid Vietnamese phone number format');

// User metadata schema
export const UserMetadataSchema = z
  .object({
    preferences: z
      .object({
        language: z.enum(['vi', 'en']).optional(),
        notifications: z.boolean().optional(),
      })
      .optional(),
    settings: z.record(z.unknown()).optional(),
    test: z.boolean().optional(),
  })
  .passthrough(); // Allow additional properties

// User schema (database format)
export const UserSchema = z.object({
  id: z.string(),
  phone: PhoneNumberSchema.nullable().optional(),
  email: z.string().email().nullable().optional(),
  name: z.string().min(1, 'Name is required'),
  platform: PlatformSchema,
  created_at: z.number().int().positive(),
  last_active: z.number().int().positive(),
  metadata: z.string().transform((str) => {
    try {
      return JSON.parse(str);
    } catch {
      return {};
    }
  }),
});

// User insert schema (for creating new users)
export const UserInsertSchema = z.object({
  id: z.string(),
  phone: PhoneNumberSchema.nullable().optional(),
  email: z.string().email().nullable().optional(),
  name: z.string().min(1, 'Name is required'),
  platform: PlatformSchema,
  metadata: UserMetadataSchema.optional().default({}),
});

// User update schema (partial)
export const UserUpdateSchema = UserInsertSchema.partial().omit({ id: true });

// TypeScript types
export type User = z.infer<typeof UserSchema>;
export type UserInsert = z.infer<typeof UserInsertSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UserMetadata = z.infer<typeof UserMetadataSchema>;
