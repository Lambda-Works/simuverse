"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const STORAGE_KEY = "admin-sidebar:currentTab";

interface AdminContextValue {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingCount: number;
  setPendingCount: (count: number) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [currentTab, setCurrentTabState] = useState<string>("courses");
  const [pendingCount, setPendingCount] = useState(0);

  // Restore from localStorage on mount
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setCurrentTabState(stored);
    }
  }, []);

  const setCurrentTab = (tab: string) => {
    setCurrentTabState(tab);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, tab);
    }
  };

  return (
    <AdminContext.Provider
      value={{ currentTab, setCurrentTab, pendingCount, setPendingCount }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}
