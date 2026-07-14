import {
    ArrowRightLeft, BookOpen,
    Bot, BotMessageSquare, Building, Building2, CalendarDays, ChartBar, ChartNoAxesCombined, Clapperboard, ClipboardList, FileChartColumnIncreasing, FilePlus, GraduationCap, HandHeart, LayoutTemplate, LucideIcon, Play, ShieldCheck, Tags, UserCheck, UserRound, UserRoundPlus, Users, Users2, Wrench
} from 'lucide-react';

export interface AdminNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  excludeRoles?: string[];
}

export interface AdminNavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: AdminNavItem[];
  excludeRoles?: string[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'contenido',
    label: 'Contenido y Configuración',
    icon: BookOpen,
    items: [
      { id: 'courses', label: 'Cursos', icon: GraduationCap },
      { id: 'categories', label: 'Categorías', icon: Tags },
      { id: 'scenarios', label: 'Escenarios', icon: Clapperboard },
      { id: 'practices', label: 'Prácticas', icon: Play },
      { id: 'templates', label: 'Plantillas', icon: LayoutTemplate },
      { id: 'documents', label: 'Documentos', icon: FilePlus },
      { id: 'techsheets', label: 'Fichas Técnicas', icon: ClipboardList },
    ],
  },
  {
    id: 'ia',
    label: 'IA y Simulación',
    icon: Bot,
    items: [
      { id: 'prompt-templates', label: 'Prompts IA', icon: BotMessageSquare },
      { id: 'sessions', label: 'Sesiones', icon: Play },
    ],
  },
  {
    id: 'usuarios',
    label: 'Usuarios y Acceso',
    icon: Users,
    items: [
      { id: 'users', label: 'Usuarios', icon: UserRound },
      { id: 'roles', label: 'Roles y Permisos', icon: ShieldCheck, excludeRoles: ['ministerio'] },
      { id: 'groups', label: 'Grupos', icon: Users2 },
      { id: 'requests', label: 'Solicitudes', icon: UserRoundPlus, excludeRoles: ['ministerio'] },
    ],
  },
  {
    id: 'operaciones',
    label: 'Operaciones',
    icon: Wrench,
    excludeRoles: ['ministerio'],
    items: [
      { id: 'assignments', label: 'Asignaciones', icon: ArrowRightLeft },
      { id: 'calendar', label: 'Calendario', icon: CalendarDays },
    ],
  },
  {
    id: 'analisis',
    label: 'Análisis',
    icon: ChartNoAxesCombined,
    items: [
      { id: 'reports', label: 'Reportes', icon: FileChartColumnIncreasing },
      { id: 'stats', label: 'Estadísticas', icon: ChartBar },
    ],
  },
  {
    id: 'organizacion',
    label: 'Organización',
    icon: Building2,
    items: [
      { id: 'companies', label: 'Empresas', icon: Building },
      { id: 'foundation', label: 'Fundación', icon: HandHeart },
      { id: 'endorsers', label: 'Avaladores', icon: UserCheck },
    ],
  },
];
