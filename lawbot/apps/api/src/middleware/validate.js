/**
 * Validation middleware using Zod
 */
import { zValidator } from '@hono/zod-validator';
import { ValidationError } from '../utils/errors';
/**
 * Validate request body with Zod schema
 */
export function validateBody(schema) {
    return zValidator('json', schema, (result) => {
        if (!result.success) {
            const errors = {};
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
export function validateQuery(schema) {
    return zValidator('query', schema, (result) => {
        if (!result.success) {
            const errors = {};
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
export function validateParams(schema) {
    return zValidator('param', schema, (result) => {
        if (!result.success) {
            const errors = {};
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
