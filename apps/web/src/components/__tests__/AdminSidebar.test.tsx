import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, rerender } from "@testing-library/react";
import React from "react";
import { AdminSidebar } from "../AdminSidebar";
import {
  SidebarProvider,
} from "@/components/ui/sidebar";

function renderSidebar(
  props: Partial<React.ComponentProps<typeof AdminSidebar>> = {}
) {
  const defaultProps = { currentTab: "courses", onTabChange: vi.fn() };
  return render(
    <SidebarProvider>
      <AdminSidebar {...defaultProps} {...props} />
    </SidebarProvider>
  );
}

describe("AdminSidebar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders all 6 group labels", () => {
    renderSidebar();

    expect(screen.getByText("Contenido y Configuración")).toBeInTheDocument();
    expect(screen.getByText("IA y Simulación")).toBeInTheDocument();
    expect(screen.getByText("Usuarios y Acceso")).toBeInTheDocument();
    expect(screen.getByText("Operaciones")).toBeInTheDocument();
    expect(screen.getByText("Análisis")).toBeInTheDocument();
    expect(screen.getByText("Organización")).toBeInTheDocument();
  });

  it("renders all 19 nav items", () => {
    renderSidebar();

    const expectedItems = [
      "Cursos",
      "Categorías",
      "Escenarios",
      "Plantillas",
      "Documentos",
      "Fichas Técnicas",
      "Prompts IA",
      "Sesiones",
      "Usuarios",
      "Roles y Permisos",
      "Grupos",
      "Solicitudes",
      "Asignaciones",
      "Calendario",
      "Reportes",
      "Estadísticas",
      "Empresas",
      "Fundación",
      "Avaladores",
    ];

    for (const label of expectedItems) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("calls onTabChange when a nav item is clicked", () => {
    const onTabChange = vi.fn();
    renderSidebar({ onTabChange });

    fireEvent.click(screen.getByText("Reportes"));

    expect(onTabChange).toHaveBeenCalledWith("reports");
  });

  it("marks the active item with data-active attribute", () => {
    renderSidebar({ currentTab: "courses" });

    const coursesButton = screen.getByText("Cursos").closest("button");
    expect(coursesButton).toHaveAttribute("data-active", "true");
  });

  it("does not mark inactive items as active", () => {
    renderSidebar({ currentTab: "courses" });

    const reportsButton = screen.getByText("Reportes").closest("button");
    expect(reportsButton).toHaveAttribute("data-active", "false");
  });

  it("shows badge when pendingCount > 0", () => {
    renderSidebar({ pendingCount: 5 });

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("does not show badge when pendingCount is 0", () => {
    renderSidebar({ pendingCount: 0 });

    // The badge should not render
    const solicitudesRow = screen.getByText("Solicitudes").closest("li");
    const badge = solicitudesRow?.querySelector("[data-sidebar='menu-badge']");
    expect(badge).toBeNull();
  });

  it("groups start expanded by default", () => {
    renderSidebar();

    // All items should be visible when groups are expanded
    expect(screen.getByText("Cursos")).toBeInTheDocument();
    expect(screen.getByText("Prompts IA")).toBeInTheDocument();
    expect(screen.getByText("Reportes")).toBeInTheDocument();
  });

  it("toggles group collapse on group header click", () => {
    renderSidebar();

    const groupHeader = screen.getByText("Análisis");
    // Items should be visible before collapse
    expect(screen.getByText("Reportes")).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(groupHeader);

    // Items should be hidden after collapse
    expect(screen.queryByText("Reportes")).not.toBeInTheDocument();
    expect(screen.queryByText("Estadísticas")).not.toBeInTheDocument();
  });

  it("expand collapsed group on second click", () => {
    renderSidebar();

    const groupHeader = screen.getByText("Análisis");

    // Collapse
    fireEvent.click(groupHeader);
    expect(screen.queryByText("Reportes")).not.toBeInTheDocument();

    // Expand
    fireEvent.click(groupHeader);
    expect(screen.getByText("Reportes")).toBeInTheDocument();
  });

  it("persists collapsed groups to localStorage", () => {
    renderSidebar();

    const groupHeader = screen.getByText("Análisis");
    fireEvent.click(groupHeader);

    const stored = JSON.parse(
      localStorage.getItem("admin-sidebar:groups") || "{}"
    );
    expect(stored.analisis).toBe(false);
  });

  it("restores collapsed state from localStorage", () => {
    localStorage.setItem(
      "admin-sidebar:groups",
      JSON.stringify({ analisis: false })
    );

    renderSidebar();

    expect(screen.queryByText("Reportes")).not.toBeInTheDocument();
    expect(screen.queryByText("Estadísticas")).not.toBeInTheDocument();
  });

  it("S6: auto-expands group when currentTab changes to item inside collapsed group", () => {
    // Start with 'analisis' group collapsed via localStorage
    localStorage.setItem(
      "admin-sidebar:groups",
      JSON.stringify({ analisis: false })
    );

    const { rerender } = render(
      <SidebarProvider>
        <AdminSidebar currentTab="courses" onTabChange={vi.fn()} />
      </SidebarProvider>
    );

    // Verify the group is collapsed — Reports item should not be visible
    expect(screen.queryByText("Reportes")).not.toBeInTheDocument();

    // Change currentTab to "reports" (inside the 'analisis' group)
    rerender(
      <SidebarProvider>
        <AdminSidebar currentTab="reports" onTabChange={vi.fn()} />
      </SidebarProvider>
    );

    // The auto-expand useEffect should have fired, expanding the 'analisis' group
    expect(screen.getByText("Reportes")).toBeInTheDocument();
    expect(screen.getByText("Estadísticas")).toBeInTheDocument();
  });
});
