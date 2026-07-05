'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, LogOut, Shield, ArrowLeft } from 'lucide-react';
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_NAV } from '@/lib/nav-config';
import { ADMIN_NAV_GROUPS } from '@/lib/admin-nav';
import { useSidebarHeader } from '@/lib/sidebar-header-context';

const GROUP_STORAGE_KEY = 'admin-sidebar:groups';

const ROLE_LABELS: Record<string, string> = {
  student: 'Estudiante',
  teacher: 'Docente',
  admin: 'Administrador',
  ministerio: 'Ministerio',
};

function loadExpandedState(): Record<string, boolean> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(GROUP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveExpandedState(state: Record<string, boolean>) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(state));
}

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { backTo, backLabel } = useSidebarHeader();

  const role = (user?.role || 'student') as string;
  const navItems = ROLE_NAV[role as keyof typeof ROLE_NAV] || ROLE_NAV.student;
  const isAdmin = role === 'admin';

  // Admin group expansion state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const stored = loadExpandedState();
    const initial: Record<string, boolean> = {};
    for (const group of ADMIN_NAV_GROUPS) {
      initial[group.id] = stored[group.id] !== undefined ? stored[group.id] : true;
    }
    return initial;
  });

  // Auto-expand group containing the active admin sub-tab
  useEffect(() => {
    if (!isAdmin) return;
    setExpandedGroups((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const group of ADMIN_NAV_GROUPS) {
        const hasActive = group.items.some((item) => pathname === `/admin?tab=${item.id}`);
        if (hasActive && !next[group.id]) {
          next[group.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [pathname, isAdmin]);

  // Persist expanded state
  useEffect(() => {
    saveExpandedState(expandedGroups);
  }, [expandedGroups]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleNavClick = (href: string) => {
    router.push(href);
  };

  return (
    <>
      <SidebarHeader>
        {backTo ? (
          <button
            onClick={() => router.push(backTo)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>{backLabel || 'Volver'}</span>
          </button>
        ) : (
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-sidebar-accent transition-colors"
          >
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="size-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">MSM</span>
          </button>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={isActive(item.href)}
                onClick={() => handleNavClick(item.href)}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {isAdmin && (
          <>
            <SidebarSeparator />
            {ADMIN_NAV_GROUPS.map((group) => (
              <SidebarGroup key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <group.icon className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{group.label}</span>
                  {expandedGroups[group.id] ? (
                    <ChevronDown className="size-4 shrink-0" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0" />
                  )}
                </button>
                {expandedGroups[group.id] && (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            isActive={pathname === `/admin?tab=${item.id}`}
                            onClick={() => router.push(`/admin?tab=${item.id}`)}
                          >
                            <item.icon className="size-4" />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>
            ))}
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-1 px-2 py-1.5">
          <span className="text-sm font-medium truncate">{user?.name}</span>
          <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
          <span className="text-xs bg-secondary px-2 py-0.5 rounded-md w-fit">
            {ROLE_LABELS[role] || role}
          </span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut className="size-4" />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
