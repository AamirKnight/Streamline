'use client';

import { useState } from 'react';
import { Wand2, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { aiService } from '@/lib/ai';
import { toast } from 'sonner';

interface AIWritingAssistantProps {
  selectedText: string;
  onAccept: (improvedText: string) => void;
  onReject: () => void;
}

export function AIWritingAssistant({
  selectedText,
  onAccept,
  onReject,
}: AIWritingAssistantProps) {
  const [improved, setImproved] = useState('');
  const [loading, setLoading] = useState(false);

  const improveText = async () => {
    if (!selectedText.trim() || selectedText.length > 2000) {
      toast.error('Text must be between 1 and 2000 characters');
      return;
    }

    setLoading(true);
    try {
      const data = await aiService.improveWriting(selectedText);
      setImproved(data.improved);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to improve text');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border p-4 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-purple-600" />
          AI Writing Assistant
        </h3>
        <button onClick={onReject} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {!improved && !loading && (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Selected: {selectedText.slice(0, 100)}
            {selectedText.length > 100 && '...'}
          </p>
          <Button onClick={improveText} className="w-full">
            Improve Writing
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="ml-2 text-sm text-gray-600">
            AI is improving your text...
          </span>
        </div>
      )}

      {improved && !loading && (
        <div>
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Original:</p>
            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
              {selectedText}
            </p>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Improved:</p>
            <p className="text-sm text-gray-900 bg-green-50 p-2 rounded border border-green-200">
              {improved}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => onAccept(improved)}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-1" />
              Accept
            </Button>
            <Button onClick={onReject} variant="outline" className="flex-1">
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}