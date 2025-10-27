'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { workspaceService } from '@/lib/workspace';
import { documentService, type Document } from '@/lib/document';
import { toast } from 'sonner';
import { FileText, Clock } from 'lucide-react';

export default function AllDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadAllDocuments();
  }, []);

  const loadAllDocuments = async () => {
    try {
      // Get all workspaces first
      const workspaces = await workspaceService.getWorkspaces();
      
      // Get documents from all workspaces
      const allDocs = await Promise.all(
        workspaces.map(w => documentService.getDocuments(w.id))
      );
      
      // Flatten array
      setDocuments(allDocs.flat());
    } catch (error: any) {
      toast.error('Failed to load documents');
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
            <h1 className="text-3xl font-bold">All Documents</h1>
            <p className="text-gray-600 mt-1">
              Recent documents across all workspaces
            </p>
          </div>

          {documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No documents yet
                </h3>
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}