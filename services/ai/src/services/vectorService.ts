// services/ai/src/services/vectorService.ts
import { QueryTypes } from 'sequelize';
import sequelize from '../database';
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
  
  return chunks.length > 0 ? chunks : [text];
}

class VectorService {
  /**
   * Search for similar documents using vector similarity
   */
  async searchSimilarDocuments(
    query: string,
    workspaceId: number,
    topK: number = 5,
    threshold: number = 0.3  // Lowered for better results
  ): Promise<SearchResult[]> {
    try {
      logger.info('Starting vector search', { 
        query: query.substring(0, 50),
        workspaceId,
        topK 
      });

      // Generate query embedding
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      logger.info('Query embedding generated', { 
        dimension: queryEmbedding.length 
      });

      const vectorString = `[${queryEmbedding.join(',')}]`;

      // Perform vector similarity search
      const results = await sequelize.query<SearchResult>(
        `
        SELECT 
          document_id as "documentId",
          chunk_text as "chunkText",
          chunk_index as "chunkIndex",
          (1 - (embedding <=> $1::vector))::float as similarity
        FROM document_embeddings
        WHERE workspace_id = $2
          AND (1 - (embedding <=> $1::vector)) > $3
        ORDER BY embedding <=> $1::vector
        LIMIT $4
        `,
        {
          bind: [vectorString, workspaceId, threshold, topK * 3],
          type: QueryTypes.SELECT,
        }
      );

      logger.info('Vector search completed', { 
        resultsCount: results.length,
        topSimilarity: results[0]?.similarity 
      });

      // Filter and limit results
      const filteredResults = results
        .filter(r => r.similarity > threshold)
        .slice(0, topK);

      return filteredResults;
    } catch (error: any) {
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
      logger.info('Starting document indexing', { 
        documentId,
        contentLength: content.length 
      });

      // Delete existing embeddings using raw SQL
      await sequelize.query(
        'DELETE FROM document_embeddings WHERE document_id = $1',
        { bind: [documentId], type: QueryTypes.DELETE }
      );

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

      // Insert embeddings using raw SQL
      for (let i = 0; i < chunks.length; i++) {
        const vectorString = `[${embeddings[i].join(',')}]`;
        
        await sequelize.query(
          `
          INSERT INTO document_embeddings 
            (document_id, workspace_id, chunk_text, chunk_index, embedding, created_at)
          VALUES 
            ($1, $2, $3, $4, $5::vector, NOW())
          `,
          {
            bind: [documentId, workspaceId, chunks[i], i, vectorString],
            type: QueryTypes.INSERT,
          }
        );
      }

      logger.info('Document indexed successfully', { 
        documentId, 
        chunkCount: chunks.length 
      });

    } catch (error: any) {
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
    logger.info(`Bulk indexing ${documents.length} documents`);

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
   * Delete all embeddings for a document (FIXED VERSION)
   */
  async deleteDocumentEmbeddings(documentId: string): Promise<void> {
    try {
      // Use raw SQL instead of Sequelize ORM
      await sequelize.query(
        'DELETE FROM document_embeddings WHERE document_id = $1',
        { bind: [documentId], type: QueryTypes.DELETE }
      );
      
      logger.info('Document embeddings deleted', { documentId });
    } catch (error: any) {
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
          COUNT(DISTINCT document_id)::int as "totalDocuments",
          COUNT(*)::int as "totalChunks"
        FROM document_embeddings
        WHERE workspace_id = $1
        `,
        {
          bind: [workspaceId],
          type: QueryTypes.SELECT,
        }
      );

      return result as any;
    } catch (error: any) {
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

  /**
   * Check if a document is indexed
   */
  async isDocumentIndexed(documentId: string): Promise<boolean> {
    try {
      const [result] = await sequelize.query(
        `
        SELECT EXISTS(
          SELECT 1 FROM document_embeddings 
          WHERE document_id = $1
        ) as exists
        `,
        {
          bind: [documentId],
          type: QueryTypes.SELECT,
        }
      );

      return (result as any).exists;
    } catch (error: any) {
      logger.error('Error checking if document indexed:', error);
      return false;
    }
  }

  /**
   * Get indexed document count for workspace
   */
  async getIndexedDocumentCount(workspaceId: number): Promise<number> {
    try {
      const [result] = await sequelize.query(
        `
        SELECT COUNT(DISTINCT document_id)::int as count
        FROM document_embeddings
        WHERE workspace_id = $1
        `,
        {
          bind: [workspaceId],
          type: QueryTypes.SELECT,
        }
      );

      return (result as any).count || 0;
    } catch (error: any) {
      logger.error('Error getting indexed document count:', error);
      return 0;
    }
  }
}

export default new VectorService();