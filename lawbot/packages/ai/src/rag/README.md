# RAG Pipeline for Vietnamese Legal Documents

Complete RAG (Retrieval-Augmented Generation) implementation for LawBot system with BGE-M3 embeddings and Cloudflare Vectorize integration.

## Components

### 1. Document Chunker (`chunker.ts`)
Splits Vietnamese legal documents into optimized chunks:
- **Chunk size**: 512 tokens (configurable)
- **Overlap**: 20% (100 tokens)
- **Vietnamese handling**: 1.5x token multiplier
- **Legal boundaries**: Splits by Điều, Khoản, Chương, Mục
- **Metadata extraction**: Law code, article, date, category

### 2. Embedding Generator (`embeddings.ts`)
Generates vector embeddings using Workers AI:
- **Model**: BGE-M3 (@cf/baai/bge-m3)
- **Dimensions**: 1024
- **Batch processing**: 100 chunks at a time
- **Retry logic**: 3 attempts with exponential backoff
- **Error handling**: Comprehensive validation

### 3. Vector Store (`vectorstore.ts`)
Manages Cloudflare Vectorize operations:
- **Batch upsert**: 100K vectors max per batch
- **Namespace support**: civil, criminal, labor, commercial, administrative
- **Query options**: topK, filters, metadata
- **Vector operations**: Insert, query, get, delete

### 4. Semantic Search (`search.ts`)
Provides semantic search capabilities:
- **Top-K retrieval**: Default 5 results
- **Confidence threshold**: 0.75+ filtering
- **Multi-query**: Hybrid search support
- **Query expansion**: Enhanced results
- **Metadata filtering**: By category, law code, date range

### 5. Reranker (`reranker.ts`)
Optimizes search results:
- **Legal hierarchy**: Constitution > Laws > Decrees > Circulars
- **Combined scoring**: Semantic + hierarchy + lexical
- **Deduplication**: Remove similar results
- **Grouping**: By document type

### 6. Citation Tracker (`citations.ts`)
Formats and tracks citations:
- **Citation format**: Law code, article, confidence
- **URL generation**: Links to thuvienphapluat.vn
- **Disclaimer**: Vietnamese legal disclaimer
- **Statistics**: Confidence scores, source counts

### 7. RAG Orchestrator (`index.ts`)
Main RAG class combining all components:
- **Document ingestion**: End-to-end pipeline
- **Query processing**: Complete search flow
- **Batch operations**: Multiple document support
- **Health checks**: System status monitoring

## Usage

### Basic Setup

```typescript
import { RAG } from '@lawbot/ai/rag';

// Initialize RAG system
const rag = new RAG(
  env.AI,              // Workers AI binding
  env.VECTORIZE_INDEX, // Vectorize index binding
  {
    chunkSize: 512,
    chunkOverlap: 100,
    searchTopK: 5,
    minConfidence: 0.75,
  }
);
```

### Document Ingestion

```typescript
// Ingest a single legal document
const result = await rag.ingestDocument(
  documentText,
  {
    law_code: 'Bộ luật Dân sự 2015',
    category: 'civil',
    date: 'ngày 24/11/2015',
  },
  'civil' // namespace
);

console.log(`Processed ${result.totalChunks} chunks`);
console.log(`Generated ${result.totalVectors} vectors`);
console.log(`Processing time: ${result.processingTime}ms`);
```

### Batch Ingestion

```typescript
// Ingest multiple documents
const results = await rag.batchIngest([
  {
    text: civilCodeText,
    metadata: { law_code: 'Bộ luật Dân sự 2015', category: 'civil' },
    namespace: 'civil',
  },
  {
    text: laborLawText,
    metadata: { law_code: 'Bộ luật Lao động 2019', category: 'labor' },
    namespace: 'labor',
  },
]);
```

### Querying

```typescript
// Basic query
const response = await rag.query(
  'Thời hạn hợp đồng lao động là bao lâu?',
  {
    topK: 5,
    minConfidence: 0.75,
    namespace: 'labor',
  }
);

console.log(response.answer);
console.log(`Found ${response.sources.length} sources`);
console.log(`Average confidence: ${response.metadata.avgConfidence}`);

// Display citations
response.sources.forEach((citation, i) => {
  console.log(`[${i + 1}] ${citation.law} - ${citation.article}`);
  console.log(`   Confidence: ${(citation.confidence * 100).toFixed(1)}%`);
  console.log(`   URL: ${citation.url}`);
});
```

### Advanced Search

```typescript
// Search with category filter
const response = await rag.query(
  'Quyền và nghĩa vụ của người lao động',
  {
    topK: 10,
    category: 'labor',
    dateRange: {
      start: 'ngày 01/01/2019',
      end: 'ngày 31/12/2024',
    },
  }
);

// Search specific law code
const response = await rag.query(
  'Điều kiện kết hôn',
  {
    lawCode: 'Luật Hôn nhân và Gia đình 2014',
  }
);
```

### Individual Components

