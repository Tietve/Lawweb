/**
 * Validation middleware using Zod
 */
import { zValidator } from '@hono/zod-validator';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Validate request body with Zod schema
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return zValidator('json', schema, (result) => {
    if (!result.success) {
      const errors: Record<string, string[]> = {};

      if ('error' in result) {
        result.error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
      }

      throw new ValidationError('Validation failed', errors);
    }
  });
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return zValidator('query', schema, (result) => {
    if (!result.success) {
      const errors: Record<string, string[]> = {};

      if ('error' in result) {
        result.error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
      }

      throw new ValidationError('Validation failed', errors);
    }
  });
}

/**
 * Validate path parameters with Zod schema
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return zValidator('param', schema, (result) => {
    if (!result.success) {
      const errors: Record<string, string[]> = {};

      if ('error' in result) {
        result.error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
      }

      throw new ValidationError('Validation failed', errors);
    }
  });
}
