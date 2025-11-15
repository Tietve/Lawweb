/**
 * Shared TypeScript type definitions for WebSocket worker and Durable Objects
 */

/**
 * API Response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

export interface BroadcastResponse {
  success: boolean;
  sent: number;
  total: number;
}

export interface WorkloadResponse {
  workload: Array<{
    agentId: string;
    activeChats: number;
  }>;
  totalActive: number;
}

/**
 * Environment bindings interface
 */
export interface Env {
  // Durable Object namespaces
  NOTIFICATION_HUB: DurableObjectNamespace;
  ANALYTICS_AGGREGATOR: DurableObjectNamespace;
  PRESENCE_TRACKER: DurableObjectNamespace;
  CHAT_ORCHESTRATOR: DurableObjectNamespace;

  // Optional D1 database
  DB?: D1Database;

  // Environment variables
  ENVIRONMENT: string;
}
