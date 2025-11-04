// apps/frontend/components/ai/GeminiSummary.tsx
'use client';

import { useState } from 'react';
import { Sparkles, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { aiService } from '@/lib/ai';
import { toast } from 'sonner';

interface GeminiSummaryProps {
  documentId: string;
  content: string;
}

export function GeminiSummary({ documentId, content }: GeminiSummaryProps) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const generateSummary = async () => {
    if (content.length < 100) {
      toast.error('Document is too short to summarize (min 100 characters)');
      return;
    }

    setLoading(true);
    setShowPanel(true);
    
    try {
      const result = await aiService.summarizeDocument(documentId);
      setSummary(result);
      toast.success('Summary generated!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate summary');
      console.error('Summary error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!showPanel) {
    return (
      <Button 
        onClick={generateSummary} 
        variant="outline"
        disabled={content.length < 100}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        AI Summary
      </Button>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            AI-Generated Summary
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowPanel(false)}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
            <span>Generating summary with Gemini AI...</span>
          </div>
        )}

        {summary && !loading && (
          <div className="space-y-4">
            {/* Main Summary */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Summary
              </h4>
              <p className="text-gray-900 leading-relaxed">
                {summary.summary}
              </p>
            </div>

            {/* Key Points */}
            {summary.keyPoints && summary.keyPoints.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Key Points
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {summary.keyPoints.map((point: string, i: number) => (
                    <li key={i} className="text-gray-900">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Topics */}
            {summary.topics && summary.topics.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Topics Covered
                </h4>
                <div className="flex flex-wrap gap-2">
                  {summary.topics.map((topic: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <p className="text-xs text-gray-500 pt-4 border-t">
              Generated at {new Date(summary.generatedAt).toLocaleString()}
            </p>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={generateSummary}
              >
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}