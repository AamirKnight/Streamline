
'use client';

import { useState, useEffect } from 'react';
import { workflowService, Workflow, WorkflowState } from '@/lib/workflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkflowStatus } from './WorkflowStatus';
import { WorkflowTimeline } from './WorkflowTimeline';
import { ApprovalForm } from './ApprovalForm';
import { toast } from 'sonner';
import { 
  Send, 
  CheckCircle, 
  AlertCircle,
  Shield
} from 'lucide-react';

interface WorkflowPanelProps {
  documentId: string;
  userId: number;
}

export function WorkflowPanel({ documentId, userId }: WorkflowPanelProps) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApprovalForm, setShowApprovalForm] = useState(false);

  useEffect(() => {
    loadWorkflow();
  }, [documentId]);

  const loadWorkflow = async () => {
    try {
      const data = await workflowService.getWorkflow(documentId);
      setWorkflow(data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to load workflow');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      await workflowService.transitionState(documentId, WorkflowState.IN_REVIEW);
      toast.success('Document submitted for review');
      loadWorkflow();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit for review');
    }
  };

  const handleApprovalSubmit = async (action: 'approved' | 'rejected' | 'requested_changes', comment?: string) => {
    try {
      await workflowService.submitApproval(documentId, action, comment);
      toast.success('Approval submitted successfully');
      setShowApprovalForm(false);
      loadWorkflow();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit approval');
    }
  };

  const handlePublish = async () => {
    try {
      await workflowService.transitionState(documentId, WorkflowState.PUBLISHED);
      toast.success('Document published');
      loadWorkflow();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to publish');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!workflow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Approval Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            This document doesn&apos;t have an approval workflow yet.
          </p>
          <Button onClick={handleSubmitForReview} className="w-full">
            <Send className="w-4 h-4 mr-2" />
            Submit for Review
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isApprover = workflow.requiredApprovers.includes(userId);
  const hasApproved = workflow.approvals.some(a => a.userId === userId);
  const canApprove = isApprover && !hasApproved && workflow.currentState === WorkflowState.IN_REVIEW;

  const approvedCount = workflow.approvals.filter(a => a.action === 'approved').length;
  const requiredCount = workflow.requiredApprovers.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Approval Workflow
          </span>
          <WorkflowStatus state={workflow.currentState} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Approvers Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Approvals</span>
            <span className="text-sm text-gray-600">
              {approvedCount} / {requiredCount}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${(approvedCount / requiredCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Approval Actions */}
        {canApprove && (
          <div className="space-y-2">
            <p className="text-sm text-gray-700 font-medium">
              You are required to review this document
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowApprovalForm(true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => setShowApprovalForm(true)}
                variant="outline"
                className="flex-1"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Request Changes
              </Button>
            </div>
          </div>
        )}

        {/* Publish Button */}
        {workflow.currentState === WorkflowState.APPROVED && (
          <Button onClick={handlePublish} className="w-full">
            Publish Document
          </Button>
        )}

        {/* Timeline */}
        <WorkflowTimeline workflow={workflow} />

        {/* Approval Form Modal */}
        {showApprovalForm && (
          <ApprovalForm
            onSubmit={handleApprovalSubmit}
            onCancel={() => setShowApprovalForm(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}