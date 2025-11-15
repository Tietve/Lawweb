/**
 * Reranker
 *
 * Reranks search results using legal hierarchy and relevance scoring.
 * Validates law precedence and improves result quality.
 */

import type { SearchResult } from './search';

export interface RerankConfig {
  useHierarchy: boolean;
  useLexicalSimilarity: boolean;
  hierarchyWeight: number;
  semanticWeight: number;
  lexicalWeight: number;
}

const DEFAULT_CONFIG: RerankConfig = {
  useHierarchy: true,
  useLexicalSimilarity: true,
  hierarchyWeight: 0.3,
  semanticWeight: 0.5,
  lexicalWeight: 0.2,
};

// Legal document hierarchy (higher = more authoritative)
const LAW_HIERARCHY: Record<string, number> = {
  'hiến pháp': 100,        // Constitution
  'constitution': 100,
  'bộ luật': 80,          // Code (e.g., Criminal Code)
  'luật': 70,             // Law
  'pháp lệnh': 60,        // Ordinance
  'nghị định': 50,        // Decree
  'quyết định': 40,       // Decision
  'thông tư': 30,         // Circular
  'chỉ thị': 20,          // Directive
  'default': 10,
};

export class Reranker {
  private config: RerankConfig;

  constructor(config: Partial<RerankConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Rerank search results
   */
  async rerank(query: string, results: SearchResult[]): Promise<SearchResult[]> {
    if (results.length === 0) {
      return results;
    }

    // Calculate combined scores
    const reranked = results.map(result => {
      let combinedScore = 0;

      // Semantic similarity score (from vector search)
      combinedScore += result.score * this.config.semanticWeight;

      // Hierarchy score
      if (this.config.useHierarchy) {
        const hierarchyScore = this.calculateHierarchyScore(result);
        combinedScore += hierarchyScore * this.config.hierarchyWeight;
      }

      // Lexical similarity score
      if (this.config.useLexicalSimilarity) {
        const lexicalScore = this.calculateLexicalSimilarity(query, result.text);
        combinedScore += lexicalScore * this.config.lexicalWeight;
      }

      return {
        ...result,
        score: combinedScore,
        originalScore: result.score,
      };
    });

    // Sort by combined score
    return reranked.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate hierarchy score based on document type
   */
  private calculateHierarchyScore(result: SearchResult): number {
    const text = result.text.toLowerCase();
    const lawCode = result.metadata.law_code?.toLowerCase() || '';

    // Find the highest matching hierarchy level
    let maxScore = LAW_HIERARCHY['default']!;

    for (const [lawType, score] of Object.entries(LAW_HIERARCHY)) {
      if (lawType !== 'default' && (text.includes(lawType) || lawCode.includes(lawType))) {
        maxScore = Math.max(maxScore, score);
      }
    }

    // Normalize to 0-1 range
    return maxScore / 100;
  }

  /**
   * Calculate lexical similarity using simple keyword matching
   */
  private calculateLexicalSimilarity(query: string, text: string): number {
    const queryWords = this.tokenize(query.toLowerCase());
    const textWords = this.tokenize(text.toLowerCase());

    if (queryWords.length === 0) {
      return 0;
    }

    // Count matching words
    let matches = 0;
    for (const word of queryWords) {
      if (textWords.includes(word)) {
        matches++;
      }
    }

    return matches / queryWords.length;
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .split(/\s+/)
      .filter(word => word.length > 2) // Filter short words
      .map(word => word.replace(/[^\w\s]/g, '')); // Remove punctuation
  }

  /**
   * Filter results by law hierarchy
   */
  filterByHierarchy(
    results: SearchResult[],
    minHierarchyLevel: keyof typeof LAW_HIERARCHY = 'thông tư'
  ): SearchResult[] {
    const minScore = LAW_HIERARCHY[minHierarchyLevel] || LAW_HIERARCHY['default']!;

    return results.filter(result => {
      const hierarchyScore = this.calculateHierarchyScore(result);
      return hierarchyScore * 100 >= minScore;
    });
  }

  /**
   * Group results by document type
   */
  groupByType(results: SearchResult[]): Map<string, SearchResult[]> {
    const groups = new Map<string, SearchResult[]>();

    for (const result of results) {
      const type = this.detectDocumentType(result);

      if (!groups.has(type)) {
        groups.set(type, []);
      }

      groups.get(type)!.push(result);
    }

    return groups;
  }

  /**
   * Detect document type from text
   */
  private detectDocumentType(result: SearchResult): string {
    const text = result.text.toLowerCase();
    const lawCode = result.metadata.law_code?.toLowerCase() || '';

    for (const lawType of Object.keys(LAW_HIERARCHY)) {
      if (lawType !== 'default' && (text.includes(lawType) || lawCode.includes(lawType))) {
        return lawType;
      }
    }

    return 'other';
  }

  /**
   * Deduplicate results by similarity
   */
  deduplicate(results: SearchResult[], _threshold = 0.9): SearchResult[] {
    const unique: SearchResult[] = [];
    const seen = new Set<string>();

    for (const result of results) {
      // Create a simple fingerprint
      const fingerprint = this.createFingerprint(result.text);

      if (!seen.has(fingerprint)) {
        seen.add(fingerprint);
        unique.push(result);
      }
    }

    return unique;
  }

  /**
   * Create text fingerprint for deduplication
   */
  private createFingerprint(text: string): string {
    // Use first 100 characters as fingerprint
    return text.slice(0, 100).trim().toLowerCase();
  }

  /**
   * Get reranking statistics
   */
  getRerankStats(
    original: SearchResult[],
    reranked: SearchResult[]
  ): {
    avgScoreChange: number;
    positionChanges: number;
    topResultChanged: boolean;
  } {
    const scoreChanges = reranked.map((r, i) => {
      const orig = original[i];
      return orig ? r.score - orig.score : 0;
    });

    const avgScoreChange = scoreChanges.reduce((a, b) => a + b, 0) / scoreChanges.length;

    // Count position changes
    const positionChanges = reranked.filter((r, i) => {
      const origIndex = original.findIndex(o => o.id === r.id);
      return origIndex !== i;
    }).length;

    const topResultChanged = reranked.length > 0 && original.length > 0
      ? reranked[0]!.id !== original[0]!.id
      : false;

    return {
      avgScoreChange,
      positionChanges,
      topResultChanged,
    };
  }
}
