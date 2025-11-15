/**
 * Vector Store
 *
 * Manages Cloudflare Vectorize operations for legal document embeddings.
 * Handles batch upserts, namespace management, and vector operations.
 */

import type { Vector } from './embeddings';
import type { ChunkMetadata } from './chunker';

export type LegalNamespace = 'civil' | 'criminal' | 'labor' | 'commercial' | 'administrative' | 'all';

export interface VectorStoreConfig {
  maxBatchSize: number;
  dimensions: number;
}

const DEFAULT_CONFIG: VectorStoreConfig = {
  maxBatchSize: 100000, // Vectorize limit
  dimensions: 1024,     // BGE-M3 dimensions
};

export interface QueryOptions {
  topK?: number;
  namespace?: string;
  filter?: Record<string, unknown>;
  returnValues?: boolean;
  returnMetadata?: boolean;
}

export interface QueryResult {
  id: string;
  score: number;
  values?: number[];
  metadata?: Record<string, unknown>;
}

export class VectorStore {
  private index: VectorizeIndex;
  private config: VectorStoreConfig;

  constructor(index: VectorizeIndex, config: Partial<VectorStoreConfig> = {}) {
    this.index = index;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Upsert vectors in batches
   */
  async upsert(vectors: Vector[], _namespace?: string): Promise<void> {
    try {
      // Split into batches
      const batches = this.createBatches(vectors);

      for (const batch of batches) {
        // Cast to Vectorize format
        const vectorizeVectors = batch.map(v => ({
          id: v.id,
          values: v.values,
          metadata: v.metadata as unknown as Record<string, VectorizeVectorMetadata>,
        })) as VectorizeVector[];

        await this.index.upsert(vectorizeVectors);
      }
    } catch (error) {
      throw new Error(`Vector upsert failed: ${error}`);
    }
  }

  /**
   * Query similar vectors
   */
  async query(
    queryVector: number[],
    options: QueryOptions = {}
  ): Promise<QueryResult[]> {
    try {
      const {
        topK = 5,
        namespace,
        filter,
        returnValues = false,
        returnMetadata = true,
      } = options;

      const result = await this.index.query(queryVector, {
        topK,
        namespace,
        filter: filter as VectorizeVectorMetadataFilter,
        returnValues,
        returnMetadata,
      });

      return result.matches.map(match => ({
        id: match.id,
        score: match.score,
        values: match.values ? Array.from(match.values) : undefined,
        metadata: match.metadata as Record<string, unknown>,
      }));
    } catch (error) {
      throw new Error(`Vector query failed: ${error}`);
    }
  }

  /**
   * Get vector by ID
   */
  async getById(ids: string[]): Promise<Vector[]> {
    try {
      const result = await this.index.getByIds(ids);
      return result.map(v => ({
        id: v.id,
        values: Array.from(v.values),
        metadata: v.metadata as any,
      }));
    } catch (error) {
      throw new Error(`Failed to get vectors by ID: ${error}`);
    }
  }

  /**
   * Delete vectors by ID
   */
  async deleteById(ids: string[]): Promise<void> {
    try {
      await this.index.deleteByIds(ids);
    } catch (error) {
      throw new Error(`Failed to delete vectors: ${error}`);
    }
  }

  /**
   * Delete all vectors in a namespace
   */
  async deleteNamespace(_namespace: string): Promise<void> {
    try {
      // Vectorize doesn't have direct namespace deletion
      // This is a placeholder for future implementation
      throw new Error('Namespace deletion not implemented');
    } catch (error) {
      throw new Error(`Failed to delete namespace: ${error}`);
    }
  }

  /**
   * Get index statistics
   */
  async getStats(): Promise<{
    dimensions: number;
    count?: number;
  }> {
    try {
      const result = await this.index.describe();
      return {
        dimensions: this.config.dimensions,
        count: result.vectorsCount || 0,
      };
    } catch (error) {
      throw new Error(`Failed to get index stats: ${error}`);
    }
  }

  /**
   * Create batches from vectors
   */
  private createBatches(vectors: Vector[]): Vector[][] {
    const batches: Vector[][] = [];

    for (let i = 0; i < vectors.length; i += this.config.maxBatchSize) {
      batches.push(vectors.slice(i, i + this.config.maxBatchSize));
    }

    return batches;
  }

  /**
   * Validate vector dimensions
   */
  validateVector(vector: Vector): boolean {
    return vector.values.length === this.config.dimensions;
  }

  /**
   * Create filter for legal category
   */
  static createCategoryFilter(category: ChunkMetadata['category']): Record<string, unknown> {
    return {
      category: category,
    };
  }

  /**
   * Create filter for law code
   */
  static createLawFilter(lawCode: string): Record<string, unknown> {
    return {
      law_code: lawCode,
    };
  }

  /**
   * Create filter for date range
   */
  static createDateFilter(startDate: string, endDate: string): Record<string, unknown> {
    return {
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };
  }
}
