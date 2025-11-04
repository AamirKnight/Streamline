// apps/frontend/lib/ai.ts (COMPLETE VERSION)
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

// ============================================
// 📊 TYPE DEFINITIONS
// ============================================

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

export interface WritingImprovement {
  original: string;
  improved: string;
  changes: string[];
}

export interface InconsistencyReport {
  documentId: string;
  inconsistencies: Array<{
    documentId: string;
    documentTitle: string;
    conflicts: string[];
  }>;
  foundIssues: boolean;
}

export interface ConflictResolution {
  original: string;
  versionA: string;
  versionB: string;
  merged: string;
  explanation: string;
}

// ============================================
// 🔍 SEMANTIC SEARCH (HuggingFace)
// ============================================

export const aiService = {
  /**
   * Semantic search using HuggingFace embeddings
   */
  async semanticSearch(
    query: string, 
    workspaceId: number, 
    topK: number = 5
  ): Promise<SearchResult[]> {
    const response = await aiApi.post('/ai/search', { 
      query, 
      workspaceId, 
      topK 
    });
    return response.data.results;
  },

  /**
   * Index a document for semantic search
   */
  async indexDocument(
    documentId: string,
    workspaceId: number,
    content: string
  ): Promise<void> {
    await aiApi.post('/ai/index', {
      documentId,
      workspaceId,
      content,
    });
  },

  // ============================================
  // 📝 DOCUMENT INSIGHTS (Gemini)
  // ============================================

  /**
   * Generate document summary with key points and topics
   */
  async summarizeDocument(documentId: string): Promise<Summary> {
    const response = await aiApi.get(`/ai/summarize/${documentId}`);
    return response.data;
  },

  /**
   * Get comprehensive document insights
   */
  async getDocumentInsights(documentId: string): Promise<Insights> {
    const response = await aiApi.get(`/ai/insights/${documentId}`);
    return response.data;
  },

  // ============================================
  // ✍️ WRITING ASSISTANT (Gemini)
  // ============================================

  /**
   * Improve selected text for clarity and grammar
   */
  async improveWriting(text: string): Promise<WritingImprovement> {
    const response = await aiApi.post('/ai/improve', { text });
    return {
      original: text,
      improved: response.data.improved,
      changes: [], // Backend can optionally return this
    };
  },

  /**
   * AI-powered autocomplete
   */
  async autocomplete(context: string): Promise<{ suggestion: string }> {
    const response = await aiApi.post('/ai/autocomplete', { context });
    return response.data;
  },

  // ============================================
  // 🔄 CONFLICT RESOLUTION (Gemini)
  // ============================================

  /**
   * Detect inconsistencies between documents
   */
  async detectInconsistencies(
    documentId: string,
    compareWithDocumentIds: string[]
  ): Promise<InconsistencyReport> {
    const response = await aiApi.post('/ai/inconsistencies', {
      documentId,
      compareWithDocumentIds,
    });
    return response.data;
  },

  /**
   * Merge conflicting document versions
   */
  async resolveConflict(
    original: string,
    versionA: string,
    versionB: string
  ): Promise<ConflictResolution> {
    const response = await aiApi.post('/ai/resolve-conflict', {
      original,
      versionA,
      versionB,
    });
    return response.data;
  },

  // ============================================
  // 🎯 HELPER METHODS
  // ============================================

  /**
   * Check if AI service is healthy
   */
  async healthCheck(): Promise<{ status: string; features: string[] }> {
    const response = await aiApi.get('/health');
    return response.data;
  },

  /**
   * Get AI service stats
   */
  async getStats(): Promise<any> {
    const response = await aiApi.get('/ai/stats');
    return response.data;
  },
};