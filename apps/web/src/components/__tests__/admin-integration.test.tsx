import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminProvider, useAdmin } from "@/lib/admin-context";
import { AdminSidebar } from "../AdminSidebar";

/** Mirrors the wiring in app/admin/layout.tsx */
function AdminSidebarFromContext() {
  const { currentTab, setCurrentTab, pendingCount } = useAdmin();
  return (
    <AdminSidebar
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      pendingCount={pendingCount}
    />
  );
}

/** Displays the current tab from context — proves wiring works */
function CurrentTabDisplay() {
  const { currentTab } = useAdmin();
  return <div data-testid="current-tab">{currentTab}</div>;
}

function renderAdminFlow() {
  return render(
    <AdminProvider>
      <SidebarProvider>
        <AdminSidebarFromContext />
        <CurrentTabDisplay />
      </SidebarProvider>
    </AdminProvider>
  );
}

describe("Admin Integration — sidebar → context wiring", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("clicking a sidebar item changes the currentTab in context", () => {
    renderAdminFlow();

    // Default tab is "courses"
    expect(screen.getByTestId("current-tab")).toHaveTextContent("courses");

    // Click "Reportes" sidebar item
    fireEvent.click(screen.getByText("Reportes"));

    // Tab should change to "reports"
    expect(screen.getByTestId("current-tab")).toHaveTextContent("reports");
  });

  it("clicking different items updates tab each time", () => {
    renderAdminFlow();

    fireEvent.click(screen.getByText("Usuarios"));
    expect(screen.getByTestId("current-tab")).toHaveTextContent("users");

    fireEvent.click(screen.getByText("Calendario"));
    expect(screen.getByTestId("current-tab")).toHaveTextContent("calendar");

    fireEvent.click(screen.getByText("Empresas"));
    expect(screen.getByTestId("current-tab")).toHaveTextContent("companies");
  });

  it("active item reflects the current tab", () => {
    renderAdminFlow();

    // Default: courses is active
    const coursesButton = screen.getByText("Cursos").closest("button");
    expect(coursesButton).toHaveAttribute("data-active", "true");

    // Click Reportes
    fireEvent.click(screen.getByText("Reportes"));

    const reportsButton = screen.getByText("Reportes").closest("button");
    expect(reportsButton).toHaveAttribute("data-active", "true");

    // Courses should no longer be active
    expect(coursesButton).toHaveAttribute("data-active", "false");
  });
});

describe("Admin Integration — collapse persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("collapse state persists to localStorage", () => {
    renderAdminFlow();

    // Click "Análisis" group header to collapse
    fireEvent.click(screen.getByText("Análisis"));

    // Items should be hidden
    expect(screen.queryByText("Reportes")).not.toBeInTheDocument();
    expect(screen.queryByText("Estadísticas")).not.toBeInTheDocument();

    // localStorage should reflect the collapsed state
    const stored = JSON.parse(
      localStorage.getItem("admin-sidebar:groups") || "{}"
    );
    expect(stored.analisis).toBe(false);
  });

  it("collapse state restores from localStorage", () => {
    // Pre-set collapsed state
    localStorage.setItem(
      "admin-sidebar:groups",
      JSON.stringify({ analisis: false, ia: false })
    );

    renderAdminFlow();

    // "Análisis" group items should be hidden
    expect(screen.queryByText("Reportes")).not.toBeInTheDocument();
    expect(screen.queryByText("Estadísticas")).not.toBeInTheDocument();

    // "IA y Simulación" group items should be hidden
    expect(screen.queryByText("Prompts IA")).not.toBeInTheDocument();
    expect(screen.queryByText("Sesiones")).not.toBeInTheDocument();

    // Other groups should be expanded (default)
    expect(screen.getByText("Cursos")).toBeInTheDocument();
    expect(screen.getByText("Usuarios")).toBeInTheDocument();
  });
});

describe("Admin Integration — badge behavior", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("badge hidden when pendingCount is 0", () => {
    renderAdminFlow();

    const solicitudesItem = screen.getByText("Solicitudes").closest("li");
    const badge = solicitudesItem?.querySelector(
      "[data-sidebar='menu-badge']"
    );
    expect(badge).toBeNull();
  });

  it("badge visible when pendingCount > 0", () => {
    function AdminSidebarWithPending() {
      const { currentTab, setCurrentTab } = useAdmin();
      return (
        <AdminSidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          pendingCount={7}
        />
      );
    }

    render(
      <AdminProvider>
        <SidebarProvider>
          <AdminSidebarWithPending />
        </SidebarProvider>
      </AdminProvider>
    );

    expect(screen.getByText("7")).toBeInTheDocument();
  });
});
