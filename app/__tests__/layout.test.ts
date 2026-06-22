import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const layoutPath = resolve(__dirname, '../layout.tsx')

describe('app/layout.tsx', () => {
  it('should NOT have use client directive (server component)', () => {
    const content = readFileSync(layoutPath, 'utf-8')
    expect(content.startsWith("'use client'")).toBe(false)
    expect(content.startsWith('"use client"')).toBe(false)
  })

  it('should import Metadata from next', () => {
    const content = readFileSync(layoutPath, 'utf-8')
    expect(content).toContain("import type { Metadata } from 'next'")
  })

  it('should export metadata with correct title and description', () => {
    const content = readFileSync(layoutPath, 'utf-8')
    expect(content).toContain('title: ')
    expect(content).toContain('MSM - Motor de Simulación Modular')
    expect(content).toContain('description: ')
    expect(content).toContain('SimuVerse - Plataforma de simulación educativa')
  })

  it('should export RootLayout as default export', () => {
    const content = readFileSync(layoutPath, 'utf-8')
    expect(content).toContain('export default function RootLayout')
  })

  it('should set html lang to es', () => {
    const content = readFileSync(layoutPath, 'utf-8')
    expect(content).toContain('<html lang="es">')
  })

  it('should wrap children in Providers component', () => {
    const content = readFileSync(layoutPath, 'utf-8')
    expect(content).toContain("import { Providers } from './providers'")
    expect(content).toContain('<Providers>')
    expect(content).toContain('{children}')
  })

  it('should import globals.css', () => {
    const content = readFileSync(layoutPath, 'utf-8')
    expect(content).toContain("import './globals.css'")
  })
})
