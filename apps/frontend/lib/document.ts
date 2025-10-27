import axios from 'axios';
import Cookies from 'js-cookie';

const DOCUMENT_URL = process.env.NEXT_PUBLIC_DOCUMENT_URL || 'http://localhost:3003';

export const documentApi = axios.create({
  baseURL: DOCUMENT_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token interceptor
documentApi.interceptors.request.use(
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

export interface Document {
  _id: string;
  title: string;
  content: string;
  workspaceId: number;
  createdBy: number;
  lastEditedBy?: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentData {
  title: string;
  content?: string;
  workspaceId: number;
}

export const documentService = {
  async getDocuments(workspaceId: number): Promise<Document[]> {
    const response = await documentApi.get(`/documents?workspaceId=${workspaceId}`);
    return response.data.documents;
  },

  async getDocument(documentId: string): Promise<Document> {
    const response = await documentApi.get(`/documents/${documentId}`);
    return response.data.document;
  },

  async createDocument(data: CreateDocumentData): Promise<Document> {
    const response = await documentApi.post('/documents', data);
    return response.data.document;
  },

  async updateDocument(documentId: string, data: Partial<CreateDocumentData>): Promise<Document> {
    const response = await documentApi.put(`/documents/${documentId}`, data);
    return response.data.document;
  },

  async deleteDocument(documentId: string): Promise<void> {
    await documentApi.delete(`/documents/${documentId}`);
  },

  async searchDocuments(query: string, workspaceId?: number) {
    const params = new URLSearchParams({ query });
    if (workspaceId) params.append('workspaceId', workspaceId.toString());
    const response = await documentApi.get(`/documents/search?${params}`);
    return response.data.documents;
  },
};