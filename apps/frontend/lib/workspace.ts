import { workspaceApi as api } from './api';

export interface Workspace {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceData {
  name: string;
  description?: string;
}

export const workspaceService = {
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await api.get('/workspaces');
    return response.data.workspaces;
  },

  async getWorkspace(workspaceId: number): Promise<Workspace> {
    const response = await api.get(`/workspaces/${workspaceId}`);
    return response.data.workspace;
  },

  async createWorkspace(data: CreateWorkspaceData): Promise<Workspace> {
    const response = await api.post('/workspaces', data);
    return response.data.workspace;
  },

  async updateWorkspace(workspaceId: number, data: Partial<CreateWorkspaceData>): Promise<Workspace> {
    const response = await api.put(`/workspaces/${workspaceId}`, data);
    return response.data.workspace;
  },

  async deleteWorkspace(workspaceId: number): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}`);
  },

  async getMembers(workspaceId: number) {
    const response = await api.get(`/workspaces/${workspaceId}/members`);
    return response.data.members;
  },

  async inviteMember(workspaceId: number, email: string, role: string) {
    const response = await api.post(`/workspaces/${workspaceId}/invite`, { email, role });
    return response.data;
  },
};