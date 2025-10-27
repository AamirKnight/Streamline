'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { workspaceService, type Workspace } from '@/lib/workspace';
import { documentService, type Document } from '@/lib/document';
import { toast } from 'sonner';
import { Plus, FileText, Clock, ArrowLeft } from 'lucide-react';

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = parseInt(params.id as string);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceId]);

  const loadWorkspaceData = async () => {
    try {
      const [workspaceData, documentsData] = await Promise.all([
        workspaceService.getWorkspace(workspaceId),
        documentService.getDocuments(workspaceId),
      ]);
      setWorkspace(workspaceData);
      setDocuments(documentsData);
    } catch (error: any) {
      toast.error('Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = () => {
    router.push(`/workspaces/${workspaceId}/documents/new`);
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

  if (!workspace) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold">Workspace not found</h2>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push('/workspaces')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workspaces
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{workspace.name}</h1>
                <p className="text-gray-600 mt-1">
                  {workspace.description || 'No description'}
                </p>
                <span className="inline-block mt-2 bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                  {workspace.role}
                </span>
              </div>
              <Button onClick={handleCreateDocument}>
                <Plus className="w-4 h-4 mr-2" />
                New Document
              </Button>
            </div>
          </div>

          {/* Documents List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Documents</h2>
            
            {documents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No documents yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Create your first document to start collaborating
                  </p>
                  <Button onClick={handleCreateDocument}>
                    Create Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <Card
                    key={doc._id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/documents/${doc._id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {doc.content.substring(0, 100) || 'Empty document'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>
                          {new Date(doc.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}