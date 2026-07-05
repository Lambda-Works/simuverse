'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

interface SidebarHeaderContextValue {
  backTo?: string;
  backLabel?: string;
  setBackTo: (to?: string, label?: string) => void;
}

const SidebarHeaderContext = createContext<SidebarHeaderContextValue | null>(null);

export function SidebarHeaderProvider({ children }: { children: React.ReactNode }) {
  const [backTo, setBackToState] = useState<string | undefined>(undefined);
  const [backLabel, setBackLabelState] = useState<string | undefined>(undefined);

  const setBackTo = useCallback((to?: string, label?: string) => {
    setBackToState(to);
    setBackLabelState(label);
  }, []);

  return (
    <SidebarHeaderContext.Provider value={{ backTo, backLabel, setBackTo }}>
      {children}
    </SidebarHeaderContext.Provider>
  );
}

export function useSidebarHeader(): SidebarHeaderContextValue {
  const context = useContext(SidebarHeaderContext);
  if (!context) {
    throw new Error('useSidebarHeader must be used within SidebarHeaderProvider');
  }
  return context;
}
