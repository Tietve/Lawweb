/**
 * Vector Store
 *
 * Manages Cloudflare Vectorize operations for legal document embeddings.
 * Handles batch upserts, namespace management, and vector operations.
 */
const DEFAULT_CONFIG = {
    maxBatchSize: 100000, // Vectorize limit
    dimensions: 1024, // BGE-M3 dimensions
};
export class VectorStore {
    index;
    config;
    constructor(index, config = {}) {
        this.index = index;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Upsert vectors in batches
     */
    async upsert(vectors, _namespace) {
        try {
            // Split into batches
            const batches = this.createBatches(vectors);
            for (const batch of batches) {
                // Cast to Vectorize format
                const vectorizeVectors = batch.map(v => ({
                    id: v.id,
                    values: v.values,
                    metadata: v.metadata,
                }));
                await this.index.upsert(vectorizeVectors);
            }
        }
        catch (error) {
            throw new Error(`Vector upsert failed: ${error}`);
        }
    }
    /**
     * Query similar vectors
     */
    async query(queryVector, options = {}) {
        try {
            const { topK = 5, namespace, filter, returnValues = false, returnMetadata = true, } = options;
            const result = await this.index.query(queryVector, {
                topK,
                namespace,
                filter: filter,
                returnValues,
                returnMetadata,
            });
            return result.matches.map(match => ({
                id: match.id,
                score: match.score,
                values: match.values ? Array.from(match.values) : undefined,
                metadata: match.metadata,
            }));
        }
        catch (error) {
            throw new Error(`Vector query failed: ${error}`);
        }
    }
    /**
     * Get vector by ID
     */
    async getById(ids) {
        try {
            const result = await this.index.getByIds(ids);
            return result.map(v => ({
                id: v.id,
                values: Array.from(v.values),
                metadata: v.metadata,
            }));
        }
        catch (error) {
            throw new Error(`Failed to get vectors by ID: ${error}`);
        }
    }
    /**
     * Delete vectors by ID
     */
    async deleteById(ids) {
        try {
            await this.index.deleteByIds(ids);
        }
        catch (error) {
            throw new Error(`Failed to delete vectors: ${error}`);
        }
    }
    /**
     * Delete all vectors in a namespace
     */
    async deleteNamespace(_namespace) {
        try {
            // Vectorize doesn't have direct namespace deletion
            // This is a placeholder for future implementation
            throw new Error('Namespace deletion not implemented');
        }
        catch (error) {
            throw new Error(`Failed to delete namespace: ${error}`);
        }
    }
    /**
     * Get index statistics
     */
    async getStats() {
        try {
            const result = await this.index.describe();
            return {
                dimensions: this.config.dimensions,
                count: result.vectorsCount || 0,
            };
        }
        catch (error) {
            throw new Error(`Failed to get index stats: ${error}`);
        }
    }
    /**
     * Create batches from vectors
     */
    createBatches(vectors) {
        const batches = [];
        for (let i = 0; i < vectors.length; i += this.config.maxBatchSize) {
            batches.push(vectors.slice(i, i + this.config.maxBatchSize));
        }
        return batches;
    }
    /**
     * Validate vector dimensions
     */
    validateVector(vector) {
        return vector.values.length === this.config.dimensions;
    }
    /**
     * Create filter for legal category
     */
    static createCategoryFilter(category) {
        return {
            category: category,
        };
    }
    /**
     * Create filter for law code
     */
    static createLawFilter(lawCode) {
        return {
            law_code: lawCode,
        };
    }
    /**
     * Create filter for date range
     */
    static createDateFilter(startDate, endDate) {
        return {
            date: {
                $gte: startDate,
                $lte: endDate,
            },
        };
    }
}
