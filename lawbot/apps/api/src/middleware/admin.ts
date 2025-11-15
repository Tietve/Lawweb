/**
 * Admin authorization middleware
 */
import { createMiddleware } from 'hono/factory';
import { AuthorizationError } from '../utils/errors';
import type { HonoContext } from '../types';

/**
 * Require admin role
 * Must be used after authMiddleware
 */
export const requireAdmin = createMiddleware<HonoContext>(async (c, next) => {
  const user = c.get('user');

  if (!user) {
    throw new AuthorizationError('Authentication required');
  }

  if (user.role !== 'admin') {
    throw new AuthorizationError('Admin access required');
  }

  await next();
});
