/**
 * AppNavbar — Barra de navegación compartida para todas las páginas
 *
 * Menú según rol:
 *   student    → solo Dashboard + logout
 *   teacher    → Dashboard · Evaluaciones · Legajos + logout
 *   admin      → Dashboard · Admin · Evaluaciones · Legajos + logout
 *   ministerio → Dashboard · Evaluaciones · Legajos + logout
 *
 * Acepta `children` para filas adicionales (ej: tabs de AdminPanel).
 */
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  Settings,
  BarChart3,
  FileText,
  LogOut,
  Shield,
  GraduationCap,
  BookOpen,
  Menu,
  ArrowLeft,
  User,
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

interface AppNavbarProps {
  /** Título que aparece junto al logo (o en lugar del logo si no hay logo) */
  title?: string;
  subtitle?: string;
  /** Si se provee, muestra un botón "← Volver" en lugar del logo */
  backTo?: string;
  backLabel?: string;
  /** Contenido extra en la zona derecha (ej: selector de filtro) */
  rightContent?: React.ReactNode;
  /** Filas adicionales renderizadas dentro del <header> (ej: tabs de AdminPanel) */
  children?: React.ReactNode;
}

// ─── Configuración por rol ────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  student:    { label: 'Estudiante',     icon: GraduationCap, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  teacher:    { label: 'Docente',        icon: BookOpen,      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  admin:      { label: 'Administrador',  icon: Settings,      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  ministerio: { label: 'Ministerio',     icon: Shield,        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
};

const NAV_ITEMS: Record<string, NavItem[]> = {
  student: [
    { label: 'Mis Cursos', to: '/dashboard', icon: Home },
  ],
  teacher: [
    { label: 'Mis Cursos',    to: '/dashboard',  icon: Home },
    { label: 'Evaluaciones',  to: '/evaluations', icon: BarChart3 },
    { label: 'Legajos',       to: '/legajos',     icon: FileText },
  ],
  admin: [
    { label: 'Mis Cursos',    to: '/dashboard',  icon: Home },
    { label: 'Admin',         to: '/admin',       icon: Settings },
    { label: 'Evaluaciones',  to: '/evaluations', icon: BarChart3 },
    { label: 'Legajos',       to: '/legajos',     icon: FileText },
  ],
  ministerio: [
    { label: 'Mis Cursos',    to: '/dashboard',  icon: Home },
    { label: 'Evaluaciones',  to: '/evaluations', icon: BarChart3 },
    { label: 'Legajos',       to: '/legajos',     icon: FileText },
  ],
};

// ─── Componente ───────────────────────────────────────────────────────────────

export const AppNavbar: React.FC<AppNavbarProps> = ({
  title,
  subtitle,
  backTo,
  backLabel = 'Volver',
  rightContent,
  children,
}) => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const role = (user?.role || 'student') as string;
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.student;
  const RoleIcon = roleConfig.icon;
  const navItems: NavItem[] = NAV_ITEMS[role] || NAV_ITEMS.student;

  // Detecta si un ítem está activo (coincidencia exacta o prefix para sub-rutas)
  const isActive = (to: string) => {
    if (to === '/dashboard') return pathname === '/dashboard';
    return pathname === to || pathname.startsWith(to + '/');
  };

  return (
    <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50">
      {/* ── Fila principal ─────────────────────────────────────────────────── */}
      <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">

        {/* Izquierda: logo / back button / título */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {backTo ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(backTo)}
              className="shrink-0 gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Button>
          ) : (
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
              aria-label="Ir al inicio"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-sm hidden sm:block">MSM</span>
            </button>
          )}

          {title && (
            <div className="min-w-0">
              <span className="font-semibold text-sm sm:text-base truncate block leading-tight">
                {title}
              </span>
              {subtitle && (
                <span className="text-xs text-muted-foreground truncate hidden sm:block leading-tight">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Centro: navegación desktop */}
        {navItems.length > 0 && (
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Button
                  key={item.to}
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => router.push(item.to)}
                  className="gap-1.5 text-sm h-8"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        )}

        {/* Derecha: badge · usuario · menú móvil · logout */}
        <div className="flex items-center gap-1.5 shrink-0">
          {rightContent}

          {/* Badge de rol (solo ícono en sm, ícono + texto en md+) */}
          <Badge
            variant="secondary"
            className={`${roleConfig.color} text-xs gap-1 hidden sm:flex items-center shrink-0`}
          >
            <RoleIcon className="w-3 h-3" />
            <span className="hidden md:inline">{roleConfig.label}</span>
          </Badge>

          {/* Nombre del usuario (solo en lg+) */}
          <span className="hidden lg:block text-sm text-muted-foreground truncate max-w-32">
            {user?.name}
          </span>

          {/* Menú hamburguesa (mobile) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden shrink-0" aria-label="Menú">
                <Menu className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Cabecera con nombre y rol */}
              <div className="px-2 py-1.5 space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <Badge variant="secondary" className={`${roleConfig.color} text-xs gap-1 w-fit mt-1`}>
                  <RoleIcon className="w-3 h-3" />
                  {roleConfig.label}
                </Badge>
              </div>
              <DropdownMenuSeparator />

              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <DropdownMenuItem
                    key={item.to}
                    onClick={() => router.push(item.to)}
                    className={active ? 'bg-accent font-medium' : ''}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOut}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logout desktop */}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            title="Cerrar sesión"
            className="hidden md:flex shrink-0 gap-1 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline text-sm">Salir</span>
          </Button>
        </div>
      </div>

      {/* ── Fila adicional (tabs, breadcrumbs, etc.) ────────────────────────── */}
      {children && (
        <div className="border-t bg-muted/30">
          {children}
        </div>
      )}
    </header>
  );
};

export default AppNavbar;
