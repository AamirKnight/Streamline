// apps/frontend/hooks/useAIAutocomplete.ts
import { useState, useEffect, useRef } from 'react';
import { aiService } from '@/lib/ai';
import { Editor } from '@tiptap/react';

interface AutocompleteOptions {
  editor: Editor | null;
  enabled: boolean;
  debounceMs?: number;
}

export function useAIAutocomplete({
  editor,
  enabled,
  debounceMs = 2000,
}: AutocompleteOptions) {
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef('');

  useEffect(() => {
    if (!editor || !enabled) return;

    const handleUpdate = () => {
      const content = editor.getText();
      
      // Only trigger if content changed significantly
      if (Math.abs(content.length - lastContentRef.current.length) < 10) {
        return;
      }

      lastContentRef.current = content;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for autocomplete
      timeoutRef.current = setTimeout(async () => {
        if (content.length < 50 || content.length > 5000) {
          return; // Too short or too long
        }

        setLoading(true);
        try {
          // Get last 200 words as context
          const words = content.split(/\s+/);
          const context = words.slice(-200).join(' ');

          const result = await aiService.autocomplete(context);
          setSuggestion(result.suggestion);
        } catch (error) {
          console.error('Autocomplete error:', error);
          setSuggestion('');
        } finally {
          setLoading(false);
        }
      }, debounceMs);
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [editor, enabled, debounceMs]);

  const acceptSuggestion = () => {
    if (editor && suggestion) {
      editor.commands.insertContent(' ' + suggestion);
      setSuggestion('');
    }
  };

  const rejectSuggestion = () => {
    setSuggestion('');
  };

  return {
    suggestion,
    loading,
    acceptSuggestion,
    rejectSuggestion,
  };
}