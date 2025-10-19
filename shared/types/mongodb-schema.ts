// Documents Collection
export interface Document {
  _id: string;
  title: string;
  content: string;
  workspaceId: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

// Document Versions (for version history)
export interface DocumentVersion {
  _id: string;
  documentId: string;
  content: string;
  createdBy: number;
  createdAt: Date;
  versionNumber: number;
}

// In-app Notifications
export interface Notification {
  _id: string;
  userId: number;
  type: 'document_shared' | 'user_invited' | 'comment_added';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  relatedId?: string; // document or workspace id
}

// Audit Logs
export interface AuditLog {
  _id: string;
  userId: number;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}