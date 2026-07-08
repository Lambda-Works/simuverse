import { LucideIcon, Home, Settings, BarChart3, FileText } from 'lucide-react';

export type AppRole = 'student' | 'teacher' | 'admin' | 'ministerio';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const ROLE_NAV: Record<AppRole, NavItem[]> = {
  student: [
    { label: 'Mis Cursos', href: '/dashboard', icon: Home },
  ],
  teacher: [
    { label: 'Mis Cursos', href: '/dashboard', icon: Home },
    { label: 'Evaluaciones', href: '/evaluations', icon: BarChart3 },
    { label: 'Legajos', href: '/legajos', icon: FileText },
  ],
  admin: [
    { label: 'Mis Cursos', href: '/dashboard', icon: Home },
    { label: 'Evaluaciones', href: '/evaluations', icon: BarChart3 },
    { label: 'Legajos', href: '/legajos', icon: FileText },
  ],
  ministerio: [
    { label: 'Ministerio', href: '/ministerio', icon: Home },
    { label: 'Evaluaciones', href: '/evaluations', icon: BarChart3 },
    { label: 'Legajos', href: '/legajos', icon: FileText },
  ],
};
