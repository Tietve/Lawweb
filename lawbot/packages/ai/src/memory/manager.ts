/**
 * Conversation Memory Manager
 * D1 for persistence + KV for caching
 */

import type { Message } from '../types';

export class ConversationMemory {
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly MAX_CACHE_MESSAGES = 20;

  constructor(
    private db: D1Database,
    private kv: KVNamespace
  ) {}

  /**
   * Save message to conversation history
   */
  async saveMessage(
    conversationId: string,
    message: Message
  ): Promise<void> {
    try {
      // Save to D1 for persistence
      await this.db
        .prepare(
          `INSERT INTO messages (conversation_id, role, content, created_at)
           VALUES (?, ?, ?, ?)`
        )
        .bind(
          conversationId,
          message.role,
          message.content,
          new Date().toISOString()
        )
        .run();

      // Update KV cache
      await this.updateCache(conversationId, message);
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  /**
   * Get conversation history (tries cache first, then D1)
   */
  async getHistory(
    conversationId: string,
    limit: number = 10
  ): Promise<Message[]> {
    try {
      // Try cache first
      const cached = await this.getFromCache(conversationId);
      if (cached && cached.length > 0) {
        return cached.slice(-limit);
      }

      // Fallback to D1
      const messages = await this.getFromDB(conversationId, limit);

      // Update cache for next time
      if (messages.length > 0) {
        await this.setCacheFromMessages(conversationId, messages);
      }

      return messages;
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

  /**
   * Clear conversation history
   */
  async clearHistory(conversationId: string): Promise<void> {
    try {
      // Clear from D1
      await this.db
        .prepare('DELETE FROM messages WHERE conversation_id = ?')
        .bind(conversationId)
        .run();

      // Clear from cache
      await this.kv.delete(this.getCacheKey(conversationId));
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  }

  /**
   * Get message count for a conversation
   */
  async getMessageCount(conversationId: string): Promise<number> {
    try {
      const result = await this.db
        .prepare(
          'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?'
        )
        .bind(conversationId)
        .first<{ count: number }>();

      return result?.count || 0;
    } catch (error) {
      console.error('Error getting message count:', error);
      return 0;
    }
  }

  /**
   * Update KV cache with new message
   */
  private async updateCache(
    conversationId: string,
    newMessage: Message
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(conversationId);
      const cached = (await this.kv.get(cacheKey, 'json')) as Message[] | null;

      const messages = cached || [];
      messages.push({
        role: newMessage.role,
        content: newMessage.content,
        timestamp: Date.now(),
      });

      // Keep only last N messages in cache
      if (messages.length > this.MAX_CACHE_MESSAGES) {
        messages.splice(0, messages.length - this.MAX_CACHE_MESSAGES);
      }

      await this.kv.put(cacheKey, JSON.stringify(messages), {
        expirationTtl: this.CACHE_TTL,
      });
    } catch (error) {
      console.error('Error updating cache:', error);
      // Non-critical, don't throw
    }
  }

  /**
   * Get messages from cache
   */
  private async getFromCache(conversationId: string): Promise<Message[]> {
    try {
      const cacheKey = this.getCacheKey(conversationId);
      const cached = await this.kv.get(cacheKey, 'json');
      return (cached as Message[]) || [];
    } catch (error) {
      console.error('Error reading from cache:', error);
      return [];
    }
  }

  /**
   * Get messages from D1
   */
  private async getFromDB(
    conversationId: string,
    limit: number
  ): Promise<Message[]> {
    try {
      const result = await this.db
        .prepare(
          `SELECT role, content, created_at
           FROM messages
           WHERE conversation_id = ?
           ORDER BY created_at DESC
           LIMIT ?`
        )
        .bind(conversationId, limit)
        .all<{ role: string; content: string; created_at: string }>();

      if (!result.results || result.results.length === 0) {
        return [];
      }

      // Reverse to get chronological order
      return result.results.reverse().map(row => ({
        role: row.role as 'user' | 'assistant' | 'system',
        content: row.content,
        timestamp: new Date(row.created_at).getTime(),
      }));
    } catch (error) {
      console.error('Error reading from DB:', error);
      return [];
    }
  }

  /**
   * Set cache from messages array
   */
  private async setCacheFromMessages(
    conversationId: string,
    messages: Message[]
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(conversationId);
      const toCache = messages.slice(-this.MAX_CACHE_MESSAGES);

      await this.kv.put(cacheKey, JSON.stringify(toCache), {
        expirationTtl: this.CACHE_TTL,
      });
    } catch (error) {
      console.error('Error setting cache:', error);
      // Non-critical
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(conversationId: string): string {
    return `conv:${conversationId}`;
  }
}
