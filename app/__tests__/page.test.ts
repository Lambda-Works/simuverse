import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const pagePath = resolve(__dirname, '../page.tsx')

describe('app/page.tsx', () => {
  it('should be a client component with use client directive', () => {
    const content = readFileSync(pagePath, 'utf-8')
    expect(content.startsWith("'use client'")).toBe(true)
  })

  it('should import Index from @/pages/Index', () => {
    const content = readFileSync(pagePath, 'utf-8')
    expect(content).toContain("import Index from '@/views/Index'")
  })

  it('should export default function HomePage that renders Index', () => {
    const content = readFileSync(pagePath, 'utf-8')
    expect(content).toContain('export default function HomePage')
    expect(content).toContain('<Index />')
  })
})