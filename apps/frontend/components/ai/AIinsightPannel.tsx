'use client';

import { useState } from 'react';
import { Sparkles, Loader2, FileText, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { aiService, type Insights } from '@/lib/ai';
import { toast } from 'sonner';

interface AIInsightsPanelProps {
  documentId: string;
}

export function AIInsightsPanel({ documentId }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const data = await aiService.getDocumentInsights(documentId);
      setInsights(data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Insights
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchInsights}
          disabled={loading}
        >
          {loading ? 'Loading...' : insights ? 'Refresh' : 'Generate'}
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && !insights && (
        <div className="text-center py-12 text-gray-500 text-sm">
          Click "Generate" to get AI insights
        </div>
      )}

      {insights && !loading && (
        <div className="space-y-6">
          {insights.suggestedTopics?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-600" />
                Suggested Topics
              </h4>
              <div className="flex flex-wrap gap-2">
                {insights.suggestedTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {insights.missingInfo?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-600" />
                Consider Adding
              </h4>
              <ul className="space-y-2">
                {insights.missingInfo.map((info, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    • {info}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.improvements?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Improvements</h4>
              <ul className="space-y-2">
                {insights.improvements.map((improvement, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    • {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.relatedDocuments?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Related Documents</h4>
              <div className="space-y-2">
                {insights.relatedDocuments.map((doc, i) => (
                  <div
                    key={i}
                    className="p-2 bg-white rounded border text-sm hover:shadow cursor-pointer"
                  >
                    <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                      {doc.snippet}
                    </p>
                    <p className="text-xs text-blue-600">
                      {(doc.similarity * 100).toFixed(0)}% relevant
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 pt-4 border-t">
            Generated {new Date(insights.generatedAt).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}