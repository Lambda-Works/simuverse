"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ADMIN_NAV_GROUPS, type AdminNavGroup } from "@/lib/admin-nav";

const STORAGE_KEY = "admin-sidebar:groups";

interface AdminSidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingCount?: number;
}

function loadExpandedState(): Record<string, boolean> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveExpandedState(state: Record<string, boolean>) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function AdminSidebar({
  currentTab,
  onTabChange,
  pendingCount = 0,
}: AdminSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => {
      const stored = loadExpandedState();
      // Default: all groups expanded if no stored state
      const initial: Record<string, boolean> = {};
      for (const group of ADMIN_NAV_GROUPS) {
        initial[group.id] = stored[group.id] !== undefined ? stored[group.id] : true;
      }
      return initial;
    }
  );

  // Auto-expand group containing the active item
  useEffect(() => {
    setExpandedGroups((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const group of ADMIN_NAV_GROUPS) {
        const hasActive = group.items.some((item) => item.id === currentTab);
        if (hasActive && !next[group.id]) {
          next[group.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [currentTab]);

  // Persist to localStorage whenever expanded state changes
  useEffect(() => {
    saveExpandedState(expandedGroups);
  }, [expandedGroups]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  return (
    <SidebarContent>
      {ADMIN_NAV_GROUPS.map((group) => (
        <SidebarGroup key={group.id}>
          <button
            onClick={() => toggleGroup(group.id)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <group.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{group.label}</span>
            {expandedGroups[group.id] ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
          </button>
          {expandedGroups[group.id] && (
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={item.id === currentTab}
                      onClick={() => onTabChange(item.id)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.id === "requests" && pendingCount > 0 && (
                      <SidebarMenuBadge>{pendingCount}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}
