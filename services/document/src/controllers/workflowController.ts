import { Request, Response } from 'express';
import Document from '../models/Document';
import DocumentWorkflow, { WorkflowState } from '../models/DocumentWorkflow';
import AuditLog from '../models/AuditLogs';
import { WorkflowStateMachine } from '../utils/workFlowStateMachine';
import { CryptoSigner } from '../utils/cryptoSigner';
import logger from '../utils/logger';

export const createWorkflow = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { requiredApprovers } = req.body;
    const userId = req.user?.id;

    // Check if document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if workflow already exists
    const existingWorkflow = await DocumentWorkflow.findOne({ documentId });
    if (existingWorkflow) {
      return res.status(400).json({ error: 'Workflow already exists for this document' });
    }

    // Create workflow
    const workflow = await DocumentWorkflow.create({
      documentId,
      workspaceId: document.workspaceId,
      currentState: WorkflowState.DRAFT,
      requiredApprovers: requiredApprovers || [],
      approvals: [],
      stateHistory: [],
      metadata: {
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog({
      documentId,
      workspaceId: document.workspaceId,
      userId: userId!,
      action: 'workflow.created',
      details: {
        initialState: WorkflowState.DRAFT,
      },
      req,
    });

    logger.info('Workflow created', { documentId, userId });

    res.status(201).json({
      message: 'Workflow created successfully',
      workflow,
    });
  } catch (error: any) {
    logger.error('Create workflow error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const transitionState = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { toState, reason } = req.body;
    const userId = req.user?.id;

    const workflow = await DocumentWorkflow.findOne({ documentId });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Validate transition
    try {
      WorkflowStateMachine.validateTransition(workflow.currentState, toState);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    const fromState = workflow.currentState;

    // Update workflow state
    workflow.currentState = toState;
    workflow.stateHistory.push({
      fromState,
      toState,
      triggeredBy: userId!,
      timestamp: new Date(),
      reason,
    });
    workflow.metadata.updatedAt = new Date();

    await workflow.save();

    // Create audit log
    await createAuditLog({
      documentId,
      workspaceId: workflow.workspaceId,
      userId: userId!,
      action: 'workflow.state_changed',
      details: {
        oldState: fromState,
        newState: toState,
        reason,
      },
      req,
    });

    logger.info('Workflow state changed', { documentId, fromState, toState, userId });

    res.json({
      message: 'State transitioned successfully',
      workflow,
    });
  } catch (error: any) {
    logger.error('Transition state error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const submitApproval = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { action, comment } = req.body; // action: 'approved' | 'rejected' | 'requested_changes'
    const userId = req.user?.id;

    const workflow = await DocumentWorkflow.findOne({ documentId });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Check if user is required approver
    if (!workflow.requiredApprovers.includes(userId!)) {
      return res.status(403).json({ error: 'Not authorized to approve' });
    }

    // Check if already approved
    const existingApproval = workflow.approvals.find(a => a.userId === userId);
    if (existingApproval) {
      return res.status(400).json({ error: 'Already submitted approval' });
    }

    // Generate cryptographic signature
    const timestamp = new Date();
    const previousHash = workflow.approvals.length > 0
      ? workflow.approvals[workflow.approvals.length - 1].signature
      : '0';

    const signature = CryptoSigner.signApprovalAction({
      userId: userId!,
      documentId,
      action,
      timestamp,
      previousHash,
    });

    // Add approval
    workflow.approvals.push({
      userId: userId!,
      action,
      comment,
      timestamp,
      signature,
    });

    workflow.metadata.updatedAt = new Date();
    await workflow.save();

    // Create audit log
    await createAuditLog({
      documentId,
      workspaceId: workflow.workspaceId,
      userId: userId!,
      action: `workflow.${action}`,
      details: {
        comment,
        signature,
      },
      req,
    });

    // Auto-transition if all approved
    if (action === 'approved') {
      const allApproved = workflow.requiredApprovers.every(approverId =>
        workflow.approvals.some(a => a.userId === approverId && a.action === 'approved')
      );

      if (allApproved && workflow.currentState === WorkflowState.IN_REVIEW) {
        workflow.currentState = WorkflowState.APPROVED;
        workflow.stateHistory.push({
          fromState: WorkflowState.IN_REVIEW,
          toState: WorkflowState.APPROVED,
          triggeredBy: userId!,
          timestamp: new Date(),
          reason: 'All required approvals received',
        });
        await workflow.save();
      }
    }

    logger.info('Approval submitted', { documentId, userId, action });

    res.json({
      message: 'Approval submitted successfully',
      workflow,
    });
  } catch (error: any) {
    logger.error('Submit approval error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getWorkflow = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    const workflow = await DocumentWorkflow.findOne({ documentId });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json({ workflow });
  } catch (error: any) {
    logger.error('Get workflow error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { workspaceId } = req.query;

    const query: any = {
      requiredApprovers: userId,
      currentState: WorkflowState.IN_REVIEW,
    };

    if (workspaceId) {
      query.workspaceId = parseInt(workspaceId as string);
    }

    const workflows = await DocumentWorkflow.find(query);

    // Filter out documents user already approved
    const pending = workflows.filter(workflow =>
      !workflow.approvals.some(a => a.userId === userId)
    );

    // Fetch document details
    const documentIds = pending.map(w => w.documentId);
    const documents = await Document.find({ _id: { $in: documentIds } });

    const results = pending.map(workflow => {
      const doc = documents.find(d => d._id.toString() === workflow.documentId);
      return {
        workflow,
        document: doc,
      };
    });

    res.json({ pendingApprovals: results, count: results.length });
  } catch (error: any) {
    logger.error('Get pending approvals error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to create audit logs
async function createAuditLog(data: {
  documentId: string;
  workspaceId: number;
  userId: number;
  action: string;
  details: any;
  req: Request;
}) {
  // Get previous hash
  const lastLog = await AuditLog.findOne({
    documentId: data.documentId,
  }).sort({ 'metadata.timestamp': -1 });

  const previousHash = lastLog?.signature || '0';
  const timestamp = new Date();

  const signature = CryptoSigner.generateAuditSignature({
    documentId: data.documentId,
    userId: data.userId,
    action: data.action,
    timestamp,
    previousHash,
  });

  await AuditLog.create({
    documentId: data.documentId,
    workspaceId: data.workspaceId,
    userId: data.userId,
    action: data.action,
    details: data.details,
    metadata: {
      ip: data.req.ip,
      userAgent: data.req.get('user-agent'),
      timestamp,
    },
    signature,
    previousHash,
  });
}