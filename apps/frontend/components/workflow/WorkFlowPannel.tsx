// apps/frontend/components/workflow/WorkFlowPannel.tsx
'use client';

import { useState, useEffect } from 'react';
import { workflowService, Workflow, WorkflowState } from '@/lib/workflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WorkflowStatus } from './WorkflowStatus';
import { WorkflowTimeline } from './WorkflowTimeline';
import { ApprovalForm } from './ApprovalForm';
import { toast } from 'sonner';
import { 
  Send, 
  CheckCircle, 
  AlertCircle,
  Shield,
  Plus,
  X
} from 'lucide-react';

interface WorkflowPanelProps {
  documentId: string;
  userId: number;
}

export function WorkflowPanel({ documentId, userId }: WorkflowPanelProps) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [approverEmail, setApproverEmail] = useState('');
  const [approverIds, setApproverIds] = useState<number[]>([]);

  useEffect(() => {
    loadWorkflow();
  }, [documentId]);

  const loadWorkflow = async () => {
    try {
      const data = await workflowService.getWorkflow(documentId);
      setWorkflow(data);
      setShowCreateForm(false);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Workflow doesn't exist yet - show create form
        setWorkflow(null);
        setShowCreateForm(false);
      } else {
        toast.error('Failed to load workflow');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    if (approverIds.length === 0) {
      toast.error('Please add at least one approver');
      return;
    }

    try {
      await workflowService.createWorkflow(documentId, approverIds);
      toast.success('Workflow created successfully');
      loadWorkflow();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create workflow');
    }
  };

  const handleAddApprover = () => {
    // In a real app, you'd lookup the user ID by email
    // For now, just using a placeholder
    const newId = Math.floor(Math.random() * 1000);
    if (approverEmail && !approverIds.includes(newId)) {
      setApproverIds([...approverIds, newId]);
      setApproverEmail('');
      toast.success('Approver added');
    }
  };

  const handleRemoveApprover = (id: number) => {
    setApproverIds(approverIds.filter(i => i !== id));
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

  const handleApprovalSubmit = async (
    action: 'approved' | 'rejected' | 'requested_changes',
    comment?: string
  ) => {
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

  // No workflow exists - show creation UI
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
          {!showCreateForm ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                This document doesn&apos;t have an approval workflow yet.
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)} 
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Add Approvers</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="email"
                    placeholder="Enter user ID or email"
                    value={approverEmail}
                    onChange={(e) => setApproverEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddApprover()}
                  />
                  <Button onClick={handleAddApprover} size="sm">
                    Add
                  </Button>
                </div>
              </div>

              {approverIds.length > 0 && (
                <div>
                  <Label>Required Approvers ({approverIds.length})</Label>
                  <div className="space-y-2 mt-2">
                    {approverIds.map((id) => (
                      <div key={id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">User #{id}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveApprover(id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setApproverIds([]);
                    setApproverEmail('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateWorkflow}
                  disabled={approverIds.length === 0}
                  className="flex-1"
                >
                  Create Workflow
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Workflow exists - show management UI
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
        {/* Current State Actions */}
        {workflow.currentState === WorkflowState.DRAFT && (
          <Button onClick={handleSubmitForReview} className="w-full">
            <Send className="w-4 h-4 mr-2" />
            Submit for Review
          </Button>
        )}

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
                Review
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