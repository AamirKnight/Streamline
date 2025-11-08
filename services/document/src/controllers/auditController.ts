import { Request, Response } from 'express';
import AuditLog from '../models/AuditLogs';
import { CryptoSigner } from '../utils/cryptoSigner';
import logger from '../utils/logger';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { documentId, workspaceId, userId, startDate, endDate, action } = req.query;

    const query: any = {};

    if (documentId) query.documentId = documentId;
    if (workspaceId) query.workspaceId = parseInt(workspaceId as string);
    if (userId) query.userId = parseInt(userId as string);
    if (action) query.action = action;

    if (startDate || endDate) {
      query['metadata.timestamp'] = {};
      if (startDate) query['metadata.timestamp'].$gte = new Date(startDate as string);
      if (endDate) query['metadata.timestamp'].$lte = new Date(endDate as string);
    }

    const logs = await AuditLog.find(query)
      .sort({ 'metadata.timestamp': -1 })
      .limit(100);

    res.json({ logs, count: logs.length });
  } catch (error: any) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getDocumentTimeline = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    const logs = await AuditLog.find({ documentId })
      .sort({ 'metadata.timestamp': -1 })
      .limit(50);

    res.json({ timeline: logs });
  } catch (error: any) {
    logger.error('Get document timeline error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const verifyAuditIntegrity = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    const logs = await AuditLog.find({ documentId })
      .sort({ 'metadata.timestamp': 1 });

    const isValid = CryptoSigner.verifyHashChain(
      logs.map(log => ({
        signature: log.signature,
        previousHash: log.previousHash,
        documentId: log.documentId,
        userId: log.userId,
        action: log.action,
        timestamp: log.metadata.timestamp,
      }))
    );

    res.json({
      documentId,
      isValid,
      totalLogs: logs.length,
      message: isValid ? 'Audit trail is intact' : 'Audit trail has been tampered with',
    });
  } catch (error: any) {
    logger.error('Verify audit integrity error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const exportAuditLogs = async (req: Request, res: Response) => {
  try {
    const { workspaceId, startDate, endDate } = req.query;

    const query: any = {};
    if (workspaceId) query.workspaceId = parseInt(workspaceId as string);

    if (startDate || endDate) {
      query['metadata.timestamp'] = {};
      if (startDate) query['metadata.timestamp'].$gte = new Date(startDate as string);
      if (endDate) query['metadata.timestamp'].$lte = new Date(endDate as string);
    }

    const logs = await AuditLog.find(query).sort({ 'metadata.timestamp': -1 });

    // Convert to CSV
    const csvHeader = 'Timestamp,Document ID,User ID,Action,Details,Signature,IP\n';
    const csvRows = logs.map(log =>
      `${log.metadata.timestamp.toISOString()},${log.documentId},${log.userId},${log.action},"${JSON.stringify(log.details)}",${log.signature},${log.metadata.ip}`
    );

    const csv = csvHeader + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send(csv);
  } catch (error: any) {
    logger.error('Export audit logs error:', error);
    res.status(500).json({ error: error.message });
  }
};