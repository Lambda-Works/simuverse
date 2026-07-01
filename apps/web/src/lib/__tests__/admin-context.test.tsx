import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { AdminProvider, useAdmin } from "../admin-context";

function renderUseAdmin() {
  return renderHook(() => useAdmin(), {
    wrapper: ({ children }) => <AdminProvider>{children}</AdminProvider>,
  });
}

describe("AdminContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("provides default currentTab as 'courses'", () => {
    const { result } = renderUseAdmin();
    expect(result.current.currentTab).toBe("courses");
  });

  it("provides default pendingCount as 0", () => {
    const { result } = renderUseAdmin();
    expect(result.current.pendingCount).toBe(0);
  });

  it("updates currentTab via setCurrentTab", () => {
    const { result } = renderUseAdmin();

    act(() => {
      result.current.setCurrentTab("reports");
    });

    expect(result.current.currentTab).toBe("reports");
  });

  it("updates pendingCount via setPendingCount", () => {
    const { result } = renderUseAdmin();

    act(() => {
      result.current.setPendingCount(5);
    });

    expect(result.current.pendingCount).toBe(5);
  });

  it("persists currentTab to localStorage", () => {
    const { result } = renderUseAdmin();

    act(() => {
      result.current.setCurrentTab("companies");
    });

    expect(localStorage.getItem("admin-sidebar:currentTab")).toBe("companies");
  });

  it("restores currentTab from localStorage on mount", () => {
    localStorage.setItem("admin-sidebar:currentTab", "roles");

    const { result } = renderUseAdmin();
    expect(result.current.currentTab).toBe("roles");
  });

  it("throws when useAdmin is used outside AdminProvider", () => {
    // Suppress React console.error for expected error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAdmin());
    }).toThrow("useAdmin must be used within AdminProvider");

    spy.mockRestore();
  });
});
