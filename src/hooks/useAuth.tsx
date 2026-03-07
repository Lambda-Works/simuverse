import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/services/ApiClient';

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

  // Función para cargar usuario desde localStorage
  const loadAuthFromStorage = () => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    console.log('🔍 loadAuthFromStorage called:', { storedToken: storedToken?.substring(0, 20), storedUser });

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('✅ Parsed user data:', userData);
        setToken(storedToken);
        setUser(userData);
      } catch (error) {
        console.error('❌ Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    } else {
      console.log('⚠️  No stored token or user');
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  };

  // Cargar usuario desde localStorage al montar
  useEffect(() => {
    loadAuthFromStorage();
  }, []);

  // Escuchar cambios en localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      loadAuthFromStorage();
    };

    // Event listener para cambios de localStorage en la misma pestaña
    authChangeEvent.addEventListener('authChange', handleStorageChange);

    // Event listener para cambios de localStorage desde otra pestaña
    window.addEventListener('storage', handleStorageChange);

    return () => {
      authChangeEvent.removeEventListener('authChange', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const signOut = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    // Redirigir a login
    window.location.href = '/auth';
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


