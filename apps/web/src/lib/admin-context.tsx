'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'admin-sidebar:currentTab';

interface AdminContextValue {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingCount: number;
  setPendingCount: (count: number) => void;
  readOnly: boolean;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children, readOnly = false }: { children: React.ReactNode; readOnly?: boolean }) {
  const [currentTab, setCurrentTabState] = useState<string>('courses');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setCurrentTabState(stored);
  }, []);

  const setCurrentTab = (tab: string) => {
    setCurrentTabState(tab);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, tab);
    }
  };

  return (
    <AdminContext.Provider
      value={{ currentTab, setCurrentTab, pendingCount, setPendingCount, readOnly }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
}

export function AdminReadOnlyProvider({ children }: { children: React.ReactNode }) {
  const { hasRole } = useAuth();
  return <AdminProvider readOnly={hasRole('ministerio')}>{children}</AdminProvider>;
}
