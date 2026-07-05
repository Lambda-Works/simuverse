import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AdminProvider, useAdmin } from '@/lib/admin-context';

function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(AdminProvider, null, children);
  };
}

describe('admin-context', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('default state', () => {
    it('defaults to "courses" when no stored value', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper: createWrapper() });
      expect(result.current.currentTab).toBe('courses');
    });

    it('has pendingCount of 0 by default', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper: createWrapper() });
      expect(result.current.pendingCount).toBe(0);
    });
  });

  describe('setCurrentTab persists to localStorage', () => {
    it('stores the tab value', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper: createWrapper() });

      act(() => {
        result.current.setCurrentTab('roles');
      });

      expect(result.current.currentTab).toBe('roles');
      expect(localStorage.getItem('admin-sidebar:currentTab')).toBe('roles');
    });

    it('overwrites previous value', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper: createWrapper() });

      act(() => {
        result.current.setCurrentTab('roles');
      });
      act(() => {
        result.current.setCurrentTab('companies');
      });

      expect(result.current.currentTab).toBe('companies');
      expect(localStorage.getItem('admin-sidebar:currentTab')).toBe('companies');
    });
  });

  describe('localStorage roundtrip', () => {
    it('restores tab from localStorage on mount', () => {
      localStorage.setItem('admin-sidebar:currentTab', 'reports');

      const { result } = renderHook(() => useAdmin(), { wrapper: createWrapper() });
      expect(result.current.currentTab).toBe('reports');
    });

    it('defaults to courses if stored value is empty string', () => {
      localStorage.setItem('admin-sidebar:currentTab', '');

      const { result } = renderHook(() => useAdmin(), { wrapper: createWrapper() });
      // Empty string is falsy in the restore logic, so it stays at default
      expect(result.current.currentTab).toBe('courses');
    });
  });

  describe('setPendingCount', () => {
    it('updates pendingCount', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper: createWrapper() });

      act(() => {
        result.current.setPendingCount(5);
      });

      expect(result.current.pendingCount).toBe(5);
    });
  });
});
