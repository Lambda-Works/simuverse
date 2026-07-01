import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import AdminLayout from "../layout";

describe("AdminLayout", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders children inside the layout", () => {
    render(
      <AdminLayout>
        <div data-testid="page-content">Admin Page Content</div>
      </AdminLayout>
    );
    expect(screen.getByTestId("page-content")).toBeInTheDocument();
    expect(screen.getByText("Admin Page Content")).toBeInTheDocument();
  });

  it("renders AdminSidebar with all 6 group labels", () => {
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );
    expect(screen.getByText("Contenido y Configuración")).toBeInTheDocument();
    expect(screen.getByText("IA y Simulación")).toBeInTheDocument();
    expect(screen.getByText("Usuarios y Acceso")).toBeInTheDocument();
    expect(screen.getByText("Operaciones")).toBeInTheDocument();
    expect(screen.getByText("Análisis")).toBeInTheDocument();
    expect(screen.getByText("Organización")).toBeInTheDocument();
  });

  it("renders all 19 nav items through the sidebar", () => {
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );
    const expectedItems = [
      "Cursos", "Categorías", "Escenarios", "Plantillas",
      "Documentos", "Fichas Técnicas", "Prompts IA", "Sesiones",
      "Usuarios", "Roles y Permisos", "Grupos", "Solicitudes",
      "Asignaciones", "Calendario", "Reportes", "Estadísticas",
      "Empresas", "Fundación", "Avaladores",
    ];
    for (const label of expectedItems) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
