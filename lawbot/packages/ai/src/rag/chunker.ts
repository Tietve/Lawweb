/**
 * Legal Document Chunker
 *
 * Chunks Vietnamese legal documents into optimized segments for RAG.
 * Handles legal clause boundaries, Vietnamese text, and metadata extraction.
 */

export interface ChunkMetadata {
  law_code?: string;
  article?: string;
  date?: string;
  category?: 'civil' | 'criminal' | 'labor' | 'commercial' | 'administrative' | 'other';
  section?: string;
  chapter?: string;
}

export interface Chunk {
  text: string;
  tokens: number;
  metadata: ChunkMetadata;
}

export interface ChunkerConfig {
  chunkSize: number;
  chunkOverlap: number;
  vietnameseMultiplier: number;
}

const DEFAULT_CONFIG: ChunkerConfig = {
  chunkSize: 512,
  chunkOverlap: 100,
  vietnameseMultiplier: 1.5,
};

export class LegalDocumentChunker {
  private config: ChunkerConfig;

  constructor(config: Partial<ChunkerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Chunk a legal document into optimized segments
   */
  async chunk(document: string, baseMetadata: Partial<ChunkMetadata> = {}): Promise<Chunk[]> {
    const chunks: Chunk[] = [];
    const clauses = this.splitByClauses(document);

    let currentChunk = '';
    let currentTokens = 0;

    for (const clause of clauses) {
      const clauseTokens = this.countTokens(clause);

      if (currentTokens + clauseTokens > this.config.chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          text: currentChunk.trim(),
          tokens: currentTokens,
          metadata: { ...baseMetadata, ...this.extractMetadata(currentChunk) },
        });

        // Start new chunk with overlap
        const overlap = this.getOverlap(currentChunk);
        currentChunk = overlap + ' ' + clause;
        currentTokens = this.countTokens(currentChunk);
      } else {
        currentChunk += (currentChunk ? ' ' : '') + clause;
        currentTokens += clauseTokens;
      }
    }

    // Add final chunk
    if (currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        tokens: currentTokens,
        metadata: { ...baseMetadata, ...this.extractMetadata(currentChunk) },
      });
    }

    return chunks;
  }

  /**
   * Split document by legal clause boundaries
   */
  private splitByClauses(document: string): string[] {
    // Split by common Vietnamese legal markers
    const markers = [
      /Điều \d+/g,           // Article markers
      /Khoản \d+/g,          // Clause markers
      /Chương [IVX]+/g,      // Chapter markers (Roman numerals)
      /Mục \d+/g,            // Section markers
      /\n\n+/g,              // Paragraph breaks
    ];

    let parts = [document];

    // Split by each marker type
    for (const marker of markers) {
      const newParts: string[] = [];
      for (const part of parts) {
        const splits = part.split(marker);
        const matches = part.match(marker) || [];

        for (let i = 0; i < splits.length; i++) {
          if (splits[i]?.trim()) {
            newParts.push(splits[i]!.trim());
          }
          if (i < matches.length && matches[i]) {
            newParts.push(matches[i]!);
          }
        }
      }
      parts = newParts;
    }

    // Filter and clean
    return parts
      .filter(p => p.trim().length > 0)
      .map(p => p.trim());
  }

  /**
   * Count tokens with Vietnamese multiplier
   */
  private countTokens(text: string): number {
    // Approximate token count for Vietnamese text
    // Vietnamese words are typically 1-2 syllables per token
    const words = text.split(/\s+/).length;
    return Math.ceil(words * this.config.vietnameseMultiplier);
  }

  /**
   * Get overlap text from end of chunk
   */
  private getOverlap(chunk: string): string {
    const words = chunk.split(/\s+/);
    const overlapWords = Math.floor(this.config.chunkOverlap / this.config.vietnameseMultiplier);
    return words.slice(-overlapWords).join(' ');
  }

  /**
   * Extract metadata from chunk text
   */
  private extractMetadata(chunk: string): ChunkMetadata {
    const metadata: ChunkMetadata = {};

    // Extract law code (e.g., "Luật 123/2020/QH14")
    const lawCodeMatch = chunk.match(/(?:Luật|Bộ luật|Nghị định|Thông tư)\s+\d+\/\d+\/[\w-]+/i);
    if (lawCodeMatch) {
      metadata.law_code = lawCodeMatch[0];
    }

    // Extract article number (e.g., "Điều 15")
    const articleMatch = chunk.match(/Điều\s+\d+/i);
    if (articleMatch) {
      metadata.article = articleMatch[0];
    }

    // Extract chapter (e.g., "Chương II")
    const chapterMatch = chunk.match(/Chương\s+[IVX]+/i);
    if (chapterMatch) {
      metadata.chapter = chapterMatch[0];
    }

    // Extract section (e.g., "Mục 3")
    const sectionMatch = chunk.match(/Mục\s+\d+/i);
    if (sectionMatch) {
      metadata.section = sectionMatch[0];
    }

    // Extract date (e.g., "ngày 15/11/2020")
    const dateMatch = chunk.match(/ngày\s+\d{1,2}\/\d{1,2}\/\d{4}/i);
    if (dateMatch) {
      metadata.date = dateMatch[0];
    }

    // Detect category by keywords
    metadata.category = this.detectCategory(chunk);

    return metadata;
  }

  /**
   * Detect legal category from content
   */
  private detectCategory(text: string): ChunkMetadata['category'] {
    const lowerText = text.toLowerCase();

    const categories = {
      civil: ['dân sự', 'hôn nhân', 'gia đình', 'thừa kế', 'sở hữu'],
      criminal: ['hình sự', 'tội phạm', 'truy tố', 'án tù', 'phạt tù'],
      labor: ['lao động', 'người lao động', 'hợp đồng lao động', 'tiền lương', 'sa thải'],
      commercial: ['thương mại', 'doanh nghiệp', 'hợp đồng mua bán', 'kinh doanh'],
      administrative: ['hành chính', 'xử phạt vi phạm', 'quyết định hành chính'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category as ChunkMetadata['category'];
      }
    }

    return 'other';
  }
}
