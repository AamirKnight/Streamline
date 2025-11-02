'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { aiService, type Summary } from '@/lib/ai';
import { toast } from 'sonner';

interface DocumentSummaryProps {
  documentId: string;
}

export function DocumentSummary({ documentId }: DocumentSummaryProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    setShow(true);
    try {
      const data = await aiService.summarizeDocument(documentId);
      setSummary(data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  if (!show) {
    return (
      <Button onClick={fetchSummary} variant="outline">
        <FileText className="w-4 h-4 mr-2" />
        AI Summary
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Document Summary
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShow(false)}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}

        {summary && !loading && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Summary
              </h4>
              <p className="text-gray-900">{summary.summary}</p>
            </div>

            {summary.keyPoints.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Key Points
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {summary.keyPoints.map((point, i) => (
                    <li key={i} className="text-gray-900">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.topics.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Topics
                </h4>
                <div className="flex flex-wrap gap-2">
                  {summary.topics.map((topic, i) => (
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

            <p className="text-xs text-gray-500 pt-4 border-t">
              Generated at {new Date(summary.generatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}