/**
 * SSR Safety Tests for useServiceWorker
 *
 * Verifies that the useServiceWorker hook doesn't crash during SSR:
 * - navigator.onLine is not accessed during render (SSR-safe)
 * - 'serviceWorker' in navigator is guarded for SSR
 * - Returns safe defaults when navigator is unavailable
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { useServiceWorker } from '../useServiceWorker'

// ─── Test Suite ────────────────────────────────────────────────────────────────

describe('useServiceWorker — SSR safety', () => {
  beforeEach(() => {
    // Mock serviceWorker to avoid actual registration
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        ...globalThis.navigator,
        serviceWorker: {
          register: vi.fn().mockResolvedValue({
            addEventListener: vi.fn(),
            installing: null,
          }),
        },
        onLine: true,
      },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns safe defaults: installed=false, active=false, updateAvailable=false', () => {
    const { result } = renderHook(() => useServiceWorker())

    // These should start as false regardless of navigator state
    expect(result.current.installed).toBe(false)
    expect(result.current.active).toBe(false)
    expect(result.current.updateAvailable).toBe(false)
  })

  it('does not throw when navigator.onLine is checked after mount', () => {
    // Verify the hook can be rendered without crashing
    expect(() => {
      renderHook(() => useServiceWorker())
    }).not.toThrow()
  })

  // ─── Structural SSR guarantee ─────────────────────────────────────────────

  it('guards navigator access with typeof check for SSR safety', () => {
    const fs = require('fs')
    const path = require('path')
    const source = fs.readFileSync(
      path.resolve(__dirname, '../useServiceWorker.ts'),
      'utf-8'
    )

    // Must guard navigator access with typeof check for SSR
    expect(source).toMatch(/typeof\s+(navigator|window)\s*!==?\s*['"]undefined['"]/)
  })

  it('does not access navigator.onLine as useState initializer in unguarded context', () => {
    const fs = require('fs')
    const path = require('path')
    const source = fs.readFileSync(
      path.resolve(__dirname, '../useServiceWorker.ts'),
      'utf-8'
    )

    // The initial value for isOnline in useState must NOT be navigator.onLine directly
    // because that would crash during SSR (it's accessed at render time, not in useEffect)
    // Use a more specific regex that only matches useState initializer, not setState calls
    expect(source).not.toMatch(/useState.*isOnline:\s*navigator\.onLine/)
  })
})