// apps/frontend/app/documents/[id]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { documentService, type Document } from '@/lib/document';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { Save, ArrowLeft, Users, Wand2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PresenceAvatars } from '@/components/editor/PresenceAvatars';
import { EditorSkeleton } from '@/components/ui/skeleton';
import { AIInsightsPanel } from '@/components/ai/AIinsightPannel';
import { DocumentSummary } from '@/components/ai/DocummentSummary';
import { AIWritingAssistant } from '@/components/ai/AIWritingAssistant';
import { WorkflowPanel } from '@/components/workflow/WorkFlowPannel';

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [initialContent, setInitialContent] = useState<string>('');
  
  // Writing Assistant State
  const [selectedText, setSelectedText] = useState('');
  const [showWritingAssistant, setShowWritingAssistant] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { connected, users, emitChange, onDocumentChange } = useSocket(documentId);
  const { user } = useAuth();

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const doc = await documentService.getDocument(documentId);
        console.log('📄 Document loaded:', doc);
        
        setDocument(doc);
        setTitle(doc.title);
        setInitialContent(doc.content);
      } catch (error: any) {
        console.error('❌ Load error:', error);
        toast.error('Failed to load document');
      }
    };

    loadDocument();
  }, [documentId]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: initialContent,
    editable: true,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();

      if (document) {
        emitChange(html, document.version);
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(html);
      }, 2000);
    },
    // Capture text selection
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      
      if (text.length > 10 && text.length < 2000) {
        setSelectedText(text);
      } else {
        setSelectedText('');
      }
    },
  }, [initialContent]);

  useEffect(() => {
    onDocumentChange((data: any) => {
      console.log('Received change from:', data.username);
      if (editor && !editor.isFocused) {
        editor.commands.setContent(data.content);
      }
    });
  }, [editor]);

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

  // Handle improved text from AI
  const handleAcceptImprovedText = (improvedText: string) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    editor.chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(improvedText)
      .run();

    setShowWritingAssistant(false);
    setSelectedText('');
    toast.success('Text improved!');
  };

  if (!document || !editor) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex h-[calc(100vh-8rem)]">
            <div className="flex-1 space-y-4 overflow-y-auto pr-4">
              <EditorSkeleton />
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex h-[calc(100vh-8rem)] gap-4">
          {/* Main Editor Area */}
          <div className="flex-1 space-y-4 overflow-y-auto pr-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
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

                <PresenceAvatars users={users} />
                
                {selectedText && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWritingAssistant(true)}
                    className="bg-purple-50 hover:bg-purple-100 border-purple-200"
                  >
                    <Wand2 className="w-4 h-4 mr-2 text-purple-600" />
                    Improve with AI
                  </Button>
                )}

                <Button onClick={handleManualSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>

            {/* Active Users */}
            {users.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
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

            {/* AI Summary */}
            <DocumentSummary documentId={documentId} />

            {/* Editor */}
            <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
              <EditorToolbar editor={editor} />
              <div className="tiptap-editor">
                <EditorContent editor={editor} />
              </div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-4">
              <div>Version {document.version}</div>
              <div>
                Last edited {new Date(document.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Right Sidebar with Workflow & AI Insights */}
          <div className="w-80 space-y-4 overflow-y-auto">
            {/* Workflow Panel */}
            {user && (
              <WorkflowPanel documentId={documentId} userId={user.id} />
            )}
            
            {/* AI Insights Panel */}
            <AIInsightsPanel documentId={documentId} />
          </div>
        </div>

        {/* Writing Assistant Modal */}
        {showWritingAssistant && selectedText && (
          <AIWritingAssistant
            selectedText={selectedText}
            onAccept={handleAcceptImprovedText}
            onReject={() => {
              setShowWritingAssistant(false);
              setSelectedText('');
            }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}