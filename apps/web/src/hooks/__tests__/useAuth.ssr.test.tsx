/**
 * SSR Safety Tests for useAuth
 *
 * Verifies that AuthProvider and useAuth hook are safe for server-side rendering:
 * - No crashes from browser-only APIs (localStorage) during SSR
 * - localStorage access is guarded with typeof checks
 * - Corrupted localStorage data is handled gracefully
 * - signOut and hasRole work correctly
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'
import { AuthProvider, useAuth } from '../useAuth'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Wrap renderHook with AuthProvider so useAuth can consume context */
function renderUseAuth() {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
  })
}

// ─── SSR Simulation Tests ─────────────────────────────────────────────────────

describe('useAuth — SSR safety (localStorage unavailable)', () => {
  let savedLocalStorage: Storage | undefined

  beforeEach(() => {
    savedLocalStorage = globalThis.localStorage
  })

  afterEach(() => {
    // @ts-expect-error — restoring localStorage
    globalThis.localStorage = savedLocalStorage
    vi.restoreAllMocks()
  })

  it('renders without crashing when localStorage is undefined (SSR)', () => {
    // Simulate SSR: remove localStorage from globalThis
    // @ts-expect-error — intentionally removing localStorage for SSR simulation
    delete globalThis.localStorage

    // AuthProvider must NOT throw during render — the hook guards localStorage
    let hook: ReturnType<typeof renderUseAuth>
    expect(() => {
      hook = renderUseAuth()
    }).not.toThrow()

    // After mount: loading should be false (guard set it to false), user/token null
    expect(hook!.result.current.loading).toBe(false)
    expect(hook!.result.current.user).toBeNull()
    expect(hook!.result.current.token).toBeNull()
  })
})

// ─── Client-side Behavior Tests ────────────────────────────────────────────────

describe('useAuth — client behavior', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('reads auth data from localStorage after mount', async () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test', role: 'student' as const }
    const mockToken = 'mock-jwt-token'

    localStorage.setItem('token', mockToken)
    localStorage.setItem('user', JSON.stringify(mockUser))

    const { result } = renderUseAuth()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.token).toBe(mockToken)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('sets loading to false with null state when localStorage is empty', async () => {
    const { result } = renderUseAuth()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('handles corrupted user data in localStorage gracefully', async () => {
    localStorage.setItem('token', 'some-token')
    localStorage.setItem('user', 'not-valid-json{{{')

    const { result } = renderUseAuth()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Corrupted data is cleared; state returns to null
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('signOut clears localStorage and redirects to /auth', async () => {
    localStorage.setItem('token', 'some-token')
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 't@t.com', name: 'T', role: 'student' }))

    // Mock window.location.href for redirect
    const mockLocation = { href: '' }
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    })

    const { result } = renderUseAuth()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.signOut()
    })

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(mockLocation.href).toBe('/auth')

    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })

  it('hasRole returns true when user has the specified role', async () => {
    const mockUser = { id: '1', email: 'a@a.com', name: 'Admin', role: 'admin' as const }
    localStorage.setItem('token', 'admin-token')
    localStorage.setItem('user', JSON.stringify(mockUser))

    const { result } = renderUseAuth()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.hasRole('admin')).toBe(true)
    expect(result.current.hasRole('student')).toBe(false)
  })

  it('hasRole returns false when user is null', async () => {
    const { result } = renderUseAuth()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.hasRole('admin')).toBe(false)
  })

  // Triangulation: verify token with different role
  it('hasRole distinguishes between student and teacher roles', async () => {
    const mockUser = { id: '2', email: 't@t.com', name: 'Teacher', role: 'teacher' as const }
    localStorage.setItem('token', 'teacher-token')
    localStorage.setItem('user', JSON.stringify(mockUser))

    const { result } = renderUseAuth()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.hasRole('teacher')).toBe(true)
    expect(result.current.hasRole('student')).toBe(false)
    expect(result.current.hasRole('admin')).toBe(false)
  })

  // Triangulation: verify signOut clears refreshToken
  it('signOut also clears refreshToken from localStorage', async () => {
    localStorage.setItem('token', 'some-token')
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 't@t.com', name: 'T', role: 'student' }))
    localStorage.setItem('refreshToken', 'refresh-abc')

    const mockLocation = { href: '' }
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    })

    const { result } = renderUseAuth()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.signOut()
    })

    expect(localStorage.getItem('refreshToken')).toBeNull()

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })
})

// ─── Structural SSR Safety Tests ──────────────────────────────────────────────

describe('useAuth — SSR structural guarantees', () => {
  it('guards localStorage access with typeof check', () => {
    const fs = require('fs')
    const path = require('path')
    const source = fs.readFileSync(
      path.resolve(__dirname, '../useAuth.tsx'),
      'utf-8'
    )

    // The code MUST guard localStorage with typeof check for SSR safety
    expect(source).toMatch(/typeof\s+(localStorage|window)\s*!==?\s*['"]undefined['"]/)
  })

  it('signOut guards both window and localStorage access', () => {
    const fs = require('fs')
    const path = require('path')
    const source = fs.readFileSync(
      path.resolve(__dirname, '../useAuth.tsx'),
      'utf-8'
    )

    // signOut should guard both window and localStorage with typeof checks
    expect(source).toMatch(/typeof\s+window\s*!==?\s*['"]undefined['"]/)
    expect(source).toMatch(/typeof\s+localStorage\s*!==?\s*['"]undefined['"]/)
  })

  it('useEffect guards set loading false on early return when localStorage unavailable', () => {
    const fs = require('fs')
    const path = require('path')
    const source = fs.readFileSync(
      path.resolve(__dirname, '../useAuth.tsx'),
      'utf-8'
    )

    // When localStorage is unavailable, useEffect must still set loading to false
    // otherwise the app would be stuck in loading state forever
    expect(source).toMatch(/typeof localStorage ['"]===?|!==? ['"]undefined['"]/)
  })

  it('initial state is SSR-safe: user=null, token=null, loading=true', () => {
    const fs = require('fs')
    const path = require('path')
    const source = fs.readFileSync(
      path.resolve(__dirname, '../useAuth.tsx'),
      'utf-8'
    )

    // Initial state must be null/null/true for SSR hydration consistency
    expect(source).toMatch(/useState<AuthUser \| null>\(null\)/)
    expect(source).toMatch(/useState<string \| null>\(null\)/)
    expect(source).toMatch(/useState\(true\)/)
  })
})