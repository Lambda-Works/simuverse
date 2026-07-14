import { fireEvent, render, screen } from '@testing-library/react';
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

vi.mock('@/lib/admin-context', () => ({
  useAdmin: () => ({ currentTab: 'courses', setCurrentTab: vi.fn(), readOnly: false }),
  AdminProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
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
  const icon = (name: string) =>
    Object.assign(
      (props: any) => React.createElement('span', { 'data-icon': name, ...props }, name),
      { displayName: name },
    );
  return {
    ChevronDown: icon('ChevronDown'),
    ChevronRight: icon('ChevronRight'),
    LogOut: icon('LogOut'),
    Shield: icon('Shield'),
    ArrowLeft: icon('ArrowLeft'),
    Home: icon('Home'),
    Settings: icon('Settings'),
    BarChart3: icon('BarChart3'),
    FileText: icon('FileText'),
    BookOpen: icon('BookOpen'),
    Bot: icon('Bot'),
    Users: icon('Users'),
    ClipboardList: icon('ClipboardList'),
    Building2: icon('Building2'),
    PanelLeft: icon('PanelLeft'),
    PanelLeftClose: icon('PanelLeftClose'),
    Menu: icon('Menu'),
    MessageSquare: icon('MessageSquare'),
    GraduationCap: icon('GraduationCap'),
    Tags: icon('Tags'),
    Clapperboard: icon('Clapperboard'),
    LayoutTemplate: icon('LayoutTemplate'),
    FilePlus: icon('FilePlus'),
    BotMessageSquare: icon('BotMessageSquare'),
    Play: icon('Play'),
    UserRound: icon('UserRound'),
    ShieldCheck: icon('ShieldCheck'),
    Users2: icon('Users2'),
    UserRoundPlus: icon('UserRoundPlus'),
    Wrench: icon('Wrench'),
    ArrowRightLeft: icon('ArrowRightLeft'),
    CalendarDays: icon('CalendarDays'),
    ChartNoAxesCombined: icon('ChartNoAxesCombined'),
    FileChartColumnIncreasing: icon('FileChartColumnIncreasing'),
    ChartBar: icon('ChartBar'),
    Building: icon('Building'),
    HandHeart: icon('HandHeart'),
    UserCheck: icon('UserCheck'),
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
    it('renders teacher nav items', () => {
      renderSidebar('teacher');
      expect(screen.getByText('Mis Cursos')).toBeInTheDocument();
      expect(screen.getByText('Sesiones')).toBeInTheDocument();
      expect(screen.getByText('Legajos')).toBeInTheDocument();
    });

    it('does not render evaluaciones', () => {
      renderSidebar('teacher');
      expect(screen.queryByText('Evaluaciones')).not.toBeInTheDocument();
    });

    it('does not render admin item', () => {
      renderSidebar('teacher');
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });

  describe('admin role', () => {
    it('renders admin main nav items', () => {
      renderSidebar('admin');
      expect(screen.getByText('Mis Cursos')).toBeInTheDocument();
      expect(screen.getByText('Sesiones')).toBeInTheDocument();
      expect(screen.getByText('Legajos')).toBeInTheDocument();
    });

    it('does not render evaluaciones', () => {
      renderSidebar('admin');
      expect(screen.queryByText('Evaluaciones')).not.toBeInTheDocument();
    });

    it('renders admin sub-groups', () => {
      renderSidebar('admin');
      expect(screen.getByText('Contenido y Configuración')).toBeInTheDocument();
      expect(screen.getByText('IA y Simulación')).toBeInTheDocument();
      expect(screen.getByText('Usuarios y Acceso')).toBeInTheDocument();
    });

    it('renders admin sub-items when groups are expanded', () => {
      renderSidebar('admin', '/admin');
      fireEvent.click(screen.getByText('IA y Simulación'));
      fireEvent.click(screen.getByText('Usuarios y Acceso'));
      expect(screen.getByText('Cursos')).toBeInTheDocument();
      expect(screen.getByText('Prompts IA')).toBeInTheDocument();
      expect(screen.getByText('Usuarios')).toBeInTheDocument();
    });
  });

  describe('ministerio role', () => {
    it('renders 2 nav items', () => {
      renderSidebar('ministerio');
      expect(screen.getByText('Ministerio')).toBeInTheDocument();
      expect(screen.getByText('Legajos')).toBeInTheDocument();
    });

    it('does not render evaluaciones', () => {
      renderSidebar('ministerio');
      expect(screen.queryByText('Evaluaciones')).not.toBeInTheDocument();
    });

    it('does not render admin item', () => {
      renderSidebar('ministerio');
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('marks the current route as active', () => {
      renderSidebar('teacher', '/profesor/legajos');
      const legajosButton = screen.getByText('Legajos').closest('[data-sidebar="menu-button"]');
      expect(legajosButton).toHaveAttribute('data-active', 'true');
    });

    it('does not mark non-active routes', () => {
      renderSidebar('teacher', '/profesor/legajos');
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

    it('has a logout button', () => {
      renderSidebar('teacher');
      expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
    });
  });
});
