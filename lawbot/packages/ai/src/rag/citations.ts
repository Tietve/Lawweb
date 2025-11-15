/**
 * Citation Tracker
 *
 * Tracks and formats citations for legal document references.
 * Generates proper citations with confidence scores and URLs.
 */

import type { SearchResult } from './search';

export interface Citation {
  law: string;
  article?: string;
  section?: string;
  chapter?: string;
  confidence: number;
  url?: string;
  text?: string;
}

export interface RagResponse {
  answer: string;
  sources: Citation[];
  disclaimer: string;
  metadata?: {
    totalSources: number;
    avgConfidence: number;
    searchTime?: number;
  };
}

export interface CitationConfig {
  baseUrl: string;
  includeText: boolean;
  maxTextLength: number;
  disclaimer: string;
}

const DEFAULT_CONFIG: CitationConfig = {
  baseUrl: 'https://thuvienphapluat.vn',
  includeText: false,
  maxTextLength: 200,
  disclaimer: 'Đây là thông tin pháp lý do AI tạo ra. Vui lòng tham khảo ý kiến của chuyên gia pháp lý để có lời khuyên phù hợp với tình huống cụ thể của bạn.',
};

export class CitationTracker {
  private config: CitationConfig;

  constructor(config: Partial<CitationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Format RAG response with citations
   */
  formatResponse(
    answer: string,
    sources: SearchResult[],
    metadata?: { searchTime?: number }
  ): RagResponse {
    const citations = sources.map(s => this.createCitation(s));

    return {
      answer,
      sources: citations,
      disclaimer: this.config.disclaimer,
      metadata: {
        totalSources: citations.length,
        avgConfidence: this.calculateAvgConfidence(citations),
        searchTime: metadata?.searchTime,
      },
    };
  }

  /**
   * Create citation from search result
   */
  createCitation(result: SearchResult): Citation {
    const citation: Citation = {
      law: this.extractLawName(result),
      article: result.metadata.article,
      section: result.metadata.section,
      chapter: result.metadata.chapter,
      confidence: result.score,
      url: this.generateLawUrl(result),
    };

    if (this.config.includeText) {
      citation.text = this.truncateText(result.text);
    }

    return citation;
  }

  /**
   * Extract law name from result
   */
  private extractLawName(result: SearchResult): string {
    return result.metadata.law_code || 'Tài liệu pháp lý';
  }

  /**
   * Generate URL to legal document
   */
  private generateLawUrl(result: SearchResult): string | undefined {
    const lawCode = result.metadata.law_code;
    if (!lawCode) {
      return undefined;
    }

    // Create URL-friendly slug
    const slug = lawCode
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    return `${this.config.baseUrl}/van-ban/${slug}`;
  }

  /**
   * Truncate text to max length
   */
  private truncateText(text: string): string {
    if (text.length <= this.config.maxTextLength) {
      return text;
    }

    return text.slice(0, this.config.maxTextLength) + '...';
  }

  /**
   * Calculate average confidence score
   */
  private calculateAvgConfidence(citations: Citation[]): number {
    if (citations.length === 0) {
      return 0;
    }

    const total = citations.reduce((sum, c) => sum + c.confidence, 0);
    return total / citations.length;
  }

  /**
   * Format inline citation
   */
  formatInlineCitation(citation: Citation, index: number): string {
    const parts: string[] = [];

    if (citation.law) {
      parts.push(citation.law);
    }

    if (citation.article) {
      parts.push(citation.article);
    }

    if (citation.section) {
      parts.push(citation.section);
    }

    const reference = parts.join(', ');
    return `[${index + 1}] ${reference}`;
  }

  /**
   * Format full citation list
   */
  formatCitationList(citations: Citation[]): string {
    return citations
      .map((citation, index) => {
        const inline = this.formatInlineCitation(citation, index);
        const confidence = `(${(citation.confidence * 100).toFixed(1)}%)`;
        const url = citation.url ? `\nURL: ${citation.url}` : '';

        return `${inline} ${confidence}${url}`;
      })
      .join('\n\n');
  }

  /**
   * Filter citations by confidence threshold
   */
  filterByConfidence(citations: Citation[], threshold: number): Citation[] {
    return citations.filter(c => c.confidence >= threshold);
  }

  /**
   * Group citations by law
   */
  groupByLaw(citations: Citation[]): Map<string, Citation[]> {
    const groups = new Map<string, Citation[]>();

    for (const citation of citations) {
      const law = citation.law;

      if (!groups.has(law)) {
        groups.set(law, []);
      }

      groups.get(law)!.push(citation);
    }

    return groups;
  }

  /**
   * Deduplicate citations
   */
  deduplicate(citations: Citation[]): Citation[] {
    const seen = new Set<string>();
    const unique: Citation[] = [];

    for (const citation of citations) {
      const key = this.createCitationKey(citation);

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(citation);
      }
    }

    return unique;
  }

  /**
   * Create unique key for citation
   */
  private createCitationKey(citation: Citation): string {
    return `${citation.law}|${citation.article || ''}|${citation.section || ''}`;
  }

  /**
   * Sort citations by confidence
   */
  sortByConfidence(citations: Citation[], descending = true): Citation[] {
    return [...citations].sort((a, b) => {
      return descending ? b.confidence - a.confidence : a.confidence - b.confidence;
    });
  }

  /**
   * Get citation statistics
   */
  getStats(citations: Citation[]): {
    total: number;
    avgConfidence: number;
    minConfidence: number;
    maxConfidence: number;
    uniqueLaws: number;
  } {
    if (citations.length === 0) {
      return {
        total: 0,
        avgConfidence: 0,
        minConfidence: 0,
        maxConfidence: 0,
        uniqueLaws: 0,
      };
    }

    const confidences = citations.map(c => c.confidence);
    const uniqueLaws = new Set(citations.map(c => c.law)).size;

    return {
      total: citations.length,
      avgConfidence: confidences.reduce((a, b) => a + b, 0) / confidences.length,
      minConfidence: Math.min(...confidences),
      maxConfidence: Math.max(...confidences),
      uniqueLaws,
    };
  }
}
