// services/document/src/models/AuditLogs.ts
import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IAuditLog extends MongooseDocument {
  documentId: string;
  workspaceId: number;
  userId: number;
  action: string;
  details: {
    oldState?: string;
    newState?: string;
    changes?: any;
  };
  metadata: {
    ip: string;
    userAgent: string;
    timestamp: Date;
  };
  signature: string; // Hash chain
  previousHash: string;
}

const auditLogSchema = new Schema<IAuditLog>({
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
  userId: {
    type: Number,
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Document actions
      'document.created',
      'document.updated',
      'document.deleted',
      
      // Workflow actions
      'workflow.created',              // ✅ Added this
      'workflow.state_changed',
      'workflow.approval_requested',
      'workflow.approved',
      'workflow.rejected',
      'workflow.changes_requested',
      
      // Additional workflow actions
      'workflow.published',            // ✅ Added this
      'workflow.archived',             // ✅ Added this
      'workflow.reverted',             // ✅ Added this
    ],
  },
  details: {
    oldState: String,
    newState: String,
    changes: Schema.Types.Mixed,
  },
  metadata: {
    ip: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  signature: {
    type: String,
    required: true,
  },
  previousHash: {
    type: String,
  },
}, {
  timestamps: false,
});

// Indexes
auditLogSchema.index({ documentId: 1, 'metadata.timestamp': -1 });
auditLogSchema.index({ workspaceId: 1, 'metadata.timestamp': -1 });
auditLogSchema.index({ userId: 1 });

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);