/**
 * Workers AI integration for Vietnamese legal queries
 * Uses SEA-LION model for Vietnamese language support
 */

import type { ChatRequest, Message, Context, LLMModel } from '../types';

export class WorkersAIModel implements LLMModel {
  private readonly config = {
    chatModel: '@cf/aisingapore/gemma-sea-lion-v4-27b-it',
    embeddingModel: '@cf/baai/bge-m3',
    maxTokens: 2048,
    temperature: 0.3,
  };

  constructor(private ai: Ai) {
    if (!ai) {
      throw new Error('Workers AI binding is required');
    }
  }

  /**
   * Generate streaming response from Workers AI
   */
  async generate(request: ChatRequest): Promise<Response> {
    const messages = this.buildMessages(request);

    try {
      // @ts-ignore - SEA-LION model may not be in types yet
      const response = await this.ai.run(this.config.chatModel, {
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: request.stream ?? true,
      });

      // Workers AI returns a ReadableStream
      return new Response(response as ReadableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (error) {
      console.error('Workers AI error:', error);
      throw error;
    }
  }

  /**
   * Build messages array with system prompt and context
   */
  buildMessages(request: ChatRequest, context?: Context): Message[] {
    const messages: Message[] = [];

    // Add system message
    messages.push({
      role: 'system',
      content: this.buildSystemPrompt(context),
    });

    // Add conversation history if available
    if (context?.history && context.history.length > 0) {
      messages.push(...context.history.slice(-3)); // Last 3 for Workers AI
    }

    // Add current query with RAG context
    messages.push({
      role: 'user',
      content: this.buildUserMessage(request.query, context),
    });

    return messages;
  }

  /**
   * Build system prompt optimized for SEA-LION model
   */
  private buildSystemPrompt(context?: Context): string {
    return `Bạn là trợ lý pháp lý AI về luật Việt Nam.

QUY TẮC:
1. Dựa vào văn bản pháp luật được cung cấp
2. Trích dẫn: [Tên luật - Điều X]
3. Giải thích rõ ràng, dễ hiểu
4. Khuyên tham khảo luật sư nếu cần

${context?.documents && context.documents.length > 0 ? 'Văn bản pháp luật trong tin nhắn người dùng.' : ''}`;
  }

  /**
   * Build user message with RAG context (shorter for Workers AI)
   */
  private buildUserMessage(query: string, context?: Context): string {
    if (!context?.documents || context.documents.length === 0) {
      return query;
    }

    let message = 'VĂN BẢN LIÊN QUAN:\n\n';

    // Limit to top 3 documents for Workers AI
    const topDocs = context.documents.slice(0, 3);

    for (const doc of topDocs) {
      const lawCode = doc.source.law_code || 'N/A';
      const article = doc.source.article || 'N/A';

      message += `[${lawCode} - Điều ${article}]\n${doc.content}\n\n`;
    }

    message += `CÂU HỎI: ${query}`;

    return message;
  }

  /**
   * Generate embeddings for text using Workers AI
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      // @ts-ignore - Embedding model may not be in types yet
      const response = await this.ai.run(this.config.embeddingModel, {
        text: [text],
      });

      // @ts-ignore - Workers AI types may not be fully accurate
      return response.data?.[0] || [];
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    try {
      // @ts-ignore - Embedding model may not be in types yet
      const response = await this.ai.run(this.config.embeddingModel, {
        text: texts,
      });

      // @ts-ignore
      return response.data || [];
    } catch (error) {
      console.error('Batch embedding generation error:', error);
      throw error;
    }
  }

  /**
   * Parse streaming response from Workers AI
   */
  async *parseStream(response: Response): AsyncGenerator<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Workers AI streams plain text chunks
        if (chunk) {
          yield chunk;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
