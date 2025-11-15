/**
 * Error handling utilities for API
 */

/**
 * Custom error classes
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public errors?: Record<string, string[]>) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Insufficient permissions') {
    super(403, message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Rate limit exceeded') {
    super(429, message, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * Error response formatter
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export function formatErrorResponse(error: Error | ApiError): ErrorResponse {
  const isApiError = error instanceof ApiError;

  return {
    success: false,
    error: {
      code: isApiError ? error.code || 'INTERNAL_ERROR' : 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error instanceof ValidationError ? error.errors : undefined,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get HTTP status code from error
 */
export function getStatusCode(error: Error | ApiError): number {
  if (error instanceof ApiError) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: Record<string, unknown>): void {
  console.error('[API Error]', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...context,
  });
}
