// apps/frontend/lib/workflow.ts
import axios from 'axios';
import Cookies from 'js-cookie';

const DOCUMENT_URL = process.env.NEXT_PUBLIC_DOCUMENT_URL || 'http://localhost:3003';

export const workflowApi = axios.create({
  baseURL: DOCUMENT_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

workflowApi.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export enum WorkflowState {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  CHANGES_REQUESTED = 'changes_requested',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export interface Workflow {
  _id: string;
  documentId: string;
  workspaceId: number;
  currentState: WorkflowState;
  requiredApprovers: number[];
  approvals: Array<{
    userId: number;
    action: 'approved' | 'rejected' | 'requested_changes';
    comment?: string;
    timestamp: Date;
    signature: string;
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

export const workflowService = {
  async createWorkflow(documentId: string, requiredApprovers: number[]) {
    const response = await workflowApi.post(`/workflows/documents/${documentId}/workflow`, {
      requiredApprovers,
    });
    return response.data;
  },

  async getWorkflow(documentId: string): Promise<Workflow> {
    const response = await workflowApi.get(`/workflows/documents/${documentId}/workflow`);
    return response.data.workflow;
  },

  async transitionState(documentId: string, toState: WorkflowState, reason?: string) {
    const response = await workflowApi.post(`/workflows/documents/${documentId}/workflow/transition`, {
      toState,
      reason,
    });
    return response.data;
  },

  async submitApproval(documentId: string, action: 'approved' | 'rejected' | 'requested_changes', comment?: string) {
    const response = await workflowApi.post(`/workflows/documents/${documentId}/workflow/approve`, {
      action,
      comment,
    });
    return response.data;
  },

  async getPendingApprovals(workspaceId?: number) {
    const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
    const response = await workflowApi.get(`/workflows/approvals/pending${params}`);
    return response.data;
  },
};