import { Request, Response } from 'express';
import geminiService from '../services/geminiService';
import axios from 'axios';
import { config } from '../config';
import logger from '../utils/logger';

export const improveWriting = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { text } = req.body;

    if (!text || text.length === 0) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    if (text.length > 2000) {
      res.status(400).json({ error: 'Text too long (max 2000 characters)' });
      return;
    }

    const improved = await geminiService.improveWriting(text);

    res.json({
      original: text,
      improved,
    });
  } catch (error: any) {
    logger.error('Improve writing error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const detectInconsistencies = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { documentId, compareWithDocumentIds } = req.body;

    const mainDoc = await axios.get(
      `${config.documentServiceUrl}/documents/${documentId}`,
      { headers: { Authorization: req.headers.authorization } }
    );

    const compareDocs = await Promise.all(
      (compareWithDocumentIds || []).slice(0, 3).map((id: string) =>
        axios.get(`${config.documentServiceUrl}/documents/${id}`, {
          headers: { Authorization: req.headers.authorization },
        })
      )
    );

    const inconsistencies: any[] = [];

    for (const compareDoc of compareDocs) {
      const conflicts = await geminiService.detectInconsistencies(
        mainDoc.data.document.content,
        compareDoc.data.document.content
      );

      if (conflicts.length > 0) {
        inconsistencies.push({
          documentId: compareDoc.data.document._id,
          documentTitle: compareDoc.data.document.title,
          conflicts,
        });
      }
    }

    res.json({
      documentId,
      inconsistencies,
      foundIssues: inconsistencies.length > 0,
    });
  } catch (error: any) {
    logger.error('Detect inconsistencies error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const resolveConflict = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { original, versionA, versionB } = req.body;

    if (!original || !versionA || !versionB) {
      res.status(400).json({
        error: 'original, versionA, and versionB are required',
      });
      return;
    }

    const merged = await geminiService.mergeConflicts(
      original,
      versionA,
      versionB
    );

    res.json({
      original,
      versionA,
      versionB,
      merged,
      explanation: 'AI merged both versions intelligently',
    });
  } catch (error: any) {
    logger.error('Resolve conflict error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const autocomplete = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { context } = req.body;

    if (!context) {
      res.status(400).json({ error: 'Context is required' });
      return;
    }

    const words = context.split(/\s+/);
    const recentContext = words.slice(-100).join(' ');

    const prompt = `Continue this text naturally (1-2 sentences only):

${recentContext}

Respond with ONLY the continuation, no explanations.`;

    const continuation = await geminiService.generateText(prompt);

    res.json({
      suggestion: continuation.trim(),
      context: recentContext.slice(-200),
    });
  } catch (error: any) {
    logger.error('Autocomplete error:', error);
    res.status(500).json({ error: error.message });
  }
};