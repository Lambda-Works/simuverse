import React from 'react';

/**
 * Mock sidebar primitives for testing.
 * Uses simple div/ul/li elements with data-* attributes
 * so tests can assert structure without depending on real sidebar CSS.
 */

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  return React.createElement('div', { 'data-sidebar': 'provider' }, children);
}

export function Sidebar({ children, ...props }: React.ComponentProps<'div'>) {
  return React.createElement('div', { 'data-sidebar': 'sidebar', ...props }, children);
}

export function SidebarContent({ children, ...props }: React.ComponentProps<'div'>) {
  return React.createElement('div', { 'data-sidebar': 'content', ...props }, children);
}

export function SidebarHeader({ children, ...props }: React.ComponentProps<'div'>) {
  return React.createElement('div', { 'data-sidebar': 'header', ...props }, children);
}

export function SidebarFooter({ children, ...props }: React.ComponentProps<'div'>) {
  return React.createElement('div', { 'data-sidebar': 'footer', ...props }, children);
}

export function SidebarMenu({ children, ...props }: React.ComponentProps<'ul'>) {
  return React.createElement('ul', { 'data-sidebar': 'menu', ...props }, children);
}

export function SidebarMenuItem({ children, ...props }: React.ComponentProps<'li'>) {
  return React.createElement('li', { 'data-sidebar': 'menu-item', ...props }, children);
}

export function SidebarMenuButton({ children, isActive, ...props }: React.ComponentProps<'button'> & { isActive?: boolean }) {
  return React.createElement(
    'button',
    { 'data-sidebar': 'menu-button', 'data-active': isActive, ...props },
    children
  );
}

export function SidebarMenuBadge({ children, ...props }: React.ComponentProps<'div'>) {
  return React.createElement('div', { 'data-sidebar': 'menu-badge', ...props }, children);
}

export function SidebarGroup({ children, ...props }: React.ComponentProps<'div'>) {
  return React.createElement('div', { 'data-sidebar': 'group', ...props }, children);
}

export function SidebarGroupContent({ children, ...props }: React.ComponentProps<'div'>) {
  return React.createElement('div', { 'data-sidebar': 'group-content', ...props }, children);
}

export function SidebarSeparator(props: React.ComponentProps<'div'>) {
  return React.createElement('div', { 'data-sidebar': 'separator', ...props });
}

export function SidebarInset({ children, ...props }: React.ComponentProps<'main'>) {
  return React.createElement('main', { 'data-sidebar': 'inset', ...props }, children);
}

export function SidebarTrigger(props: React.ComponentProps<'button'>) {
  return React.createElement('button', { 'data-sidebar': 'trigger', ...props });
}

export function useSidebar() {
  return {
    state: 'expanded' as const,
    open: true,
    setOpen: () => {},
    isMobile: false,
    openMobile: false,
    setOpenMobile: () => {},
    toggleSidebar: () => {},
  };
}
