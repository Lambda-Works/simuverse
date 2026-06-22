import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const providersPath = resolve(__dirname, '../providers.tsx')

describe('app/providers.tsx', () => {
  it('should be a client component with use client directive', () => {
    const content = readFileSync(providersPath, 'utf-8')
    expect(content.startsWith("'use client'")).toBe(true)
  })

  it('should export a Providers function component', () => {
    const content = readFileSync(providersPath, 'utf-8')
    expect(content).toContain('export function Providers')
    expect(content).toContain('{ children }: { children: React.ReactNode }')
  })

  it('should compose all required providers in correct nesting order', () => {
    const content = readFileSync(providersPath, 'utf-8')
    // Outer to inner: QueryClientProvider > AuthProvider > TooltipProvider > InactivityProvider
    const queryPos = content.indexOf('QueryClientProvider')
    const authPos = content.indexOf('AuthProvider')
    const tooltipPos = content.indexOf('TooltipProvider')
    const inactivityPos = content.indexOf('InactivityProvider')
    expect(queryPos).toBeGreaterThan(0)
    expect(authPos).toBeGreaterThan(queryPos)
    expect(tooltipPos).toBeGreaterThan(authPos)
    expect(inactivityPos).toBeGreaterThan(tooltipPos)
  })

  it('should render Toaster and Sonner inside InactivityProvider', () => {
    const content = readFileSync(providersPath, 'utf-8')
    // Find the opening <InactivityProvider> and the closing </InactivityProvider>
    const openIdx = content.indexOf('<InactivityProvider>')
    const closeIdx = content.indexOf('</InactivityProvider>')
    const toasterPos = content.indexOf('<Toaster')
    const sonnerPos = content.indexOf('<Sonner')
    // Both toasters must be between opening and closing tags
    expect(toasterPos).toBeGreaterThan(openIdx)
    expect(toasterPos).toBeLessThan(closeIdx)
    expect(sonnerPos).toBeGreaterThan(openIdx)
    expect(sonnerPos).toBeLessThan(closeIdx)
  })

  it('should import QueryClient from @tanstack/react-query with useState pattern', () => {
    const content = readFileSync(providersPath, 'utf-8')
    expect(content).toContain('import { QueryClient, QueryClientProvider }')
    expect(content).toContain("'@tanstack/react-query'")
    expect(content).toContain('useState(() => new QueryClient())')
  })
})
