import axios from 'axios';
import vectorService from '../services/vectorService';
import logger from '../utils/logger';

const DOCUMENT_SERVICE_URL = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:3003';
const AUTH_TOKEN = process.env.ADMIN_AUTH_TOKEN || '';

async function reindexAllDocuments() {
  console.log('🔄 Starting document reindexing...\n');

  if (!AUTH_TOKEN) {
    console.error('❌ ADMIN_AUTH_TOKEN not set in environment');
    console.log('   Get a token by logging in and copy from browser devtools');
    return;
  }

  try {
    // Get all workspaces (you'll need to adjust this)
    const workspaceIds = [1]; // Replace with actual workspace IDs

    for (const workspaceId of workspaceIds) {
      console.log(`\n📂 Processing workspace ${workspaceId}...`);

      // Fetch all documents in workspace
      const response = await axios.get(
        `${DOCUMENT_SERVICE_URL}/documents?workspaceId=${workspaceId}`,
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
      );

      const documents = response.data.documents || [];
      console.log(`   Found ${documents.length} documents`);

      // Index each document
      for (const doc of documents) {
        console.log(`   📄 Indexing: ${doc.title}`);
        try {
          await vectorService.indexDocument(
            doc._id,
            doc.workspaceId,
            doc.content
          );
          console.log(`   ✅ Indexed successfully`);
        } catch (error: any) {
          console.error(`   ❌ Failed: ${error.message}`);
        }
      }
    }

    console.log('\n✨ Reindexing complete!\n');
  } catch (error: any) {
    console.error('❌ Reindex failed:', error.message);
  }
}

if (require.main === module) {
  reindexAllDocuments()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export default reindexAllDocuments;