import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { SidebarHeaderProvider, useSidebarHeader } from '@/lib/sidebar-header-context';

function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(SidebarHeaderProvider, null, children);
  };
}

describe('sidebar-header-context', () => {
  describe('default state', () => {
    it('has no backTo by default', () => {
      const { result } = renderHook(() => useSidebarHeader(), { wrapper: createWrapper() });
      expect(result.current.backTo).toBeUndefined();
    });

    it('has no backLabel by default', () => {
      const { result } = renderHook(() => useSidebarHeader(), { wrapper: createWrapper() });
      expect(result.current.backLabel).toBeUndefined();
    });
  });

  describe('setBackTo', () => {
    it('sets backTo and backLabel', () => {
      const { result } = renderHook(() => useSidebarHeader(), { wrapper: createWrapper() });

      act(() => {
        result.current.setBackTo('/legajos', 'Legajos');
      });

      expect(result.current.backTo).toBe('/legajos');
      expect(result.current.backLabel).toBe('Legajos');
    });

    it('clears backTo when called with no arguments', () => {
      const { result } = renderHook(() => useSidebarHeader(), { wrapper: createWrapper() });

      act(() => {
        result.current.setBackTo('/legajos', 'Legajos');
      });
      act(() => {
        result.current.setBackTo();
      });

      expect(result.current.backTo).toBeUndefined();
      expect(result.current.backLabel).toBeUndefined();
    });

    it('overwrites previous backTo value', () => {
      const { result } = renderHook(() => useSidebarHeader(), { wrapper: createWrapper() });

      act(() => {
        result.current.setBackTo('/legajos', 'Legajos');
      });
      act(() => {
        result.current.setBackTo('/evaluations', 'Evaluaciones');
      });

      expect(result.current.backTo).toBe('/evaluations');
      expect(result.current.backLabel).toBe('Evaluaciones');
    });
  });
});
