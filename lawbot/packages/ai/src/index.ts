/**
 * @lawbot/ai
 * AI and RAG utilities - Phase 03-04 Implementation
 */

import type { ChatRequest, AIEnv } from './types';
import { ModelRouter } from './llm/router';
import { ContextBuilder, type SemanticSearch } from './context/builder';
import { ConversationMemory } from './memory/manager';
import { StreamHandler } from './stream/handler';

export const version = '0.4.0';

// Export all types
export * from './types';

// Export RAG Pipeline (Phase 03)
export * from './rag';

// Export individual components
export { ClaudeModel } from './llm/claude';
export { OpenAIModel } from './llm/openai';
export { WorkersAIModel } from './llm/workers';
export { ModelRouter } from './llm/router';
export { ContextBuilder } from './context/builder';
export { ConversationMemory } from './memory/manager';
export { StreamHandler } from './stream/handler';

/**
 * Main AI Orchestrator
 * Combines all AI components for end-to-end chat processing
 */
export class AI {
  private router: ModelRouter;
  private contextBuilder: ContextBuilder;
  private memory: ConversationMemory;
  private streamHandler: StreamHandler;

  constructor(
    env: AIEnv,
    ragSearch: SemanticSearch
  ) {
    // Initialize router with available models
    this.router = new ModelRouter({
      claudeApiKey: env.CLAUDE_API_KEY,
      openaiApiKey: env.OPENAI_API_KEY,
      workersAI: env.AI,
      defaultModel: 'claude',
      enableFallback: true,
    });

    // Initialize context builder
    this.memory = new ConversationMemory(env.DB, env.KV);
    this.contextBuilder = new ContextBuilder(ragSearch, this.memory);

    // Initialize stream handler
    this.streamHandler = new StreamHandler();
  }

  /**
   * Process chat request with streaming response
   */
  async chat(request: ChatRequest): Promise<Response> {
    try {
      // Build context from RAG + conversation history
      const context = await this.contextBuilder.buildContext(
        request.query,
        request.conversationId
      );

      // Save user message
      await this.memory.saveMessage(request.conversationId, {
        role: 'user',
        content: request.query,
        timestamp: Date.now(),
      });

      // Get LLM response with routing and fallback
      const llmResponse = await this.router.routeWithFallback(
        {
          ...request,
          stream: request.stream ?? true,
        },
        context
      );

      // Create streaming response to client
      return await this.streamHandler.createStreamResponse(
        llmResponse,
        async (fullText) => {
          // Save assistant response when complete
          await this.memory.saveMessage(request.conversationId, {
            role: 'assistant',
            content: fullText,
            timestamp: Date.now(),
          });
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(conversationId: string, limit?: number) {
    return this.memory.getHistory(conversationId, limit);
  }

  /**
   * Clear conversation history
   */
  async clearHistory(conversationId: string) {
    return this.memory.clearHistory(conversationId);
  }

  /**
   * Get conversation message count
   */
  async getMessageCount(conversationId: string) {
    return this.memory.getMessageCount(conversationId);
  }
}

/**
 * Create AI instance with environment bindings
 */
export function createAI(env: AIEnv, ragSearch: SemanticSearch): AI {
  return new AI(env, ragSearch);
}
