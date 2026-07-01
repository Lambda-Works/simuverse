import { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bot,
  Users,
  ClipboardList,
  BarChart3,
  Building2,
} from "lucide-react";

export interface AdminNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface AdminNavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "contenido",
    label: "Contenido y Configuración",
    icon: BookOpen,
    items: [
      { id: "courses", label: "Cursos", icon: BookOpen },
      { id: "categories", label: "Categorías", icon: BookOpen },
      { id: "scenarios", label: "Escenarios", icon: BookOpen },
      { id: "templates", label: "Plantillas", icon: BookOpen },
      { id: "documents", label: "Documentos", icon: BookOpen },
      { id: "techsheets", label: "Fichas Técnicas", icon: BookOpen },
    ],
  },
  {
    id: "ia",
    label: "IA y Simulación",
    icon: Bot,
    items: [
      { id: "prompt-templates", label: "Prompts IA", icon: Bot },
      { id: "sessions", label: "Sesiones", icon: Bot },
    ],
  },
  {
    id: "usuarios",
    label: "Usuarios y Acceso",
    icon: Users,
    items: [
      { id: "users", label: "Usuarios", icon: Users },
      { id: "roles", label: "Roles y Permisos", icon: Users },
      { id: "groups", label: "Grupos", icon: Users },
      { id: "requests", label: "Solicitudes", icon: Users },
    ],
  },
  {
    id: "operaciones",
    label: "Operaciones",
    icon: ClipboardList,
    items: [
      { id: "assignments", label: "Asignaciones", icon: ClipboardList },
      { id: "calendar", label: "Calendario", icon: ClipboardList },
    ],
  },
  {
    id: "analisis",
    label: "Análisis",
    icon: BarChart3,
    items: [
      { id: "reports", label: "Reportes", icon: BarChart3 },
      { id: "stats", label: "Estadísticas", icon: BarChart3 },
    ],
  },
  {
    id: "organizacion",
    label: "Organización",
    icon: Building2,
    items: [
      { id: "companies", label: "Empresas", icon: Building2 },
      { id: "foundation", label: "Fundación", icon: Building2 },
      { id: "endorsers", label: "Avaladores", icon: Building2 },
    ],
  },
];
