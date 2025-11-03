import embeddingService from './services/embeddingService';
import vectorService from './services/vectorService';
import logger from './utils/logger';

async function testVectorIndexing() {
  console.log('🧪 Testing Vector Indexing Flow\n');

  try {
    // Test 1: Generate a single embedding
    console.log('Test 1: Generate single embedding');
    const testText = "This is a test document about machine learning and AI.";
    const embedding = await embeddingService.generateEmbedding(testText);
    console.log(`✅ Embedding generated - dimension: ${embedding.length}`);
    console.log(`📊 Sample values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]\n`);

    // Test 2: Index a test document
    console.log('Test 2: Index a test document');
    const testDocId = 'test-doc-' + Date.now();
    const testWorkspaceId = 1;
    const testContent = `
      This is a comprehensive test document about artificial intelligence.
      Machine learning is a subset of AI that focuses on learning from data.
      Natural language processing helps computers understand human language.
      Vector databases are useful for semantic search and retrieval.
    `;

    await vectorService.indexDocument(testDocId, testWorkspaceId, testContent);
    console.log('✅ Document indexed successfully\n');

    // Test 3: Search for similar content
    console.log('Test 3: Search for similar content');
    const query = "What is machine learning?";
    console.log(`Query: "${query}"`);
    
    const results = await vectorService.searchSimilarDocuments(query, testWorkspaceId, 3);
    
    if (results.length === 0) {
      console.log('⚠️  No similar chunks found');
    } else {
      console.log(`✅ Found ${results.length} similar chunks:`);
      results.forEach((result, i) => {
        console.log(`\n${i + 1}. Similarity: ${result.similarity.toFixed(4)}`);
        console.log(`   Document ID: ${result.documentId}`);
        console.log(`   Chunk Index: ${result.chunkIndex}`);
        console.log(`   Text: ${result.chunkText.substring(0, 80)}...`);
      });
    }
    console.log();

    // Test 4: Get workspace stats
    console.log('Test 4: Workspace stats');
    const stats = await vectorService.getWorkspaceStats(testWorkspaceId);
    console.log(`✅ Total Documents: ${stats.totalDocuments}`);
    console.log(`✅ Total Chunks: ${stats.totalChunks}\n`);

    // Test 5: Check if document is indexed
    console.log('Test 5: Check document index status');
    const isIndexed = await vectorService.isDocumentIndexed(testDocId);
    console.log(`✅ Document is indexed: ${isIndexed}\n`);

    // Cleanup
    console.log('Cleaning up test data...');
    await vectorService.deleteDocumentEmbeddings(testDocId);
    console.log('✅ Cleanup complete\n');

    // Verify cleanup
    const isIndexedAfter = await vectorService.isDocumentIndexed(testDocId);
    console.log(`✅ Document deleted: ${!isIndexedAfter}\n`);

    console.log('🎉 All tests passed!\n');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    
    process.exit(1);
  }
}

testVectorIndexing();
