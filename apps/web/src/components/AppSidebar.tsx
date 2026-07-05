'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, LogOut, Shield, ArrowLeft, Pin, PinOff } from 'lucide-react';
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_NAV } from '@/lib/nav-config';
import { ADMIN_NAV_GROUPS } from '@/lib/admin-nav';
import { useSidebarHeader } from '@/lib/sidebar-header-context';
import { useAdmin } from '@/lib/admin-context';

const GROUP_STORAGE_KEY = 'admin-sidebar:groups';
const PIN_STORAGE_KEY = 'sidebar:pinned';

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

function loadPinState(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(PIN_STORAGE_KEY) === 'true';
}

function savePinState(pinned: boolean) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PIN_STORAGE_KEY, String(pinned));
}

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { backTo, backLabel } = useSidebarHeader();
  const { open, setOpen } = useSidebar();

  const role = (user?.role || 'student') as string;
  const navItems = ROLE_NAV[role as keyof typeof ROLE_NAV] || ROLE_NAV.student;
  const isAdmin = role === 'admin';
  const { currentTab, setCurrentTab } = useAdmin();

  // Pin state (separate from sidebar open state)
  // Initialize to false to avoid SSR hydration mismatch (localStorage is undefined on server)
  const [isPinned, setIsPinned] = useState<boolean>(false);

  // Sync pin state from localStorage after mount
  useEffect(() => {
    setIsPinned(loadPinState());
  }, []);

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
        const hasActive = group.items.some((item) => item.id === currentTab);
        if (hasActive && !next[group.id]) {
          next[group.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [currentTab, isAdmin]);

  // Persist expanded state
  useEffect(() => {
    saveExpandedState(expandedGroups);
  }, [expandedGroups]);

  // Persist pin state
  useEffect(() => {
    savePinState(isPinned);
  }, [isPinned]);

  const togglePin = useCallback(() => {
    setIsPinned((prev) => {
      const next = !prev;
      // When pinning, force sidebar open. When unpinning, keep current state.
      if (next) {
        setOpen(true);
      }
      return next;
    });
  }, [setOpen]);

  // Hover handlers: expand on enter, collapse on leave (only when not pinned)
  const handleMouseEnter = useCallback(() => {
    if (!isPinned) {
      setOpen(true);
    }
  }, [isPinned, setOpen]);

  const handleMouseLeave = useCallback(() => {
    if (!isPinned) {
      setOpen(false);
    }
  }, [isPinned, setOpen]);

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

  // Get user initial for avatar fallback
  const userInitial = (user?.name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase();

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="flex h-full w-full flex-col">
      <SidebarHeader className="group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
        {backTo ? (
          <button
            onClick={() => router.push(backTo)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <ArrowLeft className="size-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">{backLabel || 'Volver'}</span>
          </button>
        ) : (
          <div className="relative flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full"
            >
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Shield className="size-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-sm group-data-[collapsible=icon]:hidden">MSM</span>
            </button>
            <button
              onClick={togglePin}
              className="absolute right-2 p-1 rounded-md hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:hidden"
              title={isPinned ? 'Desanclar sidebar' : 'Anclar sidebar'}
            >
              {isPinned ? (
                <PinOff className="size-4 text-sidebar-foreground/70" />
              ) : (
                <Pin className="size-4 text-sidebar-foreground/50" />
              )}
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent
        className="group-data-[collapsible=icon]:p-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href} className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <SidebarMenuButton
                isActive={isActive(item.href)}
                onClick={() => handleNavClick(item.href)}
                tooltip={item.label}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {isAdmin && (
          <>
        <SidebarSeparator />
            {ADMIN_NAV_GROUPS.map((group) => (
              <SidebarGroup key={group.id} className="group-data-[collapsible=icon]:p-0">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:px-0"
                >
                  <group.icon className="size-4 shrink-0" />
                  <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">{group.label}</span>
                  <span className="group-data-[collapsible=icon]:hidden">
                    {expandedGroups[group.id] ? (
                      <ChevronDown className="size-4 shrink-0" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0" />
                    )}
                  </span>
                </button>
                {expandedGroups[group.id] && (
                  <SidebarGroupContent>
                    <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.id} className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                          <SidebarMenuButton
                            isActive={currentTab === item.id}
                            onClick={() => {
                              setCurrentTab(item.id);
                              if (pathname !== '/admin') router.push('/admin');
                            }}
                            tooltip={item.label}
                          >
                            <item.icon className="size-4 shrink-0" />
                            <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
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

      <SidebarFooter className="group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:items-center">
        <div className="flex items-center gap-3 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="text-sm font-medium bg-primary text-primary-foreground">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name || user?.email?.split('@')[0] || 'Usuario'}
            </span>
            <span className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</span>
          </div>
        </div>
        <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton onClick={signOut} className="text-red-600 hover:text-red-600" tooltip="Cerrar sesión">
              <LogOut className="size-4 text-red-600 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </div>
  );
}
