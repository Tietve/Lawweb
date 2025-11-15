/**
 * Embedding Generator
 *
 * Generates vector embeddings for Vietnamese text using BGE-M3 model.
 * Handles batch processing, error handling, and retries.
 */

import type { Chunk, ChunkMetadata } from './chunker';

export interface Vector {
  id: string;
  values: number[];
  metadata: VectorMetadata;
}

export interface VectorMetadata extends ChunkMetadata {
  text: string;
  timestamp?: number;
}

export interface EmbeddingConfig {
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  model: string;
}

const DEFAULT_CONFIG: EmbeddingConfig = {
  batchSize: 100,
  maxRetries: 3,
  retryDelay: 1000,
  model: '@cf/baai/bge-m3',
};

export class EmbeddingGenerator {
  private config: EmbeddingConfig;
  private ai: Ai;

  constructor(ai: Ai, config: Partial<EmbeddingConfig> = {}) {
    this.ai = ai;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate embeddings for chunks
   */
  async generateEmbeddings(chunks: Chunk[]): Promise<Vector[]> {
    const vectors: Vector[] = [];

    // Process in batches
    for (let i = 0; i < chunks.length; i += this.config.batchSize) {
      const batch = chunks.slice(i, i + this.config.batchSize);
      const batchVectors = await this.processBatch(batch);
      vectors.push(...batchVectors);
    }

    return vectors;
  }

  /**
   * Generate embedding for a single query
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      const result = await this.runWithRetry([query]);
      return result.data[0] || [];
    } catch (error) {
      throw new Error(`Failed to generate query embedding: ${error}`);
    }
  }

  /**
   * Process a batch of chunks
   */
  private async processBatch(batch: Chunk[]): Promise<Vector[]> {
    try {
      const texts = batch.map(c => c.text);
      const result = await this.runWithRetry(texts);

      return batch.map((chunk, idx) => ({
        id: this.generateId(),
        values: result.data[idx] || [],
        metadata: {
          text: chunk.text,
          ...chunk.metadata,
          timestamp: Date.now(),
        },
      }));
    } catch (error) {
      throw new Error(`Batch processing failed: ${error}`);
    }
  }

  /**
   * Run AI model with retry logic
   */
  private async runWithRetry(texts: string[], attempt = 1): Promise<{ data: number[][] }> {
    try {
      const result = await this.ai.run(
        this.config.model as any, // BGE-M3 model string
        {
          text: texts,
        }
      ) as any;

      // Validate response structure
      if (!result || !Array.isArray(result.data)) {
        throw new Error('Invalid response structure from AI model');
      }

      return result as { data: number[][] };
    } catch (error) {
      if (attempt >= this.config.maxRetries) {
        throw new Error(`Failed after ${this.config.maxRetries} attempts: ${error}`);
      }

      // Wait before retry
      await this.sleep(this.config.retryDelay * attempt);

      return this.runWithRetry(texts, attempt + 1);
    }
  }

  /**
   * Generate unique vector ID
   */
  private generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate embedding dimensions
   */
  validateDimensions(embedding: number[], expected = 1024): boolean {
    return embedding.length === expected;
  }

  /**
   * Calculate embedding statistics
   */
  getEmbeddingStats(vectors: Vector[]): {
    count: number;
    avgDimension: number;
    totalSize: number;
  } {
    const count = vectors.length;
    const avgDimension = vectors.reduce((sum, v) => sum + v.values.length, 0) / count;
    const totalSize = vectors.reduce((sum, v) => sum + v.values.length * 4, 0); // 4 bytes per float

    return {
      count,
      avgDimension: Math.round(avgDimension),
      totalSize,
    };
  }
}
