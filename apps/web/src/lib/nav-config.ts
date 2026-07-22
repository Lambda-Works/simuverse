import { FileText, Home, MessageSquare, LucideIcon } from 'lucide-react';

export type AppRole = 'student' | 'teacher' | 'admin' | 'ministerio';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const ROLE_NAV: Record<AppRole, NavItem[]> = {
  student: [
    { label: 'Mis Cursos', href: '/estudiante/cursos', icon: Home },
  ],
  teacher: [
    { label: 'Mis Cursos', href: '/profesor/cursos', icon: Home },
    { label: 'Sesiones (general)', href: '/profesor/sesiones', icon: MessageSquare },
    { label: 'Legajos', href: '/profesor/legajos', icon: FileText },
  ],
  admin: [
    { label: 'Mis Cursos', href: '/admin/mis-cursos', icon: Home },
    { label: 'Sesiones (general)', href: '/admin/sesiones', icon: MessageSquare },
    { label: 'Legajos', href: '/admin/legajos', icon: FileText },
  ],
  ministerio: [
    { label: 'Ministerio', href: '/ministerio', icon: Home },
    { label: 'Legajos', href: '/ministerio/legajos', icon: FileText },
  ],
};
