import { Request, Response } from 'express';
import geminiService from '../services/geminiService';
import vectorService from '../services/vectorService';
import axios from 'axios';
import  cache  from '../utils/cache';
import { config } from '../config';
import logger from '../utils/logger';

export const summarizeDocument = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { documentId } = req.params;

    const cacheKey = `summary:${documentId}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const docResponse = await axios.get(
      `${config.documentServiceUrl}/documents/${documentId}`,
      {
        headers: { Authorization: req.headers.authorization },
      }
    );

    const document = docResponse.data.document;

    const summary = await geminiService.summarize(document.content);

    const result = {
      documentId,
      title: document.title,
      ...summary,
      generatedAt: new Date(),
    };

    await cache.set(cacheKey, result, 86400);

    res.json(result);
  } catch (error: any) {
    logger.error('Summarize error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getDocumentInsights = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { documentId } = req.params;

    const cacheKey = `insights:${documentId}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const docResponse = await axios.get(
      `${config.documentServiceUrl}/documents/${documentId}`,
      {
        headers: { Authorization: req.headers.authorization },
      }
    );

    const document = docResponse.data.document;

    const searchResults = await vectorService.searchSimilarDocuments(
      document.title + ' ' + document.content.slice(0, 500),
      document.workspaceId,
      5
    );

    const relatedDocs = await Promise.all(
      searchResults
        .filter((r) => r.documentId !== documentId)
        .slice(0, 3)
        .map(async (result) => {
          try {
            const response = await axios.get(
              `${config.documentServiceUrl}/documents/${result.documentId}`,
              {
                headers: { Authorization: req.headers.authorization },
              }
            );
            return response.data.document.content;
          } catch {
            return '';
          }
        })
    );

    const insights = await geminiService.generateInsights(
      document.content,
      relatedDocs.filter(Boolean)
    );

    const result = {
      documentId,
      relatedDocuments: searchResults.map((r) => ({
        documentId: r.documentId,
        similarity: r.similarity,
        snippet: r.chunkText.slice(0, 200) + '...',
      })),
      ...insights,
      generatedAt: new Date(),
    };

    await cache.set(cacheKey, result, 3600);

    res.json(result);
  } catch (error: any) {
    logger.error('Insights error:', error);
    res.status(500).json({ error: error.message });
  }
};