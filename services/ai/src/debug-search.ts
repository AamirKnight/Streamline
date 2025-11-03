import embeddingService from './services/embeddingService';
import vectorService from './services/vectorService';
import sequelize from './database';
import { QueryTypes } from 'sequelize';

async function debugAISearch() {
  console.log('\n🔍 Starting AI Search Diagnostics...\n');

  // 1. Test Embedding Generation
  console.log('1️⃣ Testing Embedding Generation...');
  try {
    const testText = 'This is a test document about machine learning';
    const embedding = await embeddingService.generateEmbedding(testText);
    console.log(`✅ Embedding generated: ${embedding.length} dimensions`);
    console.log(`   First 5 values: [${embedding.slice(0, 5).join(', ')}]`);
  } catch (error: any) {
    console.error('❌ Embedding generation failed:', error.message);
    return;
  }

  // 2. Check Vector Extension
  console.log('\n2️⃣ Checking pgvector extension...');
  try {
    const result = await sequelize.query(
      `SELECT * FROM pg_extension WHERE extname = 'vector'`,
      { type: QueryTypes.SELECT }
    );
    if (result.length > 0) {
      console.log('✅ pgvector extension is installed');
    } else {
      console.error('❌ pgvector extension NOT installed');
      console.log('   Run: CREATE EXTENSION vector;');
      return;
    }
  } catch (error: any) {
    console.error('❌ Extension check failed:', error.message);
  }

  // 3. Check Table Schema
  console.log('\n3️⃣ Checking table schema...');
  try {
    const result = await sequelize.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'document_embeddings'`,
      { type: QueryTypes.SELECT }
    );
    console.log('✅ Table columns:', result);
  } catch (error: any) {
    console.error('❌ Schema check failed:', error.message);
  }

  // 4. Count Indexed Documents
  console.log('\n4️⃣ Counting indexed documents...');
  try {
    const result = await sequelize.query(
      `SELECT 
        COUNT(*) as total_chunks,
        COUNT(DISTINCT document_id) as total_documents,
        COUNT(DISTINCT workspace_id) as total_workspaces
       FROM document_embeddings`,
      { type: QueryTypes.SELECT }
    );
    console.log('✅ Index statistics:', result[0]);
    
    if ((result[0] as any).total_chunks === '0') {
      console.warn('⚠️  NO DOCUMENTS INDEXED! You need to index documents first.');
    }
  } catch (error: any) {
    console.error('❌ Count query failed:', error.message);
  }

  // 5. Test Vector Search
  console.log('\n5️⃣ Testing vector search...');
  try {
    const query = 'machine learning algorithms';
    const queryEmbedding = await embeddingService.generateEmbedding(query);
    const vectorString = `[${queryEmbedding.join(',')}]`;

    const results = await sequelize.query(
      `SELECT 
        document_id,
        chunk_text,
        chunk_index,
        1 - (embedding <=> $1::vector) as similarity
       FROM document_embeddings
       WHERE workspace_id = $2
       ORDER BY embedding <=> $1::vector
       LIMIT 5`,
      {
        bind: [vectorString, 1],
        type: QueryTypes.SELECT,
      }
    );

    console.log(`✅ Search returned ${results.length} results`);
    if (results.length > 0) {
      console.log('   Top result:', results[0]);
    } else {
      console.warn('⚠️  No results found - documents may not be indexed');
    }
  } catch (error: any) {
    console.error('❌ Vector search failed:', error.message);
  }

  // 6. Sample Document Content
  console.log('\n6️⃣ Showing sample indexed content...');
  try {
    const samples = await sequelize.query(
      `SELECT document_id, chunk_text, chunk_index 
       FROM document_embeddings 
       LIMIT 3`,
      { type: QueryTypes.SELECT }
    );
    console.log('✅ Sample chunks:', samples);
  } catch (error: any) {
    console.error('❌ Sample query failed:', error.message);
  }

  console.log('\n✨ Diagnostics complete!\n');
}

// Run diagnostics
if (require.main === module) {
  debugAISearch()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export default debugAISearch;