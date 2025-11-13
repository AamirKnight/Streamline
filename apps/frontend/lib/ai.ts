// apps/frontend/lib/api.ts
import axios from 'axios';
import Cookies from 'js-cookie';
import { handleApiError } from './error-handler';

// ✅ Use correct environment variable names
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const WORKSPACE_URL = process.env.NEXT_PUBLIC_WORKSPACE_URL || 'http://localhost:3002';
const DOCUMENT_URL = process.env.NEXT_PUBLIC_DOCUMENT_URL || 'http://localhost:3003';

// Auth API
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Workspace API
export const workspaceApi = axios.create({
  baseURL: WORKSPACE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Document API
export const documentApi = axios.create({
  baseURL: DOCUMENT_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token interceptor to all APIs
[api, workspaceApi, documentApi].forEach((instance) => {
  instance.interceptors.request.use(
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

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const { data } = await axios.post(
            `${API_URL}/auth/refresh-token`,
            {},
            { withCredentials: true }
          );

          Cookies.set('accessToken', data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

          return instance(originalRequest);
        } catch (refreshError) {
          Cookies.remove('accessToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      handleApiError(error);
      return Promise.reject(error);
    }
  );
});

export default api;

// Example .env.local file:
/*
# Railway Production URLs (remove /api suffix!)
NEXT_PUBLIC_API_URL=https://auth-service-production-60bd.up.railway.app
NEXT_PUBLIC_WORKSPACE_URL=https://workspace-service-production-xxxx.up.railway.app
NEXT_PUBLIC_DOCUMENT_URL=https://document-service-production-xxxx.up.railway.app
NEXT_PUBLIC_AI_URL=https://ai-service-production-xxxx.up.railway.app

# Frontend URL (for CORS)
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend-app.vercel.app
*/