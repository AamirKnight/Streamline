// apps/frontend/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/lib/auth';
import type { User } from '@/types';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'streamline_auth_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for persistent session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing token
        const token = Cookies.get('accessToken');
        
        if (token) {
          // Verify token is still valid
          const userData = await authService.getProfile();
          setUser(userData);
          
          // Check session timestamp
          const sessionData = localStorage.getItem(AUTH_STORAGE_KEY);
          if (sessionData) {
            const { timestamp, rememberMe } = JSON.parse(sessionData);
            const now = Date.now();
            
            if (rememberMe && now - timestamp > SESSION_DURATION) {
              // Session expired after 24 hours
              handleSessionExpiry();
            }
          }
        } else {
          // No token, clear any stale session data
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Session initialization failed:', error);
        handleSessionExpiry();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleSessionExpiry = () => {
    Cookies.remove('accessToken');
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  const login = async (email: string, password: string, rememberMe = true) => {
    const response = await authService.login({ email, password });
    setUser(response.user);

    // Store session info for persistence
    if (rememberMe) {
      const sessionData = {
        timestamp: Date.now(),
        rememberMe: true,
        userId: response.user.id
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
      
      // Set cookie with 24 hour expiry
      Cookies.set('accessToken', response.accessToken, { 
        expires: 1, // 1 day
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
      });
    }
  };

  const register = async (data: any) => {
    const response = await authService.register(data);
    setUser(response.user);
    
    // Auto-persist on registration
    const sessionData = {
      timestamp: Date.now(),
      rememberMe: true,
      userId: response.user.id
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    const response = await authService.updateProfile(data);
    setUser(response.user);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}