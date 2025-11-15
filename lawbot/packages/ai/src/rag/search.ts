/**
 * Semantic Search
 *
 * Provides semantic search capabilities for Vietnamese legal documents.
 * Handles query processing, vector search, and result filtering.
 */

import type { EmbeddingGenerator } from './embeddings';
import type { VectorStore, LegalNamespace, QueryOptions } from './vectorstore';
import type { ChunkMetadata } from './chunker';

export interface SearchOptions {
  topK?: number;
  minConfidence?: number;
  namespace?: LegalNamespace;
  category?: ChunkMetadata['category'];
  lawCode?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SearchResult {
  id: string;
  text: string;
  score: number;
  metadata: ChunkMetadata & {
    text: string;
    timestamp?: number;
  };
}

export interface SearchConfig {
  defaultTopK: number;
  defaultMinConfidence: number;
}

const DEFAULT_CONFIG: SearchConfig = {
  defaultTopK: 5,
  defaultMinConfidence: 0.75,
};

export class SemanticSearch {
  private vectorStore: VectorStore;
  private embeddings: EmbeddingGenerator;
  private config: SearchConfig;

  constructor(
    vectorStore: VectorStore,
    embeddings: EmbeddingGenerator,
    config: Partial<SearchConfig> = {}
  ) {
    this.vectorStore = vectorStore;
    this.embeddings = embeddings;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Search for relevant legal documents
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    try {
      const {
        topK = this.config.defaultTopK,
        minConfidence = this.config.defaultMinConfidence,
        namespace,
        category,
        lawCode,
        dateRange,
      } = options;

      // Generate query embedding
      const queryEmbedding = await this.embeddings.generateQueryEmbedding(query);

      // Build filter
      const filter = this.buildFilter({ category, lawCode, dateRange });

      // Execute vector search
      const queryOptions: QueryOptions = {
        topK: topK * 2, // Get more results for filtering
        namespace: namespace !== 'all' ? namespace : undefined,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        returnMetadata: true,
        returnValues: false,
      };

      const results = await this.vectorStore.query(queryEmbedding, queryOptions);

      // Filter and transform results
      return results
        .filter(r => r.score >= minConfidence)
        .slice(0, topK)
        .map(r => this.transformResult(r));
    } catch (error) {
      throw new Error(`Search failed: ${error}`);
    }
  }

  /**
   * Search with query expansion
   */
  async searchWithExpansion(
    query: string,
    expansions: string[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const allQueries = [query, ...expansions];
    const allResults: SearchResult[] = [];
    const seen = new Set<string>();

    for (const q of allQueries) {
      const results = await this.search(q, options);

      for (const result of results) {
        if (!seen.has(result.id)) {
          seen.add(result.id);
          allResults.push(result);
        }
      }
    }

    // Sort by score and limit
    const topK = options.topK || this.config.defaultTopK;
    return allResults
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Multi-query search (hybrid approach)
   */
  async multiSearch(
    queries: string[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const resultsByQuery = await Promise.all(
      queries.map(q => this.search(q, options))
    );

    // Merge and deduplicate
    const resultMap = new Map<string, SearchResult>();

    for (const results of resultsByQuery) {
      for (const result of results) {
        const existing = resultMap.get(result.id);
        if (!existing || result.score > existing.score) {
          resultMap.set(result.id, result);
        }
      }
    }

    // Sort by score
    const topK = options.topK || this.config.defaultTopK;
    return Array.from(resultMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Build metadata filter
   */
  private buildFilter(options: {
    category?: ChunkMetadata['category'];
    lawCode?: string;
    dateRange?: { start: string; end: string };
  }): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (options.category) {
      filter.category = options.category;
    }

    if (options.lawCode) {
      filter.law_code = options.lawCode;
    }

    if (options.dateRange) {
      filter.date = {
        $gte: options.dateRange.start,
        $lte: options.dateRange.end,
      };
    }

    return filter;
  }

  /**
   * Transform query result to search result
   */
  private transformResult(result: {
    id: string;
    score: number;
    metadata?: Record<string, unknown>;
  }): SearchResult {
    const metadata = result.metadata || {};

    return {
      id: result.id,
      text: (metadata.text as string) || '',
      score: result.score,
      metadata: {
        text: (metadata.text as string) || '',
        law_code: metadata.law_code as string,
        article: metadata.article as string,
        date: metadata.date as string,
        category: metadata.category as ChunkMetadata['category'],
        section: metadata.section as string,
        chapter: metadata.chapter as string,
        timestamp: metadata.timestamp as number,
      },
    };
  }

  /**
   * Get search statistics
   */
  getSearchStats(results: SearchResult[]): {
    avgScore: number;
    minScore: number;
    maxScore: number;
    count: number;
  } {
    if (results.length === 0) {
      return { avgScore: 0, minScore: 0, maxScore: 0, count: 0 };
    }

    const scores = results.map(r => r.score);
    return {
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores),
      count: results.length,
    };
  }
}
