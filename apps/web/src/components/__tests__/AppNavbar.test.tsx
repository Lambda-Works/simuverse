import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AppNavbar } from "../AppNavbar";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { name: "Test Admin", role: "admin" },
    signOut: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin",
}));

describe("AppNavbar showChildren prop", () => {
  it("renders children when showChildren is true (default)", () => {
    render(
      <AppNavbar title="Test">
        <div data-testid="tab-row">Tab Row</div>
      </AppNavbar>
    );
    expect(screen.getByTestId("tab-row")).toBeInTheDocument();
    expect(screen.getByText("Tab Row")).toBeInTheDocument();
  });

  it("renders children when showChildren is explicitly true", () => {
    render(
      <AppNavbar title="Test" showChildren={true}>
        <div data-testid="tab-row">Tab Row</div>
      </AppNavbar>
    );
    expect(screen.getByTestId("tab-row")).toBeInTheDocument();
  });

  it("does not render children when showChildren is false", () => {
    render(
      <AppNavbar title="Test" showChildren={false}>
        <div data-testid="tab-row">Tab Row</div>
      </AppNavbar>
    );
    expect(screen.queryByTestId("tab-row")).not.toBeInTheDocument();
  });

  it("always renders title regardless of showChildren", () => {
    const { rerender } = render(
      <AppNavbar title="Admin Panel" showChildren={false}>
        <div data-testid="tab-row">Tab Row</div>
      </AppNavbar>
    );
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();

    rerender(
      <AppNavbar title="Admin Panel" showChildren={true}>
        <div data-testid="tab-row">Tab Row</div>
      </AppNavbar>
    );
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });
});
