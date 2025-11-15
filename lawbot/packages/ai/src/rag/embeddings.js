/**
 * Embedding Generator
 *
 * Generates vector embeddings for Vietnamese text using BGE-M3 model.
 * Handles batch processing, error handling, and retries.
 */
const DEFAULT_CONFIG = {
    batchSize: 100,
    maxRetries: 3,
    retryDelay: 1000,
    model: '@cf/baai/bge-m3',
};
export class EmbeddingGenerator {
    config;
    ai;
    constructor(ai, config = {}) {
        this.ai = ai;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Generate embeddings for chunks
     */
    async generateEmbeddings(chunks) {
        const vectors = [];
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
    async generateQueryEmbedding(query) {
        try {
            const result = await this.runWithRetry([query]);
            return result.data[0] || [];
        }
        catch (error) {
            throw new Error(`Failed to generate query embedding: ${error}`);
        }
    }
    /**
     * Process a batch of chunks
     */
    async processBatch(batch) {
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
        }
        catch (error) {
            throw new Error(`Batch processing failed: ${error}`);
        }
    }
    /**
     * Run AI model with retry logic
     */
    async runWithRetry(texts, attempt = 1) {
        try {
            const result = await this.ai.run(this.config.model, // BGE-M3 model string
            {
                text: texts,
            });
            // Validate response structure
            if (!result || !Array.isArray(result.data)) {
                throw new Error('Invalid response structure from AI model');
            }
            return result;
        }
        catch (error) {
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
    generateId() {
        return crypto.randomUUID();
    }
    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Validate embedding dimensions
     */
    validateDimensions(embedding, expected = 1024) {
        return embedding.length === expected;
    }
    /**
     * Calculate embedding statistics
     */
    getEmbeddingStats(vectors) {
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
