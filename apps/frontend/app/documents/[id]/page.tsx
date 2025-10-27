'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import History from '@tiptap/extension-history';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { documentService, type Document } from '@/lib/document';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { Save, ArrowLeft, Users } from 'lucide-react';

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // ✅ Fix: provide initial value as null to useRef
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Socket.io connection
  const { connected, users, emitChange, onDocumentChange } = useSocket(documentId);

  // ✅ TipTap Editor (Tiptap v3 setup)
  const editor = useEditor({
    extensions: [
      StarterKit, // No history config here
      History.configure({
        depth: 100,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: '',
    editable: true,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();

      // Broadcast change to other users
      if (document) {
        emitChange(html, document.version);
      }

      // Auto-save after 2 seconds of inactivity
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(html);
      }, 2000);
    },
  });

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  useEffect(() => {
    // Listen for changes from other users
    onDocumentChange((data: any) => {
      console.log('Received change from:', data.username);
      if (editor && !editor.isFocused) {
        editor.commands.setContent(data.content);
      }
    });
  }, [editor]);

  const loadDocument = async () => {
    try {
      const doc = await documentService.getDocument(documentId);
      setDocument(doc);
      setTitle(doc.title);
      if (editor) {
        editor.commands.setContent(doc.content);
      }
    } catch (error: any) {
      toast.error('Failed to load document');
    }
  };

  const handleAutoSave = async (content: string) => {
    if (!document) return;

    try {
      await documentService.updateDocument(documentId, {
        title,
        content,
      });
      setLastSaved(new Date());
      console.log('Auto-saved');
    } catch (error: any) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleManualSave = async () => {
    if (!document || !editor) return;

    setSaving(true);
    try {
      const content = editor.getHTML();
      await documentService.updateDocument(documentId, {
        title,
        content,
      });
      setLastSaved(new Date());
      toast.success('Document saved');
    } catch (error: any) {
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  if (!document || !editor) {
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
        <div className="space-y-0">
          {/* Editor Header */}
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div className="flex items-center gap-4 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/workspaces/${document.workspaceId}`)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>

              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold border-none focus:ring-0 max-w-md"
                placeholder="Untitled Document"
              />

              {lastSaved && (
                <span className="text-sm text-gray-500">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Active Users */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">
                  {users.length} online
                </span>
                {connected ? (
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                ) : (
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </div>

              <Button onClick={handleManualSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Active Users List */}
          {users.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Currently editing:
              </p>
              <div className="flex flex-wrap gap-2">
                {users.map((user) => (
                  <span
                    key={user.socketId}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                  >
                    {user.username}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Editor */}
          <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
            <EditorToolbar editor={editor} />
            <div className="tiptap-editor">
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-4 mt-4">
            <div>
              Version {document.version} • {editor.storage.characterCount?.characters() || 0} characters
            </div>
            <div>
              Last edited {new Date(document.updatedAt).toLocaleString()}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
