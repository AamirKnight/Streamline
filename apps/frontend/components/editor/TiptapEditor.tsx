'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Color from '@tiptap/extension-color';
import {TextStyle} from '@tiptap/extension-text-style';
import History from '@tiptap/extension-history';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onUpdate?: () => void;
  editable?: boolean;
}

export function TiptapEditor({ 
  content, 
  onChange, 
  onUpdate,
  editable = true 
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit, // no history config inside
      History.configure({
        depth: 100,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      TextStyle,
      Color,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      onUpdate?.();
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="tiptap-editor">
      <EditorContent editor={editor} />
    </div>
  );
}
