'use client'

import { DEMO_USERS } from '@/services/demoData';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AppRole = 'student' | 'teacher' | 'admin' | 'ministerio';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signOut: () => void;
  isAuthenticated: boolean;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom event for storage changes in same tab
export const authChangeEvent = new EventTarget();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load auth state from localStorage — ONLY runs on client (useEffect)
  // SSR-safe: initialState is {user:null, token:null, loading:true},
  // so the server and first client render match (no hydration mismatch).
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') {
      setLoading(false);
      return;
    }

    const storedToken = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        setLoading(false);
        return;
      } catch {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }

    // ── Demo mode: only when explicitly enabled ────────────────────────
    if (typeof window !== 'undefined' &&
        process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const demoUser = DEMO_USERS[0]; // admin@fepei.com
      sessionStorage.setItem('token', 'demo-' + demoUser.id);
      sessionStorage.setItem('user', JSON.stringify(demoUser));
      setToken('demo-' + demoUser.id);
      setUser(demoUser);
    }

    setLoading(false);
  }, []);

  // Listen for localStorage changes (cross-tab sync)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;

    const handleStorageChange = () => {
      const storedToken = sessionStorage.getItem('token');
      const storedUser = sessionStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
        } catch {
          setToken(null);
          setUser(null);
        }
      } else {
        setToken(null);
        setUser(null);
      }
    };

    authChangeEvent.addEventListener('authChange', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      authChangeEvent.removeEventListener('authChange', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const signOut = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('refreshToken');
      window.location.href = '/auth';
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return user?.role === role;
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    signOut,
    isAuthenticated: !!token && !!user,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};