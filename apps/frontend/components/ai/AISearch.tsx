'use client';

import { useState } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { aiService, type SearchResult } from '@/lib/ai';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AISearchProps {
  workspaceId: number;
}

export function AISearch({ workspaceId }: AISearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await aiService.semanticSearch(query, workspaceId, 5);
      setResults(data);
      if (data.length === 0) {
        toast.info('No results found');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Semantic Search
        </CardTitle>
        <p className="text-sm text-gray-600">
          Search by meaning, not just keywords
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Ask anything about your documents..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((doc) => (
              <Card
                key={doc._id}
                className="cursor-pointer hover:shadow-md transition"
                onClick={() => router.push(`/documents/${doc._id}`)}
              >
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{doc.title}</h4>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {(doc.maxSimilarity * 100).toFixed(0)}% match
                    </span>
                  </div>
                  {doc.relevantChunks?.[0] && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      ...{doc.relevantChunks[0].text.slice(0, 200)}...
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}