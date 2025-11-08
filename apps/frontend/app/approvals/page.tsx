
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { workflowService } from '@/lib/workflow';
import { WorkflowStatus } from '@/components/workflow/WorkflowStatus';
import { toast } from 'sonner';
import { Clock, FileText, CheckCircle } from 'lucide-react';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      const data = await workflowService.getPendingApprovals();
      setApprovals(data.pendingApprovals);
    } catch (error: any) {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Pending Approvals</h1>
            <p className="text-gray-600 mt-1">
              Documents waiting for your review
            </p>
          </div>

          {approvals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  All caught up!
                </h3>
                <p className="text-gray-600">
                  You have no pending approvals
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {approvals.map(({ workflow, document }) => (
                <Card
                  key={workflow._id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/documents/${document._id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        {document.title}
                      </CardTitle>
                      <WorkflowStatus state={workflow.currentState} showIcon={false} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {document.content.substring(0, 150)}...
                      </p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {workflow.approvals.length} / {workflow.requiredApprovers.length} approved
                        </span>
                        <span className="text-gray-500">
                          {new Date(document.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <Button className="w-full">
                        <Clock className="w-4 h-4 mr-2" />
                        Review Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}