import { describe, it, expect } from "vitest";
import { ADMIN_NAV_GROUPS } from "../admin-nav";
import type { AdminNavGroup, AdminNavItem } from "../admin-nav";

describe("admin-nav", () => {
  it("exports exactly 6 groups", () => {
    expect(ADMIN_NAV_GROUPS).toHaveLength(6);
  });

  it("exports exactly 19 nav items total across all groups", () => {
    const totalItems = ADMIN_NAV_GROUPS.reduce(
      (sum, group) => sum + group.items.length,
      0
    );
    expect(totalItems).toBe(19);
  });

  it("has group with id 'contenido' and label 'Contenido y Configuración'", () => {
    const group = ADMIN_NAV_GROUPS.find((g) => g.id === "contenido");
    expect(group).toBeDefined();
    expect(group!.label).toBe("Contenido y Configuración");
    expect(group!.items).toHaveLength(6);
  });

  it("has group with id 'ia' and label 'IA y Simulación'", () => {
    const group = ADMIN_NAV_GROUPS.find((g) => g.id === "ia");
    expect(group).toBeDefined();
    expect(group!.label).toBe("IA y Simulación");
    expect(group!.items).toHaveLength(2);
  });

  it("has group with id 'usuarios' and label 'Usuarios y Acceso'", () => {
    const group = ADMIN_NAV_GROUPS.find((g) => g.id === "usuarios");
    expect(group).toBeDefined();
    expect(group!.label).toBe("Usuarios y Acceso");
    expect(group!.items).toHaveLength(4);
  });

  it("has group with id 'operaciones' and label 'Operaciones'", () => {
    const group = ADMIN_NAV_GROUPS.find((g) => g.id === "operaciones");
    expect(group).toBeDefined();
    expect(group!.label).toBe("Operaciones");
    expect(group!.items).toHaveLength(2);
  });

  it("has group with id 'analisis' and label 'Análisis'", () => {
    const group = ADMIN_NAV_GROUPS.find((g) => g.id === "analisis");
    expect(group).toBeDefined();
    expect(group!.label).toBe("Análisis");
    expect(group!.items).toHaveLength(2);
  });

  it("has group with id 'organizacion' and label 'Organización'", () => {
    const group = ADMIN_NAV_GROUPS.find((g) => g.id === "organizacion");
    expect(group).toBeDefined();
    expect(group!.label).toBe("Organización");
    expect(group!.items).toHaveLength(3);
  });

  it("contains correct item ids for contenido group", () => {
    const group = ADMIN_NAV_GROUPS.find((g) => g.id === "contenido")!;
    const ids = group.items.map((i) => i.id);
    expect(ids).toEqual([
      "courses",
      "categories",
      "scenarios",
      "templates",
      "documents",
      "techsheets",
    ]);
  });

  it("contains correct item ids for ia group", () => {
    const group = ADMIN_NAV_GROUPS.find((g) => g.id === "ia")!;
    const ids = group.items.map((i) => i.id);
    expect(ids).toEqual(["prompt-templates", "sessions"]);
  });

  it("contains correct item ids for usuarios group", () => {
    const group = ADMIN_NAV_GROUPS.find((g) => g.id === "usuarios")!;
    const ids = group.items.map((i) => i.id);
    expect(ids).toEqual(["users", "roles", "groups", "requests"]);
  });

  it("every group has a non-empty label and a renderable icon", () => {
    for (const group of ADMIN_NAV_GROUPS) {
      expect(group.label.length).toBeGreaterThan(0);
      expect(group.icon).toBeDefined();
      // lucide-react icons are React components (forwardRef objects)
      expect(group.icon).toBeTruthy();
    }
  });

  it("every item has a non-empty id, label, and a renderable icon", () => {
    for (const group of ADMIN_NAV_GROUPS) {
      for (const item of group.items) {
        expect(item.id.length).toBeGreaterThan(0);
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.icon).toBeTruthy();
      }
    }
  });

  it("has unique item ids across all groups", () => {
    const allIds = ADMIN_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
