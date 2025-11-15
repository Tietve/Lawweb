/**
 * RAG Pipeline Orchestrator
 *
 * Main entry point for RAG operations.
 * Combines all RAG components for end-to-end document processing and querying.
 */
export * from './chunker';
export * from './embeddings';
export * from './vectorstore';
export * from './search';
export * from './reranker';
export * from './citations';
import { LegalDocumentChunker } from './chunker';
import { EmbeddingGenerator } from './embeddings';
import { VectorStore } from './vectorstore';
import { SemanticSearch } from './search';
import { Reranker } from './reranker';
import { CitationTracker } from './citations';
export class RAG {
    chunker;
    embeddings;
    vectorStore;
    search;
    reranker;
    citations;
    constructor(ai, vectorizeIndex, config = {}) {
        // Initialize components
        this.chunker = new LegalDocumentChunker({
            chunkSize: config.chunkSize,
            chunkOverlap: config.chunkOverlap,
        });
        this.embeddings = new EmbeddingGenerator(ai, {
            batchSize: config.embeddingBatchSize,
        });
        this.vectorStore = new VectorStore(vectorizeIndex);
        this.search = new SemanticSearch(this.vectorStore, this.embeddings, {
            defaultTopK: config.searchTopK,
            defaultMinConfidence: config.minConfidence,
        });
        this.reranker = new Reranker();
        this.citations = new CitationTracker({
            baseUrl: config.citationBaseUrl,
        });
    }
    /**
     * Ingest a legal document into the vector store
     */
    async ingestDocument(document, metadata = {}, namespace) {
        const startTime = Date.now();
        try {
            // Step 1: Chunk document
            const chunks = await this.chunker.chunk(document, metadata);
            // Step 2: Generate embeddings
            const vectors = await this.embeddings.generateEmbeddings(chunks);
            // Step 3: Store in Vectorize
            await this.vectorStore.upsert(vectors, namespace !== 'all' ? namespace : undefined);
            const processingTime = Date.now() - startTime;
            return {
                totalChunks: chunks.length,
                totalVectors: vectors.length,
                avgChunkSize: chunks.reduce((sum, c) => sum + c.tokens, 0) / chunks.length,
                processingTime,
            };
        }
        catch (error) {
            throw new Error(`Document ingestion failed: ${error}`);
        }
    }
    /**
     * Query the RAG system
     */
    async query(question, options = {}) {
        const startTime = Date.now();
        try {
            // Step 1: Search for relevant documents
            const searchResults = await this.search.search(question, options);
            // Step 2: Rerank results (if enabled)
            const rerankedResults = options.topK
                ? await this.reranker.rerank(question, searchResults)
                : searchResults;
            // Step 3: Format response with citations
            const searchTime = Date.now() - startTime;
            // Note: Answer generation would be done by Claude in Phase 04
            // For now, we return the sources with a placeholder answer
            const answer = this.generatePlaceholderAnswer(rerankedResults);
            return this.citations.formatResponse(answer, rerankedResults, { searchTime });
        }
        catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }
    /**
     * Batch ingest multiple documents
     */
    async batchIngest(documents) {
        const results = [];
        for (const doc of documents) {
            const result = await this.ingestDocument(doc.text, doc.metadata, doc.namespace);
            results.push(result);
        }
        return results;
    }
    /**
     * Get RAG pipeline statistics
     */
    async getStats() {
        const vectorStats = await this.vectorStore.getStats();
        return {
            vectorStore: vectorStats,
        };
    }
    /**
     * Generate placeholder answer from search results
     * (Will be replaced with Claude integration in Phase 04)
     */
    generatePlaceholderAnswer(results) {
        if (results.length === 0) {
            return 'Không tìm thấy thông tin pháp lý liên quan đến câu hỏi của bạn.';
        }
        const topResult = results[0];
        return `Dựa trên ${results.length} tài liệu pháp lý liên quan, thông tin chính từ ${topResult?.metadata.law_code || 'tài liệu'}: ${topResult?.text.slice(0, 200)}...`;
    }
    /**
     * Health check for RAG system
     */
    async healthCheck() {
        const components = {
            vectorStore: false,
            embeddings: false,
        };
        try {
            // Check vector store
            await this.vectorStore.getStats();
            components.vectorStore = true;
            // Check embeddings (simple test)
            const testEmbedding = await this.embeddings.generateQueryEmbedding('test');
            components.embeddings = testEmbedding.length > 0;
        }
        catch (error) {
            // Health check failed for some components
        }
        const allHealthy = Object.values(components).every(v => v);
        const someHealthy = Object.values(components).some(v => v);
        return {
            status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
            components,
        };
    }
}
