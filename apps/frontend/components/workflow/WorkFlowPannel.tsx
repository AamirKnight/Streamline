// apps/frontend/components/workflow/WorkFlowPannel.tsx
'use client';

import { useState, useEffect } from 'react';
import { workflowService, Workflow, WorkflowState } from '@/lib/workflow';
import { workspaceService } from '@/lib/workspace';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { WorkflowStatus } from './WorkflowStatus';
import { WorkflowTimeline } from './WorkflowTimeline';
import { ApprovalForm } from './ApprovalForm';
import { toast } from 'sonner';
import { 
  Send, 
  CheckCircle, 
  Shield,
  Plus,
  X,
  UserCheck
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
  
  // 🆕 NEW: Workspace members state
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<number[]>([]);
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);

  useEffect(() => {
    loadWorkflow();
  }, [documentId]);

  // 🆕 NEW: Load workspace members when creating workflow
  useEffect(() => {
    if (showCreateForm && workspaceId) {
      loadWorkspaceMembers();
    }
  }, [showCreateForm, workspaceId]);

  const loadWorkflow = async () => {
    try {
      const data = await workflowService.getWorkflow(documentId);
      setWorkflow(data);
      setWorkspaceId(data.workspaceId);
      setShowCreateForm(false);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setWorkflow(null);
        // Get workspace ID from document
        fetchDocumentWorkspace();
      } else {
        toast.error('Failed to load workflow');
      }
    } finally {
      setLoading(false);
    }
  };

  // 🆕 NEW: Fetch document to get workspace ID
  const fetchDocumentWorkspace = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_DOCUMENT_URL}/documents/${documentId}`, {
        headers: { 
          Authorization: `Bearer ${document.cookie.split('accessToken=')[1]?.split(';')[0]}` 
        }
      });
      const data = await response.json();
      setWorkspaceId(data.document.workspaceId);
    } catch (error) {
      console.error('Failed to fetch document workspace:', error);
    }
  };

  // 🆕 NEW: Load workspace members
  const loadWorkspaceMembers = async () => {
    if (!workspaceId) return;
    
    try {
      const members = await workspaceService.getMembers(workspaceId);
      // Filter out current user (can't approve own document)
      const otherMembers = members.filter((m: any) => m.userId !== userId);
      setWorkspaceMembers(otherMembers);
    } catch (error) {
      toast.error('Failed to load workspace members');
    }
  };

  // 🆕 NEW: Toggle approver selection
  const toggleApprover = (memberId: number) => {
    setSelectedApprovers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleCreateWorkflow = async () => {
    if (selectedApprovers.length === 0) {
      toast.error('Please select at least one approver');
      return;
    }

    try {
      await workflowService.createWorkflow(documentId, selectedApprovers);
      toast.success('Workflow created successfully');
      loadWorkflow();
      setSelectedApprovers([]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create workflow');
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
                <Label className="flex items-center gap-2 mb-3">
                  <UserCheck className="w-4 h-4" />
                  Select Approvers (Required)
                </Label>
                
                {workspaceMembers.length === 0 ? (
                  <p className="text-sm text-gray-600 py-4 text-center border rounded">
                    No other members in this workspace. 
                    <br />
                    Invite team members first.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-2">
                    {workspaceMembers.map((member) => (
                      <div
                        key={member.userId}
                        onClick={() => toggleApprover(member.userId)}
                        className={`
                          flex items-center justify-between p-3 rounded cursor-pointer transition
                          ${selectedApprovers.includes(member.userId)
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                          }
                        `}
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {member.user?.username || `User #${member.userId}`}
                          </p>
                          <p className="text-xs text-gray-600">
                            {member.role}
                          </p>
                        </div>
                        {selectedApprovers.includes(member.userId) && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedApprovers.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-900">
                    ✓ {selectedApprovers.length} approver{selectedApprovers.length > 1 ? 's' : ''} selected
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedApprovers([]);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateWorkflow}
                  disabled={selectedApprovers.length === 0}
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
            <Button
              onClick={() => setShowApprovalForm(true)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Review Now
            </Button>
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