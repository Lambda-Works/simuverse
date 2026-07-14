'use client'

import { DEMO_USERS } from '@/services/demoData';
import { firebaseLogout, isFirebaseConfigured, onFirebaseAuthChanged, getFirebaseIdToken } from '@/lib/firebase';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AppRole = 'student' | 'teacher' | 'admin' | 'ministerio';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  terms_accepted?: boolean;
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
      } catch {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setLoading(false);
      }
    } else if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const demoUser = DEMO_USERS[0];
      sessionStorage.setItem('token', 'demo-' + demoUser.id);
      sessionStorage.setItem('user', JSON.stringify(demoUser));
      setToken('demo-' + demoUser.id);
      setUser(demoUser);
      setLoading(false);
    } else {
      setLoading(false);
    }

    if (isFirebaseConfigured) {
      const unsub = onFirebaseAuthChanged(async (fbUser) => {
        if (!fbUser) return;
        const idToken = await getFirebaseIdToken(false);
        if (idToken) {
          sessionStorage.setItem('token', idToken);
          setToken(idToken);
        }
      });
      return () => unsub();
    }
  }, []);

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
      sessionStorage.removeItem('pending_terms');
      void firebaseLogout().finally(() => {
        window.location.href = '/auth';
      });
    }
  };

  const hasRole = (role: AppRole): boolean => user?.role === role;

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
