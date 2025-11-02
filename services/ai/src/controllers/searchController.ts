import { Request, Response } from 'express';
import vectorService from '../services/vectorService';
import axios from 'axios';
import { config } from '../config';
import logger from '../utils/logger';

export const semanticSearch = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { query, workspaceId, topK = 5 } = req.body;

    if (!query || !workspaceId) {
      res.status(400).json({ error: 'Query and workspaceId are required' });
      return;
    }

    const results = await vectorService.searchSimilarDocuments(
      query,
      parseInt(workspaceId as string),
      parseInt(topK as string)
    );

    const documentMap = new Map<string, any>();

    for (const result of results) {
      if (!documentMap.has(result.documentId)) {
        try {
          const docResponse = await axios.get(
            `${config.documentServiceUrl}/documents/${result.documentId}`,
            {
              headers: { Authorization: req.headers.authorization },
            }
          );

          documentMap.set(result.documentId, {
            ...docResponse.data.document,
            relevantChunks: [],
            maxSimilarity: 0,
          });
        } catch (error) {
          logger.error('Failed to fetch document:', result.documentId);
        }
      }

      const doc = documentMap.get(result.documentId);
      if (doc) {
        doc.relevantChunks.push({
          text: result.chunkText,
          chunkIndex: result.chunkIndex,
          similarity: result.similarity,
        });
        doc.maxSimilarity = Math.max(doc.maxSimilarity, result.similarity);
      }
    }

    const documents = Array.from(documentMap.values()).sort(
      (a, b) => b.maxSimilarity - a.maxSimilarity
    );

    res.json({
      query,
      results: documents,
      count: documents.length,
    });
  } catch (error: any) {
    logger.error('Semantic search error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const indexDocument = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { documentId, workspaceId, content } = req.body;

    if (!documentId || !workspaceId || !content) {
      res.status(400).json({
        error: 'documentId, workspaceId, and content are required',
      });
      return;
    }

    await vectorService.indexDocument(documentId, workspaceId, content);

    res.json({
      message: 'Document indexed successfully',
      documentId,
    });
  } catch (error: any) {
    logger.error('Index document error:', error);
    res.status(500).json({ error: error.message });
  }
};