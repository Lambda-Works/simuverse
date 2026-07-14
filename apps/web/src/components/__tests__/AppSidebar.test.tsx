import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock sidebar primitives BEFORE importing AppSidebar
vi.mock('@/components/ui/sidebar', async () => {
  return await import('../__mocks__/sidebar');
});

// Mock useAuth
const mockSignOut = vi.fn();
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock next/navigation
const mockPathname = vi.fn();
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: mockPush }),
}));

// Mock sidebar-header-context
vi.mock('@/lib/sidebar-header-context', () => ({
  SidebarHeaderProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  useSidebarHeader: () => ({ backTo: undefined, backLabel: undefined, setBackTo: vi.fn() }),
}));

// Mock lucide-react with concrete icons (Proxy causes hangs in vitest)
vi.mock('lucide-react', () => {
  const icon = (name: string) => React.createElement('span', { 'data-icon': name }, name);
  return {
    ChevronDown: () => icon('ChevronDown'),
    ChevronRight: () => icon('ChevronRight'),
    LogOut: () => icon('LogOut'),
    Shield: () => icon('Shield'),
    ArrowLeft: () => icon('ArrowLeft'),
    Home: () => icon('Home'),
    Settings: () => icon('Settings'),
    BarChart3: () => icon('BarChart3'),
    FileText: () => icon('FileText'),
    BookOpen: () => icon('BookOpen'),
    Bot: () => icon('Bot'),
    Users: () => icon('Users'),
    ClipboardList: () => icon('ClipboardList'),
    Building2: () => icon('Building2'),
    PanelLeft: () => icon('PanelLeft'),
  };
});

// Import AFTER mocks are set up
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

function renderSidebar(role: string, pathname = '/dashboard') {
  mockUseAuth.mockReturnValue({
    user: { id: '1', name: 'Test User', email: 'test@test.com', role },
    signOut: mockSignOut,
  });
  mockPathname.mockReturnValue(pathname);

  return render(
    React.createElement(
      SidebarProvider,
      null,
      React.createElement(AppSidebar)
    )
  );
}

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('student role', () => {
    it('renders 1 nav item: Dashboard', () => {
      renderSidebar('student');
      expect(screen.getByText('Mis Cursos')).toBeInTheDocument();
    });

    it('does not render admin-only items', () => {
      renderSidebar('student');
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      expect(screen.queryByText('Evaluaciones')).not.toBeInTheDocument();
    });
  });

  describe('teacher role', () => {
    it('renders 3 nav items', () => {
      renderSidebar('teacher');
      expect(screen.getByText('Mis Cursos')).toBeInTheDocument();
      expect(screen.getByText('Evaluaciones')).toBeInTheDocument();
      expect(screen.getByText('Legajos')).toBeInTheDocument();
    });

    it('does not render admin item', () => {
      renderSidebar('teacher');
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });

  describe('admin role', () => {
    it('renders 4 main nav items', () => {
      renderSidebar('admin');
      expect(screen.getByText('Mis Cursos')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Evaluaciones')).toBeInTheDocument();
      expect(screen.getByText('Legajos')).toBeInTheDocument();
    });

    it('renders admin sub-groups', () => {
      renderSidebar('admin');
      expect(screen.getByText('Contenido y Configuración')).toBeInTheDocument();
      expect(screen.getByText('IA y Simulación')).toBeInTheDocument();
      expect(screen.getByText('Usuarios y Acceso')).toBeInTheDocument();
    });

    it('renders admin sub-items', () => {
      renderSidebar('admin');
      expect(screen.getByText('Cursos')).toBeInTheDocument();
      expect(screen.getByText('Prompts IA')).toBeInTheDocument();
      expect(screen.getByText('Usuarios')).toBeInTheDocument();
    });
  });

  describe('ministerio role', () => {
    it('renders 3 nav items', () => {
      renderSidebar('ministerio');
      expect(screen.getByText('Mis Cursos')).toBeInTheDocument();
      expect(screen.getByText('Evaluaciones')).toBeInTheDocument();
      expect(screen.getByText('Legajos')).toBeInTheDocument();
    });

    it('does not render admin item', () => {
      renderSidebar('ministerio');
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('marks the current route as active', () => {
      renderSidebar('teacher', '/evaluations');
      const evaluationsButton = screen.getByText('Evaluaciones').closest('[data-sidebar="menu-button"]');
      expect(evaluationsButton).toHaveAttribute('data-active', 'true');
    });

    it('does not mark non-active routes', () => {
      renderSidebar('teacher', '/evaluations');
      const dashboardButton = screen.getByText('Mis Cursos').closest('[data-sidebar="menu-button"]');
      expect(dashboardButton).toHaveAttribute('data-active', 'false');
    });
  });

  describe('user footer', () => {
    it('displays user name', () => {
      renderSidebar('teacher');
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('displays user email', () => {
      renderSidebar('teacher');
      expect(screen.getByText('test@test.com')).toBeInTheDocument();
    });

    it('displays role badge', () => {
      renderSidebar('teacher');
      expect(screen.getByText('Docente')).toBeInTheDocument();
    });

    it('has a logout button', () => {
      renderSidebar('teacher');
      expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
    });
  });
});
