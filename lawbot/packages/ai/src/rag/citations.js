/**
 * Citation Tracker
 *
 * Tracks and formats citations for legal document references.
 * Generates proper citations with confidence scores and URLs.
 */
const DEFAULT_CONFIG = {
    baseUrl: 'https://thuvienphapluat.vn',
    includeText: false,
    maxTextLength: 200,
    disclaimer: 'Đây là thông tin pháp lý do AI tạo ra. Vui lòng tham khảo ý kiến của chuyên gia pháp lý để có lời khuyên phù hợp với tình huống cụ thể của bạn.',
};
export class CitationTracker {
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Format RAG response with citations
     */
    formatResponse(answer, sources, metadata) {
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
    createCitation(result) {
        const citation = {
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
    extractLawName(result) {
        return result.metadata.law_code || 'Tài liệu pháp lý';
    }
    /**
     * Generate URL to legal document
     */
    generateLawUrl(result) {
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
    truncateText(text) {
        if (text.length <= this.config.maxTextLength) {
            return text;
        }
        return text.slice(0, this.config.maxTextLength) + '...';
    }
    /**
     * Calculate average confidence score
     */
    calculateAvgConfidence(citations) {
        if (citations.length === 0) {
            return 0;
        }
        const total = citations.reduce((sum, c) => sum + c.confidence, 0);
        return total / citations.length;
    }
    /**
     * Format inline citation
     */
    formatInlineCitation(citation, index) {
        const parts = [];
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
    formatCitationList(citations) {
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
    filterByConfidence(citations, threshold) {
        return citations.filter(c => c.confidence >= threshold);
    }
    /**
     * Group citations by law
     */
    groupByLaw(citations) {
        const groups = new Map();
        for (const citation of citations) {
            const law = citation.law;
            if (!groups.has(law)) {
                groups.set(law, []);
            }
            groups.get(law).push(citation);
        }
        return groups;
    }
    /**
     * Deduplicate citations
     */
    deduplicate(citations) {
        const seen = new Set();
        const unique = [];
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
    createCitationKey(citation) {
        return `${citation.law}|${citation.article || ''}|${citation.section || ''}`;
    }
    /**
     * Sort citations by confidence
     */
    sortByConfidence(citations, descending = true) {
        return [...citations].sort((a, b) => {
            return descending ? b.confidence - a.confidence : a.confidence - b.confidence;
        });
    }
    /**
     * Get citation statistics
     */
    getStats(citations) {
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
