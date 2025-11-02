import axios from 'axios';
import Cookies from 'js-cookie';

const AI_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:3004';

export const aiApi = axios.create({
  baseURL: AI_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor
aiApi.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface SearchResult {
  _id: string;
  title: string;
  content: string;
  workspaceId: number;
  maxSimilarity: number;
  relevantChunks: Array<{
    text: string;
    chunkIndex: number;
    similarity: number;
  }>;
}

export interface Summary {
  documentId: string;
  title: string;
  summary: string;
  keyPoints: string[];
  topics: string[];
  generatedAt: Date;
}

export interface Insights {
  documentId: string;
  relatedDocuments: Array<{
    documentId: string;
    similarity: number;
    snippet: string;
  }>;
  suggestedTopics: string[];
  missingInfo: string[];
  improvements: string[];
  generatedAt: Date;
}

export const aiService = {
  async semanticSearch(query: string, workspaceId: number, topK: number = 5): Promise<SearchResult[]> {
    const response = await aiApi.post('/ai/search', { query, workspaceId, topK });
    return response.data.results;
  },

  async summarizeDocument(documentId: string): Promise<Summary> {
    const response = await aiApi.get(`/ai/summarize/${documentId}`);
    return response.data;
  },

  async getDocumentInsights(documentId: string): Promise<Insights> {
    const response = await aiApi.get(`/ai/insights/${documentId}`);
    return response.data;
  },

  async improveWriting(text: string): Promise<{ original: string; improved: string }> {
    const response = await aiApi.post('/ai/improve', { text });
    return response.data;
  },

  async detectInconsistencies(documentId: string, compareWithDocumentIds: string[]) {
    const response = await aiApi.post('/ai/inconsistencies', {
      documentId,
      compareWithDocumentIds,
    });
    return response.data;
  },

  async autocomplete(context: string): Promise<{ suggestion: string }> {
    const response = await aiApi.post('/ai/autocomplete', { context });
    return response.data;
  },
};