import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { AdminProvider } from "@/lib/admin-context";
import AdminPanel from "@/views/AdminPanel";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "1", name: "Admin", role: "admin" },
    hasRole: () => true,
    loading: false,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin",
}));

vi.mock("@/services/ApiClient", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: { message: "ok" } }),
  },
}));

vi.mock("@/lib/api", () => ({
  API_BASE: "http://localhost:5001/api",
}));

vi.stubGlobal(
  "fetch",
  vi.fn().mockResolvedValue({
    json: () => Promise.resolve([]),
    ok: true,
  })
);

describe("AdminPanel approval (preserved behavior)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders courses tab content by default", async () => {
    render(
      <AdminProvider>
        <AdminPanel />
      </AdminProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Gestión de Cursos")).toBeInTheDocument();
    });
  });

  it("renders the subtitle for courses tab", async () => {
    render(
      <AdminProvider>
        <AdminPanel />
      </AdminProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText("Crea, edita y configura los cursos disponibles")
      ).toBeInTheDocument();
    });
  });
});
