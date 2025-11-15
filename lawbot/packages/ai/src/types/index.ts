/**
 * Type definitions for AI package
 */

// Message types
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

// Chat request and response types
export interface ChatRequest {
  query: string;
  conversationId: string;
  messages?: Message[];
  requiresHighAccuracy?: boolean;
  isSimpleQuery?: boolean;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage?: TokenUsage;
  conversationId: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// RAG context types
// Note: Using ChunkMetadata from RAG module for consistency
export interface DocumentContext {
  content: string;
  source: Record<string, any>; // Flexible to accommodate ChunkMetadata
  confidence: number;
}

export interface Context {
  query: string;
  documents: DocumentContext[];
  history: Message[];
  metadata: {
    conversationId: string;
    timestamp: number;
  };
}

// Model selection types
export type ModelType = 'claude' | 'openai' | 'workers';

export interface ModelConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  stream?: boolean;
}

// LLM interface
export interface LLMModel {
  generate(request: ChatRequest): Promise<Response>;
  buildMessages(request: ChatRequest, context?: Context): Message[];
}

// Note: SearchResult and SearchOptions are exported from ./rag/search.ts
// to avoid duplication and maintain consistency with RAG pipeline

// Environment bindings
export interface AIEnv {
  CLAUDE_API_KEY: string;
  OPENAI_API_KEY: string;
  AI: Ai;
  DB: D1Database;
  KV: KVNamespace;
  VECTORIZE: VectorizeIndex;
}
