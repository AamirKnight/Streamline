import { Request, Response } from 'express';
import Document from '../models/Document';
import DocumentVersion from '../models/DocumentVersion';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import logger from '../utils/logger';
import { Server } from 'socket.io';
import { cache } from '../utils/cahce';
import aiPublisher from '../utils/aiPublisher'

export const createDocument = async (req: Request, res: Response) => {
  try {
    const { title, content, workspaceId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
    }

    if (!title) {
      return res.status(400).json({ error: ERROR_MESSAGES.TITLE_REQUIRED });
    }

    if (!workspaceId) {
      return res.status(400).json({ error: ERROR_MESSAGES.WORKSPACE_ID_REQUIRED });
    }

    const document = await Document.create({
      title,
      content: content || '',
      workspaceId,
      createdBy: userId,
      lastEditedBy: userId,
      version: 1,
    });

    await DocumentVersion.create({
      documentId: document._id.toString(),
      content: content || '',
      versionNumber: 1,
      createdBy: userId,
    });

    // Queue for AI indexing
    await aiPublisher.publishForIndexing(
      document._id.toString(),
      document.workspaceId,
      document.content,
      'create'
    );

    logger.info('Document created', { documentId: document._id, userId });

    res.status(201).json({
      message: SUCCESS_MESSAGES.DOCUMENT_CREATED,
      document,
    });
  } catch (error: any) {
    logger.error('Create document error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const { workspaceId, search } = req.query;
    const userId = req.user?.id;

    if (!workspaceId) {
      return res.status(400).json({ error: ERROR_MESSAGES.WORKSPACE_ID_REQUIRED });
    }

    let query: any = { workspaceId: parseInt(workspaceId as string) };

    if (search) {
      query.$text = { $search: search as string };
    }

    const documents = await Document.find(query)
      .sort({ updatedAt: -1 })
      .limit(100);

    res.json({ documents });
  } catch (error: any) {
    logger.error('Get documents error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ error: ERROR_MESSAGES.DOCUMENT_NOT_FOUND });
    }

    // Queue for AI deletion
    await aiPublisher.publishForIndexing(
      documentId,
      document.workspaceId,
      '',
      'delete'
    );

    await Document.findByIdAndDelete(documentId);
    await DocumentVersion.deleteMany({ documentId });

    logger.info('Document deleted', { documentId });

    res.json({ message: SUCCESS_MESSAGES.DOCUMENT_DELETED });
  } catch (error: any) {
    logger.error('Delete document error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getDocumentVersions = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ error: ERROR_MESSAGES.DOCUMENT_NOT_FOUND });
    }

    const versions = await DocumentVersion.find({ documentId })
      .sort({ versionNumber: -1 })
      .limit(50);

    res.json({ versions });
  } catch (error: any) {
    logger.error('Get versions error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const searchDocuments = async (req: Request, res: Response) => {
  try {
    const { query, workspaceId } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let searchQuery: any = {
      $text: { $search: query as string },
    };

    if (workspaceId) {
      searchQuery.workspaceId = parseInt(workspaceId as string);
    }

    const documents = await Document.find(searchQuery)
      .sort({ score: { $meta: 'textScore' } })
      .limit(20);

    res.json({ documents });
  } catch (error: any) {
    logger.error('Search documents error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getDocumentById = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    const cacheKey = `document:${documentId}`;
    const cachedDoc = await cache.get(cacheKey);

    if (cachedDoc) {
      return res.json({ document: cachedDoc });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ error: ERROR_MESSAGES.DOCUMENT_NOT_FOUND });
    }

    await cache.set(cacheKey, document, 3600);

    res.json({ document });
  } catch (error: any) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_DOCUMENT_ID });
    }
    logger.error('Get document error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { title, content } = req.body;
    const userId = req.user?.id;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ error: ERROR_MESSAGES.DOCUMENT_NOT_FOUND });
    }

    if (title) document.title = title;
    if (content !== undefined) {
      document.content = content;
      document.version += 1;

      await DocumentVersion.create({
        documentId: document._id.toString(),
        content,
        versionNumber: document.version,
        createdBy: userId!,
      });
    }

    document.lastEditedBy = userId;
    await document.save();

    // Queue for AI re-indexing
    await aiPublisher.publishForIndexing(
      document._id.toString(),
      document.workspaceId,
      document.content,
      'update'
    );

    await cache.del(`document:${documentId}`);
    await cache.delPattern(`documents:workspace:${document.workspaceId}*`);

    logger.info('Document updated', { documentId, userId });

    const io: Server = req.app.get('io');
    if (io) {
      io.to(`document:${documentId}`).emit('document:updated', {
        documentId,
        title: document.title,
        content: document.content,
        version: document.version,
        updatedBy: userId,
        timestamp: Date.now(),
      });
    }

    res.json({
      message: SUCCESS_MESSAGES.DOCUMENT_UPDATED,
      document,
    });
  } catch (error: any) {
    logger.error('Update document error:', error);
    res.status(500).json({ error: error.message });
  }
};