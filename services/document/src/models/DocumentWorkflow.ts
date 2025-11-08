import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export enum WorkflowState {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  CHANGES_REQUESTED = 'changes_requested',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export interface IDocumentWorkflow extends MongooseDocument {
  documentId: string;
  workspaceId: number;
  currentState: WorkflowState;
  requiredApprovers: number[]; // User IDs
  approvals: Array<{
    userId: number;
    action: 'approved' | 'rejected' | 'requested_changes';
    comment?: string;
    timestamp: Date;
    signature: string; // SHA-256 hash
  }>;
  stateHistory: Array<{
    fromState: WorkflowState;
    toState: WorkflowState;
    triggeredBy: number;
    timestamp: Date;
    reason?: string;
  }>;
  metadata: {
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
  };
}

const workflowSchema = new Schema<IDocumentWorkflow>({
  documentId: {
    type: String,
    required: true,
    index: true,
  },
  workspaceId: {
    type: Number,
    required: true,
    index: true,
  },
  currentState: {
    type: String,
    enum: Object.values(WorkflowState),
    default: WorkflowState.DRAFT,
  },
  requiredApprovers: [{
    type: Number,
  }],
  approvals: [{
    userId: Number,
    action: {
      type: String,
      enum: ['approved', 'rejected', 'requested_changes'],
    },
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    signature: String,
  }],
  stateHistory: [{
    fromState: String,
    toState: String,
    triggeredBy: Number,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    reason: String,
  }],
  metadata: {
    createdBy: Number,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
}, {
  timestamps: false,
});

// Indexes
workflowSchema.index({ documentId: 1 }, { unique: true });
workflowSchema.index({ workspaceId: 1, currentState: 1 });
workflowSchema.index({ 'requiredApprovers': 1 });

export default mongoose.model<IDocumentWorkflow>('DocumentWorkflow', workflowSchema);