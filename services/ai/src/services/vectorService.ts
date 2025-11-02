import { QueryTypes } from 'sequelize';
import sequelize from '../database';
import DocumentEmbedding from '../models/DocumentEmbedding';
import embeddingService from './embeddingService';
import logger from '../utils/logger';

interface SearchResult {
  documentId: string;
  chunkText: string;
  chunkIndex: number;
  similarity: number;
}

/**
 * Split text into chunks for embedding
 */
function chunkText(text: string, chunkSize: number = 400): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }
  
  return chunks.length > 0 ? chunks : [text]; // Return full text if no chunks
}

class VectorService {
  /**
   * Search for similar documents using vector similarity
   */
  async searchSimilarDocuments(
    query: string,
    workspaceId: number,
    topK: number = 5,
    threshold: number = 0.5
  ): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      const vectorString = `[${queryEmbedding.join(',')}]`;

      const results = await sequelize.query<SearchResult>(
        `
        SELECT 
          document_id as "documentId",
          chunk_text as "chunkText",
          chunk_index as "chunkIndex",
          1 - (embedding <=> $1::vector) as similarity
        FROM document_embeddings
        WHERE workspace_id = $2
          AND 1 - (embedding <=> $1::vector) > $3
        ORDER BY embedding <=> $1::vector
        LIMIT $4
        `,
        {
          bind: [vectorString, workspaceId, threshold, topK],
          type: QueryTypes.SELECT,
        }
      );

      logger.info('Vector search completed', { 
        query: query.substring(0, 50),
        resultsCount: results.length 
      });

      return results;
    } catch (error) {
      logger.error('Vector search error:', error);
      throw error;
    }
  }

  /**
   * Index a document by creating embeddings for its chunks
   */
  async indexDocument(
    documentId: string,
    workspaceId: number,
    content: string
  ): Promise<void> {
    try {
      // Delete existing embeddings for this document
      await DocumentEmbedding.destroy({ where: { documentId } });

      // Split content into chunks
      const chunks = chunkText(content, 400);

      if (chunks.length === 0) {
        logger.warn('No chunks to index', { documentId });
        return;
      }

      logger.info('Generating embeddings', {
        documentId,
        chunkCount: chunks.length,
      });

      // Generate embeddings for all chunks
      const embeddings = await embeddingService.generateBatchEmbeddings(chunks);

      // Prepare records for bulk insert using raw SQL (to handle vector type)
      const insertPromises = chunks.map(async (chunk, index) => {
        const vectorString = `[${embeddings[index].join(',')}]`;
        
        await sequelize.query(
          `
          INSERT INTO document_embeddings 
            (document_id, workspace_id, chunk_text, chunk_index, embedding, created_at, updated_at)
          VALUES 
            ($1, $2, $3, $4, $5::vector, NOW(), NOW())
          `,
          {
            bind: [documentId, workspaceId, chunk, index, vectorString],
            type: QueryTypes.INSERT,
          }
        );
      });

      await Promise.all(insertPromises);

      logger.info('Document indexed successfully', { 
        documentId, 
        chunkCount: chunks.length 
      });

    } catch (error) {
      logger.error('Document indexing error:', error);
      throw error;
    }
  }

  /**
   * Bulk index multiple documents
   */
  async indexDocuments(
    documents: Array<{
      documentId: string;
      workspaceId: number;
      content: string;
    }>
  ): Promise<void> {
    logger.info(`Indexing ${documents.length} documents`);

    for (const doc of documents) {
      try {
        await this.indexDocument(doc.documentId, doc.workspaceId, doc.content);
      } catch (error) {
        logger.error(`Failed to index document ${doc.documentId}:`, error);
        // Continue with other documents
      }
    }

    logger.info('Bulk indexing completed');
  }

  /**
   * Delete all embeddings for a document
   */
  async deleteDocumentEmbeddings(documentId: string): Promise<void> {
    try {
      await DocumentEmbedding.destroy({ where: { documentId } });
      logger.info('Document embeddings deleted', { documentId });
    } catch (error) {
      logger.error('Error deleting document embeddings:', error);
      throw error;
    }
  }

  /**
   * Get embedding statistics for a workspace
   */
  async getWorkspaceStats(workspaceId: number): Promise<{
    totalDocuments: number;
    totalChunks: number;
  }> {
    try {
      const [result] = await sequelize.query(
        `
        SELECT 
          COUNT(DISTINCT document_id) as "totalDocuments",
          COUNT(*) as "totalChunks"
        FROM document_embeddings
        WHERE workspace_id = $1
        `,
        {
          bind: [workspaceId],
          type: QueryTypes.SELECT,
        }
      );

      return result as any;
    } catch (error) {
      logger.error('Error getting workspace stats:', error);
      throw error;
    }
  }

  /**
   * Reindex a document (delete old embeddings and create new ones)
   */
  async reindexDocument(
    documentId: string,
    workspaceId: number,
    content: string
  ): Promise<void> {
    logger.info('Reindexing document', { documentId });
    await this.indexDocument(documentId, workspaceId, content);
  }
}

export default new VectorService();