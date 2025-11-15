/**
 * Semantic Search
 *
 * Provides semantic search capabilities for Vietnamese legal documents.
 * Handles query processing, vector search, and result filtering.
 */
const DEFAULT_CONFIG = {
    defaultTopK: 5,
    defaultMinConfidence: 0.75,
};
export class SemanticSearch {
    vectorStore;
    embeddings;
    config;
    constructor(vectorStore, embeddings, config = {}) {
        this.vectorStore = vectorStore;
        this.embeddings = embeddings;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Search for relevant legal documents
     */
    async search(query, options = {}) {
        try {
            const { topK = this.config.defaultTopK, minConfidence = this.config.defaultMinConfidence, namespace, category, lawCode, dateRange, } = options;
            // Generate query embedding
            const queryEmbedding = await this.embeddings.generateQueryEmbedding(query);
            // Build filter
            const filter = this.buildFilter({ category, lawCode, dateRange });
            // Execute vector search
            const queryOptions = {
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
        }
        catch (error) {
            throw new Error(`Search failed: ${error}`);
        }
    }
    /**
     * Search with query expansion
     */
    async searchWithExpansion(query, expansions, options = {}) {
        const allQueries = [query, ...expansions];
        const allResults = [];
        const seen = new Set();
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
    async multiSearch(queries, options = {}) {
        const resultsByQuery = await Promise.all(queries.map(q => this.search(q, options)));
        // Merge and deduplicate
        const resultMap = new Map();
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
    buildFilter(options) {
        const filter = {};
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
    transformResult(result) {
        const metadata = result.metadata || {};
        return {
            id: result.id,
            text: metadata.text || '',
            score: result.score,
            metadata: {
                text: metadata.text || '',
                law_code: metadata.law_code,
                article: metadata.article,
                date: metadata.date,
                category: metadata.category,
                section: metadata.section,
                chapter: metadata.chapter,
                timestamp: metadata.timestamp,
            },
        };
    }
    /**
     * Get search statistics
     */
    getSearchStats(results) {
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
