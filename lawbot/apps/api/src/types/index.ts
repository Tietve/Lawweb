/**
 * Type definitions for API
 */

/**
 * User context set by auth middleware
 */
export interface UserContext {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

/**
 * Custom context variables
 */
export interface ContextVariables {
  user: UserContext;
  requestId: string;
}

/**
 * Environment bindings
 */
export interface Bindings {
  DB: D1Database;
  VECTORIZE: Vectorize;
  UPLOADS: R2Bucket;
  RATE_LIMIT: KVNamespace;
  CHATBOT: Fetcher;
  WEBHOOK_QUEUE: Queue;
  ANALYTICS: DurableObjectNamespace;
  JWT_SECRET: string;
  CLAUDE_API_KEY: string;
  ZALO_APP_SECRET: string;
  FB_APP_SECRET: string;
  FB_VERIFY_TOKEN: string;
  CORS_ORIGIN: string;
  ENVIRONMENT: string;
}

/**
 * Hono context with custom types
 */
export type HonoContext = {
  Bindings: Bindings;
  Variables: ContextVariables;
};
