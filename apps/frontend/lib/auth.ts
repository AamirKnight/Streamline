import api from './api';
import Cookies from 'js-cookie';

export interface User {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    if (response.data.accessToken) {
      Cookies.set('accessToken', response.data.accessToken, { expires: 7 });
    }
    return response.data;
  },

  async login(data: LoginData) {
    const response = await api.post('/auth/login', data);
    if (response.data.accessToken) {
      Cookies.set('accessToken', response.data.accessToken, { expires: 7 });
    }
    return response.data;
  },

  async logout() {
    Cookies.remove('accessToken');
    window.location.href = '/login';
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data.user;
  },

  async updateProfile(data: Partial<User>) {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  isAuthenticated(): boolean {
    return !!Cookies.get('accessToken');
  },
};