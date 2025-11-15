/**
 * @lawbot/db
 * Database schemas and utilities
 */

import { z } from 'zod';

export const version = '0.1.0';

// Database schema exports will be added in Phase 02
// Example schema:
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;