```typescript
import {
  LegalDocumentChunker,
  EmbeddingGenerator,
  VectorStore,
  SemanticSearch,
  Reranker,
  CitationTracker,
} from '@lawbot/ai/rag';

// Use individual components
const chunker = new LegalDocumentChunker({ chunkSize: 512 });
const chunks = await chunker.chunk(documentText);

const embeddings = new EmbeddingGenerator(env.AI);
const vectors = await embeddings.generateEmbeddings(chunks);

const vectorStore = new VectorStore(env.VECTORIZE_INDEX);
await vectorStore.upsert(vectors);

const search = new SemanticSearch(vectorStore, embeddings);
const results = await search.search('Quyền sở hữu');

const reranker = new Reranker();
const reranked = await reranker.rerank('Quyền sở hữu', results);

const citations = new CitationTracker();
const response = citations.formatResponse('Answer...', reranked);
```

## Performance

### Metrics
- **Chunk processing**: ~1000 chunks/second
- **Embedding generation**: ~100 chunks/batch
- **Search latency**: <50ms p99 (target)
- **Batch upsert**: 100K vectors max

### Optimization Tips
1. Use batch ingestion for multiple documents
2. Enable caching for frequently accessed vectors
3. Adjust chunk size based on document type
4. Use namespace filtering to reduce search space
5. Set appropriate confidence thresholds

## Configuration

### Chunker Config
```typescript
{
  chunkSize: 512,        // Tokens per chunk
  chunkOverlap: 100,     // Overlap tokens
  vietnameseMultiplier: 1.5 // Token multiplier
}
```

### Embedding Config
```typescript
{
  batchSize: 100,        // Chunks per batch
  maxRetries: 3,         // Retry attempts
  retryDelay: 1000,      // Delay in ms
  model: '@cf/baai/bge-m3' // BGE-M3 model
}
```

### Search Config
```typescript
{
  defaultTopK: 5,        // Results to return
  defaultMinConfidence: 0.75 // Min score threshold
}
```

### Reranker Config
```typescript
{
  useHierarchy: true,    // Enable law hierarchy
  useLexicalSimilarity: true, // Enable lexical matching
  hierarchyWeight: 0.3,  // Hierarchy score weight
  semanticWeight: 0.5,   // Semantic score weight
  lexicalWeight: 0.2     // Lexical score weight
}
```

### Citation Config
```typescript
{
  baseUrl: 'https://thuvienphapluat.vn',
  includeText: false,    // Include excerpt
  maxTextLength: 200,    // Max excerpt length
  disclaimer: '...'      // Legal disclaimer
}
```

## Error Handling

All components throw descriptive errors:

```typescript
try {
  const response = await rag.query(question);
} catch (error) {
  if (error.message.includes('Query failed')) {
    // Handle search error
  } else if (error.message.includes('Embedding generation failed')) {
    // Handle embedding error
  }
}
```

## Health Checks

```typescript
const health = await rag.healthCheck();

if (health.status === 'healthy') {
  console.log('All systems operational');
} else if (health.status === 'degraded') {
  console.log('Some components unavailable:', health.components);
} else {
  console.log('System unhealthy');
}
```

## Statistics

```typescript
// RAG system stats
const stats = await rag.getStats();
console.log(`Vector dimensions: ${stats.vectorStore.dimensions}`);
console.log(`Total vectors: ${stats.vectorStore.count}`);

// Search stats
const searchStats = search.getSearchStats(results);
console.log(`Avg score: ${searchStats.avgScore}`);
console.log(`Min score: ${searchStats.minScore}`);
console.log(`Max score: ${searchStats.maxScore}`);

// Citation stats
const citationStats = citations.getStats(response.sources);
console.log(`Total citations: ${citationStats.total}`);
console.log(`Unique laws: ${citationStats.uniqueLaws}`);
console.log(`Avg confidence: ${citationStats.avgConfidence}`);
```

## Best Practices

1. **Document Preparation**
   - Clean text before ingestion
   - Provide accurate metadata
   - Use appropriate namespaces

2. **Query Optimization**
   - Use specific questions
   - Apply filters when possible
   - Adjust topK based on needs

3. **Performance**
   - Batch process documents
   - Use appropriate chunk sizes
   - Monitor confidence scores

4. **Error Handling**
   - Implement retry logic
   - Handle edge cases
   - Log errors properly

5. **Monitoring**
   - Track search latency
   - Monitor confidence scores
   - Review citation quality

## Vietnamese Text Handling

The RAG system is optimized for Vietnamese:
- Token counting with 1.5x multiplier
- Legal clause boundary detection (Điều, Khoản, etc.)
- Vietnamese stopwords and tokenization
- Category detection from Vietnamese keywords

## Legal Document Support

Supported document types:
- Bộ luật (Codes)
- Luật (Laws)
- Nghị định (Decrees)
- Thông tư (Circulars)
- Quyết định (Decisions)
- Chỉ thị (Directives)

Supported categories:
- Civil (Dân sự)
- Criminal (Hình sự)
- Labor (Lao động)
- Commercial (Thương mại)
- Administrative (Hành chính)

## Integration with Phase 04

The RAG pipeline integrates with Claude API (Phase 04):

```typescript
import { AI } from '@lawbot/ai';
import { RAG } from '@lawbot/ai/rag';

const rag = new RAG(env.AI, env.VECTORIZE_INDEX);
const ai = new AI(env, rag.search);

// RAG search is automatically used by AI orchestrator
const response = await ai.chat({
  query: 'Quyền sở hữu trí tuệ là gì?',
  conversationId: 'user-123',
});
```

## License

Private - All rights reserved
