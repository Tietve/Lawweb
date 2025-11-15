/**
 * Context Builder - Assembles RAG context and conversation history
 */

import type { Context, Message } from '../types';
import type { SearchResult, SearchOptions } from '../rag/search';

export interface SemanticSearch {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}

export interface ConversationMemory {
  getHistory(conversationId: string, limit?: number): Promise<Message[]>;
}

export class ContextBuilder {
  constructor(
    private ragSearch: SemanticSearch,
    private memory: ConversationMemory
  ) {}

  /**
   * Build complete context for LLM generation
   */
  async buildContext(query: string, conversationId: string): Promise<Context> {
    try {
      // Parallel fetch of documents and history
      const [documents, history] = await Promise.all([
        this.fetchRelevantDocuments(query),
        this.fetchConversationHistory(conversationId),
      ]);

      return {
        query,
        documents,
        history,
        metadata: {
          conversationId,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error('Context building error:', error);
      // Return minimal context on error
      return {
        query,
        documents: [],
        history: [],
        metadata: {
          conversationId,
          timestamp: Date.now(),
        },
      };
    }
  }

  /**
   * Fetch relevant legal documents via RAG search
   */
  private async fetchRelevantDocuments(query: string) {
    try {
      const results = await this.ragSearch.search(query, {
        topK: 5,
        minConfidence: 0.70,
      });

      return results.map(result => ({
        content: result.text,
        source: result.metadata,
        confidence: result.score,
      }));
    } catch (error) {
      console.error('Document search error:', error);
      return [];
    }
  }

  /**
   * Fetch conversation history
   */
  private async fetchConversationHistory(conversationId: string) {
    try {
      const history = await this.memory.getHistory(conversationId, 10);
      return history.slice(-5); // Last 5 messages
    } catch (error) {
      console.error('History fetch error:', error);
      return [];
    }
  }

  /**
   * Format context for LLM prompt (debugging/logging)
   */
  formatForLLM(context: Context): string {
    let formatted = 'RELEVANT LEGAL DOCUMENTS:\n';

    if (context.documents.length === 0) {
      formatted += '(No relevant documents found)\n';
    } else {
      for (const doc of context.documents) {
        const lawCode = doc.source.law_code || 'N/A';
        const article = doc.source.article || 'N/A';
        const confidence = (doc.confidence * 100).toFixed(1);

        formatted += `\n[${lawCode} - Điều ${article}] (Confidence: ${confidence}%)\n`;
        formatted += `${doc.content.substring(0, 200)}...\n`;
      }
    }

    formatted += '\n\nCONVERSATION HISTORY:\n';

    if (context.history.length === 0) {
      formatted += '(No conversation history)\n';
    } else {
      for (const msg of context.history) {
        formatted += `${msg.role}: ${msg.content.substring(0, 100)}...\n`;
      }
    }

    formatted += '\n\nUSER QUERY:\n' + context.query;

    return formatted;
  }

  /**
   * Estimate token count (rough approximation)
   */
  estimateTokens(context: Context): number {
    let totalChars = 0;

    // Count document content
    for (const doc of context.documents) {
      totalChars += doc.content.length;
    }

    // Count history
    for (const msg of context.history) {
      totalChars += msg.content.length;
    }

    // Count query
    totalChars += context.query.length;

    // Rough estimate: 4 chars per token
    return Math.ceil(totalChars / 4);
  }

  /**
   * Trim context to fit token limit
   */
  trimContext(context: Context, maxTokens: number): Context {
    const currentTokens = this.estimateTokens(context);

    if (currentTokens <= maxTokens) {
      return context;
    }

    // Strategy: Remove oldest history first, then lowest confidence docs
    const trimmedHistory = context.history.slice(-3); // Keep only last 3
    const trimmedDocs = context.documents
      .sort((a, b) => b.confidence - a.confidence) // Sort by confidence desc
      .slice(0, 3); // Keep top 3

    return {
      ...context,
      history: trimmedHistory,
      documents: trimmedDocs,
    };
  }
}
