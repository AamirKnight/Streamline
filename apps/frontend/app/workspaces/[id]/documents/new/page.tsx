'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { documentService } from '@/lib/document';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const documentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

export default function NewDocumentPage() {
  const params = useParams();
  const workspaceId = parseInt(params.id as string);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
  });

  const onSubmit = async (data: DocumentFormData) => {
    setLoading(true);
    try {
      const document = await documentService.createDocument({
        ...data,
        workspaceId,
      });
      toast.success('Document created successfully');
      router.push(`/documents/${document._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Create New Document</CardTitle>
              <CardDescription>
                Start a new document in this workspace
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Document Title *</Label>
                  <Input
                    id="title"
                    placeholder="Untitled Document"
                    {...register('title')}
                    disabled={loading}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Initial Content (Optional)</Label>
                  <textarea
                    id="content"
                    className="w-full min-h-[200px] px-3 py-2 border rounded-md"
                    placeholder="Start writing..."
                    {...register('content')}
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Creating...' : 'Create Document'}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}